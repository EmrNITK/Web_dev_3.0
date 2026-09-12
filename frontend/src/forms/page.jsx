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
  <svg className="w-5 h-5 shrink-0" viewBox="0 -19 256 256" fill="none">
    <g>
      <path d="M232.503966,42.1689673 C207.253909,27.593266 174.966113,36.2544206 160.374443,61.5045895 L123.592187,125.222113 C112.948983,143.621675 126.650534,150.051007 141.928772,159.211427 L177.322148,179.639204 C189.30756,186.552676 204.616725,182.448452 211.530197,170.478784 L249.342585,104.997327 C262.045492,82.993425 254.507868,54.8722676 232.503966,42.1689673 Z" fill="#EA4335" />
      <path d="M190.884248,68.541767 L155.490872,48.1141593 C135.952653,37.2682465 124.888287,36.5503588 116.866523,49.3002175 L64.6660169,139.704135 C50.0900907,164.938447 58.7669334,197.211061 84.0012455,211.755499 C106.005147,224.458406 134.126867,216.920782 146.829774,194.91688 L200.029486,102.764998 C206.973884,90.7801476 202.869661,75.4552386 190.884248,68.541767 Z" fill="#FBBC04" />
      <path d="M197.696506,22.068674 L172.836685,7.71148235 C145.33968,-8.15950938 110.180221,1.25070674 94.3093189,28.7478917 L46.9771448,110.724347 C39.9857947,122.818845 44.1369141,138.299511 56.2315252,145.275398 L84.0720952,161.34929 C97.8203166,169.292894 115.392174,164.5797 123.335778,150.830917 L177.409304,57.1816314 C188.614245,37.7835939 213.411651,31.1355838 232.809294,42.3404686 L197.696506,22.068674 Z" fill="#34A853" />
      <path d="M101.033296,52.202526 L74.1604429,36.7216914 C62.1750303,29.8240204 46.8660906,33.9126683 39.9527877,45.8666484 L7.71149357,101.579108 C-8.15952065,128.997954 1.25071234,164.079816 28.7479029,179.904047 L49.2069432,191.685907 L74.0198681,205.980684 L84.7879024,212.176099 C65.670846,199.37985 59.6002612,173.739558 71.2887797,153.545698 L79.6378018,139.126091 L110.20946,86.3008703 C117.107187,74.3784352 113.002964,59.1001971 101.033296,52.202526 Z" fill="#4285F4" />
    </g>
  </svg>
);

const PhonePeIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
    <path
      d="M10.206 9.941h2.949v4.692c-.402.201-.938.268-1.34.268-1.072 0-1.609-.536-1.609-1.743V9.941zm13.47 4.816c-1.523 6.449-7.985 10.442-14.433 8.919C2.794 22.154-1.199 15.691.324 9.243 1.847 2.794 8.309-1.199 14.757.324c6.449 1.523 10.442 7.985 8.919 14.433zm-6.231-5.888a.887.887 0 0 0-.871-.871h-1.609l-3.686-4.222c-.335-.402-.871-.536-1.407-.402l-1.274.401c-.201.067-.268.335-.134.469l4.021 3.82H6.386c-.201 0-.335.134-.335.335v.67c0 .469.402.871.871.871h.938v3.217c0 2.413 1.273 3.82 3.418 3.82.67 0 1.206-.067 1.877-.335v2.145c0 .603.469 1.072 1.072 1.072h.938a.432.432 0 0 0 .402-.402V9.874h1.542c.201 0 .335-.134.335-.335v-.67z"
      fill="#5F259F"
    />
  </svg>
);

const PaytmIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="-164 191.6 512 193" fill="none">
    <path d="M229.8,243.2c2-1.6,3-2.4,4-3.2c13.9-11.8,31.7-10.5,43.6,3.5c1.2,1.4,1.8,1.5,3,0.3c0.8-0.9,1.7-1.6,2.5-2.5c9.3-9.1,21.6-11.8,33.1-6.7c12.1,5.4,18.6,14.9,18.7,28.2c0.2,28.7,0.1,57.3,0.1,86c0,10.2-6.3,16.6-16.4,16.6c-4,0-8-0.3-12,0.1c-4.1,0.4-5.3-0.9-5.3-5.2c0.2-28,0.1-56,0.1-84c0-1.2,0-2.3,0-3.5c-0.1-6.5-2.7-9.2-8.9-9.5c-5.6-0.3-9.5,3.1-10.1,8.8c-0.1,1.3,0,2.7,0,4c0,24.2,0,48.3,0,72.5c0,10.6-6.1,16.8-16.7,16.7c-5.4-0.1-12.7,2.4-15.8-1.1c-2.7-3-0.9-10.1-0.9-15.4c0-24.8,0-49.7,0-74.5c0-8.8-5.7-13.3-13.1-10.3c-4.6,1.9-6.1,5.6-6.1,10.4c0.1,23.2,0,46.3,0,69.5c0,1.8,0,3.7,0,5.5c-0.3,9.7-6.5,15.8-16.1,15.9c-4,0.1-8-0.3-12,0.1c-4.3,0.4-5.6-0.8-5.5-5.4c0.2-39.3,0.1-78.6,0.1-118c0-1.7,0.1-3.3,0-5c-0.2-2.2,0.7-2.9,2.9-2.9c9.2,0.1,18.3,0.1,27.5,0c2.3,0,3.4,0.6,3.2,3.1C229.5,239,229.7,240.6,229.8,243.2z" fill="#02b9ef" />
    <path d="M17.8 297.4c0 13.7 0 27.3 0 41-.1 17.8-9.4 27-27.2 27.1-7.8 0-15.7.1-23.5 0-15.8-.2-27.4-10.7-28.2-26.5-.6-11.3-.7-22.7-.1-34 .8-16.2 13.2-27.6 29.6-27.8 4.3-.1 8.7 0 13 0 4.2-.1 5.8-2.5 5.7-6.5 0-4-1.8-5.8-5.8-5.6-4.5.1-9 .1-13.5 0-11-.2-17.1-6.2-17-17 0-4.4-2-10.3.9-12.9 2.5-2.2 8.2-.8 12.5-.8 11.2-.1 22.3 0 33.5 0 11.9 0 20 8.1 20.1 20.1C17.9 268.7 17.8 283.1 17.8 297.4zM-12.8 320.1c0-1.7 0-3.3 0-5 0-10.2 0-10.2-10.2-9.8-5.1.2-7.9 2.8-8 8.1-.1 4.2-.1 8.3 0 12.5.1 7.2 3.3 9.1 13.7 9.4 7.7.2 3.8-5.2 4.5-8.2C-12.4 324.9-12.9 322.4-12.8 320.1z" fill="#02b9ef" />
    <path d="M106.8 286.5c0 15.3.2 30.7-.1 46-.2 11.8-3 22.5-14.4 28.8-4.6 2.5-9.6 3.9-14.8 4-11.5.2-23 0-34.5.2-2.8 0-3.4-1-3.3-3.5.2-4.2-.1-8.3.1-12.5.2-8 6.3-14.1 14.3-14.4 5.2-.2 10.3-.1 15.5 0 4.2 0 6.5-1.7 6.5-6.2 0-4.6-2.2-6.2-6.4-6.3-7-.2-14 .8-20.9-1.2-11.9-3.5-20.6-13.4-20.9-25.7-.6-19.5-.2-39-.3-58.5 0-2.2.7-2.9 2.9-2.8 8.2.1 16.3.2 24.5 0 3.6-.1 3.1 1.9 3.1 4.1 0 14.7 0 29.3 0 44 0 6.4 3 9.8 8.6 10 6.6.2 9.5-2.5 9.5-9.2 0-14.8.1-29.7-.1-44.5 0-3.5.9-4.5 4.4-4.4 7.3.3 14.7.4 22 0 4-.2 4.6 1.3 4.5 4.8C106.7 254.9 106.8 270.7 106.8 286.5z" fill="#02b9ef" />
    <path d="M-148 309.2c0-16.3 0-32.7 0-49 0-16 9.8-26 25.9-25.8 10.5.1 21-1.2 31.4.8 13.3 2.6 21.7 12.9 21.8 26.6.1 14.5 0 29 0 43.5 0 18.2-10.7 29.3-28.9 29.8-5.5.2-11 .1-16.5 0-2.5-.1-3.6.7-3.5 3.4.2 4 .1 8 0 12-.2 8.6-6.3 14.8-14.8 14.9-5 .1-11.3 2.1-14.5-.8-3-2.7-.8-9.1-.9-13.9C-148.1 336.9-148 323-148 309.2zM-117.8 284.7c0 3.2 0 6.3 0 9.5 0 11.3 0 11.3 11.3 10.3 4.9-.4 7.2-2.8 7.3-7.7.1-5.6-.2-11.3.1-16.9.6-16.2-2.4-14.6-15.6-14.7-2.4 0-3.2.7-3.2 3.1C-117.7 273.7-117.8 279.2-117.8 284.7z" fill="#06306f" />
    <path d="M135.1,309.4c0-13.3-0.1-26.7,0.1-40c0-3.1-0.7-4.4-4.1-4.3c-4.5,0.2-10.5,1.5-13-0.7c-3.1-2.9-.7-9.1-1.1-13.9c0-0.3,0-0.7,0-1c0-4.7-1.5-10.2,0.5-13.7s8.1-1.3,12.4-2.4c8.5-2.2,14.9-7.1,20.1-13.9c3.6-4.6,8.1-7.9,13.9-9c3.1-0.6,5-0.2,4.8,3.8c-0.3,5.6,0,11.3-0.1,17c-0.1,2.4,0.8,3.2,3.2,3.1c4-0.1,8,0.1,12-0.1c2.4-0.1,3.2,0.8,3.1,3.2c-0.1,8.2-0.1,16.3,0,24.5c0,2.3-.6,3.5-3.1,3.2c-.5-.1-1,0-1.5,0c-4.4.4-10.5-2-12.8,1c-2.2,2.8-.8,8.6-.8,13.1c0,27.2-.1,54.3.1,81.5c0,3.8-1,5-4.8,4.7c-3.6-.3-7.3,0-11-0.1c-10.8-.4-17.9-7.7-17.9-18.5C135.1,334.4,135.1,321.9,135.1,309.4z" fill="#02b9ef" />
  </svg>
);

const UpiIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="5" fill="#0078D4" />
    <path d="M12 5l-5 7h4v7l5-7h-4V5z" fill="#ffffff" />
  </svg>
);

// ---------------------------------------------------------------------------
// UPI deep-link handling
// ---------------------------------------------------------------------------
// A QR code is just an image: whatever string is embedded in it, the paying
// app decodes and parses on its own, tolerating things like unencoded
// spaces or a loose "&" in the transaction note. `window.location.href =
// someLink` is real browser navigation, which follows strict URI rules — if
// the source `upiUrl` has any unencoded character in `pn` (payee name) or
// `tn` (transaction note), the browser can silently mangle or truncate the
// URL on navigation. The receiving app then gets an incomplete payload
// (missing merchant fields, wrong mode, etc.) and falls back to a generic
// flow instead of a direct merchant payment — which is exactly what
// produces misleading messages like PhonePe's "scan from gallery" limit or
// GPay's "exceeded bank limit" for a tiny amount that works fine via QR.
//
// Fix: never reuse the raw query string. Parse every param out, decode it
// (in case it's already partially encoded), then re-encode cleanly before
// rebuilding any link. This makes the deep link correct regardless of how
// the backend formatted the original upiUrl.
const UPI_PACKAGES = {
  gpay: 'com.google.android.apps.nbu.paisa.user',
  phonepe: 'com.phonepe.app',
  paytm: 'net.one97.paytm',
};

const isAndroid = () => typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
const isIOS = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

// Pull key/value pairs out of a upi://pay?... string without relying on the
// strict URL parser (which can throw on unencoded spaces) or on the source
// string's encoding being correct.
const parseUpiParams = (rawUpiUrl) => {
  if (!rawUpiUrl) return {};
  const queryPart = rawUpiUrl.split('?')[1] || '';
  const params = {};
  queryPart.split('&').forEach((pair) => {
    if (!pair) return;
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) return;
    const rawKey = pair.slice(0, eqIdx);
    const rawVal = pair.slice(eqIdx + 1);
    let key;
    let val;
    try { key = decodeURIComponent(rawKey.replace(/\+/g, ' ')).trim(); } catch { key = rawKey.trim(); }
    try { val = decodeURIComponent(rawVal.replace(/\+/g, ' ')).trim(); } catch { val = rawVal.trim(); }
    if (key) params[key] = val;
  });
  return params;
};

// Rebuild a clean, correctly percent-encoded UPI query string from a
// (possibly messy) source upiUrl.
const buildCleanUpiQuery = (rawUpiUrl) => {
  const params = parseUpiParams(rawUpiUrl);

  // Normalize the amount to exactly 2 decimal places — some apps reject or
  // misinterpret "1.2" or "1" where "1.20"/"1.00" is expected.
  if (params.am !== undefined && params.am !== '') {
    const numeric = Number(params.am);
    if (!Number.isNaN(numeric)) {
      params.am = numeric.toFixed(2);
    }
  }

  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
};

