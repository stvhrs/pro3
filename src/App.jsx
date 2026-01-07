/**
 * ELKAPEDE 3.0 PRO - ULTIMATE EDITION
 * Integrated Single File React App for Computer Based Test (CBT)
 * * COPYRIGHT (c) 2025 ELKAPEDE SYSTEMS
 * DEVELOPED FOR: Educational Purpose
 * * ==========================================
 * FITUR UTAMA:
 * ==========================================
 * 1. Multi-Role Authentication (Admin, Guru, Siswa).
 * 2. Realtime Database via Firestore (No SQL).
 * 3. Ujian Realtime dengan Sinkronisasi Waktu Server.
 * 4. Export PDF (Soal, Kunci Jawaban, Hasil Ujian).
 * 5. Dukungan Matematika (LaTeX/KaTeX).
 * 6. Dukungan Multimedia (Gambar via URL/Base64).
 * 7. Analitik Sederhana.
 * * ==========================================
 * UPDATE LOG (V3.9.3):
 * ==========================================
 * [UI] Student Exam: Fixed PG option alignment (flex layout) to keep label and text on same line.
 * [UI] Student Exam: Removed bold styling from option labels (A, B, C...) as requested.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  BookOpen, User, LogOut, Settings, Play, 
  Plus, Trash2, Edit, X, Check, Eye, 
  ChevronRight, ArrowLeft, Clock, Users, 
  CheckCircle, AlertTriangle, Loader2, Copy,
  Bold, Italic, Underline, List, ListOrdered, Image as ImageIcon,
  Save, Home, FileText, Download, Grid, Filter, Share2, StopCircle,
  ChevronDown, Library, Monitor, Lock, History, Activity, Link,
  MessageCircle, GraduationCap, BarChart3, Calendar, HelpCircle,
  AlertCircle, LayoutDashboard, Send, Award, Phone, AlignLeft,
  MoreVertical, RefreshCw, XCircle, Search, Hash, FolderArchive, Map, Menu
} from 'lucide-react';

// ==========================================
// FIREBASE SDK & CONFIGURATION
// ==========================================
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, getDoc, getDocs, doc, 
  updateDoc, onSnapshot, query, where, serverTimestamp, deleteDoc, orderBy, setDoc,
  Timestamp
} from "firebase/firestore";
import { 
  getAuth, signInWithCustomToken, signOut, 
  signInAnonymously, onAuthStateChanged, signInWithEmailAndPassword
} from "firebase/auth";

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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'elkapede-v3-pro-production';

const getPublicCol = (col) => collection(db, 'artifacts', appId, 'public', 'data', col);
const getPublicDoc = (col, id) => doc(db, 'artifacts', appId, 'public', 'data', col, id);

// ==========================================
// UTILITY FUNCTIONS & HELPERS
// ==========================================

const updateURL = (params) => {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location);
  Object.keys(params).forEach(key => {
    if (params[key] === null) url.searchParams.delete(key);
    else url.searchParams.set(key, params[key]);
  });
  window.history.pushState({}, '', url);
};

const useExternalResources = () => {
  useEffect(() => {
    const scripts = [
        "https://cdn.tailwindcss.com",
        "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js", // ZIP Support
        "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js", // Save File Support
        "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js", // PDF Gen Step 1
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" // PDF Gen Step 2
    ];
    
    scripts.forEach(src => {
        if (!document.querySelector(`script[src="${src}"]`)) {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            document.head.appendChild(script);
        }
    });

    if (!document.querySelector('link[href*="katex.min.css"]')) {
      const link = document.createElement('link');
      link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
  }, []);
};

const formatIndoDate = (dateOrTimestamp) => {
  if (!dateOrTimestamp) return '-';
  let date;
  if (dateOrTimestamp.seconds) date = new Date(dateOrTimestamp.seconds * 1000);
  else date = new Date(dateOrTimestamp);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(date);
};

const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// ==========================================
// PDF/HTML GENERATOR ENGINE (REFACTORED)
// ==========================================

/**
* Core function to generate HTML String for Exams/LJK
* Handles correct rendering for "Download Soal" (Clean Exam Paper) vs "Download Kunci" vs "Student Report"
*/
const getExamHTMLTemplate = (title, packet, studentName = null, studentAnswers = null, withKey = false) => {
  const mapel = packet.mapel || '-';
  const kelas = packet.kelas || '-';
  const duration = packet.duration || 60;
  const logoUrl = "https://cdn-icons-png.flaticon.com/512/3413/3413535.png"; 

  // Kalkulasi Skor jika ada jawaban siswa
  let totalScore = 0;
  if (studentName && studentAnswers) {
      packet.questions.forEach(q => {
          const ans = studentAnswers[q.id];
          if(q.type === 'PG' && ans === q.answer) totalScore += 10;
      });
  }

  // Determine if this is a Blank Exam Paper Request (Admin/Teacher clicking "Download Soal")
  const isBlankTemplate = !studentName && !withKey;

  let content = packet.questions.map((q, i) => {
    const userAns = studentAnswers ? studentAnswers[q.id] : null;
    let answerDisplay = '';
    let statusIcon = ''; 
    let statusClass = '';

    // -- LOGIC RENDERING JAWABAN --
    
    // 1. PILIHAN GANDA
    if (q.type === 'PG') {
      // Determine Status for Report
      const isCorrect = userAns === q.answer;
      if(studentName) {
          statusIcon = isCorrect ? '<span style="color:green; font-weight:bold;">&#10003; BENAR</span>' : '<span style="color:red; font-weight:bold;">&#10007; SALAH</span>';
      }

      answerDisplay = q.options.map((opt, idx) => {
        const label = String.fromCharCode(65+idx);
        const isSelected = userAns === opt;
        const isKey = q.answer === opt;
        
        let style = 'padding: 6px 10px; margin-bottom: 5px; font-size: 13px; color: #1f2937; border-radius: 4px; border: 1px solid transparent;';
        
        if (isBlankTemplate) {
            // Clean style for exam paper
            style = 'padding: 6px 10px; margin-bottom: 5px; font-size: 13px; color: #1f2937; border-radius: 4px; border: 1px solid #e5e7eb;';
            return `<div style="${style}"><span style="font-weight:bold; margin-right:8px; width: 20px; display:inline-block;">${label}.</span> ${opt}</div>`;
        }
        else if (!withKey) {
            // Student Answer Sheet Preview
            if (isSelected) style += 'background-color: #fef9c3; border-color: #fde047; font-weight: bold;';
        } 
        else {
            // Key / Report
            if (isSelected && isKey) style += 'background-color: #dcfce7; border-color: #86efac; color: #166534; font-weight: bold;'; 
            else if (isSelected && !isKey) style += 'background-color: #fee2e2; border-color: #fca5a5; color: #991b1b; text-decoration: line-through;';
            else if (!isSelected && isKey) style += 'background-color: #f0fdf4; border-color: #bbf7d0; color: #15803d; font-weight: bold;'; 
        }

        return `<div style="${style}"><span style="font-weight:bold; margin-right:8px; width: 20px; display:inline-block;">${label}.</span> ${opt} 
            ${isSelected ? '(Jawaban Siswa)' : ''} 
            ${withKey && isKey ? '<b>(Kunci Benar)</b>' : ''}
        </div>`;
      }).join('');
    }
    
    // 2. PILIHAN GANDA KOMPLEKS (PGK)
    else if (q.type === 'PGK') {
        if (isBlankTemplate) {
            answerDisplay = q.options.map(opt => `
                <div style="padding: 5px; margin-bottom: 4px; display: flex; gap: 8px; align-items: flex-start;">
                    <div style="width: 16px; height: 16px; border: 2px solid #9ca3af; border-radius: 4px; margin-top: 3px;"></div>
                    <div style="font-size: 13px;">${opt}</div>
                </div>
            `).join('');
        } else {
            // Fallback for reports
            answerDisplay = `<div style="padding:10px; background:#f9fafb; border:1px solid #eee;">
                <div><strong>Jawaban Siswa:</strong> ${JSON.stringify(userAns) || '-'}</div>
                ${withKey ? `<div style="margin-top:5px; color:green;"><strong>Kunci:</strong> ${JSON.stringify(q.answer)}</div>` : ''}
            </div>`;
        }
    }

    // 3. MENJODOHKAN (MATCH)
    else if (q.type === 'MATCH') {
        if (isBlankTemplate) {
            // Render Left and Right columns side by side for manual matching
            const lefts = q.options.map(o => o.left);
            // Simple shuffle/display for right side? For now just display as table.
            const rights = q.options.map(o => o.right); 
            
            const rows = lefts.map((l, idx) => `
                <tr>
                    <td style="padding: 8px; border: 1px solid #e5e7eb; width: 45%;">${l}</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb; width: 10%; text-align:center;">o &nbsp;&nbsp;&nbsp; o</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb; width: 45%;">${rights[idx] || ''}</td>
                </tr>
            `).join('');

            answerDisplay = `
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px;">
                    <thead style="background: #f9fafb;"><tr><th style="padding:5px; border:1px solid #ddd;">Premis</th><th></th><th style="padding:5px; border:1px solid #ddd;">Pasangan</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
        } else {
            answerDisplay = `<div style="padding:10px; background:#f9fafb; border:1px solid #eee;">
                <div><strong>Jawaban Siswa:</strong> ${JSON.stringify(userAns) || '-'}</div>
                ${withKey ? `<div style="margin-top:5px; color:green;"><strong>Kunci:</strong> ${JSON.stringify(q.options)}</div>` : ''}
            </div>`;
        }
    }

    // 4. BENAR / SALAH (MTF)
    else if (q.type === 'MTF') {
        if (isBlankTemplate) {
            const rows = q.options.map(o => `
                <tr>
                    <td style="padding: 8px; border: 1px solid #e5e7eb;">${o.text}</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center; width: 60px;">B / S</td>
                </tr>
            `).join('');
            answerDisplay = `
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px;">
                    <thead style="background: #f9fafb;"><tr><th style="padding:5px; border:1px solid #ddd;">Pernyataan</th><th style="padding:5px; border:1px solid #ddd;">Jawab</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
        } else {
            answerDisplay = `<div style="padding:10px; background:#f9fafb; border:1px solid #eee;">
                <div><strong>Jawaban Siswa:</strong> ${JSON.stringify(userAns) || '-'}</div>
                ${withKey ? `<div style="margin-top:5px; color:green;"><strong>Kunci:</strong> ${JSON.stringify(q.options.map(o=>`${o.text}: ${o.answer?'B':'S'}`))}</div>` : ''}
            </div>`;
        }
    }

    // 5. ESSAY / URAIAN
    else if (q.type === 'ESSAY') {
        if (isBlankTemplate) {
            // Provide lined box for manual writing
            answerDisplay = `<div style="margin-top:10px; border:1px solid #e5e7eb; border-radius:8px; height: 120px; background: #fafafa; position: relative;">
                <div style="border-bottom: 1px dashed #e5e7eb; height: 30px;"></div>
                <div style="border-bottom: 1px dashed #e5e7eb; height: 30px;"></div>
                <div style="border-bottom: 1px dashed #e5e7eb; height: 30px;"></div>
            </div>`;
        } else {
            answerDisplay = `<div style="padding:10px; background:#f9fafb; border:1px solid #eee;">
                <div><strong>Jawaban Siswa:</strong> ${JSON.stringify(userAns) || '-'}</div>
                ${withKey ? `<div style="margin-top:5px; color:green;"><strong>Kata Kunci:</strong> ${JSON.stringify(q.answer)}</div>` : ''}
            </div>`;
        }
    }

    // GENERAL FALLBACK (If specific type not matched above)
    else {
        if (isBlankTemplate) {
            answerDisplay = ''; // Just show question
        } else {
            answerDisplay = `<div style="padding:10px; background:#f9fafb; border:1px solid #eee;">
                <div><strong>Jawaban Siswa:</strong> ${JSON.stringify(userAns) || '-'}</div>
            </div>`;
        }
    }

    // EXPLANATION (Only show if Key is requested)
    let explanationHTML = '';
    if (withKey && q.explanation) {
        explanationHTML = `<div style="margin-top:12px; padding:10px; background:#fffbeb; border-left: 4px solid #f59e0b; font-size:13px; color: #4b5563;">
            <strong>Pembahasan:</strong><br/>${q.explanation}
        </div>`;
    }

    return `
      <div style="margin-bottom: 30px; page-break-inside: avoid; border-bottom: 2px dashed #f3f4f6; padding-bottom: 20px;">
        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
            <div style="font-weight: bold; font-size: 14px; background: #111827; color: white; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px;">${i+1}</div>
            <div style="flex: 1;">
                <div style="display:flex; justify-content:space-between;">
                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Tipe: ${q.type}</div>
                    ${statusIcon ? `<div style="font-size:11px;">${statusIcon}</div>` : ''}
                </div>
                <div style="font-size: 14px; color: #111827; line-height: 1.6;">${q.question}</div>
            </div>
        </div>
        <div style="padding-left: 38px;">
            ${answerDisplay}
            ${explanationHTML}
        </div>
      </div>`;
  }).join('');

  return `
    <html>
      <head>
        <title>${title} - ${studentName || 'Master'}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body { padding: 40px; font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.5; color: #1f2937; max-width: 800px; margin: 0 auto; background: white; }
          img { max-width: 100%; height: auto; border-radius: 4px; margin: 10px 0; border: 1px solid #eee; }
          @media print { 
            body { -webkit-print-color-adjust: exact; padding: 0; } 
            .no-print { display: none; } 
            a { text-decoration: none; color: inherit; }
          }
          .header-box { display: flex; align-items: center; gap: 20px; border-bottom: 3px solid #111827; padding-bottom: 20px; margin-bottom: 40px; }
          .meta-box { flex: 1; }
          .logo-box img { width: 60px; height: 60px; object-fit: contain; }
        </style>
      </head>
      <body>
        <div class="no-print" style="position:fixed; top:20px; right:20px; z-index:100;">
          <button onclick="window.print()" style="background:#111827; color:white; padding:10px 20px; border:none; border-radius:8px; font-weight:bold; cursor:pointer; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1); display:flex; align-items:center; gap:8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2-2v5a2 2 0 0 1-2 2h-2"></path><path d="M6 14h12v8H6z"></path></svg> 
              Cetak / Simpan PDF
          </button>
        </div>
        
        <div class="header-box">
          <div class="logo-box"><img src="${logoUrl}" alt="Logo"/></div>
          <div class="meta-box">
              <h1 style="font-size:24px; font-weight:900; margin:0; color: #111827; text-transform: uppercase;">${packet.title}</h1>
              <div style="display: flex; gap: 20px; margin-top: 8px; font-size: 13px; color: #4b5563;">
                  <div><strong>Mapel:</strong> ${mapel}</div>
                  <div><strong>Kelas:</strong> ${kelas}</div>
                  <div><strong>Waktu:</strong> ${duration} Menit</div>
              </div>
          </div>
          <div style="text-align: right;">
              ${studentName ? `
                <div style="font-size:16px; font-weight:bold; color:#111827; background:#f3f4f6; padding:8px 16px; border-radius:8px;">${studentName}</div>
                ${withKey ? '<div style="margin-top:5px; font-size:11px; color:#6b7280;">Laporan Hasil Ujian & Pembahasan</div>' : ''}
              ` : ''}
              ${withKey && !studentName ? `<div style="font-size:14px; font-weight:bold; color:#d97706; border: 1px solid #d97706; padding: 4px 10px; border-radius: 4px; display: inline-block;">KUNCI JAWABAN</div>` : ''}
          </div>
        </div>

        ${content}

        <div style="margin-top: 50px; text-align: center; color: #9ca3af; font-size: 11px; border-top: 1px solid #eee; padding-top: 20px;">
          Dicetak menggunakan ELKAPEDE CBT Engine 3.0 Pro &bull; ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>

        <script>
          // Render Math on Load
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
  `;
};

