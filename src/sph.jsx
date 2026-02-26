import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, push, set, remove, update } from 'firebase/database';
// Import Ant Design
import { Layout, Button, Input, Select, Card, Typography, Row, Col, Space, message, Popconfirm, Tabs, Divider } from 'antd';
// Menggunakan Lucide React untuk Icon
import { FileText, Printer, FileDown, Database, Table as TableIcon, Briefcase, Plus, Trash2, Copy, Edit2, FileSignature, Home, Save, Search, PanelLeftClose, PanelLeft, MapPin, ImageIcon, Bold, Underline, Italic, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo, Redo, Palette } from 'lucide-react';

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
// DATA BLANK (TEMPLATE UNTUK PROYEK BARU)
// ==========================================
const BLANK_MASTER_DATA = {
  namaPekerjaan: '_____',
  namaPekerjaanSingkat: '_____',
  lokasiPekerjaan: '_____',
  waktuPenyelesaian: '_____',
  kotaSurat: '_____',
  nilaiSPH: '_____',
  nilaiSPK: '_____',
  namaInstansi: '_____',
  divisiInstansi: '_____',
  jabatanTujuanSPH: '_____',
  jabatanTujuanLainnya: '_____',
  tahunAnggaran: '_____',
  alamatInstansi: '_____',
  namaDirekturPenyedia: '_____',
  nikDirekturPenyedia: '_____',
  namaPenyedia: '_____',
  alamatPenyedia: '_____',
  kodePos: '_____',
  npwpPenyedia: '_____',
  noHpPenyedia: '_____',
  emailPenyedia: '_____',
  tlpFax: '_____',
  bankPenyedia: '_____',
  rekeningNomor: '_____',
  rekeningAtasNama: '_____',
  laporanPajak: '_____',
  tglLaporanPajak: '_____',
  aktaPendirian: '_____',
  noAktaPendirian: '_____',
  tglAktaPendirian: '_____',
  noMenkumham: '_____',
  aktaPerubahan: '_____',
  noAktaPerubahan: '_____',
  tglAktaPerubahan: '_____',
  noMenkumhamPerubahan: '_____',
  izinUsaha: '_____',
  tglIzinUsaha: '_____',
  pemberiIzin: '_____',
  masaBerlakuIzin: '_____',
  kualifikasiUsaha: '_____',
  noSuratPenawaran: '_____',
  tglSuratPenawaran: '_____',
  noSuratPemeriksaan: '_____',
  tglSuratPemeriksaan: '_____',
  noSuratPembayaran: '_____',
  tglSuratPembayaran: '_____',
  noSuratKwitansi: '_____',
  tglSuratKwitansi: '_____',
  noSPK: '_____',
  tglSPK: '_____',
};

const BLANK_PENGURUS_DATA = [{ id: 1, jabatan: '_____', nama: '_____', noKtp: '_____', sahamPersen: '_____' }];
const BLANK_PENGALAMAN_DATA = [{ id: 1, namaPaket: '_____', bidang: '_____', lokasi: '_____', pemberiNama: '_____', pemberiAlamat: '_____', kontrakNoTgl: '_____', kontrakNilai: '_____', selesaiKontrak: '_____', selesaiBAST: '_____' }];

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Helper format Kapital Tiap Awal Kata (Title Case)
const formatTitleCase = (str) => {
  if (!str || str === '_____') return str;
  const trimmed = str.trim();
  if(!trimmed) return str;
  return trimmed.toLowerCase().split(' ').map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
};

const formatTerbilang = (angkaStr) => {
  if (!angkaStr || angkaStr === '_____') return '_____';
  let numStr = angkaStr.split(',')[0];
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
  result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
  return result; 
};

// ==========================================
// KOMPONEN GLOBAL EKTRAK
// ==========================================
const FormGroup = ({ label, children }) => (
  <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#595959', marginBottom: '6px' }}>{label}</div>
      {children}
  </div>
);

// Wrapper Variabel agar terproteksi (tidak terhapus saat diedit)
const V = ({ children }) => (
  <span contentEditable={false} suppressContentEditableWarning className="var-protect">
    {children}
  </span>
);

const PaperPage = ({ id, children, paperSize, fontFamily, headerImage, hideHeader = false, orientation = 'portrait' }) => {
  const isPortrait = orientation === 'portrait';
  const width = paperSize === 'A4' ? (isPortrait ? '210mm' : '297mm') : (isPortrait ? '215.9mm' : '330.2mm');
  const minHeight = paperSize === 'A4' ? (isPortrait ? '297mm' : '210mm') : (isPortrait ? '330.2mm' : '215.9mm');
  const padding = isPortrait ? '15mm 15mm 20mm 20mm' : '15mm 15mm 15mm 15mm';

  return (
    <div id={id} className="paper-page bg-white text-black relative shrink-0" style={{ width, minHeight, padding, boxSizing: 'border-box', fontFamily }}>
      {!hideHeader && headerImage && (
        <div contentEditable={false} suppressContentEditableWarning className="w-full mb-4 text-center print-kop">
          <img src={headerImage} alt="Kop Surat" className="w-full h-auto object-contain mx-auto" style={{ maxWidth: '100%', maxHeight: '150px' }} />
        </div>
      )}
      <div contentEditable={true} suppressContentEditableWarning style={{ outline: 'none', width: '100%', height: '100%' }}>
        {children}
      </div>
    </div>
  );
};

