import Form from '../models/Form.js';
import Response from '../models/Response.js';
import User from '../models/User.js';
import AccessRequest from '../models/AccessRequest.js';
import FormPayment from '../models/FormPayment.js';
import { sendEmail } from '../utils/sendEmail.js';
import jwt from 'jsonwebtoken';

// Helper to generate unique tracked amount for form payments
async function generateUniqueFormPaymentAmount(formId, baseAmount, mode = 'SUB_OFFSET') {
  const base = Math.floor(baseAmount);
  const now = new Date();

  // Find active pending payments for this form & base amount
  const activePayments = await FormPayment.find({
    formId,
    baseAmount: base,
    status: 'PENDING',
    expiresAt: { $gt: now }
  });

  const activeOffsets = new Set();
  activePayments.forEach((p) => {
    let offset = 0;
    if (mode === 'SUB_OFFSET') {
      // Sub-offset range e.g. 99.01 - 99.99 for 100
      offset = Math.round((p.exactAmount - (base - 1)) * 100);
    } else {
      // Add-offset range e.g. 100.01 - 100.99 for 100
      offset = Math.round((p.exactAmount - base) * 100);
    }
    if (offset > 0 && offset < 100) activeOffsets.add(offset);
  });

  let candidateOffset = Math.floor(Math.random() * 99) + 1;
  let attempts = 0;
  while (activeOffsets.has(candidateOffset) && attempts < 99) {
    candidateOffset = (candidateOffset % 99) + 1;
    attempts++;
  }

  let finalAmount = 0;
  if (mode === 'SUB_OFFSET') {
    finalAmount = (base - 1) + (candidateOffset / 100);
  } else {
    finalAmount = base + (candidateOffset / 100);
  }

  return Number(finalAmount.toFixed(2));
}

// ---------------- PAYMENT API CONTROLLERS ----------------