const printExamPDF = (title, packet, studentName, studentAnswers, withKey) => {
    const htmlContent = getExamHTMLTemplate(title, packet, studentName, studentAnswers, withKey);
    const printWindow = window.open('', '_blank');
    if(!printWindow) return alert("Izinkan pop-up untuk mencetak.");
    printWindow.document.write(htmlContent);
    printWindow.document.close();
};

const downloadRawHTML = (title, contentHTML) => {
  const printWindow = window.open('', '_blank');
  if(!printWindow) return alert("Pop-up diblokir. Izinkan pop-up untuk download.");
  printWindow.document.write(`
    <html>
      <head><title>${title}</title><script src="https://cdn.tailwindcss.com"></script></head>
      <body class="p-8 font-sans text-slate-800 bg-white">
        <div id="content">${contentHTML}</div>
        <script>window.onload=()=>{setTimeout(()=>window.print(),500)}</script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

// ==========================================
// UI ATOMIC COMPONENTS
// ==========================================

const Snackbar = ({ message, type, isVisible, onClose }) => {
  if (!isVisible) return null;
  const config = {
    error: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', icon: <AlertTriangle size={18} className="text-red-600"/> },
    success: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', icon: <CheckCircle size={18} className="text-emerald-600"/> },
    info: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', icon: <AlertCircle size={18} className="text-blue-600"/> }
  };
  const theme = config[type] || config.success;

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 font-medium text-sm animate-in slide-in-from-bottom-5 fade-in duration-300 border ${theme.bg} ${theme.border} ${theme.text} min-w-[320px] justify-between backdrop-blur-sm bg-opacity-95`}>
      <div className="flex items-center gap-3">
        {theme.icon}
        <span>{message}</span>
      </div>
      <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors"><X size={14}/></button>
    </div>
  );
};

const useSnackbar = () => {
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });
  const showToast = useCallback((message, type = 'success') => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => setSnackbar(prev => ({ ...prev, show: false })), 4000);
  }, []);
  const closeToast = useCallback(() => setSnackbar(prev => ({ ...prev, show: false })), []);
  return { snackbar, showToast, closeToast };
};

const RichEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);
  
  // Sinkronisasi value eksternal ke innerHTML hanya saat inisialisasi atau perubahan drastis
  useEffect(() => { 
    if (editorRef.current && editorRef.current.innerHTML !== value) {
        // Cek sederhana agar kursor tidak lompat
        if (!editorRef.current.matches(':focus')) {
            editorRef.current.innerHTML = value || ''; 
        }
    }
  }, [value]);

  const exec = (cmd, val) => { document.execCommand(cmd, false, val); triggerChange(); };
  
  const triggerChange = () => {
      if (onChange) onChange(editorRef.current.innerHTML);
  };

  const handlePaste = (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    let filePasted = false;
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        filePasted = true;
        e.preventDefault(); 
        const r = new FileReader();
        r.onload = (ev) => exec('insertImage', ev.target.result);
        r.readAsDataURL(item.getAsFile());
      }
    }
  };

  const handleImgClick = (e) => { 
      if(e.target.tagName==='IMG') { 
          const w = prompt("Ubah Ukuran Gambar (px atau %):", e.target.style.width || "100%"); 
          if(w) { e.target.style.width=w; triggerChange(); }
      }
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all duration-300">
      <div className="flex gap-1 p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto scrollbar-hide">
        {[
            ['bold',Bold], ['italic',Italic], ['underline',Underline], 
            ['insertOrderedList',ListOrdered], ['insertUnorderedList',List]
        ].map(([c,Icon]) => (
            <button key={c} onClick={()=>exec(c)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 flex-shrink-0 transition-colors" title={c}>
                <Icon size={16}/>
            </button>
        ))}
        <div className="w-px bg-slate-300 mx-1"></div>
        <button onClick={()=>{const u=prompt("Masukkan URL Gambar:");if(u)exec('insertImage',u)}} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 flex-shrink-0 transition-colors" title="Insert Image from URL">
            <ImageIcon size={16}/>
        </button>
      </div>
      <div 
        ref={editorRef} 
        className="p-4 min-h-[120px] outline-none prose prose-sm max-w-none text-slate-700 font-normal leading-relaxed empty:before:content-[attr(placeholder)] empty:before:text-slate-400" 
        contentEditable 
        onInput={triggerChange} 
        onPaste={handlePaste} 
        onClick={handleImgClick}
        placeholder={placeholder}
      />
    </div>
  );
};

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
  
  return <div ref={ref} className="prose prose-sm max-w-none text-slate-800 break-words"/>;
};

// -- Reusable Buttons, Cards, Inputs --

const Button = ({ children, onClick, variant='primary', className='', icon:Icon, loading, ...props }) => {
  const baseClass = "flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold tracking-wide transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed text-sm shadow-sm";
  const variants = {
    primary: 'bg-emerald-900 text-white hover:bg-emerald-800 hover:shadow-emerald-900/20 shadow-emerald-900/10',
    secondary: 'bg-lime-400 text-emerald-950 hover:bg-lime-300 hover:shadow-lime-400/30 shadow-lime-400/10',
    outline: 'bg-white text-emerald-900 border border-emerald-900/10 hover:border-emerald-900/30 hover:bg-emerald-50',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-emerald-900 shadow-none',
    danger: 'bg-white text-rose-600 border border-rose-100 hover:bg-rose-50 hover:border-rose-200 hover:shadow-rose-500/10'
  };

  return (
    <button onClick={onClick} className={`${baseClass} ${variants[variant]} ${className}`} disabled={loading} {...props}>
      {loading ? <Loader2 className="animate-spin" size={16}/> : (Icon && <Icon size={18} strokeWidth={2.5} className="flex-shrink-0"/>)} 
      {children}
    </button>
  );
};