const SignatureBlock = ({ align = 'right', greeting, company, name, title }) => {
  const isRight = align === 'right';
  return (
    <table contentEditable={false} suppressContentEditableWarning style={{ width: '100%', marginTop: '1.5rem', pageBreakInside: 'avoid', borderCollapse: 'collapse', border: 'none', lineHeight: '1.15' }}>
      <tbody>
        <tr>
          {isRight && <td style={{ width: '55%', border: 'none', padding: 0 }}></td>}
          <td style={{ width: '45%', textAlign: isRight ? 'center' : 'left', border: 'none', padding: 0, verticalAlign: 'top' }}>
            {greeting && <p contentEditable={true} suppressContentEditableWarning style={{ margin: 0, outline:'none' }}>{greeting}</p>}
            {company && <p contentEditable={true} suppressContentEditableWarning className="font-bold" style={{ margin: 0, outline:'none' }}><V>{company}</V></p>}
            <div style={{ height: '120px' }}></div>
            <p contentEditable={true} suppressContentEditableWarning className="font-bold underline" style={{ margin: 0, outline:'none' }}><V>{name || '________________'}</V></p>
            {title && <p contentEditable={true} suppressContentEditableWarning style={{ margin: 0, outline:'none' }}><V>{title}</V></p>}
          </td>
          {!isRight && <td style={{ width: '55%', border: 'none', padding: 0 }}></td>}
        </tr>
      </tbody>
    </table>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function App() {
  const [view, setView] = useState('home'); 
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

  const [filterPT, setFilterPT] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [masterData, setMasterData] = useState(BLANK_MASTER_DATA);
  const [pengurusData, setPengurusData] = useState(BLANK_PENGURUS_DATA);
  const [pengalamanData, setPengalamanData] = useState(BLANK_PENGALAMAN_DATA);
  const [headerImage, setHeaderImage] = useState(null);
  const [pastedSPH, setPastedSPH] = useState('');
  const [autoMerge, setAutoMerge] = useState(true); 
  
  const [fontFamily, setFontFamily] = useState('Arial, sans-serif');
  const [fontSize, setFontSize] = useState(11);
  const [paperSize, setPaperSize] = useState('A4');
  const [tableHeaderColor, setTableHeaderColor] = useState('#f3f4f6'); // State Warna Tabel

  const [activeTab, setActiveTab] = useState('master'); 
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  useEffect(() => {
    const projectsRef = ref(db, 'projects');
    const unsubscribe = onValue(projectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const projectList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        projectList.sort((a, b) => b.updatedAt - a.updatedAt);
        setProjects(projectList);
      } else {
        setProjects([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const createNewProject = () => {
    setMasterData(BLANK_MASTER_DATA);
    setPengurusData(BLANK_PENGURUS_DATA);
    setPengalamanData(BLANK_PENGALAMAN_DATA);
    setHeaderImage(null);
    setPastedSPH('');
    setPaperSize('A4');
    setFontFamily('Arial, sans-serif');
    setFontSize(11);
    setTableHeaderColor('#f3f4f6');
    setCurrentProjectId(null);
    setActiveTab('master');
    setView('editor');
  };

  const editProject = (project) => {
    setMasterData(project.masterData || BLANK_MASTER_DATA);
    setPengurusData(project.pengurusData || BLANK_PENGURUS_DATA);
    setPengalamanData(project.pengalamanData || []);
    setHeaderImage(project.headerImage || null);
    setPastedSPH(project.pastedSPH || '');
    setAutoMerge(project.autoMerge !== undefined ? project.autoMerge : true);
    setFontFamily(project.fontFamily || 'Arial, sans-serif');
    setFontSize(project.fontSize || 11);
    setPaperSize(project.paperSize || 'A4');
    setTableHeaderColor(project.tableHeaderColor || '#f3f4f6');
    setCurrentProjectId(project.id);
    setActiveTab('master');
    setView('editor');
  };

  const saveToCloud = () => {
    const payload = {
      masterData, pengurusData, pengalamanData, headerImage, pastedSPH, autoMerge, fontFamily, fontSize, paperSize, tableHeaderColor, updatedAt: Date.now()
    };
    if (currentProjectId) {
      update(ref(db, `projects/${currentProjectId}`), payload).then(() => messageApi.success('Perubahan berhasil disimpan!')).catch(err => messageApi.error('Gagal menyimpan: ' + err.message));
    } else {
      const newRef = push(ref(db, 'projects'));
      set(newRef, payload).then(() => { setCurrentProjectId(newRef.key); messageApi.success('Proyek baru berhasil disimpan!'); }).catch(err => messageApi.error('Gagal membuat proyek: ' + err.message));
    }
  };

  const deleteProject = (id) => remove(ref(db, `projects/${id}`)).then(() => messageApi.success('Proyek dihapus.'));
  
  const duplicateProject = (project) => {
    const duplicatedMasterData = {
      ...(project.masterData || BLANK_MASTER_DATA),
      namaPekerjaanSingkat: (project.masterData?.namaPekerjaanSingkat || '') + ' (Copy)',
      namaPekerjaan: (project.masterData?.namaPekerjaan || '') + ' (Copy)'
    };
    const payload = {
      masterData: duplicatedMasterData, pengurusData: project.pengurusData || BLANK_PENGURUS_DATA, pengalamanData: project.pengalamanData || [],
      headerImage: project.headerImage || null, pastedSPH: project.pastedSPH || '', autoMerge: project.autoMerge !== undefined ? project.autoMerge : true,
      fontFamily: project.fontFamily || 'Arial, sans-serif', fontSize: project.fontSize || 11, paperSize: project.paperSize || 'A4', tableHeaderColor: project.tableHeaderColor || '#f3f4f6', updatedAt: Date.now()
    };
    const newRef = push(ref(db, 'projects'));
    set(newRef, payload).then(() => messageApi.success('Proyek diduplikasi!')).catch(err => messageApi.error('Gagal menduplikasi: ' + err.message));
  };

  const handleTabChange = (tab) => { 
    setActiveTab(tab); 
    setTimeout(() => {
       let elementId = '';
       if (tab === 'master') elementId = 'page-master';
       if (tab === 'sph') elementId = 'page-sph';
       if (tab === 'pengalaman') elementId = 'page-pengalaman';
       
       if (elementId) {
          const el = document.getElementById(elementId);
          if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
       }
    }, 100);
  };

  const handleMasterDataChange = (e) => setMasterData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleAddPengurus = () => setPengurusData([...pengurusData, { id: Date.now(), jabatan: '_____', nama: '_____', noKtp: '_____', sahamPersen: '_____' }]);
  const handleRemovePengurus = (id) => setPengurusData(pengurusData.filter(item => item.id !== id));
  const handlePengurusChange = (id, field, value) => setPengurusData(pengurusData.map(item => item.id === id ? { ...item, [field]: value } : item));
  const handleAddPengalaman = () => setPengalamanData([...pengalamanData, { id: Date.now(), namaPaket: '_____', bidang: '_____', lokasi: '_____', pemberiNama: '_____', pemberiAlamat: '_____', kontrakNoTgl: '_____', kontrakNilai: '_____', selesaiKontrak: '_____', selesaiBAST: '_____' }]);
  const handleRemovePengalaman = (id) => setPengalamanData(pengalamanData.filter(item => item.id !== id));
  const handlePengalamanChange = (id, field, value) => setPengalamanData(pengalamanData.map(item => item.id === id ? { ...item, [field]: value } : item));
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader(); 
    reader.onload = (event) => { setHeaderImage(event.target.result); };
    reader.readAsDataURL(file); 
  };

  const uniquePTs = useMemo(() => { const pts = projects.map(p => p.masterData?.namaPenyedia).filter(Boolean); return ['All', ...new Set(pts)]; }, [projects]);
  const filteredProjects = useMemo(() => {
    return projects.filter(proj => {
      const ptMatch = filterPT === 'All' || proj.masterData?.namaPenyedia === filterPT;
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = !searchQuery || (proj.masterData?.namaPekerjaanSingkat || '').toLowerCase().includes(searchLower) || (proj.masterData?.namaPekerjaan || '').toLowerCase().includes(searchLower);
      return ptMatch && searchMatch;
    });
  }, [projects, filterPT, searchQuery]);

  const parseExcelPaste = (text) => {
    if (!text) return [];
    const rawRows = []; let currentRow = []; let currentCell = ''; let insideQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i]; const nextChar = text[i + 1];
      if (char === '"' && insideQuotes && nextChar === '"') { currentCell += '"'; i++; } 
      else if (char === '"') { insideQuotes = !insideQuotes; } 
      else if (char === '\t' && !insideQuotes) { currentRow.push(currentCell); currentCell = ''; } 
      else if (char === '\n' && !insideQuotes) { currentRow.push(currentCell); if (currentRow.some(c => c.trim() !== '')) rawRows.push(currentRow); currentRow = []; currentCell = ''; } 
      else { currentCell += char; }
    }
    if (currentCell !== '' || currentRow.length > 0) { currentRow.push(currentCell); if (currentRow.some(c => c.trim() !== '')) rawRows.push(currentRow); }
    if (rawRows.length === 0) return [];
    let maxCols = 0; rawRows.forEach(r => { if (r.length > maxCols) maxCols = r.length; });
    rawRows.forEach(r => { while (r.length < maxCols) r.push(''); });
    const colsToRemove = [];
    for (let c = 0; c < maxCols; c++) { let isEmpty = true; for (let r = 0; r < rawRows.length; r++) { if (rawRows[r][c] && rawRows[r][c].trim() !== '') { isEmpty = false; break; } } if (isEmpty) colsToRemove.push(c); }
    for (let i = colsToRemove.length - 1; i >= 0; i--) { const colIdx = colsToRemove[i]; rawRows.forEach(row => row.splice(colIdx, 1)); }
    return rawRows;
  };
  
  const processTableDataSPH = (pastedText) => {
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
  const headerDataSPH = useMemo(() => processTableDataSPH(pastedSPH), [pastedSPH, autoMerge]);

  // ==========================================
  // EXPORT HTML KHUSUS PRINT & OTOMATIS POP UP PRINT
  // ==========================================
  const downloadHTML = () => {
    const previewElement = document.getElementById('document-preview');
    if (!previewElement) {
        messageApi.error('Gagal menemukan dokumen untuk diunduh.');
        return;
    }

    messageApi.loading('Membuka dokumen untuk dicetak...', 1);
    
    setTimeout(() => {
        const printCssStyles = getPrintCSS();
        // Clone untuk membersihkan properti contentEditable saat di-print
        const clone = previewElement.cloneNode(true);
        const editables = clone.querySelectorAll('[contenteditable]');
        editables.forEach(el => el.removeAttribute('contenteditable'));

        const printContent = clone.innerHTML;

        const fullHtml = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Dokumen ${masterData.namaPekerjaanSingkat || 'Pengadaan'}</title>
            <style>
                body { background-color: white; margin: 0; padding: 0; font-family: ${fontFamily}; }
                ${printCssStyles}
            </style>
        </head>
        <body>
            ${printContent}
            <script>
                // Otomatis trigger Print / Save as PDF saat halaman selesai dimuat
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                };
            </script>
        </body>
        </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(fullHtml);
            printWindow.document.close();
            messageApi.success('Dokumen dibuka. Silakan Simpan sebagai PDF pada dialog cetak.');
        } else {
            messageApi.error('Gagal membuka tab. Pastikan fitur pop-up tidak diblokir oleh browser Anda.');
        }
    }, 300);
  };

  const getAlignmentClassRAB = (cell, cellIndex, isNumberingRow = false) => {
    if (isNumberingRow) return 'text-center align-middle font-bold bg-gray-100';
    if (!cell) return 'text-center align-middle';
    if (cellIndex === 0) return 'text-center align-middle'; 
    if (cellIndex === 1 || cellIndex === 2) return 'text-left align-middle'; 
    const isNominal = /(Rp)|(\d{1,3}\.\d{3})|(\d+,\d{2}$)/i.test(cell.trim());
    if (isNominal) return 'text-right align-middle';
    return 'text-center align-middle'; 
  };

  const isRomanNumeral = (str) => {
    if (!str) return false;
    const romanRegex = /^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX|XXI|XXII|XXIII|XXIV|XXV|XXVI|XXVII|XXVIII|XXIX|XXX)$/;
    return romanRegex.test(str.trim());
  };

  const checkIsNumberingRow = (row) => {
    if (row.length < 3) return false;
    const numberCount = row.filter(c => c.trim() !== '' && !isNaN(c.trim())).length;
    return numberCount > (row.length * 0.7);
  };

  const getAlignmentClassPengalaman = (cellIndex) => {
    if (cellIndex === 0) return 'text-center align-top'; 
    if (cellIndex === 7) return 'text-right align-top'; 
    if ([1, 2, 3, 4, 5].includes(cellIndex)) return 'text-left align-top'; 
    return 'text-center align-top'; 
  };

  const direkturNama = masterData.namaDirekturPenyedia || '';
  const direkturNik = masterData.nikDirekturPenyedia || '';
  const direkturJabatan = masterData.jabatanTujuanSPH === '_____'? 'Direktur' : 'Direktur';
  const penerimaSPH = masterData.jabatanTujuanSPH || 'Pejabat Pengadaan Barang/Jasa';
  const penerimaLainnya = masterData.jabatanTujuanLainnya || 'Pejabat Pembuat Komitmen';

  // ==========================================
  // RENDER DOKUMEN & TABEL VIEW
  // ==========================================
  const renderTableSPH = (headerData) => {
    if (!headerData.tr1 || headerData.tr1.length === 0) {
       return (
        <div contentEditable={false} suppressContentEditableWarning style={{ border: '2px dashed #d9d9d9', borderRadius: '8px', padding: '4rem', textAlign: 'center', color: '#8c8c8c', marginTop: '2.5rem' }} className="print-hidden">
          <TableIcon size={48} style={{ margin: '0 auto 16px', color: '#d9d9d9' }} />
          <p>Tabel SPH otomatis ter-<em>generate</em> di sini.<br/>Silakan paste data Excel di panel kiri.</p>
        </div>
       );
    }
    return (
      <div className="w-full mt-4" contentEditable={false} suppressContentEditableWarning>
        <table className="table-bordered text-xs" style={{ tableLayout: 'auto' }}>
          {headerData.hasMergedHeader ? (
            <thead className="bg-gray-100">
              <tr className="keep-together">
                {headerData.tr1.map((h, index) => {
                  const isNoCol = h.text?.trim().toUpperCase() === 'NO';
                  return (
                    <th key={`h1-${index}`} colSpan={h.colSpan} rowSpan={h.rowSpan} className="p-0 relative align-middle print-p-1" style={isNoCol ? { width: '1%', whiteSpace: 'nowrap' } : {}}>
                      {isNoCol ? (
                        <div className="px-2 py-2 flex items-center justify-center print-p-0"><span className="font-bold text-center">{h.text || '\u00A0'}</span></div>
                      ) : (
                        <div className="overflow-hidden px-2 py-2 flex items-center justify-center h-full print-p-0" style={{ minWidth: '50px'}}><span className="font-bold text-center">{h.text || '\u00A0'}</span></div>
                      )}
                    </th>
                  );
                })}
              </tr>
              {headerData.tr2.length > 0 && (
                <tr className="keep-together">
                  {headerData.tr2.map((h, index) => {
                    const isNoCol = h.text?.trim().toUpperCase() === 'NO';
                    return (
                      <th key={`h2-${index}`} colSpan={h.colSpan} rowSpan={h.rowSpan} className="p-0 relative align-middle print-p-1" style={isNoCol ? { width: '1%', whiteSpace: 'nowrap' } : {}}>
                        <div className={`overflow-hidden px-2 py-2 flex items-center justify-center h-full print-p-0`} style={{ minWidth: '50px'}}><span className="font-bold text-center">{h.text || '\u00A0'}</span></div>
                      </th>
                    );
                  })}
                </tr>
              )}
            </thead>
          ) : (
            <thead className="bg-gray-100">
              <tr className="keep-together">
                {headerData.tr1 && headerData.tr1.map((cell, index) => {
                  const isNoCol = cell?.trim().toUpperCase() === 'NO';
                  return (
                    <th key={`h-${index}`} className="p-0 relative align-middle print-p-1" style={isNoCol ? { width: '1%', whiteSpace: 'nowrap' } : {}}>
                      {isNoCol ? (
                        <div className="px-2 py-2 flex items-center justify-center print-p-0"><span className="font-bold text-center">{cell || '\u00A0'}</span></div>
                      ) : (
                        <div className="overflow-hidden px-2 py-2 flex items-center justify-center print-p-0" style={{ minWidth: '50px'}}><span className="font-bold text-center">{cell || '\u00A0'}</span></div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
          )}
          <tbody contentEditable={true} suppressContentEditableWarning>
            {headerData.body.map((row, rowIndex) => {
              const isTotalRow = row.some(cell => cell && cell.toUpperCase().includes('TOTAL KESELURUHAN'));
              const isBoldRow = isRomanNumeral(row[0]);
              const isNumberingRow = checkIsNumberingRow(row);

              if (isTotalRow) {
                const totalTextIndex = row.findIndex(c => c && c.toUpperCase().includes('TOTAL KESELURUHAN'));
                let totalValue = '';
                for (let i = row.length - 1; i > totalTextIndex; i--) {
                    if (row[i] && row[i].trim() !== '') { totalValue = row[i]; break; }
                }
                return (
                  <tr key={`tr-total-${rowIndex}`} className="bg-white keep-together font-bold">
                    <td colSpan={row.length - 1} className="px-2 py-2 text-center align-middle uppercase" style={{ fontWeight: 'bold' }}>TOTAL KESELURUHAN</td>
                    <td className="px-2 py-2 text-right align-middle whitespace-nowrap" style={{ fontWeight: 'bold' }}>{totalValue || '\u00A0'}</td>
                  </tr>
                );
              }

              return (
                <tr key={`tr-${rowIndex}`} className={`hover-bg-gray keep-together ${isBoldRow ? 'bg-white font-bold' : ''}`}>
                  {row.map((cell, cellIndex) => {
                    const isNoCol = cellIndex === 0;
                    return (
                      <td 
                        key={`td-${rowIndex}-${cellIndex}`} 
                        className={`py-1 px-2 break-words ${getAlignmentClassRAB(cell, cellIndex, isNumberingRow)} ${isNoCol ? 'whitespace-nowrap' : 'whitespace-pre-wrap'}`}
                        style={{ ...(isNoCol ? { width: '1%', whiteSpace: 'nowrap' } : {}), ...(isBoldRow || isNumberingRow ? { fontWeight: 'bold' } : {}) }}
                      >
                        {cell || '\u00A0'}
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

  const renderDokumenLegal = () => {
    return (
      <>
        {/* ================= SPH ================= */}
        <PaperPage id="page-master" paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage}>
          <div className="mb-8 text-base-pt leading-relaxed text-justify doc-body">
            
            <table contentEditable={false} suppressContentEditableWarning style={{ width: '100%', marginBottom: '1rem', borderCollapse: 'collapse', border: 'none', lineHeight: '1.15' }}>
              <tbody>
                <tr>
                  <td style={{ verticalAlign: 'top', border: 'none', padding: 0 }}>
                    <table className="table-doc" style={{ width: 'auto' }}>
                      <tbody>
                        <tr><td className="pr-4 align-top">Nomor</td><td className="align-top">: <V>{masterData.noSuratPenawaran}</V></td></tr>
                        <tr><td className="pr-4 align-top">Lampiran</td><td className="align-top">: 1 (satu) berkas</td></tr>
                        <tr><td className="pr-4 align-top">Hal</td><td className="align-top">: <span className="font-bold">Penawaran Harga</span></td></tr>
                      </tbody>
                    </table>
                  </td>
                  <td style={{ verticalAlign: 'top', textAlign: 'right', border: 'none', padding: 0 }}>
                    <V>{masterData.kotaSurat}</V>, <V>{masterData.tglSuratPenawaran}</V>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ lineHeight: '1.15', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0 }}>Kepada Yth.</p>
              <p style={{ margin: 0 }} className="font-bold"><V>{penerimaSPH}</V></p>
              {masterData.divisiInstansi && masterData.divisiInstansi !== '_____' && <p style={{ margin: 0 }} className="font-bold"><V>{masterData.divisiInstansi}</V></p>}
              <p style={{ margin: 0 }} className="font-bold"><V>{masterData.namaInstansi}</V></p>
              <p style={{ margin: 0 }}>Di Tempat</p>
            </div>

            <div style={{ lineHeight: '1.15', marginBottom: '1rem' }}>
              <p style={{ margin: 0, marginBottom: '4px' }}>Yang bertanda tangan dibawah ini:</p>
              <table contentEditable={false} suppressContentEditableWarning className="table-doc ml-4">
                <colgroup><col style={{width:'15%'}}/><col style={{width:'85%'}}/></colgroup>
                <tbody>
                  <tr><td className="pr-10 align-top">Nama</td><td className="align-top">: <span className="font-bold"><V>{direkturNama}</V></span></td></tr>
                  <tr><td className="pr-10 align-top">Jabatan</td><td className="align-top">: <V>{direkturJabatan}</V></td></tr>
                </tbody>
              </table>
            </div>

            <p className="indent-8 mb-2">
              Setelah membaca, meneliti, memahami semua syarat tentang, Pekerjaan <span className="font-bold"><V>{formatTitleCase(masterData.namaPekerjaan)}</V></span>, dengan ini menyatakan bersedia mengikuti semua syarat-syarat dan ketentuan tersebut untuk melaksanakan pekerjaan dimaksud.
            </p>
            <p className="indent-8 mb-2">
              Adapun penawaran yang kami ajukan harga keseluruhan (lumpsum) sebesar : <span className="font-bold"><V>{masterData.nilaiSPH}</V></span> Terbilang : <span className="italic">(<V>{formatTerbilang(masterData.nilaiSPH)}</V>)</span> Dengan rincian dan spesifikasi terlampir.
            </p>
            <p className="indent-8 mb-2">
              Harga penawaran kami tersebut sudah mencakup semua pajak dan bea meterai yang perlu dibayar sesuai dengan ketentuan yang berlaku, sehubungan dengan pelaksanaan pekerjaan tersebut, kami akan sanggup menyelesaikan pelaksanaan seluruh pekerjaan tersebut dalam waktu <V>{masterData.waktuPenyelesaian}</V> hari kalender berturut-turut sesuai dengan jadwal kerja dalam Surat Perjanjian/Kontrak. 
            </p>
            <p className="indent-8 mb-6">
              Surat Penawaran ini berlaku dan mengikat selama 30 (Tiga Puluh) hari kerja berturut-turut sejak tanggal pembukaan dokumen penawaran.
            </p>
            <p className="mb-8">Demikianlah Surat Penawaran Harga ini kami sampaikan, atas perhatiannya kami ucapkan terima kasih.</p>

            <SignatureBlock align="right" greeting="Hormat kami," company={masterData.namaPenyedia} name={direkturNama} title={direkturJabatan} />
          </div>
        </PaperPage>

        {/* ================= LAMPIRAN SPH / TABEL SPH ================= */}
        <PaperPage id="page-sph" paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage}>
          <div className="mb-8 text-base-pt leading-relaxed text-justify doc-body">
            <div contentEditable={false} suppressContentEditableWarning style={{ lineHeight: '1.15', marginBottom: '1.5rem' }}>
                <table className="table-doc">
                <tbody>
                    <tr><td className="pr-4 align-top grid-col-auto">Lampiran</td><td className="align-top grid-col-auto">: Surat Penawaran Harga</td></tr>
                    <tr><td className="pr-4 align-top grid-col-auto">Nomor</td><td className="align-top grid-col-auto">: <V>{masterData.noSuratPenawaran}</V></td></tr>
                </tbody>
                </table>
            </div>

            {/* Judul tabel dan nama pekerjaan dihapus sesuai request */}

            <div className="mb-4">{renderTableSPH(headerDataSPH)}</div>

            <p className="mb-8 italic text-sm">Terbilang : <V>{formatTerbilang(masterData.nilaiSPH)}</V></p>

            <SignatureBlock align="right" greeting="Hormat kami," company={masterData.namaPenyedia} name={direkturNama} title={direkturJabatan} />
          </div>
        </PaperPage>

        {/* ================= PAKTA INTEGRITAS ================= */}
        <PaperPage paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage}>
          <div className="mb-8 text-base-pt leading-relaxed text-justify doc-body">
            <div className="text-center">
              <h3 className="text-lg font-bold underline mb-4">PAKTA INTEGRITAS</h3>
            </div>
            
            <div style={{ lineHeight: '1.15', marginBottom: '1rem' }}>
              <p style={{ margin: 0, marginBottom: '4px' }}>Saya yang bertanda tangan di bawah ini:</p>
              <table contentEditable={false} suppressContentEditableWarning className="table-doc w-full">
                <colgroup><col className="grid-col-35"/><col className="grid-col-2"/><col className="grid-col-63"/></colgroup>
                <tbody>
                  <tr><td className="align-top">Nama</td><td className="align-top">:</td><td className="align-top font-bold"><V>{direkturNama}</V></td></tr>
                  <tr><td className="align-top">No. Identitas</td><td className="align-top">:</td><td className="align-top"><V>{direkturNik}</V></td></tr>
                  <tr><td className="align-top">Jabatan</td><td className="align-top">:</td><td className="align-top"><V>{direkturJabatan}</V></td></tr>
                  <tr><td className="align-top">Bertindak untuk dan atas nama</td><td className="align-top">:</td><td className="align-top font-bold"><V>{masterData.namaPenyedia}</V></td></tr>
                  <tr><td className="align-top">Alamat</td><td className="align-top">:</td><td className="align-top"><V>{masterData.alamatPenyedia}</V></td></tr>
                </tbody>
              </table>
            </div>

            <p className="mb-2">Dalam rangka <span className="font-bold"><V>{formatTitleCase(masterData.namaPekerjaan)}</V></span>, dengan ini menyatakan bahwa:</p>
            <ol className="list-dec">
              <li>Tidak akan melakukan praktek Korupsi, Kolusi dan Nepotisme (KKN);</li>
              <li>Akan melaporkan kepada APIP <V>{masterData.namaInstansi}</V> dan/atau LKPP apabila mengetahui ada indikasi KKN di dalam proses pengadaan ini;</li>
              <li>Akan mengikuti proses pengadaan secara bersih, transparan, dan profesional untuk memberikan hasil kerja terbaik sesuai ketentuan peraturan perundang-undangan;</li>
              <li>Apabila melanggar hal-hal yang dinyatakan dalam PAKTA INTEGRITAS ini, bersedia menerima sanksi administratif, menerima sanksi pencantuman dalam Daftar Hitam, digugat secara perdata dan/atau dilaporkan secara pidana.</li>
            </ol>

            <p className="mb-8">Demikian pernyataan ini kami buat atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>

            <SignatureBlock align="right" greeting={<><V>{masterData.kotaSurat}</V>, <V>{masterData.tglSuratPenawaran}</V></>} company={masterData.namaPenyedia} name={direkturNama} title={direkturJabatan} />
          </div>
        </PaperPage>

        {/* ================= SURAT PERNYATAAN KEBENARAN DOKUMEN ================= */}
        <PaperPage paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage}>
          <div className="mb-8 text-base-pt leading-relaxed text-justify doc-body">
            <div className="text-center">
              <h3 className="text-lg font-bold underline mb-4">SURAT PERNYATAAN KEBENARAN DOKUMEN PERUSAHAAN</h3>
            </div>
            
            <div style={{ lineHeight: '1.15', marginBottom: '1rem' }}>
              <p style={{ margin: 0, marginBottom: '4px' }}>Yang bertanda tangan di bawah ini:</p>
              <table contentEditable={false} suppressContentEditableWarning className="table-doc w-full">
                <colgroup><col className="grid-col-35"/><col className="grid-col-2"/><col className="grid-col-63"/></colgroup>
                <tbody>
                  <tr><td className="align-top">Nama</td><td className="align-top">:</td><td className="align-top font-bold"><V>{direkturNama}</V></td></tr>
                  <tr><td className="align-top">No. Identitas</td><td className="align-top">:</td><td className="align-top"><V>{direkturNik}</V></td></tr>
                  <tr><td className="align-top">Jabatan</td><td className="align-top">:</td><td className="align-top"><V>{direkturJabatan}</V></td></tr>
                  <tr><td className="align-top">Bertindak untuk dan atas nama</td><td className="align-top">:</td><td className="align-top font-bold"><V>{masterData.namaPenyedia}</V></td></tr>
                  <tr><td className="align-top">Alamat</td><td className="align-top">:</td><td className="align-top"><V>{masterData.alamatPenyedia}</V></td></tr>
                </tbody>
              </table>
            </div>

            <p className="mb-2">Menyatakan dengan sebenarnya bahwa :</p>
            <ol className="list-dec">
              <li>Saya Secara hukum bertindak untuk atas nama Perusahaan <V>{masterData.namaPenyedia}</V> berdasarkan Akta Notaris Nomor : <V>{masterData.noAktaPendirian}</V> Tanggal <V>{masterData.tglAktaPendirian}</V> Notaris : <V>{masterData.aktaPendirian}</V>.</li>
              <li>Data-data perusahaan yang terlampir adalah benar semua dan masih berlaku;</li>
              <li>Apabila dikemudian hari ditemui bahwa data-data yang kami berikan tidak benar, maka saya bersedia dikenai sanksi moral, sanksi administrasi dan bersedia mempertanggungjawabkan secara hukum.</li>
            </ol>

            <p className="mb-8">Demikian pernyataan ini kami buat atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>

            <SignatureBlock align="right" greeting={<><V>{masterData.kotaSurat}</V>, <V>{masterData.tglSuratPenawaran}</V></>} company={masterData.namaPenyedia} name={direkturNama} title={direkturJabatan} />
          </div>
        </PaperPage>

        {/* ================= SURAT PERNYATAAN TIDAK DALAM PENGAWASAN PENGADILAN ================= */}
        <PaperPage paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage}>
          <div className="mb-8 text-base-pt leading-relaxed text-justify doc-body">
            <div className="text-center">
              <h3 className="text-lg font-bold mb-4">SURAT PERNYATAAN TIDAK DALAM PENGAWASAN PENGADILAN<br/>DAN TIDAK MASUK DALAM DAFTAR HITAM</h3>
            </div>
            
            <div style={{ lineHeight: '1.15', marginBottom: '1rem' }}>
              <p style={{ margin: 0, marginBottom: '4px' }}>Yang bertanda tangan di bawah ini:</p>
              <table contentEditable={false} suppressContentEditableWarning className="table-doc w-full">
                <colgroup><col className="grid-col-35"/><col className="grid-col-2"/><col className="grid-col-63"/></colgroup>
                <tbody>
                  <tr><td className="align-top">Nama</td><td className="align-top">:</td><td className="align-top font-bold"><V>{direkturNama}</V></td></tr>
                  <tr><td className="align-top">No. Identitas</td><td className="align-top">:</td><td className="align-top"><V>{direkturNik}</V></td></tr>
                  <tr><td className="align-top">Jabatan</td><td className="align-top">:</td><td className="align-top"><V>{direkturJabatan}</V></td></tr>
                  <tr><td className="align-top">Bertindak untuk dan atas nama</td><td className="align-top">:</td><td className="align-top font-bold"><V>{masterData.namaPenyedia}</V></td></tr>
                  <tr><td className="align-top">Alamat</td><td className="align-top">:</td><td className="align-top"><V>{masterData.alamatPenyedia}</V></td></tr>
                </tbody>
              </table>
            </div>

            <p className="mb-2">Menyatakan dengan sebenarnya bahwa :</p>
            <ol className="list-dec">
              <li>Perusahaan yang bersangkutan dan managemenya tidak dalam pengawasan pengadilan;</li>
              <li>Perusahaan tidak bangkrut dan tidak sedang dihentikan usahanya;</li>
              <li>Semua pengurus dan badan usahanya tidak masuk dalam daftar hitam.</li>
            </ol>

            <p className="mb-8">Demikian pernyataan ini kami buat atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>

            <SignatureBlock align="right" greeting={<><V>{masterData.kotaSurat}</V>, <V>{masterData.tglSuratPenawaran}</V></>} company={masterData.namaPenyedia} name={direkturNama} title={direkturJabatan} />
          </div>
        </PaperPage>

        {/* ================= SURAT PERNYATAAN MINAT ================= */}
        <PaperPage paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage}>
          <div className="mb-8 text-base-pt leading-relaxed text-justify doc-body">
            <div className="text-center">
              <h3 className="text-lg font-bold underline mb-4">SURAT PERNYATAAN MINAT</h3>
            </div>
            
            <div style={{ lineHeight: '1.15', marginBottom: '1rem' }}>
              <p style={{ margin: 0, marginBottom: '4px' }}>Yang bertanda tangan di bawah ini:</p>
              <table contentEditable={false} suppressContentEditableWarning className="table-doc w-full">
                <colgroup><col className="grid-col-35"/><col className="grid-col-2"/><col className="grid-col-63"/></colgroup>
                <tbody>
                  <tr><td className="align-top">Nama</td><td className="align-top">:</td><td className="align-top font-bold"><V>{direkturNama}</V></td></tr>
                  <tr><td className="align-top">No. Identitas</td><td className="align-top">:</td><td className="align-top"><V>{direkturNik}</V></td></tr>
                  <tr><td className="align-top">Jabatan</td><td className="align-top">:</td><td className="align-top"><V>{direkturJabatan}</V></td></tr>
                  <tr><td className="align-top">Bertindak untuk dan atas nama</td><td className="align-top">:</td><td className="align-top font-bold"><V>{masterData.namaPenyedia}</V></td></tr>
                  <tr><td className="align-top">Alamat</td><td className="align-top">:</td><td className="align-top"><V>{masterData.alamatPenyedia}</V></td></tr>
                </tbody>
              </table>
            </div>

            <p className="indent-8 mb-6">
              Menyatakan dengan sebenarnya bahwa setelah memahami semua syarat dan penjelasan Pengadaan langsung yang dilaksanakan <V>{penerimaSPH}</V> <V>{masterData.namaInstansi}</V> Tahun <V>{masterData.tahunAnggaran}</V>, maka dengan ini saya menyatakan berminat untuk mengikuti proses <span className="font-bold"><V>{formatTitleCase(masterData.namaPekerjaan)}</V></span> sampai selesai.
            </p>

            <p className="mb-8">Demikian pernyataan ini kami buat dengan penuh kesadaran dan rasa tanggung jawab.</p>

            <SignatureBlock align="right" greeting={<><V>{masterData.kotaSurat}</V>, <V>{masterData.tglSuratPenawaran}</V></>} company={masterData.namaPenyedia} name={direkturNama} title={direkturJabatan} />
          </div>
        </PaperPage>

        {/* ================= FORMULIR ISIAN KUALIFIKASI ================= */}
        <PaperPage id="page-pengalaman" paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage}>
          <div className="mb-8 text-base-pt leading-relaxed text-justify doc-body">
            <div className="text-center">
              <h3 className="text-lg font-bold underline mb-4">FORMULIR ISIAN KUALIFIKASI</h3>
            </div>
            
            <div style={{ lineHeight: '1.15', marginBottom: '1rem' }}>
              <p style={{ margin: 0, marginBottom: '4px' }}>Saya yang bertandatangan di bawah ini :</p>
              <table contentEditable={false} suppressContentEditableWarning className="table-doc w-full">
                <colgroup><col className="grid-col-35"/><col className="grid-col-2"/><col className="grid-col-63"/></colgroup>
                <tbody>
                  <tr><td className="align-top">Nama</td><td className="align-top">:</td><td className="align-top font-bold"><V>{direkturNama}</V></td></tr>
                  <tr><td className="align-top">No. Identitas</td><td className="align-top">:</td><td className="align-top"><V>{direkturNik}</V></td></tr>
                  <tr><td className="align-top">Jabatan</td><td className="align-top">:</td><td className="align-top"><V>{direkturJabatan}</V></td></tr>
                  <tr><td className="align-top">Bertindak untuk dan atas nama</td><td className="align-top">:</td><td className="align-top font-bold"><V>{masterData.namaPenyedia}</V></td></tr>
                  <tr><td className="align-top">Alamat</td><td className="align-top">:</td><td className="align-top"><V>{masterData.alamatPenyedia}</V></td></tr>
                  <tr><td className="align-top">Nomor Telepon</td><td className="align-top">:</td><td className="align-top"><V>{masterData.noHpPenyedia}</V></td></tr>
                  <tr><td className="align-top">Email Perusahaan</td><td className="align-top">:</td><td className="align-top"><V>{masterData.emailPenyedia}</V></td></tr>
                </tbody>
              </table>
            </div>

            <p className="mb-2">Menyatakan dengan sesungguhnya bahwa:</p>
            <ol className="list-dec">
              <li>Saya secara hukum bertindak untuk dan atas nama perusahaan berdasarkan Akta Pendirian Perseroan Terbatas <V>{masterData.namaPenyedia}</V> berdasarkan Akta Notaris Nomor : <V>{masterData.noAktaPendirian}</V> Tanggal <V>{masterData.tglAktaPendirian}</V> Notaris : <V>{masterData.aktaPendirian}</V>.</li>
              <li>Saya bukan sebagai pegawai Negeri/Sipil/ BUMD/TNI/PolriK/L/D/I (bagi pegawai K/L/D/I yang sedang cuti di luar tanggungan K/L/D/I”), Saya tidak sedang menjalani sanksi pidana;</li>
              <li>Saya tidak sedang dan tidak akan terlibat pertentangan kepentingan dengan para pihak yang terkait, langsung maupun tidak langsung dalam proses pengadaan ini;</li>
              <li>Badan usaha yang saya wakili tidak masuk dalam Daftar Hitam, tidak dalam pengawasan pengadilan, tidak pailit dan kegiatan usahanya tidak sedang dihentikan;</li>
              <li>Salah satu dan/atau semua pengurus badan usaha yang saya wakili tidak masuk dalam Daftar Hitam;</li>
              <li>Data-data badan usaha yang saya wakili adalah sebagai berikut:</li>
            </ol>

            <div contentEditable={false} suppressContentEditableWarning>
                <p className="font-bold mb-2">A. Data Administrasi</p>
                <table className="table-doc w-full ml-4 mb-6">
                <colgroup><col style={{width:'5%'}}/><col className="grid-col-38"/><col className="grid-col-2"/><col className="grid-col-55"/></colgroup>
                <tbody>
                    <tr><td className="align-top">1.</td><td className="align-top">Nama Badan Usaha</td><td className="align-top">:</td><td className="align-top"><V>{masterData.namaPenyedia}</V></td></tr>
                    <tr><td className="align-top">2.</td><td className="align-top">Status</td><td className="align-top">:</td><td className="align-top">√ Pusat &nbsp;&nbsp;&nbsp;&nbsp; Cabang</td></tr>
                    <tr><td className="align-top">3.</td><td className="align-top">Alamat Kantor Pusat</td><td className="align-top">:</td><td className="align-top"><V>{masterData.alamatPenyedia}</V></td></tr>
                    <tr><td className="align-top"></td><td className="align-top ml-4">No. Telepon</td><td className="align-top">:</td><td className="align-top"><V>{masterData.noHpPenyedia}</V></td></tr>
                    <tr><td className="align-top"></td><td className="align-top ml-4">No. Fax</td><td className="align-top">:</td><td className="align-top"><V>{masterData.tlpFax}</V></td></tr>
                    <tr><td className="align-top"></td><td className="align-top ml-4">E-Mail</td><td className="align-top">:</td><td className="align-top"><V>{masterData.emailPenyedia}</V></td></tr>
                    <tr><td className="align-top">4.</td><td className="align-top">Alamat Cabang</td><td className="align-top">:</td><td className="align-top">-</td></tr>
                </tbody>
                </table>

                <p className="font-bold mb-2">B. Izin Usaha</p>
                <table className="table-doc w-full ml-4 mb-6">
                <colgroup><col style={{width:'5%'}}/><col className="grid-col-38"/><col className="grid-col-2"/><col className="grid-col-55"/></colgroup>
                <tbody>
                    <tr><td className="align-top">1.</td><td className="align-top">Nomor Induk Berusaha</td><td className="align-top">:</td><td className="align-top"><V>{masterData.izinUsaha}</V> Tanggal <V>{masterData.tglIzinUsaha}</V></td></tr>
                    <tr><td className="align-top">2.</td><td className="align-top">Masa berlaku izin usaha</td><td className="align-top">:</td><td className="align-top"><V>{masterData.masaBerlakuIzin}</V></td></tr>
                    <tr><td className="align-top">3.</td><td className="align-top">Instansi pemberi izin usaha</td><td className="align-top">:</td><td className="align-top"><V>{masterData.pemberiIzin}</V></td></tr>
                    <tr><td className="align-top">4.</td><td className="align-top">Kualifikasi Usaha</td><td className="align-top">:</td><td className="align-top"><V>{masterData.kualifikasiUsaha || 'Kecil'}</V></td></tr>
                </tbody>
                </table>

                <p className="font-bold mb-2">C. Izin Lainnya</p>
                <table className="table-doc w-full ml-4 mb-6">
                <colgroup><col style={{width:'5%'}}/><col className="grid-col-38"/><col className="grid-col-2"/><col className="grid-col-55"/></colgroup>
                <tbody>
                    <tr><td className="align-top">1.</td><td className="align-top">No. Surat Izin</td><td className="align-top">:</td><td className="align-top">-</td></tr>
                    <tr><td className="align-top">2.</td><td className="align-top">Masa berlaku izin</td><td className="align-top">:</td><td className="align-top">-</td></tr>
                    <tr><td className="align-top">3.</td><td className="align-top">Instansi pemberi izin</td><td className="align-top">:</td><td className="align-top">-</td></tr>
                </tbody>
                </table>

                <p className="font-bold mb-2">D. Landasan Hukum Pendirian Badan Usaha</p>
                <table className="table-doc w-full ml-4 mb-6 keep-together">
                <colgroup><col style={{width:'5%'}}/><col className="grid-col-45"/><col className="grid-col-2"/><col className="grid-col-48"/></colgroup>
                <tbody>
                    <tr><td className="align-top">1.</td><td className="align-top font-bold" colSpan={3}>Akta Pendirian Perusahaan</td></tr>
                    <tr><td className="align-top"></td><td className="align-top ml-4">a. Nomor</td><td className="align-top">:</td><td className="align-top"><V>{masterData.noAktaPendirian}</V></td></tr>
                    <tr><td className="align-top"></td><td className="align-top ml-4">b. Tanggal</td><td className="align-top">:</td><td className="align-top"><V>{masterData.tglAktaPendirian}</V></td></tr>
                    <tr><td className="align-top"></td><td className="align-top ml-4">c. Nama Notaris</td><td className="align-top">:</td><td className="align-top"><V>{masterData.aktaPendirian}</V></td></tr>
                    <tr><td className="align-top"></td><td className="align-top ml-4">d. Nomor Pengesahan Kemenkumham</td><td className="align-top">:</td><td className="align-top"><V>{masterData.noMenkumham}</V></td></tr>
                    
                    <tr><td className="align-top" style={{ paddingTop: '10px' }}>2.</td><td className="align-top font-bold" colSpan={3} style={{ paddingTop: '10px' }}>Akta Perubahan Terakhir</td></tr>
                    <tr><td className="align-top"></td><td className="align-top ml-4">a. Nomor</td><td className="align-top">:</td><td className="align-top"><V>{masterData.noAktaPerubahan || '-'}</V></td></tr>
                    <tr><td className="align-top"></td><td className="align-top ml-4">b. Tanggal</td><td className="align-top">:</td><td className="align-top"><V>{masterData.tglAktaPerubahan || '-'}</V></td></tr>
                    <tr><td className="align-top"></td><td className="align-top ml-4">c. Nama Notaris</td><td className="align-top">:</td><td className="align-top"><V>{masterData.aktaPerubahan || '-'}</V></td></tr>
                    <tr><td className="align-top"></td><td className="align-top ml-4">d. Nomor Pengesahan Kemenkumham</td><td className="align-top">:</td><td className="align-top"><V>{masterData.noMenkumhamPerubahan || '-'}</V></td></tr>
                </tbody>
                </table>

                <p className="font-bold mb-2">E. Pengurus Badan Usaha</p>
                <table className="table-bordered ml-4 mb-4 keep-together" style={{ width: '90%' }}>
                <thead className="bg-gray-100">
                    <tr>
                    <th className="p-2 text-center" style={{width:'5%'}}>No</th>
                    <th className="p-2 text-center" style={{width:'40%'}}>Nama</th>
                    <th className="p-2 text-center" style={{width:'25%'}}>No. Identitas</th>
                    <th className="p-2 text-center" style={{width:'30%'}}>Jabatan</th>
                    </tr>
                </thead>
                <tbody>
                    {pengurusData.map((p, i) => (
                    <tr key={i}>
                        <td className="p-2 text-center">{i+1}</td>
                        <td className="p-2 text-center"><V>{p.nama}</V></td>
                        <td className="p-2 text-center"><V>{p.noKtp}</V></td>
                        <td className="p-2 text-center"><V>{p.jabatan}</V></td>
                    </tr>
                    ))}
                </tbody>
                </table>

                <table className="table-bordered ml-4 mb-6 keep-together" style={{ width: '90%' }}>
                <thead className="bg-gray-100">
                    <tr>
                    <th className="p-2 text-center" style={{width:'5%'}}>No</th>
                    <th className="p-2 text-center" style={{width:'40%'}}>Nama</th>
                    <th className="p-2 text-center" style={{width:'25%'}}>No. Identitas</th>
                    <th className="p-2 text-center" style={{width:'30%'}}>Saham</th>
                    </tr>
                </thead>
                <tbody>
                    {pengurusData.map((p, i) => (
                    <tr key={i}>
                        <td className="p-2 text-center">{i+1}</td>
                        <td className="p-2 text-center"><V>{p.nama}</V></td>
                        <td className="p-2 text-center"><V>{p.noKtp}</V></td>
                        <td className="p-2 text-center"><V>{p.sahamPersen}</V></td>
                    </tr>
                    ))}
                </tbody>
                </table>

                <p className="font-bold mb-2">F. Data Keuangan</p>
                <p className="ml-4 mb-1">1. Pajak</p>
                <table className="table-doc w-full ml-8 mb-6 keep-together">
                <colgroup><col style={{width:'5%'}}/><col className="grid-col-40"/><col className="grid-col-2"/><col className="grid-col-53"/></colgroup>
                <tbody>
                    <tr><td className="align-top">a.</td><td className="align-top">Nomor Pokok Wajib Pajak</td><td className="align-top">:</td><td className="align-top"><V>{masterData.npwpPenyedia}</V></td></tr>
                    <tr><td className="align-top">b.</td><td className="align-top">Bukti Laporan Pajak Tahun Terakhir</td><td className="align-top">:</td><td className="align-top"><V>{masterData.laporanPajak}</V></td></tr>
                    <tr><td className="align-top">c.</td><td className="align-top">Surat Keterangan Fiskal</td><td className="align-top">:</td><td className="align-top">-</td></tr>
                </tbody>
                </table>

                <p className="font-bold mb-2 uppercase">G. Pengalaman Pekerjaan</p>
                <div className="w-full mb-6 text-xs">
                <table className="table-bordered table-fixed break-words">
                    <colgroup><col style={{ width: '3%' }}/><col className="grid-col-28"/><col className="grid-col-10"/><col className="grid-col-7"/><col className="grid-col-11"/><col className="grid-col-11"/><col className="grid-col-10"/><col className="grid-col-8"/><col className="grid-col-6"/><col className="grid-col-6"/></colgroup>
                    <thead className="bg-gray-100">
                    <tr className="keep-together">
                        <th rowSpan={2} className="p-1 text-center align-middle">No</th>
                        <th rowSpan={2} className="p-1 text-center align-middle">Nama Paket Pekerjaan</th>
                        <th rowSpan={2} className="p-1 text-center align-middle">Bidang/Sub Bidang</th>
                        <th rowSpan={2} className="p-1 text-center align-middle">Lokasi</th>
                        <th colSpan={2} className="p-1 text-center align-middle">Pemberi Tugas</th>
                        <th colSpan={2} className="p-1 text-center align-middle">Kontrak</th>
                        <th colSpan={2} className="p-1 text-center align-middle">Tgl Selesai:</th>
                    </tr>
                    <tr className="keep-together">
                        <th className="p-1 text-center align-middle">Nama</th>
                        <th className="p-1 text-center align-middle">Alamat/Tlp</th>
                        <th className="p-1 text-center align-middle">No/Tgl</th>
                        <th className="p-1 text-center align-middle">Nilai</th>
                        <th className="p-1 text-center align-middle">Kontrak</th>
                        <th className="p-1 text-center align-middle">BAST</th>
                    </tr>
                    </thead>
                    <tbody>
                    {pengalamanData.map((row, i) => (
                        <tr key={row.id} className="keep-together hover-bg-gray">
                        <td className="p-1 text-center align-top">{i+1}</td>
                        <td className="p-1 align-top"><V>{row.namaPaket}</V></td>
                        <td className="p-1 align-top"><V>{row.bidang}</V></td>
                        <td className="p-1 align-top"><V>{row.lokasi}</V></td>
                        <td className="p-1 align-top"><V>{row.pemberiNama}</V></td>
                        <td className="p-1 align-top"><V>{row.pemberiAlamat}</V></td>
                        <td className="p-1 text-center align-top"><V>{row.kontrakNoTgl}</V></td>
                        <td className="p-1 text-right align-top"><V>{row.kontrakNilai}</V></td>
                        <td className="p-1 text-center align-top"><V>{row.selesaiKontrak}</V></td>
                        <td className="p-1 text-center align-top"><V>{row.selesaiBAST}</V></td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            </div>

            <p className="mb-8 text-justify">
              Demikian Formulir Isian Kualifikasi ini saya buat dengan sebenarnya dan penuh rasa tanggung jawab. Jika dikemudian hari ditemui bahwa data/dokumen yang saya sampaikan tidak benar dan ada pemalsuan, maka saya dan badan usaha yang saya wakili bersedia dikenakan sanksi berupa sanksi administratif, sanksi pencantuman dalam Daftar Hitam, gugatan secara perdata, dan/atau pelaporan secara pidana kepada pihak berwenang sesuai dengan ketentuan peraturan perundang-undangan.
            </p>

            <SignatureBlock align="right" greeting={<><V>{masterData.kotaSurat}</V>, <V>{masterData.tglSuratPenawaran}</V></>} company={masterData.namaPenyedia} name={direkturNama} title={direkturJabatan} />
          </div>
        </PaperPage>

        {/* ================= SURAT PERMOHONAN SERAH TERIMA ================= */}
        <PaperPage paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage}>
          <div className="mb-8 text-base-pt leading-relaxed text-justify doc-body">
            
            <table contentEditable={false} suppressContentEditableWarning style={{ width: '100%', marginBottom: '1.5rem', borderCollapse: 'collapse', border: 'none', lineHeight: '1.15' }}>
              <tbody>
                <tr>
                  <td style={{ verticalAlign: 'top', border: 'none', padding: 0 }}>
                    <table className="table-doc" style={{ width: 'auto' }}>
                      <tbody>
                        <tr><td className="pr-4 align-top">Nomor</td><td className="align-top">: <V>{masterData.noSuratPemeriksaan}</V></td></tr>
                        <tr><td className="pr-4 align-top">Perihal</td><td className="align-top">: Permohonan Serah Terima Pekerjaan</td></tr>
                        <tr><td className="pr-4 align-top">Lampiran</td><td className="align-top">: 1 (Satu) Berkas</td></tr>
                      </tbody>
                    </table>
                  </td>
                  <td style={{ verticalAlign: 'top', textAlign: 'right', border: 'none', padding: 0 }}>
                    <V>{masterData.kotaSurat}</V>, <V>{masterData.tglSuratPemeriksaan}</V>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ lineHeight: '1.15', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0 }}>Kepada Yth,</p>
              <p style={{ margin: 0 }} className="font-bold"><V>{penerimaLainnya}</V></p>
              {masterData.divisiInstansi && masterData.divisiInstansi !== '_____' && <p style={{ margin: 0 }} className="font-bold"><V>{masterData.divisiInstansi}</V></p>}
              <p style={{ margin: 0 }} className="font-bold"><V>{masterData.namaInstansi}</V></p>
              <p style={{ margin: 0 }}>Di Tempat</p>
            </div>

            <div contentEditable={false} suppressContentEditableWarning style={{ lineHeight: '1.15', marginBottom: '1rem' }}>
                <table className="table-doc w-full">
                <colgroup><col style={{width:'15%'}}/><col className="grid-col-2"/><col style={{width:'83%'}}/></colgroup>
                <tbody>
                    <tr><td className="align-top">Perihal</td><td className="align-top">:</td><td className="align-top font-bold"><V>{formatTitleCase(masterData.namaPekerjaan)}</V></td></tr>
                </tbody>
                </table>
            </div>

            <p className="indent-8 mb-2">
              Sehubungan dengan telah selesai Pekerjaan <span className="font-bold"><V>{formatTitleCase(masterData.namaPekerjaan)}</V></span> dengan Surat Perintah Kerja (SPK) Nomor : <V>{masterData.noSPK}</V> Tanggal <V>{masterData.tglSPK}</V>
            </p>

            <p className="indent-8 mb-6">
              Mohon Kiranya <V>{penerimaLainnya}</V> {masterData.divisiInstansi && masterData.divisiInstansi !== '_____' ? <V>{masterData.divisiInstansi + ' '}</V> : ''}<V>{masterData.namaInstansi}</V> untuk melakukan Serah Terima Pekerjaan <span className="font-bold"><V>{formatTitleCase(masterData.namaPekerjaan)}</V></span>.
            </p>

            <p className="mb-8">Demikian Surat Permohonan ini kami buat atas perhatian dan kerjasamanya, kami ucapkan terima kasih.</p>

            <SignatureBlock align="right" greeting="Hormat Kami," company={masterData.namaPenyedia} name={direkturNama} title={direkturJabatan} />
          </div>
        </PaperPage>

        {/* ================= SURAT PERMOHONAN PEMBAYARAN ================= */}
        <PaperPage paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage}>
          <div className="mb-8 text-base-pt leading-relaxed text-justify doc-body">
            
            <table contentEditable={false} suppressContentEditableWarning style={{ width: '100%', marginBottom: '1.5rem', borderCollapse: 'collapse', border: 'none', lineHeight: '1.15' }}>
              <tbody>
                <tr>
                  <td style={{ verticalAlign: 'top', border: 'none', padding: 0 }}>
                    <table className="table-doc" style={{ width: 'auto' }}>
                      <tbody>
                        <tr><td className="pr-4 align-top">Nomor</td><td className="align-top">: <V>{masterData.noSuratPembayaran}</V></td></tr>
                        <tr><td className="pr-4 align-top">Perihal</td><td className="align-top">: Permohonan Pembayaran Pekerjaan</td></tr>
                        <tr><td className="pr-4 align-top">Lampiran</td><td className="align-top">: 1 (Satu) Berkas</td></tr>
                      </tbody>
                    </table>
                  </td>
                  <td style={{ verticalAlign: 'top', textAlign: 'right', border: 'none', padding: 0 }}>
                    <V>{masterData.kotaSurat}</V>, <V>{masterData.tglSuratPembayaran}</V>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ lineHeight: '1.15', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0 }}>Kepada Yth,</p>
              <p style={{ margin: 0 }} className="font-bold"><V>{penerimaLainnya}</V></p>
              {masterData.divisiInstansi && masterData.divisiInstansi !== '_____' && <p style={{ margin: 0 }} className="font-bold"><V>{masterData.divisiInstansi}</V></p>}
              <p style={{ margin: 0 }} className="font-bold"><V>{masterData.namaInstansi}</V></p>
              <p style={{ margin: 0 }}>Di Tempat</p>
            </div>

            <p className="mb-2">Dengan hormat,</p>
            <p className="indent-8 mb-2">
              Sehubungan dengan <span className="font-bold"><V>{formatTitleCase(masterData.namaPekerjaan)}</V></span>. Maka dengan ini kami mengajukan permohonan pembayaran pelunasan pekerjaan 100%, sebesar <span className="font-bold"><V>{masterData.nilaiSPK}</V> <span className="italic">(<V>{formatTerbilang(masterData.nilaiSPK)}</V>)</span></span> , biaya tersebut sudah termasuk pajak-pajak.
            </p>

            <p className="mb-2">Kami memohon pembayaran dapat dilakukan dengan metode transfer pada rekening berikut :</p>
            <div contentEditable={false} suppressContentEditableWarning style={{ lineHeight: '1.15', marginBottom: '1rem' }}>
                <table className="table-doc w-full ml-8">
                <colgroup><col className="grid-col-30"/><col className="grid-col-2"/><col className="grid-col-68"/></colgroup>
                <tbody>
                    <tr><td className="align-top">Bank</td><td className="align-top">:</td><td className="align-top"><V>{masterData.bankPenyedia}</V></td></tr>
                    <tr><td className="align-top">Atas Nama</td><td className="align-top">:</td><td className="align-top"><V>{masterData.rekeningAtasNama}</V></td></tr>
                    <tr><td className="align-top">Nomor Rekening</td><td className="align-top">:</td><td className="align-top"><V>{masterData.rekeningNomor}</V></td></tr>
                </tbody>
                </table>
            </div>

            <p className="mb-8">Demikian Surat Permohonan ini kami buat atas perhatian dan kerjasamanya, kami ucapkan terima kasih.</p>

            <SignatureBlock align="right" greeting="Hormat Kami," company={masterData.namaPenyedia} name={direkturNama} title={direkturJabatan} />
          </div>
        </PaperPage>

        {/* ================= KWITANSI ================= */}
        <PaperPage paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage}>
          <div className="mb-8 relative border-2-double text-base-pt leading-relaxed doc-body">
            <h3 className="font-bold text-xl tracking-widest mb-8 text-center border-b-2">KWITANSI</h3>
            
            <table contentEditable={false} suppressContentEditableWarning className="table-doc w-full mb-10" style={{ lineHeight: '1.25' }}>
              <colgroup><col style={{width:'25%'}}/><col className="grid-col-2"/><col style={{width:'73%'}}/></colgroup>
              <tbody>
                <tr>
                  <td className="pb-4 align-top font-semibold">Nomor</td>
                  <td className="pb-4 align-top">:</td>
                  <td className="pb-4 align-top"><V>{masterData.noSuratKwitansi}</V></td>
                </tr>
                <tr>
                  <td className="pb-4 align-top font-semibold">Sudah Diterima Dari</td>
                  <td className="pb-4 align-top">:</td>
                  <td className="pb-4 align-top"><V>{penerimaLainnya}</V> {masterData.divisiInstansi && masterData.divisiInstansi !== '_____' ? <V>{masterData.divisiInstansi + ' '}</V> : ''}<V>{masterData.namaInstansi}</V></td>
                </tr>
                <tr>
                  <td className="pb-4 align-top font-semibold">Jumlah</td>
                  <td className="pb-4 align-top">:</td>
                  <td className="pb-4 align-top font-bold text-lg"><V>{masterData.nilaiSPK}</V></td>
                </tr>
                <tr>
                  <td className="pb-4 align-top font-semibold">Terbilang</td>
                  <td className="pb-4 align-top">:</td>
                  <td className="pb-4 align-top italic">
                    <V>{formatTerbilang(masterData.nilaiSPK)}</V>
                  </td>
                </tr>
                <tr>
                  <td className="pb-4 align-top font-semibold">Untuk Pembayaran</td>
                  <td className="pb-4 align-top">:</td>
                  <td className="pb-4 align-top text-justify">
                    <V>{formatTitleCase(masterData.namaPekerjaan)}</V> Sesuai dengan Surat Perintah Kerja (SPK) : <V>{masterData.noSPK}</V> Tanggal <V>{masterData.tglSPK}</V>
                  </td>
                </tr>
              </tbody>
            </table>

            <SignatureBlock align="right" greeting={<><V>{masterData.kotaSurat}</V>, <V>{masterData.tglSuratKwitansi}</V></>} company={masterData.namaPenyedia} name={direkturNama} title={direkturJabatan} />
          </div>
        </PaperPage>

        {/* ================= SAMPUL DOKUMEN KUALIFIKASI ================= */}
        <PaperPage paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage}>
          <div className="doc-body text-center" style={{ paddingTop: '10%' }}>
            <h1 className="font-bold uppercase tracking-widest" style={{ fontSize: '20pt', marginBottom: '2rem' }}>DOKUMEN KUALIFIKASI</h1>
            <p style={{ marginBottom: '1rem', fontSize: '14pt' }}>Untuk Pekerjaan</p>
            <p className="font-bold" style={{ fontSize: '14pt', margin: '0 auto', maxWidth: '85%', lineHeight: '1.5' }}>
              <V>{formatTitleCase(masterData.namaPekerjaan)}</V>
            </p>
            <div style={{ height: '200px' }}></div>
            <h2 className="font-bold uppercase tracking-widest" style={{ fontSize: '20pt' }}><V>{masterData.namaPenyedia}</V></h2>
          </div>
        </PaperPage>

        {/* ================= SURAT PERTANGGUNG JAWABAN MUTLAK ================= */}
        <PaperPage paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage}>
          <div className="mb-8 text-base-pt leading-relaxed text-justify doc-body">
            <div className="text-center mb-10">
              <h3 className="font-bold text-lg underline mb-1">SURAT PERTANGGUNG JAWABAN MUTLAK</h3>
              <p className="font-bold text-sm" style={{maxWidth: '48rem', margin: '0 auto'}}><V>{formatTitleCase(masterData.namaPekerjaanSingkat)}</V></p>
            </div>

            <div contentEditable={false} suppressContentEditableWarning style={{ lineHeight: '1.15', marginBottom: '1rem' }}>
              <table className="table-doc w-full">
                <colgroup><col className="grid-col-35"/><col className="grid-col-2"/><col className="grid-col-63"/></colgroup>
                <tbody>
                  <tr><td className="align-top">Nama</td><td className="align-top">:</td><td className="align-top font-bold"><V>{direkturNama}</V></td></tr>
                  <tr><td className="align-top">No. Identitas</td><td className="align-top">:</td><td className="align-top"><V>{direkturNik}</V></td></tr>
                  <tr><td className="align-top">Jabatan</td><td className="align-top">:</td><td className="align-top"><V>{direkturJabatan}</V></td></tr>
                  <tr><td className="align-top">Bertindak untuk dan atas nama</td><td className="align-top">:</td><td className="align-top font-bold"><V>{masterData.namaPenyedia}</V></td></tr>
                  <tr><td className="align-top">Alamat</td><td className="align-top">:</td><td className="align-top"><V>{masterData.alamatPenyedia}</V></td></tr>
                  <tr><td className="align-top">Nomor Telepon</td><td className="align-top">:</td><td className="align-top"><V>{masterData.noHpPenyedia}</V></td></tr>
                  <tr><td className="align-top">Email Perusahaan</td><td className="align-top">:</td><td className="align-top"><V>{masterData.emailPenyedia}</V></td></tr>
                </tbody>
              </table>
            </div>

            <p className="mb-2">Menyatakan dengan sebenarnya bahwa :</p>
            <ol className="list-dec mb-6">
              <li className="mb-2 text-justify">
                <span className="font-bold"><V>{masterData.namaPenyedia}</V></span> telah melakukan kontrak <span className="font-bold"><V>{formatTitleCase(masterData.namaPekerjaan)}</V></span> Sesuai dengan Surat Perintah Kerja (SPK) : <V>{masterData.noSPK}</V> Tanggal <V>{masterData.tglSPK}</V>.
              </li>
              <li className="mb-2 text-justify">
                Nilai Kesepakatan Kontrak Sebesar : <span className="font-bold"><V>{masterData.nilaiSPK}</V> <span className="italic">(<V>{formatTerbilang(masterData.nilaiSPK)}</V>)</span></span>
              </li>
              <li className="mb-2 text-justify">
                Lama Pekerjaan <V>{masterData.waktuPenyelesaian}</V> hari Kalender.
              </li>
              <li className="mb-2 text-justify">
                Jika dikemudian hari ternyata ada temuan dari aparat pemeriksa internal (inspektorat) dan eksternal (BPK RI) terkait harga yang berdampak menimbulkan kerugian Negara, kami siap dan bertanggungjawab untuk mengembalikan kerugian negara tersebut ke kas Negara serta bersedia dikenakan sanksi sesuai dengan ketentuan peraturan perundang-undangan yang berlaku.
              </li>
            </ol>

            <p className="indent-8 mb-8 text-justify">
              Demikian surat pernyataan pertanggung Jawaban Mutlak ini dibuat dengan sebenar-benarnya dan tanpa ada paksaan dari pihak manapun.
            </p>

            <SignatureBlock align="right" greeting={<><V>{masterData.kotaSurat}</V>, <V>{masterData.tglSuratPembayaran}</V></>} company={masterData.namaPenyedia} name={direkturNama} title={direkturJabatan} />
          </div>
        </PaperPage>
      </>
    );
  };

  const renderFormSection = (title, fields) => (
    <Card size="small" title={<span style={{fontSize: '12px', fontWeight: 'bold'}}>{title}</span>} style={{ marginBottom: 16 }}>
      <Row gutter={8}>
        {fields.map(f => (
          <Col span={f.span || 12} key={f.key}>
            <FormGroup label={f.label}>
              {f.type === 'textarea' ? (
                <TextArea name={f.key} value={masterData[f.key] || ''} onChange={handleMasterDataChange} autoSize={{minRows:2}} />
              ) : (
                <Input name={f.key} value={masterData[f.key] || ''} onChange={handleMasterDataChange} />
              )}
            </FormGroup>
          </Col>
        ))}
      </Row>
    </Card>
  );

  const renderMasterDataForm = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 16 }}>
        <div style={{ background: '#e6f7ff', padding: 12, borderRadius: 4, border: '1px solid #91d5ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: '#096dd9' }}>Isi Data Master Proyek.</span>
          <Space>
             {headerImage && (
                <Button size="small" danger onClick={() => setHeaderImage(null)}>Hapus Kop</Button>
             )}
             <div style={{ position: 'relative', display: 'inline-block' }}>
               <Button size="small" icon={<ImageIcon size={14}/>}>Upload Kop Surat</Button>
               <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  onClick={(e) => { e.target.value = null }} 
                  style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 10 }} 
                  title="Upload Kop Surat" 
               />
             </div>
          </Space>
        </div>

        {renderFormSection("Informasi Pekerjaan", [
          { key: 'namaPekerjaan', label: 'Nama Pekerjaan', type: 'textarea', span: 24 },
          { key: 'namaPekerjaanSingkat', label: 'Nama Singkat', span: 12 },
          { key: 'lokasiPekerjaan', label: 'Lokasi', span: 12 },
          { key: 'waktuPenyelesaian', label: 'Waktu Penyelesaian (Hari)', span: 12 },
          { key: 'kotaSurat', label: 'Kota Surat', span: 12 },
          { key: 'nilaiSPH', label: 'Nilai SPH', span: 12 },
          { key: 'nilaiSPK', label: 'Nilai SPK', span: 12 },
        ])}

        {renderFormSection("Penomoran Surat", [
          { key: 'noSuratPenawaran', label: 'No. SPH', span: 12 },
          { key: 'tglSuratPenawaran', label: 'Tgl SPH', span: 12 },
          { key: 'noSPK', label: 'No. SPK', span: 12 },
          { key: 'tglSPK', label: 'Tgl SPK', span: 12 },
          { key: 'noSuratPemeriksaan', label: 'No. Surat Pemeriksaan', span: 12 },
          { key: 'tglSuratPemeriksaan', label: 'Tgl Surat Pemeriksaan', span: 12 },
          { key: 'noSuratPembayaran', label: 'No. Surat Pembayaran', span: 12 },
          { key: 'tglSuratPembayaran', label: 'Tgl Surat Pembayaran', span: 12 },
          { key: 'noSuratKwitansi', label: 'No. Kwitansi', span: 12 },
          { key: 'tglSuratKwitansi', label: 'Tgl Kwitansi', span: 12 },
        ])}

        {renderFormSection("Instansi / Pemberi Tugas", [
          { key: 'namaInstansi', label: 'Nama Instansi', span: 12 },
          { key: 'divisiInstansi', label: 'Divisi / Bidang', span: 12 },
          { key: 'jabatanTujuanSPH', label: 'Tujuan SPH (Pejabat Pengadaan)', span: 12 },
          { key: 'jabatanTujuanLainnya', label: 'Tujuan Lain (PPK dll)', span: 12 },
          { key: 'tahunAnggaran', label: 'Tahun Anggaran', span: 12 },
          { key: 'alamatInstansi', label: 'Alamat Instansi', type: 'textarea', span: 24 },
        ])}

        {renderFormSection("Perusahaan / Penyedia", [
          { key: 'namaPenyedia', label: 'Nama Perusahaan', span: 12 },
          { key: 'alamatPenyedia', label: 'Alamat Perusahaan', type: 'textarea', span: 12 },
          { key: 'namaDirekturPenyedia', label: 'Nama Direktur', span: 12 },
          { key: 'nikDirekturPenyedia', label: 'NIK Direktur', span: 12 },
          { key: 'kodePos', label: 'Kode Pos', span: 8 },
          { key: 'npwpPenyedia', label: 'NPWP', span: 16 },
          { key: 'noHpPenyedia', label: 'No. HP', span: 8 },
          { key: 'emailPenyedia', label: 'Email', span: 8 },
          { key: 'tlpFax', label: 'Telp/Fax', span: 8 },
          { key: 'bankPenyedia', label: 'Bank', span: 8 },
          { key: 'rekeningNomor', label: 'No. Rekening', span: 8 },
          { key: 'rekeningAtasNama', label: 'Atas Nama', span: 8 },
        ])}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
           <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Data Pengurus Perusahaan</span>
           <Button size="small" type="primary" onClick={handleAddPengurus} icon={<Plus size={14} />}>Tambah</Button>
        </div>
        {pengurusData.map((p) => (
          <Card key={p.id} size="small" style={{ marginBottom: 8 }} extra={pengurusData.length > 1 && <Button danger type="text" icon={<Trash2 size={14}/>} onClick={() => handleRemovePengurus(p.id)} />}>
             <Row gutter={8}>
                <Col span={8}><FormGroup label="Nama"><Input value={p.nama} onChange={e => handlePengurusChange(p.id, 'nama', e.target.value)}/></FormGroup></Col>
                <Col span={6}><FormGroup label="Jabatan"><Input value={p.jabatan} onChange={e => handlePengurusChange(p.id, 'jabatan', e.target.value)}/></FormGroup></Col>
                <Col span={6}><FormGroup label="No Identitas"><Input value={p.noKtp} onChange={e => handlePengurusChange(p.id, 'noKtp', e.target.value)}/></FormGroup></Col>
                <Col span={4}><FormGroup label="Saham (%)"><Input value={p.sahamPersen} onChange={e => handlePengurusChange(p.id, 'sahamPersen', e.target.value)}/></FormGroup></Col>
             </Row>
          </Card>
        ))}

        <Divider />

        {renderFormSection("Legalitas Perusahaan", [
          { key: 'aktaPendirian', label: 'Notaris Akta Pendirian', span: 12 },
          { key: 'noAktaPendirian', label: 'No Akta Pendirian', span: 6 },
          { key: 'tglAktaPendirian', label: 'Tgl Akta Pendirian', span: 6 },
          { key: 'noMenkumham', label: 'No Menkumham (Pendirian)', span: 12 },
          { key: 'aktaPerubahan', label: 'Notaris Akta Perubahan', span: 12 },
          { key: 'noAktaPerubahan', label: 'No Akta Perubahan', span: 6 },
          { key: 'tglAktaPerubahan', label: 'Tgl Akta Perubahan', span: 6 },
          { key: 'noMenkumhamPerubahan', label: 'No Menkumham (Perubahan)', span: 12 },
          { key: 'izinUsaha', label: 'Izin Usaha / NIB', span: 8 },
          { key: 'tglIzinUsaha', label: 'Tgl Izin Usaha', span: 8 },
          { key: 'pemberiIzin', label: 'Pemberi Izin', span: 8 },
          { key: 'masaBerlakuIzin', label: 'Masa Berlaku', span: 12 },
          { key: 'kualifikasiUsaha', label: 'Kualifikasi', span: 12 },
          { key: 'laporanPajak', label: 'Laporan Pajak', span: 12 },
          { key: 'tglLaporanPajak', label: 'Tgl Laporan Pajak', span: 12 },
        ])}
      </div>
    );
  };

  const getPrintCSS = () => {
    let orientation = 'portrait';
    const pageConfig = paperSize === 'F4' ? '8.5in 13in' : 'A4 portrait';

    return `
      @page {
          size: ${pageConfig};
          margin: 15mm 15mm 20mm 20mm; /* Added default page margins for all printed pages */
      }

      .doc-body { font-size: ${fontSize}pt; line-height: 1.5; text-align: justify; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .text-left { text-align: left; }
      .font-bold { font-weight: bold; }
      .font-semibold { font-weight: 600; }
      .italic { font-style: italic; }
      .underline { text-decoration: underline; }
      
      .mb-1 { margin-bottom: 0.25rem; }
      .mb-2 { margin-bottom: 0.5rem; }
      .mb-4 { margin-bottom: 1rem; }
      .mb-6 { margin-bottom: 1.5rem; }
      .mb-8 { margin-bottom: 2rem; }
      .mb-10 { margin-bottom: 2.5rem; }
      .mt-4 { margin-top: 1rem; }
      .mt-12 { margin-top: 3rem; }
      
      .indent-8 { text-indent: 35pt; }
      .align-top { vertical-align: top; }
      .align-middle { vertical-align: middle; }
      .w-full { width: 100%; }
      .mx-auto { margin-left: auto; margin-right: auto; }
      
      .p-0 { padding: 0 !important; }
      .p-1-5 { padding: 0.375rem; }
      .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
      .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
      .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
      
      .list-dec { list-style-type: decimal; padding-left: 2rem; margin-bottom: 1.5rem; }
      .list-dec li { margin-bottom: 0.5rem; }
      
      .table-doc { width: 100%; border-collapse: collapse; font-size: ${fontSize}pt; }
      .table-doc td { padding-bottom: 0px; vertical-align: top; border: none; }
      
      .table-bordered { width: 100%; border-collapse: collapse; border: 1px solid black; }
      .table-bordered th, .table-bordered td { border: 1px solid black; padding: 4px; word-wrap: break-word; }
      .table-fixed { table-layout: fixed; }
      
      /* Injeksi Warna Tabel Dasar */
      .bg-gray-100 { background-color: ${tableHeaderColor} !important; }
      .bg-gray-200 { background-color: ${tableHeaderColor} !important; filter: brightness(0.95); }
      .bg-white { background-color: #ffffff; }
      
      .text-xs { font-size: ${fontSize - 2}pt; }
      .text-sm { font-size: ${fontSize - 1}pt; }
      .text-base-pt { font-size: ${fontSize}pt; }
      .text-lg { font-size: ${fontSize + 3}pt; }
      .text-xl { font-size: ${fontSize + 7}pt; }
      
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
      .whitespace-nowrap { white-space: nowrap; }
      .whitespace-pre-wrap { white-space: pre-wrap; }
      .hover-bg-gray:hover { background-color: #f9fafb; transition: background-color 0.2s; }
      .overflow-hidden { overflow: hidden; }
      
      .grid-col-2 { width: 2%; } .grid-col-3 { width: 3%; } .grid-col-6 { width: 6%; } .grid-col-7 { width: 7%; } 
      .grid-col-8 { width: 8%; } .grid-col-10 { width: 10%; } .grid-col-11 { width: 11%; } .grid-col-28 { width: 28%; } 
      .grid-col-30 { width: 30%; } .grid-col-35 { width: 35%; } .grid-col-38 { width: 38%; } .grid-col-40 { width: 40%; } 
      .grid-col-45 { width: 45%; } .grid-col-48 { width: 48%; } .grid-col-53 { width: 53%; } .grid-col-55 { width: 55%; } 
      .grid-col-63 { width: 63%; } .grid-col-68 { width: 68%; } .grid-col-73 { width: 73%; } .grid-col-auto { width: auto; }

      .var-protect { background-color: #e6f7ff; color: #003a8c; border-radius: 3px; padding: 0 4px; user-select: all; }

      .doc-preview-wrapper { width: max-content; min-width: 100%; display: flex; justify-content: center; padding: 2rem; background-color: #e5e7eb; box-sizing: border-box; }
      .doc-preview-inner { display: flex; flex-direction: column; gap: 2rem; width: max-content; }
      .paper-page { background-color: white; color: black; position: relative; flex-shrink: 0; box-sizing: border-box; box-shadow: 0 10px 25px rgba(0,0,0,0.15); margin: 0 auto; }
      .print-kop { width: 100%; margin-bottom: 1rem; text-align: center; }
      .print-kop img { max-width: 100%; max-height: 150px; object-fit: contain; margin: 0 auto; }
      
      @media print {
          /* Memaksa browser mengeprint warna background tabel dan sel */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          
          body, html { background-color: white !important; margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; }
          .print-hidden { display: none !important; }
          
          /* Hilangkan warna biru variabel saat print */
          .var-protect { background-color: transparent !important; color: inherit !important; padding: 0 !important; border: none !important; }
          
          /* Prevent table headers from repeating on new pages */
          thead { display: table-row-group; }

          .doc-preview-wrapper, .doc-preview-inner { 
             display: block !important; 
             background: white !important; 
             padding: 0 !important; 
             margin: 0 !important; 
             width: 100% !important; 
             height: auto !important; 
             overflow: visible !important;
          }
          
          .paper-page { 
             display: block !important;
             box-shadow: none !important; 
             margin: 0 !important; 
             width: 100% !important; 
             height: auto !important; 
             min-height: 0 !important; 
             page-break-after: always !important; 
             break-after: page !important;
             padding: 0 !important; /* Remove inline padding to avoid double margins with @page */
          }
          
          .paper-page:last-of-type { page-break-after: auto !important; break-after: auto !important; }
          table { width: 100% !important; max-width: 100% !important; }
          th div { resize: none !important; width: 100% !important; min-width: 0 !important; padding-left: 2px !important; padding-right: 2px !important; }
      }
    `;
  };

  return (
    <>
      {contextHolder}
      
      {view === 'home' ? (
        <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
          <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#001529', padding: '0 24px' }}>
            <Space>
              <FileText color="white" size={24} />
              <Title level={4} style={{ color: 'white', margin: 0, marginTop: 4 }}>Dashboard Proyek Dokumen</Title>
            </Space>
            <Button type="primary" icon={<Plus size={16} />} onClick={createNewProject}>
              Buat Proyek Baru
            </Button>
          </Header>

          <Content style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 24, borderBottom: '1px solid #d9d9d9', paddingBottom: 16 }}>
              <Col><Title level={3} style={{ margin: 0 }}>Daftar Proyek Tersimpan</Title></Col>
              <Col><Text strong style={{ background: '#e6f7ff', padding: '4px 12px', borderRadius: 16, color: '#096dd9' }}>{filteredProjects.length} Proyek</Text></Col>
            </Row>

            {projects.length > 0 && (
              <Card style={{ marginBottom: 24, borderRadius: 8 }} bodyStyle={{ padding: '16px 24px' }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={16}>
                    <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 12, textTransform: 'uppercase' }}>Cari Pekerjaan</Text>
                    <Input prefix={<Search size={16} color="#bfbfbf" />} placeholder="Ketik info paket pekerjaan..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </Col>
                  <Col xs={24} md={8}>
                    <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 12, textTransform: 'uppercase' }}>Filter Berdasarkan PT</Text>
                    <Select 
                      style={{ width: '100%' }} 
                      value={filterPT} 
                      onChange={setFilterPT}
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {uniquePTs.map(pt => <Option key={pt} value={pt}>{pt === 'All' ? '-- Semua Perusahaan --' : pt}</Option>)}
                    </Select>
                  </Col>
                </Row>
              </Card>
            )}

            {filteredProjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', border: '2px dashed #d9d9d9', borderRadius: 8, background: 'white' }}>
                <Database size={64} color="#d9d9d9" style={{ margin: '0 auto 16px' }} />
                <Title level={4} style={{ color: '#8c8c8c' }}>{projects.length === 0 ? 'Belum ada proyek tersimpan.' : 'Tidak ada proyek yang sesuai dengan pencarian.'}</Title>
                <Text type="secondary">{projects.length === 0 ? 'Klik tombol "Buat Proyek Baru" di atas untuk memulai.' : 'Coba ganti kata kunci pencarian atau pilih PT yang lain.'}</Text>
              </div>
            ) : (
              <Row gutter={[24, 24]}>
                {filteredProjects.map(proj => (
                  <Col xs={24} lg={12} xl={12} key={proj.id}>
                    <Card hoverable style={{ height: '100%', display: 'flex', flexDirection: 'column' }} bodyStyle={{ flex: 1, padding: '16px' }} actions={[<Button type="link" icon={<Edit2 size={14} />} onClick={() => editProject(proj)} style={{ width: '100%' }}>Buka Editor</Button>]}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Text style={{ fontSize: '10px', background: '#e6f7ff', color: '#096dd9', padding: '2px 8px', borderRadius: 4, fontWeight: 'bold' }}>{new Date(proj.updatedAt).toLocaleString('id-ID')}</Text>
                        <Space>
                          <Button type="text" size="small" icon={<Copy size={14} />} onClick={() => duplicateProject(proj)} />
                          <Popconfirm title="Hapus proyek permanen?" onConfirm={() => deleteProject(proj.id)}><Button type="text" danger size="small" icon={<Trash2 size={14} />} /></Popconfirm>
                        </Space>
                      </div>
                      
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#262626', marginBottom: '14px', lineHeight: '1.5', textTransform: 'uppercase' }}>
                        {proj.masterData?.namaPekerjaan && proj.masterData?.namaPekerjaan !== '_____' ? formatTitleCase(proj.masterData.namaPekerjaan) : 'Proyek Tanpa Nama'}
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}><Briefcase size={12} style={{ verticalAlign: '-2px', marginRight: 4 }}/> {proj.masterData?.namaPenyedia || '-'}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}><MapPin size={12} style={{ verticalAlign: '-2px', marginRight: 4 }}/> {proj.masterData?.lokasiPekerjaan || '-'}</Text>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '4px' }}>
                          <Text type="secondary" style={{ fontSize: 12 }}><TableIcon size={12} style={{ verticalAlign: '-2px', marginRight: 4 }}/> SPH: <span style={{fontWeight: 'bold', color: '#595959'}}>{proj.masterData?.nilaiSPH || '-'}</span></Text>
                          <Text type="secondary" style={{ fontSize: 12 }}><TableIcon size={12} style={{ verticalAlign: '-2px', marginRight: 4 }}/> SPK: <span style={{fontWeight: 'bold', color: '#595959'}}>{proj.masterData?.nilaiSPK || '-'}</span></Text>
                        </div>
                      </div>

                      <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '6px', border: '1px solid #e8e8e8' }}>
                        <table style={{ width: '100%', fontSize: '11px', lineHeight: '1.4' }}>
                          <tbody>
                            <tr><td style={{ color: '#8c8c8c', width: '35%' }}>SPH</td><td style={{ fontWeight: 'bold' }}>{proj.masterData?.noSuratPenawaran || '-'}</td><td style={{ textAlign: 'right', color: '#8c8c8c' }}>{proj.masterData?.tglSuratPenawaran || '-'}</td></tr>
                            <tr><td style={{ color: '#8c8c8c' }}>SPK</td><td style={{ fontWeight: 'bold' }}>{proj.masterData?.noSPK || '-'}</td><td style={{ textAlign: 'right', color: '#8c8c8c' }}>{proj.masterData?.tglSPK || '-'}</td></tr>
                            <tr><td style={{ color: '#8c8c8c' }}>Pemeriksaan</td><td style={{ fontWeight: 'bold' }}>{proj.masterData?.noSuratPemeriksaan || '-'}</td><td style={{ textAlign: 'right', color: '#8c8c8c' }}>{proj.masterData?.tglSuratPemeriksaan || '-'}</td></tr>
                            <tr><td style={{ color: '#8c8c8c' }}>Pembayaran</td><td style={{ fontWeight: 'bold' }}>{proj.masterData?.noSuratPembayaran || '-'}</td><td style={{ textAlign: 'right', color: '#8c8c8c' }}>{proj.masterData?.tglSuratPembayaran || '-'}</td></tr>
                            <tr><td style={{ color: '#8c8c8c' }}>Kwitansi</td><td style={{ fontWeight: 'bold' }}>{proj.masterData?.noSuratKwitansi || '-'}</td><td style={{ textAlign: 'right', color: '#8c8c8c' }}>{proj.masterData?.tglSuratKwitansi || '-'}</td></tr>
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Content>
        </Layout>
      ) : (
        <Layout style={{ height: '100vh', overflow: 'hidden' }}>
          <Header style={{ background: '#001529', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px' }} className="print-hidden">
            <Space size="large" align="center">
              <Button type="text" icon={<Home size={20} color="white" />} onClick={() => setView('home')} title="Kembali ke Home" />
              <Button type="text" icon={isSidebarVisible ? <PanelLeftClose size={20} color="white" /> : <PanelLeft size={20} color="white" />} onClick={() => setIsSidebarVisible(!isSidebarVisible)} title="Sembunyikan/Tampilkan Panel Editor" />
              <Title level={5} style={{ color: 'white', margin: 0 }}>SPH Editor</Title>
            </Space>
            
            <Space>
              <Select value={paperSize} onChange={setPaperSize} style={{ width: 110 }}>
                <Option value="A4">Kertas A4</Option>
                <Option value="F4">Kertas F4</Option>
              </Select>
              <Select value={fontFamily} onChange={setFontFamily} style={{ width: 160 }} showSearch>
                <Option value="Arial, sans-serif">Arial</Option>
                <Option value="'Times New Roman', Times, serif">Times New Roman</Option>
                <Option value="Tahoma, sans-serif">Tahoma</Option>
                <Option value="Verdana, sans-serif">Verdana</Option>
                <Option value="'Courier New', Courier, monospace">Courier New</Option>
                <Option value="Georgia, serif">Georgia</Option>
                <Option value="'Calibri', sans-serif">Calibri</Option>
                <Option value="'Garamond', serif">Garamond</Option>
                <Option value="'Trebuchet MS', sans-serif">Trebuchet MS</Option>
                <Option value="'Arial Narrow', sans-serif">Arial Narrow</Option>
              </Select>
              <Select value={fontSize} onChange={setFontSize} style={{ width: 85 }} title="Ukuran Font">
                <Option value={10}>10 pt</Option>
                <Option value={11}>11 pt</Option>
                <Option value={12}>12 pt</Option>
                <Option value={13}>13 pt</Option>
                <Option value={14}>14 pt</Option>
              </Select>
              
              <Button type="primary" style={{ background: '#52c41a' }} icon={<Save size={16}/>} onClick={saveToCloud}>Simpan</Button>
              <Button icon={<Printer size={16}/>} onClick={downloadHTML}>HTML / Cetak</Button>
            </Space>
          </Header>

          <Layout>
            <Sider 
              width={450} 
              collapsed={!isSidebarVisible} 
              collapsedWidth={0}
              trigger={null}
              theme="light" 
              className="print-hidden" 
              style={{ overflow: 'hidden', borderRight: isSidebarVisible ? '1px solid #f0f0f0' : 'none' }}
            >
              <div style={{ width: 450, height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
                <Tabs 
                  activeKey={activeTab} 
                  onChange={handleTabChange} 
                  centered
                  style={{ position: 'sticky', top: 0, zIndex: 10, background: 'white', borderBottom: '1px solid #f0f0f0' }}
                  items={[
                    { key: 'master', label: 'Data Master', icon: <Database size={14}/> },
                    { key: 'sph', label: 'Tabel SPH', icon: <TableIcon size={14}/> },
                    { key: 'pengalaman', label: 'Pengalaman', icon: <Briefcase size={14}/> }
                  ]}
                />
                
                <div style={{ padding: '0 16px 24px' }}>
                  {activeTab === 'sph' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', marginTop: 16 }}>
                      <div style={{ background: '#fffbe6', padding: 12, borderRadius: 4, border: '1px solid #ffe58f', fontSize: 12, color: '#d48806' }}>
                          Paste tabel <b>SPH</b> di bawah ini. Baris "TOTAL KESELURUHAN" akan otomatis diproses.
                      </div>
                      <TextArea 
                          value={pastedSPH} 
                          onChange={e => setPastedSPH(e.target.value)} 
                          style={{ minHeight: '300px', fontFamily: 'monospace', fontSize: '12px' }} 
                          placeholder="Paste data tabel SPH Excel Anda di sini..."
                      />
                    </div>
                  )}

                  {activeTab === 'pengalaman' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: 16 }}>
                      <div style={{ background: '#f6ffed', padding: 12, borderRadius: 4, border: '1px solid #b7eb8f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: '#389e0d' }}>Isi Data Pengalaman manual.</span>
                          <Button type="primary" size="small" style={{ background: '#52c41a' }} icon={<Plus size={14}/>} onClick={handleAddPengalaman}>Tambah</Button>
                      </div>
                      {pengalamanData.map((item, index) => (
                          <Card key={item.id} size="small" title={`Baris #${index + 1}`} extra={pengalamanData.length > 1 && <Button danger type="text" icon={<Trash2 size={14}/>} onClick={() => handleRemovePengalaman(item.id)} />}>
                              <FormGroup label="Nama Paket Pekerjaan">
                                 <TextArea value={item.namaPaket} onChange={e=>handlePengalamanChange(item.id, 'namaPaket', e.target.value)} autoSize={{ minRows: 2 }} />
                              </FormGroup>
                              <Row gutter={8}>
                                  <Col span={12}><FormGroup label="Bidang / Sub"><Input value={item.bidang} onChange={e=>handlePengalamanChange(item.id, 'bidang', e.target.value)} /></FormGroup></Col>
                                  <Col span={12}><FormGroup label="Lokasi"><Input value={item.lokasi} onChange={e=>handlePengalamanChange(item.id, 'lokasi', e.target.value)} /></FormGroup></Col>
                              </Row>
                              <Divider style={{ margin: '8px 0' }} />
                              <Row gutter={8}>
                                  <Col span={12}><FormGroup label="Pemberi Tugas (Nama)"><Input value={item.pemberiNama} onChange={e=>handlePengalamanChange(item.id, 'pemberiNama', e.target.value)} /></FormGroup></Col>
                                  <Col span={12}><FormGroup label="Alamat Pemberi Tugas"><Input value={item.pemberiAlamat} onChange={e=>handlePengalamanChange(item.id, 'pemberiAlamat', e.target.value)} /></FormGroup></Col>
                              </Row>
                              <Divider style={{ margin: '8px 0' }} />
                              <Row gutter={8}>
                                  <Col span={12}><FormGroup label="No & Tgl Kontrak"><TextArea value={item.kontrakNoTgl} onChange={e=>handlePengalamanChange(item.id, 'kontrakNoTgl', e.target.value)} autoSize={{minRows:2}} /></FormGroup></Col>
                                  <Col span={12}><FormGroup label="Nilai Kontrak"><Input value={item.kontrakNilai} onChange={e=>handlePengalamanChange(item.id, 'kontrakNilai', e.target.value)} style={{marginTop: 4}} /></FormGroup></Col>
                              </Row>
                              <Divider style={{ margin: '8px 0' }} />
                              <Row gutter={8}>
                                  <Col span={12}><FormGroup label="Selesai (Kontrak)"><TextArea value={item.selesaiKontrak} onChange={e=>handlePengalamanChange(item.id, 'selesaiKontrak', e.target.value)} autoSize={{minRows:2}} /></FormGroup></Col>
                                  <Col span={12}><FormGroup label="Selesai (BAST)"><TextArea value={item.selesaiBAST} onChange={e=>handlePengalamanChange(item.id, 'selesaiBAST', e.target.value)} autoSize={{minRows:2}} /></FormGroup></Col>
                              </Row>
                          </Card>
                      ))}
                    </div>
                  )}

                  {activeTab === 'master' && renderMasterDataForm()}
                </div>
              </div>
            </Sider>

            <Content style={{ background: '#e5e7eb', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              
              {/* TOOLBAR UNTUK TEXT EDITING */}
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
                 <Space size={6} align="center" style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 4 }}>
                   <Text type="secondary" style={{fontSize: 11, lineHeight: 1}}>Warna<br/>Header</Text>
                   <input type="color" value={tableHeaderColor} onChange={(e) => setTableHeaderColor(e.target.value)} style={{ border: 'none', width: 24, height: 24, padding: 0, cursor: 'pointer', background: 'transparent' }} title="Warna Global Header Tabel" />
                 </Space>
                 <Space size={6} align="center" style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 4 }}>
                   <Text type="secondary" style={{fontSize: 11, lineHeight: 1}}>Warna<br/>Teks</Text>
                   <input type="color" onChange={(e) => document.execCommand('foreColor', false, e.target.value)} style={{ border: 'none', width: 24, height: 24, padding: 0, cursor: 'pointer', background: 'transparent' }} title="Warna Teks" />
                 </Space>
                 <Text type="secondary" style={{ fontSize: 11, marginLeft: 'auto', fontStyle: 'italic' }}>*Klik langsung pada dokumen untuk mulai mengedit teks.</Text>
              </div>

              <div 
                className="doc-preview-wrapper print-block print-p-0" 
                style={{ flex: 1, overflowY: 'auto' }}
              >
                <div id="document-preview" className="doc-preview-inner print-block print-gap-0">
                  {renderDokumenLegal()}
                </div>
              </div>
            </Content>
          </Layout>
        </Layout>
      )}

      {/* DYNAMIC CSS UNTUK PRINT DAN PENGGANTI TAILWIND */}
      <style dangerouslySetInnerHTML={{__html: getPrintCSS()}} />
    </>
  );
}