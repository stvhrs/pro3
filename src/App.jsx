/**
 * ELKAPEDE 3.0 PRO - Integrated Single File React App
 * * Aplikasi Computer Based Test (CBT) sederhana menggunakan Firebase.
 * Mendukung 3 Role: Admin, Guru, dan Siswa.
 * Fitur: Realtime, Tanpa Login Rumit, Export PDF, Latex Support.
 * Update: Admin Login, Student PDF Download, Teacher Session LocalStorage (Cache).
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, User, LogOut, Settings, Play, 
  Plus, Trash2, Edit, X, Check, Eye, 
  ChevronRight, ArrowLeft, Clock, Users, 
  CheckCircle, AlertTriangle, Loader2, Copy,
  Bold, Italic, Underline, List, ListOrdered, Image as ImageIcon,
  Save, Home, FileText, Download, Grid, Filter, Share2, StopCircle,
  ChevronDown, Library, Monitor, Lock, History, Activity, Link
} from 'lucide-react';

// Firebase SDK Imports
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, getDoc, getDocs, doc, 
  updateDoc, onSnapshot, query, where, serverTimestamp, deleteDoc, orderBy, setDoc
} from "firebase/firestore";
import { 
  getAuth, signInWithCustomToken, signOut, 
  signInAnonymously, onAuthStateChanged, signInWithEmailAndPassword
} from "firebase/auth";

// ==========================================
// 1. CONFIGURATION & UTILS
// ==========================================

const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyBNZoi27IP1bMb65MVgKlQqEtYHfvkHD3Q",
      authDomain: "elkapede.firebaseapp.com",
      databaseURL: "https://elkapede-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "elkapede",
      storageBucket: "elkapede.firebasestorage.app",
      messagingSenderId: "969146186573",
      appId: "1:969146186573:web:ec3ac0b16b54635313d504"
    };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'elkapede-v23-pro-auth';

const getPublicCol = (col) => collection(db, 'artifacts', appId, 'public', 'data', col);
const getPublicDoc = (col, id) => doc(db, 'artifacts', appId, 'public', 'data', col, id);

// -- Helper: Update URL tanpa reload untuk persistensi state --
const updateURL = (params) => {
  const url = new URL(window.location);
  Object.keys(params).forEach(key => {
    if (params[key] === null) url.searchParams.delete(key);
    else url.searchParams.set(key, params[key]);
  });
  window.history.pushState({}, '', url);
};

// -- Helper: Load Script Eksternal (Tailwind & Katex) --
const useExternalResources = () => {
  useEffect(() => {
    if (!document.querySelector('script[src*="tailwindcss"]')) {
      const script = document.createElement('script');
      script.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(script);
    }
    if (!document.querySelector('link[href*="katex.min.css"]')) {
      const link = document.createElement('link');
      link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (!window.katex) {
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);
};

// -- PDF Generator Engine --
const generateExamPDF = (title, packet, studentName = null, studentAnswers = null, withKey = false) => {
  const printWindow = window.open('', '_blank');
  if(!printWindow) return alert("Izinkan pop-up untuk mengunduh PDF");
  
  // Safety check for metadata to avoid "undefined"
  const mapel = packet.mapel || '-';
  const kelas = packet.kelas || '-';
  const duration = packet.duration || 60;

  let content = packet.questions.map((q, i) => {
    const userAns = studentAnswers ? studentAnswers[q.id] : null;
    let answerDisplay = '';

    // Logika render jawaban berdasarkan tipe soal
    if (q.type === 'PG') {
      answerDisplay = q.options.map((opt, idx) => {
        const label = String.fromCharCode(65+idx);
        const isSelected = userAns === opt;
        const isCorrect = withKey && q.answer === opt;
        let style = 'padding: 4px 8px; margin-bottom: 4px; font-size: 13px; color: #1f2937;';
        if (isSelected) style += 'background-color: #fef9c3; border: 1px solid #fde047; font-weight: bold;'; 
        if (isCorrect) style += 'background-color: #dcfce7; border: 1px solid #86efac; color: #166534; font-weight: bold;';
        return `<div style="${style}"><span style="font-weight:bold; margin-right:8px;">${label}.</span> ${opt} ${isSelected ? '(Dipilih)' : ''} ${isCorrect ? '(Kunci)' : ''}</div>`;
      }).join('');
    }
    else if (q.type === 'PGK') {
      answerDisplay = q.options.map((opt) => {
        const isSelected = Array.isArray(userAns) && userAns.includes(opt);
        const isCorrect = withKey && q.answer && q.answer.includes(opt);
        let style = 'padding: 4px 8px; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; font-size: 13px; color: #1f2937;';
        if (isCorrect) style += 'color: #166534; font-weight: bold;';
        return `<div style="${style}"><span style="font-size: 1.2em;">${isSelected ? '☑' : '☐'}</span> <span>${opt}</span>${isCorrect ? '<span style="font-size:0.8em; margin-left:auto; color:green;">(Benar)</span>' : ''}</div>`;
      }).join('');
    }
    else if (q.type === 'MATCH') {
      if (!studentName) {
         answerDisplay = `<table style="width:100%; border-collapse:collapse; margin-top:10px; font-size: 13px; color: #1f2937;"><tr style="background:#f3f4f6;"><th style="border:1px solid #ddd; padding:8px;">Premis (Kiri)</th><th style="border:1px solid #ddd; padding:8px;">Pasangan (Kanan)</th></tr>${q.options.map(o => `<tr><td style="border:1px solid #ddd; padding:8px;">${o.left}</td><td style="border:1px solid #ddd; padding:8px;">${withKey ? o.right : '.....'}</td></tr>`).join('')}</table>`;
      } else {
         const pairs = Array.isArray(userAns) ? userAns : [];
         answerDisplay = `<div style="margin-top:10px; font-size: 13px; color: #1f2937;"><strong>Jawaban Siswa:</strong></div>`;
         if (pairs.length === 0) answerDisplay += `<div style="font-size: 13px; color: #4b5563;">(Tidak ada jawaban)</div>`;
         else answerDisplay += `<ul style="list-style-type: disc; margin-left: 20px; font-size: 13px; color: #1f2937;">${pairs.map(p => `<li>${p.left} ➜ <strong>${p.right}</strong></li>`).join('')}</ul>`;
      }
    }
    else if (q.type === 'MTF') {
      answerDisplay = `<table style="width:100%; border-collapse:collapse; margin-top:10px; font-size: 13px; color: #1f2937;"><tr style="background:#f3f4f6;"><th style="border:1px solid #ddd; padding:8px;">Pernyataan</th><th style="border:1px solid #ddd; padding:8px; width:80px; text-align:center;">Benar</th><th style="border:1px solid #ddd; padding:8px; width:80px; text-align:center;">Salah</th></tr>${q.options.map(o => {
           let bCheck = '☐', sCheck = '☐';
           if (studentName && userAns && userAns[o.text] === true) bCheck = '☑';
           if (studentName && userAns && userAns[o.text] === false) sCheck = '☑';
           let rowStyle = '';
           if (withKey) { rowStyle = 'background-color: #f0fdf4;'; if (o.answer === true) bCheck = '<b>(B)</b>'; else sCheck = '<b>(S)</b>'; }
           return `<tr style="${rowStyle}"><td style="border:1px solid #ddd; padding:8px;">${o.text}</td><td style="border:1px solid #ddd; padding:8px; text-align:center;">${bCheck}</td><td style="border:1px solid #ddd; padding:8px; text-align:center;">${sCheck}</td></tr>`;
        }).join('')}</table>`;
    }
    else if (q.type === 'ESSAY') {
       answerDisplay = `<div style="border:1px dashed #ccc; padding:10px; margin-top:10px; min-height:50px; background:#fafafa; font-size: 13px; color: #1f2937;">${studentName ? (userAns || '(Kosong)') : '(Area Jawaban Siswa)'}</div>`;
       if (withKey) answerDisplay += `<div style="margin-top:5px; color:#166534; font-size:13px;"><strong>Poin Penting:</strong> ${q.answer}</div>`;
    }

    let explanationHTML = '';
    if (withKey && q.explanation) explanationHTML = `<div style="margin-top:10px; padding:10px; background:#fefce8; border:1px solid #fde047; border-radius:4px; font-size:13px; color: #1f2937;"><strong>Pembahasan:</strong><br/>${q.explanation}</div>`;

    return `<div style="margin-bottom: 24px; break-inside: avoid;"><div style="font-weight: bold; margin-bottom: 6px; font-size: 14px; color: #111827;">Soal No. ${i+1} <span style="font-weight:normal; font-size:11px; background:#eee; padding:2px 6px; rounded:4px; color: #374151;">${q.type}</span></div><div style="margin-bottom: 10px; font-size: 14px; color: #374151;">${q.question}</div>${answerDisplay}${explanationHTML}</div>`;
  }).join('');

  // Menulis dokumen HTML untuk PDF
  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
        <style>
          body { padding: 30px; font-family: 'Segoe UI', sans-serif; font-size: 13px; line-height: 1.5; color: #1f2937; }
          img { max-width: 100%; height: auto; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
          @media print { body { -webkit-print-color-adjust: exact; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="position:fixed; top:20px; right:20px; z-index:100;">
           <button onclick="window.print()" style="background:#064e3b; color:white; padding:8px 16px; border:none; border-radius:6px; font-weight:bold; cursor:pointer; box-shadow:0 4px 6px rgba(0,0,0,0.1); display:flex; align-items:center; gap:8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2-2v5a2 2 0 0 1-2 2h-2"></path><path d="M6 14h12v8H6z"></path></svg> Cetak PDF</button>
        </div>
        <div style="text-align:center; border-bottom:3px solid #064e3b; padding-bottom:15px; margin-bottom:30px;">
          <h1 style="font-size:20px; font-weight:900; margin:0; color: #064e3b;">${packet.title}</h1>
          <p style="margin:5px 0 0; color: #3f6212; font-size: 13px;">Mapel: ${mapel} | Kelas: ${kelas} | Durasi: ${duration} Menit</p>
          ${studentName ? `<div style="margin-top:8px; font-size:14px; font-weight:bold; color:#064e3b; background:#ecfccb; display:inline-block; padding:4px 12px; border-radius:12px;">Siswa: ${studentName}</div>` : ''}
          ${withKey && !studentName ? `<div style="margin-top:8px; font-size:14px; font-weight:bold; color:#d97706;">KUNCI JAWABAN & PEMBAHASAN</div>` : ''}
        </div>
        ${content}
        <script>
          window.onload = function() {
             setTimeout(() => {
                const mathElements = document.body.innerHTML.match(/(\\$\\$[\\s\\S]*?\\$\\$|\\$[\\s\\S]*?\\$)/g);
                if(window.katex && mathElements) {
                   const traverse = (node) => {
                    if (node.nodeType === 3) { 
                      const text = node.nodeValue;
                      if (text.match(/(\\$\\$[\\s\\S]*?\\$\\$|\\$[\\s\\S]*?\\$)/)) {
                         const span = document.createElement('span');
                         const parts = text.split(/(\\$\\$[\\s\\S]*?\\$\\$|\\$[\\s\\S]*?\\$)/g);
                         parts.forEach(part => {
                            if (part.startsWith('$') && part.endsWith('$')) {
                               const math = part.startsWith('$$') ? part.slice(2, -2) : part.slice(1, -1);
                               const display = part.startsWith('$$');
                               const mSpan = document.createElement('span');
                               try { window.katex.render(math, mSpan, { displayMode: display, throwOnError: false }); } catch(e) {}
                               span.appendChild(mSpan);
                            } else { span.appendChild(document.createTextNode(part)); }
                         });
                         node.replaceWith(span);
                      }
                    } else { node.childNodes.forEach(child => traverse(child)); }
                  };
                  traverse(document.body);
               }
             }, 1000);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

const downloadPDF = (title, contentHTML) => {
  const printWindow = window.open('', '_blank');
  if(!printWindow) return alert("Pop-up diblokir. Izinkan pop-up untuk download.");
  printWindow.document.write(`
    <html>
      <head><title>${title}</title><script src="https://cdn.tailwindcss.com"></script></head>
      <body class="p-8 font-sans text-slate-800">
        <h1 class="text-2xl font-bold mb-4 border-b pb-2 text-emerald-900">${title}</h1>
        <div id="content">${contentHTML}</div>
        <script>window.onload=()=>{setTimeout(()=>window.print(),500)}</script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

// ==========================================
// 2. UI COMPONENTS & HOOKS
// ==========================================

// -- Snackbar (Toast Notification) --
const Snackbar = ({ message, type, isVisible, onClose }) => {
  if (!isVisible) return null;
  const bgClass = type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-900 text-white border border-emerald-800';
  const icon = type === 'error' ? <AlertTriangle size={18}/> : <CheckCircle size={18}/>;
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 font-medium text-sm animate-in slide-in-from-bottom-5 fade-in duration-300 ${bgClass}`}>
      {icon}<span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={14}/></button>
    </div>
  );
};

const useSnackbar = () => {
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => setSnackbar(prev => ({ ...prev, show: false })), 4000);
  };
  const closeToast = () => setSnackbar(prev => ({ ...prev, show: false }));
  return { snackbar, showToast, closeToast };
};

// -- Rich Text Editor (Simple) --
const RichEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);
  useEffect(() => { if (editorRef.current && editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value || ''; }, []);
  const exec = (cmd, val) => { document.execCommand(cmd, false, val); triggerChange(); };
  const triggerChange = () => onChange && onChange(editorRef.current.innerHTML);
  const handlePaste = (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        e.preventDefault(); const r = new FileReader();
        r.onload = (ev) => exec('insertImage', ev.target.result);
        r.readAsDataURL(item.getAsFile());
      }
    }
  };
  const handleImgClick = (e) => { if(e.target.tagName==='IMG') { const w=prompt("Ukuran (px/%):", e.target.style.width); if(w) { e.target.style.width=w; triggerChange(); }}};
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-emerald-400">
      <div className="flex gap-1 p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto">
        {[['bold',Bold],['italic',Italic],['underline',Underline],['insertOrderedList',ListOrdered],['insertUnorderedList',List]].map(([c,I])=><button key={c} onClick={()=>exec(c)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 flex-shrink-0"><I size={16}/></button>)}
        <button onClick={()=>{const u=prompt("URL:");if(u)exec('insertImage',u)}} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 flex-shrink-0"><ImageIcon size={16}/></button>
      </div>
      <div ref={editorRef} className="p-3 min-h-[100px] outline-none prose prose-sm max-w-none text-slate-700 text-sm" contentEditable onInput={triggerChange} onPaste={handlePaste} onClick={handleImgClick} />
    </div>
  );
};

// -- HTML & LaTeX Content Renderer --
const ContentRenderer = ({ html }) => {
  const ref = useRef(null);
  useEffect(() => {
    if(!ref.current || !html) return;
    ref.current.innerHTML = html;
    // Auto render latex symbols if exists
    if(window.katex) { 
        const traverse = (node) => {
        if (node.nodeType === 3) { 
          const text = node.nodeValue;
          if (text.match(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/)) {
             const span = document.createElement('span');
             const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
             parts.forEach(part => {
                if (part.startsWith('$') && part.endsWith('$')) {
                   const math = part.startsWith('$$') ? part.slice(2, -2) : part.slice(1, -1);
                   const display = part.startsWith('$$');
                   const mSpan = document.createElement('span');
                   try { window.katex.render(math, mSpan, { displayMode: display, throwOnError: false }); } catch(e) { mSpan.textContent = part; }
                   span.appendChild(mSpan);
                } else { span.appendChild(document.createTextNode(part)); }
             });
             node.replaceWith(span);
          }
        } else { node.childNodes.forEach(child => traverse(child)); }
      };
      traverse(ref.current);
    }
  }, [html]);
  return <div ref={ref} className="prose prose-sm max-w-none text-slate-800 break-words text-sm"/>;
};

// -- Standard UI Components --

const Button = ({ children, onClick, variant='primary', className='', icon:Icon, loading, ...props }) => (
  <button onClick={onClick} className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold tracking-wide transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed text-sm ${
    variant==='primary' ? 'bg-emerald-900 text-white hover:bg-emerald-800 shadow-md shadow-emerald-900/20' :
    variant==='secondary' ? 'bg-lime-400 text-emerald-900 hover:bg-lime-500 shadow-md shadow-lime-400/30' :
    variant==='outline' ? 'bg-white text-emerald-900 border border-emerald-900/10 hover:border-emerald-900/30 hover:bg-emerald-50' :
    variant==='ghost' ? 'bg-transparent text-emerald-900 hover:bg-emerald-50' :
    variant==='danger'  ? 'bg-white text-orange-600 border border-orange-100 hover:bg-orange-50 hover:border-orange-200' :
    'bg-slate-100 text-slate-600 hover:bg-slate-200'
  } ${className}`} disabled={loading} {...props}>
    {loading ? <Loader2 className="animate-spin" size={16}/> : (Icon && <Icon size={16} strokeWidth={2.5}/>)} 
    {children}
  </button>
);

const Card = ({children, title, action, className='', id=''}) => (
  <div id={id} className={`bg-white rounded-xl border border-slate-100 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 overflow-hidden ${className}`}>
    {(title||action) && (
      <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-white">
        {title && <h3 className="font-bold text-emerald-950 text-lg tracking-tight">{title}</h3>}
        <div>{action}</div>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const Input = ({label, ...props}) => (
  <div className="mb-4">
    {label && <label className="block text-xs font-black text-emerald-900 uppercase tracking-widest mb-1.5 ml-1">{label}</label>}
    <input className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 outline-none text-slate-800 font-medium transition-all placeholder:text-slate-400 bg-slate-50/50 focus:bg-white text-sm" {...props}/>
  </div>
);

const Select = ({label, options, icon:Icon, ...props}) => (
  <div className="w-full group">
    {label && <label className="block text-xs font-black text-emerald-900 uppercase tracking-widest mb-1.5 ml-1">{label}</label>}
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-900/40 group-focus-within:text-emerald-600 transition-colors">
        {Icon ? <Icon size={16}/> : <Filter size={16}/>}
      </div>
      <select className="w-full pl-10 pr-8 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 outline-none text-slate-800 font-bold bg-white appearance-none cursor-pointer transition-all text-sm" {...props}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-emerald-900 transition-colors" size={16} strokeWidth={3} />
    </div>
  </div>
);

const Modal = ({isOpen, onClose, title, children}) => { 
  if(!isOpen)return null; 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-white flex-shrink-0">
          <h3 className="font-bold text-lg text-emerald-950 tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-orange-500 transition-colors"><X size={20}/></button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  ); 
};

const Breadcrumbs = ({onGoHome, items}) => (
  <div className="flex items-center gap-2 text-sm text-slate-400 mb-6 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
    <button onClick={onGoHome} className="hover:text-emerald-800 flex items-center gap-2 font-bold transition-colors flex-shrink-0">
      <div className="p-1.5 bg-white rounded-xl shadow-sm border border-slate-100"><Home size={14} className="text-lime-600"/></div>
      <span className="hidden sm:inline text-xs">Beranda</span>
    </button>
    {items.map((it,i)=>(
      <React.Fragment key={i}>
        <div className="text-slate-300 flex-shrink-0"><ChevronRight size={12} strokeWidth={3}/></div>
        {it.onClick&&!it.active ? 
          <button onClick={it.onClick} className="hover:text-emerald-800 font-medium transition-colors flex-shrink-0 text-xs">{it.label}</button> : 
          <span className={`font-bold flex-shrink-0 ${it.active ? 'text-emerald-900 bg-lime-100 px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-wide' : 'text-xs'}`}>{it.label}</span>
        }
      </React.Fragment>
    ))}
  </div>
);

const CountdownDisplay = ({ startedAt, duration, onTimeUp, isActive }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  useEffect(() => {
    if (!isActive || !startedAt) { setTimeLeft(null); return; }
    let start;
    if (startedAt && typeof startedAt.toMillis === 'function') start = startedAt.toMillis();
    else if (startedAt && startedAt.seconds) start = startedAt.seconds * 1000;
    else start = new Date(startedAt).getTime();
    if (isNaN(start)) start = Date.now(); 

    const end = start + (duration * 60 * 1000);
    const tick = () => {
       const now = Date.now();
       const diff = end - now;
       if (diff <= 0) { setTimeLeft(0); if (onTimeUp) onTimeUp(); } else { setTimeLeft(diff); }
    };
    tick(); const interval = setInterval(tick, 1000); return () => clearInterval(interval);
  }, [startedAt, duration, isActive]);

  if (timeLeft === null) return <span className="font-mono text-slate-300 tracking-widest text-sm">--:--</span>;
  const m = Math.floor(timeLeft / 60000); const s = Math.floor((timeLeft % 60000) / 1000); const isCritical = timeLeft < 60000;
  return (<div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-xl border transition-all shadow-sm ${isCritical ? 'bg-orange-50 text-orange-600 border-orange-200 animate-pulse' : 'bg-white text-emerald-900 border-emerald-100'}`}><Clock size={20} className={isCritical?'text-orange-500':'text-lime-500'} strokeWidth={2.5} />{m.toString().padStart(2,'0')}:{s.toString().padStart(2,'0')}</div>);
};

const PacketPreview = ({ packet, onClose, onAction, actionLabel, actionIcon:ActionIcon }) => {
  return (
    <div className="max-w-4xl mx-auto pb-24 px-4">
       <div className="flex gap-4 mb-6 items-center">
          <Button variant="ghost" onClick={onClose} icon={ArrowLeft}>Kembali</Button>
          <div className="flex-1">
             <h2 className="font-bold text-lg text-emerald-950">Preview: {packet.title}</h2>
             <p className="text-slate-500 text-xs">{packet.mapel} • Kelas {packet.kelas} • {packet.duration} Menit</p>
          </div>
          {onAction && <Button onClick={onAction} icon={ActionIcon} variant="secondary">{actionLabel}</Button>}
       </div>
       <Card className="mb-6 border border-emerald-900/5">
          <div className="space-y-8">
             {packet.questions.map((q,i)=>(
                <div key={i} className="border-b pb-6 last:border-0 border-slate-100">
                   <div className="flex items-center gap-3 mb-3">
                      <span className="bg-emerald-900 text-white text-xs font-bold w-8 h-8 flex items-center justify-center rounded-lg shadow-md shadow-emerald-900/10">{i+1}</span>
                      <span className="bg-lime-100 text-emerald-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wide">{q.type}</span>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-xl mb-4 text-slate-800 leading-relaxed border border-slate-100 text-sm"><ContentRenderer html={q.question}/></div>
                   <div className="pl-4 border-l-2 border-slate-100 mb-4 space-y-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Kunci Jawaban</div>
                      {q.type === 'PG' && (
                         <div className="grid gap-2">
                            {q.options.map((opt, idx) => (
                               <div key={idx} className={`flex gap-3 text-sm p-2 rounded-lg border ${opt === q.answer ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 opacity-60'}`}>
                                  <div className={`font-bold ${opt === q.answer ? 'text-emerald-700' : 'text-slate-400'}`}>{String.fromCharCode(65+idx)}.</div>
                                  <div className="flex-1"><ContentRenderer html={opt}/></div>
                                  {opt === q.answer && <CheckCircle size={16} className="text-emerald-600"/>}
                               </div>
                            ))}
                         </div>
                      )}
                      {q.type === 'PGK' && (
                         <div className="grid gap-2">
                            {q.options.map((opt, idx) => {
                               const isCorrect = q.answer && q.answer.includes(opt);
                               return (
                                  <div key={idx} className={`flex gap-3 text-sm p-2 rounded-lg border ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 opacity-60'}`}>
                                     <div className={`font-bold ${isCorrect ? 'text-emerald-700' : 'text-slate-400'}`}>{isCorrect ? '☑' : '☐'}</div>
                                     <div className="flex-1"><ContentRenderer html={opt}/></div>
                                  </div>
                               )
                            })}
                         </div>
                      )}
                      {q.type === 'MATCH' && (
                         <div className="bg-white border border-slate-100 rounded-lg overflow-hidden">
                            {q.options.map((pair, idx) => (
                               <div key={idx} className="flex items-center gap-2 p-2 border-b last:border-0 text-sm">
                                  <div className="flex-1 font-medium text-slate-700">{pair.left}</div>
                                  <div className="text-emerald-500"><ArrowLeft size={14} className="rotate-180"/></div>
                                  <div className="flex-1 font-bold text-emerald-800">{pair.right}</div>
                               </div>
                            ))}
                         </div>
                      )}
                      {q.type === 'MTF' && (
                         <div className="border border-slate-100 rounded-lg overflow-hidden">
                            <table className="w-full text-xs text-left">
                               <thead className="bg-slate-50 text-slate-500 font-bold uppercase"><tr><th className="p-2">Pernyataan</th><th className="p-2 w-20 text-center">Status</th></tr></thead>
                               <tbody>
                                  {q.options.map((opt, idx) => (
                                     <tr key={idx} className="border-t border-slate-100">
                                        <td className="p-2 text-slate-700"><ContentRenderer html={opt.text}/></td>
                                        <td className="p-2 text-center"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${opt.answer ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{opt.answer ? 'BENAR' : 'SALAH'}</span></td>
                                     </tr>
                                  ))}
                               </tbody>
                            </table>
                         </div>
                      )}
                      {q.type === 'ESSAY' && <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg text-sm text-emerald-900">{q.answer}</div>}
                   </div>
                   <div className="bg-orange-50 p-4 rounded-xl border border-orange-100/50 flex gap-3">
                      <div className="mt-0.5 text-orange-500"><BookOpen size={16}/></div>
                      <div className="flex-1">
                         <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Pembahasan</div>
                         <div className="text-sm text-slate-700 leading-relaxed"><ContentRenderer html={q.explanation}/></div>
                      </div>
                   </div>
                </div>
             ))}
          </div>
       </Card>
    </div>
  );
};

// ==========================================
// 3. ADMIN MODULE
// ==========================================

const AdminDashboard = ({ onGoHome, user }) => {
  const [view, setView] = useState('list');
  const [packets, setPackets] = useState([]);
  const [currentPacket, setCurrentPacket] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [meta, setMeta] = useState({ title: '', mapel: 'Matematika', jenjang: 'SMA', kelas: '12', duration: 60 });
  const [activeTab, setActiveTab] = useState('All');
  const [filterMapel, setFilterMapel] = useState('All');
  const [filterKelas, setFilterKelas] = useState('All');
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const { snackbar, showToast, closeToast } = useSnackbar();

  useEffect(() => {
    if (!user) return;
    const unsubPackets = onSnapshot(getPublicCol("packets"), (s) => setPackets(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubSubjects = onSnapshot(getPublicCol("subjects"), (s) => setSubjects(s.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { unsubPackets(); unsubSubjects(); };
  }, [user]);

  const uniqueMapels = ['All', ...new Set(packets.map(p => p.mapel).filter(Boolean))];
  const uniqueClasses = ['All', ...new Set(packets.map(p => p.kelas).filter(Boolean))].sort();
  const filteredPackets = packets.filter(p => (activeTab==='All'||p.jenjang===activeTab) && (filterMapel==='All'||p.mapel===filterMapel) && (filterKelas==='All'||p.kelas===filterKelas));

  const handleAddSubject = async () => {
    if(!newSubject.trim()) return showToast("Nama mapel tidak boleh kosong", 'error');
    setLoading(true);
    try {
        await addDoc(getPublicCol("subjects"), { name: newSubject.trim(), createdAt: serverTimestamp() });
        setNewSubject('');
        showToast("Mapel berhasil ditambahkan");
    } catch(e) { showToast("Gagal: " + e.message, 'error'); } 
    finally { setLoading(false); }
  };

  const handleDeleteSubject = async (id) => {
    if(confirm("Hapus mapel ini?")) await deleteDoc(getPublicDoc("subjects", id));
  };

  const getExampleQuestions = () => [
    { 
      id: '1', type: 'PG', 
      question: 'Tentukan hasil dari limit berikut: $$\\lim_{x \\to 0} \\frac{x^2 \\sin(1/x) + \\tan(x)}{x}$$ dan integral $$\\int_0^{\\pi} \\sin^2(x) dx$$', 
      options: ['0', '1', '$$\\pi/2$$', '$$\\infty$$', 'Tidak ada'], answer: '1', explanation: 'Gunakan aturan L\'Hopital untuk limit dan identitas trigonometri untuk integral.' 
    },
    { 
      id: '2', type: 'PGK', 
      question: 'Manakah dari berikut ini yang merupakan besaran vektor? (Pilih lebih dari satu)', 
      options: ['Kecepatan', 'Laju', 'Gaya', 'Massa'], answer: ['Kecepatan', 'Gaya'], explanation: 'Vektor memiliki nilai dan arah. Kecepatan dan Gaya punya arah, sedangkan Laju dan Massa hanya skalar.' 
    },
    { 
      id: '3', type: 'MATCH', 
      question: 'Pasangkan organel sel berikut dengan fungsinya yang tepat!', 
      options: [{left:'Mitokondria',right:'Respirasi Sel'},{left:'Ribosom',right:'Sintesis Protein'},{left:'Kloroplas',right:'Fotosintesis'}], answer: null, explanation: 'Mitokondria = energi, Ribosom = protein, Kloroplas = fotosintesis pada tumbuhan.' 
    },
    { 
      id: '4', type: 'MTF', 
      question: 'Tentukan kebenaran pernyataan di bawah ini:', 
      options: [{text:'Virus termasuk makhluk hidup seluler', answer: false}, {text:'Bakteri memiliki dinding sel peptidoglikan', answer: true}], explanation: 'Virus bersifat aseluler (bukan sel). Bakteri (Eubacteria) memiliki dinding sel peptidoglikan.' 
    },
    { 
      id: '5', type: 'ESSAY', 
      question: 'Jelaskan secara singkat proses terjadinya hujan asam!', 
      answer: 'SO2 dan NOx bereaksi dengan uap air membentuk asam.', explanation: 'Gas sulfur dioksida dan nitrogen oksida dari polusi bereaksi dengan air di atmosfer membentuk asam sulfat dan nitrat.' 
    }
  ];

  const handleSave = async () => {
    if (!meta.title) return showToast("Isi judul paket!", 'error');
    if (!meta.mapel) return showToast("Pilih mata pelajaran!", 'error');
    setLoading(true);
    try {
        const data = { ...meta, questions, updatedAt: serverTimestamp(), authorId: user.uid };
        if (currentPacket?.id) await updateDoc(getPublicDoc("packets", currentPacket.id), data);
        else await addDoc(getPublicCol("packets"), { ...data, createdAt: serverTimestamp() });
        showToast("Paket berhasil disimpan");
        setView('list');
    } catch(e) { showToast("Gagal menyimpan: "+e.message, 'error'); }
    finally { setLoading(false); }
  };

  const addQuestion = (type) => {
    let newQ = { id: Date.now().toString(), type, question: 'Soal Baru...', answer: null, explanation: 'Pembahasan...', options: [] };
    if(type==='PG') { newQ.options=['A','B','C','D','E']; newQ.answer='A'; }
    else if(type==='PGK') { newQ.options=['A','B','C','D']; newQ.answer=['A']; }
    else if(type==='MATCH') newQ.options=[{left:'Kiri',right:'Kanan'}];
    else if(type==='MTF') newQ.options=[{text:'Pernyataan',answer:true}];
    else newQ.answer='Kunci Jawaban';
    setQuestions([...questions, newQ]);
  };

  const updateQ = (idx, field, val) => { const n=[...questions]; n[idx][field]=val; setQuestions(n); };

  if (view === 'editor') {
    return (
      <div className="max-w-5xl mx-auto pb-24 px-4">
        <Snackbar {...snackbar} onClose={closeToast} />
        <Breadcrumbs onGoHome={onGoHome} items={[{ label: 'Admin', onClick: () => setView('list') }, { label: currentPacket ? 'Edit' : 'Baru', active: true }]} />
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 sticky top-4 z-40 bg-white/90 backdrop-blur-md p-4 rounded-xl border border-emerald-100 shadow-xl gap-4">
           <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setView('list')} icon={ArrowLeft} className="px-3">Kembali</Button>
              <h2 className="font-bold text-lg text-emerald-950">Editor Paket Soal</h2>
           </div>
           <Button onClick={handleSave} icon={Save} loading={loading}>Simpan Paket</Button>
        </div>
        <Card title="Informasi Paket" className="mb-6">
           <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2"><Input label="Judul Paket" value={meta.title} onChange={e=>setMeta({...meta,title:e.target.value})} placeholder="Contoh: Tryout Biologi"/></div>
              <div>
                  <label className="block text-xs font-black text-emerald-900 uppercase tracking-widest mb-1.5 ml-1">Mapel</label>
                  <select className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none bg-white text-sm" value={meta.mapel} onChange={e=>setMeta({...meta,mapel:e.target.value})}>
                        <option value="">-- Pilih --</option>
                        {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
              </div>
              <Select label="Jenjang" options={[{value:'SD',label:'SD'},{value:'SMP',label:'SMP'},{value:'SMA',label:'SMA'},{value:'Umum',label:'Umum'}]} value={meta.jenjang} onChange={e=>setMeta({...meta,jenjang:e.target.value})}/>
              <Input label="Kelas" value={meta.kelas} onChange={e=>setMeta({...meta,kelas:e.target.value})} placeholder="12"/>
           </div>
        </Card>
        <div className="space-y-6">
           {questions.map((q, i) => (
              <Card key={q.id} title={`Soal Nomor ${i+1}`} action={<button onClick={()=>setQuestions(questions.filter((_,x)=>x!==i))} className="text-orange-500 hover:bg-orange-50 p-2 rounded-xl"><Trash2 size={16}/></button>}>
                 <div className="space-y-4">
                    <div>
                       <span className="inline-block px-3 py-1 bg-lime-100 text-emerald-900 text-[10px] font-black rounded-lg mb-2 uppercase tracking-wide">{q.type}</span>
                       <RichEditor value={q.question} onChange={v=>updateQ(i,'question',v)} placeholder="Tulis pertanyaan disini..."/>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                       <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">Opsi Jawaban & Kunci</label>
                       {q.type==='PG' && q.options.map((o,x)=>(<div key={x} className="flex gap-3 mb-3 items-start"><input type="radio" className="mt-3 w-4 h-4 text-emerald-600 focus:ring-emerald-500" checked={q.answer===o} onChange={()=>updateQ(i,'answer',o)}/><div className="flex-1"><RichEditor value={o} onChange={v=>{const n=[...q.options];n[x]=v;updateQ(i,'options',n);if(q.answer===o)updateQ(i,'answer',v)}}/></div></div>))}
                       {q.type==='PGK' && q.options.map((o,x)=>(<div key={x} className="flex gap-3 mb-3 items-start"><input type="checkbox" className="mt-3 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" checked={q.answer.includes(o)} onChange={()=>{const a=[...q.answer];if(a.includes(o))updateQ(i,'answer',a.filter(z=>z!==o));else updateQ(i,'answer',[...a,o])}}/><div className="flex-1"><RichEditor value={o} onChange={v=>{const n=[...q.options];const old=n[x];n[x]=v;updateQ(i,'options',n);if(q.answer.includes(old))updateQ(i,'answer',q.answer.map(z=>z===old?v:z))}}/></div></div>))}
                       {q.type==='MATCH' && <div>{q.options.map((p,x)=>(<div key={x} className="flex gap-3 mb-3"><input className="border p-2 w-1/2 rounded-xl text-sm" value={p.left} onChange={e=>{const n=[...q.options];n[x].left=e.target.value;updateQ(i,'options',n)}} placeholder="Kiri"/><input className="border p-2 w-1/2 rounded-xl text-sm" value={p.right} onChange={e=>{const n=[...q.options];n[x].right=e.target.value;updateQ(i,'options',n)}} placeholder="Kanan"/><button onClick={()=>{const n=q.options.filter((_,z)=>z!==x);updateQ(i,'options',n)}}><X size={16}/></button></div>))}<Button variant="ghost" className="text-xs text-lime-600" onClick={()=>updateQ(i,'options',[...q.options,{left:'',right:''}])}>+ Pasangan</Button></div>}
                       {q.type==='MTF' && <div>{q.options.map((p,x)=>(<div key={x} className="flex gap-3 mb-3 items-center"><RichEditor value={p.text} onChange={v=>{const n=[...q.options];n[x].text=v;updateQ(i,'options',n)}}/><select value={p.answer} onChange={e=>{const n=[...q.options];n[x].answer=(e.target.value==='true');updateQ(i,'options',n)}} className="border p-2 rounded-xl text-sm"><option value="true">Benar</option><option value="false">Salah</option></select><button onClick={()=>{const n=q.options.filter((_,z)=>z!==x);updateQ(i,'options',n)}}><X size={16}/></button></div>))}<Button variant="ghost" className="text-xs text-lime-600" onClick={()=>updateQ(i,'options',[...q.options,{text:'Pernyataan',answer:true}])}>+ Pernyataan</Button></div>}
                       {q.type==='ESSAY' && <textarea className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-lime-400/20 outline-none text-sm" rows={3} value={q.answer} onChange={e=>updateQ(i,'answer',e.target.value)} placeholder="Tuliskan kunci jawaban esai di sini..."/>}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                       <label className="text-xs font-black text-orange-600 uppercase tracking-widest mb-2 block">Pembahasan</label>
                       <RichEditor value={q.explanation} onChange={v=>updateQ(i,'explanation',v)}/>
                    </div>
                 </div>
              </Card>
           ))}
           <div className="grid grid-cols-5 gap-2 sticky bottom-6 p-2 rounded-xl bg-white/80 backdrop-blur shadow-xl border border-slate-100">
              {[
                { type: 'PG', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                { type: 'PGK', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
                { type: 'MATCH', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
                { type: 'MTF', color: 'bg-rose-100 text-rose-700 hover:bg-rose-200' },
                { type: 'ESSAY', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' }
              ].map(t => (
                <button key={t.type} onClick={() => addQuestion(t.type)} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-bold text-[10px] sm:text-xs transition-all active:scale-95 ${t.color}`}>
                  <Plus size={14} strokeWidth={3}/> {t.type}
                </button>
              ))}
           </div>
        </div>
      </div>
    );
  }

  if (view === 'mapel') {
    return (
      <div className="max-w-4xl mx-auto px-4">
         <Breadcrumbs onGoHome={onGoHome} items={[{ label: 'Admin', onClick: () => setView('list') }, { label: 'Kelola Mapel', active: true }]} />
         <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black text-emerald-950 tracking-tight">Daftar Mata Pelajaran</h1>
            <Button onClick={() => setView('list')} variant="ghost" icon={ArrowLeft}>Kembali</Button>
         </div>
         <div className="grid md:grid-cols-3 gap-6">
            <Card title="Tambah Baru" className="h-fit">
               <div className="flex flex-col gap-3">
                  <input className="w-full border border-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 transition-all text-sm" placeholder="Nama Mapel (ex: Fisika)" value={newSubject} onChange={e => setNewSubject(e.target.value)}/>
                  <Button onClick={handleAddSubject} icon={Plus} variant="secondary" className="w-full" loading={loading}>Simpan</Button>
               </div>
            </Card>
            <div className="md:col-span-2">
               <Card title={`Total Mapel: ${subjects.length}`}>
                  <div className="grid grid-cols-1 gap-3">
                     {subjects.map(s => (
                        <div key={s.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl group hover:bg-white hover:border-lime-200 hover:shadow-sm hover:-translate-y-0.5 transition-all">
                           <span className="font-bold text-slate-700 text-sm">{s.name}</span>
                           <button onClick={() => handleDeleteSubject(s.id)} className="text-slate-300 hover:text-orange-500 p-2 rounded-lg hover:bg-orange-50 transition-colors"><Trash2 size={16}/></button>
                        </div>
                     ))}
                     {subjects.length === 0 && <div className="text-slate-400 italic text-center py-8 bg-slate-50 rounded-xl border border-dashed text-sm">Belum ada mata pelajaran.</div>}
                  </div>
               </Card>
            </div>
         </div>
      </div>
    );
  }

  if (view === 'preview') {
      return (
          <PacketPreview 
            packet={currentPacket} 
            onClose={() => setView('list')} 
            onAction={() => { setMeta(currentPacket); setQuestions(currentPacket.questions); setView('editor'); }} 
            actionLabel="Edit Paket" 
            actionIcon={Edit}
          />
      );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
       <Snackbar {...snackbar} onClose={closeToast} />
       <Breadcrumbs onGoHome={onGoHome} items={[{label:'Admin',active:true}]}/>
       <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-emerald-950 tracking-tight mb-1">Bank Soal</h1>
            <p className="text-slate-500 text-sm">Kelola paket soal dan materi ujian.</p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" icon={Library} onClick={() => setView('mapel')}>Mapel</Button>
             <Button icon={Plus} variant="secondary" onClick={()=>{setCurrentPacket(null);setQuestions(getExampleQuestions());setMeta({title:'',mapel:'Matematika',jenjang:'SMA',kelas:'12',duration:60});setView('editor')}}>Buat Paket</Button>
          </div>
       </div>
       
       <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-lg shadow-slate-200/50 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="flex gap-2 overflow-x-auto pb-2">
                {['All','SD','SMP','SMA','Umum'].map(j=>(
                   <button key={j} onClick={()=>setActiveTab(j)} className={`px-5 py-2.5 rounded-xl text-xs font-bold border flex-shrink-0 ${activeTab===j?'bg-emerald-900 text-white':'bg-white text-slate-400'}`}>{j}</button>
                ))}
             </div>
             <div className="grid grid-cols-2 gap-4">
                <Select label="Mata Pelajaran" icon={BookOpen} value={filterMapel} onChange={e=>setFilterMapel(e.target.value)} options={uniqueMapels.map(m=>({value:m,label:m}))} />
                <Select label="Kelas" icon={Filter} value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} options={uniqueClasses.map(c=>({value:c,label:`Kelas ${c}`}))} />
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredPackets.map(p=>(
             <Card key={p.id}>
                <h3 className="font-bold text-lg mb-2 text-slate-800">{p.title}</h3>
                <div className="grid grid-cols-2 gap-2 mt-4">
                   <Button onClick={()=>{setMeta(p);setQuestions(p.questions||[]);setView('editor')}} className="text-[10px]" icon={Edit} variant="outline">Edit</Button>
                   <Button onClick={async()=>{if(confirm('Hapus?'))await deleteDoc(getPublicDoc("packets",p.id))}} className="text-[10px]" icon={Trash2} variant="danger">Hapus</Button>
                </div>
                 <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-50">
                    <button onClick={() => generateExamPDF(p.title, p, null, null, false)} className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500 hover:text-emerald-800 border border-slate-100 rounded py-1 hover:bg-slate-50 transition-all"><FileText size={12}/> PDF Soal</button>
                    <button onClick={() => generateExamPDF(p.title, p, null, null, true)} className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500 hover:text-emerald-800 border border-slate-100 rounded py-1 hover:bg-slate-50 transition-all"><CheckCircle size={12}/> PDF Kunci</button>
                 </div>
             </Card>
          ))}
       </div>
    </div>
  );
};

// ==========================================
// 4. TEACHER MODULE
// ==========================================

const TeacherDashboard = ({ onGoHome, user }) => {
  // 'browse' | 'active' | 'history' | 'lobby' | 'preview'
  const [view, setView] = useState('browse'); 
  const [activeTab, setActiveTab] = useState('browse'); 
  
  const [packets, setPackets] = useState([]);
  const [localSessions, setLocalSessions] = useState([]);
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPkt, setSelectedPkt] = useState(null);
  const [form, setForm] = useState({teacher:'', school:''});
  const [customDuration, setCustomDuration] = useState(60); 
  const [filterMapel, setFilterMapel] = useState('All');
  const [filterKelas, setFilterKelas] = useState('All');
  const [loading, setLoading] = useState(false);
  const { snackbar, showToast, closeToast } = useSnackbar();

  // Initial Load from Local Storage & Firestore Packets
  useEffect(() => {
    // Load local sessions
    const savedSessions = localStorage.getItem('elkapede_teacher_sessions');
    if (savedSessions) {
        setLocalSessions(JSON.parse(savedSessions));
    }

    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('roomId');
    if (roomId) {
        getDoc(getPublicDoc("rooms", roomId)).then(doc => { if (doc.exists()) { setRoom({ id: doc.id, ...doc.data() }); setView('lobby'); } });
    }
    
    // Listen to packets
    const unsub = onSnapshot(getPublicCol("packets"), s => setPackets(s.docs.map(d=>({id:d.id,...d.data()}))));
    return () => unsub();
  }, []);

  // Sync Players when in Lobby
  useEffect(() => {
    if (room?.id) {
       updateURL({ role: 'teacher', roomId: room.id });
       const uPlayers = onSnapshot(query(getPublicCol("players"), where("roomId","==",room.id)), s => setPlayers(s.docs.map(d=>({id:d.id,...d.data()}))));
       const uRoom = onSnapshot(getPublicDoc("rooms", room.id), d => {
           if(d.exists()) {
               const data = d.data();
               setRoom(prev => ({...prev, ...data}));
               
               // Also update local cache status if changed externally (optional, but good for sync)
               if(data.status === 'FINISHED') {
                   updateLocalSessionStatus(room.id, 'FINISHED');
               }
           }
       });
       return () => { uPlayers(); uRoom(); };
    }
  }, [room?.id]);

  const updateLocalSessionStatus = (roomId, newStatus) => {
      setLocalSessions(prev => {
          const updated = prev.map(s => s.id === roomId ? { ...s, status: newStatus } : s);
          localStorage.setItem('elkapede_teacher_sessions', JSON.stringify(updated));
          return updated;
      });
  };

  const uniqueMapels = ['All', ...new Set(packets.map(p => p.mapel).filter(Boolean))];
  const uniqueClasses = ['All', ...new Set(packets.map(p => p.kelas).filter(Boolean))].sort();
  const filteredPackets = packets.filter(p => (filterMapel==='All'||p.mapel===filterMapel) && (filterKelas==='All'||p.kelas===filterKelas));

  const activeSessions = localSessions.filter(r => r.status !== 'FINISHED').sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  const finishedSessions = localSessions.filter(r => r.status === 'FINISHED').sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const createRoom = async () => {
     if(!form.school || !form.teacher) return showToast("Lengkapi data Guru dan Sekolah!", 'error');
     setLoading(true);
     try {
        const code = Math.random().toString(36).substring(2,8).toUpperCase();
        const { id, ...packetData } = selectedPkt; 
        const now = serverTimestamp();
        
        // Data to save to Firestore
        const newRoomData = { 
           ...packetData, 
           code, 
           packetId: selectedPkt.id, 
           packetTitle: selectedPkt.title, 
           teacherId: user.uid, 
           teacherName: form.teacher, 
           schoolName: form.school, 
           status: 'WAITING', 
           createdAt: now, 
           duration: customDuration, 
        };
        
        const ref = await addDoc(getPublicCol("rooms"), newRoomData);
        
        // Data to save to Local Storage (Client-side timestamp for immediate display)
        const localRoomData = {
            id: ref.id,
            ...newRoomData,
            createdAt: { seconds: Date.now() / 1000 } // Simulate Firestore timestamp locally
        };

        // Update Local State & Storage immediately
        const newLocalSessions = [localRoomData, ...localSessions];
        setLocalSessions(newLocalSessions);
        localStorage.setItem('elkapede_teacher_sessions', JSON.stringify(newLocalSessions));

        setRoom(localRoomData);
        setView('lobby'); 
        setShowModal(false);
        showToast("Ruang ujian berhasil dibuat!");
     } catch(e) { showToast("Gagal membuat room: " + e.message, 'error'); } 
     finally { setLoading(false); }
  };

  const endSession = async () => {
      if(!room) return;
      
      // Update Local State Immediately
      updateLocalSessionStatus(room.id, 'FINISHED');
      
      // Update Firestore asynchronously
      try {
          await updateDoc(getPublicDoc("rooms", room.id), { status: 'FINISHED' });
          showToast("Sesi diakhiri.");
      } catch(e) {
          console.error("Failed to update firestore", e);
      }
  };

  const copyLink = async () => {
     const url = `${window.location.origin}${window.location.pathname}?code=${room.code}`;
     try {
        await navigator.clipboard.writeText(url);
        showToast("Link ujian berhasil disalin!");
     } catch(e) { showToast("Gagal menyalin link.", 'error'); }
  };

  const handleGoHome = () => {
      updateURL({ role: null, roomId: null });
      onGoHome();
  }

  if (view === 'preview') return (
      <PacketPreview 
        packet={selectedPkt} 
        onClose={() => setView('browse')} 
        onAction={() => {setCustomDuration(selectedPkt.duration); setShowModal(true);}} 
        actionLabel="Buat Sesi Ujian" 
        actionIcon={Play}
      />
  );

  if (view === 'lobby') return (
     <div className="max-w-7xl mx-auto px-4 pb-20">
        <Snackbar {...snackbar} onClose={closeToast} />
        <Breadcrumbs onGoHome={handleGoHome} items={[{label:'Guru',onClick:()=>setView('browse')},{label:'Lobby',active:true}]}/>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2">
              <Card title={`Peserta (${players.length})`}>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {players.length > 0 ? players.map(p => (
                       <div key={p.id} className="border p-4 rounded-xl text-center bg-slate-50">
                          <div className="font-bold text-slate-800">{p.name}</div>
                          <div className="text-xs text-slate-500">{p.status}</div>
                          {p.status === 'submitted' && (
                              <div className="mt-2 pt-2 border-t border-slate-200">
                                <div className="text-xl font-bold text-emerald-600 mb-1">{p.score?.toFixed(0)}</div>
                                <button onClick={()=>generateExamPDF(room.packetTitle, {questions: room.questions, ...room}, p.name, p.answers, false)} className="text-[10px] text-blue-600 hover:underline">Unduh LJK</button>
                              </div>
                          )}
                       </div>
                    )) : <div className="col-span-full text-center text-slate-400 py-8">Belum ada peserta bergabung</div>}
                 </div>
              </Card>
           </div>
           <div>
              <Card title="Kontrol">
                 <div className="text-center p-6 bg-slate-50 rounded-xl mb-4">
                    <div onClick={copyLink} className="text-5xl font-black text-emerald-900 font-mono cursor-pointer hover:scale-105 transition-transform">{room.code}</div>
                    <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mt-2">
                        <Link size={12}/> Link: {window.location.origin}...{room.code}
                    </div>
                 </div>
                 {room.status === 'WAITING' && <Button onClick={()=>{
                     // Start Exam: Update local & firestore
                     updateDoc(getPublicDoc("rooms",room.id),{status:'PLAYING',startedAt:serverTimestamp()});
                     updateLocalSessionStatus(room.id, 'PLAYING');
                 }} className="w-full" variant="secondary" icon={Play}>Mulai Ujian</Button>}
                 
                 {room.status === 'PLAYING' && (
                    <>
                        <div className="mb-4 text-center animate-pulse text-emerald-600 font-bold">UJIAN BERLANGSUNG</div>
                        <Button onClick={endSession} className="w-full" variant="danger" icon={StopCircle}>Akhiri Sesi</Button>
                    </>
                 )}
                 {(room.status === 'FINISHED') && (
                     <div className="mt-4 pt-4 border-t border-slate-100">
                         <div className="text-center text-xs text-slate-400 mb-3 font-bold uppercase tracking-widest">Sesi Berakhir</div>
                         <Button onClick={() => {
                             let html = `<h2 style="text-align:center;">Rekap Nilai</h2><table style="width:100%; border-collapse:collapse;"><thead><tr style="background:#f0fdf4"><th style="border:1px solid #ddd; padding:8px">Nama</th><th style="border:1px solid #ddd; padding:8px">Nilai</th></tr></thead><tbody>${players.map(p=>`<tr><td style="border:1px solid #ddd; padding:8px">${p.name}</td><td style="border:1px solid #ddd; padding:8px; font-weight:bold">${p.score?.toFixed(0)||0}</td></tr>`).join('')}</tbody></table>`;
                             downloadPDF(`Rekap_${room.code}`, html);
                         }} className="w-full text-xs" variant="outline" icon={Download}>Download Rekap PDF</Button>
                     </div>
                 )}
              </Card>
           </div>
        </div>
     </div>
  );

  return (
     <div className="max-w-7xl mx-auto px-4 py-6">
        <Snackbar {...snackbar} onClose={closeToast} />
        <Breadcrumbs onGoHome={onGoHome} items={[{label:'Portal Guru',active:true}]}/>
        
        {/* -- TEACHER TABS -- */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 overflow-x-auto">
            <button onClick={() => setActiveTab('browse')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'browse' ? 'border-emerald-600 text-emerald-900' : 'border-transparent text-slate-400 hover:text-emerald-700'}`}>
                <div className="flex items-center gap-2"><BookOpen size={16}/> Bank Soal</div>
            </button>
            <button onClick={() => setActiveTab('active')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'active' ? 'border-emerald-600 text-emerald-900' : 'border-transparent text-slate-400 hover:text-emerald-700'}`}>
                <div className="flex items-center gap-2">
                    <Activity size={16} className={activeSessions.length > 0 ? "text-lime-500 animate-pulse" : ""}/> 
                    Sesi Aktif ({activeSessions.length})
                </div>
            </button>
            <button onClick={() => setActiveTab('history')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'history' ? 'border-emerald-600 text-emerald-900' : 'border-transparent text-slate-400 hover:text-emerald-700'}`}>
                <div className="flex items-center gap-2"><History size={16}/> Riwayat</div>
            </button>
        </div>

        {activeTab === 'browse' && (
            <>
                {/* Filter */}
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm mb-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Select label="Mata Pelajaran" icon={BookOpen} value={filterMapel} onChange={e=>setFilterMapel(e.target.value)} options={uniqueMapels.map(m=>({value:m,label:m}))} />
                        <Select label="Kelas" icon={Filter} value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} options={uniqueClasses.map(c=>({value:c,label:`Kelas ${c}`}))} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredPackets.length > 0 ? filteredPackets.map(p => (
                    <Card key={p.id}>
                        <h3 className="font-bold text-lg text-slate-800">{p.title}</h3>
                        <p className="text-xs text-slate-400 mt-1 mb-4">{p.mapel} • Kelas {p.kelas}</p>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={()=>{setSelectedPkt(p);setView('preview')}} className="flex-1 text-[10px]" icon={Eye}>Lihat</Button>
                            <Button onClick={()=>{setSelectedPkt(p); setCustomDuration(p.duration); setShowModal(true);}} className="flex-1 text-[10px]" icon={Play} variant="secondary">Buat Sesi</Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-50">
                            <button onClick={() => generateExamPDF(p.title, p, null, null, false)} className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500 hover:text-emerald-800 border border-slate-100 rounded py-2 hover:bg-slate-50 transition-all"><FileText size={12}/> PDF Soal</button>
                            <button onClick={() => generateExamPDF(p.title, p, null, null, true)} className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500 hover:text-emerald-800 border border-slate-100 rounded py-2 hover:bg-slate-50 transition-all"><CheckCircle size={12}/> PDF Kunci</button>
                        </div>
                    </Card>
                )) : <div className="col-span-full text-center text-slate-400 py-12 border-2 border-dashed rounded-xl">Belum ada paket soal.</div>}
                </div>
            </>
        )}

        {activeTab === 'active' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {activeSessions.map(r => (
                     <div key={r.id} onClick={() => { setRoom(r); setView('lobby'); }} className="bg-emerald-900 text-white p-6 rounded-xl cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Activity size={100}/></div>
                         <div className="flex items-center gap-2 mb-2">
                             <span className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"/>
                             <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">{r.status}</span>
                         </div>
                         <h3 className="text-xl font-bold mb-1">{r.packetTitle}</h3>
                         <div className="font-mono text-3xl font-black text-lime-400 my-4 tracking-widest">{r.code}</div>
                         <div className="text-xs text-emerald-300 flex justify-between">
                            <span>{r.schoolName}</span>
                            <span>{new Date(r.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                         </div>
                     </div>
                 ))}
                 {activeSessions.length === 0 && <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed">Tidak ada sesi aktif.</div>}
             </div>
        )}

        {activeTab === 'history' && (
             <div className="space-y-4">
                 {finishedSessions.map(r => (
                     <div key={r.id} onClick={() => { setRoom(r); setView('lobby'); }} className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 hover:border-emerald-200 cursor-pointer transition-all">
                         <div>
                             <h4 className="font-bold text-slate-800">{r.packetTitle}</h4>
                             <div className="text-xs text-slate-400 mt-1 flex gap-3">
                                 <span>{r.code}</span>
                                 <span>•</span>
                                 <span>{new Date(r.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                             </div>
                         </div>
                         <Button variant="ghost" icon={ChevronRight} className="text-slate-300"/>
                     </div>
                 ))}
                 {finishedSessions.length === 0 && <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed">Belum ada riwayat sesi.</div>}
             </div>
        )}
        
        <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title="Buat Sesi Baru">
           <div className="space-y-4">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-1">Paket Soal</p>
                  <b className="text-lg text-emerald-950 block leading-tight">{selectedPkt?.title}</b>
              </div>
              <Input label="Nama Guru" value={form.teacher} onChange={e=>setForm({...form,teacher:e.target.value})}/>
              <Input label="Nama Sekolah" value={form.school} onChange={e=>setForm({...form,school:e.target.value})}/>
              <Input label="Durasi Ujian (Menit)" type="number" value={customDuration} onChange={e=>setCustomDuration(parseInt(e.target.value)||0)}/>
              <Button onClick={createRoom} loading={loading} className="w-full">Mulai</Button>
           </div>
        </Modal>
     </div>
  );
};

// ==========================================
// 5. STUDENT MODULE (RECONSTRUCTED)
// ==========================================

const StudentDashboard = ({ onGoHome, user }) => {
  const [stage, setStage] = useState('login'); // login, lobby, exam, result
  const [form, setForm] = useState({ code: '', name: '' });
  const [room, setRoom] = useState(null);
  const [player, setPlayer] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const { snackbar, showToast, closeToast } = useSnackbar();

  // Auto-fill code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) setForm(prev => ({ ...prev, code }));
  }, []);

  // Listen to Room Status Changes
  useEffect(() => {
    if (!room?.id) return;
    const unsub = onSnapshot(getPublicDoc("rooms", room.id), (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            setRoom(prev => ({ ...prev, ...data }));
            if (data.status === 'PLAYING' && stage === 'lobby') setStage('exam');
            if (data.status === 'FINISHED' && stage === 'exam') submitExam(true);
        }
    });
    return () => unsub();
  }, [room?.id, stage]);

  const joinRoom = async () => {
     if (!form.code || !form.name) return showToast("Isi kode dan nama!", 'error');
     setLoading(true);
     try {
        const q = query(getPublicCol("rooms"), where("code", "==", form.code.trim().toUpperCase()));
        const snap = await getDocs(q);
        if (snap.empty) throw new Error("Kode ruang tidak ditemukan.");
        
        const roomData = { id: snap.docs[0].id, ...snap.docs[0].data() };
        if (roomData.status !== 'WAITING') throw new Error("Ujian sudah berjalan atau selesai.");

        // Register Player
        const playerRef = await addDoc(getPublicCol("players"), {
            roomId: roomData.id,
            name: form.name,
            status: 'ready',
            joinedAt: serverTimestamp(),
            answers: {}
        });

        setRoom(roomData);
        setPlayer({ id: playerRef.id, name: form.name });
        setStage('lobby');
     } catch (e) { showToast(e.message, 'error'); }
     finally { setLoading(false); }
  };

  const handleAnswer = (qId, val) => {
     setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const submitExam = async (auto = false) => {
      if (!auto && !confirm("Yakin ingin mengumpulkan jawaban?")) return;
      setLoading(true);
      
      // Calculate Score
      let score = 0;
      let maxScore = 0;
      
      room.questions.forEach(q => {
          const userAns = answers[q.id];
          if (q.type === 'PG') {
              maxScore += 10;
              if (userAns === q.answer) score += 10;
          } else if (q.type === 'PGK') {
              maxScore += 10;
              // Simple Exact Match for PGK
              if (Array.isArray(userAns) && Array.isArray(q.answer)) {
                  const sortedUser = [...userAns].sort().join(',');
                  const sortedKey = [...q.answer].sort().join(',');
                  if (sortedUser === sortedKey) score += 10;
              }
          } else if (q.type === 'MTF') {
              maxScore += 10;
              // 2 points per correct row
              if (userAns) {
                   q.options.forEach(opt => {
                       if (userAns[opt.text] === opt.answer) score += (10 / q.options.length);
                   });
              }
          } else if (q.type === 'MATCH') {
              maxScore += 10;
              // 2 points per correct pair logic (simplified)
          } else {
              maxScore += 10; // Essay - no auto score
          }
      });

      const finalScore = (score / maxScore) * 100;

      try {
          await updateDoc(getPublicDoc("players", player.id), {
              answers,
              status: 'submitted',
              submittedAt: serverTimestamp(),
              score: finalScore || 0
          });
          setStage('result');
      } catch (e) { showToast("Gagal submit: " + e.message, 'error'); }
      finally { setLoading(false); }
  };

  if (stage === 'login') return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
          <Snackbar {...snackbar} onClose={closeToast} />
          <Card className="w-full max-w-md">
              <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-lime-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
                      <User size={32} strokeWidth={2.5}/>
                  </div>
                  <h1 className="text-2xl font-black text-emerald-950">Masuk Ujian</h1>
                  <p className="text-slate-500 text-sm">Masukkan kode ruangan dari gurumu.</p>
              </div>
              <Input label="Kode Ruangan" placeholder="Cth: X7B9A2" value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})}/>
              <Input label="Nama Lengkap" placeholder="Nama Kamu" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
              <Button onClick={joinRoom} loading={loading} className="w-full" icon={ArrowLeft} style={{flexDirection:'row-reverse'}}>Masuk</Button>
              <Button onClick={onGoHome} variant="ghost" className="w-full mt-2 text-xs">Batal</Button>
          </Card>
      </div>
  );

  if (stage === 'lobby') return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-center">
          <div className="animate-bounce mb-4 text-6xl">⏳</div>
          <h2 className="text-2xl font-black text-emerald-950 mb-2">Menunggu Guru...</h2>
          <p className="text-slate-500 mb-6">Ujian akan dimulai sebentar lagi.</p>
          <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100 inline-block text-left min-w-[250px]">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Info Peserta</div>
              <div className="font-bold text-slate-800">{form.name}</div>
              <div className="text-sm text-slate-500">{room.schoolName}</div>
          </div>
      </div>
  );

  if (stage === 'result') return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-center">
          <div className="mb-4 text-6xl">🎉</div>
          <h2 className="text-2xl font-black text-emerald-950 mb-2">Ujian Selesai!</h2>
          <p className="text-slate-500 mb-6">Jawabanmu telah tersimpan.</p>
          <div className="flex flex-col gap-3">
              <Button onClick={() => generateExamPDF(room.packetTitle, room, player.name, answers, false)} icon={Download} variant="secondary">Download LKJ Saya</Button>
              <Button onClick={onGoHome} icon={Home}>Kembali ke Beranda</Button>
          </div>
      </div>
  );

  // Exam Stage
  return (
      <div className="max-w-3xl mx-auto pb-24 px-4 pt-6">
          <Snackbar {...snackbar} onClose={closeToast} />
          
          {/* Header Bar */}
          <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur border-b border-slate-200 z-40 px-4 py-3 shadow-sm">
             <div className="max-w-3xl mx-auto flex justify-between items-center">
                <div className="text-xs font-bold text-slate-500">Soal Ujian</div>
                <CountdownDisplay startedAt={room.startedAt} duration={room.duration} onTimeUp={()=>submitExam(true)} isActive={true} />
             </div>
          </div>

          <div className="mt-16 space-y-8">
             {room.questions.map((q, i) => (
                <Card key={q.id} id={`q-${i}`}>
                    <div className="flex gap-3 mb-4">
                        <span className="bg-emerald-900 text-white w-8 h-8 flex items-center justify-center rounded-lg font-bold shadow-sm flex-shrink-0">{i+1}</span>
                        <div className="text-sm text-slate-800 leading-relaxed pt-1"><ContentRenderer html={q.question}/></div>
                    </div>
                    
                    <div className="pl-11 space-y-3">
                        {q.type === 'PG' && q.options.map((opt, idx) => (
                            <label key={idx} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${answers[q.id] === opt ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}>
                                <input type="radio" name={`q-${q.id}`} className="mt-1" checked={answers[q.id] === opt} onChange={()=>handleAnswer(q.id, opt)}/>
                                <div className="text-sm"><span className="font-bold mr-2">{String.fromCharCode(65+idx)}.</span> <ContentRenderer html={opt}/></div>
                            </label>
                        ))}

                        {q.type === 'PGK' && q.options.map((opt, idx) => {
                            const current = answers[q.id] || [];
                            return (
                                <label key={idx} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${current.includes(opt) ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-100'}`}>
                                    <input type="checkbox" className="mt-1" checked={current.includes(opt)} onChange={()=>{
                                        const newVal = current.includes(opt) ? current.filter(x=>x!==opt) : [...current, opt];
                                        handleAnswer(q.id, newVal);
                                    }}/>
                                    <div className="text-sm"><ContentRenderer html={opt}/></div>
                                </label>
                            );
                        })}

                        {q.type === 'MATCH' && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs text-slate-400 mb-3 italic">Pasangkan premis kiri dengan jawaban kanan.</p>
                                {q.options.map((pair, idx) => (
                                    <div key={idx} className="mb-2 pb-2 border-b border-slate-200 last:border-0">
                                        <div className="text-sm font-bold mb-1">{pair.left}</div>
                                        <select className="w-full p-2 rounded border text-sm" value={(answers[q.id]||[]).find(p=>p.left===pair.left)?.right || ''} onChange={(e)=>{
                                             const current = answers[q.id] || [];
                                             const filtered = current.filter(p => p.left !== pair.left);
                                             handleAnswer(q.id, [...filtered, { left: pair.left, right: e.target.value }]);
                                        }}>
                                            <option value="">-- Pilih Pasangan --</option>
                                            {q.options.map(o => <option key={o.right} value={o.right}>{o.right}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        )}

                        {q.type === 'MTF' && (
                             <div className="overflow-hidden border border-slate-200 rounded-xl">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-100"><tr><th className="p-2 text-left">Pernyataan</th><th className="p-2 w-16 text-center">Benar</th><th className="p-2 w-16 text-center">Salah</th></tr></thead>
                                    <tbody>
                                        {q.options.map((opt, idx) => (
                                            <tr key={idx} className="border-t border-slate-100 bg-white">
                                                <td className="p-2"><ContentRenderer html={opt.text}/></td>
                                                <td className="p-2 text-center"><input type="radio" name={`mtf-${q.id}-${idx}`} checked={(answers[q.id]||{})[opt.text] === true} onChange={()=>{
                                                    handleAnswer(q.id, { ...(answers[q.id]||{}), [opt.text]: true });
                                                }}/></td>
                                                <td className="p-2 text-center"><input type="radio" name={`mtf-${q.id}-${idx}`} checked={(answers[q.id]||{})[opt.text] === false} onChange={()=>{
                                                    handleAnswer(q.id, { ...(answers[q.id]||{}), [opt.text]: false });
                                                }}/></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             </div>
                        )}

                        {q.type === 'ESSAY' && (
                            <textarea className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" rows={4} placeholder="Ketik jawabanmu..." value={answers[q.id] || ''} onChange={e=>handleAnswer(q.id, e.target.value)}/>
                        )}
                    </div>
                </Card>
             ))}
          </div>

          <div className="fixed bottom-6 right-6 left-6 z-40 flex justify-end">
              <Button onClick={() => submitExam()} variant="primary" className="w-full md:w-auto shadow-xl shadow-emerald-900/40" icon={CheckCircle}>Kumpulkan Jawaban</Button>
          </div>
      </div>
  );
};

// ==========================================
// 6. MAIN APP & ROUTING
// ==========================================

const LoginModal = ({ onClose, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            onSuccess();
        } catch (err) {
            setError('Login gagal. Periksa email dan password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Login Administrator">
            <form onSubmit={handleLogin} className="space-y-4">
                {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
                <Input label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="admin@sekolah.sch.id"/>
                <Input label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••"/>
                <Button type="submit" loading={loading} className="w-full">Masuk</Button>
            </form>
        </Modal>
    );
};

const LandingPage = ({ onSelectRole }) => {
    const [showLogin, setShowLogin] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 flex items-center justify-center p-6">
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="text-white space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 text-xs font-bold uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"/> v3.0 Pro
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">ELKAPEDE <span className="text-lime-400">CBT</span></h1>
                    <p className="text-emerald-100/80 text-lg leading-relaxed max-w-md">Tryout Gratis, Tanpa Login-login, langsung kerjakan dan penilaian</p>
                    <div className="flex gap-4 pt-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-300"><CheckCircle size={16}/> Realtime</div>
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-300"><FileText size={16}/> PDF Export</div>
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-300"><Monitor size={16}/> Multi-Device</div>
                    </div>
                </div>
                
                <div className="grid gap-4">
                    <button onClick={() => onSelectRole('student')} className="group bg-white hover:bg-lime-50 p-6 rounded-2xl shadow-2xl transition-all hover:-translate-y-1 flex items-center gap-6">
                        <div className="w-14 h-14 bg-lime-100 text-emerald-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><User size={28} strokeWidth={2.5}/></div>
                        <div className="text-left">
                            <h3 className="text-xl font-black text-emerald-950">Masuk sebagai Siswa</h3>
                            <p className="text-slate-500 text-sm">Kerjakan ujian dengan kode ruangan</p>
                        </div>
                        <div className="ml-auto text-slate-300 group-hover:text-emerald-600"><ChevronRight size={24}/></div>
                    </button>

                    <button onClick={() => onSelectRole('teacher')} className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 p-6 rounded-2xl transition-all hover:-translate-y-1 flex items-center gap-6">
                        <div className="w-14 h-14 bg-emerald-800 text-emerald-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><BookOpen size={28} strokeWidth={2.5}/></div>
                        <div className="text-left text-white">
                            <h3 className="text-xl font-black">Portal Guru</h3>
                            <p className="text-emerald-200/70 text-sm">Buat sesi ujian dan pantau nilai</p>
                        </div>
                        <div className="ml-auto text-emerald-500/50 group-hover:text-emerald-200"><ChevronRight size={24}/></div>
                    </button>

                    <button onClick={() => setShowLogin(true)} className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/5 p-6 rounded-2xl transition-all hover:-translate-y-1 flex items-center gap-6">
                        <div className="w-14 h-14 bg-slate-800 text-slate-300 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Lock size={28} strokeWidth={2.5}/></div>
                        <div className="text-left text-slate-300">
                            <h3 className="text-xl font-black text-white">Administrator</h3>
                            <p className="text-slate-400 text-sm">Wajib Login Email & Password</p>
                        </div>
                        <div className="ml-auto text-slate-600 group-hover:text-white"><ChevronRight size={24}/></div>
                    </button>
                </div>
            </div>
            
            {showLogin && (
                <LoginModal onClose={() => setShowLogin(false)} onSuccess={() => onSelectRole('admin')} />
            )}

            <div className="absolute bottom-6 text-emerald-900/20 text-xs font-mono">Build 2024.1.5 • Secure CBT Engine</div>
        </div>
    );
};

const App = () => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null); // 'admin', 'teacher', 'student'
    
    useExternalResources();

    useEffect(() => {
        const initAuth = async () => {
             // Cek token custom (dari env)
             if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                 await signInWithCustomToken(auth, __initial_auth_token);
             } else {
                 // Default anonymous untuk siswa/guru (kecuali admin logout)
                 // Logic ditangani di masing-masing flow
                 onAuthStateChanged(auth, (u) => {
                     if (!u) signInAnonymously(auth);
                     setUser(u);
                 });
             }
        };
        initAuth();
        
        // Deep linking check
        const params = new URLSearchParams(window.location.search);
        const urlRole = params.get('role');
        if (urlRole) setRole(urlRole);
        else if (params.get('code')) setRole('student');

    }, []);

    const handleHome = () => {
        setRole(null);
        updateURL({ role: null, roomId: null, code: null });
    };

    if (!user) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-emerald-600" size={40}/></div>;

    return (
        <div className="font-sans antialiased text-slate-900 bg-slate-50 min-h-screen">
            {!role && <LandingPage onSelectRole={setRole}/>}
            {role === 'admin' && <AdminDashboard user={user} onGoHome={handleHome}/>}
            {role === 'teacher' && <TeacherDashboard user={user} onGoHome={handleHome}/>}
            {role === 'student' && <StudentDashboard user={user} onGoHome={handleHome}/>}
        </div>
    );
};

export default App;