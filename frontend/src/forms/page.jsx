import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from "date-fns";
import { useDropzone } from 'react-dropzone';
import { QRCodeSVG } from 'qrcode.react';
import {
  Loader2, ChevronLeft, UploadCloud, Calendar as CalendarIcon,
  Clock, AlertCircle, Home, FileText, ShieldCheck, Info,
  HomeIcon, Lock, CreditCard, ExternalLink, RefreshCw, CheckCircle2,
  HelpCircle, Send, Phone, Hash, QrCode, Copy, Check
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { cn } from "@/lib/utils";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

const GooglePayIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="5" fill="#ffffff" />
    <path d="M16.5 12.18c0-.38-.03-.77-.1-1.15H11.5v2.18h2.24c-.1.52-.39 1-.84 1.3l1.35 1.05c.79-.73 1.25-1.8 1.25-3.38z" fill="#4285F4"/>
    <path d="M11.5 16.27c1.15 0 2.12-.38 2.83-1.04l-1.35-1.05c-.38.26-.87.41-1.48.41-1.14 0-2.11-.77-2.45-1.8H7.66v1.08c.72 1.43 2.2 2.4 3.84 2.4z" fill="#34A853"/>
    <path d="M9.05 12.59c-.09-.26-.14-.54-.14-.84s.05-.58.14-.84V9.83H7.66C7.36 10.43 7.2 11.1 7.2 11.75s.16 1.32.46 1.92l1.39-1.08z" fill="#FBBC05"/>
    <path d="M11.5 7.64c.63 0 1.19.22 1.63.64l1.22-1.22C13.62 6.37 12.65 6 11.5 6 9.86 6 8.38 6.97 7.66 8.4l1.39 1.08c.34-1.03 1.31-1.84 2.45-1.84z" fill="#EA4335"/>
  </svg>
);

const PhonePeIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="5" fill="#5f259f" />
    <path d="M15.5 6.5H8.5C7.4 6.5 6.5 7.4 6.5 8.5v7c0 1.1.9 2 2 2h7c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2zm-3.5 9c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5zm2.5-6h-5V8h5v1.5z" fill="#ffffff" />
  </svg>
);

const PaytmIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="5" fill="#002E6E" />
    <path d="M5 14.5L7.2 8h2l-2.2 6.5H5zm3.8 0L11 8h2l-2.2 6.5H8.8zm5.5-4h1.8c.7 0 1.3.3 1.3 1 0 .8-.6 1.2-1.4 1.2h-1.7v1.8h-1.8V10.5zm1.8 1h-.8v.6h.8c.2 0 .4-.1.4-.3s-.2-.3-.4-.3z" fill="#00BAF2" />
  </svg>
);

const UpiIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="5" fill="#0078D4" />
    <path d="M12 5l-5 7h4v7l5-7h-4V5z" fill="#ffffff" />
  </svg>
);

const getAppDeepLink = (app, rawUpiUrl) => {
  if (!rawUpiUrl) return '#';
  const cleanUrl = rawUpiUrl.replace(/^upi:\/\/pay\?/, '');
  switch (app) {
    case 'gpay':
      return `gpay://upi/pay?${cleanUrl}`;
    case 'phonepe':
      return `phonepe://pay?${cleanUrl}`;
    case 'paytm':
      return `paytmmp://pay?${cleanUrl}`;
    default:
      return rawUpiUrl;
  }
};

const FileUploadInput = ({ el, value, onChange, hasError, label }) => {
  const [status, setStatus] = useState(value ? 'success' : 'idle');
  const [progress, setProgress] = useState(0);
  const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const maxSize = el?.fileRestrictions?.maxSizeMB || 10;
    if ((file.size / (1024 * 1024)) > maxSize) {
      toast.error(`Exceeds maximum size of ${maxSize}MB`);
      return;
    }

    try {
      setStatus('uploading');
      setProgress(0);
      const formData = new FormData();
      formData.append('file', file, file.name);

      const res = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
        onUploadProgress: (p) => setProgress(Math.round((p.loaded * 100) / p.total))
      });

      onChange(res.data.url || file.name);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      toast.error("Upload failed.");
    }
  }, [onChange, el?.fileRestrictions, API_URL]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, disabled: status === 'uploading' });

  if (status === 'uploading') {
    return (
      <div className="w-full bg-[#111] border border-zinc-800 rounded-md p-4 space-y-2">
        <div className="flex justify-between text-xs font-semibold text-[#0078d4]">
          <span className="flex items-center gap-2"><Loader2 className="animate-spin w-3 h-3" /> Uploading</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-1 bg-zinc-800" />
      </div>
    );
  }

  if (status === 'success' && value) {
    return (
      <div className="flex items-center justify-between w-full bg-[#0078d4]/10 border border-[#0078d4]/30 rounded-md p-2.5">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-[#0078d4]" />
          <p className="text-sm font-medium text-zinc-200 truncate max-w-[200px]">{value.split('/').pop()}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { onChange(''); setStatus('idle'); }} className="h-7 text-xs text-red-400 hover:bg-red-400/10">Remove</Button>
      </div>
    );
  }

  return (
    <div {...getRootProps()} className={cn(
      "border border-dashed rounded-md p-5 flex flex-col items-center justify-center text-center transition-all cursor-pointer",
      hasError ? "border-red-500/50 bg-red-500/5" : "border-zinc-700 bg-[#0a0a0a] hover:border-[#0078d4]",
      isDragActive && "border-[#0078d4] bg-[#0078d4]/5"
    )}>
      <input {...getInputProps()} />
      <UploadCloud className="text-zinc-400 mb-2" size={20} />
      <p className="text-sm font-medium text-zinc-300">{label || <>Drag file or <span className="text-[#0078d4]">browse</span></>}</p>
      <p className="text-xs text-zinc-500 mt-1">Max: {el?.fileRestrictions?.maxSizeMB || 10}MB</p>
    </div>
  );
};

