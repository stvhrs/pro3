import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, push, set, remove, update, query } from 'firebase/database';
import { Layout, Button, Input, Select, Card, Typography, Row, Col, Space, message, Popconfirm, Tabs, Divider, Popover, Spin, Pagination, Modal, List as AntList, Checkbox } from 'antd';
import { FileText, FileDown, Database, Table as TableIcon, Plus, Trash2, Copy, Edit2, Home, Save, Search, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, Bold, Underline, Italic, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo, Redo, List, ListOrdered, Settings, Folder, User, CheckSquare, Printer } from 'lucide-react';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// ==========================================
// INISIALISASI FIREBASE RTDB
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBeVbSzrBSRRKu2G5jG_5zOMj1pqyZzZ_c",
  authDomain: "aplikasimasiko.firebaseapp.com",
  databaseURL: "https://aplikasimasiko-default-rtdb.firebaseio.com",
  projectId: "aplikasimasiko",
  storageBucket: "aplikasimasiko.firebasestorage.app",
  messagingSenderId: "280089362661",
  appId: "1:280089362661:web:4494f433a12d12a172540c",
  measurementId: "G-DBEWZ4B1BB"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==========================================
// R2 CLOUDFLARE CONFIGURATION
// ==========================================
const R2_BUCKET_NAME = "poncoharsoyoheritage";
const R2_ENDPOINT = "https://755ea71baf9479dda3bbacc2e3b7426f.r2.cloudflarestorage.com";
const R2_PUBLIC_DOMAIN = "https://pub-268e4ac098564a4fae1119e480f5a908.r2.dev";

// ==========================================
// DATA BLANK / DEFAULT PROYEK BARU
// ==========================================
const BLANK_MASTER_DATA = {
  kategori: 'Uncategorized',
  judulProject: 'Sosialisasi Karangasem',
  namaPekerjaan: 'Pengadaan Jasa Lainnya Penyelenggaraan Kegiatan Sosialisasi Dalam Rangka Promosi Tentang Pemenuhan Gizi di Desa Sindhuwati, Kecamatan Sidemen, Kabupaten Karangasem Provinsi Bali\nTanggal 17 Maret Tahun 2026',
  namaInstansi: 'Badan Gizi Nasional',
  divisiInstansi: 'Deputi Bidang Promosi dan Kerjasama',
  tahunAnggaran: '2026',
  alamatInstansi: 'Jalan Kebon Sirih I No. 1, Menteng Jakarta Pusat',
  namaPpk: 'Dedi Kuswandi, SE, M.Si',
  nipPpk: '19700529 199403 1 004',
  provinsiKak: 'Bali',
  kabupatenKak: 'Kabupaten Karangasem',
  nilaiKak: 'Rp191.780.940,-'
};

const FONT_FAMILY = '"Arial", sans-serif';

// ==========================================
// HELPER FUNCTIONS
// ==========================================
const formatTitleCase = (str) => {
  if (!str || str === '_____') return str;
  const strVal = String(str);
  const trimmed = strVal.trim();
  if(!trimmed) return strVal;
  
  const lowers = ['di', 'ke', 'dari', 'dan', 'atau', 'untuk', 'yang', 'dalam', 'pada', 'dengan', 'tentang'];
  
  return trimmed.toLowerCase().split(/\s+/).map((word, index) => {
    if (index !== 0 && lowers.includes(word)) return word; 
    if (word.length === 0) return '';
    if (word.includes('/')) return word.split('/').map(w => w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : '').join('/');
    if (word.includes('-')) return word.split('-').map(w => w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : '').join('-');
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
};

const formatTerbilang = (angkaStr) => {
  if (!angkaStr || angkaStr === '_____') return '_____';
  let numStr = String(angkaStr).trim();
  if (numStr.endsWith(',-')) numStr = numStr.slice(0, -2);
  else if (numStr.match(/,\d{1,2}$/)) numStr = numStr.slice(0, numStr.lastIndexOf(','));
  numStr = numStr.replace(/[^0-9]/g, '');
  const num = parseInt(numStr, 10);
  if (isNaN(num) || num === 0) return '_____';
  
  const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  const divide = (n) => {
    if (n === 0) return '';
    if (n < 12) return bilangan[n] + ' ';
    if (n < 20) return divide(n - 10) + 'Belas ';
    if (n < 100) return divide(Math.floor(n / 10)) + 'Puluh ' + divide(n % 10);
    if (n < 200) return 'Seratus ' + divide(n - 100);
    if (n < 1000) return divide(Math.floor(n / 100)) + 'Ratus ' + divide(n % 100);
    if (n < 2000) return 'Seribu ' + divide(n - 1000);
    if (n < 1000000) return divide(Math.floor(n / 1000)) + 'Ribu ' + divide(n % 1000);
    if (n < 1000000000) return divide(Math.floor(n / 1000000)) + 'Juta ' + divide(n % 1000000);
    if (n < 1000000000000) return divide(Math.floor(n / 1000000000)) + 'Miliar ' + divide(n % 1000000000);
    if (n < 1000000000000000) return divide(Math.floor(n / 1000000000000)) + 'Triliun ' + divide(n % 1000000000000);
    return '';
  };
  
  let result = divide(num).trim() + ' rupiah';
  return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
};

const formatCurrencyDisplay = (val) => {
  if (!val || val === '_____') return val;
  const numStr = String(val).replace(/[^0-9]/g, '');
  if (!numStr) return val;
  const formatted = new Intl.NumberFormat('id-ID').format(parseInt(numStr, 10));
  return `Rp${formatted},-`;
};

const formatNip = (str) => {
  if (!str || str === '_____') return str;
  const cleaned = String(str).replace(/[^0-9]/g, '');
  if (cleaned.length === 18) {
    return `${cleaned.slice(0, 8)} ${cleaned.slice(8, 14)} ${cleaned.slice(14, 15)} ${cleaned.slice(15, 18)}`;
  }
  return cleaned;
};

const renderHighlightedTitle = (text) => {
  if (!text || text === '_____') return <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#262626' }}>Proyek Tanpa Nama</div>;
  const titleCased = formatTitleCase(String(text));
  return <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#262626', lineHeight: '1.5' }}>{titleCased}</div>;
};

const FormGroup = ({ label, children }) => (
  <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{label}</div>
      {children}
  </div>
);

const V = ({ children }) => (
  <span suppressContentEditableWarning className="var-protect">
    {children}
  </span>
);

const parseExcelPaste = (text) => {
  if (!text) return [];
  const rawRows = []; let currentRow = []; let currentCell = ''; let insideQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i]; const nextChar = text[i + 1];
    if (char === '"' && insideQuotes && nextChar === '"') { currentCell += '"'; i++; } 
    else if (char === '"') { insideQuotes = !insideQuotes; } 
    else if (char === '\t' && !insideQuotes) { currentRow.push(currentCell); currentCell = ''; } 
    else if (char === '\n' && !insideQuotes) { 
      currentRow.push(currentCell); 
      rawRows.push(currentRow); 
      currentRow = []; currentCell = ''; 
    } 
    else { currentCell += char; }
  }
  if (currentCell !== '' || currentRow.length > 0) { 
    currentRow.push(currentCell); 
    rawRows.push(currentRow); 
  }
  
  while (rawRows.length > 0 && rawRows[0].every(c => !c || c.trim() === '')) rawRows.shift();
  while (rawRows.length > 0 && rawRows[rawRows.length - 1].every(c => !c || c.trim() === '')) rawRows.pop();

  let maxCols = 0; rawRows.forEach(r => { if (r.length > maxCols) maxCols = r.length; });
  rawRows.forEach(r => { while (r.length < maxCols) r.push(''); });

  let firstSummaryRowIdx = -1;
  for (let i = 0; i < rawRows.length; i++) {
    const nonE = rawRows[i].filter(c => c && c.trim() !== '');
    if (nonE.length >= 1 && nonE.length <= 2) {
       const label = nonE[0].toUpperCase();
       if (['TOTAL', 'FEE', 'PPN', 'PAJAK', 'PEMBULATAN'].some(kw => label.includes(kw))) {
           firstSummaryRowIdx = i;
           break;
       }
    }
  }
  
  if (firstSummaryRowIdx > 0) {
    let i = firstSummaryRowIdx - 1;
    while (i >= 0 && rawRows[i].every(c => !c || c.trim() === '')) {
      rawRows.splice(i, 1);
      firstSummaryRowIdx--;
      i--;
    }
    const blankRow = new Array(maxCols).fill('');
    rawRows.splice(firstSummaryRowIdx, 0, [...blankRow]);
  }

  if (rawRows.length === 0) return [];
  const colsToRemove = [];
  for (let c = 0; c < maxCols; c++) { let isEmpty = true; for (let r = 0; r < rawRows.length; r++) { if (rawRows[r][c] && rawRows[r][c].trim() !== '') { isEmpty = false; break; } } if (isEmpty) colsToRemove.push(c); }
  for (let i = colsToRemove.length - 1; i >= 0; i--) { const colIdx = colsToRemove[i]; rawRows.forEach(row => row.splice(colIdx, 1)); }
  return rawRows;
};

const processTableData = (pastedText, autoMerge) => {
  const rows = parseExcelPaste(pastedText);
  if (rows.length < 2 || !autoMerge) return { hasMergedHeader: false, body: rows.length > 0 ? rows.slice(1) : [], tr1: rows.length > 0 ? rows[0] : [], tr2: [] };
  const maxLen = Math.max(rows[0].length, rows[1].length);
  const r0 = [...rows[0]]; const r1 = [...rows[1]];
  while(r0.length < maxLen) r0.push(''); while(r1.length < maxLen) r1.push('');
  let tr1 = []; let tr2 = []; let hasMerge = false; let skipCol1 = 0;
  for (let c = 0; c < r0.length; c++) {
    if (skipCol1 > 0) { skipCol1--; continue; }
    let cellText = r0[c]; let colSpan = 1; let rowSpan = 1;
    while (c + colSpan < r0.length && r0[c + colSpan].trim() === '') colSpan++;
    let allBelowEmpty = true; for(let i = 0; i < colSpan; i++) { if (r1[c+i].trim() !== '') allBelowEmpty = false; }
    if (allBelowEmpty) rowSpan = 2; if (colSpan > 1 || rowSpan > 1) hasMerge = true;
    tr1.push({ text: cellText, colSpan, rowSpan, origCol: c }); skipCol1 = colSpan - 1;
  }
  if (!hasMerge) return { hasMergedHeader: false, body: rows.slice(1), tr1: rows[0], tr2: [] };
  let skipCol2 = 0;
  for (let c = 0; c < maxLen; c++) {
    if (skipCol2 > 0) { skipCol2--; continue; }
    const isCovered = tr1.some(h => h.origCol <= c && c < h.origCol + h.colSpan && h.rowSpan === 2);
    if (!isCovered) {
        let cellText = r1[c]; let colSpan = 1;
        while (c + colSpan < r1.length && r1[c + colSpan].trim() === '') {
           const nextCovered = tr1.some(h => h.origCol <= (c + colSpan) && (c + colSpan) < h.origCol + h.colSpan && h.rowSpan === 2);
           if (nextCovered) break; colSpan++;
        }
        tr2.push({ text: cellText, colSpan, rowSpan: 1, origCol: c }); skipCol2 = colSpan - 1;
    }
  }
  return { hasMergedHeader: true, tr1, tr2, body: rows.slice(2) };
};