const Card = ({children, title, subtitle, action, className='', id=''}) => (
  <div id={id} className={`bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 overflow-hidden ${className}`}>
    {(title||action) && (
      <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-start md:items-center bg-white gap-4">
        <div>
            {title && <h3 className="font-bold text-emerald-950 text-lg tracking-tight leading-snug">{title}</h3>}
            {subtitle && <p className="text-slate-400 text-xs font-medium mt-1">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const Input = ({label, error, icon:Icon, ...props}) => (
  <div className="mb-4 group">
    {label && <label className="block text-xs font-black text-emerald-900 uppercase tracking-widest mb-2 ml-1 opacity-70 group-focus-within:opacity-100 transition-opacity">{label}</label>}
    <div className="relative">
        {Icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors"><Icon size={18}/></div>}
        <input 
            className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 outline-none text-slate-800 font-medium transition-all placeholder:text-slate-300 bg-slate-50/50 focus:bg-white text-sm`} 
            {...props}
        />
    </div>
    {error && <p className="text-rose-500 text-xs mt-1 ml-1 font-medium">{error}</p>}
  </div>
);

const Select = ({label, options, icon:Icon, className="mb-4", ...props}) => (
  <div className={`w-full group ${className}`}>
    {label && <label className="block text-xs font-black text-emerald-900 uppercase tracking-widest mb-2 ml-1 opacity-70 group-focus-within:opacity-100 transition-opacity">{label}</label>}
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-900/40 group-focus-within:text-emerald-600 transition-colors">
        {Icon ? <Icon size={18}/> : <Filter size={18}/>}
      </div>
      <select className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 outline-none text-slate-800 font-bold bg-white appearance-none cursor-pointer transition-all text-sm bg-transparent" {...props}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-emerald-900 transition-colors" size={16} strokeWidth={3} />
    </div>
  </div>
);

const Modal = ({isOpen, onClose, title, children, footer}) => { 
  if(!isOpen) return null; 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-white flex-shrink-0">
          <h3 className="font-bold text-xl text-emerald-950 tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-rose-500 transition-all"><X size={20}/></button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>
        {footer && <div className="p-4 bg-slate-50 border-t border-slate-100">{footer}</div>}
      </div>
    </div>
  ); 
};

// -- Navigation & Layout --

const Breadcrumbs = ({onGoHome, items}) => (
  <div className="flex items-center gap-2 text-sm text-slate-400 mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
    <button onClick={onGoHome} className="hover:text-emerald-800 flex items-center gap-2 font-bold transition-colors flex-shrink-0 group">
      <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100 group-hover:border-emerald-200 group-hover:bg-emerald-50 transition-all">
          <Home size={16} className="text-lime-600 group-hover:text-emerald-700"/>
      </div>
      <span className="hidden sm:inline text-xs uppercase tracking-wider">Dashboard</span>
    </button>
    {items.map((it,i)=>(
      <React.Fragment key={i}>
        <div className="text-slate-300 flex-shrink-0"><ChevronRight size={14} strokeWidth={2}/></div>
        {it.onClick&&!it.active ? 
          <button onClick={it.onClick} className="hover:text-emerald-800 font-medium transition-colors flex-shrink-0 text-xs">{it.label}</button> : 
          <span className={`font-bold flex-shrink-0 ${it.active ? 'text-emerald-900 bg-lime-100 px-3 py-1 rounded-full text-[10px] uppercase tracking-wide border border-lime-200' : 'text-xs'}`}>{it.label}</span>
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

    // Durasi dalam milidetik
    const end = start + (duration * 60 * 1000);
    
    const tick = () => {
      const now = Date.now();
      const diff = end - now;
      
      if (diff <= 0) { 
          setTimeLeft(0); 
          // Trigger onTimeUp hanya jika sebelumnya belum 0 (mencegah loop)
          if (isActive && onTimeUp) onTimeUp(); 
      } else { 
          setTimeLeft(diff); 
      }
    };
    
    tick(); 
    const interval = setInterval(tick, 1000); 
    return () => clearInterval(interval);
  }, [startedAt, duration, isActive]); // Removed onTimeUp from dependency to avoid loop if function isn't memoized

  if (timeLeft === null) return <span className="font-mono text-slate-300 tracking-widest text-sm">--:--</span>;
  
  const m = Math.floor(timeLeft / 60000); 
  const s = Math.floor((timeLeft % 60000) / 1000); 
  const isCritical = timeLeft < 60000; // Kurang dari 1 menit
  
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-xl border transition-all shadow-sm ${isCritical ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' : 'bg-white text-emerald-900 border-emerald-100'}`}>
        <Clock size={20} className={isCritical?'text-rose-500':'text-lime-500'} strokeWidth={2.5} />
        {m.toString().padStart(2,'0')}:{s.toString().padStart(2,'0')}
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

  // Helper untuk manipulasi array pertanyaan
  const addQuestion = (type) => {
    let newQ = { id: generateUniqueId(), type, question: 'Pertanyaan baru...', answer: null, explanation: 'Pembahasan...', options: [] };
    if(type==='PG') { newQ.options=['A','B','C','D','E']; newQ.answer='A'; }
    else if(type==='PGK') { newQ.options=['Opsi 1','Opsi 2','Opsi 3','Opsi 4']; newQ.answer=[]; }
    else if(type==='MTF') newQ.options=[{text:'Pernyataan',answer:true}];
    else newQ.answer='Kata Kunci';
    setQuestions([...questions, newQ]);
  };
  const updateQ = (idx, field, val) => { const n=[...questions]; n[idx][field]=val; setQuestions(n); };

  // Helper untuk default questions saat buat paket baru
  const getExampleQuestions = () => [
    { 
      id: generateUniqueId(), type: 'PG', 
      question: 'Hitunglah nilai limit berikut: $$\\lim_{x \\to 0} \\frac{\\sin(2x)}{x}$$', 
      options: ['0', '1', '2', '$$\\infty$$', 'Tidak Ada'], answer: '2', explanation: 'Gunakan sifat limit trigonometri $$\\lim_{x \\to 0} \\frac{\\sin(ax)}{bx} = \\frac{a}{b}$$.' 
    },
    { 
      id: generateUniqueId(), type: 'PGK', 
      question: 'Manakah dari berikut ini yang merupakan bilangan prima? (Pilih semua yang benar)', 
      options: ['2', '9', '11', '15', '19'], answer: ['2', '11', '19'], explanation: 'Bilangan prima hanya memiliki 2 faktor, 1 dan dirinya sendiri.' 
    },
    { 
      id: generateUniqueId(), type: 'MTF', 
      question: 'Tentukan kebenaran pernyataan logika matematika berikut:', 
      options: [{text:'$$p \\implies q$$ ekuivalen dengan $$\\neg p \\lor q$$', answer: true}, {text:'$$p \\land q$$ bernilai benar jika salah satu salah', answer: false}], explanation: 'Tabel kebenaran implikasi dan konjungsi.' 
    },
    { 
      id: generateUniqueId(), type: 'ESSAY', 
      question: 'Jelaskan secara singkat apa yang dimaksud dengan Fotosintesis!', 
      answer: 'cahaya, matahari, glukosa, oksigen', explanation: 'Proses pembuatan makanan pada tumbuhan menggunakan bantuan cahaya matahari.' 
    }
  ];

  // View: Editor Paket Soal
  if (view === 'editor') {
    return (
      <div className="max-w-5xl mx-auto pb-24 px-4 pt-6">
        <Snackbar {...snackbar} onClose={closeToast} />
        <Breadcrumbs onGoHome={onGoHome} items={[{ label: 'Admin', onClick: () => setView('list') }, { label: currentPacket ? 'Edit Paket' : 'Paket Baru', active: true }]} />
        
        {/* Sticky Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 sticky top-4 z-40 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-100 shadow-xl gap-4">
           <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setView('list')} icon={ArrowLeft} className="px-3">Batal</Button>
              <div>
                  <h2 className="font-bold text-lg text-emerald-950">Editor Paket Soal</h2>
                  <p className="text-xs text-slate-400">Total Soal: {questions.length}</p>
              </div>
           </div>
           <Button onClick={handleSave} icon={Save} loading={loading} className="w-full md:w-auto">Simpan Paket</Button>
        </div>

        {/* Metadata Card */}
        <Card title="Informasi Paket" className="mb-8">
           <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="md:col-span-2"><Input label="Judul Paket" value={meta.title} onChange={e=>setMeta({...meta,title:e.target.value})} placeholder="Contoh: Tryout Biologi Semester 1"/></div>
              <div>
                  <label className="block text-xs font-black text-emerald-900 uppercase tracking-widest mb-2 ml-1 opacity-70">Mapel</label>
                  <select className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none bg-white text-sm" value={meta.mapel} onChange={e=>setMeta({...meta,mapel:e.target.value})}>
                        <option value="">-- Pilih --</option>
                        {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
              </div>
              <Select label="Jenjang" options={[{value:'SD',label:'SD'},{value:'SMP',label:'SMP'},{value:'SMA',label:'SMA'},{value:'Umum',label:'Umum'}]} value={meta.jenjang} onChange={e=>setMeta({...meta,jenjang:e.target.value})}/>
              <Input label="Kelas" value={meta.kelas} onChange={e=>setMeta({...meta,kelas:e.target.value})} placeholder="12"/>
           </div>
        </Card>

        {/* Questions List */}
        <div className="space-y-8">
           {questions.map((q, i) => (
              <Card key={q.id} title={`Soal No. ${i+1}`} action={<button onClick={()=>setQuestions(questions.filter((_,x)=>x!==i))} className="text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-colors" title="Hapus Soal"><Trash2 size={18}/></button>}>
                 <div className="space-y-6">
                    <div>
                       <span className={`inline-block px-3 py-1 text-[10px] font-black rounded-lg mb-3 uppercase tracking-wide border 
                         ${q.type==='PG' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                           q.type==='PGK' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                           q.type==='MATCH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                           q.type==='MTF' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                           'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'}`}>
                           {q.type}
                       </span>
                       <RichEditor value={q.question} onChange={v=>updateQ(i,'question',v)} placeholder="Tulis pertanyaan disini..."/>
                    </div>
                    
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                       <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 block flex items-center gap-2"><Settings size={14}/> Konfigurasi Jawaban</label>
                       
                       {/* Pilihan Ganda */}
                       {q.type==='PG' && (
                         <>
                           {q.options.map((o,x)=>(
                             <div key={x} className="flex gap-4 mb-4 items-start group">
                                <input type="radio" className="mt-4 w-5 h-5 accent-emerald-600 cursor-pointer" checked={q.answer===o} onChange={()=>updateQ(i,'answer',o)}/>
                                <div className="flex-1"><RichEditor value={o} onChange={v=>{const n=[...q.options];n[x]=v;updateQ(i,'options',n);if(q.answer===o)updateQ(i,'answer',v)}}/></div>
                                <button onClick={()=>{
                                    const n=q.options.filter((_,z)=>z!==x);
                                    updateQ(i,'options',n);
                                    if(q.answer===o) updateQ(i,'answer', null);
                                }} className="text-slate-300 hover:text-rose-500 self-center"><X size={20}/></button>
                             </div>
                           ))}
                           <Button variant="ghost" className="text-xs text-lime-600" onClick={()=>updateQ(i,'options',[...q.options,'Opsi Baru'])}>+ Tambah Opsi</Button>
                         </>
                       )}
                       
                       {/* Pilihan Ganda Kompleks */}
                       {q.type==='PGK' && (
                         <>
                           {q.options.map((o,x)=>(
                             <div key={x} className="flex gap-4 mb-4 items-start">
                                <input type="checkbox" className="mt-4 w-5 h-5 accent-emerald-600 rounded cursor-pointer" checked={Array.isArray(q.answer) && q.answer.includes(o)} onChange={()=>{
                                    const a = Array.isArray(q.answer) ? [...q.answer] : [];
                                    if(a.includes(o)) updateQ(i,'answer',a.filter(z=>z!==o));
                                    else updateQ(i,'answer',[...a,o]);
                                }}/>
                                <div className="flex-1 flex gap-2">
                                    <div className="flex-1"><RichEditor value={o} onChange={v=>{
                                      const n=[...q.options];
                                      const oldVal = n[x];
                                      n[x]=v;
                                      updateQ(i,'options',n);
                                      // Update answer array if exists
                                      if(Array.isArray(q.answer) && q.answer.includes(oldVal)){
                                          const newAns = q.answer.map(z => z === oldVal ? v : z);
                                          updateQ(i,'answer', newAns);
                                      }
                                    }}/></div>
                                    <button onClick={()=>{const n=q.options.filter((_,z)=>z!==x);updateQ(i,'options',n)}} className="text-slate-300 hover:text-rose-500 self-center"><X size={20}/></button>
                                </div>
                             </div>
                           ))}
                           <Button variant="ghost" className="text-xs text-lime-600" onClick={()=>updateQ(i,'options',[...q.options,'Opsi Baru'])}>+ Tambah Opsi</Button>
                         </>
                       )}

                       {/* Menjodohkan */}
                       {q.type==='MATCH' && (
                           <div>
                               {q.options.map((p,x)=>(
                                   <div key={x} className="flex gap-4 mb-4 items-center">
                                       <div className="flex-1"><input className="w-full border p-3 rounded-xl text-sm" value={p.left} onChange={e=>{const n=[...q.options];n[x].left=e.target.value;updateQ(i,'options',n)}} placeholder="Premis (Kiri)"/></div>
                                       <div className="text-slate-300"><ArrowLeft size={20} className="rotate-180"/></div>
                                       <div className="flex-1"><input className="w-full border p-3 rounded-xl text-sm" value={p.right} onChange={e=>{const n=[...q.options];n[x].right=e.target.value;updateQ(i,'options',n)}} placeholder="Pasangan (Kanan)"/></div>
                                       <button onClick={()=>{const n=q.options.filter((_,z)=>z!==x);updateQ(i,'options',n)}} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg"><Trash2 size={16}/></button>
                                   </div>
                               ))}
                               <Button variant="ghost" className="text-xs text-lime-600" onClick={()=>updateQ(i,'options',[...q.options,{left:'',right:''}])}>+ Tambah Pasangan</Button>
                           </div>
                       )}
                       
                       {/* Benar / Salah */}
                       {q.type==='MTF' && (
                           <div>
                               {q.options.map((p,x)=>(
                                   <div key={x} className="flex gap-4 mb-4 items-center bg-white p-2 rounded-xl border border-slate-100">
                                       <div className="flex-1"><RichEditor value={p.text} onChange={v=>{const n=[...q.options];n[x].text=v;updateQ(i,'options',n)}}/></div>
                                       <div className="w-32">
                                           <select value={p.answer} onChange={e=>{const n=[...q.options];n[x].answer=(e.target.value==='true');updateQ(i,'options',n)}} className="w-full border p-2 rounded-lg text-sm bg-slate-50 font-bold">
                                               <option value="true">BENAR</option>
                                               <option value="false">SALAH</option>
                                           </select>
                                       </div>
                                       <button onClick={()=>{const n=q.options.filter((_,z)=>z!==x);updateQ(i,'options',n)}} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg"><X size={16}/></button>
                                   </div>
                               ))}
                               <Button variant="ghost" className="text-xs text-lime-600" onClick={()=>updateQ(i,'options',[...q.options,{text:'Pernyataan Baru',answer:true}])}>+ Tambah Pernyataan</Button>
                           </div>
                       )}

                       {/* Essay */}
                       {q.type==='ESSAY' && (
                          <div>
                              <div className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-widest">KATA KUNCI (Pisahkan dengan koma untuk auto-grading parsial)</div>
                              <textarea className="w-full border border-emerald-200 bg-emerald-50/30 p-4 rounded-xl focus:ring-2 focus:ring-emerald-400/20 outline-none text-sm font-medium text-emerald-900 placeholder:text-emerald-900/40" rows={3} value={q.answer} onChange={e=>updateQ(i,'answer',e.target.value)} placeholder="Contoh: fotosintesis, klorofil, matahari"/>
                          </div>
                       )}
                    </div>
                    
                    <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100">
                       <label className="text-xs font-black text-orange-600 uppercase tracking-widest mb-3 block flex items-center gap-2"><BookOpen size={14}/> Pembahasan & Referensi</label>
                       <RichEditor value={q.explanation} onChange={v=>updateQ(i,'explanation',v)}/>
                    </div>
                 </div>
              </Card>
           ))}

           {/* Add Button Sticky Footer */}
           <div className="grid grid-cols-4 gap-3 sticky bottom-6 p-3 rounded-2xl bg-white/90 backdrop-blur shadow-2xl border border-slate-200 z-30">
              {[
                { type: 'PG', label: 'Pilihan Ganda', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                { type: 'PGK', label: 'Pilihan Ganda Kompleks', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
                { type: 'MTF', label: 'Benar/Salah', color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' },
                { type: 'ESSAY', label: 'Uraian', color: 'bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200' }
              ].map(t => (
                <button key={t.type} onClick={() => addQuestion(t.type)} className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl font-bold text-[10px] sm:text-xs transition-all active:scale-95 ${t.color}`}>
                  <Plus size={18} strokeWidth={3}/> 
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="sm:hidden">{t.type}</span>
                </button>
              ))}
           </div>
        </div>
      </div>
    );
  }

  // View: Manajemen Mapel
  if (view === 'mapel') {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-6">
         <Breadcrumbs onGoHome={onGoHome} items={[{ label: 'Admin', onClick: () => setView('list') }, { label: 'Kelola Mapel', active: true }]} />
         <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-black text-emerald-950 tracking-tight">Daftar Mata Pelajaran</h1>
            <Button onClick={() => setView('list')} variant="ghost" icon={ArrowLeft}>Kembali</Button>
         </div>
         <div className="grid md:grid-cols-3 gap-8">
            <Card title="Tambah Baru" className="h-fit">
               <div className="flex flex-col gap-4">
                  <input className="w-full border border-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 transition-all text-sm" placeholder="Nama Mapel (ex: Fisika)" value={newSubject} onChange={e => setNewSubject(e.target.value)}/>
                  <Button onClick={handleAddSubject} icon={Plus} variant="secondary" className="w-full" loading={loading}>Simpan</Button>
               </div>
            </Card>
            <div className="md:col-span-2">
               <Card title={`Total Mapel: ${subjects.length}`}>
                  <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                     {subjects.map(s => (
                        <div key={s.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-xl group hover:bg-white hover:border-lime-300 hover:shadow-md hover:-translate-y-0.5 transition-all">
                           <span className="font-bold text-slate-700 text-sm">{s.name}</span>
                           <button onClick={() => handleDeleteSubject(s.id)} className="text-slate-300 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50 transition-colors"><Trash2 size={18}/></button>
                        </div>
                     ))}
                     {subjects.length === 0 && <div className="text-slate-400 italic text-center py-12 bg-slate-50 rounded-xl border border-dashed text-sm">Belum ada mata pelajaran.</div>}
                  </div>
               </Card>
            </div>
         </div>
      </div>
    );
  }

  // View: Dashboard Admin (List Paket)
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
       <Snackbar {...snackbar} onClose={closeToast} />
       <Breadcrumbs onGoHome={onGoHome} items={[{label:'Administrator',active:true}]}/>
       
       <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
         <div>
           <h1 className="text-4xl font-black text-emerald-950 tracking-tight mb-2">Bank Soal</h1>
           <p className="text-slate-500 text-sm max-w-lg leading-relaxed">Kelola repositori soal ujian untuk seluruh jenjang. Pastikan soal sudah divalidasi sebelum dipublikasikan.</p>
         </div>
         <div className="flex gap-3">
             <Button variant="outline" icon={Library} onClick={() => setView('mapel')}>Kelola Mapel</Button>
             <Button icon={Plus} variant="secondary" onClick={()=>{setCurrentPacket(null);setQuestions(getExampleQuestions());setMeta({title:'',mapel:'Matematika',jenjang:'SMA',kelas:'12',duration:60});setView('editor')}}>Buat Paket Baru</Button>
         </div>
       </div>
       
       {/* Filter Bar */}
       <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 mb-10">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['All','SD','SMP','SMA','Umum'].map(j=>(
                   <button key={j} onClick={()=>setActiveTab(j)} className={`px-6 py-2.5 rounded-xl text-xs font-bold border transition-all flex-shrink-0 ${activeTab===j?'bg-emerald-900 text-white border-emerald-900 shadow-lg shadow-emerald-900/20':'bg-white text-slate-400 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'}`}>{j}</button>
                ))}
             </div>
             <div className="grid grid-cols-2 gap-4">
                <Select label="Mata Pelajaran" icon={BookOpen} value={filterMapel} onChange={e=>setFilterMapel(e.target.value)} options={uniqueMapels.map(m=>({value:m,label:m}))} className="mb-0"/>
                <Select label="Kelas" icon={Filter} value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} options={uniqueClasses.map(c=>({value:c,label:`Kelas ${c}`}))} className="mb-0"/>
             </div>
         </div>
       </div>

       {/* Packet Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {filteredPackets.map(p=>(
             <Card key={p.id} className="group border-slate-200">
                <div className="flex justify-between items-start mb-4">
                    <span className="bg-lime-100 text-emerald-900 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border border-lime-200">{p.jenjang}</span>
                    <span className="text-xs font-mono text-slate-400">{p.questions?.length || 0} Soal</span>
                </div>
                <h3 className="font-bold text-xl mb-2 text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-2">{p.title}</h3>
                <p className="text-slate-500 text-sm mb-6">{p.mapel} • Kelas {p.kelas}</p>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                   <Button onClick={()=>{setCurrentPacket(p);setMeta(p);setQuestions(p.questions||[]);setView('editor')}} className="text-xs" icon={Edit} variant="outline">Edit</Button>
                   <Button onClick={async()=>{if(confirm('Yakin ingin menghapus paket ini selamanya?'))await deleteDoc(getPublicDoc("packets",p.id))}} className="text-xs" icon={Trash2} variant="danger">Hapus</Button>
                </div>
                 <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                    <button onClick={() => printExamPDF(p.title, p, null, null, false)} className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-800 bg-slate-50 hover:bg-emerald-50 rounded-lg py-2 transition-all"><FileText size={14}/> Soal</button>
                    <button onClick={() => printExamPDF(p.title, p, null, null, true)} className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-800 bg-slate-50 hover:bg-emerald-50 rounded-lg py-2 transition-all"><CheckCircle size={14}/> Kunci</button>
                 </div>
             </Card>
         ))}
         {filteredPackets.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200">Tidak ada paket soal yang ditemukan sesuai filter.</div>}
       </div>
    </div>
  );
};

// ==========================================
// 4. TEACHER MODULE
// ==========================================

const TeacherDashboard = ({ onGoHome, user }) => {
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
  const [linkCopied, setLinkCopied] = useState(false); // NEW STATE: Feedback copy link
  const { snackbar, showToast, closeToast } = useSnackbar();

  // Load Data
  useEffect(() => {
    // Local storage sync for session history persistence
    const savedSessions = localStorage.getItem('elkapede_teacher_sessions');
    if (savedSessions) {
        setLocalSessions(JSON.parse(savedSessions));
    }

    // Direct link handler
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('roomId');
    if (roomId) {
        getDoc(getPublicDoc("rooms", roomId)).then(doc => { if (doc.exists()) { setRoom({ id: doc.id, ...doc.data() }); setView('lobby'); } });
    }
    
    // Realtime packets listener
    const unsub = onSnapshot(getPublicCol("packets"), s => setPackets(s.docs.map(d=>({id:d.id,...d.data()}))));
    return () => unsub();
  }, []);

  // Sync Room Data when in Lobby
  useEffect(() => {
    if (room?.id) {
       updateURL({ role: 'teacher', roomId: room.id });
       const uPlayers = onSnapshot(query(getPublicCol("players"), where("roomId","==",room.id)), s => setPlayers(s.docs.map(d=>({id:d.id,...d.data()}))));
       const uRoom = onSnapshot(getPublicDoc("rooms", room.id), d => {
           if(d.exists()) {
               const data = d.data();
               setRoom(prev => ({...prev, ...data}));
               
               // Sync local status if finished remotely (e.g. by timer)
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
       
       // Optimistic Update Local Storage
       const localRoomData = {
           id: ref.id,
           ...newRoomData,
           createdAt: { seconds: Date.now() / 1000 } 
       };

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
      if(!confirm("Akhiri sesi ujian? Siswa tidak akan bisa mengerjakan lagi.")) return;
      
      updateLocalSessionStatus(room.id, 'FINISHED');
      try {
          await updateDoc(getPublicDoc("rooms", room.id), { status: 'FINISHED' });
          showToast("Sesi diakhiri.");
      } catch(e) { console.error("Firestore Error", e); }
  };

  const copyLink = async () => {
     const url = `${window.location.origin}${window.location.pathname}?code=${room.code}`;
     try {
       await navigator.clipboard.writeText(url);
       //  showToast("Link ujian telah disalin ke clipboard! Siap dibagikan."); // Removed toast as per request for inline feedback only
       setLinkCopied(true);
       setTimeout(() => setLinkCopied(false), 3000); // Reset after 3s
     } catch(e) { showToast("Gagal menyalin link.", 'error'); }
  };

  // --- NEW: Batch Download Logic with html2canvas and jspdf ---
  const handleBatchDownload = async () => {
      if (!window.JSZip || !window.saveAs || !window.html2canvas || !window.jspdf) {
          return showToast("Library PDF/ZIP sedang dimuat. Silakan tunggu & coba lagi.", 'info');
      }

      const submittedPlayers = players.filter(p => p.status === 'submitted');
      if (submittedPlayers.length === 0) return showToast("Belum ada siswa yang mengumpulkan.", 'error');

      setLoading(true); // Re-use loading state
      showToast(`Memulai proses generate ${submittedPlayers.length} file PDF... Mohon tunggu.`, 'info');

      const zip = new window.JSZip();
      const container = document.createElement('div');
      
      // Setup container dimensions to simulate A4 paper and hide it properly for html2canvas
      container.style.position = 'fixed';
      container.style.top = '-9999px';
      container.style.left = '0';
      container.style.width = '210mm'; // A4 Width
      container.style.minHeight = '297mm';
      container.style.backgroundColor = 'white';
      container.style.padding = '20px';
      container.style.zIndex = '-100';
      document.body.appendChild(container);

      try {
          const { jsPDF } = window.jspdf;

          for (let i = 0; i < submittedPlayers.length; i++) {
              const p = submittedPlayers[i];
              
              // Get HTML Content
              // We pass 'true' for withKey to show correct answers
              let htmlContent = getExamHTMLTemplate(room.packetTitle, {questions: room.questions, ...room}, p.name, p.answers, true);

              // Inject content into hidden container
              container.innerHTML = htmlContent;

              // Manual Math Rendering (KaTeX) since script tags inside innerHTML won't execute
              if (window.katex) {
                   const mathElements = container.innerHTML.match(/(\\$\\$[\\s\\S]*?\\$\\$|\\$[\\s\\S]*?\\$)/g);
                   if(mathElements) {
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
                      traverse(container);
                   }
              }

              // Wait a moment for images/fonts/math to settle
              await new Promise(r => setTimeout(r, 500));

              // Capture the container
              const canvas = await window.html2canvas(container, {
                  scale: 1.5, // Better quality than 1, keep balanced for file size
                  useCORS: true,
                  logging: false
              });

              // Generate PDF
              const imgData = canvas.toDataURL('image/jpeg', 0.8); // JPEG for smaller size
              const imgWidth = 210; // A4 mm
              const pageHeight = 297; // A4 mm
              const imgHeight = canvas.height * imgWidth / canvas.width;
              let heightLeft = imgHeight;
              let position = 0;

              const doc = new jsPDF('p', 'mm', 'a4');

              doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;

              while (heightLeft >= 0) {
                  position = heightLeft - imgHeight;
                  doc.addPage();
                  doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                  heightLeft -= pageHeight;
              }

              // Add to zip
              zip.file(`LJK_${p.name.replace(/[^a-z0-9]/gi, '_')}.pdf`, doc.output('blob'));
          }

          const content = await zip.generateAsync({ type: "blob" });
          window.saveAs(content, `LJK_Batch_${room.code}_PDF.zip`);
          showToast("Berhasil! Semua LJK telah diunduh dalam format PDF ZIP.");

      } catch (e) {
          console.error(e);
          showToast("Gagal generate PDF: " + e.message, 'error');
      } finally {
          document.body.removeChild(container);
          setLoading(false);
      }
  };

  // View: Lobby Guru
  if (view === 'lobby') return (
     <div className="max-w-7xl mx-auto px-4 py-8 pb-20">
       <Snackbar {...snackbar} onClose={closeToast} />
       <Breadcrumbs onGoHome={()=>{updateURL({ role: 'teacher', roomId: null }); setView('browse')}} items={[{label:'Guru',onClick:()=>setView('browse')},{label:'Live Control Room',active:true}]}/>
       
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* List Peserta */}
         <div className="lg:col-span-2">
            <Card 
               title={`Peserta Terdaftar (${players.length})`} 
               subtitle="Pantau status pengerjaan siswa secara realtime."
               action={
                   players.some(p => p.status === 'submitted') && (
                       <button onClick={handleBatchDownload} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors disabled:opacity-50">
                           {loading ? <Loader2 size={16} className="animate-spin"/> : <FolderArchive size={16}/>} 
                           Download PDF ZIP
                       </button>
                   )
               }
            >
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {players.length > 0 ? players.map(p => (
                       <div key={p.id} className={`border p-4 rounded-xl text-center transition-all ${p.status==='submitted'?'bg-emerald-50 border-emerald-200':'bg-slate-50 border-slate-100'}`}>
                          <div className="font-bold text-slate-800 truncate mb-1">{p.name}</div>
                          <div className={`text-[10px] uppercase font-bold tracking-wider mb-2 ${p.status==='submitted'?'text-emerald-600':'text-slate-400'}`}>{p.status}</div>
                          {p.status === 'submitted' && (
                              <div className="pt-2 border-t border-slate-200/50">
                                <div className="text-2xl font-black text-emerald-600 mb-1">{p.score?.toFixed(0)}</div>
                                {/* Updated: Pass true for detailed report */}
                                <button onClick={()=>printExamPDF(room.packetTitle, {questions: room.questions, ...room}, p.name, p.answers, true)} className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-bold flex items-center justify-center gap-1 w-full"><Eye size={10}/> Preview LJK</button>
                              </div>
                          )}
                       </div>
                    )) : <div className="col-span-full text-center text-slate-400 py-20 flex flex-col items-center"><Users size={48} className="mb-4 opacity-20"/>Belum ada peserta yang bergabung.</div>}
                 </div>
            </Card>
         </div>

         {/* Panel Kontrol */}
         <div>
             <Card title="Kontrol Ruangan">
                 <div className="text-center p-8 bg-slate-900 rounded-2xl mb-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div onClick={copyLink} className="relative z-10 text-6xl font-black text-lime-400 font-mono cursor-pointer hover:scale-105 transition-transform tracking-widest">{room.code}</div>
                    
                    {/* FEEDBACK LINK COPIED */}
                    <div className={`relative z-10 text-xs mt-2 font-mono transition-all duration-300 ${linkCopied ? 'text-lime-400 font-bold scale-110' : 'text-emerald-400/60'}`}>
                        {linkCopied ? "Link Sudah tersalin" : "Klik Kode untuk Salin Link"}
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                        <div className="flex justify-between mb-2"><span className="text-slate-500">Guru</span><span className="font-bold">{room.teacherName}</span></div>
                        <div className="flex justify-between mb-2"><span className="text-slate-500">Sekolah</span><span className="font-bold">{room.schoolName}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Status</span><span className={`font-bold px-2 py-0.5 rounded text-xs uppercase ${room.status==='PLAYING'?'bg-lime-100 text-emerald-800':room.status==='FINISHED'?'bg-slate-200 text-slate-600':'bg-amber-100 text-amber-800'}`}>{room.status}</span></div>
                     </div>

                     {room.status === 'WAITING' && (
                        <Button onClick={()=>{
                             updateDoc(getPublicDoc("rooms",room.id),{status:'PLAYING',startedAt:serverTimestamp()});
                             updateLocalSessionStatus(room.id, 'PLAYING');
                        }} className="w-full h-12 text-lg shadow-lime-400/20" variant="secondary" icon={Play}>MULAI UJIAN</Button>
                     )}
                     
                     {room.status === 'PLAYING' && (
                        <>
                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center animate-pulse">
                                <p className="text-emerald-800 text-xs font-bold uppercase tracking-widest mb-1">Sedang Berlangsung</p>
                                <CountdownDisplay startedAt={room.startedAt} duration={room.duration} isActive={true} />
                            </div>
                            <Button onClick={endSession} className="w-full h-12" variant="danger" icon={StopCircle}>AKHIRI SESI</Button>
                        </>
                     )}

                     {(room.status === 'FINISHED') && (
                         <div className="space-y-3">
                             <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-center">
                                 <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Sesi Berakhir</p>
                             </div>
                             <Button onClick={() => {
                                 const dateStr = new Date().toLocaleDateString();
                                 let html = `
                                    <h2 style="text-align:center; margin-bottom: 20px;">REKAP NILAI UJIAN</h2>
                                    <div style="margin-bottom: 20px; font-size: 14px;">
                                        <strong>Paket:</strong> ${room.packetTitle}<br/>
                                        <strong>Kode:</strong> ${room.code}<br/>
                                        <strong>Tanggal:</strong> ${dateStr}
                                    </div>
                                    <table style="width:100%; border-collapse:collapse; font-size: 13px;">
                                    <thead><tr style="background:#f0fdf4"><th style="border:1px solid #ddd; padding:10px">No</th><th style="border:1px solid #ddd; padding:10px">Nama Siswa</th><th style="border:1px solid #ddd; padding:10px">Waktu Submit</th><th style="border:1px solid #ddd; padding:10px; text-align:center;">Nilai</th></tr></thead>
                                    <tbody>${players.map((p,idx)=>`<tr><td style="border:1px solid #ddd; padding:8px; text-align:center;">${idx+1}</td><td style="border:1px solid #ddd; padding:8px">${p.name}</td><td style="border:1px solid #ddd; padding:8px">${p.submittedAt ? new Date(p.submittedAt.seconds*1000).toLocaleTimeString() : '-'}</td><td style="border:1px solid #ddd; padding:8px; text-align:center; font-weight:bold">${p.score?.toFixed(0)||0}</td></tr>`).join('')}</tbody>
                                    </table>`;
                                 downloadRawHTML(`Rekap_Nilai_${room.code}`, html);
                             }} className="w-full" variant="outline" icon={Download}>Download Rekap Nilai</Button>
                         </div>
                     )}
                 </div>
             </Card>
         </div>
       </div>
    </div>
  );

  // View: Teacher Dashboard Main
  return (
     <div className="max-w-7xl mx-auto px-4 py-6">
        <Snackbar {...snackbar} onClose={closeToast} />
        <Breadcrumbs onGoHome={onGoHome} items={[{label:'Portal Guru',active:true}]}/>
        
        {/* --- UPDATE FITUR 3: WIDGET WA --- */}
        <a 
          href="https://wa.me/6285174484832" 
          target="_blank" 
          rel="noreferrer"
          className="mb-8 block p-5 bg-gradient-to-r from-emerald-50 to-white border border-emerald-100 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-5 text-emerald-900 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
        >
           <div className="absolute right-0 top-0 bottom-0 w-32 bg-emerald-500/5 skew-x-12 transform translate-x-10 group-hover:translate-x-0 transition-transform"></div>
           <div className="bg-white p-3 rounded-full shadow-md text-emerald-600 group-hover:scale-110 transition-transform flex-shrink-0">
             <MessageCircle size={28} />
           </div>
           <div className="flex-1 relative z-10">
             <div className="font-bold text-lg text-emerald-950">Butuh Soal Custom atau Request Fitur Sekolah?</div>
             <div className="text-sm opacity-70">Tim kami siap membantu Anda 24/7. Klik di sini untuk chat via WhatsApp.</div>
           </div>
           <div className="flex items-center gap-2 font-bold text-emerald-600 bg-white px-4 py-2 rounded-lg shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors relative z-10 text-sm">
              <Phone size={16}/> 0851-7448-4832
           </div>
        </a>
        {/* --------------------------- */}

        <div className="flex gap-2 mb-8 border-b border-slate-200 overflow-x-auto scrollbar-hide">
            <button onClick={() => setActiveTab('browse')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'browse' ? 'border-emerald-600 text-emerald-900' : 'border-transparent text-slate-400 hover:text-emerald-700'}`}>
                <div className="flex items-center gap-2"><BookOpen size={18}/> Bank Soal</div>
            </button>
            <button onClick={() => setActiveTab('active')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'active' ? 'border-emerald-600 text-emerald-900' : 'border-transparent text-slate-400 hover:text-emerald-700'}`}>
                <div className="flex items-center gap-2">
                    <Activity size={18} className={activeSessions.length > 0 ? "text-lime-500 animate-pulse" : ""}/> 
                    Sesi Aktif <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs ml-1">{activeSessions.length}</span>
                </div>
            </button>
            <button onClick={() => setActiveTab('history')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'history' ? 'border-emerald-600 text-emerald-900' : 'border-transparent text-slate-400 hover:text-emerald-700'}`}>
                <div className="flex items-center gap-2"><History size={18}/> Riwayat Sesi</div>
            </button>
        </div>

        {activeTab === 'browse' && (
            <>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <Select label="Mata Pelajaran" icon={BookOpen} value={filterMapel} onChange={e=>setFilterMapel(e.target.value)} options={uniqueMapels.map(m=>({value:m,label:m}))} className="mb-0"/>
                        <Select label="Kelas" icon={Filter} value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} options={uniqueClasses.map(c=>({value:c,label:`Kelas ${c}`}))} className="mb-0"/>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPackets.length > 0 ? filteredPackets.map(p => (
                    <Card key={p.id} className="h-full flex flex-col">
                        <h3 className="font-bold text-lg text-slate-800 mb-1">{p.title}</h3>
                        <p className="text-xs text-slate-400 mb-6 flex items-center gap-2"><span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{p.mapel}</span> • Kelas {p.kelas}</p>
                        <div className="flex gap-3 mb-4 mt-auto">
                            <Button onClick={()=>{setSelectedPkt(p); setCustomDuration(p.duration); setShowModal(true);}} className="flex-1" icon={Play} variant="secondary">Buat Sesi</Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 mt-2">
                            <button 
                                onClick={() => printExamPDF(p.title, p, null, null, false)} 
                                className="flex items-center justify-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl py-3 transition-all shadow-sm hover:shadow-md group"
                                title="Download PDF Soal"
                            >
                                <Download size={16} className="text-blue-500 group-hover:scale-110 transition-transform"/> 
                                Download Soal
                            </button>
                            <button 
                                onClick={() => printExamPDF(p.title, p, null, null, true)} 
                                className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl py-3 transition-all shadow-sm hover:shadow-md group"
                                title="Download PDF Kunci Jawaban"
                            >
                                <CheckCircle size={16} className="text-emerald-500 group-hover:scale-110 transition-transform"/> 
                                Download Kunci
                            </button>
                        </div>
                    </Card>
                )) : <div className="col-span-full text-center text-slate-400 py-20 border-2 border-dashed rounded-3xl bg-slate-50/50">Tidak ada paket soal yang ditemukan.</div>}
                </div>
            </>
        )}

        {activeTab === 'active' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {activeSessions.map(r => (
                     <div key={r.id} onClick={() => { setRoom(r); setView('lobby'); }} className="bg-emerald-950 text-white p-6 rounded-2xl cursor-pointer hover:shadow-2xl hover:shadow-emerald-900/40 hover:-translate-y-1 transition-all relative overflow-hidden group border border-emerald-800">
                         <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700"><Activity size={120}/></div>
                         <div className="flex items-center gap-2 mb-4">
                             <span className="w-2 h-2 bg-lime-400 rounded-full animate-pulse shadow-[0_0_10px_#84cc16]"/>
                             <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest bg-emerald-900/50 px-2 py-1 rounded">{r.status}</span>
                         </div>
                         <h3 className="text-xl font-bold mb-1 truncate pr-8">{r.packetTitle}</h3>
                         <div className="font-mono text-4xl font-black text-lime-400 my-6 tracking-widest">{r.code}</div>
                         <div className="text-xs text-emerald-400/60 flex justify-between font-medium">
                            <span className="flex items-center gap-1"><GraduationCap size={14}/> {r.schoolName}</span>
                            <span>{formatIndoDate(r.createdAt)}</span>
                         </div>
                         {r.status === 'PLAYING' && (
                             <div className="mt-6 pt-4 border-t border-emerald-800/50 flex justify-center">
                                 <div className="bg-emerald-900/80 px-4 py-2 rounded-xl backdrop-blur-sm shadow-inner shadow-black/20">
                                     {/* --- UPDATE FITUR 1: LOGIKA AUTO FINISH --- */}
                                     <CountdownDisplay 
                                        startedAt={r.createdAt} 
                                        duration={r.duration} 
                                        isActive={true} 
                                        onTimeUp={() => {
                                            updateDoc(getPublicDoc("rooms", r.id), { status: 'FINISHED' });
                                            updateLocalSessionStatus(r.id, 'FINISHED');
                                            showToast(`Waktu ujian ${r.packetTitle} habis. Sesi diakhiri otomatis.`);
                                        }}
                                      />
                                      {/* ------------------------------------------- */}
                                 </div>
                             </div>
                         )}
                     </div>
                 ))}
                 {activeSessions.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 bg-slate-50 rounded-3xl border-2 border-dashed flex flex-col items-center"><Play size={40} className="mb-4 opacity-20"/>Tidak ada sesi ujian yang sedang aktif.</div>}
             </div>
        )}

        {activeTab === 'history' && (
             <div className="space-y-4">
                 {finishedSessions.map(r => (
                     <div key={r.id} onClick={() => { setRoom(r); setView('lobby'); }} className="flex justify-between items-center bg-white p-5 rounded-xl border border-slate-100 hover:border-emerald-200 cursor-pointer transition-all shadow-sm hover:shadow-md group">
                         <div>
                             <h4 className="font-bold text-slate-800 group-hover:text-emerald-800 transition-colors">{r.packetTitle}</h4>
                             <div className="text-xs text-slate-400 mt-2 flex gap-3 font-mono">
                                 <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{r.code}</span>
                                 <span>•</span>
                                 <span>{formatIndoDate(r.createdAt)}</span>
                             </div>
                         </div>
                         <div className="p-2 bg-slate-50 rounded-full group-hover:bg-emerald-50 text-slate-300 group-hover:text-emerald-600 transition-colors">
                             <ChevronRight size={18}/>
                         </div>
                     </div>
                 ))}
                 {finishedSessions.length === 0 && <div className="py-20 text-center text-slate-400 bg-slate-50 rounded-3xl border border-dashed">Belum ada riwayat sesi.</div>}
             </div>
        )}
        
        <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title="Buat Sesi Ujian Baru">
           <div className="space-y-5">
              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex gap-4 items-center">
                  <div className="bg-white p-3 rounded-full shadow-sm text-emerald-600"><BookOpen size={24}/></div>
                  <div>
                      <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Paket Soal Terpilih</p>
                      <b className="text-lg text-emerald-950 block leading-tight">{selectedPkt?.title}</b>
                  </div>
              </div>
              <Input label="Nama Guru / Pengawas" value={form.teacher} onChange={e=>setForm({...form,teacher:e.target.value})} placeholder="Contoh: Bpk. Budi Santoso" icon={User}/>
              <Input label="Nama Sekolah / Institusi" value={form.school} onChange={e=>setForm({...form,school:e.target.value})} placeholder="Contoh: SMA Negeri 1 Jakarta" icon={GraduationCap}/>
              <Input label="Durasi Ujian (Menit)" type="number" value={customDuration} onChange={e=>setCustomDuration(parseInt(e.target.value)||0)} icon={Clock}/>
              <Button onClick={createRoom} loading={loading} className="w-full py-4 text-base shadow-lg shadow-emerald-900/20">Mulai Sesi Sekarang</Button>
           </div>
        </Modal>
     </div>
  );
};

// ==========================================
// 5. STUDENT MODULE
// ==========================================

const StudentDashboard = ({ onGoHome, user }) => {
  const [stage, setStage] = useState('login'); // login, lobby, exam, result
  const [form, setForm] = useState({ code: '', name: '' });
  const [room, setRoom] = useState(null);
  const [player, setPlayer] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [showNav, setShowNav] = useState(false); // Navigation Menu State
  const [showConfirmModal, setShowConfirmModal] = useState(false); // New state for submit confirmation
  const { snackbar, showToast, closeToast } = useSnackbar();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) setForm(prev => ({ ...prev, code }));
  }, []);

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
     if (!form.code || !form.name) return showToast("Isi kode dan nama lengkap!", 'error');
     setLoading(true);
     try {
       const q = query(getPublicCol("rooms"), where("code", "==", form.code.trim().toUpperCase()));
       const snap = await getDocs(q);
       if (snap.empty) throw new Error("Kode ruang ujian tidak valid.");
       
       const roomData = { id: snap.docs[0].id, ...snap.docs[0].data() };
       if (roomData.status === 'FINISHED') throw new Error("Ujian ini sudah selesai.");

       const playerRef = await addDoc(getPublicCol("players"), {
           roomId: roomData.id,
           name: form.name.trim(),
           status: 'ready',
           joinedAt: serverTimestamp(),
           answers: {}
       });

       setRoom(roomData);
       setPlayer({ id: playerRef.id, name: form.name });
       
       if (roomData.status === 'PLAYING') setStage('exam');
       else setStage('lobby');
     } catch (e) { showToast(e.message, 'error'); }
     finally { setLoading(false); }
  };

  const handleAnswer = (qId, val) => {
     setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const isAnswered = (qId) => {
    const ans = answers[qId];
    if (Array.isArray(ans)) return ans.length > 0;
    return ans !== undefined && ans !== null && ans !== '';
  };

  const scrollToQuestion = (index) => {
    const el = document.getElementById(`q-${index}`);
    if(el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setShowNav(false);
    }
  };

  const submitExam = async (auto = false) => {
     // Close modal if manual submission
     if (!auto) setShowConfirmModal(false);
     
     setLoading(true);
     
     let score = 0;
     let maxScore = 0;
     
     room.questions.forEach(q => {
         const userAns = answers[q.id];
         if (q.type === 'PG') {
             maxScore += 10;
             if (userAns === q.answer) score += 10;
         } else if (q.type === 'PGK') {
             maxScore += 10;
             if (Array.isArray(userAns) && Array.isArray(q.answer)) {
                 const correctPicks = userAns.filter(a => q.answer.includes(a)).length;
                 if (q.answer.length > 0) score += (correctPicks / q.answer.length) * 10;
             }
         } else if (q.type === 'MATCH' || q.type === 'MTF' || q.type === 'ESSAY') {
             maxScore += 10;
             if (q.type === 'ESSAY' && userAns && q.answer) {
                 const u = userAns.toLowerCase();
                 const k = q.answer.split(',').map(s=>s.trim().toLowerCase()).filter(s=>s);
                 if (k.length > 0) {
                      const hits = k.filter(key => u.includes(key)).length;
                      score += (hits / k.length) * 10;
                 }
             }
             if (q.type === 'MTF' && Array.isArray(q.options)) {
                 const userAnsObj = userAns || {};
                 let correctCount = 0;
                 q.options.forEach((opt, idx) => {
                     if (userAnsObj[idx] === opt.answer) correctCount++;
                 });
                 if (q.options.length > 0) score += (correctCount / q.options.length) * 10;
             }
         }
     });

     const finalScore = maxScore > 0 ? (score / maxScore) * 100 : 0;

     try {
         await updateDoc(getPublicDoc("players", player.id), {
             answers,
             status: 'submitted',
             submittedAt: serverTimestamp(),
             score: finalScore
         });
         setStage('result');
     } catch (e) { showToast("Gagal submit: " + e.message, 'error'); }
     finally { setLoading(false); }
  };

  // View: Login Siswa
  if (stage === 'login') return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-emerald-900/5">
          <Snackbar {...snackbar} onClose={closeToast} />
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/50">
              <div className="h-2 bg-gradient-to-r from-emerald-400 to-lime-400"></div>
              <div className="p-8">
                  <div className="text-center mb-8">
                      <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-600 shadow-inner">
                          <User size={40} strokeWidth={1.5}/>
                      </div>
                      <h1 className="text-3xl font-black text-emerald-950 tracking-tight">Login Peserta</h1>
                      <p className="text-slate-500 text-sm mt-2">Masukkan kode ruangan yang diberikan oleh pengawas.</p>
                  </div>
                  <div className="space-y-4">
                    <Input label="KODE RUANGAN" placeholder="Cth: X7B9A2" value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} icon={Hash} className="text-center font-mono text-lg tracking-widest uppercase"/>
                    <Input label="NAMA LENGKAP" placeholder="Nama sesuai absen" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} icon={User}/>
                    <Button onClick={joinRoom} loading={loading} className="w-full py-4 text-base shadow-lg shadow-emerald-900/20" icon={ArrowLeft} style={{flexDirection:'row-reverse'}}>MASUK RUANGAN</Button>
                    <button onClick={onGoHome} className="w-full text-center text-slate-400 text-xs hover:text-emerald-600 transition-colors mt-4">Batalkan & Kembali</button>
                  </div>
              </div>
          </div>
      </div>
  );

  // View: Lobby Siswa
  if (stage === 'lobby') return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
             <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-500 rounded-full blur-3xl"></div>
             <div className="absolute bottom-10 right-10 w-40 h-40 bg-lime-500 rounded-full blur-3xl"></div>
          </div>

          <div className="animate-bounce mb-8 text-7xl drop-shadow-lg">⏳</div>
          <h2 className="text-3xl font-black text-emerald-950 mb-3 tracking-tight">Menunggu Dimulai...</h2>
          <p className="text-slate-500 mb-10 max-w-md mx-auto leading-relaxed">Harap tenang. Ujian akan segera dimulai otomatis ketika instruktur menekan tombol mulai.</p>
          
          <div className="p-6 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 text-left w-full max-w-sm relative z-10">
              <div className="flex items-center gap-4 mb-6 border-b border-slate-50 pb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xl">{form.name.charAt(0)}</div>
                  <div>
                      <div className="font-bold text-slate-800 text-lg">{form.name}</div>
                      <div className="text-xs text-slate-400">Peserta Ujian</div>
                  </div>
              </div>
              <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Sekolah</span><span className="font-bold text-emerald-900">{room.schoolName}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Pengawas</span><span className="font-bold text-emerald-900">{room.teacherName}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Mapel</span><span className="font-bold text-emerald-900">{room.packetTitle}</span></div>
              </div>
          </div>
      </div>
  );

  // View: Halaman Hasil
  if (stage === 'result') return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-emerald-900 text-white text-center">
          <div className="mb-6 text-7xl animate-pulse">🎉</div>
          <h2 className="text-4xl font-black mb-4">Ujian Selesai!</h2>
          <p className="text-emerald-200 mb-10 text-lg max-w-md">Terima kasih telah mengerjakan dengan jujur. Jawaban Anda telah tersimpan di sistem kami.</p>
          
          <div className="flex flex-col gap-4 w-full max-w-xs">
              <Button onClick={() => printExamPDF(room.packetTitle, room, player.name, answers, false)} icon={Download} variant="secondary" className="w-full py-4 text-emerald-900 shadow-xl shadow-black/20">Download Bukti LJK</Button>
              <Button onClick={onGoHome} icon={Home} variant="outline" className="w-full py-4 bg-transparent text-emerald-100 border-emerald-700 hover:bg-emerald-800 hover:border-emerald-600">Kembali ke Halaman Utama</Button>
          </div>
      </div>
  );

  // View: Halaman Ujian (Exam Interface)
  return (
      <div className="max-w-4xl mx-auto pb-32 px-4 pt-6">
          <Snackbar {...snackbar} onClose={closeToast} />
          
          {/* Sticky Timer Header */}
          <div className="fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-4xl z-50">
             <div className="bg-emerald-900/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl flex justify-between items-center border border-emerald-700/50">
                 <div className="text-xs font-medium text-emerald-300 uppercase tracking-widest hidden sm:block">Sisa Waktu</div>
                 <div className="flex-1 sm:flex-none flex justify-center">
                    <CountdownDisplay startedAt={room.startedAt} duration={room.duration} onTimeUp={()=>submitExam(true)} isActive={true} />
                 </div>
                 <div className="text-xs font-bold text-white bg-emerald-800 px-3 py-1 rounded-lg hidden sm:block">{room.packetTitle}</div>
             </div>
          </div>

          {/* Floating Navigation Button (UPDATED) */}
          <button 
              onClick={() => setShowNav(true)}
              className="fixed bottom-6 right-6 bg-emerald-900 text-white px-6 py-3 rounded-full shadow-xl shadow-emerald-900/40 z-40 hover:scale-105 transition-transform active:scale-95 flex items-center gap-3 font-bold text-sm"
          >
              <Menu size={20} />
              Navigasi Soal
          </button>

          {/* Navigation Modal */}
          {showNav && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="font-bold text-lg text-slate-800">Navigasi Soal</h3>
                          <button onClick={() => setShowNav(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20}/></button>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                          {room.questions.map((q, i) => {
                              const answered = isAnswered(q.id);
                              return (
                                  <button 
                                      key={i} 
                                      onClick={() => scrollToQuestion(i)}
                                      className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold border-2 transition-all ${answered ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'}`}
                                  >
                                      {i+1}
                                      {answered && <Check size={12} strokeWidth={4} className="mt-1"/>}
                                  </button>
                              )
                          })}
                      </div>
                      
                      <div className="mt-6 flex justify-between items-center text-xs font-bold text-slate-500 border-t border-slate-100 pt-4">
                          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded"></div> Sudah Dijawab</div>
                          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-white border-2 border-slate-200 rounded"></div> Belum Dijawab</div>
                      </div>
                  </div>
              </div>
          )}

          <div className="mt-20 space-y-12">
             {room.questions.map((q, i) => (
                <div key={q.id} id={`q-${i}`} className="scroll-mt-32">
                   <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                       <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-4">
                           <span className="bg-emerald-900 text-white w-10 h-10 flex items-center justify-center rounded-xl font-bold shadow-lg shadow-emerald-900/20 text-lg flex-shrink-0">{i+1}</span>
                           <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tipe Soal: {q.type}</div>
                       </div>
                       
                       <div className="p-6 md:p-8">
                           <div className="text-base md:text-lg text-slate-800 leading-loose mb-8 font-medium"><ContentRenderer html={q.question}/></div>
                           
                           <div className="space-y-4">
                               {q.type === 'PG' && q.options.map((opt, idx) => (
                                   <label key={idx} className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all hover:bg-slate-50 group ${answers[q.id] === opt ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 shadow-md' : 'bg-white border-slate-100'}`}>
                                           <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${answers[q.id] === opt ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 group-hover:border-emerald-400'}`}>
                                                {answers[q.id] === opt && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                                           </div>
                                           {/* Updated Layout for "1 line sejajar" and remove bold */}
                                           <div className="flex items-start gap-2 text-base text-slate-700 font-normal flex-1">
                                               <span className="text-slate-500 font-normal min-w-[20px]">{String.fromCharCode(65+idx)}.</span> 
                                               <div className="flex-1 -mt-1.5"><ContentRenderer html={opt}/></div>
                                           </div>
                                           <input type="radio" name={`q-${q.id}`} className="hidden" checked={answers[q.id] === opt} onChange={()=>handleAnswer(q.id, opt)}/>
                                   </label>
                               ))}

                               {q.type === 'PGK' && q.options.map((opt, idx) => {
                                   const current = answers[q.id] || [];
                                   const checked = current.includes(opt);
                                   return (
                                       <label key={idx} className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all hover:bg-slate-50 ${checked ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-white border-slate-100'}`}>
                                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${checked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'}`}>
                                                 {checked && <Check size={14} strokeWidth={4}/>}
                                            </div>
                                            <div className="text-base text-slate-700 pt-0.5 font-medium"><ContentRenderer html={opt}/></div>
                                            <input type="checkbox" className="hidden" checked={checked} onChange={()=>{
                                                const newVal = checked ? current.filter(x=>x!==opt) : [...current, opt];
                                                handleAnswer(q.id, newVal);
                                            }}/>
                                       </label>
                                   );
                               })}

                               {/* MATCH rendering removed based on Admin removal request, keeping code structure clean. 
                                   If existing packets have MATCH, they will just show question text but no interactive elements here 
                                   unless we keep legacy support. Assuming we want to disable interaction since type is removed. 
                                   But to be safe for legacy, we can keep it or remove it. User said "remove in admin creation", 
                                   but also complained about options not showing. Since MATCH is banned, let's just support viewing 
                                   if it exists but no new ones. The prompt asked to remove creation ability. 
                                   I'll keep the rendering logic for MATCH just in case older packets exist to avoid crashing/blank screens,
                                   even though user said it's banned. Better safe for legacy data. 
                               */}
                               {q.type === 'MATCH' && (
                                   <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200">
                                       <div className="grid gap-4">
                                           {q.options.map((pair, idx) => (
                                               <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                                   <div className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-2">{pair.left}</div>
                                                   <select className="w-full p-3 rounded-lg border border-emerald-100 bg-emerald-50/30 text-emerald-900 font-medium outline-none focus:ring-2 focus:ring-emerald-500/20" 
                                                       value={(answers[q.id]||[]).find(p=>p.left===pair.left)?.right || ''} 
                                                       onChange={(e)=>{
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
                                   </div>
                               )}

                               {/* ADDED MISSING MTF LOGIC HERE */}
                               {q.type === 'MTF' && (
                                   <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200">
                                       <div className="space-y-4">
                                           {q.options.map((opt, idx) => {
                                               const currentAns = answers[q.id] || {};
                                               const selected = currentAns[idx];
                                               return (
                                                   <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                       <div className="flex-1 font-medium text-slate-700">
                                                           <ContentRenderer html={opt.text}/>
                                                       </div>
                                                       <div className="flex gap-2 flex-shrink-0">
                                                           <button
                                                               onClick={() => handleAnswer(q.id, { ...currentAns, [idx]: true })}
                                                               className={`px-6 py-2 rounded-lg font-bold text-sm transition-all border-2 ${selected === true ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-300'}`}
                                                           >
                                                               BENAR
                                                           </button>
                                                           <button
                                                               onClick={() => handleAnswer(q.id, { ...currentAns, [idx]: false })}
                                                               className={`px-6 py-2 rounded-lg font-bold text-sm transition-all border-2 ${selected === false ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-white border-slate-200 text-slate-400 hover:border-rose-300'}`}
                                                           >
                                                               SALAH
                                                           </button>
                                                       </div>
                                                   </div>
                                               );
                                           })}
                                       </div>
                                   </div>
                               )}

                               {q.type === 'ESSAY' && (
                                   <div className="relative">
                                       <textarea className="w-full p-5 rounded-2xl border-2 border-slate-200 text-base focus:border-emerald-500 focus:ring-0 outline-none transition-colors bg-white shadow-inner" rows={6} placeholder="Ketik jawaban Anda disini..." value={answers[q.id] || ''} onChange={e=>handleAnswer(q.id, e.target.value)}/>
                                       <div className="absolute bottom-4 right-4 text-xs text-slate-400 pointer-events-none">{(answers[q.id] || '').length} Karakter</div>
                                   </div>
                               )}
                           </div>
                       </div>
                   </div>
                </div>
             ))}
          </div>

          {/* New Footer for Submission */}
          <div className="mt-12 mb-20 p-6 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
              <h3 className="font-bold text-emerald-950 text-lg mb-2">Sudah Selesai Mengerjakan?</h3>
              <p className="text-emerald-700/70 text-sm mb-6">Pastikan seluruh jawaban telah terisi dengan benar sebelum mengumpulkan.</p>
              <Button onClick={() => setShowConfirmModal(true)} variant="primary" className="w-full md:w-auto px-12 py-4 shadow-xl shadow-emerald-900/20 text-base mx-auto" icon={CheckCircle}>
                  Kumpulkan Jawaban Sekarang
              </Button>
          </div>

          {/* Confirmation Modal */}
          <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Konfirmasi Pengumpulan">
              <div className="text-center">
                  <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle size={40} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Yakin ingin mengumpulkan?</h3>
                  <p className="text-slate-500 text-sm mb-6">
                      Anda tidak dapat mengubah jawaban setelah dikumpulkan. Pastikan semua soal telah diperiksa kembali.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Periksa Lagi</Button>
                      <Button variant="primary" onClick={() => submitExam(false)}>Ya, Kumpulkan</Button>
                  </div>
              </div>
          </Modal>
      </div>
  );
};

// ==========================================
// 6. MAIN APP SHELL & ROUTING
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
            setError('Autentikasi gagal. Periksa kembali kredensial Anda.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Login Administrator">
            <form onSubmit={handleLogin} className="space-y-4">
                {error && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl flex items-center gap-2"><AlertTriangle size={16}/> {error}</div>}
                <Input label="Email Institusi" type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="admin@sekolah.sch.id" icon={User}/>
                <Input label="Kata Sandi" type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" icon={Lock}/>
                <Button type="submit" loading={loading} className="w-full py-3">Masuk Dashboard</Button>
            </form>
        </Modal>
    );
};

const LandingPage = ({ onSelectRole }) => {
    const [showLogin, setShowLogin] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-lime-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
                <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-white/5 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center relative z-10">
                <div className="text-white space-y-8 animate-in slide-in-from-left-10 duration-700">
                    <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-200 text-xs font-bold uppercase tracking-wider backdrop-blur-sm shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse shadow-[0_0_10px_#84cc16]"/> ELKAPEDE V3.0 PRO
                    </div>
                    
                    <div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-4">
                            Tryout <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-lime-400">Gratis</span> <br/> No Ribet.
                        </h1>
                        <p className="text-emerald-100/70 text-lg md:text-xl leading-relaxed max-w-lg font-light">
                            Pilih Paket Soal tersedia, buat ruang Tryout, kerjakan langsung penilaian.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-2">
                        {[
                            {icon: CheckCircle, text: "Realtime Sync"},
                            {icon: FileText, text: "PDF Soal, Kunci & LJK"},
                            {icon: Monitor, text: "Multi-Platform"},
                            {icon: User, text: "Tanpa Login"}
                        ].map((feat, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs font-bold text-emerald-300 bg-emerald-900/50 px-3 py-1.5 rounded-lg border border-emerald-800/50">
                                <feat.icon size={14}/> {feat.text}
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="grid gap-5 animate-in slide-in-from-right-10 duration-700 delay-200">
                    {/* Tombol Siswa (Primary) */}
                    <button onClick={() => onSelectRole('student')} className="group bg-white hover:bg-lime-50 p-6 md:p-8 rounded-3xl shadow-2xl transition-all hover:-translate-y-1 hover:shadow-lime-400/20 flex items-center gap-6 relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-slate-50 to-transparent opacity-50"></div>
                        <div className="w-16 h-16 bg-lime-100 text-emerald-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner flex-shrink-0">
                            <User size={32} strokeWidth={2}/>
                        </div>
                        <div className="text-left relative z-10">
                            <h3 className="text-2xl font-black text-emerald-950 group-hover:text-emerald-700 transition-colors">Masuk sebagai Siswa</h3>
                            <p className="text-slate-500 text-sm font-medium mt-1">Kerjakan ujian dengan kode ruangan</p>
                        </div>
                        <div className="ml-auto text-slate-300 group-hover:text-emerald-600 transition-colors"><ChevronRight size={28}/></div>
                    </button>

                    {/* Tombol Guru (Secondary) */}
                    <button onClick={() => onSelectRole('teacher')} className="group bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-3xl transition-all hover:-translate-y-1 flex items-center gap-6">
                        <div className="w-16 h-16 bg-emerald-800/50 text-emerald-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0 border border-white/5">
                            <LayoutDashboard size={32} strokeWidth={2}/>
                        </div>
                        <div className="text-left text-white">
                            <h3 className="text-2xl font-black">Portal Pengajar</h3>
                            <p className="text-emerald-200/60 text-sm font-medium mt-1">Buat soal dan pantau sesi ujian</p>
                        </div>
                        <div className="ml-auto text-emerald-500/30 group-hover:text-emerald-200 transition-colors"><ChevronRight size={28}/></div>
                    </button>
                </div>
            </div>
            
            {/* --- UPDATE FITUR 2: TOMBOL ADMIN KECIL & TERSEMBUNYI --- */}
            <div className="absolute bottom-6 right-6 z-20">
                <button 
                    onClick={() => setShowLogin(true)} 
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/80 hover:bg-emerald-900 text-emerald-600 hover:text-emerald-400 text-[10px] font-bold uppercase tracking-widest transition-all border border-emerald-900 hover:border-emerald-700 backdrop-blur"
                >
                    <Lock size={10}/> Admin Access
                </button>
            </div>
            {/* -------------------------------------------------------- */}

            {showLogin && (
                <LoginModal onClose={() => setShowLogin(false)} onSuccess={() => onSelectRole('admin')} />
            )}

            <div className="absolute bottom-6 left-6 text-emerald-900/40 text-[10px] font-mono select-none">
                BUILD_ID: 2025.1.0-RC3 &bull; SECURE_ENGINE: ACTIVE
            </div>
        </div>
    );
};

const App = () => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null); // 'admin', 'teacher', 'student'
    
    // Load external scripts (Tailwind & Katex)
    useExternalResources();

    useEffect(() => {
        const initAuth = async () => {
             // Cek token custom (jika disediakan oleh environment)
             if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                 await signInWithCustomToken(auth, __initial_auth_token);
             } else {
                 // Default anonymous auth untuk flow yang lancar
                 // Admin harus login ulang dengan email/pass nanti
                 onAuthStateChanged(auth, (u) => {
                     if (!u) signInAnonymously(auth);
                     setUser(u);
                 });
             }
        };
        initAuth();
        
        // Deep linking check for quick role assignment
        const params = new URLSearchParams(window.location.search);
        const urlRole = params.get('role');
        if (urlRole) setRole(urlRole);
        else if (params.get('code')) setRole('student');

    }, []);

    const handleHome = () => {
        setRole(null);
        updateURL({ role: null, roomId: null, code: null });
    };

    if (!user) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-emerald-500 gap-4">
            <Loader2 className="animate-spin" size={48}/>
            <div className="text-xs font-mono uppercase tracking-widest animate-pulse">Memuat Sistem...</div>
        </div>
    );

    return (
        <div className="font-sans antialiased text-slate-900 bg-slate-50 min-h-screen selection:bg-emerald-200 selection:text-emerald-900">
            {!role && <LandingPage onSelectRole={setRole}/>}
            {role === 'admin' && <AdminDashboard user={user} onGoHome={handleHome}/>}
            {role === 'teacher' && <TeacherDashboard user={user} onGoHome={handleHome}/>}
            {role === 'student' && <StudentDashboard user={user} onGoHome={handleHome}/>}
        </div>
    );
};

export default App;