const getAppDeepLink = (app, rawUpiUrl) => {
  if (!rawUpiUrl) return '#';
  const query = buildCleanUpiQuery(rawUpiUrl);

  if (isAndroid()) {
    const pkg = UPI_PACKAGES[app];
    if (!pkg) return rawUpiUrl;
    const fallback = encodeURIComponent(`upi://pay?${query}`);
    // intent:// with an explicit package reliably targets one app on Android
    // and falls back to the generic upi:// chooser if the app isn't installed.
    return `intent://pay?${query}#Intent;scheme=upi;package=${pkg};S.browser_fallback_url=${fallback};end`;
  }

  if (isIOS()) {
    // iOS app-specific schemes only work if the app is installed and still
    // registers that scheme; these have changed across app versions, so
    // treat them as best-effort and always keep the QR / generic link as
    // a fallback path in the UI.
    switch (app) {
      case 'gpay':
        return `gpay://upi/pay?${query}`;
      case 'phonepe':
        return `phonepe://pay?${query}`;
      case 'paytm':
        return `paytmmp://pay?${query}`;
      default:
        return rawUpiUrl;
    }
  }

  // Desktop / unknown UA: nothing sensible to deep-link to, hand back the
  // generic UPI URL (mostly useful for debugging / copy).
  return rawUpiUrl;
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
  const appOpenTimerRef = useRef(null);

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
          } catch (err) { }
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

  // Handle a UPI app button tap: navigate to the app deep link, and if the
  // tab is still visible shortly after (i.e. nothing actually opened), tell
  // the user instead of leaving them stuck on a silent failure.
  const handleUpiAppClick = (app) => {
    if (!paymentSession?.upiUrl) return;
    const link = getAppDeepLink(app, paymentSession.upiUrl);
    const clickedAt = Date.now();

    if (appOpenTimerRef.current) clearTimeout(appOpenTimerRef.current);

    window.location.href = link;

    appOpenTimerRef.current = setTimeout(() => {
      if (document.visibilityState === 'visible' && Date.now() - clickedAt < 3000) {
        toast.error(`Couldn't open the app. Try scanning the QR code, or use "Copy UPI ID" and pay manually.`);
      }
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (appOpenTimerRef.current) clearTimeout(appOpenTimerRef.current);
    };
  }, []);

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
                      {opt.image && !opt.isOther && <img src={opt.image} alt="Option visual" className="max-h-36 rounded border border-zinc-700 bg-[#050505]" />}
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
                      {opt.image && !opt.isOther && <img src={opt.image} alt="Option visual" className="max-[180px] rounded border border-zinc-700 bg-[#050505]" />}
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
          <Button onClick={() => navigate('/a/login?redirect=/form/' + id)} className="bg-[#0078d4] hover:bg-[#005a9e] text-white w-full font-semibold">Sign in to continue</Button>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="bg-[#0c0c0c] border border-zinc-800 rounded-md p-8 text-center max-w-md w-full shadow-lg">
          <AlertCircle className="text-red-500 w-12 h-12 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Invalid Form Link</h1>
          <p className="text-sm text-zinc-400 mb-6">The form you are looking for does not exist or has been deleted.</p>
          <Button onClick={() => navigate('/p')} className="bg-zinc-800 hover:bg-zinc-700 text-white w-full font-semibold border border-zinc-700">Go to Home</Button>
        </div>
      </div>
    );
  }

  if (form?.settings?.acceptingResponses === false) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="bg-[#0c0c0c] border border-zinc-800 rounded-md p-8 text-center max-w-md w-full shadow-lg">
          <AlertCircle className="text-yellow-500 w-12 h-12 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">{form.title}</h1>
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
                <div style={{ display: 'none' }} className="space-y-2 pt-1 hidden">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    Pay directly with App:
                  </label>

                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleUpiAppClick('gpay')}
                      className="bg-[#0a0a0a] hover:bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white text-xs h-10 rounded-md flex items-center justify-center gap-2 transition-colors font-medium shadow-sm"
                    >
                      <GooglePayIcon />
                      <span>GPay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpiAppClick('phonepe')}
                      className="bg-[#0a0a0a] hover:bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white text-xs h-10 rounded-md flex items-center justify-center gap-2 transition-colors font-medium shadow-sm"
                    >
                      <PhonePeIcon />
                      <span>PhonePe</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpiAppClick('paytm')}
                      className="bg-[#0a0a0a] hover:bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white text-xs h-10 rounded-md flex items-center justify-center gap-2 transition-colors font-medium shadow-sm"
                    >
                      <PaytmIcon />
                      <span>Paytm</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500 pt-0.5">
                    If an app doesn't open or the payment doesn't go through, use the QR code above or copy the UPI ID instead.
                  </p>
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
              {form.coverPhoto && (
                <div className="w-full h-40 sm:h-52 overflow-hidden">
                  <img
                    src={form.coverPhoto}
                    alt="Form cover"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-0.5">
                        <div className="text-sm font-semibold text-zinc-200 leading-snug flex-1">
                          <MarkdownRenderer content={el.question} />
                        </div>
                        {el.required && <span className="text-red-500 shrink-0 mt-0.5 text-sm leading-none">*</span>}
                      </div>
                      {el.description && (
                        <div className="text-xs text-zinc-500 mt-1">
                          <MarkdownRenderer content={el.description} />
                        </div>
                      )}
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