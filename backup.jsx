import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, BookOpen, User, LogOut, Settings, Play, 
  Plus, Trash2, Edit, X, Check, Eye, Code, 
  Menu, ChevronRight, ArrowLeft, Clock, Users, BarChart3,
  CheckCircle, XCircle, AlertTriangle, Loader2, Copy,
  Bold, Italic, Underline, List, ListOrdered, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, Type, Save, Home, Printer, FileText, Download, Grid, Filter, Search, History, MessageCircle, Share2, Link as LinkIcon, StopCircle,
  MonitorPlay,
  QrCode,
  Library,
  ChevronDown,
  Layers,
  List as ListIcon
} from 'lucide-react';

// Firebase SDK
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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'elkapede-v13-fix-mtf';

const getPublicCol = (col) => collection(db, 'artifacts', appId, 'public', 'data', col);
const getPublicDoc = (col, id) => doc(db, 'artifacts', appId, 'public', 'data', col, id);

// --- ROUTING HELPER ---
const updateURL = (params) => {
  const url = new URL(window.location);
  Object.keys(params).forEach(key => {
    if (params[key] === null) url.searchParams.delete(key);
    else url.searchParams.set(key, params[key]);
  });
  window.history.pushState({}, '', url);
};

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

// --- PDF GENERATOR ENGINE ---
const generateExamPDF = (title, packet, studentName = null, studentAnswers = null, withKey = false) => {
  const printWindow = window.open('', '_blank');
  if(!printWindow) return alert("Izinkan pop-up browser untuk melihat PDF.");
  
  let content = packet.questions.map((q, i) => {
    const userAns = studentAnswers ? studentAnswers[q.id] : null;
    let answerDisplay = '';

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
          @media print { 
             body { -webkit-print-color-adjust: exact; } 
             .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="position:fixed; top:20px; right:20px; z-index:100;">
           <button onclick="window.print()" style="background:#064e3b; color:white; padding:8px 16px; border:none; border-radius:6px; font-weight:bold; cursor:pointer; box-shadow:0 4px 6px rgba(0,0,0,0.1); display:flex; align-items:center; gap:8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><path d="M6 14h12v8H6z"></path></svg> Simpan PDF</button>
        </div>
        <div style="text-align:center; border-bottom:3px solid #064e3b; padding-bottom:15px; margin-bottom:30px;">
          <h1 style="font-size:20px; font-weight:900; margin:0; color: #064e3b;">${packet.title}</h1>
          <p style="margin:5px 0 0; color: #3f6212; font-size: 13px;">Mapel: ${packet.mapel} | Kelas: ${packet.kelas} | Durasi: ${packet.duration} Menit</p>
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
  if(!printWindow) return alert("Izinkan pop-up browser.");
  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
        <style>
          body { padding: 30px; font-family: 'Segoe UI', sans-serif; color: #1f2937; font-size: 13px; }
          img { max-width: 100%; height: auto; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #d9f99d; padding: 10px; text-align: left; }
          th { background-color: #ecfccb; color: #365314; }
          @media print { 
            body { -webkit-print-color-adjust: exact; } 
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
           <button onclick="window.print()" style="background: #064e3b; color: white; padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-weight: bold; display: inline-flex; align-items: center; gap: 8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><path d="M6 14h12v8H6z"></path></svg> Simpan / Simpan</button>
        </div>
        <h1 class="text-xl font-bold mb-4 border-b-2 border-emerald-900 pb-2 text-emerald-900">${title}</h1>
        <div id="content">${contentHTML}</div>
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
            }, 500);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

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
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all focus-within:ring-2 focus-within:ring-lime-400">
      <div className="flex gap-1 p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto">
        {[['bold',Bold],['italic',Italic],['underline',Underline],['insertOrderedList',ListOrdered],['insertUnorderedList',List]].map(([c,I])=><button key={c} onClick={()=>exec(c)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors flex-shrink-0"><I size={16}/></button>)}
        <button onClick={()=>{const u=prompt("URL:");if(u)exec('insertImage',u)}} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors flex-shrink-0"><ImageIcon size={16}/></button>
      </div>
      <div ref={editorRef} className="p-3 min-h-[100px] max-h-[300px] overflow-y-auto outline-none prose prose-sm max-w-none text-slate-700 leading-relaxed text-sm" contentEditable onInput={triggerChange} onPaste={handlePaste} onClick={handleImgClick} style={{whiteSpace:'pre-wrap'}} />
    </div>
  );
};

const ContentRenderer = ({ html }) => {
  const ref = useRef(null);
  useEffect(() => {
    if(!ref.current || !html) return;
    ref.current.innerHTML = html;
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
  return <div ref={ref} className="prose prose-sm max-w-none text-slate-800 leading-relaxed break-words text-sm"/>;
};

// --- REDESIGNED UI COMPONENTS (MAX ROUNDED 12px) ---

const Button = ({ children, onClick, variant='primary', className='', icon:Icon, loading, ...props }) => (
  <button onClick={onClick} className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold tracking-wide transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm ${
    variant==='primary' ? 'bg-emerald-900 text-white hover:bg-emerald-800 shadow-md shadow-emerald-900/20' :
    variant==='secondary' ? 'bg-lime-400 text-emerald-900 hover:bg-lime-500 shadow-md shadow-lime-400/30' :
    variant==='outline' ? 'bg-white text-emerald-900 border border-emerald-900/10 hover:border-emerald-900/30 hover:bg-emerald-50' :
    variant==='danger'  ? 'bg-white text-orange-600 border border-orange-100 hover:bg-orange-50 hover:border-orange-200' :
    variant==='ghost'   ? 'text-slate-500 hover:bg-slate-100 hover:text-emerald-900' :
    'bg-slate-100 text-slate-600 hover:bg-slate-200'
  } ${className}`} disabled={loading} {...props}>
    {loading ? <Loader2 className="animate-spin" size={16}/> : (Icon && <Icon size={16} strokeWidth={2.5}/>)} {children}
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
    <input className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 outline-none text-slate-800 font-medium transition-all placeholder:text-slate-300 bg-slate-50/50 focus:bg-white text-sm" {...props}/>
  </div>
);

const Select = ({label, options, icon:Icon, ...props}) => (
  <div className="mb-0 w-full group">
    {label && <label className="block text-xs font-black text-emerald-900 uppercase tracking-widest mb-1.5 ml-1">{label}</label>}
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-900/40 group-focus-within:text-lime-600 transition-colors">
        {Icon ? <Icon size={16}/> : <Filter size={16}/>}
      </div>
      <select className="w-full pl-10 pr-8 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 outline-none text-slate-800 font-bold bg-white appearance-none cursor-pointer transition-all text-sm" {...props}>
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
      <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100"><Home size={14} className="text-lime-600"/></div>
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
    
    // SAFE CHECK: startedAt can be a Firestore Timestamp object OR a number/date
    let start;
    if (startedAt && typeof startedAt.toMillis === 'function') {
        start = startedAt.toMillis();
    } else if (startedAt && startedAt.seconds) {
        start = startedAt.seconds * 1000;
    } else {
        start = new Date(startedAt).getTime();
    }

    if (isNaN(start)) {
        // Fallback if date is invalid
        start = Date.now(); 
    }

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

// -- REUSABLE COMPONENT FOR PREVIEWING QUESTIONS WITH ANSWERS --
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
                   
                   {/* QUESTION */}
                   <div className="bg-slate-50 p-4 rounded-xl mb-4 text-slate-800 leading-relaxed border border-slate-100 text-sm"><ContentRenderer html={q.question}/></div>
                   
                   {/* ANSWERS / OPTIONS */}
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
                               <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                                  <tr><th className="p-2">Pernyataan</th><th className="p-2 w-20 text-center">Status</th></tr>
                               </thead>
                               <tbody>
                                  {q.options.map((opt, idx) => (
                                     <tr key={idx} className="border-t border-slate-100">
                                        <td className="p-2 text-slate-700"><ContentRenderer html={opt.text}/></td>
                                        <td className="p-2 text-center">
                                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${opt.answer ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                              {opt.answer ? 'BENAR' : 'SALAH'}
                                           </span>
                                        </td>
                                     </tr>
                                  ))}
                               </tbody>
                            </table>
                         </div>
                      )}

                      {q.type === 'ESSAY' && (
                         <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg text-sm text-emerald-900">
                            {q.answer}
                         </div>
                      )}
                   </div>

                   {/* EXPLANATION */}
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
    if(!newSubject.trim()) return;
    await addDoc(getPublicCol("subjects"), { name: newSubject.trim(), createdAt: serverTimestamp() });
    setNewSubject('');
  };

  const handleDeleteSubject = async (id) => {
    if(confirm("Hapus mapel ini?")) await deleteDoc(getPublicDoc("subjects", id));
  };

  // 1. DEFAULT QUESTIONS WITH LATEX & 5 TYPES
  const getExampleQuestions = () => [
    { 
      id: '1', 
      type: 'PG', 
      question: 'Tentukan hasil dari limit berikut: $$ \\lim_{x \\to 0} \\frac{x^2 \\sin(1/x) + \\tan(x)}{x} $$ dan integral $$ \\int_0^{\\pi} \\sin^2(x) dx $$', 
      options: ['0', '1', '$$ \\pi/2 $$', '$$ \\infty $$', 'Tidak ada'], 
      answer: '1', 
      explanation: 'Gunakan aturan L\'Hopital untuk limit dan identitas trigonometri untuk integral.' 
    },
    { 
      id: '2', 
      type: 'PGK', 
      question: 'Manakah dari berikut ini yang merupakan besaran vektor? (Pilih lebih dari satu)', 
      options: ['Kecepatan', 'Laju', 'Gaya', 'Massa'], 
      answer: ['Kecepatan', 'Gaya'], 
      explanation: 'Vektor memiliki nilai dan arah. Kecepatan dan Gaya punya arah, sedangkan Laju dan Massa hanya skalar.' 
    },
    { 
      id: '3', 
      type: 'MATCH', 
      question: 'Pasangkan organel sel berikut dengan fungsinya yang tepat!', 
      options: [{left:'Mitokondria',right:'Respirasi Sel'},{left:'Ribosom',right:'Sintesis Protein'},{left:'Kloroplas',right:'Fotosintesis'}], 
      answer: null, 
      explanation: 'Mitokondria = energi, Ribosom = protein, Kloroplas = fotosintesis pada tumbuhan.' 
    },
    { 
      id: '4', 
      type: 'MTF', 
      question: 'Tentukan kebenaran pernyataan di bawah ini:', 
      options: [{text:'Virus termasuk makhluk hidup seluler', answer: false}, {text:'Bakteri memiliki dinding sel peptidoglikan', answer: true}], 
      explanation: 'Virus bersifat aseluler (bukan sel). Bakteri (Eubacteria) memiliki dinding sel peptidoglikan.' 
    },
    { 
      id: '5', 
      type: 'ESSAY', 
      question: 'Jelaskan secara singkat proses terjadinya hujan asam!', 
      answer: 'SO2 dan NOx bereaksi dengan uap air membentuk asam.', 
      explanation: 'Gas sulfur dioksida dan nitrogen oksida dari polusi bereaksi dengan air di atmosfer membentuk asam sulfat dan nitrat.' 
    }
  ];

  const handleSave = async () => {
    if (!meta.title) return alert("Isi judul paket!");
    if (!meta.mapel) return alert("Pilih mata pelajaran!");
    setLoading(true);
    const data = { ...meta, questions, updatedAt: serverTimestamp(), authorId: user.uid };
    if (currentPacket?.id) await updateDoc(getPublicDoc("packets", currentPacket.id), data);
    else await addDoc(getPublicCol("packets"), { ...data, createdAt: serverTimestamp() });
    setLoading(false);
    setView('list');
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
        <Breadcrumbs onGoHome={onGoHome} items={[{ label: 'Admin', onClick: () => setView('list') }, { label: currentPacket ? 'Edit' : 'Baru', active: true }]} />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sticky top-4 z-40 bg-white/90 backdrop-blur-md p-4 rounded-xl border border-emerald-100 shadow-xl gap-4">
           <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setView('list')} icon={ArrowLeft} className="px-3">Kembali</Button>
              <h2 className="font-bold text-lg text-emerald-950">Editor Paket Soal</h2>
           </div>
           <Button onClick={handleSave} icon={Save} loading={loading} className="w-full md:w-auto">Simpan Paket</Button>
        </div>
        <Card title="Informasi Paket" className="mb-6">
           <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2"><Input label="Judul Paket" value={meta.title} onChange={e=>setMeta({...meta,title:e.target.value})} placeholder="Contoh: Tryout Biologi"/></div>
              <div>
                  <label className="block text-xs font-black text-emerald-900 uppercase tracking-widest mb-1.5 ml-1">Mapel</label>
                  <div className="relative">
                    <select className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 outline-none text-slate-800 font-medium bg-white appearance-none cursor-pointer text-sm" value={meta.mapel} onChange={e=>setMeta({...meta,mapel:e.target.value})}>
                        <option value="">-- Pilih --</option>
                        {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
              </div>
              <Select label="Jenjang" options={[{value:'SD',label:'SD'},{value:'SMP',label:'SMP'},{value:'SMA',label:'SMA'},{value:'Umum',label:'Umum'}]} value={meta.jenjang} onChange={e=>setMeta({...meta,jenjang:e.target.value})}/>
              <Input label="Kelas" value={meta.kelas} onChange={e=>setMeta({...meta,kelas:e.target.value})} placeholder="12"/>
           </div>
        </Card>
        <div className="space-y-6">
           {questions.map((q, i) => (
              <Card key={q.id} title={`Soal Nomor ${i+1}`} action={<button onClick={()=>setQuestions(questions.filter((_,x)=>x!==i))} className="text-orange-500 hover:text-white hover:bg-orange-500 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"><Trash2 size={16}/> Hapus</button>}>
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
           <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sticky bottom-6 p-2 rounded-xl bg-white/80 backdrop-blur-lg shadow-xl border border-emerald-100">
              {['PG','PGK','MATCH','MTF','ESSAY'].map(t=><Button key={t} variant="ghost" className="hover:bg-lime-100 hover:text-emerald-900 text-xs" onClick={()=>addQuestion(t)}>+ {t}</Button>)}
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
                  <input 
                    className="w-full border border-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 transition-all text-sm"
                    placeholder="Nama Mapel (ex: Fisika)"
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                  />
                  <Button onClick={handleAddSubject} icon={Plus} variant="secondary" className="w-full">Simpan</Button>
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
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
             <div className="md:col-span-5 flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full scrollbar-hide">
                {['All','SD','SMP','SMA','Umum'].map(j=>(
                   <button key={j} onClick={()=>setActiveTab(j)} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border flex-shrink-0 ${activeTab===j?'bg-emerald-900 border-emerald-900 text-white shadow-md':'bg-white border-slate-100 text-slate-400 hover:border-lime-400 hover:text-lime-600'}`}>
                     {j}
                   </button>
                ))}
             </div>
             <div className="hidden md:block w-px h-10 bg-slate-100 md:col-span-1 mx-auto"></div>
             <div className="md:col-span-6 flex flex-col sm:flex-row gap-3 w-full">
                <Select label="Filter Mata Pelajaran" icon={BookOpen} value={filterMapel} onChange={e=>setFilterMapel(e.target.value)} options={uniqueMapels.map(m=>({value:m,label:m}))} className="mb-0"/>
                <Select label="Filter Kelas" icon={Filter} value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} options={uniqueClasses.map(c=>({value:c,label:`Kelas ${c}`}))} className="mb-0"/>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackets.map(p=>(
             <Card key={p.id} className="group hover:-translate-y-1 hover:shadow-xl hover:shadow-lime-500/10 border hover:border-lime-400">
                <div className="flex justify-between items-start mb-4">
                    <span className="bg-lime-100 text-emerald-900 text-[10px] uppercase font-black px-3 py-1 rounded-lg tracking-widest">{p.jenjang}</span>
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{p.mapel}</span>
                </div>
                <h3 className="font-bold text-lg mb-2 text-slate-800 group-hover:text-emerald-900 transition-colors line-clamp-2 leading-snug">{p.title}</h3>
                <div className="flex items-center gap-2 mb-6">
                    <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold text-slate-500 flex items-center gap-1"><Users size={10}/> Kelas {p.kelas}</span>
                    <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold text-slate-500 flex items-center gap-1"><Clock size={10}/> {p.duration} Mnt</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 border-t border-slate-50 pt-4">
                   <button onClick={() => generateExamPDF(p.title, p, null, null, false)} className="col-span-1 bg-slate-50 hover:bg-white border border-slate-100 hover:border-lime-400 text-slate-600 hover:text-emerald-900 rounded-lg py-2 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all"><FileText size={12}/> PDF Soal</button>
                   <button onClick={() => generateExamPDF(p.title, p, null, null, true)} className="col-span-1 bg-slate-50 hover:bg-white border border-slate-100 hover:border-lime-400 text-slate-600 hover:text-emerald-900 rounded-lg py-2 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all"><CheckCircle size={12}/> PDF Kunci</button>
                   <button onClick={()=>{setCurrentPacket(p);setView('preview')}} className="col-span-1 bg-emerald-900 hover:bg-emerald-800 text-white rounded-lg py-2 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-900/10"><Eye size={12}/> Lihat</button>
                   <button onClick={async()=>{if(confirm('Hapus?'))await deleteDoc(getPublicDoc("packets",p.id))}} className="col-span-1 bg-white hover:bg-orange-50 border border-orange-100 hover:border-orange-200 text-orange-500 hover:text-orange-600 rounded-lg py-2 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all"><Trash2 size={12}/> Hapus</button>
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
  const [view, setView] = useState('browse'); 
  const [packets, setPackets] = useState([]);
  const [myRooms, setMyRooms] = useState([]);
  const [selectedPkt, setSelectedPkt] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [filterMapel, setFilterMapel] = useState('All');
  const [filterKelas, setFilterKelas] = useState('All');
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [loading, setLoading] = useState(false);

  // -- PERSISTENCE LOGIC --
  useEffect(() => {
    // Check URL for existing session
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('roomId');
    if (roomId) {
        // Fetch room info if ID present
        getDoc(getPublicDoc("rooms", roomId)).then(doc => {
            if (doc.exists()) {
                setRoom({ id: doc.id, ...doc.data() });
                setView('lobby');
            }
        });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const u1 = onSnapshot(getPublicCol("packets"), s => setPackets(s.docs.map(d=>({id:d.id,...d.data()}))));
    const qRooms = query(getPublicCol("rooms"), where("teacherId", "==", user.uid), orderBy("createdAt", "desc"));
    const u2 = onSnapshot(qRooms, s => setMyRooms(s.docs.map(d=>({id:d.id,...d.data()}))));
    return () => { u1(); u2(); };
  }, [user]);

  useEffect(() => {
    if (room?.id) {
       // Update URL to persist state
       updateURL({ role: 'teacher', roomId: room.id });

       const uRoom = onSnapshot(getPublicDoc("rooms", room.id), (doc) => {
         if (doc.exists()) setRoom({id: doc.id, ...doc.data()});
       });
       const uPlayers = onSnapshot(query(getPublicCol("players"), where("roomId","==",room.id)), s => setPlayers(s.docs.map(d=>({id:d.id,...d.data()}))));
       return () => { uRoom(); uPlayers(); };
    }
  }, [room?.id]);

  const filteredPackets = packets.filter(p => (activeTab==='All'||p.jenjang===activeTab) && (filterMapel==='All'||p.mapel===filterMapel) && (filterKelas==='All'||p.kelas===filterKelas));
  const uniqueMapels = ['All', ...new Set(packets.map(p => p.mapel).filter(Boolean))];
  const uniqueClasses = ['All', ...new Set(packets.map(p => p.kelas).filter(Boolean))].sort();

  const createRoom = async () => {
     if(!schoolName || !teacherName) return alert("Lengkapi data Guru dan Sekolah!");
     setLoading(true);
     const code = Math.random().toString(36).substring(2,8).toUpperCase();
     const newRoom = { code, packetId:selectedPkt.id, packetTitle:selectedPkt.title, teacherId:user.uid, teacherName, schoolName, status:'WAITING', createdAt: serverTimestamp(), duration:selectedPkt.duration, questions: selectedPkt.questions };
     const ref = await addDoc(getPublicCol("rooms"), newRoom);
     setRoom({id:ref.id, ...newRoom});
     setLoading(false);
     setView('lobby'); setShowModal(false);
  };

  const openHistory = (r) => { setRoom(r); setView('lobby'); };

  const copyLink = () => {
     // Use persisted link logic
     const url = `${window.location.origin}${window.location.pathname}?code=${room.code}`;
     navigator.clipboard.writeText(url);
     alert("Link tersalin: " + url);
  };

  const handleGoHome = () => {
      // Clear URL params on exit
      updateURL({ role: null, roomId: null });
      onGoHome();
  }

  if (view === 'preview') return (
      <PacketPreview 
        packet={selectedPkt} 
        onClose={() => setView('browse')} 
        onAction={() => setShowModal(true)} 
        actionLabel="Buat Sesi Ujian" 
        actionIcon={Play}
      />
  );

  if (view === 'lobby') return (
     <div className="max-w-7xl mx-auto px-4 pb-20">
        <Breadcrumbs onGoHome={handleGoHome} items={[{label:'Guru',onClick:()=>setView('browse')},{label:'Lobby Sesi',active:true}]}/>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2">
              <Card title={`Daftar Peserta (${players.length})`} className="min-h-[500px]">
                 {players.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-300">
                        <Users size={48} className="mb-4 opacity-20" strokeWidth={1.5}/>
                        <p className="font-medium text-sm">Belum ada siswa yang bergabung.</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {players.map(p=>(
                        <div key={p.id} className={`border p-4 rounded-xl flex flex-col items-center text-center transition-all ${p.status==='submitted'?'bg-lime-50 border-lime-200 shadow-sm':'bg-white border-slate-100'}`}>
                            <div className="font-bold text-slate-800 text-base mb-1">{p.name}</div>
                            <div className="text-[10px] text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-full mb-3">{p.class}</div>
                            {p.status==='submitted' ? (
                                <>
                                    <div className="text-2xl font-black text-emerald-900 mt-1">{p.score?.toFixed(0)}</div>
                                    <div className="text-[10px] uppercase font-black text-lime-600 mb-4 tracking-widest">Nilai Akhir</div>
                                    <button onClick={()=>generateExamPDF(room.packetTitle, {questions: room.questions, ...room}, p.name, p.answers, false)} className="text-[10px] font-bold text-emerald-900 bg-white border border-emerald-900/10 px-3 py-1.5 rounded-lg hover:bg-lime-100 hover:border-lime-200 flex items-center gap-1 w-full justify-center transition-all"><Download size={12}/> Unduh LJK</button>
                                </>
                            ) : (
                                <span className="text-[10px] text-orange-500 font-bold animate-pulse mt-2 flex items-center gap-1"><Edit size={10}/> Mengerjakan...</span>
                            )}
                        </div>
                        ))}
                    </div>
                 )}
              </Card>
           </div>
           <div>
              <Card title="Kontrol Ruangan" className="sticky top-6">
                 <div className="text-center mb-6 bg-slate-50 rounded-xl p-6 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Kode Akses</p>
                    <div className="text-5xl font-black text-emerald-900 tracking-widest font-mono select-all cursor-pointer hover:scale-105 transition-transform" onClick={copyLink}>{room.code}</div>
                    <div className="mt-4 flex justify-center">
                        <button className="text-xs text-emerald-900 font-bold bg-white border border-slate-100 hover:border-lime-400 hover:bg-lime-50 px-4 py-2 rounded-full flex items-center gap-2 transition-all shadow-sm" onClick={copyLink}>
                            <Copy size={14}/> Salin Link
                        </button>
                    </div>
                 </div>
                 
                 <div className="bg-white border border-slate-100 p-5 rounded-xl mb-6 flex flex-col items-center justify-center shadow-sm">
                    <div className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Status Sesi</div>
                    {room.status === 'PLAYING' ? (
                        <>
                           <div className="text-emerald-600 font-bold mb-3 animate-pulse flex items-center gap-2 text-sm"><div className="w-2 h-2 bg-emerald-600 rounded-full"></div> UJIAN BERLANGSUNG</div>
                           <CountdownDisplay 
                              startedAt={room.startedAt} 
                              duration={room.duration} 
                              isActive={true} 
                              onTimeUp={() => {}} 
                           />
                        </>
                    ) : (
                        <div className={`font-black text-xl ${room.status==='FINISHED'?'text-orange-500':'text-slate-300'}`}>
                           {room.status === 'FINISHED' ? 'SELESAI' : 'MENUNGGU'}
                        </div>
                    )}
                 </div>

                 <div className="space-y-3">
                    {room.status==='WAITING' && <Button onClick={()=>updateDoc(getPublicDoc("rooms",room.id),{status:'PLAYING',startedAt:serverTimestamp()})} className="w-full text-base py-3 shadow-md shadow-lime-400/30" variant="secondary" icon={Play}>Mulai Sesi</Button>}
                    
                    {room.status==='PLAYING' && (
                        <Button 
                            variant="danger" 
                            onClick={async () => {
                            if(confirm("Yakin akhiri sesi? Semua siswa akan dipaksa selesai.")) {
                                await updateDoc(getPublicDoc("rooms",room.id),{status:'FINISHED'});
                            }
                            }} 
                            className="w-full"
                            icon={StopCircle}
                        >
                            Akhiri Sesi
                        </Button>
                    )}
                    
                    {(room.status==='FINISHED' || room.status==='PLAYING') && (
                        <Button 
                            variant="outline" 
                            onClick={()=>{
                            let html = `
                                <h2 style="text-align:center;">Rekap Nilai Siswa</h2>
                                <p style="text-align:center; margin-bottom:20px;">Kelas: ${room.packetTitle} | Guru: ${room.teacherName}</p>
                                <table style="width:100%; border-collapse:collapse;">
                                    <thead>
                                        <tr style="background:#ecfccb;">
                                        <th style="border:1px solid #d9f99d; padding:10px;">Nama</th>
                                        <th style="border:1px solid #d9f99d; padding:10px;">Kelas</th>
                                        <th style="border:1px solid #d9f99d; padding:10px;">Nilai</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${players.map(p=>`
                                        <tr>
                                            <td style="border:1px solid #ddd; padding:10px;">${p.name}</td>
                                            <td style="border:1px solid #ddd; padding:10px;">${p.class}</td>
                                            <td style="border:1px solid #ddd; padding:10px; font-weight:bold;">${p.score ? p.score.toFixed(0) : 0}</td>
                                        </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            `; 
                            downloadPDF(`Rekap_${room.code}`, html);
                            }} 
                            className="w-full" 
                            icon={Download}
                        >
                            Download Rekap PDF
                        </Button>
                    )}
                 </div>
              </Card>
           </div>
        </div>
        <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title="Mulai Sesi Ujian Baru">
           <div className="space-y-4">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <p className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-1">Paket Soal</p>
                <b className="text-lg text-emerald-950 block leading-tight">{selectedPkt?.title}</b>
              </div>
              <Input label="Nama Anda (Guru)" value={teacherName} onChange={e=>setTeacherName(e.target.value)} placeholder="Bpk/Ibu Guru"/>
              <Input label="Nama Sekolah" value={schoolName} onChange={e=>setSchoolName(e.target.value)} placeholder="SMA N 1..."/>
              <Button onClick={createRoom} loading={loading} className="w-full py-3 text-base">Mulai Sesi Sekarang</Button>
           </div>
        </Modal>
     </div>
  );

  return (
     <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs onGoHome={handleGoHome} items={[{label:'Portal Guru',active:true}]}/>
        
        <div className="flex justify-center mb-8">
           <div className="bg-white p-1.5 rounded-full border border-slate-100 shadow-lg shadow-slate-200/50 inline-flex gap-1">
                <button onClick={()=>setView('browse')} className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${view==='browse'?'bg-emerald-900 text-white shadow-md shadow-emerald-900/20':'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>Bank Soal</button>
                <button onClick={()=>setView('history')} className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${view==='history'?'bg-emerald-900 text-white shadow-md shadow-emerald-900/20':'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>Riwayat Sesi</button>
           </div>
        </div>

        {view === 'history' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myRooms.map(r => (
                    <div key={r.id} onClick={()=>openHistory(r)} className="bg-white p-6 rounded-xl border border-slate-100 shadow-md shadow-slate-200/30 hover:shadow-lg hover:-translate-y-0.5 hover:border-lime-200 cursor-pointer transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-slate-50 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full border border-slate-100">{r.schoolName}</div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${r.status==='FINISHED'?'bg-slate-100 text-slate-400':r.status==='PLAYING'?'bg-emerald-100 text-emerald-700 animate-pulse':'bg-orange-100 text-orange-600'}`}>
                                {r.status === 'PLAYING' ? 'Berlangsung' : r.status}
                            </div>
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 group-hover:text-emerald-900 mb-2">{r.packetTitle}</h3>
                        <p className="text-slate-400 text-xs font-mono bg-slate-50 p-2 rounded-lg text-center border border-slate-50 group-hover:bg-white group-hover:border-lime-200 transition-colors">Kode: <span className="text-emerald-900 font-black tracking-widest">{r.code}</span></p>
                    </div>
                ))}
                {myRooms.length === 0 && <div className="col-span-full text-center py-16 text-slate-300 bg-white rounded-xl border-2 border-dashed border-slate-100 text-sm">Belum ada riwayat sesi.</div>}
           </div>
        )}

        {view === 'browse' && (
           <>
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-lg shadow-slate-200/40 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                     <div className="md:col-span-5 flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full scrollbar-hide">
                        {['All','SD','SMP','SMA','Umum'].map(j=>(
                           <button key={j} onClick={()=>setActiveTab(j)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex-shrink-0 ${activeTab===j?'bg-emerald-900 border-emerald-900 text-white shadow-md shadow-emerald-900/10':'bg-white border-slate-100 text-slate-400 hover:border-lime-400 hover:text-lime-600'}`}>
                           {j}
                           </button>
                        ))}
                     </div>
                     <div className="hidden md:block w-px h-8 bg-slate-100 md:col-span-1 mx-auto"></div>
                     <div className="md:col-span-6 flex flex-col sm:flex-row gap-3 w-full">
                        <Select label="Filter Mata Pelajaran" icon={BookOpen} value={filterMapel} onChange={e=>setFilterMapel(e.target.value)} options={uniqueMapels.map(m=>({value:m,label:m}))} className="mb-0"/>
                        <Select label="Filter Kelas" icon={Filter} value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} options={uniqueClasses.map(c=>({value:c,label:`Kelas ${c}`}))} className="mb-0"/>
                     </div>
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPackets.map(p=>(
                    <Card key={p.id} className="group hover:-translate-y-1 hover:shadow-xl hover:shadow-lime-500/10 border hover:border-lime-400">
                        <div className="flex justify-between items-start mb-3">
                            <span className="bg-lime-100 text-emerald-900 text-[10px] uppercase font-black px-3 py-1 rounded-lg tracking-widest">{p.jenjang}</span>
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{p.mapel}</span>
                        </div>
                        <h3 className="font-bold text-lg mb-2 text-slate-800 group-hover:text-emerald-900 transition-colors line-clamp-2 leading-snug">{p.title}</h3>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500 flex items-center gap-1"><Users size={10}/> Kelas {p.kelas}</span>
                            <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500 flex items-center gap-1"><Clock size={10}/> {p.duration} Mnt</span>
                        </div>
                        <div className="flex gap-2 border-t border-slate-50 pt-4">
                            <Button variant="outline" onClick={()=>{setSelectedPkt(p);setView('preview')}} className="flex-1 text-[10px] py-2.5 rounded-xl" icon={Eye}>Lihat</Button>
                            <Button onClick={()=>{setSelectedPkt(p);setShowModal(true)}} className="flex-1 text-[10px] py-2.5 shadow-lime-400/30 rounded-xl" variant="secondary" icon={Play}>Buat Sesi</Button>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => generateExamPDF(p.title, p, null, null, false)} className="flex-1 border border-slate-100 hover:border-emerald-900/10 text-slate-400 hover:text-emerald-900 bg-white rounded-lg py-1.5 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"><FileText size={12}/> Soal</button>
                            <button onClick={() => generateExamPDF(p.title, p, null, null, true)} className="flex-1 border border-slate-100 hover:border-emerald-900/10 text-slate-400 hover:text-emerald-900 bg-white rounded-lg py-1.5 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"><CheckCircle size={12}/> Kunci</button>
                        </div>
                    </Card>
                ))}
            </div>
              <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title="Buat Sesi Baru"><div className="space-y-4"><div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100"><p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-1">Paket Soal</p><b className="text-lg text-emerald-950 block leading-tight">{selectedPkt?.title}</b></div><Input label="Nama Guru" value={teacherName} onChange={e=>setTeacherName(e.target.value)}/><Input label="Nama Sekolah" value={schoolName} onChange={e=>setSchoolName(e.target.value)}/><Button onClick={createRoom} loading={loading} className="w-full py-3 text-base">Mulai</Button></div></Modal>
           </>
        )}
     </div>
  );
};

// ... Student Module (QuizPlayer, StudentPortal) Updated styling ...
const QuizPlayer = ({ questions, room, studentId, onSubmit, initialAnswers, studentName }) => {
   const [answers, setAnswers] = useState(initialAnswers || {});
   const [showNav, setShowNav] = useState(false);
   const [showWarning, setShowWarning] = useState(false);

   useEffect(() => {
     if (room.status === 'FINISHED') handleSubmit(true);
   }, [room.status]);

   // SAFEGUARD: If questions are undefined or empty, return loading/error
   if (!questions || questions.length === 0) {
       return <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold">Memuat soal...</div>;
   }

   const updateAnswer = async (qId, val) => {
      setAnswers(prev => ({...prev, [qId]: val}));
      try { await updateDoc(getPublicDoc("players", studentId), { [`answers.${qId}`]: val }); } catch (e) {}
   };

   const handleSubmit = (force = false) => {
      if (!force && questions.length - Object.keys(answers).length > 0) return setShowWarning(true);
      let rawScore = 0;
      questions.forEach(q => {
         const ans = answers[q.id];
         if (!ans) return;
         if (q.type === 'PG' && ans === q.answer) rawScore++;
         else if (q.type === 'PGK' && Array.isArray(ans) && ans.length === q.answer.length && ans.every(a => q.answer.includes(a))) rawScore++;
         else if (q.type === 'MATCH' && ans.length > 0) rawScore++; 
         else if (q.type === 'MTF') { if(q.options.every(o => ans[o.text] === o.answer)) rawScore++; }
         else if (q.type === 'ESSAY' && ans.length > 5) rawScore++;
      });
      const finalScore = questions.length > 0 ? (rawScore / questions.length) * 100 : 0;
      onSubmit(answers, finalScore);
   };

   return (
      <div className="max-w-4xl mx-auto pb-28 px-4 relative pt-4">
         <div className="sticky top-4 z-40 bg-white/90 backdrop-blur-xl border border-emerald-900/10 shadow-xl shadow-emerald-900/5 rounded-xl p-3 mb-8 flex justify-between items-center transition-all">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 ml-1">Sedang Mengerjakan</p>
                <div className="font-bold text-emerald-950 text-sm leading-tight line-clamp-1 max-w-[180px] ml-1">{room.packetTitle}</div>
             </div>
             <CountdownDisplay 
                startedAt={room.startedAt} 
                duration={room.duration} 
                isActive={true} 
                onTimeUp={() => handleSubmit(true)} 
             />
         </div>
         <div className="space-y-6">
            {questions.map((q, idx) => (
               <Card key={q.id} id={`q-${q.id}`} className="overflow-visible border">
                  <div className="flex gap-4">
                     <div className="flex-shrink-0 w-10 h-10 bg-emerald-900 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-900/10">{idx+1}</div>
                     <div className="flex-1 w-full min-w-0 pt-0.5">
                        <div className="mb-4"><ContentRenderer html={q.question} /></div>
                        <div className="space-y-3">
                           {q.type === 'PG' && q.options.map((opt, i) => (<div key={i} onClick={() => updateAnswer(q.id, opt)} className={`p-4 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${answers[q.id]===opt ? 'bg-lime-50 border-lime-400 ring-1 ring-lime-400/20 shadow-md shadow-lime-400/10' : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'}`}><div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${answers[q.id]===opt ? 'bg-lime-500 border-lime-500' : 'border-slate-200'}`}>{answers[q.id]===opt && <div className="w-2 h-2 bg-white rounded-full"/>}</div><ContentRenderer html={opt} className="text-sm flex-1 text-slate-700 font-medium"/></div>))}
                           {q.type === 'PGK' && q.options.map((opt, i) => { const isC = (answers[q.id]||[]).includes(opt); return (<div key={i} onClick={() => { let n = [...(answers[q.id]||[])]; if(isC) n=n.filter(x=>x!==opt); else n.push(opt); updateAnswer(q.id, n); }} className={`p-4 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${isC ? 'bg-lime-50 border-lime-400 ring-1 ring-lime-400/20 shadow-md shadow-lime-400/10' : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'}`}><div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${isC ? 'bg-lime-500 border-lime-500 text-white' : 'border-slate-200'}`}>{isC && <Check size={12} strokeWidth={4}/>}</div><ContentRenderer html={opt} className="text-sm flex-1 text-slate-700 font-medium"/></div>) })}
                           {q.type === 'MATCH' && <div className="space-y-3">{q.options.map((pair, i) => { const allR = q.options.map(o => o.right).sort(); const cur = (answers[q.id]||[]).find(x => x.left === pair.left)?.right || ""; return (<div key={i} className="flex flex-col md:flex-row gap-3 p-3 border border-slate-100 rounded-xl bg-slate-50/50"><div className="flex-1 font-bold text-slate-700 text-sm">{pair.left}</div><div className="text-slate-300 hidden md:block"><ArrowLeft className="rotate-180" size={16}/></div><select className="flex-1 p-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 text-xs font-medium" value={cur} onChange={(e) => { const v = e.target.value; let arr = (answers[q.id]||[]).filter(x => x.left !== pair.left); if(v) arr.push({left: pair.left, right: v}); updateAnswer(q.id, arr); }}><option value="">-- Pasangkan --</option>{allR.map((r,x)=><option key={x} value={r}>{r}</option>)}</select></div>) })}</div>}
                           {q.type === 'MTF' && <div className="border border-slate-100 rounded-xl overflow-hidden"><table className="w-full text-xs bg-white"><thead className="bg-slate-50 text-slate-500 border-b border-slate-100"><tr><th className="p-3 text-left font-bold uppercase tracking-wider text-[10px]">Pernyataan</th><th className="w-20 text-center border-l p-3 font-bold uppercase tracking-wider text-[10px] bg-emerald-50 text-emerald-900">Benar</th><th className="w-20 text-center border-l p-3 font-bold uppercase tracking-wider text-[10px] bg-orange-50 text-orange-600">Salah</th></tr></thead><tbody>{q.options.map((o,i)=>(<tr key={i} className="border-b last:border-0 hover:bg-slate-50"><td className="p-3 font-bold text-slate-700 text-sm"><ContentRenderer html={o.text}/></td><td className="text-center border-l bg-emerald-50/30"><div className="flex justify-center"><input type="radio" className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" name={`mtf-${q.id}-${i}`} checked={(answers[q.id]||{})[o.text]===true} onChange={()=>updateAnswer(q.id, {...(answers[q.id]||{}), [o.text]: true})}/></div></td><td className="text-center border-l bg-orange-50/30"><div className="flex justify-center"><input type="radio" className="w-4 h-4 text-orange-500 focus:ring-orange-500" name={`mtf-${q.id}-${i}`} checked={(answers[q.id]||{})[o.text]===false} onChange={()=>updateAnswer(q.id, {...(answers[q.id]||{}), [o.text]: false})}/></div></td></tr>))}</tbody></table></div>}
                           {q.type === 'ESSAY' && <textarea className="w-full border border-slate-200 p-4 rounded-xl focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 outline-none text-slate-800 leading-relaxed shadow-sm transition-all text-sm font-medium" rows={5} placeholder="Ketik jawaban Anda dengan jelas..." value={answers[q.id] || ''} onChange={e => updateAnswer(q.id, e.target.value)} />}
                        </div>
                     </div>
                  </div>
               </Card>
            ))}
         </div>
         
         <div className="fixed bottom-6 right-6 z-50">
            <button 
                onClick={()=>setShowNav(true)} 
                className="bg-emerald-900 text-white rounded-full px-6 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 font-bold text-sm border-2 border-lime-400/20"
            >
                <ListIcon size={20} strokeWidth={2.5}/>
                Lihat Soal
            </button>
         </div>
         
         <Modal isOpen={showNav} onClose={()=>setShowNav(false)} title="Navigasi Soal">
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {questions.map((q,i)=>(
                    <button key={q.id} onClick={()=>{document.getElementById(`q-${q.id}`).scrollIntoView({behavior:'smooth',block:'center'});setShowNav(false)}} className={`p-3 rounded-xl font-bold text-base transition-all aspect-square flex items-center justify-center border ${answers[q.id]?'bg-emerald-900 border-emerald-900 text-white shadow-md':'bg-white border-slate-100 text-slate-400 hover:border-lime-400 hover:text-lime-600'}`}>
                        {i+1}
                    </button>
                ))}
            </div>
         </Modal>
         
         <Modal isOpen={showWarning} onClose={()=>setShowWarning(false)} title="Peringatan!">
            <div className="text-center">
                <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32}/></div>
                <h3 className="text-lg font-black text-slate-800 mb-2">Jawaban Belum Lengkap</h3>
                <p className="text-slate-500 font-medium mb-6 text-sm">Masih ada soal yang belum Anda isi. Apakah Anda yakin ingin mengumpulkan?</p>
                <div className="flex gap-3">
                    <Button onClick={()=>setShowWarning(false)} variant="outline" className="flex-1 py-3 text-sm">Cek Lagi</Button>
                    <Button onClick={()=>handleSubmit(true)} className="flex-1 py-3 text-sm" variant="danger">Ya, Kumpulkan</Button>
                </div>
            </div>
         </Modal>
         
         <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-slate-200 p-4 z-30 shadow-[0_-5px_30px_rgba(0,0,0,0.1)]">
            <div className="max-w-4xl mx-auto">
                <Button onClick={()=>handleSubmit(false)} className="w-full py-3 text-lg shadow-lg shadow-lime-400/40" variant="secondary" icon={CheckCircle}>Kumpulkan Jawaban</Button>
            </div>
         </div>
      </div>
   );
};

const StudentPortal = ({ onGoHome, user, initialCode }) => {
   const [view, setView] = useState('join');
   const [roomData, setRoomData] = useState(null);
   const [questions, setQuestions] = useState([]);
   const [myDocId, setMyDocId] = useState(null);
   const [loading, setLoading] = useState(false);
   const [inputs, setInputs] = useState({ code: initialCode||'', name: '', school: '', class: '' });
   const [lobbyPlayers, setLobbyPlayers] = useState([]);
   const [existingAnswers, setExistingAnswers] = useState({});

   // -- PERSISTENCE LOGIC --
   useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const playerId = params.get('id');

        if (code && playerId) {
            // Restore session
            const fetchSession = async () => {
                const docRef = getPublicDoc("players", playerId);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    // Also get room data
                    const roomRef = getPublicDoc("rooms", data.roomId);
                    const roomSnap = await getDoc(roomRef);
                    
                    if (roomSnap.exists()) {
                        const roomD = { id: roomSnap.id, ...roomSnap.data() };
                        
                        setMyDocId(playerId);
                        setRoomData(roomD);
                        setQuestions(roomD.questions || []); // Ensure questions are set
                        setInputs({ ...inputs, code: code, name: data.name });
                        
                        if (data.status === 'submitted') {
                            setView('result');
                        } else if (roomD.status === 'PLAYING') {
                            setView('playing');
                        } else {
                            setView('lobby');
                        }
                    }
                }
            };
            fetchSession();
        } else if (initialCode) {
            setInputs(prev => ({ ...prev, code: initialCode }));
        }
   }, []);

   useEffect(() => { if (roomData?.id) { const u1 = onSnapshot(getPublicDoc("rooms", roomData.id), d => setRoomData({id:d.id,...d.data()})); const u2 = onSnapshot(query(getPublicCol("players"), where("roomId","==",roomData.id)), s => setLobbyPlayers(s.docs.map(d=>d.data()))); return () => { u1(); u2(); }; } }, [roomData?.id]);
   useEffect(() => { if (myDocId) return onSnapshot(getPublicDoc("players", myDocId), d => { if(d.exists()){ const dt=d.data(); if(dt.status==='submitted') setView('result'); if(dt.answers) setExistingAnswers(dt.answers); } }); }, [myDocId]);

   const handleJoin = async () => {
      setLoading(true);
      try {
         const qR = query(getPublicCol("rooms"), where("code", "==", inputs.code.toUpperCase()));
         const snap = await getDocs(qR);
         if (snap.empty) throw new Error("Kode salah");
         const r = {id:snap.docs[0].id, ...snap.docs[0].data()};
         if (r.status === 'FINISHED') throw new Error("Ujian selesai");
         
         const pRef = await addDoc(getPublicCol("players"), { uid: user.uid, roomId: r.id, name: inputs.name, school: inputs.school, class: inputs.class, status: 'joined', joinedAt: serverTimestamp(), answers: {} });
         
         // Set Persistence URL
         updateURL({ role: 'student', code: inputs.code, id: pRef.id });

         setMyDocId(pRef.id); setRoomData(r); setQuestions(r.questions || []); setView('lobby');
      } catch (e) { alert(e.message); }
      setLoading(false);
   };

   const handleGoHome = () => {
       updateURL({ role: null, code: null, id: null });
       onGoHome();
   }

   const handleSubmitQuiz = async (answers, finalScore) => {
      await updateDoc(getPublicDoc("players", myDocId), { answers, score: finalScore, status: 'submitted', submittedAt: serverTimestamp() });
      setView('result');
   };

   if (view === 'join') return (
      <div className="max-w-md mx-auto mt-8 px-4 pb-10">
         <Breadcrumbs onGoHome={handleGoHome} items={[{ label: 'Siswa', active: true }]} />
         <Card className="text-center shadow-xl border-t-8 border-t-lime-400 pt-6 rounded-xl">
            <h2 className="text-2xl font-black mb-2 text-emerald-950 tracking-tight">Masuk Ruang Ujian</h2>
            <p className="text-slate-500 mb-6 font-medium text-sm">Lengkapi data diri Anda untuk bergabung.</p>
            <div className="space-y-2 text-left">
               <Input label="Nama Lengkap" value={inputs.name} onChange={e => setInputs({...inputs, name: e.target.value})} placeholder="Nama Siswa"/>
               <Input label="Asal Sekolah" value={inputs.school} onChange={e => setInputs({...inputs, school: e.target.value})} placeholder="SMA N ..."/>
               <Input label="Kelas" value={inputs.class} onChange={e => setInputs({...inputs, class: e.target.value})} placeholder="XII IPA 1"/>
               <div className="bg-lime-50 p-4 rounded-xl border border-lime-200 mt-4">
                  <label className="block text-xs font-black text-lime-700 uppercase mb-2 text-center tracking-widest">Kode Akses Ujian</label>
                  <input className="w-full px-4 py-3 border border-lime-300 rounded-xl text-center text-3xl font-black font-mono uppercase text-emerald-900 tracking-[0.2em] outline-none focus:ring-4 focus:ring-lime-400/30 bg-white placeholder:text-lime-200 transition-all" value={inputs.code} onChange={e => setInputs({...inputs, code: e.target.value})} placeholder="XXXXXX" disabled={!!initialCode} />
               </div>
               <Button onClick={handleJoin} loading={loading} className="w-full py-4 text-lg shadow-lg shadow-emerald-900/20 mt-4" icon={Play}>Gabung Ujian</Button>
            </div>
         </Card>
      </div>
   );

   if (view === 'lobby') return (
      <div className="max-w-4xl mx-auto mt-6 px-4 text-center pb-20">
         <Card className="border-t-8 border-t-lime-400 shadow-xl rounded-xl">
            <h2 className="text-3xl font-black mb-1 text-emerald-950 tracking-tight">{roomData.schoolName}</h2>
            <p className="text-sm text-lime-600 font-bold mb-6 uppercase tracking-wide">Paket Soal: {roomData.packetTitle}</p>
            
            <div className="bg-slate-50 p-6 rounded-xl mb-8 text-center inline-block min-w-[280px] border border-slate-100">
               <div className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Status Ruangan</div>
               <div className={`font-black text-2xl ${roomData.status==='PLAYING'?'text-emerald-600 animate-pulse':'text-slate-400'}`}>
                  {roomData.status === 'PLAYING' ? 'UJIAN BERLANGSUNG' : roomData.status === 'FINISHED' ? 'SELESAI' : 'MENUNGGU GURU'}
               </div>
            </div>

            {roomData.status === 'PLAYING' ? (
               <div className="mb-8 max-w-sm mx-auto"><Button onClick={() => setView('playing')} className="w-full py-4 text-lg shadow-xl shadow-lime-400/50 animate-bounce" variant="secondary" icon={Play}>MULAI MENGERJAKAN</Button></div>
            ) : (
               <div className="mb-8 p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 font-bold flex items-center justify-center gap-2 text-sm">
                  <Loader2 className="animate-spin" size={18}/>
                  Silahkan tunggu instruksi guru...
               </div>
            )}

            <div className="text-left border-t border-slate-100 pt-6">
               <h3 className="font-black text-[10px] uppercase mb-4 text-slate-400 tracking-widest ml-1">Teman Sekelas ({lobbyPlayers.length})</h3>
               <div className="flex flex-wrap gap-2">
                  {lobbyPlayers.map((p,i)=><span key={i} className="px-3 py-1.5 bg-white border border-slate-100 rounded-lg text-xs font-bold text-slate-500 shadow-sm">{p.name}</span>)}
               </div>
            </div>
         </Card>
      </div>
   );

   if (view === 'playing') return <QuizPlayer questions={questions} room={roomData} studentId={myDocId} studentName={inputs.name} initialAnswers={existingAnswers} onSubmit={handleSubmitQuiz} />;

   if (view === 'result') return (
      <div className="max-w-md mx-auto mt-8 px-4 text-center pb-20">
         <Card className="border-t-8 border-t-emerald-900 shadow-xl pt-8 rounded-xl">
            <div className="w-20 h-20 bg-lime-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <CheckCircle size={40} className="text-emerald-900" strokeWidth={4}/>
            </div>
            <h2 className="text-2xl font-black text-emerald-950 mb-2">Ujian Selesai!</h2>
            <p className="text-slate-500 mb-8 px-4 font-medium text-sm">Jawaban Anda telah berhasil disimpan ke sistem.</p>
            <div className="space-y-3">
               <Button variant="outline" onClick={() => generateExamPDF(roomData.packetTitle, roomData, inputs.name, existingAnswers, false)} className="w-full py-3 border font-bold text-sm" icon={FileText}>Download Lembar Jawaban</Button>
               <Button variant="ghost" onClick={() => setView('lobby')} className="w-full py-3 text-slate-400 hover:text-emerald-900 text-sm" icon={Users}>Kembali ke Ruang Tunggu</Button>
            </div>
         </Card>
      </div>
   );
};

// ==========================================
// 6. MAIN APP ENTRY
// ==========================================

export default function App() {
  useExternalResources(); 
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminCreds, setAdminCreds] = useState({email: '', pass: ''});

  useEffect(() => {
    const initAuth = async () => {
      try { if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token); else await signInAnonymously(auth); } catch (e) { try { await signInAnonymously(auth); } catch(err) {} }
    };
    initAuth();
    
    // -- ROUTING LOGIC --
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    const codeParam = params.get('code');

    // Wait for auth to settle (mostly for admin check, but good practice)
    const unsubscribe = onAuthStateChanged(auth, u => { 
        setUser(u);
        
        // Handle routes AFTER auth is confirmed to prevent "teleporting"
        if (roleParam === 'admin') {
            setShowAdminLogin(true);
        } else if (roleParam === 'teacher') {
            setRole('teacher');
        } else if (roleParam === 'student' || codeParam) {
            setRole('student');
        }
        
        setLoading(false); // Only stop loading here
    });

    return () => unsubscribe();
  }, []);

  const handleAdminLogin = async () => {
     try { await signInWithEmailAndPassword(auth, adminCreds.email, adminCreds.pass); setRole('admin'); setShowAdminLogin(false); } catch(e) { alert("Gagal: " + e.message); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-emerald-900" size={48}/></div>;

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 md:p-8 font-sans">
        <div className="max-w-[1000px] w-full grid lg:grid-cols-2 gap-12 items-center">
            
            {/* LEFT COLUMN: INTRO & STEPS */}
            <div className="space-y-8 order-2 lg:order-1">
                <div>
                    <div className="inline-block px-3 py-1.5 bg-lime-100 text-emerald-900 rounded-full text-[10px] font-black tracking-[0.2em] mb-4 uppercase shadow-sm">Elkapede 3.0 Pro</div>
                    <h1 className="text-3xl md:text-3xl font-black text-emerald-950 mb-4 leading-[1.1] tracking-tight">
                        Tryout CBT gratis. <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-500 to-emerald-600">Tanpa login rumit</span>, langsung kerjakan
                    </h1>
                </div>

                <div className="space-y-6">
                    <div className="pl-5 border-l-4 border-emerald-900/10 hover:border-lime-400 transition-colors">
                        <h3 className="text-lg font-bold text-emerald-950 mb-1">1. Pilih Paket Soal</h3>
                        <p className="text-slate-500 leading-relaxed font-medium text-sm">Guru memilih paket soal yang tersedia lengkap di Bank Soal.</p>
                    </div>

                    <div className="pl-5 border-l-4 border-emerald-900/10 hover:border-lime-400 transition-colors">
                        <h3 className="text-lg font-bold text-emerald-950 mb-1">2. Buat Ruang Tryout</h3>
                        <p className="text-slate-500 leading-relaxed font-medium text-sm">Sistem otomatis membuat ruang ujian aman & real-time dalam detik.</p>
                    </div>

                    <div className="pl-5 border-l-4 border-emerald-900/10 hover:border-lime-400 transition-colors">
                        <h3 className="text-lg font-bold text-emerald-950 mb-1">3. Bagikan Kode</h3>
                        <p className="text-slate-500 leading-relaxed font-medium text-sm">Kode akses langsung muncul, siswa gabung dan kerjakan.</p>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: ACTION CARDS */}
            <div className="relative order-1 lg:order-2">
                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-xl border border-white shadow-2xl shadow-emerald-900/5 space-y-4 relative z-10">
                    <div className="text-center mb-4">
                        <h2 className="text-xl font-black text-emerald-950">Mulai Sekarang</h2>
                        <p className="text-slate-500 font-medium mt-1 text-sm">Pilih peran Anda untuk melanjutkan</p>
                    </div>

                    <button onClick={() => setRole('student')} className="w-full bg-white p-5 rounded-xl shadow-xl shadow-slate-200/50 border border-transparent hover:border-lime-400 hover:shadow-lime-200 hover:scale-[1.01] transition-all flex items-center gap-4 group text-left relative overflow-hidden">
                        <div className="w-14 h-14 bg-lime-100 rounded-xl flex items-center justify-center text-emerald-900 group-hover:text-emerald-950 group-hover:scale-105 transition-transform relative z-10">
                            <User size={28} strokeWidth={2.5} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold text-emerald-950">Masuk sebagai Siswa</h3>
                            <p className="text-slate-500 text-xs font-medium mt-0.5">Gabung ujian menggunakan kode</p>
                        </div>
                        <div className="ml-auto bg-slate-50 p-2 rounded-full text-slate-300 group-hover:text-lime-600 group-hover:bg-lime-100 transition-all relative z-10">
                             <ChevronRight size={18} strokeWidth={3}/>
                        </div>
                    </button>

                    <button onClick={() => setRole('teacher')} className="w-full bg-emerald-900 p-5 rounded-xl shadow-xl shadow-emerald-900/30 hover:shadow-2xl hover:shadow-emerald-900/40 hover:scale-[1.01] transition-all flex items-center gap-4 group text-left relative overflow-hidden">
                        <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center text-lime-400 group-hover:scale-105 transition-transform relative z-10">
                            <BookOpen size={28} strokeWidth={2.5} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold text-white">Masuk sebagai Guru</h3>
                            <p className="text-emerald-200/80 text-xs font-medium mt-0.5">Buat soal dan kelola sesi ujian</p>
                        </div>
                         <div className="ml-auto bg-white/10 p-2 rounded-full text-emerald-200/50 group-hover:text-white group-hover:bg-white/20 transition-all relative z-10">
                             <ChevronRight size={18} strokeWidth={3}/>
                        </div>
                    </button>

                    <div className="pt-4 text-center">
                        <button onClick={() => { setShowAdminLogin(true); updateURL({ role: 'admin' }); }} className="text-[10px] font-black text-slate-300 hover:text-orange-500 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto">
                            <Settings size={12}/> Login Administrator
                        </button>
                    </div>
                </div>
            </div>

        </div>

        <Modal isOpen={showAdminLogin} onClose={() => setShowAdminLogin(false)} title="Login Administrator">
           <div className="space-y-4">
              <Input label="Email Admin" value={adminCreds.email} onChange={e => setAdminCreds({...adminCreds, email:e.target.value})} />
              <Input label="Password" type="password" value={adminCreds.pass} onChange={e => setAdminCreds({...adminCreds, pass:e.target.value})} />
              <Button onClick={handleAdminLogin} className="w-full py-3 text-base mt-2" variant="secondary">Masuk Dashboard</Button>
           </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
       <div className="p-4 md:p-6 lg:p-8">
            {role === 'admin' && <AdminDashboard onGoHome={() => setRole(null)} user={user} />}
            {role === 'teacher' && <TeacherDashboard onGoHome={() => setRole(null)} user={user} />}
            {role === 'student' && <StudentPortal onGoHome={() => setRole(null)} user={user} initialCode={new URLSearchParams(window.location.search).get('code')} />}
       </div>
    </div>
  );
}