const PaperPage = ({ id, children, paperSize, headerImage, hideHeader = false, orientation = 'portrait', margins = { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 }, headerHeight = 40, printClassName = '' }) => {
  const isPortrait = orientation === 'portrait';
  const width = paperSize === 'A4' ? (isPortrait ? '210mm' : '297mm') : (isPortrait ? '215.9mm' : '330.2mm');
  const minHeight = paperSize === 'A4' ? (isPortrait ? '297mm' : '210mm') : (isPortrait ? '330.2mm' : '215.9mm');
  const padding = `${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm`;
  const pageHeightMM = paperSize === 'A4' ? (isPortrait ? 297 : 210) : (isPortrait ? 330.2 : 215.9);

  return (
    <div id={id} className={`paper-page bg-white text-black relative shrink-0 ${printClassName}`} style={{ width, minHeight, padding, boxSizing: 'border-box', fontFamily: FONT_FAMILY }}>
      <div className="print-hidden" style={{ 
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 50,
          backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent calc(${pageHeightMM}mm - 2px), #ffccc7 calc(${pageHeightMM}mm - 2px), #ffccc7 ${pageHeightMM}mm)`
      }} />
      {!hideHeader && headerImage && (
        <div contentEditable={false} suppressContentEditableWarning className="w-full mb-4 text-center print-kop relative z-10">
          <img src={headerImage} alt="Kop Surat" className="w-full object-contain mx-auto" style={{ maxWidth: '100%', height: `${headerHeight}mm` }} />
        </div>
      )}
      <div contentEditable={true} suppressContentEditableWarning style={{ outline: 'none', width: '100%', height: '100%', position: 'relative', zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
};

// Komponen Pembantu Layout KAK
const KakSection = ({ num, title }) => (
  <div style={{ display: 'flex', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '11pt', textTransform: 'uppercase' }}>
    <div style={{ width: '2.5rem', flexShrink: 0 }}>{num}.</div>
    <div>{title}</div>
  </div>
);

const KakContent = ({ children }) => (
  <div style={{ paddingLeft: '2.5rem', fontSize: '11pt', marginBottom: '1rem', textAlign: 'justify' }}>
    {children}
  </div>
);

const getPrintCSS = (paperSize, marginTop = 25.4, marginRight = 25.4, marginBottom = 25.4, marginLeft = 25.4) => {
    const pageConfig = paperSize === 'F4' ? '8.5in 13in' : 'A4 portrait';
    return `
      @page { 
          size: ${pageConfig}; 
          margin: ${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm; 
      }
      @page table-page {
          size: ${pageConfig};
          margin: 5mm 10mm ${marginBottom}mm 10mm;
      }
      .page-rab { page: table-page; }
      .page-hps { page: table-page; }
      .page-spek { page: table-page; }
      .page-boq { page: table-page; }

      .doc-body { font-size: 11pt; line-height: 1.15; color: black; }
      .doc-body table td { text-align: left; }
      .text-justify { text-align: justify; }
      .text-right { text-align: right !important; }
      .text-center { text-align: center !important; }
      .text-left { text-align: left !important; }
      .font-bold { font-weight: bold; }
      .font-semibold { font-weight: 600; }
      .italic { font-style: italic; }
      .underline { text-decoration: underline; }
      
      .mb-0 { margin-bottom: 0rem !important; }
      .mb-1 { margin-bottom: 0.25rem !important; }
      .mb-2 { margin-bottom: 0.5rem !important; }
      .mb-4 { margin-bottom: 1rem !important; }
      .mb-6 { margin-bottom: 1.5rem !important; }
      .mb-8 { margin-bottom: 2rem !important; }
      .mb-10 { margin-bottom: 2.5rem !important; }
      .mt-0 { margin-top: 0rem !important; }
      .mt-1 { margin-top: 0.25rem !important; }
      .mt-2 { margin-top: 0.5rem !important; }
      .mt-4 { margin-top: 1rem !important; }
      .mt-12 { margin-top: 3rem !important; }
      
      .pb-1 { padding-bottom: 0.25rem; }
      .pl-4 { padding-left: 1.25rem !important; }
      .pl-5 { padding-left: 1.5rem !important; }
      
      p { margin-top: 0; margin-bottom: 0.25rem; }
      ol { list-style-type: decimal; padding-left: 1.25rem; margin-bottom: 0.25rem; margin-top: 0; }
      ul { list-style-type: disc; padding-left: 1.25rem; margin-bottom: 0.25rem; margin-top: 0; }
      li { margin-bottom: 0; text-align: justify; }
      
      .align-top { vertical-align: top; }
      .align-middle { vertical-align: middle; }
      .w-full { width: 100%; }
      .mx-auto { margin-left: auto; margin-right: auto; }
      .p-0 { padding: 0 !important; }
      .p-1-5 { padding: 0.375rem; }
      .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
      .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
      .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
      
      .table-doc { width: 100%; border-collapse: collapse; font-size: 11pt; }
      .table-doc td { padding-bottom: 0px; vertical-align: top; border: none; }
      
      .table-bordered { width: 99.8%; max-width: 99.8%; border-collapse: collapse !important; border: 0.5pt solid black !important; font-size: 9pt; line-height: 1.3; margin: 0 auto; box-sizing: border-box; }
      .table-bordered th, .table-bordered td { border: 0.5pt solid black !important; padding: 4px; word-wrap: break-word; box-sizing: border-box; font-weight: normal !important; }
      .table-bordered th { font-weight: bold !important; text-align: center; }
      
      .table-fixed { table-layout: fixed; }
      .bg-white { background-color: #ffffff; }
      .bg-transparent { background-color: transparent; }
      .text-xs { font-size: 9pt; }
      .text-sm { font-size: 10pt; }
      .text-base-pt { font-size: 11pt; }
      .text-lg { font-size: 14pt; }
      .text-xl { font-size: 18pt; }
      .uppercase { text-transform: uppercase; }
      .tracking-widest { letter-spacing: 0.3em; }
      .border-b-2 { border-bottom: 2px solid black; padding-bottom: 1rem; }
      .border-none { border: none !important; }
      .border-2-double { border: 4px double black; padding: 2rem; }
      .relative { position: relative; }
      .absolute { position: absolute; }
      .flex { display: flex; }
      .flex-col { flex-direction: column; }
      .items-center { align-items: center; }
      .justify-center { justify-content: center; }
      .justify-end { justify-content: flex-end; }
      .justify-start { justify-content: flex-start; }
      .keep-together { page-break-inside: avoid !important; break-inside: avoid !important; }
      .break-words { word-wrap: break-word; }
      .whitespace-nowrap { white-space: nowrap !important; }
      .whitespace-pre-wrap { white-space: pre-wrap; }
      .hover-bg-gray:hover { background-color: #f9fafb; transition: background-color 0.2s; }
      .overflow-hidden { overflow: hidden; }
      .var-protect { background-color: #e6f7ff; color: #003a8c; border-radius: 3px; padding: 0 4px; user-select: all; }
      .doc-preview-wrapper { width: max-content; min-width: 100%; display: flex; justify-content: center; padding: 2rem; background-color: #e5e7eb; box-sizing: border-box; }
      .doc-preview-inner { display: flex; flex-direction: column; gap: 2rem; width: max-content; }
      .paper-page { background-color: white; color: black; position: relative; flex-shrink: 0; box-sizing: border-box; box-shadow: 0 10px 25px rgba(0,0,0,0.15); margin: 0 auto; }
      .print-kop { width: 100%; margin-bottom: 1rem; text-align: center; }
      .print-kop img { max-width: 100%; object-fit: contain; margin: 0 auto; }
      
      @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          body, html { background-color: white !important; margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; }
          .print-hidden { display: none !important; }
          .var-protect { background-color: transparent !important; color: inherit !important; padding: 0 !important; border: none !important; }
          thead { display: table-row-group; }
          .doc-preview-wrapper, .doc-preview-inner { display: block !important; background: white !important; padding: 0 !important; margin: 0 !important; width: 100% !important; height: auto !important; overflow: visible !important; }
          .paper-page { display: block !important; position: relative !important; box-shadow: none !important; margin: 0 !important; width: 100% !important; height: auto !important; min-height: 0 !important; page-break-after: always !important; break-after: page !important; padding: 0 !important; }
          .paper-page:last-of-type { page-break-after: auto !important; break-after: auto !important; }
          table { width: 100% !important; max-width: 100% !important; border: none !important; }
          .table-bordered { width: 99.8% !important; max-width: 99.8% !important; border-collapse: collapse !important; border: 0.5pt solid black !important; margin: 0 auto !important; }
          .table-bordered th, .table-bordered td { border: 0.5pt solid black !important; font-weight: normal !important; }
          .table-bordered th { font-weight: bold !important; }
          th div { resize: none !important; width: 100% !important; min-width: 0 !important; padding-left: 2px !important; padding-right: 2px !important; }
      }
    `;
};

// Komponen Template Dokumen Penuh untuk bulk-print atau view
const DocumentTemplate = ({ project }) => {
  const masterData = project.masterData || BLANK_MASTER_DATA;
  const headerDataKAK = processTableData(project.pastedKAK || '', project.autoMerge ?? true);
  const { headerImage, logoImage, paperSize, marginTop, marginRight, marginBottom, marginLeft, headerHeight } = project;
  const marginProps = { top: marginTop ?? 25.4, right: marginRight ?? 25.4, bottom: marginBottom ?? 25.4, left: marginLeft ?? 25.4 };
  const hHeight = headerHeight ?? 40;
  const pSize = paperSize || 'A4';

  const getPriceColIndices = (headerData) => {
      const indices = new Set();
      headerData.tr1?.forEach(h => {
          const t = String(h.text || '').toUpperCase();
          if (t.includes('HARGA') || t.includes('BIAYA') || t.includes('TOTAL') || t.includes('HPS') || t.includes('BOQ')) {
              for (let i = 0; i < h.colSpan; i++) indices.add(h.origCol + i);
          }
      });
      headerData.tr2?.forEach(h => {
          const t = String(h.text || '').toUpperCase();
          if (t.includes('HARGA') || t.includes('BIAYA') || t.includes('TOTAL')) {
              for (let i = 0; i < h.colSpan; i++) indices.add(h.origCol + i);
          }
      });
      return Array.from(indices);
  }

  const getVolColIndices = (headerData) => {
      const indices = new Set();
      headerData.tr1?.forEach(h => {
          if (String(h.text || '').toUpperCase().includes('VOLUME')) {
              for (let i = 0; i < h.colSpan; i++) indices.add(h.origCol + i);
          }
      });
      return Array.from(indices);
  }

  const isRomanNumeral = (str) => {
    if (!str) return false;
    return /^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX|XXI|XXII|XXIII|XXIV|XXV|XXVI|XXVII|XXVIII|XXIX|XXX)$/.test(String(str).trim());
  };

  const checkIsNumberingRow = (row) => {
    if (row.length < 3) return false;
    const numberCount = row.filter(c => c.trim() !== '' && !isNaN(c.trim())).length;
    return numberCount > (row.length * 0.7);
  };

  const renderTableVariant = (headerData, variant) => {
    if (!headerData.tr1 || headerData.tr1.length === 0) {
       return (
        <div contentEditable={false} suppressContentEditableWarning style={{ border: '2px dashed #d9d9d9', borderRadius: '8px', padding: '4rem', textAlign: 'center', color: '#8c8c8c', marginTop: '2.5rem' }} className="print-hidden">
          <TableIcon size={48} style={{ margin: '0 auto 16px', color: '#d9d9d9' }} />
          <p>Tabel otomatis ter-<em>generate</em> di sini.<br/>Silakan paste data Excel di panel kiri.</p>
        </div>
       );
    }
    
    const priceCols = getPriceColIndices(headerData);
    const volCols = getVolColIndices(headerData);

    const getAlignmentClassRAB = (cell, cellIndex, isNumberingRow = false) => {
      if (isNumberingRow) return 'text-center align-middle font-bold bg-transparent';
      if (volCols.includes(cellIndex)) return 'text-center align-middle';
      if (!cell) return 'text-center align-middle';
      if (cellIndex === 0) return 'text-center align-middle'; 
      const isDate = /^\s*\d{1,2}\s+(Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des|Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4}\s*$/i.test(String(cell).trim());
      if (isDate) return 'text-center align-middle';
      if (cellIndex === 1) return 'text-left align-middle'; 
      if (cellIndex === 2) return 'text-center align-middle';
      const isNominal = /(Rp)|(\d{1,3}\.\d{3})|(\d+,\d{2}$)/i.test(String(cell).trim());
      if (isNominal || priceCols.includes(cellIndex)) return 'text-right align-middle';
      return 'text-center align-middle'; 
    };

    return (
      <div className="w-full mt-4" style={{ width: '100%', boxSizing: 'border-box' }} suppressContentEditableWarning>
        <table className="table-bordered" style={{ tableLayout: 'auto' }}>
          {headerData.hasMergedHeader ? (
            <thead className="bg-transparent">
              <tr className="keep-together">
                {headerData.tr1.map((h, index) => {
                  if (variant === 'SPEK' && priceCols.includes(h.origCol)) {
                      let allPrice = true;
                      for(let c=0; c<h.colSpan; c++) if(!priceCols.includes(h.origCol+c)) allPrice = false;
                      if(allPrice) return null;
                  }

                  let text = String(h.text || '');
                  const isNoCol = text.trim().toUpperCase() === 'NO';
                  const cleanText = text.toUpperCase().replace(/[\r\n\s]+/g, ' ').trim();
                  
                  if (variant === 'BOQ' && cleanText.includes('HPS')) text = 'BOQ';
                  if (cleanText === 'HARGA SATUAN (RP)') text = 'HARGA\u00A0SATUAN\n(Rp)';
                  if (cleanText === 'BIAYA TOTAL (RP)') text = 'BIAYA\u00A0TOTAL\n(Rp)';

                  return (
                    <th key={`h1-${index}`} colSpan={h.colSpan} rowSpan={h.rowSpan} className="p-0 relative align-middle print-p-1" style={isNoCol ? { width: '4%', minWidth: '30px', whiteSpace: 'nowrap' } : {}}>
                      {isNoCol ? (
                        <div className="px-2 py-2 flex items-center justify-center print-p-0"><span className="font-bold text-center">{text || '\u00A0'}</span></div>
                      ) : (
                        <div className="overflow-hidden px-2 py-2 flex items-center justify-center h-full print-p-0" style={{ minWidth: '50px'}}>
                          <span className="font-bold text-center">
                            {text ? text.split('\n').map((line, i) => <React.Fragment key={i}>{line}{i !== text.split('\n').length - 1 && <br/>}</React.Fragment>) : '\u00A0'}
                          </span>
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
              {headerData.tr2.length > 0 && (
                <tr className="keep-together">
                  {headerData.tr2.map((h, index) => {
                    if (variant === 'SPEK' && priceCols.includes(h.origCol)) return null;

                    let text = String(h.text || '');
                    const isNoCol = text.trim().toUpperCase() === 'NO';
                    const cleanText = text.toUpperCase().replace(/[\r\n\s]+/g, ' ').trim();
                    
                    if (cleanText === 'HARGA SATUAN (RP)') text = 'HARGA\u00A0SATUAN\n(Rp)';
                    if (cleanText === 'BIAYA TOTAL (RP)') text = 'BIAYA\u00A0TOTAL\n(Rp)';

                    return (
                      <th key={`h2-${index}`} colSpan={h.colSpan} rowSpan={h.rowSpan} className="p-0 relative align-middle print-p-1" style={isNoCol ? { width: '4%', minWidth: '30px', whiteSpace: 'nowrap' } : {}}>
                        <div className={`overflow-hidden px-2 py-2 flex items-center justify-center h-full print-p-0`} style={{ minWidth: '50px'}}>
                          <span className="font-bold text-center">
                            {text ? text.split('\n').map((line, i) => <React.Fragment key={i}>{line}{i !== text.split('\n').length - 1 && <br/>}</React.Fragment>) : '\u00A0'}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              )}
            </thead>
          ) : (
            <thead className="bg-transparent">
              <tr className="keep-together">
                {headerData.tr1 && headerData.tr1.map((cell, index) => {
                  if (variant === 'SPEK' && priceCols.includes(index)) return null;

                  let text = String(cell || '');
                  const isNoCol = text.trim().toUpperCase() === 'NO';
                  const cleanText = text.toUpperCase().replace(/[\r\n\s]+/g, ' ').trim();
                  
                  if (variant === 'BOQ' && cleanText.includes('HPS')) text = 'BOQ';
                  if (cleanText === 'HARGA SATUAN (RP)') text = 'HARGA\u00A0SATUAN\n(Rp)';
                  if (cleanText === 'BIAYA TOTAL (RP)') text = 'BIAYA\u00A0TOTAL\n(Rp)';

                  return (
                    <th key={`h-${index}`} className="p-0 relative align-middle print-p-1" style={isNoCol ? { width: '4%', minWidth: '30px', whiteSpace: 'nowrap' } : {}}>
                      {isNoCol ? (
                        <div className="px-2 py-2 flex items-center justify-center print-p-0"><span className="font-bold text-center">{text || '\u00A0'}</span></div>
                      ) : (
                        <div className="overflow-hidden px-2 py-2 flex items-center justify-center print-p-0" style={{ minWidth: '50px'}}>
                          <span className="font-bold text-center">
                            {text ? text.split('\n').map((line, i) => <React.Fragment key={i}>{line}{i !== text.split('\n').length - 1 && <br/>}</React.Fragment>) : '\u00A0'}
                          </span>
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
          )}
          <tbody suppressContentEditableWarning>
            {headerData.body.map((row, rowIndex) => {
              const nonEmptyCells = row.map((cell, index) => ({ text: cell ? String(cell).trim() : '', index })).filter(c => c.text !== '');
              
              let isSummaryRow = false;
              let summaryLabel = '';
              let summaryValue = '';
              
              if (nonEmptyCells.length >= 1 && nonEmptyCells.length <= 2) {
                  const labelUpper = nonEmptyCells[0].text.toUpperCase();
                  const summaryKeywords = ['TOTAL', 'FEE', 'PPN', 'PAJAK', 'PEMBULATAN'];
                  if (summaryKeywords.some(kw => labelUpper.includes(kw))) {
                      isSummaryRow = true;
                      summaryLabel = nonEmptyCells[0].text;
                      summaryValue = nonEmptyCells.length === 2 ? nonEmptyCells[1].text : '';
                  }
              }

              const isBoldRow = isRomanNumeral(row[0]);
              const isNumberingRow = checkIsNumberingRow(row);
              
              const isEmptyRow = row.every(c => !c || String(c).trim() === '');
              if (isEmptyRow) {
                return (
                    <tr key={`tr-${rowIndex}`} className="hover-bg-gray keep-together">
                        {row.map((_, i) => {
                            if (variant === 'SPEK' && priceCols.includes(i)) return null;
                            return <td key={`td-${rowIndex}-${i}`} className="py-0 px-2" style={{ height: '12px' }}></td>
                        })}
                    </tr>
                );
              }

              if (isSummaryRow) {
                if (variant === 'SPEK') return null;

                let val = summaryValue;
                if (variant === 'BOQ') val = '-';
                else if (val) val = val.replace(/,/g, '.');

                return (
                  <tr key={`tr-summary-${rowIndex}`} className="bg-white keep-together">
                    <td colSpan={row.length - 1} className="px-2 py-2 text-center align-middle" style={{ fontWeight: 'bold' }}>{summaryLabel}</td>
                    <td className="px-2 py-2 text-right align-middle whitespace-nowrap" style={{ fontWeight: 'bold' }}>{val || '\u00A0'}</td>
                  </tr>
                );
              }

              return (
                <tr key={`tr-${rowIndex}`} className={`hover-bg-gray keep-together`}>
                  {row.map((cell, cellIndex) => {
                    if (variant === 'SPEK' && priceCols.includes(cellIndex)) return null;
                    
                    let text = String(cell || '');
                    if (variant === 'BOQ' && priceCols.includes(cellIndex)) {
                        text = '-';
                    } else if (priceCols.includes(cellIndex) && text) {
                        text = text.replace(/,/g, '.');
                    }

                    const isNoCol = cellIndex === 0;
                    const isVolCol = volCols.includes(cellIndex);

                    // Pastikan font-weight normal dengan mengabaikan kelas getAlignmentClassRAB jika ia merender bold untuk penomoran
                    let alignClass = getAlignmentClassRAB(text, cellIndex, isNumberingRow);
                    alignClass = alignClass.replace('font-bold', ''); // Remove bold class if generated

                    return (
                      <td 
                        key={`td-${rowIndex}-${cellIndex}`} 
                        className={`py-1 px-2 break-words ${alignClass} ${isNoCol ? 'whitespace-nowrap' : 'whitespace-pre-wrap'}`}
                        style={{ 
                            ...(isNoCol ? { width: '4%', minWidth: '30px', textAlign: 'center' } : {}), 
                            ...(isVolCol && volCols.length > 1 ? { minWidth: '40px', width: `${15 / volCols.length}%` } : {}),
                            fontWeight: 'normal' // Paksa font weight menjadi normal
                        }}
                      >
                        {text || '\u00A0'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const TtdPpk = () => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', pageBreakInside: 'avoid', lineHeight: '1.15', fontSize: '11pt' }}>
      <div style={{ textAlign: 'center', width: '300px' }}>
        <p className="mb-0">Pejabat Pembuat Komitmen</p>
        <p className="mb-0">Direktorat Promosi dan Edukasi Gizi,</p>
        <div style={{ height: '80px' }}></div>
        <p className="mb-0" style={{ textDecoration: 'underline' }}><V>{masterData.namaPpk}</V></p>
        <p className="mb-0">NIP <V>{formatNip(masterData.nipPpk)}</V></p>
      </div>
    </div>
  );

  return (
    <>
      {/* PAGE 1: COVER KAK */}
      <PaperPage id={`page-master-${project.id || 'new'}`} hideHeader={true} paperSize={pSize} margins={marginProps}>
          <div className="doc-body text-center font-bold" style={{ paddingTop: '15%' }}>
            <div style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '0', lineHeight: '1.2' }}>
              KERANGKA ACUAN KERJA / TERM OF REFERENCE<br/>(KAK/ToR)
            </div>
            <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '2.5rem', lineHeight: '1.5' }}>
              <p className="mb-0">PENGADAAN JASA LAINNYA PELAKSANAAN SOSIALISASI PROGRAM</p>
              <p className="mb-0">MAKAN BERGIZI GRATIS UNTUK MASYARAKAT</p>
              <p className="mb-0">KEGIATAN PROMOSI TENTANG PEMENUHAN GIZI</p>
              <p className="mb-0">TAHUN ANGGARAN 2026</p>
            </div>
            
            {logoImage ? (
              <img src={logoImage} alt="Logo Instansi" style={{ width: '160px', height: '160px', objectFit: 'contain', margin: '5rem auto' }} />
            ) : (
              <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="print-hidden text-gray-400 border border-dashed p-4 rounded text-sm">(Upload Logo KAK di panel kiri)</span>
              </div>
            )}
            
            <div className="uppercase" style={{ fontSize: '11pt', fontWeight: 'bold', marginTop: '2.5rem' }}>
              <p className="mb-0">DIREKTORAT PROMOSI DAN EDUKASI GIZI</p>
              <p className="mb-0">DEPUTI BIDANG PROMOSI DAN KERJASAMA</p>
              <p className="mb-0">BADAN GIZI NASIONAL</p>
              <br/>
              <br/>
              <br/>
              <p className="mb-0">TAHUN ANGGARAN 2026</p>
            </div>
          </div>
      </PaperPage>

      {/* PAGE 2: ISI KAK */}
      <PaperPage hideHeader={true} paperSize={pSize} margins={marginProps}>
        <div className="doc-body leading-relaxed" style={{ paddingTop: '5%' }}>
            <div className="text-center font-bold mb-8">
              {logoImage && <img src={logoImage} alt="Logo Instansi" style={{ width: '100px', height: '100px', objectFit: 'contain', margin: '0 auto 1rem auto' }} />}
              <div style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '0.5rem', lineHeight: '1.2' }}>
                KERANGKA ACUAN KERJA / TERM OF REFERENCE<br/>(KAK/ToR)
              </div>
              <div className="uppercase" style={{ fontSize: '12pt', lineHeight: '1.5' }}>
                <p className="mb-0">PENGADAAN JASA LAINNYA PELAKSANAAN SOSIALISASI PROGRAM</p>
                <p className="mb-0">MAKAN BERGIZI GRATIS UNTUK MASYARAKAT</p>
                <p className="mb-0">KEGIATAN PROMOSI TENTANG PEMENUHAN GIZI</p>
                <p className="mb-0">TAHUN ANGGARAN 2026</p>
              </div>
            </div>

            <table suppressContentEditableWarning className="w-full mb-6" style={{ fontSize: '11pt', lineHeight: '1.15', border: 'none', borderCollapse: 'collapse' }}>
              <colgroup><col style={{width:'28%'}}/><col style={{width:'2%'}}/><col style={{width:'70%'}}/></colgroup>
              <tbody>
                <tr><td className="align-top pb-1">Kementerian Negara/Lembaga</td><td className="align-top pb-1">: </td><td className="align-top pb-1">Badan Gizi Nasional</td></tr>
                <tr><td className="align-top pb-1">Unit Eselon I</td><td className="align-top pb-1">: </td><td className="align-top pb-1">Deputi Bidang Promosi dan Kerjasama</td></tr>
                <tr><td className="align-top pb-1">Unit Eselon II</td><td className="align-top pb-1">: </td><td className="align-top pb-1">Direktorat Promosi dan Edukasi Gizi</td></tr>
                <tr><td className="align-top pb-1">Hasil (Outcome)</td><td className="align-top pb-1">: </td><td className="align-top pb-1 text-justify">Meningkatnya pemahaman, kesadaran, dan dukungan masyarakat terhadap pelaksanaan Program Makan Bergizi Gratis (MBG) dalam rangka peningkatan pemenuhan gizi masyarakat.</td></tr>
                <tr><td className="align-top pb-1">Kegiatan</td><td className="align-top pb-1">: </td><td className="align-top pb-1 text-justify">Promosi Tentang Pemenuhan Gizi</td></tr>
                <tr><td className="align-top pb-1">Indikator Kinerja Kegiatan</td><td className="align-top pb-1">: </td><td className="align-top pb-1">-</td></tr>
                <tr><td className="align-top pb-1">Jenis Keluaran (Output)</td><td className="align-top pb-1">: </td><td className="align-top pb-1 text-justify">Terselenggaranya kegiatan Sosialisasi Program Makan Bergizi Gratis (MBG) kepada masyarakat pada 1 (Satu) titik kegiatan yang dilaksanakan oleh Badan Gizi Nasional bersama mitra kerja Komisi IX DPR RI, serta tersusunnya laporan dan dokumentasi kegiatan.</td></tr>
                <tr><td className="align-top pb-1" style={{ whiteSpace: 'nowrap' }}>Volume Keluaran (Output)</td><td className="align-top pb-1">: </td><td className="align-top pb-1">1 (Satu)</td></tr>
                <tr><td className="align-top pb-1" style={{ whiteSpace: 'nowrap' }}>Satuan Ukur Keluaran (Output)</td><td className="align-top pb-1">: </td><td className="align-top pb-1">Titik</td></tr>
              </tbody>
            </table>

            <KakSection num="I" title="LATAR BELAKANG" />
            <KakContent>
                <p className="mb-2" style={{ textIndent: '2.5rem' }}>Program MBG merupakan salah satu program pemerintah yang bertujuan untuk meningkatkan kualitas hidup masyarakat melalui pemenuhan kebutuhan gizi yang seimbang serta peningkatan kesadaran masyarakat terhadap pentingnya pola konsumsi pangan yang sehat dan bergizi. Keberhasilan pelaksanaan program tersebut tidak hanya bergantung pada kebijakan pemerintah semata, namun juga memerlukan dukungan serta partisipasi aktif dari masyarakat sebagai sasaran utama program.</p>
                <p className="mb-2" style={{ textIndent: '2.5rem' }}>Dalam pelaksanaannya, masih terdapat keterbatasan pemahaman masyarakat mengenai tujuan, manfaat, serta mekanisme pelaksanaan program MBG. Kondisi ini menunjukkan bahwa upaya penyebarluasan informasi kepada masyarakat masih perlu terus ditingkatkan agar masyarakat dapat memperoleh informasi yang jelas, benar, dan komprehensif mengenai program MBG.</p>
                <p className="mb-2" style={{ textIndent: '2.5rem' }}>Sebagai bagian dari upaya penyebarluasan informasi tersebut, Badan Gizi Nasional (BGN) melaksanakan kegiatan sosialisasi program MBG kepada masyarakat melalui pendekatan komunikasi publik secara langsung. Kegiatan sosialisasi ini menjadi salah satu sarana strategis dalam menyampaikan informasi program pemerintah sekaligus membangun kesadaran masyarakat terhadap pentingnya pemenuhan gizi yang baik.</p>
                <p className="mb-2" style={{ textIndent: '2.5rem' }}>Dalam rangka memperkuat jangkauan penyampaian informasi kepada masyarakat, pelaksanaan kegiatan sosialisasi ini juga dilaksanakan melalui kemitraan Badan Gizi Nasional dengan Anggota Komisi IX DPR RI, yang memiliki fungsi strategis. Melalui kemitraan tersebut diharapkan penyebarluasan informasi mengenai program MBG dapat menjangkau masyarakat secara lebih luas, khususnya pada wilayah daerah pemilihan.</p>
                <p className="mb-0" style={{ textIndent: '2.5rem' }}>Sehubungan dengan hal tersebut, Badan Gizi Nasional melaksanakan kegiatan sosialisasi program MBG kepada masyarakat pada berbagai wilayah. Kerangka Acuan Kerja (KAK) ini disusun sebagai pedoman pelaksanaan kegiatan sosialisasi program MBG pada 1 (Satu) titik kegiatan, sehingga pelaksanaan kegiatan dapat berjalan secara efektif, efisien, serta dapat dipertanggungjawabkan secara administratif.</p>
            </KakContent>

            <KakSection num="II" title="MAKSUD DAN TUJUAN" />
            <KakContent>
                <div className="mb-4">
                  <p className="mb-0 font-bold">Maksud</p>
                  <p className="mb-0">Menyelenggarakan kegiatan sosialisasi program MBG kepada masyarakat sebagai upaya penyebarluasan informasi program pemerintah di bidang gizi kepada masyarakat secara langsung.</p>
                </div>
                <div>
                  <p className="mb-0 font-bold">Tujuan</p>
                  <ol className="mb-0">
                    <li>Meningkatkan pemahaman masyarakat mengenai program MBG.</li>
                    <li>Menyebarluaskan informasi terkait program MBG kepada masyarakat.</li>
                    <li>Meningkatkan kesadaran masyarakat mengenai pentingnya pemenuhan gizi yang baik.</li>
                    <li>Mendorong partisipasi masyarakat dalam mendukung pelaksanaan program MBG.</li>
                  </ol>
                </div>
            </KakContent>

            <KakSection num="III" title="SASARAN KEGIATAN" />
            <KakContent>
                <p className="mb-0">Sasaran kegiatan sosialisasi ini meliputi:</p>
                <ul className="mb-1">
                  <li>Masyarakat umum</li>
                  <li>Tokoh masyarakat</li>
                  <li>Organisasi masyarakat</li>
                  <li>Komunitas lokal</li>
                  <li>Pemangku kepentingan di daerah</li>
                </ul>
                <p className="mb-0">Jumlah peserta kegiatan diperkirakan sebanyak ± 300 orang.</p>
            </KakContent>

            <KakSection num="IV" title="LOKASI DAN WAKTU PELAKSANAAN" />
            <KakContent>
                <p className="mb-0 font-bold">Lokasi</p>
                <table suppressContentEditableWarning className="w-full mb-2">
                  <colgroup><col style={{width:'30%'}}/><col style={{width:'2%'}}/><col style={{width:'68%'}}/></colgroup>
                  <tbody>
                    <tr><td className="align-top pb-0">Provinsi</td><td className="align-top pb-0">: </td><td className="align-top pb-0"><V>{formatTitleCase(masterData.provinsiKak)}</V></td></tr>
                    <tr><td className="align-top pb-0">Kabupaten/Kota</td><td className="align-top pb-0">: </td><td className="align-top pb-0"><V>{formatTitleCase(masterData.kabupatenKak)}</V></td></tr>
                    <tr><td className="align-top pb-0">Jumlah kegiatan</td><td className="align-top pb-0">: </td><td className="align-top pb-0">1 (Satu) titik kegiatan</td></tr>
                  </tbody>
                </table>
                <p className="mb-0 font-bold">Waktu Pelaksanaan</p>
                <p className="mb-0">Kegiatan sosialisasi dilaksanakan selama 1 (Satu) hari kegiatan sesuai dengan jadwal yang telah ditetapkan.</p>
            </KakContent>

            <KakSection num="V" title="JENIS KELUARAN (OUTPUT)" />
            <KakContent>
                <p className="mb-0">Output dari kegiatan ini adalah:</p>
                <ol className="mb-0">
                  <li>Terselenggaranya kegiatan Sosialisasi Program Makan Bergizi Gratis (MBG) kepada masyarakat pada 1 (Satu) titik kegiatan.</li>
                  <li>Tersedianya materi sosialisasi program MBG.</li>
                  <li>Tersedianya dokumentasi kegiatan berupa foto dan/atau video kegiatan.</li>
                  <li>Tersusunnya laporan pelaksanaan kegiatan.</li>
                </ol>
            </KakContent>

            <KakSection num="VI" title="HASIL YANG DIHARAPKAN (OUTCOME)" />
            <KakContent>
                <ol className="mb-0">
                  <li>Meningkatnya pemahaman masyarakat mengenai program MBG.</li>
                  <li>Meningkatnya kesadaran masyarakat terhadap pentingnya pemenuhan gizi yang baik.</li>
                  <li>Tersampaikannya informasi program MBG kepada masyarakat secara langsung.</li>
                  <li>Meningkatnya dukungan masyarakat terhadap pelaksanaan program MBG.</li>
                </ol>
            </KakContent>

            <KakSection num="VII" title="RUANG LINGKUP KEGIATAN" />
            <KakContent>
                <p className="mb-0">Ruang lingkup kegiatan meliputi:</p>
                <ol className="mb-0">
                  <li><strong>Persiapan Kegiatan</strong>
                    <ul className="mb-0 mt-0">
                      <li>Koordinasi pelaksanaan kegiatan</li>
                      <li>Persiapan lokasi kegiatan</li>
                      <li>Persiapan materi sosialisasi</li>
                    </ul>
                  </li>
                  <li><strong>Pelaksanaan Kegiatan</strong>
                    <ul className="mb-0 mt-0">
                      <li>Registrasi peserta</li>
                      <li>Pembukaan kegiatan</li>
                      <li>Penyampaian materi sosialisasi oleh narasumber</li>
                      <li>Diskusi dan tanya jawab dengan peserta</li>
                      <li>Penutupan kegiatan</li>
                    </ul>
                  </li>
                  <li><strong>Dokumentasi dan Pelaporan</strong>
                    <ul className="mb-0 mt-0">
                      <li>Dokumentasi foto kegiatan</li>
                      <li>Dokumentasi video kegiatan (jika diperlukan)</li>
                      <li>Penyusunan laporan pelaksanaan kegiatan</li>
                    </ul>
                  </li>
                </ol>
            </KakContent>

            <KakSection num="VIII" title="DOKUMENTASI KEGIATAN" />
            <KakContent>
                <p className="mb-0">Dokumentasi kegiatan yang harus disiapkan meliputi:</p>
                <ol className="mb-0">
                  <li>Daftar hadir peserta kegiatan</li>
                  <li>Daftar hadir narasumber</li>
                  <li>Rundown acara kegiatan</li>
                  <li>Dokumentasi foto kegiatan yang mencakup:
                    <ul className="mb-0 mt-0">
                      <li>Pembukaan kegiatan</li>
                      <li>Penyampaian materi sosialisasi</li>
                      <li>Kehadiran narasumber dan peserta</li>
                      <li>Penutupan kegiatan</li>
                    </ul>
                  </li>
                  <li>Dokumentasi video kegiatan (jika diperlukan)</li>
                  <li>Laporan pelaksanaan kegiatan</li>
                </ol>
            </KakContent>

            <div className="keep-together">
              <KakSection num="IX" title="METODE PELAKSANAAN" />
              <KakContent>
                  <p className="mb-0">Pelaksanaan kegiatan dilakukan melalui pengadaan jasa lainnya sesuai dengan ketentuan peraturan perundang-undangan mengenai pengadaan barang/jasa pemerintah.</p>
              </KakContent>
            </div>

            <div className="keep-together">
              <KakSection num="X" title="LOKASI PENGGUNA JASA" />
              <KakContent>
                  <table suppressContentEditableWarning className="w-full mb-0" style={{ border: 'none' }}>
                    <colgroup><col style={{width:'30%'}}/><col style={{width:'2%'}}/><col style={{width:'68%'}}/></colgroup>
                    <tbody>
                      <tr><td className="align-top pb-1">Nama PPK</td><td className="align-top pb-1">: </td><td className="align-top pb-1"><V>{masterData.namaPpk}</V></td></tr>
                      <tr><td className="align-top pb-1">Satker/Unit Kerja</td><td className="align-top pb-1">: </td><td className="align-top pb-1">Badan Gizi Nasional, Direktorat Promosi dan Edukasi Gizi</td></tr>
                      <tr><td className="align-top pb-1">Lokasi</td><td className="align-top pb-1">: </td><td className="align-top pb-1">Jalan Kebon Sirih I No. 1, Menteng Jakarta Pusat</td></tr>
                    </tbody>
                  </table>
              </KakContent>
            </div>

            <div className="keep-together">
              <KakSection num="XI" title="SUMBER PENDANAAN" />
              <KakContent>
                  <p className="mb-0">Pembiayaan kegiatan bersumber dari DIPA Badan Gizi Nasional Tahun Anggaran 2026, dengan SP DIPA-128.01.1.691267/2026 tanggal 1 Desember 2025;</p>
                  <ol className="mb-0">
                    <li>Akun kegiatan: 7076.PEH.001.051.F.522191</li>
                    <li>Pagu anggaran sebesar (Nilai RAB) dari <V>{formatCurrencyDisplay(masterData.nilaiKak)}</V> (<V>{formatTerbilang(masterData.nilaiKak)}</V>)</li>
                    <li>Kebutuhan Anggaran dan Biaya (terlampir)</li>
                  </ol>
              </KakContent>
            </div>

            <div className="keep-together">
              <KakSection num="XII" title="WAKTU PELAKSANAAN PEKERJAAN" />
              <KakContent>
                  <p className="mb-0">Pelaksanaan kegiatan dilaksanakan selama 1 (Satu) hari kegiatan, dengan waktu persiapan dan penyelesaian administrasi kegiatan menyesuaikan jadwal pelaksanaan kegiatan.</p>
              </KakContent>
            </div>

            <div className="keep-together">
              <KakSection num="XIII" title="PENUTUP" />
              <KakContent>
                  <p className="mb-2" style={{ textIndent: '2.5rem' }}>Kerangka Acuan Kerja (KAK) ini disusun sebagai pedoman dalam pelaksanaan kegiatan Sosialisasi Program MBG kepada masyarakat pada 1 (Satu) titik kegiatan yang dilaksanakan oleh Badan Gizi Nasional melalui kemitraan dengan Anggota Komisi IX DPR RI.</p>
                  <p className="mb-0" style={{ textIndent: '2.5rem' }}>Dengan adanya kegiatan ini diharapkan masyarakat dapat memperoleh informasi yang jelas mengenai program MBG sehingga dapat meningkatkan pemahaman, kesadaran, serta dukungan masyarakat terhadap upaya pemerintah dalam meningkatkan status gizi masyarakat.</p>
              </KakContent>
              <TtdPpk />
            </div>
        </div>
      </PaperPage>

      {/* PAGE 3: RAB */}
      <PaperPage id={`page-rab-${project.id || 'new'}`} printClassName="page-rab" paperSize={pSize} headerImage={headerImage} margins={{ ...marginProps, top: 5, left: 10, right: 10 }} headerHeight={hHeight}>
        <div className="mb-8 leading-relaxed doc-body">
          <div className="text-center mb-6">
            <h3 className="font-bold mb-2" style={{ fontSize: '14pt' }}>RENCANA ANGGARAN BELANJA (RAB)</h3>
            <div style={{ fontSize: '14pt', fontWeight: 'normal', lineHeight: '1.3' }}>
              <V>{(masterData.namaPekerjaan || '').split('\n').map((line, i) => <React.Fragment key={i}>{formatTitleCase(line)}{i !== (masterData.namaPekerjaan || '').split('\n').length - 1 && <br/>}</React.Fragment>)}</V>
            </div>
          </div>

          <div className="mb-4">{renderTableVariant(headerDataKAK, 'RAB')}</div>

          <div className="keep-together">
            <p className="mb-8 text-justify" style={{ fontSize: '11pt' }}>Terbilang : <V>{formatTerbilang(masterData.nilaiKak)}</V></p>
            <TtdPpk />
          </div>
        </div>
      </PaperPage>

      {/* PAGE 4: HPS */}
      <PaperPage printClassName="page-hps" paperSize={pSize} headerImage={headerImage} margins={{ ...marginProps, top: 5, left: 10, right: 10 }} headerHeight={hHeight}>
        <div className="mb-8 leading-relaxed doc-body">
          <div className="text-center mb-6">
            <h3 className="font-bold mb-2" style={{ fontSize: '14pt' }}>HARGA PERKIRAAN SENDIRI (HPS)</h3>
            <div style={{ fontSize: '14pt', fontWeight: 'normal', lineHeight: '1.3' }}>
              <V>{(masterData.namaPekerjaan || '').split('\n').map((line, i) => <React.Fragment key={i}>{formatTitleCase(line)}{i !== (masterData.namaPekerjaan || '').split('\n').length - 1 && <br/>}</React.Fragment>)}</V>
            </div>
          </div>

          <div className="mb-4">{renderTableVariant(headerDataKAK, 'HPS')}</div>

          <div className="keep-together">
            <p className="mb-8 text-justify" style={{ fontSize: '11pt' }}>Terbilang : <V>{formatTerbilang(masterData.nilaiKak)}</V></p>
            <TtdPpk />
          </div>
        </div>
      </PaperPage>

      {/* PAGE 5: SPESIFIKASI TEKNIS */}
      <PaperPage printClassName="page-spek" paperSize={pSize} headerImage={headerImage} margins={{ ...marginProps, top: 5, left: 10, right: 10 }} headerHeight={hHeight}>
        <div className="mb-8 leading-relaxed doc-body">
          <div className="text-center mb-6">
            <h3 className="font-bold mb-2" style={{ fontSize: '14pt' }}>SPESIFIKASI TEKNIS</h3>
            <div style={{ fontSize: '14pt', fontWeight: 'normal', lineHeight: '1.3' }}>
              <V>{(masterData.namaPekerjaan || '').split('\n').map((line, i) => <React.Fragment key={i}>{formatTitleCase(line)}{i !== (masterData.namaPekerjaan || '').split('\n').length - 1 && <br/>}</React.Fragment>)}</V>
            </div>
          </div>

          <div className="mb-4">{renderTableVariant(headerDataKAK, 'SPEK')}</div>

          <div className="keep-together">
            <TtdPpk />
          </div>
        </div>
      </PaperPage>

      {/* PAGE 6: BOQ */}
      <PaperPage printClassName="page-boq" paperSize={pSize} headerImage={headerImage} margins={{ ...marginProps, top: 5, left: 10, right: 10 }} headerHeight={hHeight}>
        <div className="mb-8 leading-relaxed doc-body">
          <div className="text-center mb-6">
            <h3 className="font-bold mb-2" style={{ fontSize: '14pt' }}>BILL OF QUANTITY (BOQ)</h3>
            <div style={{ fontSize: '14pt', fontWeight: 'normal', lineHeight: '1.3' }}>
              <V>{(masterData.namaPekerjaan || '').split('\n').map((line, i) => <React.Fragment key={i}>{formatTitleCase(line)}{i !== (masterData.namaPekerjaan || '').split('\n').length - 1 && <br/>}</React.Fragment>)}</V>
            </div>
          </div>

          <div className="mb-4">{renderTableVariant(headerDataKAK, 'BOQ')}</div>

          <div className="keep-together">
            <p className="mb-8 text-justify" style={{ fontSize: '11pt' }}>Terbilang : -</p>
            <TtdPpk />
          </div>
        </div>
      </PaperPage>
    </>
  );
};

export default function App() {
  const [view, setView] = useState('home'); 
  const [projects, setProjects] = useState([]);
  const [sessionProjectIds, setSessionProjectIds] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkPrinting, setIsBulkPrinting] = useState(false);
  
  const [isLoadingDB, setIsLoadingDB] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

  const [searchQuery, setSearchQuery] = useState('');

  const [terbilangInput, setTerbilangInput] = useState('');
  const [terbilangOutput, setTerbilangOutput] = useState('');

  const [masterData, setMasterData] = useState(BLANK_MASTER_DATA);
  
  const [headerImage, setHeaderImage] = useState(null);
  const [logoImage, setLogoImage] = useState(null);
  
  const [pastedKAK, setPastedKAK] = useState('');
  const [autoMerge, setAutoMerge] = useState(true); 
  
  const [paperSize, setPaperSize] = useState('A4');

  const [marginTop, setMarginTop] = useState(25.4);
  const [marginRight, setMarginRight] = useState(25.4);
  const [marginBottom, setMarginBottom] = useState(25.4);
  const [marginLeft, setMarginLeft] = useState(25.4);
  const [headerHeight, setHeaderHeight] = useState(40);

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isRightSidebarVisible, setIsRightSidebarVisible] = useState(true);

  useEffect(() => {
    if (!document.getElementById('aws-sdk-script')) {
      const script = document.createElement('script');
      script.id = 'aws-sdk-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/aws-sdk/2.1333.0/aws-sdk.min.js';
      document.head.appendChild(script);
    }
  }, []);

  // Load Projects & Categories
  useEffect(() => {
    setIsLoadingDB(true);
    const projectsRef = query(ref(db, 'projects'));
    const unsubscribeProj = onValue(projectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const projectList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        // Default sort descending by creation/update time in main array
        projectList.sort((a, b) => b.updatedAt - a.updatedAt);
        setProjects(projectList);
      } else {
        setProjects([]);
      }
      setIsLoadingDB(false); 
    });

    return () => {
        unsubscribeProj();
    };
  }, []);

  // Auto-Extract Total KAK / HPS dari Paste Tabel
  useEffect(() => {
      if (pastedKAK) {
          const rawRows = parseExcelPaste(pastedKAK);
          let totalValue = '';
          // Cek dari bawah untuk mencari baris Total
          for (let i = rawRows.length - 1; i >= 0; i--) {
              const row = rawRows[i];
              const nonEmpty = row.filter(c => c && c.trim() !== '');
              if (nonEmpty.length >= 2) {
                  const firstCell = String(nonEmpty[0]).toUpperCase();
                  if (firstCell.includes('TOTAL') || firstCell.includes('KESELURUHAN')) {
                      // Ambil cell data yang paling kanan (biasanya nominal totalnya)
                      totalValue = nonEmpty[nonEmpty.length - 1];
                      break;
                  }
              }
          }
          if (totalValue) {
              const cleanNum = totalValue.replace(/[^0-9]/g, '');
              if (cleanNum && cleanNum !== '0') {
                  setMasterData(prev => ({ ...prev, nilaiKak: formatCurrencyDisplay(cleanNum) }));
              }
          }
      }
  }, [pastedKAK]);

  // Handle Bulk Printing Effect
  useEffect(() => {
    if (isBulkPrinting) {
      setTimeout(() => {
        const container = document.getElementById('bulk-print-container');
        if (container) {
            const printCssStyles = getPrintCSS('A4');
            const printContent = container.innerHTML;
            const fullHtml = `
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Cetak Massal KAK</title>
                <style>
                    body { background-color: white; margin: 0; padding: 0; font-family: ${FONT_FAMILY}; -webkit-font-smoothing: antialiased; }
                    u, .underline { text-decoration-thickness: 1px; text-underline-offset: 2px; }
                    ${printCssStyles}
                </style>
            </head>
            <body>
                ${printContent}
                <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>
            </body>
            </html>
            `;

            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(fullHtml);
                printWindow.document.close();
            } else {
                messageApi.error('Gagal membuka tab pop-up. Pastikan popup diizinkan.');
            }
        }
        setIsBulkPrinting(false);
      }, 1000); 
    }
  }, [isBulkPrinting]);

  // Auto-Extract Location (Provinsi & Kabupaten/Kota) dari Nama Pekerjaan
  useEffect(() => {
      if (masterData.namaPekerjaan) {
          const text = masterData.namaPekerjaan;
          let extKab = masterData.kabupatenKak;
          let extProv = masterData.provinsiKak;

          const kabMatch = text.match(/(Kota\s+[a-zA-Z\s]+|Kabupaten\s+[a-zA-Z\s]+?)(?=,?\s+Provinsi)/i);
          if (kabMatch) extKab = formatTitleCase(kabMatch[1].trim());

          const provMatch = text.match(/Provinsi\s+([a-zA-Z\s]+?)(?=\s+Tanggal|\s+Tahun|\s+Pada|\s+Hari|\s+Di|,|\n|$)/i);
          if (provMatch) extProv = formatTitleCase(provMatch[1].trim());

          if (extKab !== masterData.kabupatenKak || extProv !== masterData.provinsiKak) {
              setMasterData(prev => ({
                  ...prev,
                  kabupatenKak: extKab,
                  provinsiKak: extProv
              }));
          }
      }
  }, [masterData.namaPekerjaan]);

  const filteredProjects = useMemo(() => {
      let filtered = [...projects];
      if (searchQuery) {
          const lowerQ = searchQuery.toLowerCase();
          filtered = filtered.filter(p => 
              (p.masterData?.judulProject || '').toLowerCase().includes(lowerQ) ||
              (p.masterData?.namaPekerjaan || '').toLowerCase().includes(lowerQ)
          );
      }
      
      // Sortir secara Descending (Z ke A) berdasarkan Nama Pekerjaan / Judul
      filtered.sort((a, b) => {
          const titleA = a.masterData?.judulProject || a.masterData?.namaPekerjaan || '';
          const titleB = b.masterData?.judulProject || b.masterData?.namaPekerjaan || '';
          return titleB.localeCompare(titleA);
      });
      
      return filtered;
  }, [projects, searchQuery]);

  const paginatedProjects = useMemo(() => {
      const startIndex = (currentPage - 1) * pageSize;
      return filteredProjects.slice(startIndex, startIndex + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  const createNewProject = () => {
    setMasterData(BLANK_MASTER_DATA);
    setHeaderImage(null);
    setLogoImage(null);
    setPastedKAK('');
    setSessionProjectIds([]);
    setPaperSize('A4');
    setMarginTop(25.4);
    setMarginRight(25.4);
    setMarginBottom(25.4);
    setMarginLeft(25.4);
    setHeaderHeight(40);
    setCurrentProjectId(null);
    setView('editor');
  };

  const editProject = (project) => {
    setMasterData({
        ...BLANK_MASTER_DATA,
        ...project.masterData,
        kategori: project.masterData?.kategori || 'Uncategorized'
    });
    setHeaderImage(project.headerImage || null);
    setLogoImage(project.logoImage || null);
    setPastedKAK(project.pastedKAK || project.pastedSPH || ''); 
    setAutoMerge(project.autoMerge !== undefined ? project.autoMerge : true);
    setPaperSize(project.paperSize || 'A4');
    setMarginTop(project.marginTop ?? 25.4);
    setMarginRight(project.marginRight ?? 25.4);
    setMarginBottom(project.marginBottom ?? 25.4);
    setMarginLeft(project.marginLeft ?? 25.4);
    setHeaderHeight(project.headerHeight ?? 40);
    setCurrentProjectId(project.id);
    setView('editor');
  };

  const saveToCloud = () => {
    const payload = {
      masterData, headerImage, logoImage, pastedKAK, autoMerge, 
      paperSize, marginTop, marginRight, marginBottom, marginLeft, headerHeight, updatedAt: Date.now()
    };
    if (currentProjectId) {
      update(ref(db, `projects/${currentProjectId}`), payload)
        .then(() => messageApi.success('Perubahan berhasil disimpan!'))
        .catch(err => messageApi.error('Gagal menyimpan: ' + err.message));
    } else {
      const newRef = push(ref(db, 'projects'));
      set(newRef, payload)
        .then(() => { 
            setCurrentProjectId(newRef.key); 
            setSessionProjectIds(prev => [...prev, newRef.key]);
            messageApi.success('Proyek baru berhasil disimpan!'); 
        })
        .catch(err => messageApi.error('Gagal membuat proyek: ' + err.message));
    }
  };

  const saveAsNewProject = () => {
    const payload = {
      masterData, headerImage, logoImage, pastedKAK, autoMerge, 
      paperSize, marginTop, marginRight, marginBottom, marginLeft, headerHeight, updatedAt: Date.now()
    };
    const newRef = push(ref(db, 'projects'));
    set(newRef, payload)
      .then(() => { 
        setCurrentProjectId(null); // Jangan set ID agar jadi blank draf baru
        messageApi.success('Ditambahkan sebagai Proyek Baru ke dalam daftar!'); 
        
        // Auto-Reset formulir untuk entri berikutnya
        setPastedKAK('');
        setMasterData(prev => ({
            ...prev,
            judulProject: '',
            namaPekerjaan: '',
            kabupatenKak: '',
            provinsiKak: '',
            nilaiKak: ''
        }));
      })
      .catch(err => messageApi.error('Gagal menambahkan proyek: ' + err.message));
  };

  const handleSaveAsPDF = () => {
      const container = document.getElementById('document-preview');
      if (container) {
          const printCssStyles = getPrintCSS(paperSize, marginTop, marginRight, marginBottom, marginLeft);
          const printContent = container.innerHTML;
          const fullHtml = `
          <!DOCTYPE html>
          <html lang="id">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Cetak KAK</title>
              <style>
                  body { background-color: white; margin: 0; padding: 0; font-family: ${FONT_FAMILY}; -webkit-font-smoothing: antialiased; color: black; }
                  u, .underline { text-decoration-thickness: 1px; text-underline-offset: 2px; }
                  ${printCssStyles}
              </style>
          </head>
          <body>
              ${printContent}
              <script>
                  window.onload = function() { 
                      setTimeout(function() { 
                          window.print(); 
                      }, 800); 
                  };
              </script>
          </body>
          </html>
          `;

          const printWindow = window.open('', '_blank');
          if (printWindow) {
              printWindow.document.write(fullHtml);
              printWindow.document.close();
          } else {
              messageApi.error('Gagal membuka tab pop-up. Pastikan browser Anda mengizinkan popup.');
          }
      } else {
          messageApi.error('Gagal memuat dokumen untuk dicetak.');
      }
  }

  const deleteProject = (id) => {
      remove(ref(db, `projects/${id}`)).then(() => {
          messageApi.success('Proyek dihapus.');
          setSessionProjectIds(prev => prev.filter(sId => sId !== id));
      });
  }
  
  const handleSelectAll = () => {
     if (selectedIds.length === filteredProjects.length) {
         setSelectedIds([]);
     } else {
         setSelectedIds(filteredProjects.map(p => p.id));
     }
  };

  const handleBulkPrint = () => {
      if (selectedIds.length === 0) {
          messageApi.warning('Pilih minimal satu proyek untuk dicetak.');
          return;
      }
      setIsBulkPrinting(true);
  };

  const duplicateProject = (project) => {
    const duplicatedMasterData = {
      ...(project.masterData || BLANK_MASTER_DATA),
      judulProject: (project.masterData?.judulProject || '') + ' (Copy)'
    };
    const payload = {
      masterData: duplicatedMasterData,
      headerImage: project.headerImage || null, logoImage: project.logoImage || null, pastedKAK: project.pastedKAK || project.pastedSPH || '', autoMerge: project.autoMerge !== undefined ? project.autoMerge : true,
      paperSize: project.paperSize || 'A4', 
      marginTop: project.marginTop ?? 25.4, marginRight: project.marginRight ?? 25.4, marginBottom: project.marginBottom ?? 25.4, marginLeft: project.marginLeft ?? 25.4, headerHeight: project.headerHeight ?? 40, updatedAt: Date.now()
    };
    const newRef = push(ref(db, 'projects'));
    set(newRef, payload).then(() => messageApi.success('Proyek diduplikasi!')).catch(err => messageApi.error('Gagal menduplikasi: ' + err.message));
  };

  const handleMasterDataChange = (e) => setMasterData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const uploadToR2 = async (file, setUrlState) => {
    if (!window.AWS) {
      messageApi.error("Sistem sedang memuat modul upload, mohon tunggu sebentar lalu coba lagi.");
      return;
    }
    const s3 = new window.AWS.S3({
      endpoint: R2_ENDPOINT,
      accessKeyId: "b79756a12f35285a3f2d0b09b2337edc",
      secretAccessKey: "e45f6c4c498de952ad4bfd65f36818dc01ed2b57162ccbdbeedfce365435178a",
      region: "auto", 
      signatureVersion: "v4"
    });
    const fileExtension = file.name.split('.').pop();
    const fileName = `kop_sph/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;

    messageApi.loading({ content: 'Mengunggah gambar ke server...', key: 'uploadMsg' });
    const params = { Bucket: R2_BUCKET_NAME, Key: fileName, Body: file, ContentType: file.type };
    try {
      await s3.upload(params).promise();
      const publicUrl = `${R2_PUBLIC_DOMAIN}/${fileName}`;
      setUrlState(publicUrl);
      messageApi.success({ content: 'Gambar berhasil diunggah!', key: 'uploadMsg' });
    } catch (error) {
      messageApi.error({ content: 'Gagal mengunggah gambar: ' + error.message, key: 'uploadMsg' });
    }
  };

  const handleImageUpload = (e) => { const file = e.target.files[0]; if (file) uploadToR2(file, setHeaderImage); };
  const handleLogoUpload = (e) => { const file = e.target.files[0]; if (file) uploadToR2(file, setLogoImage); };
  
  const handleTerbilangChange = (e) => {
    const val = e.target.value;
    setTerbilangInput(val);
    if (!val || val.trim() === '') setTerbilangOutput('');
    else {
        const hasil = formatTerbilang(val);
        setTerbilangOutput(hasil === '_____' ? '' : hasil);
    }
  };

  const handleCopyTerbilang = () => {
    if (!terbilangOutput) return;
    const textArea = document.createElement("textarea");
    textArea.value = terbilangOutput;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      messageApi.success('Teks terbilang berhasil disalin ke Clipboard!');
    } catch (err) {
      messageApi.error('Gagal menyalin teks.');
    }
    document.body.removeChild(textArea);
  };

  return (
    <>
      {contextHolder}
      
      {view === 'home' ? (
        <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
          <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#001529', padding: '0 24px' }}>
            <Space>
              <FileText color="white" size={24} />
              <Title level={4} style={{ color: 'white', margin: 0, marginTop: 4 }}>Dashboard KAK Generator</Title>
            </Space>
            <Space>
              <Button type="primary" icon={<Plus size={16} />} onClick={createNewProject}>
                Buat KAK Baru
              </Button>
            </Space>
          </Header>

          <Content style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 24, borderBottom: '1px solid #d9d9d9', paddingBottom: 16 }}>
              <Col>
                 <Space>
                    <Title level={3} style={{ margin: 0 }}>Daftar Dokumen KAK Tersimpan</Title>
                    <Text strong style={{ background: '#e6f7ff', padding: '4px 12px', borderRadius: 16, color: '#096dd9', marginLeft: 8 }}>{filteredProjects.length} Proyek</Text>
                 </Space>
              </Col>
              <Col>
                 <Space>
                   <Button icon={<CheckSquare size={16} />} onClick={handleSelectAll}>
                       {selectedIds.length === filteredProjects.length ? 'Unselect All' : 'Select All'}
                   </Button>
                   <Button type="primary" icon={<Printer size={16} />} onClick={handleBulkPrint}>
                       Cetak Massal (Gabung PDF)
                   </Button>
                 </Space>
              </Col>
            </Row>

            <Card style={{ marginBottom: 24, borderRadius: 8, border: '1px solid #91d5ff' }} bodyStyle={{ padding: '16px 24px', background: '#e6f7ff' }}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} md={8}>
                  <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 12, textTransform: 'uppercase', color: '#096dd9' }}>Alat Bantu: Konversi Terbilang</Text>
                  <Input placeholder="Contoh: 183.552.200 atau 183,552,200" value={terbilangInput} onChange={handleTerbilangChange} allowClear />
                </Col>
                <Col xs={24} md={16}>
                   <div 
                     onClick={terbilangOutput ? handleCopyTerbilang : undefined}
                     title={terbilangOutput ? "Klik di mana saja pada area ini untuk menyalin teks" : ""}
                     style={{ 
                       background: '#ffffff', 
                       border: '1px solid #91d5ff', 
                       padding: '8px 12px', 
                       borderRadius: '6px', 
                       minHeight: '38px', 
                       display: 'flex', 
                       alignItems: 'center', 
                       justifyContent: 'space-between',
                       cursor: terbilangOutput ? 'pointer' : 'default',
                       transition: 'background-color 0.2s'
                     }}
                     onMouseEnter={(e) => { if(terbilangOutput) e.currentTarget.style.backgroundColor = '#f0f5ff'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                   >
                     <Text style={{ color: '#0050b3', margin: 0, flex: 1, userSelect: 'none' }}>
                       {terbilangOutput || "Hasil teks terbilang akan muncul di sini..."}
                     </Text>
                     {terbilangOutput && (
                       <Copy size={16} color="#096dd9" style={{ marginLeft: '8px', flexShrink: 0 }} />
                     )}
                   </div>
                </Col>
              </Row>
            </Card>

            <Card style={{ marginBottom: 24, borderRadius: 8 }} bodyStyle={{ padding: '16px 24px' }}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 12, textTransform: 'uppercase' }}>Cari Nama Pekerjaan</Text>
                  <Input prefix={<Search size={16} color="#bfbfbf" />} placeholder="Ketik info paket pekerjaan..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </Col>
              </Row>
            </Card>

            <Spin spinning={isLoadingDB} tip="Memuat data dari database..." size="large">
              {filteredProjects.length === 0 && !isLoadingDB ? (
                <div style={{ textAlign: 'center', padding: '80px 0', border: '2px dashed #d9d9d9', borderRadius: 8, background: 'white' }}>
                  <Database size={64} color="#d9d9d9" style={{ margin: '0 auto 16px' }} />
                  <Title level={4} style={{ color: '#8c8c8c' }}>{projects.length === 0 ? 'Belum ada proyek tersimpan.' : 'Tidak ada proyek yang sesuai dengan pencarian.'}</Title>
                  <Text type="secondary">{projects.length === 0 ? 'Klik tombol "Buat KAK Baru" di atas untuk memulai.' : 'Coba ganti kata kunci pencarian.'}</Text>
                </div>
              ) : (
                <>
                  <Row gutter={[24, 24]}>
                    {paginatedProjects.map((proj) => (
                        <Col xs={24} lg={12} xl={12} key={proj.id}>
                          <Card 
                              hoverable 
                              style={{ 
                                height: '100%', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                border: selectedIds.includes(proj.id) ? '2px solid #1677ff' : '1px solid #f0f0f0',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                              }} 
                              bodyStyle={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }} 
                              actions={[
                                <Button type="primary" ghost icon={<Edit2 size={16} />} onClick={() => editProject(proj)} style={{ width: '92%', borderRadius: '8px', fontWeight: 'bold', height: '38px' }}>
                                  Buka & Edit Dokumen
                                </Button>
                              ]}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'flex-start' }}>
                              <Space align="center">
                                <Checkbox 
                                  checked={selectedIds.includes(proj.id)} 
                                  onChange={(e) => {
                                      if(e.target.checked) setSelectedIds([...selectedIds, proj.id]);
                                      else setSelectedIds(selectedIds.filter(id => id !== proj.id));
                                  }}
                                  style={{ transform: 'scale(1.1)' }}
                                />
                                <div style={{ fontSize: '11px', background: '#f0f5ff', color: '#1677ff', padding: '4px 12px', borderRadius: '20px', fontWeight: '600', marginLeft: '4px' }}>
                                    Diperbarui: {new Date(proj.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                              </Space>
                              <Space size={0}>
                                <Button type="text" shape="circle" icon={<Copy size={16} color="#595959" />} onClick={() => duplicateProject(proj)} title="Duplikasi Proyek" />
                                <Popconfirm title="Hapus proyek permanen?" onConfirm={() => deleteProject(proj.id)}>
                                  <Button type="text" danger shape="circle" icon={<Trash2 size={16} />} title="Hapus Proyek" />
                                </Popconfirm>
                              </Space>
                            </div>

                            <div style={{ marginBottom: '20px', cursor: 'pointer', flex: 1 }} onClick={() => editProject(proj)}>
                              <div style={{ fontSize: '18px', fontWeight: '800', color: '#002c8c', lineHeight: '1.3', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {formatTitleCase(proj.masterData?.judulProject || proj.masterData?.namaPekerjaan) || 'Proyek Tanpa Nama'}
                              </div>
                              {proj.masterData?.judulProject && proj.masterData?.judulProject !== proj.masterData?.namaPekerjaan && (
                                <div style={{ fontSize: '13px', color: '#8c8c8c', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
                                    {proj.masterData?.namaPekerjaan}
                                </div>
                              )}
                            </div>
                            
                            <div style={{ background: '#fafafa', borderRadius: '12px', padding: '16px', border: '1px solid #f0f0f0' }}>
                              <Row gutter={[16, 16]}>
                                <Col span={24}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ background: '#e6f4ff', padding: '10px', borderRadius: '8px', display: 'flex' }}><FileText size={18} color="#1677ff" /></div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: '11px', color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Nilai Total KAK / HPS</div>
                                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#262626', marginTop: '2px' }}>{formatCurrencyDisplay(proj.masterData?.nilaiKak) || '-'}</div>
                                    </div>
                                  </div>
                                </Col>
                                <Col span={12}>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                    <div style={{ background: '#fff1f0', padding: '8px', borderRadius: '8px', display: 'flex', marginTop: '2px' }}><span style={{fontSize: 16, lineHeight: 1}}>📍</span></div>
                                    <div>
                                      <div style={{ fontSize: '11px', color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', marginBottom: '4px' }}>Lokasi</div>
                                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#595959', lineHeight: 1.2 }}>{proj.masterData?.kabupatenKak || '-'}</div>
                                      <div style={{ fontSize: '11px', color: '#8c8c8c', marginTop: '2px' }}>{proj.masterData?.provinsiKak || '-'}</div>
                                    </div>
                                  </div>
                                </Col>
                                <Col span={12}>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                    <div style={{ background: '#f6ffed', padding: '8px', borderRadius: '8px', display: 'flex', marginTop: '2px' }}><User size={16} color="#52c41a" /></div>
                                    <div>
                                      <div style={{ fontSize: '11px', color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', marginBottom: '4px' }}>Pejabat PPK</div>
                                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#595959', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{proj.masterData?.namaPpk || '-'}</div>
                                    </div>
                                  </div>
                                </Col>
                              </Row>
                            </div>
                          </Card>
                        </Col>
                    ))}
                  </Row>
                  
                  {filteredProjects.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                      <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={filteredProjects.length}
                        onChange={(page, size) => {
                          setCurrentPage(page);
                          setPageSize(size);
                        }}
                        showSizeChanger
                        pageSizeOptions={['6', '12', '24', '48']}
                      />
                    </div>
                  )}
                </>
              )}
            </Spin>
          </Content>

          <div id="bulk-print-container" style={{ display: 'none' }}>
             {isBulkPrinting && projects.filter(p => selectedIds.includes(p.id)).map((proj) => (
                 <div key={`bulk-${proj.id}`}>
                     <DocumentTemplate project={proj} />
                 </div>
             ))}
          </div>

        </Layout>
      ) : (
        <Layout style={{ height: '100vh', overflow: 'hidden' }}>
          <Header style={{ background: '#001529', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px' }} className="print-hidden">
            <Space size="large" align="center">
              <Button type="text" icon={<Home size={20} color="white" />} onClick={() => setView('home')} title="Kembali ke Home" />
              <Button type="text" icon={isSidebarVisible ? <PanelLeftClose size={20} color="white" /> : <PanelLeft size={20} color="white" />} onClick={() => setIsSidebarVisible(!isSidebarVisible)} title="Sembunyikan/Tampilkan Panel Editor" />
              <Title level={5} style={{ color: 'white', margin: 0 }}>KAK Editor</Title>
            </Space>
            
            <Space>
              <Select value={paperSize} onChange={setPaperSize} style={{ width: 110 }}>
                <Option value="A4">Kertas A4</Option>
                <Option value="F4">Kertas F4</Option>
              </Select>

              <Popover placement="bottomRight" title="Atur Layout Kertas (mm)" content={
                <div style={{ width: '220px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <span style={{fontSize: 12, display: 'block', marginBottom: 4}}>Atas (Top)</span>
                      <Input type="number" value={marginTop} onChange={e => setMarginTop(e.target.value || 0)} size="small" />
                    </div>
                    <div>
                      <span style={{fontSize: 12, display: 'block', marginBottom: 4}}>Kanan (Right)</span>
                      <Input type="number" value={marginRight} onChange={e => setMarginRight(e.target.value || 0)} size="small" />
                    </div>
                    <div>
                      <span style={{fontSize: 12, display: 'block', marginBottom: 4}}>Bawah (Bottom)</span>
                      <Input type="number" value={marginBottom} onChange={e => setMarginBottom(e.target.value || 0)} size="small" />
                    </div>
                    <div>
                      <span style={{fontSize: 12, display: 'block', marginBottom: 4}}>Kiri (Left)</span>
                      <Input type="number" value={marginLeft} onChange={e => setMarginLeft(e.target.value || 0)} size="small" />
                    </div>
                  </div>
                  <Divider style={{ margin: '8px 0' }} />
                  <div>
                    <span style={{fontSize: 12, display: 'block', marginBottom: 4, fontWeight: 'bold'}}>Tinggi Kop Surat (mm)</span>
                    <Input type="number" value={headerHeight} onChange={e => setHeaderHeight(e.target.value || 0)} size="small" />
                  </div>
                </div>
              } trigger="click">
                <Button icon={<Settings size={16}/>}>Layout</Button>
              </Popover>
              
              <Button type="primary" style={{ background: '#52c41a' }} icon={<Save size={16}/>} onClick={saveToCloud}>Simpan Proyek</Button>
              <Button type="primary" style={{ background: '#1890ff' }} icon={<FileDown size={16}/>} onClick={handleSaveAsPDF}>Save as PDF</Button>
              
              <Button type="text" icon={isRightSidebarVisible ? <PanelRightClose size={20} color="white" /> : <PanelRight size={20} color="white" />} onClick={() => setIsRightSidebarVisible(!isRightSidebarVisible)} title="Daftar Proyek Cepat" />
            </Space>
          </Header>

          <Layout>
            <Sider 
              width={500} 
              collapsed={!isSidebarVisible} 
              collapsedWidth={0}
              trigger={null}
              theme="light" 
              className="print-hidden" 
              style={{ overflow: 'hidden', borderRight: isSidebarVisible ? '1px solid #f0f0f0' : 'none' }}
            >
              <div style={{ width: 500, height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
                <div style={{ padding: '0 16px 24px' }}>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: 16 }}>
                    {/* Card 1: Informasi Proyek */}
                    <Card size="small" title={<span style={{fontWeight: 'bold', color: '#1f2937'}}>Informasi Proyek</span>}>
                      <Row gutter={12}>
                        <Col span={24}><FormGroup label="Judul Proyek (Singkat)"><Input name="judulProject" value={masterData.judulProject} onChange={handleMasterDataChange} /></FormGroup></Col>
                        <Col span={24}><FormGroup label="Nama Pekerjaan (Dokumen & Tabel)"><TextArea name="namaPekerjaan" value={masterData.namaPekerjaan} onChange={handleMasterDataChange} autoSize={{minRows: 3}} /></FormGroup></Col>
                        <Col span={12}><FormGroup label={<span>Provinsi <Text type="secondary" style={{fontSize: 10}}>(⚡ Auto-Detected)</Text></span>}><Input name="provinsiKak" value={masterData.provinsiKak} onChange={handleMasterDataChange} /></FormGroup></Col>
                        <Col span={12}><FormGroup label={<span>Kabupaten/Kota <Text type="secondary" style={{fontSize: 10}}>(⚡ Auto-Detected)</Text></span>}><Input name="kabupatenKak" value={masterData.kabupatenKak} onChange={handleMasterDataChange} /></FormGroup></Col>
                      </Row>
                    </Card>

                    {/* Card 2: Tabel Data KAK & Nilai KAK */}
                    <Card size="small" title={<span style={{fontWeight: 'bold', color: '#1f2937'}}>Tabel Data KAK (RAB/HPS/BOQ/Spek)</span>}>
                      <div style={{ background: '#e6f7ff', padding: 12, borderRadius: 4, border: '1px solid #91d5ff', fontSize: 12, color: '#096dd9', marginBottom: 12 }}>
                          Paste tabel referensi <b>RAB/HPS/BOQ</b> dari Excel di bawah ini. Dokumen lampiran tabel akan terbuat secara otomatis.
                      </div>
                      <TextArea 
                          value={pastedKAK} 
                          onChange={e => setPastedKAK(e.target.value)} 
                          style={{ minHeight: '200px', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre', marginBottom: 12 }} 
                          placeholder="Paste data tabel Excel untuk lampiran KAK Anda di sini..."
                      />
                      <Row gutter={12}>
                        <Col span={24}>
                          <FormGroup label={<span>Nilai Total KAK / HPS <Text type="secondary" style={{fontSize: 10}}>(⚡ Auto-Filled dari Tabel)</Text></span>}>
                            <Input name="nilaiKak" value={masterData.nilaiKak} onChange={handleMasterDataChange} />
                          </FormGroup>
                        </Col>
                      </Row>
                    </Card>

                    {/* Card 3: Data PPK */}
                    <Card size="small" title={<span style={{fontWeight: 'bold', color: '#1f2937'}}>Data PPK (Pejabat Pembuat Komitmen)</span>}>
                      <Row gutter={12}>
                        <Col span={12}><FormGroup label="Nama PPK"><Input name="namaPpk" value={masterData.namaPpk} onChange={handleMasterDataChange} /></FormGroup></Col>
                        <Col span={12}><FormGroup label="NIP PPK"><Input name="nipPpk" value={masterData.nipPpk} onChange={handleMasterDataChange} /></FormGroup></Col>
                      </Row>
                    </Card>

                    {/* Card 4: Logo & Kop */}
                    <Card size="small" title={<span style={{fontWeight: 'bold', color: '#1f2937'}}>Logo KAK & Kop Surat</span>}>
                      <FormGroup label="Kop Surat (Hanya Halaman Lampiran)">
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <Input type="file" accept="image/*" onChange={handleImageUpload} style={{ flex: 1 }} />
                          {headerImage && <Button danger size="small" onClick={() => setHeaderImage(null)}>Hapus</Button>}
                        </div>
                      </FormGroup>
                      <FormGroup label="Logo Tengah KAK (Cover & Isi)">
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <Input type="file" accept="image/*" onChange={handleLogoUpload} style={{ flex: 1 }} />
                          {logoImage && <Button danger size="small" onClick={() => setLogoImage(null)}>Hapus</Button>}
                        </div>
                      </FormGroup>
                    </Card>
                  </div>

                </div>
              </div>
            </Sider>

            <Content style={{ background: '#e5e7eb', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              
              <div className="print-hidden" style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', padding: '10px 16px', borderBottom: '1px solid #d9d9d9', display: 'flex', gap: '12px', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', flexWrap: 'wrap' }}>
                 <Text strong style={{ marginRight: 8, fontSize: 13, color: '#595959' }}>Teks Editor:</Text>
                 <Space size={4}>
                   <Button size="small" icon={<Undo size={14}/>} onClick={() => document.execCommand('undo')} title="Undo" />
                   <Button size="small" icon={<Redo size={14}/>} onClick={() => document.execCommand('redo')} title="Redo" />
                 </Space>
                 <Divider type="vertical" />
                 <Space size={4}>
                   <Button size="small" icon={<Bold size={14}/>} onClick={() => document.execCommand('bold')} title="Bold (Tebal)" />
                   <Button size="small" icon={<Italic size={14}/>} onClick={() => document.execCommand('italic')} title="Italic (Miring)" />
                   <Button size="small" icon={<Underline size={14}/>} onClick={() => document.execCommand('underline')} title="Underline (Garis Bawah)" />
                   <Button size="small" icon={<Strikethrough size={14}/>} onClick={() => document.execCommand('strikeThrough')} title="Strikethrough (Coret Teks)" />
                 </Space>
                 <Divider type="vertical" />
                 <Space size={4}>
                   <Button size="small" icon={<AlignLeft size={14}/>} onClick={() => document.execCommand('justifyLeft')} title="Rata Kiri" />
                   <Button size="small" icon={<AlignCenter size={14}/>} onClick={() => document.execCommand('justifyCenter')} title="Rata Tengah" />
                   <Button size="small" icon={<AlignRight size={14}/>} onClick={() => document.execCommand('justifyRight')} title="Rata Kanan" />
                   <Button size="small" icon={<AlignJustify size={14}/>} onClick={() => document.execCommand('justifyFull')} title="Rata Kiri-Kanan (Justify)" />
                 </Space>
                 <Divider type="vertical" />
                 <Space size={4}>
                   <Button size="small" icon={<ListOrdered size={14}/>} onClick={() => document.execCommand('insertOrderedList')} title="Numbering" />
                   <Button size="small" icon={<List size={14}/>} onClick={() => document.execCommand('insertUnorderedList')} title="Bullet Points" />
                 </Space>
                 <Text type="secondary" style={{ fontSize: 11, marginLeft: 'auto', fontStyle: 'italic' }}>*Klik langsung pada dokumen untuk mulai mengedit teks.</Text>
              </div>

              <div 
                className="doc-preview-wrapper print-block print-p-0" 
                style={{ flex: 1, overflowY: 'auto' }}
              >
                <div id="document-preview" className="doc-preview-inner print-block print-gap-0">
                  <DocumentTemplate project={{ id: currentProjectId, masterData, headerImage, logoImage, pastedKAK, autoMerge, paperSize, marginTop, marginRight, marginBottom, marginLeft, headerHeight }} />
                </div>
              </div>
            </Content>

            <Sider 
              width={350} 
              placement="right"
              collapsed={!isRightSidebarVisible} 
              collapsedWidth={0}
              trigger={null}
              theme="light" 
              className="print-hidden" 
              style={{ overflow: 'hidden', borderLeft: isRightSidebarVisible ? '1px solid #f0f0f0' : 'none' }}
            >
              <div style={{ width: 350, height: '100%', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
                 <div style={{ padding: '16px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                    <Title level={5} style={{ margin: 0, marginBottom: '12px' }}>Daftar Proyek Cepat</Title>
                    <Button block type="primary" icon={<Plus size={16} />} onClick={saveAsNewProject}>
                        + Tambah Sebagai Proyek Baru
                    </Button>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginTop: '8px', lineHeight: '1.3' }}>
                        Simpan perubahan saat ini sebagai proyek baru tanpa mereset form, lalu lanjutkan mengedit untuk proyek berikutnya.
                    </Text>
                 </div>
                 <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                    {[...projects].sort((a, b) => {
                        const titleA = a.masterData?.judulProject || a.masterData?.namaPekerjaan || '';
                        const titleB = b.masterData?.judulProject || b.masterData?.namaPekerjaan || '';
                        return titleB.localeCompare(titleA);
                    }).map(proj => (
                       <Card 
                          key={proj.id} 
                          size="small" 
                          hoverable 
                          onClick={() => editProject(proj)}
                          style={{ marginBottom: '10px', border: proj.id === currentProjectId ? '2px solid #1890ff' : '1px solid #e8e8e8' }}
                       >
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                             <div style={{ flex: 1 }}>
                               <Text strong style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                                   {proj.masterData?.judulProject || proj.masterData?.namaPekerjaan || 'Proyek Tanpa Nama'}
                               </Text>
                               <div style={{ display: 'flex', flexDirection: 'column', fontSize: '11px', color: '#8c8c8c', paddingRight: '8px', gap: '4px' }}>
                                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                       <span>PPK: <span style={{color: '#595959', fontWeight: '500'}}>{proj.masterData?.namaPpk || '-'}</span></span>
                                       <span style={{ fontWeight: 'bold', color: '#595959' }}>{formatCurrencyDisplay(proj.masterData?.nilaiKak) || '-'}</span>
                                   </div>
                                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                       <span>📍 {proj.masterData?.kabupatenKak || '-'}, {proj.masterData?.provinsiKak || '-'}</span>
                                   </div>
                               </div>
                             </div>
                             <Button 
                                type="text" 
                                danger 
                                icon={<Trash2 size={16} />} 
                                onClick={(e) => { e.stopPropagation(); deleteProject(proj.id); }} 
                                style={{ padding: '4px', marginLeft: '4px' }}
                             />
                           </div>
                       </Card>
                    ))}
                    {projects.length === 0 && (
                        <div style={{ textAlign: 'center', marginTop: '2rem', color: '#bfbfbf', fontSize: '12px' }}>
                            Belum ada proyek yang tersimpan di database.
                        </div>
                    )}
                 </div>
              </div>
            </Sider>

          </Layout>
        </Layout>
      )}

      <style dangerouslySetInnerHTML={{__html: getPrintCSS(paperSize, marginTop, marginRight, marginBottom, marginLeft)}} />
    </>
  );
}