export default function PublicForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const storageKey = `emr_draft_${id}`;

  const [form, setForm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [requestCopy, setRequestCopy] = useState(false);

  // Payment states
  const [isPaymentStep, setIsPaymentStep] = useState(false);
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const [paymentSession, setPaymentSession] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('PENDING');

  // Manual proof state
  const [showManualProof, setShowManualProof] = useState(false);
  const [manualScreenshot, setManualScreenshot] = useState('');
  const [manualTxnId, setManualTxnId] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(() => JSON.parse(localStorage.getItem(storageKey))?.currentSectionIndex || 0);
  const [answers, setAnswers] = useState(() => JSON.parse(localStorage.getItem(storageKey))?.answers || {});
  const [otherValues, setOtherValues] = useState(() => JSON.parse(localStorage.getItem(storageKey))?.otherValues || {});
  const [respondentEmail, setRespondentEmail] = useState(() => JSON.parse(localStorage.getItem(storageKey))?.respondentEmail || "");
  const [sectionHistory, setSectionHistory] = useState(() => JSON.parse(localStorage.getItem(storageKey))?.sectionHistory || []);
  const [hasAlreadySubmitted, setHasAlreadySubmitted] = useState(false);
  const [domainRestricted, setDomainRestricted] = useState(false);
  const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  const pollingRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ answers, otherValues, respondentEmail, currentSectionIndex, sectionHistory }));
  }, [answers, otherValues, respondentEmail, currentSectionIndex, sectionHistory, storageKey]);

  useEffect(() => {
    const localSubmitted = localStorage.getItem(`submitted_${id}`);

    const fetchForm = axios.get(`${API_URL}/forms/public/${id}`);
    const fetchAuth = axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: localStorage.getItem('token') },
      withCredentials: true
    });

    Promise.allSettled([fetchForm, fetchAuth]).then(async ([formResult, authResult]) => {
      let currentForm = null;
      let currentUser = null;

      if (formResult.status === 'fulfilled') {
        currentForm = formResult.value.data;
        setForm(currentForm);
      } else {
        toast.error("Failed to load form.");
        setIsLoading(false);
        setIsAuthLoading(false);
        return;
      }

      if (authResult.status === 'fulfilled') {
        setIsAuthenticated(true);
        currentUser = authResult.value.data.user || authResult.value.data;
        setUserProfile(currentUser);
      } else {
        setIsAuthenticated(false);
        setUserProfile(null);
      }

      if (currentForm.settings.requireNitkkrDomain && currentUser) {
        const email = currentUser.email?.toLowerCase() || '';
        const cEmail = currentUser.collegeEmail?.toLowerCase() || '';
        if (!email.endsWith('@nitkkr.ac.in') && !cEmail.endsWith('@nitkkr.ac.in')) {
          setDomainRestricted(true);
        }
      }

      if (currentForm.settings.limitToOneResponse) {
        if (localSubmitted) {
          setHasAlreadySubmitted(true);
        } else if (currentUser) {
          try {
            const checkRes = await axios.get(`${API_URL}/responses/check/${id}`, {
              headers: { Authorization: localStorage.getItem('token') },
              withCredentials: true
            });
            if (checkRes.data.hasSubmitted) {
              setHasAlreadySubmitted(true);
              localStorage.setItem(`submitted_${id}`, 'true');
            }
          } catch (err) {}
        }
      }

      setIsLoading(false);
      setIsAuthLoading(false);
    });
  }, [id, API_URL]);

  useEffect(() => {
    if (form && userProfile) {
      setAnswers(prev => {
        let hasChanges = false;
        const newAnswers = { ...prev };

        if (form.settings.collectEmails !== 'DO_NOT_COLLECT' && !respondentEmail && userProfile.email) {
          setRespondentEmail(userProfile.email);
        }

        form.sections.forEach(sec => {
          sec.elements.forEach(el => {
            if (el.type === 'SHORT_TEXT' && el.shortInputType && userProfile[el.shortInputType]) {
              if (!newAnswers[el.id]) {
                newAnswers[el.id] = userProfile[el.shortInputType];
                hasChanges = true;
              }
            }
          });
        });
        return hasChanges ? newAnswers : prev;
      });
    }
  }, [form, userProfile, respondentEmail]);

  const displayElements = useMemo(() => {
    if (!form?.sections?.[currentSectionIndex]) return [];
    let elements = [...form.sections[currentSectionIndex].elements];
    
    if (form.settings.shuffleQuestionOrder) {
      for (let i = elements.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [elements[i], elements[j]] = [elements[j], elements[i]];
      }
    }
    return elements;
  }, [form, currentSectionIndex]);

  const validate = () => {
    const newErrors = {};
    if (currentSectionIndex === 0 && form.settings.collectEmails !== 'DO_NOT_COLLECT' && !respondentEmail) {
      newErrors['email'] = "Email required.";
    }
    displayElements.forEach(el => {
      const ans = answers[el.id];
      if (el.required && !['TEXT_ONLY', 'IMAGE'].includes(el.type)) {
        if (!ans || (Array.isArray(ans) && ans.length === 0)) {
          newErrors[el.id] = "Required field.";
        }
      }
    });
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Initiate Payment Session
  const initiatePaymentSession = async () => {
    setIsInitializingPayment(true);
    try {
      const res = await axios.post(`${API_URL}/forms/public/${id}/create-payment`);
      if (res.data.success) {
        setPaymentSession(res.data);
        setPaymentStatus('PENDING');
        setIsPaymentStep(true);
        window.scrollTo(0, 0);
      } else {
        toast.error(res.data.message || "Failed to initialize payment");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment initiation error");
    } finally {
      setIsInitializingPayment(false);
    }
  };

  // Polling Payment Status
  useEffect(() => {
    if (isPaymentStep && paymentSession?.orderId && paymentStatus === 'PENDING') {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await axios.get(`${API_URL}/forms/public/${id}/payment-status/${paymentSession.orderId}`);
          if (res.data.success) {
            if (res.data.status === 'SUCCESS') {
              setPaymentStatus('SUCCESS');
              clearInterval(pollingRef.current);
              toast.success("Payment verified successfully!");
              setTimeout(() => {
                handleSubmit(paymentSession.orderId);
              }, 2500);
            } else if (res.data.status === 'EXPIRED') {
              setPaymentStatus('EXPIRED');
              clearInterval(pollingRef.current);
            }
          }
        } catch (err) {
          console.error("Payment polling error:", err);
        }
      }, 2500);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isPaymentStep, paymentSession, paymentStatus, API_URL, id]);

  const handleNext = () => {
    if (!validate()) return;
    if (currentSectionIndex === form.sections.length - 1 && form.settings.paymentRequired) {
      initiatePaymentSession();
    } else {
      setSectionHistory([...sectionHistory, currentSectionIndex]);
      setCurrentSectionIndex(currentSectionIndex + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (isPaymentStep) {
      setIsPaymentStep(false);
      return;
    }
    const hist = [...sectionHistory];
    const prev = hist.pop();
    setSectionHistory(hist);
    setCurrentSectionIndex(prev);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (paymentOrderId = null) => {
    if (!validate() && !isPaymentStep) return;
    if (isSubmitting || isSubmitted) return;
    setIsSubmitting(true);

    const processedAnswers = Object.entries(answers).map(([k, v]) => {
      let finalValue = v;
      if (typeof v === 'string' && v.startsWith('__OTHER__')) {
        finalValue = otherValues[k] || 'Other';
      } else if (Array.isArray(v)) {
        finalValue = v.map(item => item.startsWith('__OTHER__') ? (otherValues[k] || 'Other') : item);
      }
      return { questionId: k, value: finalValue };
    });

    try {
      const response = await axios.post(`${API_URL}/forms/public/${id}`, {
        answers: processedAnswers,
        respondentEmail,
        requestCopy,
        paymentOrderId
      }, {
        withCredentials: true
      });
      
      setSubmissionResult(response.data);
      setIsSubmitted(true);
      localStorage.removeItem(storageKey);
      localStorage.setItem(`submitted_${id}`, 'true');
    } catch (err) { 
      toast.error(err.response?.data?.message || "Submission error"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  // Submit Manual Payment Proof
  const handleManualProofSubmit = async (e) => {
    e.preventDefault();
    if (!manualTxnId || !manualPhone) {
      toast.error("Please provide both Transaction ID (UTR) and Phone Number.");
      return;
    }

    setIsSubmittingManual(true);

    const processedAnswers = Object.entries(answers).map(([k, v]) => {
      let finalValue = v;
      if (typeof v === 'string' && v.startsWith('__OTHER__')) {
        finalValue = otherValues[k] || 'Other';
      } else if (Array.isArray(v)) {
        finalValue = v.map(item => item.startsWith('__OTHER__') ? (otherValues[k] || 'Other') : item);
      }
      return { questionId: k, value: finalValue };
    });

    try {
      const res = await axios.post(`${API_URL}/forms/public/${id}/manual-payment-proof`, {
        orderId: paymentSession?.orderId || '',
        screenshotUrl: manualScreenshot,
        transactionId: manualTxnId,
        phoneNumber: manualPhone,
        answers: processedAnswers,
        respondentEmail,
        requestCopy
      }, { withCredentials: true });

      if (res.data.success) {
        setSubmissionResult({
          message: res.data.message || "Your response and payment proof have been submitted for verification."
        });
        setIsSubmitted(true);
        localStorage.removeItem(storageKey);
        localStorage.setItem(`submitted_${id}`, 'true');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit payment proof");
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const getAppDeepLink = (appScheme, upiUrl) => {
    if (!upiUrl) return '#';
    const params = upiUrl.replace('upi://pay?', '');
    switch (appScheme) {
      case 'gpay': return `gpay://upi/pay?${params}`;
      case 'phonepe': return `phonepe://pay?${params}`;
      case 'paytm': return `paytmmp://pay?${params}`;
      default: return upiUrl;
    }
  };

  const renderInput = (el) => {
    const val = answers[el.id] || '';
    const hasError = !!fieldErrors[el.id];
    const update = (v) => { setAnswers({ ...answers, [el.id]: v }); setFieldErrors({ ...fieldErrors, [el.id]: null }); };

    if (el.requireLogin && !isAuthenticated) {
      return (
        <div className="flex items-center space-x-2 text-sm text-zinc-400 bg-zinc-900/50 p-3 rounded-md border border-zinc-800">
          <Lock size={16} className="text-[#0078d4]" />
          <span>You must be logged in to fill out this field.</span>
        </div>
      );
    }

    switch (el.type) {
      case 'SHORT_TEXT':
        return (
          <div>
            <Input value={val} onChange={(e) => update(e.target.value)} disabled={el.requireLogin && !isAuthenticated} className={cn("bg-[#0a0a0a] border-zinc-800 text-zinc-100 h-9 text-sm focus-visible:ring-1 focus-visible:ring-[#0078d4]", hasError && "border-red-500")} placeholder="Enter response" />
            {el.shortInputType && val && userProfile && val === userProfile[el.shortInputType] && (
              <p className="text-[10px] text-[#0078d4] mt-1.5 flex items-center"><ShieldCheck size={12} className="mr-1" /> Auto-filled from your profile</p>
            )}
          </div>
        );

      case 'LONG_TEXT':
        return <Textarea value={val} onChange={(e) => update(e.target.value)} className={cn("bg-[#0a0a0a] border-zinc-800 text-zinc-100 min-h-[80px] text-sm focus-visible:ring-1 focus-visible:ring-[#0078d4]", hasError && "border-red-500")} placeholder="Enter detailed response" />;

      case 'MULTIPLE_CHOICE':
        return (
          <div className="grid gap-1.5">
            {el.options.map(opt => {
              const targetVal = opt.isOther ? `__OTHER__${opt.id}` : opt.text;
              const isSelected = val === targetVal;
              return (
                <div key={opt.id} className={cn("flex flex-col p-2 rounded border transition-colors", isSelected ? "border-[#0078d4] bg-[#0078d4]/10" : "border-zinc-800 hover:bg-zinc-900")}>
                  <label className="flex items-start cursor-pointer w-full">
                    <input type="radio" checked={isSelected} onChange={() => update(targetVal)} className="mt-0.5 w-4 h-4 accent-[#0078d4] bg-black border-zinc-700 shrink-0" />
                    <div className="ml-2.5 flex flex-col gap-2 w-full">
                      {opt.image && !opt.isOther && <img src={opt.image} alt="Option visual" className="max-h-32 max-w-[200px] object-cover rounded border border-zinc-700 bg-[#050505]" />}
                      <span className="text-sm font-medium text-zinc-200">{opt.isOther ? "Other" : opt.text}</span>
                    </div>
                  </label>
                  {opt.isOther && isSelected && (
                    <Input
                      autoFocus
                      className="mt-2 ml-6 w-[calc(100%-1.5rem)] bg-[#0a0a0a] border-zinc-700 h-8 text-sm focus-visible:ring-1 focus-visible:ring-[#0078d4]"
                      placeholder="Please specify..."
                      value={otherValues[el.id] || ''}
                      onChange={e => setOtherValues({ ...otherValues, [el.id]: e.target.value })}
                    />
                  )}
                </div>
              )
            })}
          </div>
        );

      case 'CHECKBOXES':
        const selected = Array.isArray(val) ? val : [];
        return (
          <div className="grid gap-1.5">
            {el.options.map(opt => {
              const targetVal = opt.isOther ? `__OTHER__${opt.id}` : opt.text;
              const isSelected = selected.includes(targetVal);
              const handleChange = (checked) => update(checked ? [...selected, targetVal] : selected.filter(x => x !== targetVal));
              return (
                <div key={opt.id} className={cn("flex flex-col p-2 rounded border transition-colors", isSelected ? "border-[#0078d4] bg-[#0078d4]/10" : "border-zinc-800 hover:bg-zinc-900")}>
                  <label className="flex items-start cursor-pointer w-full">
                    <input type="checkbox" checked={isSelected} onChange={(e) => handleChange(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-[#0078d4] bg-black border-zinc-700 shrink-0" />
                    <div className="ml-2.5 flex flex-col gap-2 w-full">
                      <span className="text-sm font-medium text-zinc-200">{opt.isOther ? "Other" : opt.text}</span>
                      {opt.image && !opt.isOther && <img src={opt.image} alt="Option visual" className="max-[180px] object-cover rounded border border-zinc-700 bg-[#050505]" />}
                    </div>
                  </label>
                  {opt.isOther && isSelected && (
                    <Input
                      autoFocus
                      className="mt-2 ml-6 w-[calc(100%-1.5rem)] bg-[#0a0a0a] border-zinc-700 h-8 text-sm focus-visible:ring-1 focus-visible:ring-[#0078d4]"
                      placeholder="Please specify..."
                      value={otherValues[el.id] || ''}
                      onChange={e => setOtherValues({ ...otherValues, [el.id]: e.target.value })}
                    />
                  )}
                </div>
              )
            })}
          </div>
        );

      case 'DROPDOWN':
        return (
          <Select value={val} onValueChange={update}>
            <SelectTrigger className={cn("w-full bg-[#0a0a0a] border-zinc-800 text-zinc-200 h-9 text-sm", hasError && "border-red-500")}>
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent className="bg-[#111] border-zinc-800 text-zinc-300">
              {el.options.map((opt) => <SelectItem key={opt.id} value={opt.text} className="text-sm cursor-pointer">{opt.text}</SelectItem>)}
            </SelectContent>
          </Select>
        );

      case 'DATE':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left bg-[#0a0a0a] border-zinc-800 h-9 text-sm text-zinc-200", !val && "text-zinc-500", hasError && "border-red-500")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {val ? format(new Date(val), "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="bg-[#111] border-zinc-800 p-0" align="start">
              <Calendar mode="single" selected={val ? new Date(val) : undefined} onSelect={(d) => update(d?.toISOString() || '')} className="dark" />
            </PopoverContent>
          </Popover>
        );

      case 'TIME':
        return (
          <div className="relative w-full max-w-[150px]">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input type="time" value={val} onChange={(e) => update(e.target.value)} className={cn("pl-9 bg-[#0a0a0a] border-zinc-800 text-zinc-200 h-9 text-sm [color-scheme:dark]", hasError && "border-red-500")} />
          </div>
        );

      case 'FILE_UPLOAD':
        return <FileUploadInput el={el} value={val} onChange={update} hasError={hasError} />;

      case 'TEXT_ONLY':
        return <div className="text-sm text-zinc-400 prose prose-invert max-w-none"><MarkdownRenderer content={el.question} /></div>;

      case 'IMAGE':
        return <img src={el.imageUrl} alt="Form visual" className="w-full rounded-md border border-zinc-800" />;

      default: return null;
    }
  };

  if (isLoading || isAuthLoading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#0078d4]" size={24} />
    </div>
  );

  if (hasAlreadySubmitted) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="bg-[#0c0c0c] border border-zinc-800 rounded-md p-8 text-center max-w-md w-full shadow-lg">
          <Info className="text-[#0078d4] w-12 h-12 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">You've already responded</h1>
          <p className="text-sm text-zinc-400 mb-6">You can fill out this form only once. Contact the form owner if you think this is a mistake.</p>
        </div>
      </div>
    );
  }

  if (domainRestricted) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="bg-[#0c0c0c] border border-zinc-800 rounded-md p-8 text-center max-w-md w-full shadow-lg">
          <ShieldCheck className="text-red-500 w-12 h-12 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-sm text-zinc-400 mb-6">This form is restricted to users within the <strong>NIT Kurukshetra</strong> organization. Please ensure your college email is linked to your profile.</p>
          <Button onClick={() => navigate('/a/profile')} className="bg-zinc-800 hover:bg-zinc-700 text-white w-full font-semibold border border-zinc-700">Update Profile</Button>
        </div>
      </div>
    );
  }

  if (form?.settings?.loginReq && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="bg-[#0c0c0c] border border-zinc-800 rounded-md p-8 text-center max-w-md w-full shadow-lg">
          <Lock className="text-[#0078d4] w-12 h-12 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Sign in required</h1>
          <p className="text-sm text-zinc-400 mb-6">This form requires you to be logged in to view and submit responses securely.</p>
          <Button onClick={() => navigate('/a/login?redirect=/form/'+id)} className="bg-[#0078d4] hover:bg-[#005a9e] text-white w-full font-semibold">Sign in to continue</Button>
        </div>
      </div>
    );
  }

  if (form?.settings?.acceptingResponses === false) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="bg-[#0c0c0c] border border-zinc-800 rounded-md p-8 text-center max-w-md w-full shadow-lg">
          <AlertCircle className="text-red-500 w-12 h-12 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Form Closed</h1>
          <p className="text-sm text-zinc-400 mb-6">This form is no longer accepting responses.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200 font-sans pb-10">
      <nav className="sticky top-0 z-50 bg-[#0c0c0c] border-b border-zinc-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to={'/p'}><span className="font-bold text-md tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#51b749] to-[#13703a]">
              EM
            </span>R<span className="text-white/30 font-normal ml-1.5">/ NITKKR</span>
          </span></Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto mt-6 px-4">
        {form.sections.length > 1 && form.settings.showProgressBar && (
          <div className="mb-6 flex flex-col gap-1.5">
            <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
              <span>Section {currentSectionIndex + 1} of {form.sections.length}</span>
              <span>{Math.round(((currentSectionIndex + 1) / form.sections.length) * 100)}%</span>
            </div>
            <div className="h-1 w-full bg-zinc-900 rounded-full"><div className="h-full bg-[#0078d4] transition-all" style={{ width: `${((currentSectionIndex + 1) / form.sections.length) * 100}%` }} /></div>
          </div>
        )}

        {isSubmitted ? (
          <div className="bg-[#0c0c0c] border border-zinc-800 rounded-md p-8 text-center">
            <ShieldCheck className="text-green-500 w-12 h-12 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Submission Successful</h1>
            <p className="text-sm text-zinc-400 mb-6 whitespace-pre-wrap">
              {submissionResult?.message || "Your response has been recorded."}
            </p>
            
            {submissionResult?.score && (
               <div className="mb-6 inline-block bg-zinc-900 border border-zinc-700 rounded-lg p-4">
                  <p className="text-sm text-zinc-400">Total Score</p>
                  <p className="text-3xl font-bold text-[#0078d4]">{submissionResult.score.totalScore} <span className="text-lg text-zinc-500">/ {submissionResult.score.maxScore}</span></p>
               </div>
            )}

{!form.settings.limitToOneResponse && (
              <Button onClick={() => window.location.reload()} className="bg-zinc-200 text-black hover:bg-white h-9 text-sm font-semibold">Submit another response</Button>
            )}
          </div>
        ) : isPaymentStep && paymentSession ? (
          /* CLEAN MICROSOFT FORMS STYLE PAYMENT STEP CARD */
          <div className="space-y-4 animate-in fade-in duration-200">
            {paymentStatus === 'SUCCESS' ? (
              <div className="bg-[#0c0c0c] border border-zinc-800 border-t-2 border-t-green-500 rounded-md p-8 text-center shadow-sm">
                <CheckCircle2 className="text-green-500 w-12 h-12 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-white mb-1">Payment Received</h2>
                <p className="text-sm text-zinc-400 mb-3">
                  Payment of <span className="font-semibold text-white">₹{paymentSession.exactAmount.toFixed(2)}</span> has been successfully verified.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 mb-6 bg-[#0a0a0a] border border-zinc-800 py-2 px-4 rounded-md inline-flex">
                  <Loader2 className="animate-spin w-3.5 h-3.5 text-[#0078d4]" />
                  <span>Submitting your form response...</span>
                </div>
                <div>
                  <Button
                    onClick={() => handleSubmit(paymentSession.orderId)}
                    disabled={isSubmitting}
                    className="bg-[#0078d4] hover:bg-[#005a9e] text-white font-semibold h-9 text-sm px-6 rounded"
                  >
                    {isSubmitting && <Loader2 className="animate-spin mr-2 w-4 h-4" />}
                    Submit Now
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-[#0c0c0c] border border-zinc-800 border-t-2 border-t-[#0078d4] rounded-md p-5 sm:p-6 shadow-sm space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      <CreditCard className="text-[#0078d4]" size={20} />
                      Payment Required
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      {paymentSession.instruction || "Complete UPI payment to finish form submission"}
                    </p>
                  </div>
                  <div className="bg-[#0078d4]/10 border border-[#0078d4]/30 text-[#0078d4] text-xs font-medium px-2.5 py-1 rounded flex items-center gap-1.5 shrink-0">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0078d4] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0078d4]"></span>
                    </span>
                    <span>Waiting for payment...</span>
                  </div>
                </div>

                {/* Amount Display */}
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-md p-4 text-center">
                  <span className="text-[11px] text-zinc-400 uppercase font-medium tracking-wider">
                    Amount to Pay
                  </span>
                  <div className="text-3xl font-bold text-white mt-0.5">
                    ₹{paymentSession.exactAmount.toFixed(2)}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Base: ₹{paymentSession.baseAmount}.00 (Includes verification code)
                  </p>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center gap-2 pt-1">
                  <div className="bg-white p-4 rounded-md border border-zinc-700 shadow-sm flex items-center justify-center">
                    <QRCodeSVG value={paymentSession.upiUrl} size={190} level="H" includeMargin={false} />
                  </div>
                  <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1 font-medium">
                    <QrCode size={14} className="text-[#0078d4]" /> Scan with Google Pay, PhonePe, Paytm, or BHIM
                  </p>
                </div>

                {/* Merchant Details & Copy UPI */}
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-md p-4 text-xs space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Merchant Name</span>
                    <span className="font-medium text-zinc-200">{paymentSession.merchantName}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-zinc-800/80">
                    <span className="text-zinc-400">Merchant UPI ID</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-zinc-200 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                        {paymentSession.merchantUpiId}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(paymentSession.merchantUpiId);
                          setCopiedUpi(true);
                          toast.success("UPI ID copied!");
                          setTimeout(() => setCopiedUpi(false), 2000);
                        }}
                        className="h-7 px-2 border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 text-xs"
                      >
                        {copiedUpi ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-zinc-800/80">
                    <span className="text-zinc-400">Order ID</span>
                    <span className="font-mono text-zinc-400">{paymentSession.orderId}</span>
                  </div>
                </div>

                {/* Quick App Intent Buttons */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Pay with App
                  </label>

                  <a
                    href={paymentSession.upiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#0078d4] hover:bg-[#005a9e] text-white text-sm font-semibold h-9 rounded flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <UpiIcon />
                    <span>Open Default UPI App</span>
                    <ExternalLink size={14} className="opacity-70" />
                  </a>

                  <div className="grid grid-cols-3 gap-2">
                    <a
                      href={getAppDeepLink('gpay', paymentSession.upiUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#0a0a0a] hover:bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs h-9 rounded flex items-center justify-center gap-2 transition-colors"
                    >
                      <GooglePayIcon />
                      <span>Google Pay</span>
                    </a>

                    <a
                      href={getAppDeepLink('phonepe', paymentSession.upiUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#0a0a0a] hover:bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs h-9 rounded flex items-center justify-center gap-2 transition-colors"
                    >
                      <PhonePeIcon />
                      <span>PhonePe</span>
                    </a>

                    <a
                      href={getAppDeepLink('paytm', paymentSession.upiUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#0a0a0a] hover:bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs h-9 rounded flex items-center justify-center gap-2 transition-colors"
                    >
                      <PaytmIcon />
                      <span>Paytm</span>
                    </a>
                  </div>
                </div>

                {/* Manual Proof Section */}
                <div className="pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowManualProof(!showManualProof)}
                    className="text-xs text-zinc-400 hover:text-zinc-200 underline flex items-center gap-1.5"
                  >
                    <HelpCircle size={14} />
                    <span>Payment done but status not updating? Submit proof manually</span>
                  </button>

                  {showManualProof && (
                    <form onSubmit={handleManualProofSubmit} className="bg-[#0a0a0a] border border-zinc-800 rounded-md p-4 space-y-4 mt-3">
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-[#0078d4]" /> Manual Payment Verification
                        </h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Submit your UTR / Transaction ID and phone number for manual verification by the admin.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-zinc-300 font-medium block">
                          Payment Screenshot
                        </label>
                        <FileUploadInput
                          value={manualScreenshot}
                          onChange={(url) => setManualScreenshot(url)}
                          label={<>Upload screenshot or <span className="text-[#0078d4]">browse</span></>}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-zinc-300 font-medium block">
                          UTR / Transaction Reference ID <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="text"
                          placeholder="e.g. 425091827364"
                          value={manualTxnId}
                          onChange={(e) => setManualTxnId(e.target.value)}
                          required
                          className="bg-[#050505] border-zinc-800 h-9 text-xs text-zinc-100 focus-visible:ring-[#0078d4]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-zinc-300 font-medium block">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="text"
                          placeholder="e.g. 9876543210"
                          value={manualPhone}
                          onChange={(e) => setManualPhone(e.target.value)}
                          required
                          className="bg-[#050505] border-zinc-800 h-9 text-xs text-zinc-100 focus-visible:ring-[#0078d4]"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmittingManual}
                        className="bg-[#0078d4] hover:bg-[#005a9e] text-white font-semibold h-9 text-xs rounded w-full"
                      >
                        {isSubmittingManual && <Loader2 className="animate-spin mr-2 w-3.5 h-3.5" />}
                        Submit Payment Proof
                      </Button>
                    </form>
                  )}
                </div>

                {/* Navigation Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="h-9 text-sm border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-900"
                  >
                    <ChevronLeft size={16} className="mr-1" /> Back
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* STANDARD FORM QUESTIONS STEP */
          <div className="space-y-4">
            <div className="bg-[#0c0c0c] border border-zinc-800 border-t-2 border-t-[#0078d4] rounded-md shadow-sm overflow-hidden">
              {form.coverPhoto && <img className='w-full' src={form.coverPhoto} />}
              <div className='p-5'>
                <h1 className="text-xl font-bold text-white tracking-tight">{form.title}</h1>
                {form.description && (
                  <div className="mt-2 text-sm text-zinc-400 leading-snug">
                    <MarkdownRenderer content={form.description} />
                  </div>
                )}

                {(form.sections[currentSectionIndex].title || form.sections[currentSectionIndex].description) && (
                  <div className="mt-5 pt-4 border-t border-zinc-800/50">
                    {form.sections[currentSectionIndex].title && (
                      <h2 className="text-lg font-semibold text-zinc-200">{form.sections[currentSectionIndex].title}</h2>
                    )}
                    {form.sections[currentSectionIndex].description && (
                      <div className="mt-1.5 text-sm text-zinc-500 leading-snug">
                        <MarkdownRenderer content={form.sections[currentSectionIndex].description} />
                      </div>
                    )}
                  </div>
                )}

                {currentSectionIndex === 0 && form.settings.collectEmails !== 'DO_NOT_COLLECT' && (
                  <div className="mt-5 pt-4 border-t border-zinc-800/50">
                    <label className="text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                      <Info size={14} className="text-[#0078d4]" /> Institutional Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={respondentEmail} onChange={(e) => { setRespondentEmail(e.target.value); setFieldErrors({ ...fieldErrors, email: null }); }}
                      disabled={form.settings.collectEmails === 'VERIFIED' && isAuthenticated}
                      className={cn("bg-[#0a0a0a] border-zinc-800 h-9 text-sm max-w-md focus-visible:ring-[#0078d4]", fieldErrors.email && "border-red-500")}
                    />
                    {form.settings.collectEmails === 'VERIFIED' && isAuthenticated && (
                      <p className="text-[10px] text-[#0078d4] mt-1.5 flex items-center"><ShieldCheck size={12} className="mr-1" /> Verified via login</p>
                    )}
                    {fieldErrors.email && <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.email}</p>}
                  </div>
                )}
              </div>
            </div>

            {displayElements.map((el) => (
              <div key={el.id} className="bg-[#0c0c0c] border border-zinc-800 rounded-md p-5 shadow-sm">
                {!['IMAGE', 'TEXT_ONLY'].includes(el.type) && (
                  <div className="flex justify-between items-start mb-3 gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 leading-snug">
                        {el.question} {el.required && <span className="text-red-500">*</span>}
                      </h3>
                      {el.description && <p className="text-xs text-zinc-500 mt-1">{el.description}</p>}
                    </div>
                    {el.points > 0 && form.settings.isQuiz && <span className="text-[10px] font-bold bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-800 shrink-0">{el.points} PTS</span>}
                  </div>
                )}

                {renderInput(el)}

                {fieldErrors[el.id] && (
                  <p className="text-xs text-red-400 mt-2 flex items-center gap-1 font-medium"><AlertCircle size={12} /> {fieldErrors[el.id]}</p>
                )}
              </div>
            ))}

            {form.settings.sendResponderCopy === 'WHEN_REQUESTED' && currentSectionIndex === form.sections.length - 1 && (
               <div className="bg-[#0c0c0c] border border-zinc-800 rounded-md p-4 flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    id="requestCopy" 
                    checked={requestCopy} 
                    onChange={(e) => setRequestCopy(e.target.checked)} 
                    className="w-4 h-4 accent-[#0078d4] bg-black border-zinc-700 rounded" 
                  />
                  <label htmlFor="requestCopy" className="text-sm text-zinc-300 cursor-pointer">
                    Send me a copy of my responses
                  </label>
               </div>
            )}

            <div className="flex items-center justify-between pt-4 pb-8">
              <Button variant="outline" onClick={handleBack} disabled={currentSectionIndex === 0} className="h-9 text-sm border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-900 disabled:opacity-0">
                <ChevronLeft size={16} className="mr-1" /> Back
              </Button>
              <Button
                onClick={currentSectionIndex === form.sections.length - 1 ? (form.settings.paymentRequired ? handleNext : () => handleSubmit()) : handleNext}
                disabled={isSubmitting || isInitializingPayment}
                className="h-9 text-sm bg-[#0078d4] hover:bg-[#005a9e] text-white font-semibold px-6 rounded"
              >
                {(isSubmitting || isInitializingPayment) && <Loader2 className="animate-spin mr-2 w-4 h-4" />}
                {currentSectionIndex === form.sections.length - 1
                  ? (form.settings.paymentRequired ? "Proceed to Payment" : "Submit")
                  : "Next"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}