export const initiateFormPayment = async (req, res) => {
  try {
    const { id: formId } = req.params;
    const form = await Form.findById(formId);

    if (!form) return res.status(404).json({ message: 'Form not found' });
    if (!form.settings.paymentRequired) {
      return res.status(400).json({ message: 'Payment is not required for this form.' });
    }

    const baseAmount = form.settings.paymentAmount || 0;
    if (baseAmount <= 0) {
      return res.status(400).json({ message: 'Invalid form payment amount configured.' });
    }

    const upiId = (form.settings.merchantUpiId || '7903565147@ybl').trim();
    const upiName = (form.settings.merchantName || 'EMR Payment Services').trim();
    const offsetMode = form.settings.paymentOffsetMode || 'SUB_OFFSET';

    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderId = `F-ORD-${timestamp}-${randomHex}`;
    const txnRef = `TXN${timestamp}${Math.floor(Math.random() * 1000)}`;

    const exactAmount = await generateUniqueFormPaymentAmount(formId, baseAmount, offsetMode);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${exactAmount.toFixed(2)}&tr=${txnRef}&tn=${encodeURIComponent('Order ' + orderId)}&cu=INR`;

    const payment = new FormPayment({
      formId,
      orderId,
      txnRef,
      baseAmount,
      exactAmount,
      merchantUpiId: upiId,
      merchantName: upiName,
      status: 'PENDING',
      upiUrl,
      expiresAt
    });

    await payment.save();

    res.status(201).json({
      success: true,
      orderId,
      txnRef,
      baseAmount,
      exactAmount,
      merchantUpiId: upiId,
      merchantName: upiName,
      upiUrl,
      expiresAt,
      instruction: form.settings.paymentInstruction || 'Scan the QR code or tap an app below to complete payment.'
    });
  } catch (error) {
    console.error('Error initiating form payment:', error);
    res.status(500).json({ message: 'Server error initiating payment' });
  }
};

export const checkFormPaymentStatus = async (req, res) => {
  try {
    const { id: formId, orderId } = req.params;
    const payment = await FormPayment.findOne({ formId, orderId });

    if (!payment) {
      return res.status(404).json({ message: 'Payment order not found' });
    }

    if (payment.status === 'PENDING' && new Date() > new Date(payment.expiresAt)) {
      payment.status = 'EXPIRED';
      await payment.save();
    }

    res.json({
      success: true,
      orderId: payment.orderId,
      status: payment.status,
      exactAmount: payment.exactAmount,
      baseAmount: payment.baseAmount,
      paymentDetails: payment
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ message: 'Server error checking payment status' });
  }
};

// Webhook for Payhook notifications
export const processPayhookWebhook = async (req, res) => {
  try {
    const { title, text, timestamp } = req.body;
    console.log('宿 EMR Payhook Webhook Received:', { title, text, timestamp });

    const fullContent = `${title || ''} ${text || ''}`;

    // Extract numerical amounts from notification text
    const foundAmounts = [];
    const decimalRegex = /(?:₹|Rs\.?|INR)?\s*([\d]+\.[\d]{1,2})/gi;
    let m;
    while ((m = decimalRegex.exec(fullContent)) !== null) {
      const val = parseFloat(m[1]);
      if (!isNaN(val) && val > 0 && !foundAmounts.includes(val)) {
        foundAmounts.push(val);
      }
    }
    const integerRegex = /(?:Received|Paid|Deposited|Credited|₹|Rs\.?|INR)\s*([\d]+)/gi;
    while ((m = integerRegex.exec(fullContent)) !== null) {
      const val = parseFloat(m[1]);
      if (!isNaN(val) && val > 0 && !foundAmounts.includes(val)) {
        foundAmounts.push(val);
      }
    }

    if (foundAmounts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Could not extract any numerical payment amount from Payhook notification payload'
      });
    }

    console.log('🔍 Extracted Payment Amounts from Payhook:', foundAmounts);

    let matchingPayment = null;
    let matchedAmount = null;
    const now = new Date();

    for (const amt of foundAmounts) {
      const targetAmount = Number(Number(amt).toFixed(2));
      const baseInteger = Math.floor(targetAmount);

      // 1. Exact Amount Match in FormPayment
      matchingPayment = await FormPayment.findOne({
        exactAmount: { $gte: targetAmount - 0.005, $lte: targetAmount + 0.005 },
        status: 'PENDING',
        expiresAt: { $gt: now }
      }).sort({ createdAt: -1 });

      if (matchingPayment) {
        matchedAmount = amt;
        break;
      }

      // 2. Base Integer Match in FormPayment
      matchingPayment = await FormPayment.findOne({
        baseAmount: baseInteger,
        status: 'PENDING',
        expiresAt: { $gt: now }
      }).sort({ createdAt: -1 });

      if (matchingPayment) {
        matchedAmount = amt;
        break;
      }
    }

    if (!matchingPayment) {
      console.warn(`⚠️ No active PENDING FormPayment found matching amounts: ${foundAmounts.join(', ')}`);
      return res.status(404).json({
        success: false,
        message: `No active PENDING payment session found matching amount(s): ₹${foundAmounts.join(', ₹')}`,
        foundAmounts
      });
    }

    // Update FormPayment to SUCCESS
    matchingPayment.status = 'SUCCESS';
    await matchingPayment.save();

    // Also update Response if response exists
    await Response.updateMany(
      { 'paymentDetails.orderId': matchingPayment.orderId },
      { $set: { paymentStatus: 'SUCCESS', 'paymentDetails.paidAt': new Date() } }
    );

    console.log(`🎉 Payment Successful for Form Payment Order ID: ${matchingPayment.orderId}`);

    return res.json({
      success: true,
      message: 'Payment verified and status updated to SUCCESS',
      orderId: matchingPayment.orderId,
      matchedAmount,
      payment: matchingPayment
    });
  } catch (error) {
    console.error('Error processing Payhook webhook:', error);
    res.status(500).json({ success: false, error: 'Failed to process webhook' });
  }
};

// Admin approve/update response payment status
export const updateResponsePaymentStatus = async (req, res) => {
  try {
    const { id: responseId } = req.params;
    const { status } = req.body; // 'SUCCESS' or 'FAILED' or 'PENDING_VERIFICATION'

    const response = await Response.findById(responseId);
    if (!response) return res.status(404).json({ message: 'Response not found' });

    response.paymentStatus = status;
    if (status === 'SUCCESS') {
      response.paymentDetails = response.paymentDetails || {};
      response.paymentDetails.paidAt = new Date();
    }
    await response.save();

    if (response.paymentDetails?.orderId) {
      await FormPayment.findOneAndUpdate(
        { orderId: response.paymentDetails.orderId },
        { status }
      );
    }

    res.json({ success: true, message: `Payment status updated to ${status}`, response });
  } catch (error) {
    console.error('Error updating response payment status:', error);
    res.status(500).json({ message: 'Server error updating payment status' });
  }
};

export const submitFormManualPaymentProof = async (req, res) => {
  try {
    const { id: formId } = req.params;
    const { orderId, screenshotUrl, transactionId, phoneNumber, answers, respondentEmail, requestCopy } = req.body;

    const form = await Form.findById(formId);
    if (!form) return res.status(404).json({ message: 'Form not found' });

    let payment = await FormPayment.findOne({ formId, orderId });
    if (payment) {
      payment.status = 'PENDING_VERIFICATION';
      payment.manualProof = {
        screenshotUrl: screenshotUrl || '',
        transactionId: transactionId || '',
        phoneNumber: phoneNumber || '',
        submittedAt: new Date()
      };
      await payment.save();
    }

    // Determine respondent email
    let targetEmail = respondentEmail || '';
    const token = req.cookies?.token || req.headers?.authorization;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user) targetEmail = user.email;
      } catch (e) {}
    }

    // Process answers & scores
    const allQuestions = form.sections.flatMap((s) => s.elements);
    const questionMap = new Map(allQuestions.map((q) => [q.id, q]));

    const newResponse = new Response({
      formId,
      userId: req.user ? req.user.id : null,
      answers,
      respondentEmail: form.settings.collectEmails !== 'DO_NOT_COLLECT' ? targetEmail : null,
      paymentStatus: 'PENDING_VERIFICATION',
      paymentDetails: {
        orderId: orderId || '',
        txnRef: payment ? payment.txnRef : '',
        baseAmount: payment ? payment.baseAmount : form.settings.paymentAmount,
        exactAmount: payment ? payment.exactAmount : form.settings.paymentAmount,
        screenshotUrl: screenshotUrl || '',
        transactionId: transactionId || '',
        phoneNumber: phoneNumber || '',
        paidAt: new Date()
      }
    });

    await newResponse.save();

    res.status(201).json({
      success: true,
      message: form.settings.confirmationMessage || 'Your response and payment proof have been submitted for verification.',
      paymentStatus: 'PENDING_VERIFICATION'
    });
  } catch (error) {
    console.error('Error submitting manual payment proof:', error);
    res.status(500).json({ message: 'Server error submitting manual payment proof' });
  }
};

export const submitFormResponse = async (req, res) => {
  try {
    const { id: formId } = req.params;
    const { answers, respondentEmail, requestCopy, paymentOrderId } = req.body;

    const form = await Form.findById(formId);
    if (!form) return res.status(404).json({ message: "Form not found" });

    if (!form.settings.acceptingResponses) {
      return res.status(403).json({ message: "This form is no longer accepting responses." });
    }
    const token = req.cookies.token;
    let targetEmail = '';
    if (!token){
      if(respondentEmail){
        targetEmail = respondentEmail;
      }
    } else {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password -otp -collegeOtp');
        if(user){
          targetEmail = user.email;
        }
      }
    if (form.settings.limitToOneResponse && targetEmail) {
      const existing = await Response.findOne({ formId, respondentEmail: targetEmail });
      if (existing) return res.status(403).json({ message: "You have already submitted a response." });
    }

    // Payment verification check
    let paymentStatus = 'NOT_REQUIRED';
    let paymentDetailsPayload = {};

    if (form.settings.paymentRequired) {
      if (paymentOrderId) {
        const paymentDoc = await FormPayment.findOne({ formId, orderId: paymentOrderId });
        if (paymentDoc) {
          paymentStatus = paymentDoc.status;
          paymentDetailsPayload = {
            orderId: paymentDoc.orderId,
            txnRef: paymentDoc.txnRef,
            baseAmount: paymentDoc.baseAmount,
            exactAmount: paymentDoc.exactAmount,
            paidAt: new Date()
          };
        }
      }
    }

    let totalScore = 0;
    let maxScore = 0;
    const allQuestions = form.sections.flatMap(s => s.elements);
    const gradedQuestions = allQuestions.filter(el => el.isGraded);
    const questionMap = new Map(allQuestions.map(q => [q.id, q]));

    let scoredAnswers = answers;

    if (form.settings.isQuiz) {
      scoredAnswers = answers.map(ans => {
        const q = questionMap.get(ans.questionId);
        if (!q) return { ...ans, pointsEarned: 0 };

        let earned = 0;
        if (q.type === 'MULTIPLE_CHOICE' || q.type === 'DROPDOWN') {
          const selectedOption = q.options.find(opt => opt.id === ans.value);
          if (selectedOption?.isCorrect) earned = q.points;
        } else if (q.type === 'CHECKBOXES') {
          const correctOptionIds = q.options.filter(opt => opt.isCorrect).map(opt => opt.id);
          const selected = ans.value || [];
          const allCorrectSelected = correctOptionIds.every(id => selected.includes(id));
          const noExtra = selected.every(id => correctOptionIds.includes(id));
          if (allCorrectSelected && noExtra) earned = q.points;
        } else if (q.type === 'SHORT_TEXT' || q.type === 'LONG_TEXT') {
          if (q.correctAnswer?.value && q.correctAnswer.value === ans.value) earned = q.points;
        }
        return { ...ans, pointsEarned: earned, isCorrect: earned > 0 && earned === q.points };
      });

      totalScore = scoredAnswers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0);
      maxScore = gradedQuestions.reduce((sum, q) => sum + (q.points || 0), 0);
    }

    const newResponse = new Response({
      formId,
      userId: req.user ? req.user.id : null,
      answers: scoredAnswers,
      respondentEmail: form.settings.collectEmails !== 'DO_NOT_COLLECT' ? targetEmail : null,
      totalScore,
      maxScore,
      paymentStatus,
      paymentDetails: paymentDetailsPayload
    });

    await newResponse.save();

    let sendEmailCopy = form.settings.sendResponderCopy === 'ON_SUBMIT' ||  requestCopy;
    let releaseImmediate = form.settings.isQuiz && form.settings.releaseGrades === 'IMMEDIATELY';
    if ((sendEmailCopy || releaseImmediate) && targetEmail) {
      let html = `<div style="font-family: sans-serif; color: #333;">`;
      html += `<h2 style="color: #0078d4;">${form.title}</h2>`;
      html += `<p>Thank you for your submission.</p>`;
      if (releaseImmediate) {
        html += `<h3 style="background: #f3f2f1; padding: 10px; border-radius: 5px;">Your Score: <strong>${totalScore} / ${maxScore}</strong></h3>`;
      }

      if (sendEmailCopy) {
        html += `<hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />`;
        html += `<h3>Your Responses:</h3>`;
        
        scoredAnswers.forEach(ans => {
          const q = questionMap.get(ans.questionId);
          if (!q) return;

          html += `<div style="margin-bottom: 15px;">`;
          html += `<strong>${q.question}</strong>`;
          if (form.settings.showPointValues && form.settings.isQuiz) {
             html += ` <span style="font-size: 12px; color: #666;">(${ans.pointsEarned}/${q.points} pts)</span>`;
          }
          html += `<div style="margin-top: 5px; padding-left: 10px; border-left: 2px solid #ccc;">${Array.isArray(ans.value) ? ans.value.join(', ') : ans.value || '<em>No answer provided</em>'}</div>`;

          if (releaseImmediate) {
             if (form.settings.showMissedQuestions && !ans.isCorrect) {
                 html += `<div style="color: #d13438; font-size: 13px; margin-top: 4px;">❌ Incorrect</div>`;
             }
             if (form.settings.showCorrectAnswers && !ans.isCorrect && q.type !== 'TEXT_ONLY' && q.type !== 'FILE_UPLOAD') {
                 let correctText = "Check form owner for answer.";
                 if (q.type === 'MULTIPLE_CHOICE' || q.type === 'DROPDOWN' || q.type === 'CHECKBOXES') {
                     const correctOpts = q.options.filter(o => o.isCorrect).map(o => o.text).join(', ');
                     if (correctOpts) correctText = correctOpts;
                 } else if (q.correctAnswer?.value) {
                     correctText = q.correctAnswer.value;
                 }
                 html += `<div style="color: #107c10; font-size: 13px; margin-top: 4px;">✅ Correct Answer: ${correctText}</div>`;
             }
          }
          html += `</div>`;
        });
      }
      html += `</div>`;
      
      sendEmail(targetEmail, `EmR: Your response to ${form.title}`, html).catch(err => console.error(err));
    }

    res.status(201).json({
      message: form.settings.confirmationMessage || "Your response has been recorded.",
      score: releaseImmediate ? { totalScore, maxScore } : null
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server error submitting form" });
  }
};

export const createForm = async (req, res) => {
  try {
    const { title, description, settings, sections, collaborators } = req.body;

    const newForm = new Form({
      title,
      description,
      settings,
      sections,
      collaborators,
      userId: req.user.id
    });

    const savedForm = await newForm.save();
    res.status(201).json(savedForm);
  } catch (error) {
    res.status(500).json({ message: "Server error creating form", error: error.message });
  }
};

export const getPublicForm = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    const formObj = form.toObject();
    delete formObj.userId;

    res.status(200).json(formObj);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching form" });
  }
};

export const updateForm = async (req, res) => {
  try {
    const updatedForm = await Form.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedForm) {
      return res.status(404).json({ message: "Form not found or unauthorized" });
    }

    res.status(200).json(updatedForm);
  } catch (error) {
    res.status(500).json({ message: "Server error updating form", error: error.message });
  }
};

export const deleteForm = async (req, res) => {
  try {
    const deletedForm = await Form.findOneAndDelete({ _id: req.params.id });

    if (!deletedForm) {
      return res.status(404).json({ message: "Form not found or unauthorized" });
    }

    res.status(200).json({ message: "Form deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting form" });
  }
};

export const deleteResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await Response.findById(id);
    if (!response) return res.status(404).json({ message: "Response not found" });

    const form = await Form.findOne({ _id: response.formId });
    if (!form) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await response.deleteOne();
    res.status(200).json({ message: "Response deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getForms = async (req, res) => {
  try {
    const forms = await Form.find()
      .select('title description coverPhoto createdAt updatedAt settings.acceptingResponses')
      .sort({ updatedAt: -1 });
    res.status(200).json(forms);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching forms" });
  }
};

export const getFormById = async (req, res) => {
  try {
    const form = await Form.findOne({
      _id: req.params.id
    });
    if (!form) return res.status(404).json({ message: "Form not found" });
    res.status(200).json(form);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const checkExistingSubmission = async (req, res) => {
  try {
    const { formId } = req.params;
    const existing = await Response.findOne({ formId, respondentEmail: req.user.email });
    res.status(200).json({ hasSubmitted: !!existing });
  } catch (error) {
    res.status(500).json({ message: "Error checking submission" });
  }
};

export const getFormResponses2 = async (req, res) => {
  try {
    const form = await Form.findOne({
      _id: req.params.id
    });
    if (!form) return res.status(404).json({ message: "Form not found" });

    const responses = await Response.find({ formId: req.params.id }).sort({ submittedAt: -1 });
    res.status(200).json(responses);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getAccessRequests = async (req, res) => {
  try {
    const form = await Form.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.user.id },
        { 'collaborators.user': req.user.id }
      ]
    });
    if (!form) return res.status(404).json({ message: "Form not found" });

    const requests = await AccessRequest.find({ formId: req.params.id })
      .populate('userId', 'name email profilePhoto');
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteAccessRequest = async (req, res) => {
  try {
    const request = await AccessRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const form = await Form.findOne({
      _id: request.formId,
      $or: [
        { userId: req.user.id },
        { 'collaborators.user': req.user.id }
      ]
    });
    if (!form) return res.status(403).json({ message: "Unauthorized" });

    await request.deleteOne();
    res.status(200).json({ message: "Request deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const searchUsersForAccess = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const users = await User.find({
      $or: [
        { name: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
        { rollNo: new RegExp(q, 'i') }
      ]
    }).limit(20).select('name email rollNo profilePhoto');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};