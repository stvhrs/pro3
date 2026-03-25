import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, push, set, remove, update, query, orderByChild } from 'firebase/database';
import { Layout, Button, Input, Select, Card, Typography, Row, Col, Space, message, Popconfirm, Tabs, Divider, Popover, Spin, Pagination } from 'antd';
import { FileText, Printer, FileDown, Database, Table as TableIcon, Briefcase, Plus, Trash2, Copy, Edit2, FileSignature, Home, Save, Search, PanelLeftClose, PanelLeft, MapPin, ImageIcon, Bold, Underline, Italic, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo, Redo, Palette, Highlighter, PaintBucket, List, ListOrdered, Settings } from 'lucide-react';

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
// DATA BLANK / DEFAULT PROYEK BARU
// ==========================================
const BLANK_MASTER_DATA = {
  namaPekerjaan: 'Pengadaan Jasa Lainnya Penyelenggaraan Kegiatan Sosialisasi Dalam Rangka Promosi Tentang Pemenuhan Gizi di Kecamatan Wiyung Kota Surabaya Provinsi Jawa Timur',
  waktuPenyelesaian: '7 (Tujuh)',
  kotaSurat: 'Jakarta',
  nilaiSPH: 'Rp 186.346.570,-',
  nilaiSPK: 'Rp 185.905.000,-',
  namaInstansi: 'Badan Gizi Nasional',
  divisiInstansi: 'Deputi Bidang Promosi dan Kerjasama',
  jabatanTujuanSPH: 'Pejabat Pengadaan Barang/Jasa',
  jabatanTujuanLainnya: 'Pejabat Pembuat Komitmen',
  tahunAnggaran: '2026',
  alamatInstansi: 'Jakarta',
  namaDirekturPenyedia: 'M. ARIFIN',
  nikDirekturPenyedia: '3173061002931003',
  namaPenyedia: 'PT FIN GARUDA SAKTI',
  alamatPenyedia: 'Jl Letjend Suprapto No 29 Lt 1 Kel Harapan Mulia Kec Kemayoran Jakarta Pusat',
  kodePos: '_____',
  npwpPenyedia: '84.745.266.1-027.000',
  noHpPenyedia: '021-4208065',
  emailPenyedia: 'Fingarudasakti@gmail.com',
  tlpFax: '-',
  bankPenyedia: 'Bank DKI',
  cabangBank: 'DKI Cabut Juanda',
  rekeningNomor: '101-08-09359-2',
  rekeningAtasNama: 'FIN GARUDA SAKTI ,PT',
  laporanPajak: '_____',
  tglLaporanPajak: '_____',
  aktaPendirian: 'Hj. Meissie Pholuan, S.H. MKn',
  noAktaPendirian: '38.-',
  tglAktaPendirian: '16 April 2018',
  noMenkumham: 'AHU-0020364.AH.01.01.TAHUN 2018',
  aktaPerubahan: '-',
  noAktaPerubahan: '-',
  tglAktaPerubahan: '-',
  noMenkumhamPerubahan: '-',
  izinUsaha: '0220106392564 , 29.-',
  tglIzinUsaha: '24 Maret 2020',
  pemberiIzin: 'Lembaga pengelola dan Penyelenggara OSS',
  masaBerlakuIzin: 'Selama Perusahaan Menjalankan Usahanya',
  kualifikasiUsaha: 'Event Organizer / MICE',
  noSuratPenawaran: '764/SPH/PT.FGS/I/2026',
  tglSuratPenawaran: '28 Januari 2026',
  noSuratPemeriksaan: '770/STP/PT.FGS/II/2026',
  tglSuratPemeriksaan: '11 Februari 2026',
  noSuratPembayaran: '771/SPP/PT.FGS/II/2026',
  tglSuratPembayaran: '12 Februari 2026',
  noSuratKwitansi: '772/KWT/PT.FGS/II/2026',
  tglSuratKwitansi: '12 Februari 2026',
  noSPK: '38/SPK/PPK.07.02/II/2026',
  tglSPK: '05 Februari 2026',
};

const BLANK_PENGURUS_DATA = [
  { id: 1, nama: 'LUKMAN', noKtp: '3173061003740004', jabatan: 'Komisaris', sahamPersen: '60%' },
  { id: 2, nama: 'M. ARIFIN', noKtp: '3173061002931003', jabatan: 'Direktur', sahamPersen: '40%' }
];

const BLANK_PENGALAMAN_DATA = [
  { 
    id: 1, 
    namaPaket: 'Pengadaan Jasa Akomodasi dan Pelaksanaan Sosialisasi Dalam Rangka Arti Penting Peran Tokoh Masyarakat dan UMKM Dalam Program Gizi Nasional di Kabupaten Ogan Ilir Provinsi Sumatera Selatan', 
    bidang: 'Event Organize / MICE', 
    lokasi: 'Kabupaten Ogan Ilir Provinsi Sumatera Selatan', 
    pemberiNama: 'Badan Gizi Nasional', 
    pemberiAlamat: 'Jakarta', 
    kontrakNoTgl: '9.55 /SPK/PPK/07/05/2025 Tanggal 05 Mei 2025', 
    kontrakNilai: 'Rp. 184.818.000,-.', 
    selesaiKontrak: '9.55 /SPK/PPK/07/05/2025 Tanggal 05 Mei 2025', 
    selesaiBAST: '9.55 /BAST/PPK/07/05/2025 Tanggal 12 Mei 2025' 
  }
];

const RAW_FONTS = [
  "Agency FB", "Aharoni", "Algerian", "Andalus", "Angsana New", "AngsanaUPC", "Aparajita", 
  "Aptos", "Aptos Display", "Aptos Narrow", "Aptos Serif", "Arial", "Arial Black", "Arial Narrow", 
  "Arial Nova", "Arial Rounded MT Bold", "Arial Unicode MS", "Arvo", "Bahnschrift", "Baskerville Old Face", 
  "BatangChe", "Bauhaus 93", "Bell MT", "Berlin Sans FB", "Bernard MT Condensed", "Bitter", "Blackadder ITC", "Bodoni MT", 
  "Bodoni MT Black", "Book Antiqua", "Bookman Old Style", "Bookshelf Symbol 7", "Bradley Hand ITC", 
  "Britannic Bold", "Broadway", "Brush Script MT", "Calibri", "Calibri Light", "Calisto MT", "Cambria", 
  "Cambria Math", "Candara", "Cascadia Code", "Castellar", "Century", "Century Gothic", 
  "Century Schoolbook", "Chiller", "Colonna MT", "Comic Sans MS", "Consolas", "Constantia", 
  "Cooper Black", "Copperplate Gothic", "Corbel", "Courier", "Courier New", "Courier Prime", "Crimson Text", "Curlz MT", "David", 
  "DengXian", "Dubai", "Dutch801 Rm BT", "Edwardian Script ITC", "Elephant", "Engravers MT", "Eras ITC", 
  "Felix Titling", "Fira Sans", "Footlight MT Light", "Forte", "Franklin Gothic Book", "Franklin Gothic Demi", 
  "Franklin Gothic Heavy", "Franklin Gothic Medium", "Freestyle Script", "French Script MT", "Gabriola", 
  "Gadugi", "Garamond", "Georgia", "Gill Sans MT", "Gill Sans Ultra Bold", "Gloucester MT Extra Condensed", 
  "Goudy Old Style", "Haettenschweiler", "Harlow Solid Italic", "Harrington", "High Tower Text", "Impact", 
  "Imprint MT Shadow", "Ink Free", "Inter", "IrisUPC", "Javanese Text", "Jokerman", "Juice ITC", "KaiTi", 
  "Kandara", "Kartika", "Leelawadee", "Leelawadee UI", "Lora", "Lucida Bright", "Lucida Calligraphy", 
  "Lucida Console", "Lucida Fax", "Lucida Handwriting", "Lucida Sans", "Lucida Sans Typewriter", 
  "Lucida Sans Unicode", "Magneto", "Maiandra GD", "Malgun Gothic", "Marlett", "Matura MT Script Capitals", 
  "Merriweather", "Microsoft Himalaya", "Microsoft JhengHei", "Microsoft New Tai Lue", "Microsoft PhagsPa", 
  "Microsoft Sans Serif", "Microsoft Tai Le", "Microsoft YaHei", "Microsoft Yi Baiti", "MingLiU", 
  "Miriam", "Mistral", "Modern No. 20", "Mongolian Baiti", "Monotype Corsiva", "Montserrat", "MS Gothic", "MS Mincho", 
  "MS PGothic", "MS PMincho", "MT Extra", "Nirmala UI", "NSimSun", "Nunito", "Noto Sans", "OCR A Extended", 
  "Old English Text MT", "Onyx", "Open Sans", "OpenSymbol", "Oswald", "Palatino Linotype", "Papyrus", "Parchment", "Perpetua", 
  "Perpetua Titling MT", "Playbill", "Playfair Display", "PMingLiU", "Poor Richard", "Poppins", "Pristina", "PT Serif", "Quicksand", "Rage Italic", "Ravie", 
  "Roboto", "Roboto Mono", "Rockwell", "Rockwell Condensed", "Rockwell Extra Bold", "Rod", "Roman", "Rubik", "Sakkal Majalla", 
  "Script MT Bold", "Segoe MDL2 Assets", "Segoe Print", "Segoe Script", "Segoe UI", "Segoe UI Black", 
  "Segoe UI Emoji", "Segoe UI Historic", "Segoe UI Light", "Segoe UI Semibold", "Segoe UI Symbol", 
  "SimHei", "SimSun", "Sitka Banner", "Sitka Display", "Sitka Heading", "Sitka Small", "Sitka Subheading", 
  "Sitka Text", "Snap ITC", "Space Mono", "Stencil", "Sylfaen", "Symbol", "Tahoma", "Tempus Sans ITC", 
  "Times New Roman", "Trebuchet MS", "Tw Cen MT", "Verdana", "Viner Hand ITC", "Vladimir Script", 
  "Webdings", "Wide Latin", "Wingdings", "Wingdings 2", "Wingdings 3", "Work Sans"
];

const FONT_OPTIONS = [...new Set(RAW_FONTS)].sort().map(font => {
    let cssValue = `"${font}", sans-serif`;
    
    if (font === "Cambria Math") cssValue = '"Cambria Math", "Cambria", serif';
    else if (font === "Arial Nova") cssValue = '"Arial Nova", "Arial", sans-serif';
    else if (font.includes("Courier")) cssValue = `"${font}", monospace`;
    else if (font.includes("Times") || font.includes("Garamond") || font.includes("Georgia")) cssValue = `"${font}", serif`;

    return { label: font, value: cssValue };
});

const GOOGLE_FONTS_LIST = [
  "Roboto", "Open Sans", "Inter", "Montserrat", "Oswald", "Poppins", "Nunito", "Rubik", "Merriweather", "Lora", "PT Serif", "Playfair Display", "Roboto Mono", "Space Mono", "Courier Prime", "Quicksand", "Work Sans", "Fira Sans", "Crimson Text", "Bitter", "Arvo"
];

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const formatTitleCase = (str) => {
  if (!str || str === '_____') return str;
  const trimmed = str.trim();
  if(!trimmed) return str;
  
  const lowers = ['di', 'ke', 'dari', 'dan', 'atau', 'untuk', 'yang', 'dalam', 'pada', 'dengan', 'tentang'];
  
  return trimmed.toLowerCase().split(/\s+/).map((word, index) => {
    if (index !== 0 && lowers.includes(word)) {
      return word; 
    }
    if (word.length === 0) return '';
    
    if (word.includes('/')) {
        return word.split('/').map(w => w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : '').join('/');
    }
    if (word.includes('-')) {
        return word.split('-').map(w => w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : '').join('-');
    }
    
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
};

const toUpper = (str) => {
    if (!str || str === '_____') return str;
    return str.toUpperCase();
};

const renderHighlightedTitle = (text) => {
  if (!text || text === '_____') return <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#262626' }}>Proyek Tanpa Nama</div>;
  const titleCased = formatTitleCase(text);
  return <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#262626', lineHeight: '1.5' }}>{titleCased}</div>;
};

// Fungsi Terbilang yang sudah dioptimalkan agar huruf besar di awal kalimat saja
const formatTerbilang = (angkaStr) => {
  if (!angkaStr || angkaStr === '_____') return '_____';
  let numStr = String(angkaStr).trim();
  
  // Deteksi dan bersihkan format rupiah desimal (,00 atau ,-)
  if (numStr.endsWith(',-')) numStr = numStr.slice(0, -2);
  else if (numStr.match(/,\d{1,2}$/)) numStr = numStr.slice(0, numStr.lastIndexOf(','));
  
  // Setelah koma desimal dibersihkan, hilangkan semua karakter non-angka
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
  
  // Pengubahan ke Sentence case (Awal kata besar, sisanya kecil)
  let result = divide(num).trim() + ' rupiah';
  result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
  return result; 
};

const formatHari = (val) => {
  if (!val || val === '_____') return val;
  if (String(val).includes('(')) return val;
  
  const numStr = String(val).trim();
  if (!/^\d+$/.test(numStr)) return val; 
  
  const num = parseInt(numStr, 10);
  const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  const divide = (n) => {
    if (n === 0) return '';
    if (n < 12) return bilangan[n] + ' ';
    if (n < 20) return divide(n - 10) + 'Belas ';
    if (n < 100) return divide(Math.floor(n / 10)) + 'Puluh ' + divide(n % 10);
    if (n < 200) return 'Seratus ' + divide(n - 100);
    if (n < 1000) return divide(Math.floor(n / 100)) + 'Ratus ' + divide(n % 100);
    return String(n) + ' '; 
  };
  
  let text = divide(num).trim();
  if (!text) return val;
  text = text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  return `${num} (${text})`;
};

// ==========================================
// KOMPONEN GLOBAL EKTRAK
// ==========================================
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

const PaperPage = ({ id, children, paperSize, fontFamily, headerImage, watermarkImage, hideHeader = false, orientation = 'portrait', margins = { top: 10, right: 15, bottom: 15, left: 20 } }) => {
  const isPortrait = orientation === 'portrait';
  const width = paperSize === 'A4' ? (isPortrait ? '210mm' : '297mm') : (isPortrait ? '215.9mm' : '330.2mm');
  const minHeight = paperSize === 'A4' ? (isPortrait ? '297mm' : '210mm') : (isPortrait ? '330.2mm' : '215.9mm');
  const padding = `${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm`;
  
  const pageHeightMM = paperSize === 'A4' ? (isPortrait ? 297 : 210) : (isPortrait ? 330.2 : 215.9);
  const topMarginMM = Number(margins.top) || 10; 
  const printCenterY = (pageHeightMM / 2) - topMarginMM;

  return (
    <div id={id} className="paper-page bg-white text-black relative shrink-0" style={{ width, minHeight, padding, boxSizing: 'border-box', fontFamily, '--print-center-y': `${printCenterY}mm` }}>
      
      <div className="print-hidden" style={{ 
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
          pointerEvents: 'none', zIndex: 50,
          backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent calc(${pageHeightMM}mm - 2px), #ffccc7 calc(${pageHeightMM}mm - 2px), #ffccc7 ${pageHeightMM}mm)`
      }} />

      {watermarkImage && (
        <div className="print-watermark" style={{
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          pointerEvents: 'none', zIndex: 1, opacity: 0.08, width: '65%'
        }}>
          <img src={watermarkImage} alt="Watermark" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
        </div>
      )}

      {!hideHeader && headerImage && (
        <div contentEditable={false} suppressContentEditableWarning className="w-full mb-4 text-center print-kop relative z-10">
          <img src={headerImage} alt="Kop Surat" className="w-full h-auto object-contain mx-auto" style={{ maxWidth: '100%', maxHeight: '150px' }} />
        </div>
      )}
      <div contentEditable={true} suppressContentEditableWarning style={{ outline: 'none', width: '100%', height: '100%', position: 'relative', zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
};

const SignatureBlock = ({ align = 'right', date, greeting, company, name, title }) => {
  const isRight = align === 'right';
  return (
    <table suppressContentEditableWarning style={{ width: '100%', marginTop: '1.5rem', pageBreakInside: 'avoid', borderCollapse: 'collapse', border: 'none', lineHeight: '1.15' }}>
      <tbody>
        <tr>
          {isRight && <td style={{ width: '55%', border: 'none', padding: 0 }}></td>}
          <td style={{ width: '45%', textAlign: 'left', border: 'none', padding: 0, verticalAlign: 'top' }}>
            {date && <p suppressContentEditableWarning style={{ margin: 0, outline:'none' }}>{date}</p>}
            {greeting && <p suppressContentEditableWarning style={{ margin: 0, outline:'none' }}>{greeting}</p>}
            {company && <p suppressContentEditableWarning style={{ margin: 0, outline:'none' }}><V>{company}</V></p>}
            <div style={{ height: '120px' }}></div>
            <p suppressContentEditableWarning className="underline" style={{ margin: 0, outline:'none' }}><V>{name || '________________'}</V></p>
            {title && <p suppressContentEditableWarning style={{ margin: 0, outline:'none' }}><V>{title}</V></p>}
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
  
  const [isLoadingDB, setIsLoadingDB] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

  const [filterPT, setFilterPT] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // STATE KHUSUS UNTUK ALAT BANTU TERBILANG
  const [terbilangInput, setTerbilangInput] = useState('');
  const [terbilangOutput, setTerbilangOutput] = useState('');

  const [masterData, setMasterData] = useState(BLANK_MASTER_DATA);
  const [pengurusData, setPengurusData] = useState(BLANK_PENGURUS_DATA);
  const [pengalamanData, setPengalamanData] = useState(BLANK_PENGALAMAN_DATA);
  const [headerImage, setHeaderImage] = useState(null);
  const [watermarkImage, setWatermarkImage] = useState(null);
  const [pastedSPH, setPastedSPH] = useState('');
  const [autoMerge, setAutoMerge] = useState(true); 
  
  const [fontFamily, setFontFamily] = useState('Arial, sans-serif');
  const [fontSize, setFontSize] = useState(10);
  const [paperSize, setPaperSize] = useState('A4');

  const [marginTop, setMarginTop] = useState(10);
  const [marginRight, setMarginRight] = useState(15);
  const [marginBottom, setMarginBottom] = useState(15);
  const [marginLeft, setMarginLeft] = useState(20);
  
  const activeCellRef = useRef(null);

  const [activeTab, setActiveTab] = useState('master'); 
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  useEffect(() => {
    if (fontFamily) {
      const fontName = fontFamily.replace(/['"]/g, '').split(',')[0].trim();
      if (GOOGLE_FONTS_LIST.includes(fontName)) {
        const linkId = `google-font-${fontName.replace(/\s+/g, '-')}`;
        if (!document.getElementById(linkId)) {
          const link = document.createElement('link');
          link.id = linkId;
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:ital,wght@0,400;0,700;1,400;1,700&display=swap`;
          document.head.appendChild(link);
        }
      }
    }
  }, [fontFamily]);

  useEffect(() => {
    setIsLoadingDB(true);
    const projectsRef = query(ref(db, 'projects'));
    const unsubscribe = onValue(projectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const projectList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        projectList.sort((a, b) => b.updatedAt - a.updatedAt);
        setProjects(projectList);
      } else {
        setProjects([]);
      }
      setIsLoadingDB(false); 
    });
    return () => unsubscribe();
  }, []);

  const createNewProject = () => {
    setMasterData(BLANK_MASTER_DATA);
    setPengurusData(BLANK_PENGURUS_DATA);
    setPengalamanData(BLANK_PENGALAMAN_DATA);
    setHeaderImage(null);
    setWatermarkImage(null);
    setPastedSPH('');
    setPaperSize('A4');
    setFontFamily('Arial, sans-serif');
    setFontSize(10);
    setMarginTop(10);
    setMarginRight(15);
    setMarginBottom(15);
    setMarginLeft(20);
    setCurrentProjectId(null);
    setActiveTab('master');
    setView('editor');
  };

  const editProject = (project) => {
    setMasterData(project.masterData || BLANK_MASTER_DATA);
    setPengurusData(project.pengurusData || BLANK_PENGURUS_DATA);
    setPengalamanData(project.pengalamanData || []);
    setHeaderImage(project.headerImage || null);
    setWatermarkImage(project.watermarkImage || null);
    setPastedSPH(project.pastedSPH || '');
    setAutoMerge(project.autoMerge !== undefined ? project.autoMerge : true);
    setFontFamily(project.fontFamily || 'Arial, sans-serif');
    setFontSize(project.fontSize || 10);
    setPaperSize(project.paperSize || 'A4');
    setMarginTop(project.marginTop ?? 10);
    setMarginRight(project.marginRight ?? 15);
    setMarginBottom(project.marginBottom ?? 15);
    setMarginLeft(project.marginLeft ?? 20);
    setCurrentProjectId(project.id);
    setActiveTab('master');
    setView('editor');
  };

  const saveToCloud = () => {
    const payload = {
      masterData, pengurusData, pengalamanData, headerImage, watermarkImage, pastedSPH, autoMerge, 
      fontFamily, fontSize, paperSize, marginTop, marginRight, marginBottom, marginLeft, updatedAt: Date.now()
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
      namaPekerjaan: (project.masterData?.namaPekerjaan || '') + ' (Copy)'
    };
    const payload = {
      masterData: duplicatedMasterData, pengurusData: project.pengurusData || BLANK_PENGURUS_DATA, pengalamanData: project.pengalamanData || [],
      headerImage: project.headerImage || null, watermarkImage: project.watermarkImage || null, pastedSPH: project.pastedSPH || '', autoMerge: project.autoMerge !== undefined ? project.autoMerge : true,
      fontFamily: project.fontFamily || 'Arial, sans-serif', fontSize: project.fontSize || 10, paperSize: project.paperSize || 'A4', 
      marginTop: project.marginTop ?? 10, marginRight: project.marginRight ?? 15, marginBottom: project.marginBottom ?? 15, marginLeft: project.marginLeft ?? 20, updatedAt: Date.now()
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

  const handleWatermarkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader(); 
    reader.onload = (event) => { setWatermarkImage(event.target.result); };
    reader.readAsDataURL(file); 
  };
  
  const handleTerbilangChange = (e) => {
    const val = e.target.value;
    setTerbilangInput(val);
    if (!val || val.trim() === '') {
        setTerbilangOutput('');
    } else {
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

  useEffect(() => {
    setCurrentPage(1);
  }, [filterPT, searchQuery]);

  const uniquePTs = useMemo(() => { const pts = projects.map(p => p.masterData?.namaPenyedia).filter(Boolean); return ['All', ...new Set(pts)]; }, [projects]);
  
  const filteredProjects = useMemo(() => {
    return projects.filter(proj => {
      const ptMatch = filterPT === 'All' || proj.masterData?.namaPenyedia === filterPT;
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = !searchQuery || (proj.masterData?.namaPekerjaan || '').toLowerCase().includes(searchLower);
      return ptMatch && searchMatch;
    });
  }, [projects, filterPT, searchQuery]);

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProjects.slice(startIndex, startIndex + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

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
    
    while (rawRows.length > 0 && rawRows[0].every(c => !c || c.trim() === '')) {
      rawRows.shift();
    }
    
    while (rawRows.length > 0 && rawRows[rawRows.length - 1].every(c => !c || c.trim() === '')) {
      rawRows.pop();
    }

    let totalRowIdx = -1;
    for (let i = 0; i < rawRows.length; i++) {
      if (rawRows[i].some(c => c && typeof c === 'string' && c.toUpperCase().includes('TOTAL KESELURUHAN'))) {
        totalRowIdx = i;
        break;
      }
    }
    if (totalRowIdx > 0) {
      let i = totalRowIdx - 1;
      while (i >= 0 && rawRows[i].every(c => !c || c.trim() === '')) {
        rawRows.splice(i, 1);
        totalRowIdx--;
        i--;
      }
      
      rawRows.splice(totalRowIdx, 0, ['']);
      rawRows.splice(totalRowIdx, 0, ['']);
    }

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
  // EXPORT HTML / SAVE AS PDF (100% KETIPLEK)
  // ==========================================
  const handleSaveAsPDF = () => {
    const previewElement = document.getElementById('document-preview');
    if (!previewElement) {
        messageApi.error('Gagal menemukan dokumen untuk diunduh.');
        return;
    }

    messageApi.loading('Menyiapkan dokumen PDF presisi...', 1);
    
    setTimeout(() => {
        const printCssStyles = getPrintCSS();
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
            <title>Dokumen ${masterData.namaPekerjaan ? masterData.namaPekerjaan.substring(0, 50) + '...' : 'Pengadaan'}</title>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Courier+Prime&family=Inter:wght@400;600;700&family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Montserrat:ital,wght@0,400;0,600;0,700;1,400&family=Nunito:wght@400;600;700&family=Open+Sans:ital,wght@0,400;0,600;0,700;1,400&family=Oswald:wght@400;600;700&family=PT+Serif:ital,wght@0,400;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Poppins:ital,wght@0,400;0,600;0,700;1,400&family=Roboto+Mono:wght@400;600;700&family=Roboto:ital,wght@0,400;0,500;0,700;1,400&family=Rubik:wght@400;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap">
            <style>
                body { 
                    background-color: white; 
                    margin: 0; 
                    padding: 0; 
                    font-family: ${fontFamily}; 
                    -webkit-font-smoothing: antialiased;
                }
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
            messageApi.success('Dokumen siap! Silakan "Save as PDF" (Simpan sebagai PDF) pada menu yang muncul.');
        } else {
            messageApi.error('Gagal membuka tab. Pastikan fitur pop-up tidak diblokir oleh browser Anda.');
        }
    }, 300);
  };

  const getAlignmentClassRAB = (cell, cellIndex, isNumberingRow = false) => {
    if (isNumberingRow) return 'text-center align-middle font-bold bg-transparent';
    if (!cell) return 'text-center align-middle';
    if (cellIndex === 0) return 'text-center align-middle'; 
    const isDate = /^\s*\d{1,2}\s+(Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des|Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4}\s*$/i.test(cell);
    if (isDate) return 'text-center align-middle';
    if (cellIndex === 1) return 'text-left align-middle'; 
    if (cellIndex === 2) return 'text-center align-middle';
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
      <div className="w-full mt-4" suppressContentEditableWarning>
        <table className="table-bordered" style={{ tableLayout: 'auto', fontSize: '9pt' }}>
          {headerData.hasMergedHeader ? (
            <thead className="bg-transparent">
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
            <thead className="bg-transparent">
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
          <tbody suppressContentEditableWarning>
            {headerData.body.map((row, rowIndex) => {
              const isTotalRow = row.some(cell => cell && cell.toUpperCase().includes('TOTAL KESELURUHAN'));
              const isBoldRow = isRomanNumeral(row[0]);
              const isNumberingRow = checkIsNumberingRow(row);
              
              const isEmptyRow = row.every(c => c.trim() === '');
              if (isEmptyRow) {
                return (
                    <tr key={`tr-${rowIndex}`} className="hover-bg-gray keep-together">
                        {row.map((_, i) => <td key={`td-${rowIndex}-${i}`} className="py-0 px-2" style={{ height: '12px' }}></td>)}
                    </tr>
                );
              }

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
    const marginProps = { top: marginTop, right: marginRight, bottom: marginBottom, left: marginLeft };

    return (
      <>
        {/* ================= SPH ================= */}
        <PaperPage id="page-master" paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage} watermarkImage={watermarkImage} margins={marginProps}>
          <div className="mb-8 text-base-pt leading-relaxed doc-body">
            
            <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
              <V>{masterData.kotaSurat}</V>, <V>{masterData.tglSuratPenawaran}</V>
            </div>

            <table suppressContentEditableWarning className="table-doc" style={{ width: 'auto', marginBottom: '1.5rem', borderCollapse: 'collapse', border: 'none', lineHeight: '1.15' }}>
              <tbody>
                <tr><td className="pr-4 align-top">Nomor</td><td className="align-top">: <V>{masterData.noSuratPenawaran}</V></td></tr>
                <tr><td className="pr-4 align-top">Lampiran</td><td className="align-top">: 1 (satu) berkas</td></tr>
                <tr><td className="pr-4 align-top">Hal</td><td className="align-top">: Penawaran Harga</td></tr>
              </tbody>
            </table>

            <div style={{ lineHeight: '1.15', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0 }}>Kepada Yth.</p>
              <p style={{ margin: 0 }}><V>{formatTitleCase(penerimaSPH)}</V></p>
              <p style={{ margin: 0 }} className="font-bold"><V>{formatTitleCase(masterData.namaInstansi)}</V></p>
              <p style={{ margin: 0 }}>Di Tempat</p>
            </div>

            <div style={{ lineHeight: '1.15', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, marginBottom: '8px' }}>Yang bertanda tangan dibawah ini:</p>
              <table suppressContentEditableWarning className="table-doc w-full mb-2">
                <colgroup><col style={{width:'20%'}}/><col style={{width:'2%'}}/><col style={{width:'78%'}}/></colgroup>
                <tbody>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Nama</td><td className="align-top">:</td><td className="align-top"><V>{toUpper(direkturNama)}</V></td></tr>
                  <tr><td className="align-top" style={{ whiteSpace: 'nowrap' }}>&nbsp;&nbsp;&nbsp;No. Identitas</td><td className="align-top">:</td><td className="align-top"><V>{direkturNik}</V></td></tr>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Jabatan</td><td className="align-top">:</td><td className="align-top"><V>{formatTitleCase(direkturJabatan)}</V></td></tr>
                </tbody>
              </table>
              <p style={{ margin: 0, marginTop: '8px' }}>Dalam hal ini bertindak untuk dan atas nama perusahaan : <V>{toUpper(masterData.namaPenyedia)}</V></p>
            </div>

            <p className="mb-2 text-justify">
              Setelah membaca, meneliti, memahami semua syarat tentang, Pekerjaan <V>{formatTitleCase(masterData.namaPekerjaan)}</V>, dengan ini menyatakan bersedia mengikuti semua syarat-syarat dan ketentuan tersebut untuk melaksanakan pekerjaan dimaksud.
            </p>
            <p className="mb-2 text-justify">
              Adapun penawaran yang kami ajukan harga keseluruhan (lumpsum) sebesar : <span className="font-bold"><V>{masterData.nilaiSPH}</V></span> Terbilang : <span className="font-bold">(<V>{formatTerbilang(masterData.nilaiSPH)}</V>)</span> Dengan rincian dan spesifikasi terlampir.
            </p>
            <p className="mb-2 text-justify">
              Harga penawaran kami tersebut sudah mencakup semua pajak dan bea meterai yang perlu dibayar sesuai dengan ketentuan yang berlaku, sehubungan dengan pelaksanaan pekerjaan tersebut, kami akan sanggup menyelesaikan pelaksanaan seluruh pekerjaan tersebut dalam waktu <V>{formatHari(masterData.waktuPenyelesaian)}</V> hari kalender berturut-turut sesuai dengan jadwal kerja dalam Surat Perjanjian/Kontrak. 
            </p>
            <div className="keep-together">
              <p className="mb-6 text-justify">
                Surat Penawaran ini berlaku dan mengikat selama 30 (Tiga Puluh) hari kerja berturut-turut sejak tanggal pembukaan dokumen penawaran.
              </p>
              <p className="mb-8 text-justify">Demikianlah Surat Penawaran Harga ini kami sampaikan, atas perhatiannya kami ucapkan terima kasih.</p>
              <SignatureBlock align="right" greeting="Hormat kami," company={toUpper(masterData.namaPenyedia)} name={toUpper(direkturNama)} title={formatTitleCase(direkturJabatan)} />
            </div>
          </div>
        </PaperPage>

        {/* ================= LAMPIRAN SPH / TABEL SPH ================= */}
        <PaperPage id="page-sph" paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage} margins={marginProps}>
          <div className="mb-8 text-base-pt leading-relaxed doc-body">
            <div suppressContentEditableWarning style={{ lineHeight: '1.15', marginBottom: '1.5rem' }}>
                <table className="table-doc">
                <tbody>
                    <tr><td className="pr-4 align-top grid-col-auto">Lampiran</td><td className="align-top grid-col-auto">: Surat Penawaran Harga</td></tr>
                    <tr><td className="pr-4 align-top grid-col-auto">Nomor</td><td className="align-top grid-col-auto">: <V>{masterData.noSuratPenawaran}</V></td></tr>
                </tbody>
                </table>
            </div>

            <div className="mb-4">{renderTableSPH(headerDataSPH)}</div>

            <div className="keep-together">
              <p className="mb-8 text-sm text-justify">Terbilang : <V>{formatTerbilang(masterData.nilaiSPH)}</V></p>
              <SignatureBlock align="right" greeting="Hormat kami," company={toUpper(masterData.namaPenyedia)} name={toUpper(direkturNama)} title={formatTitleCase(direkturJabatan)} />
            </div>
          </div>
        </PaperPage>

        {/* ================= PAKTA INTEGRITAS ================= */}
        <PaperPage paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage} watermarkImage={watermarkImage} margins={marginProps}>
          <div className="mb-8 text-base-pt leading-relaxed doc-body">
            <div className="text-center">
              <h3 className="text-lg font-bold underline mb-4">PAKTA INTEGRITAS</h3>
            </div>
            
            <div style={{ lineHeight: '1.15', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, marginBottom: '8px' }}>Saya yang bertanda tangan di bawah ini:</p>
              <table suppressContentEditableWarning className="table-doc w-full">
                <colgroup><col style={{width:'35%'}}/><col style={{width:'2%'}}/><col style={{width:'63%'}}/></colgroup>
                <tbody>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Nama</td><td className="align-top">:</td><td className="align-top"><V>{toUpper(direkturNama)}</V></td></tr>
                  <tr><td className="align-top" style={{ whiteSpace: 'nowrap' }}>&nbsp;&nbsp;&nbsp;No. Identitas</td><td className="align-top">:</td><td className="align-top"><V>{direkturNik}</V></td></tr>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Jabatan</td><td className="align-top">:</td><td className="align-top"><V>{formatTitleCase(direkturJabatan)}</V></td></tr>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Bertindak untuk dan atas nama</td><td className="align-top">:</td><td className="align-top"><V>{toUpper(masterData.namaPenyedia)}</V></td></tr>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Alamat</td><td className="align-top">:</td><td className="align-top"><V>{formatTitleCase(masterData.alamatPenyedia)}</V></td></tr>
                </tbody>
              </table>
            </div>

            <p className="mb-2 text-justify">Dalam rangka <V>{formatTitleCase(masterData.namaPekerjaan)}</V>, dengan ini menyatakan bahwa:</p>
            <ol>
              <li>Tidak akan melakukan praktek Korupsi, Kolusi dan Nepotisme (KKN);</li>
              <li>Akan melaporkan kepada APIP <V>{formatTitleCase(masterData.namaInstansi)}</V> dan/atau LKPP apabila mengetahui ada indikasi KKN di dalam proses pengadaan ini;</li>
              <li>Akan mengikuti proses pengadaan secara bersih, transparan, dan profesional untuk memberikan hasil kerja terbaik sesuai ketentuan peraturan perundang-undangan;</li>
              <li>Apabila melanggar hal-hal yang dinyatakan dalam PAKTA INTEGRITAS ini, bersedia menerima sanksi administratif, menerima sanksi pencantuman dalam Daftar Hitam, digugat secara perdata dan/atau dilaporkan secara pidana.</li>
            </ol>

            <div className="keep-together">
              <p className="mb-8 text-justify">Demikian pernyataan ini kami buat atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>
              <SignatureBlock align="right" date={<><V>{masterData.kotaSurat}</V>, <V>{masterData.tglSuratPenawaran}</V></>} company={toUpper(masterData.namaPenyedia)} name={toUpper(direkturNama)} title={formatTitleCase(direkturJabatan)} />
            </div>
          </div>
        </PaperPage>

        {/* ================= SURAT PERNYATAAN KEBENARAN DOKUMEN ================= */}
        <PaperPage paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage} watermarkImage={watermarkImage} margins={marginProps}>
          <div className="mb-8 text-base-pt leading-relaxed doc-body">
            <div className="text-center">
              <h3 className="text-lg font-bold underline mb-4">SURAT PERNYATAAN KEBENARAN DOKUMEN PERUSAHAAN</h3>
            </div>
            
            <div style={{ lineHeight: '1.15', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, marginBottom: '8px' }}>Yang bertanda tangan di bawah ini:</p>
              <table suppressContentEditableWarning className="table-doc w-full">
                <colgroup><col style={{width:'35%'}}/><col style={{width:'2%'}}/><col style={{width:'63%'}}/></colgroup>
                <tbody>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Nama</td><td className="align-top">:</td><td className="align-top"><V>{toUpper(direkturNama)}</V></td></tr>
                  <tr><td className="align-top" style={{ whiteSpace: 'nowrap' }}>&nbsp;&nbsp;&nbsp;No. Identitas</td><td className="align-top">:</td><td className="align-top"><V>{direkturNik}</V></td></tr>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Jabatan</td><td className="align-top">:</td><td className="align-top"><V>{formatTitleCase(direkturJabatan)}</V></td></tr>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Bertindak untuk dan atas nama</td><td className="align-top">:</td><td className="align-top"><V>{toUpper(masterData.namaPenyedia)}</V></td></tr>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Alamat</td><td className="align-top">:</td><td className="align-top"><V>{formatTitleCase(masterData.alamatPenyedia)}</V></td></tr>
                </tbody>
              </table>
            </div>

            <p className="mb-2 text-justify">Menyatakan dengan sebenarnya bahwa :</p>
            <ol>
              <li>Saya Secara hukum bertindak untuk atas nama Perusahaan <V>{toUpper(masterData.namaPenyedia)}</V> berdasarkan Akta Notaris Nomor : <V>{masterData.noAktaPendirian}</V> Tanggal <V>{masterData.tglAktaPendirian}</V> Notaris : <V>{masterData.aktaPendirian}</V>.</li>
              <li>Data-data perusahaan yang terlampir adalah benar semua dan masih berlaku;</li>
              <li>Apabila dikemudian hari ditemui bahwa data-data yang kami berikan tidak benar, maka saya bersedia dikenai sanksi moral, sanksi administrasi dan bersedia mempertanggungjawabkan secara hukum.</li>
            </ol>

            <div className="keep-together">
              <p className="mb-8 text-justify">Demikian pernyataan ini kami buat atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>
              <SignatureBlock align="right" date={<><V>{masterData.kotaSurat}</V>, <V>{masterData.tglSuratPenawaran}</V></>} company={toUpper(masterData.namaPenyedia)} name={toUpper(direkturNama)} title={formatTitleCase(direkturJabatan)} />
            </div>
          </div>
        </PaperPage>

        {/* ================= SURAT PERNYATAAN TIDAK DALAM PENGAWASAN PENGADILAN ================= */}
        <PaperPage paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage} watermarkImage={watermarkImage} margins={marginProps}>
          <div className="mb-8 text-base-pt leading-relaxed doc-body">
            <div className="text-center">
              <h3 className="text-lg font-bold mb-4">SURAT PERNYATAAN TIDAK DALAM PENGAWASAN PENGADILAN<br/>DAN TIDAK MASUK DALAM DAFTAR HITAM</h3>
            </div>
            
            <div style={{ lineHeight: '1.15', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, marginBottom: '8px' }}>Yang bertanda tangan di bawah ini:</p>
              <table suppressContentEditableWarning className="table-doc w-full">
                <colgroup><col style={{width:'35%'}}/><col style={{width:'2%'}}/><col style={{width:'63%'}}/></colgroup>
                <tbody>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Nama</td><td className="align-top">:</td><td className="align-top"><V>{toUpper(direkturNama)}</V></td></tr>
                  <tr><td className="align-top" style={{ whiteSpace: 'nowrap' }}>&nbsp;&nbsp;&nbsp;No. Identitas</td><td className="align-top">:</td><td className="align-top"><V>{direkturNik}</V></td></tr>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Jabatan</td><td className="align-top">:</td><td className="align-top"><V>{formatTitleCase(direkturJabatan)}</V></td></tr>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Bertindak untuk dan atas nama</td><td className="align-top">:</td><td className="align-top"><V>{toUpper(masterData.namaPenyedia)}</V></td></tr>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Alamat</td><td className="align-top">:</td><td className="align-top"><V>{formatTitleCase(masterData.alamatPenyedia)}</V></td></tr>
                </tbody>
              </table>
            </div>

            <p className="mb-2 text-justify">Menyatakan dengan sebenarnya bahwa :</p>
            <ol>
              <li>Perusahaan yang bersangkutan dan managemenya tidak dalam pengawasan pengadilan;</li>
              <li>Perusahaan tidak bangkrut dan tidak sedang dihentikan usahanya;</li>
              <li>Semua pengurus dan badan usahanya tidak masuk dalam daftar hitam.</li>
            </ol>

            <div className="keep-together">
              <p className="mb-8 text-justify">Demikian pernyataan ini kami buat atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>
              <SignatureBlock align="right" date={<><V>{masterData.kotaSurat}</V>, <V>{masterData.tglSuratPenawaran}</V></>} company={toUpper(masterData.namaPenyedia)} name={toUpper(direkturNama)} title={formatTitleCase(direkturJabatan)} />
            </div>
          </div>
        </PaperPage>

        {/* ================= SURAT PERNYATAAN MINAT ================= */}
        <PaperPage paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage} watermarkImage={watermarkImage} margins={marginProps}>
          <div className="mb-8 text-base-pt leading-relaxed doc-body">
            <div className="text-center">
              <h3 className="text-lg font-bold underline mb-4">SURAT PERNYATAAN MINAT</h3>
            </div>
            
            <div style={{ lineHeight: '1.15', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, marginBottom: '8px' }}>Yang bertanda tangan di bawah ini:</p>
              <table suppressContentEditableWarning className="table-doc w-full">
                <colgroup><col style={{width:'35%'}}/><col style={{width:'2%'}}/><col style={{width:'63%'}}/></colgroup>
                <tbody>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Nama</td><td className="align-top">:</td><td className="align-top"><V>{toUpper(direkturNama)}</V></td></tr>
                  <tr><td className="align-top" style={{ whiteSpace: 'nowrap' }}>&nbsp;&nbsp;&nbsp;No. Identitas</td><td className="align-top">:</td><td className="align-top"><V>{direkturNik}</V></td></tr>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Jabatan</td><td className="align-top">:</td><td className="align-top"><V>{formatTitleCase(direkturJabatan)}</V></td></tr>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Bertindak untuk dan atas nama</td><td className="align-top">:</td><td className="align-top"><V>{toUpper(masterData.namaPenyedia)}</V></td></tr>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Alamat</td><td className="align-top">:</td><td className="align-top"><V>{formatTitleCase(masterData.alamatPenyedia)}</V></td></tr>
                </tbody>
              </table>
            </div>

            <p className="mb-6 text-justify">
              Menyatakan dengan sebenarnya bahwa setelah memahami semua syarat dan penjelasan Pengadaan langsung yang dilaksanakan <V>{formatTitleCase(penerimaSPH)}</V> <V>{formatTitleCase(masterData.namaInstansi)}</V> Tahun <V>{masterData.tahunAnggaran}</V>, maka dengan ini saya menyatakan berminat untuk mengikuti proses <V>{formatTitleCase(masterData.namaPekerjaan)}</V> sampai selesai.
            </p>

            <div className="keep-together">
              <p className="mb-8 text-justify">Demikian pernyataan ini kami buat dengan penuh kesadaran dan rasa tanggung jawab.</p>
              <SignatureBlock align="right" date={<><V>{masterData.kotaSurat}</V>, <V>{masterData.tglSuratPenawaran}</V></>} company={toUpper(masterData.namaPenyedia)} name={toUpper(direkturNama)} title={formatTitleCase(direkturJabatan)} />
            </div>
          </div>
        </PaperPage>

        {/* ================= FORMULIR ISIAN KUALIFIKASI ================= */}
        <PaperPage id="page-pengalaman" paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage} watermarkImage={watermarkImage} margins={marginProps}>
          <div className="mb-8 text-base-pt leading-relaxed doc-body">
            <div className="text-center">
              <h3 className="text-lg font-bold underline mb-4">FORMULIR ISIAN KUALIFIKASI</h3>
            </div>
            
            <div style={{ lineHeight: '1.15', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, marginBottom: '8px' }}>Saya yang bertandatangan di bawah ini :</p>
              <table suppressContentEditableWarning className="table-doc w-full">
                <colgroup><col style={{width:'35%'}}/><col style={{width:'2%'}}/><col style={{width:'63%'}}/></colgroup>
                <tbody>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Nama</td><td className="align-top">:</td><td className="align-top"><V>{toUpper(direkturNama)}</V></td></tr>
                  <tr><td className="align-top" style={{ whiteSpace: 'nowrap' }}>&nbsp;&nbsp;&nbsp;No. Identitas</td><td className="align-top">:</td><td className="align-top"><V>{direkturNik}</V></td></tr>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Jabatan</td><td className="align-top">:</td><td className="align-top"><V>{formatTitleCase(direkturJabatan)}</V></td></tr>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Bertindak untuk dan atas nama</td><td className="align-top">:</td><td className="align-top"><V>{toUpper(masterData.namaPenyedia)}</V></td></tr>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Alamat</td><td className="align-top">:</td><td className="align-top"><V>{formatTitleCase(masterData.alamatPenyedia)}</V></td></tr>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Nomor Telepon</td><td className="align-top">:</td><td className="align-top"><V>{masterData.noHpPenyedia}</V></td></tr>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Email Perusahaan</td><td className="align-top">:</td><td className="align-top"><V>{masterData.emailPenyedia}</V></td></tr>
                </tbody>
              </table>
            </div>

            <p className="mb-2 text-justify">Menyatakan dengan sesungguhnya bahwa:</p>
            <ol>
              <li>Saya secara hukum bertindak untuk dan atas nama perusahaan berdasarkan Akta Pendirian Perseroan Terbatas <V>{toUpper(masterData.namaPenyedia)}</V> berdasarkan Akta Notaris Nomor : <V>{masterData.noAktaPendirian}</V> Tanggal <V>{masterData.tglAktaPendirian}</V> Notaris : <V>{masterData.aktaPendirian}</V>.</li>
              <li>Saya bukan sebagai pegawai Negeri/Sipil/ BUMD/TNI/PolriK/L/D/I (bagi pegawai K/L/D/I yang sedang cuti di luar tanggungan K/L/D/I”), Saya tidak sedang menjalani sanksi pidana;</li>
              <li>Saya tidak sedang dan tidak akan terlibat pertentangan kepentingan dengan para pihak yang terkait, langsung maupun tidak langsung dalam proses pengadaan ini;</li>
              <li>Badan usaha yang saya wakili tidak masuk dalam Daftar Hitam, tidak dalam pengawasan pengadilan, tidak pailit dan kegiatan usahanya tidak sedang dihentikan;</li>
              <li>Salah satu dan/atau semua pengurus badan usaha yang saya wakili tidak masuk dalam Daftar Hitam;</li>
              <li>Data-data badan usaha yang saya wakili adalah sebagai berikut:</li>
            </ol>

            <div suppressContentEditableWarning>
                
                {/* BLOK A */}
                <div className="keep-together mb-6">
                    <p className="font-bold mb-2">A. Data Administrasi</p>
                    <table className="w-full" style={{ borderCollapse: 'collapse', border: '1px solid black' }}>
                       <colgroup><col style={{width:'5%'}}/><col style={{width:'40%'}}/><col style={{width:'2.1%'}}/><col style={{width:'52.9%'}}/></colgroup>
                       <tbody>
                         <tr className="keep-together">
                           <td className="align-top" style={{ padding: '6px 10px', borderBottom: '1px solid black' }}>1.</td>
                           <td className="align-top" style={{ padding: '6px 10px', borderBottom: '1px solid black' }}>Nama Badan Usaha</td>
                           <td className="align-top" style={{ padding: '6px 0', borderBottom: '1px solid black' }}>:</td>
                           <td className="align-top" style={{ padding: '6px 10px', borderBottom: '1px solid black' }}><V>{toUpper(masterData.namaPenyedia)}</V></td>
                         </tr>
                         <tr className="keep-together">
                           <td className="align-top" style={{ padding: '6px 10px', borderBottom: '1px solid black' }}>2.</td>
                           <td className="align-top" style={{ padding: '6px 10px', borderBottom: '1px solid black' }}>Status</td>
                           <td className="align-top" style={{ padding: '6px 0', borderBottom: '1px solid black' }}>:</td>
                           <td className="align-top" style={{ padding: '6px 10px', borderBottom: '1px solid black' }}>
                             <span style={{ display: 'inline-block', width: '26px', height: '26px', border: '1px solid black', textAlign: 'center', lineHeight: '26px', fontSize: '14pt', marginRight: '8px', verticalAlign: 'middle' }}>√</span>
                             <span style={{ verticalAlign: 'middle' }}>Pusat</span>
                             <span style={{ display: 'inline-block', width: '26px', height: '26px', border: '1px solid black', textAlign: 'center', lineHeight: '26px', marginLeft: '32px', marginRight: '8px', verticalAlign: 'middle' }}>&nbsp;</span>
                             <span style={{ verticalAlign: 'middle' }}>Cabang</span>
                           </td>
                         </tr>
                         <tr className="keep-together">
                           <td className="align-top" style={{ padding: '6px 10px', borderBottom: '1px solid black' }}>3.</td>
                           <td colSpan={3} className="p-0" style={{ borderBottom: '1px solid black' }}>
                              <table className="w-full">
                                 <colgroup><col style={{width:'42.1%'}}/><col style={{width:'2.2%'}}/><col style={{width:'55.7%'}}/></colgroup>
                                 <tbody>
                                   <tr>
                                     <td className="align-top" style={{ padding: '6px 10px' }}>Alamat Kantor Pusat</td>
                                     <td className="align-top" style={{ padding: '6px 0' }}>:</td>
                                     <td className="align-top" style={{ padding: '6px 10px' }}><V>{formatTitleCase(masterData.alamatPenyedia)}</V></td>
                                   </tr>
                                   <tr>
                                     <td className="align-top" style={{ padding: '6px 10px' }}>No. Telepon</td>
                                     <td className="align-top" style={{ padding: '6px 0' }}>:</td>
                                     <td className="align-top" style={{ padding: '6px 10px' }}><V>{masterData.noHpPenyedia}</V></td>
                                   </tr>
                                   <tr>
                                     <td className="align-top" style={{ padding: '6px 10px' }}>No. Fax</td>
                                     <td className="align-top" style={{ padding: '6px 0' }}>:</td>
                                     <td className="align-top" style={{ padding: '6px 10px' }}><V>{masterData.tlpFax}</V></td>
                                   </tr>
                                   <tr>
                                     <td className="align-top" style={{ padding: '6px 10px' }}>E-Mail</td>
                                     <td className="align-top" style={{ padding: '6px 0' }}>:</td>
                                     <td className="align-top" style={{ padding: '6px 10px' }}><V>{masterData.emailPenyedia}</V></td>
                                   </tr>
                                 </tbody>
                              </table>
                           </td>
                         </tr>
                         <tr className="keep-together">
                           <td className="align-top" style={{ padding: '6px 10px' }}>4.</td>
                           <td colSpan={3} className="p-0">
                              <table className="w-full">
                                 <colgroup><col style={{width:'42.1%'}}/><col style={{width:'2.2%'}}/><col style={{width:'55.7%'}}/></colgroup>
                                 <tbody>
                                   <tr>
                                     <td className="align-top" style={{ padding: '6px 10px' }}>Alamat Cabang</td>
                                     <td className="align-top" style={{ padding: '6px 0' }}>:</td>
                                     <td className="align-top" style={{ padding: '6px 10px' }}>-</td>
                                   </tr>
                                   <tr>
                                     <td className="align-top" style={{ padding: '6px 10px' }}>No. Telepon</td>
                                     <td className="align-top" style={{ padding: '6px 0' }}>:</td>
                                     <td className="align-top" style={{ padding: '6px 10px' }}>-</td>
                                   </tr>
                                   <tr>
                                     <td className="align-top" style={{ padding: '6px 10px' }}>No. Fax</td>
                                     <td className="align-top" style={{ padding: '6px 0' }}>:</td>
                                     <td className="align-top" style={{ padding: '6px 10px' }}>-</td>
                                   </tr>
                                   <tr>
                                     <td className="align-top" style={{ padding: '6px 10px' }}>E-Mail</td>
                                     <td className="align-top" style={{ padding: '6px 0' }}>:</td>
                                     <td className="align-top" style={{ padding: '6px 10px' }}>-</td>
                                   </tr>
                                 </tbody>
                              </table>
                           </td>
                         </tr>
                       </tbody>
                    </table>
                </div>

                {/* BLOK B */}
                <div className="keep-together mb-6">
                    <p className="font-bold mb-2">B. Izin Usaha</p>
                    <div style={{ border: '1px solid black', padding: '2px 0' }}>
                        <table className="w-full">
                        <colgroup><col style={{width:'5%'}}/><col style={{width:'40%'}}/><col style={{width:'2.1%'}}/><col style={{width:'52.9%'}}/></colgroup>
                        <tbody>
                            <tr><td className="align-top" style={{ padding: '4px 10px' }}>1.</td><td className="align-top" style={{ padding: '4px 10px' }}>Nomor Induk Berusaha</td><td className="align-top" style={{ padding: '4px 0' }}>:</td><td className="align-top" style={{ padding: '4px 10px' }}><V>{masterData.izinUsaha}</V> Tanggal <V>{masterData.tglIzinUsaha}</V></td></tr>
                            <tr><td className="align-top" style={{ padding: '4px 10px' }}>2.</td><td className="align-top" style={{ padding: '4px 10px' }}>Masa berlaku izin usaha</td><td className="align-top" style={{ padding: '4px 0' }}>:</td><td className="align-top" style={{ padding: '4px 10px' }}><V>{masterData.masaBerlakuIzin}</V></td></tr>
                            <tr><td className="align-top" style={{ padding: '4px 10px' }}>3.</td><td className="align-top" style={{ padding: '4px 10px' }}>Instansi pemberi izin usaha</td><td className="align-top" style={{ padding: '4px 0' }}>:</td><td className="align-top" style={{ padding: '4px 10px' }}><V>{masterData.pemberiIzin}</V></td></tr>
                            <tr><td className="align-top" style={{ padding: '4px 10px' }}>4.</td><td className="align-top" style={{ padding: '4px 10px' }}>Kualifikasi Usaha</td><td className="align-top" style={{ padding: '4px 0' }}>:</td><td className="align-top" style={{ padding: '4px 10px' }}><V>{masterData.kualifikasiUsaha || 'Kecil'}</V></td></tr>
                        </tbody>
                        </table>
                    </div>
                </div>

                {/* BLOK C */}
                <div className="keep-together mb-6">
                    <p className="font-bold mb-2">C. Izin Lainnya</p>
                    <div style={{ border: '1px solid black', padding: '2px 0' }}>
                        <table className="w-full">
                        <colgroup><col style={{width:'5%'}}/><col style={{width:'40%'}}/><col style={{width:'2.1%'}}/><col style={{width:'52.9%'}}/></colgroup>
                        <tbody>
                            <tr><td className="align-top" style={{ padding: '4px 10px' }}>1.</td><td className="align-top" style={{ padding: '4px 10px' }}>No. Surat Izin</td><td className="align-top" style={{ padding: '4px 0' }}>:</td><td className="align-top" style={{ padding: '4px 10px' }}>-</td></tr>
                            <tr><td className="align-top" style={{ padding: '4px 10px' }}>2.</td><td className="align-top" style={{ padding: '4px 10px' }}>Masa berlaku izin</td><td className="align-top" style={{ padding: '4px 0' }}>:</td><td className="align-top" style={{ padding: '4px 10px' }}>-</td></tr>
                            <tr><td className="align-top" style={{ padding: '4px 10px' }}>3.</td><td className="align-top" style={{ padding: '4px 10px' }}>Instansi pemberi izin</td><td className="align-top" style={{ padding: '4px 0' }}>:</td><td className="align-top" style={{ padding: '4px 10px' }}>-</td></tr>
                        </tbody>
                        </table>
                    </div>
                </div>

                {/* BLOK D */}
                <div className="keep-together mb-6">
                    <p className="font-bold mb-2">D. Landasan Hukum Pendirian Badan Usaha</p>
                    
                    {/* Kotak Akta Pendirian */}
                    <div style={{ border: '1px solid black', padding: '2px 0', marginBottom: '12px' }}>
                        <table className="w-full">
                        <colgroup><col style={{width:'5%'}}/><col style={{width:'40%'}}/><col style={{width:'2.1%'}}/><col style={{width:'52.9%'}}/></colgroup>
                        <tbody>
                            <tr>
                                <td className="align-top" style={{ padding: '4px 10px' }}>1.</td>
                                <td className="align-top font-bold" colSpan={3} style={{ padding: '4px 10px' }}>Akta Pendirian Perusahaan</td>
                            </tr>
                            <tr>
                                <td className="align-top"></td>
                                <td className="align-top" style={{ padding: '2px 10px 2px 24px' }}>
                                    <div style={{ display: 'flex' }}><span style={{ width: '16px', flexShrink: 0 }}>a.</span><span>Nomor</span></div>
                                </td>
                                <td className="align-top" style={{ padding: '2px 0' }}>:</td>
                                <td className="align-top" style={{ padding: '2px 10px' }}><V>{masterData.noAktaPendirian}</V></td>
                            </tr>
                            <tr>
                                <td className="align-top"></td>
                                <td className="align-top" style={{ padding: '2px 10px 2px 24px' }}>
                                    <div style={{ display: 'flex' }}><span style={{ width: '16px', flexShrink: 0 }}>b.</span><span>Tanggal</span></div>
                                </td>
                                <td className="align-top" style={{ padding: '2px 0' }}>:</td>
                                <td className="align-top" style={{ padding: '2px 10px' }}><V>{masterData.tglAktaPendirian}</V></td>
                            </tr>
                            <tr>
                                <td className="align-top"></td>
                                <td className="align-top" style={{ padding: '2px 10px 2px 24px' }}>
                                    <div style={{ display: 'flex' }}><span style={{ width: '16px', flexShrink: 0 }}>c.</span><span>Nama Notaris</span></div>
                                </td>
                                <td className="align-top" style={{ padding: '2px 0' }}>:</td>
                                <td className="align-top" style={{ padding: '2px 10px' }}><V>{masterData.aktaPendirian}</V></td>
                            </tr>
                            <tr>
                                <td className="align-top"></td>
                                <td className="align-top" style={{ padding: '2px 10px 2px 24px' }}>
                                    <div style={{ display: 'flex' }}><span style={{ width: '16px', flexShrink: 0 }}>d.</span><span>Nomor Pengesahan Kementerian Hukum dan HAM.</span></div>
                                </td>
                                <td className="align-top" style={{ padding: '2px 0' }}>:</td>
                                <td className="align-top" style={{ padding: '2px 10px' }}><V>{masterData.noMenkumham}</V></td>
                            </tr>
                        </tbody>
                        </table>
                    </div>

                    {/* Kotak Akta Perubahan */}
                    <div style={{ border: '1px solid black', padding: '2px 0' }}>
                        <table className="w-full">
                        <colgroup><col style={{width:'5%'}}/><col style={{width:'40%'}}/><col style={{width:'2.1%'}}/><col style={{width:'52.9%'}}/></colgroup>
                        <tbody>
                            <tr>
                                <td className="align-top" style={{ padding: '4px 10px' }}>2.</td>
                                <td className="align-top font-bold" colSpan={3} style={{ padding: '4px 10px' }}>Akta Perubahan Terakhir</td>
                            </tr>
                            <tr>
                                <td className="align-top"></td>
                                <td className="align-top" style={{ padding: '2px 10px 2px 24px' }}>
                                    <div style={{ display: 'flex' }}><span style={{ width: '16px', flexShrink: 0 }}>a.</span><span>Nomor</span></div>
                                </td>
                                <td className="align-top" style={{ padding: '2px 0' }}>:</td>
                                <td className="align-top" style={{ padding: '2px 10px' }}><V>{masterData.noAktaPerubahan || '-'}</V></td>
                            </tr>
                            <tr>
                                <td className="align-top"></td>
                                <td className="align-top" style={{ padding: '2px 10px 2px 24px' }}>
                                    <div style={{ display: 'flex' }}><span style={{ width: '16px', flexShrink: 0 }}>b.</span><span>Tanggal</span></div>
                                </td>
                                <td className="align-top" style={{ padding: '2px 0' }}>:</td>
                                <td className="align-top" style={{ padding: '2px 10px' }}><V>{masterData.tglAktaPerubahan || '-'}</V></td>
                            </tr>
                            <tr>
                                <td className="align-top"></td>
                                <td className="align-top" style={{ padding: '2px 10px 2px 24px' }}>
                                    <div style={{ display: 'flex' }}><span style={{ width: '16px', flexShrink: 0 }}>c.</span><span>Nama Notaris</span></div>
                                </td>
                                <td className="align-top" style={{ padding: '2px 0' }}>:</td>
                                <td className="align-top" style={{ padding: '2px 10px' }}><V>{masterData.aktaPerubahan || '-'}</V></td>
                            </tr>
                            <tr>
                                <td className="align-top"></td>
                                <td className="align-top" style={{ padding: '2px 10px 2px 24px' }}>
                                    <div style={{ display: 'flex' }}><span style={{ width: '16px', flexShrink: 0 }}>d.</span><span>Nomor Pengesahan Kementerian Hukum dan HAM.</span></div>
                                </td>
                                <td className="align-top" style={{ padding: '2px 0' }}>:</td>
                                <td className="align-top" style={{ padding: '2px 10px' }}><V>{masterData.noMenkumhamPerubahan || '-'}</V></td>
                            </tr>
                        </tbody>
                        </table>
                    </div>
                </div>

                {/* BLOK E */}
                <div className="keep-together mb-6">
                    <p className="font-bold mb-2">E. Pengurus Badan Usaha</p>
                    <table className="table-bordered mb-4" style={{ width: '100%' }}>
                    <thead className="bg-transparent">
                        <tr>
                        <th className="p-2 text-center" style={{width:'5%'}}>No</th>
                        <th className="p-2 text-center" style={{width:'40%'}}>Nama</th>
                        <th className="p-2 text-center whitespace-nowrap" style={{width:'25%'}}>No. Identitas</th>
                        <th className="p-2 text-center" style={{width:'30%'}}>Jabatan dalam Badan Usaha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pengurusData.map((p, i) => (
                        <tr key={i}>
                            <td className="p-2 text-center">{i+1}</td>
                            <td className="p-2 text-left" style={{ paddingLeft: '8px' }}><V>{toUpper(p.nama)}</V></td>
                            <td className="p-2 text-center" style={{ whiteSpace: 'nowrap' }}><V>{p.noKtp}</V></td>
                            <td className="p-2 text-center"><V>{formatTitleCase(p.jabatan)}</V></td>
                        </tr>
                        ))}
                    </tbody>
                    </table>

                    <table className="table-bordered" style={{ width: '100%' }}>
                    <thead className="bg-transparent">
                        <tr>
                        <th className="p-2 text-center" style={{width:'5%'}}>No</th>
                        <th className="p-2 text-center" style={{width:'40%'}}>Nama</th>
                        <th className="p-2 text-center whitespace-nowrap" style={{width:'25%'}}>No. Identitas</th>
                        <th className="p-2 text-center" style={{width:'30%'}}>Saham</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pengurusData.map((p, i) => (
                        <tr key={i}>
                            <td className="p-2 text-center">{i+1}</td>
                            <td className="p-2 text-left" style={{ paddingLeft: '8px' }}><V>{toUpper(p.nama)}</V></td>
                            <td className="p-2 text-center" style={{ whiteSpace: 'nowrap' }}><V>{p.noKtp}</V></td>
                            <td className="p-2 text-center"><V>{p.sahamPersen}</V></td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>

                {/* BLOK F */}
                <div className="keep-together mb-6">
                    <p className="font-bold mb-2">F. Data Keuangan</p>
                    <p className="mb-1">1. Pajak</p>
                    <div style={{ border: '1px solid black', padding: '2px 0' }}>
                        <table className="w-full">
                        <colgroup><col style={{width:'5%'}}/><col style={{width:'40%'}}/><col style={{width:'2.1%'}}/><col style={{width:'52.9%'}}/></colgroup>
                        <tbody>
                            <tr><td className="align-top" style={{ padding: '4px 10px' }}>a.</td><td className="align-top" style={{ padding: '4px 10px' }}>Nomor Pokok Wajib Pajak</td><td className="align-top" style={{ padding: '4px 0' }}>:</td><td className="align-top" style={{ padding: '4px 10px' }}><V>{masterData.npwpPenyedia}</V></td></tr>
                            <tr><td className="align-top" style={{ padding: '4px 10px' }}>b.</td><td className="align-top" style={{ padding: '4px 10px' }}>Bukti Laporan Pajak Tahun Terakhir</td><td className="align-top" style={{ padding: '4px 0' }}>:</td><td className="align-top" style={{ padding: '4px 10px' }}><V>{masterData.laporanPajak}</V></td></tr>
                            <tr><td className="align-top" style={{ padding: '4px 10px' }}>c.</td><td className="align-top" style={{ padding: '4px 10px' }}>Surat Keterangan Fiskal</td><td className="align-top" style={{ padding: '4px 0' }}>:</td><td className="align-top" style={{ padding: '4px 10px' }}>-</td></tr>
                        </tbody>
                        </table>
                    </div>
                </div>

                {/* BLOK G */}
                <div className="keep-together mb-6">
                    <p className="font-bold mb-2 uppercase">G. PENGALAMAN PEKERJAAN</p>
                    <div className="w-full text-xs">
                    <table className="table-bordered table-fixed break-words">
                        <colgroup><col style={{ width: '3%' }}/><col className="grid-col-28"/><col className="grid-col-10"/><col className="grid-col-7"/><col className="grid-col-11"/><col className="grid-col-11"/><col className="grid-col-10"/><col className="grid-col-8"/><col className="grid-col-6"/><col className="grid-col-6"/></colgroup>
                        <thead className="bg-transparent">
                        <tr>
                            <th rowSpan={2} className="p-1 text-center align-middle">No</th>
                            <th rowSpan={2} className="p-1 text-center align-middle">Nama Paket Pekerjaan</th>
                            <th rowSpan={2} className="p-1 text-center align-middle">Bidang/Sub Bidang Pekerjaan</th>
                            <th rowSpan={2} className="p-1 text-center align-middle">Lokasi</th>
                            <th colSpan={2} className="p-1 text-center align-middle">Pemberi Tugas / Pengguna Jasa</th>
                            <th colSpan={2} className="p-1 text-center align-middle">Kontrak</th>
                            <th colSpan={2} className="p-1 text-center align-middle">Tgl Selesai Menurut :</th>
                        </tr>
                        <tr>
                            <th className="p-1 text-center align-middle">Nama</th>
                            <th className="p-1 text-center align-middle">Alamat / Telepon</th>
                            <th className="p-1 text-center align-middle">No / Tanggal</th>
                            <th className="p-1 text-center align-middle">Nilai</th>
                            <th className="p-1 text-center align-middle">Kontrak</th>
                            <th className="p-1 text-center align-middle">BA. Serah Terima</th>
                        </tr>
                        </thead>
                        <tbody>
                        {pengalamanData.map((row, i) => (
                            <tr key={row.id} className="hover-bg-gray">
                            <td className="p-1 text-center align-top">{i+1}</td>
                            <td className="p-1 align-top text-justify"><V>{formatTitleCase(row.namaPaket)}</V></td>
                            <td className="p-1 align-top text-center"><V>{formatTitleCase(row.bidang)}</V></td>
                            <td className="p-1 align-top text-center"><V>{formatTitleCase(row.lokasi)}</V></td>
                            <td className="p-1 align-top text-center"><V>{formatTitleCase(row.pemberiNama)}</V></td>
                            <td className="p-1 align-top text-center"><V>{formatTitleCase(row.pemberiAlamat)}</V></td>
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
            </div>

            <div className="keep-together">
              <p className="mb-8 text-justify">
                Demikian Formulir Isian Kualifikasi ini saya buat dengan sebenarnya dan penuh rasa tanggung jawab. Jika dikemudian hari ditemui bahwa data/dokumen yang saya sampaikan tidak benar dan ada pemalsuan, maka saya dan badan usaha yang saya wakili bersedia dikenakan sanksi berupa sanksi administratif, sanksi pencantuman dalam Daftar Hitam, gugatan secara perdata, dan/atau pelaporan secara pidana kepada pihak berwenang sesuai dengan ketentuan peraturan perundang-undangan.
              </p>
              <SignatureBlock align="right" date={<><V>{masterData.kotaSurat}</V>, <V>{masterData.tglSuratPenawaran}</V></>} company={toUpper(masterData.namaPenyedia)} name={toUpper(direkturNama)} title={formatTitleCase(direkturJabatan)} />
            </div>
          </div>
        </PaperPage>

        {/* ================= SURAT PERMOHONAN SERAH TERIMA ================= */}
        <PaperPage paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage} watermarkImage={watermarkImage} margins={marginProps}>
          <div className="mb-8 text-base-pt leading-relaxed doc-body">
            
            <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
              <V>{masterData.kotaSurat}</V>, <V>{masterData.tglSuratPemeriksaan}</V>
            </div>

            <table suppressContentEditableWarning className="table-doc" style={{ width: 'auto', marginBottom: '1.5rem', borderCollapse: 'collapse', border: 'none', lineHeight: '1.15' }}>
              <tbody>
                <tr><td className="pr-4 align-top">Nomor</td><td className="align-top">: <V>{masterData.noSuratPemeriksaan}</V></td></tr>
                <tr><td className="pr-4 align-top">Perihal</td><td className="align-top">: Permohonan Serah Terima Pekerjaan</td></tr>
                <tr><td className="pr-4 align-top">Lampiran</td><td className="align-top">: 1 (Satu) Berkas</td></tr>
              </tbody>
            </table>

            <div style={{ lineHeight: '1.15', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0 }}>Kepada Yth,</p>
              <p style={{ margin: 0 }}><V>{formatTitleCase(penerimaLainnya)}</V></p>
              <p style={{ margin: 0 }} className="font-bold"><V>{formatTitleCase(masterData.namaInstansi)}</V></p>
              <p style={{ margin: 0 }}>Di Tempat</p>
            </div>

            <div suppressContentEditableWarning style={{ lineHeight: '1.15', marginBottom: '1rem' }}>
                <table className="table-doc w-full">
                <colgroup><col style={{width:'15%'}}/><col className="grid-col-2"/><col style={{width:'83%'}}/></colgroup>
                <tbody>
                    <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Perihal</td><td className="align-top">:</td><td className="align-top text-justify"><V>{formatTitleCase(masterData.namaPekerjaan)}</V></td></tr>
                </tbody>
                </table>
            </div>

            <p className="mb-2 text-justify">
              &nbsp;&nbsp;&nbsp;Sehubungan dengan telah selesai Pekerjaan <V>{formatTitleCase(masterData.namaPekerjaan)}</V> dengan Surat Perintah Kerja (SPK) Nomor : <V>{masterData.noSPK}</V> Tanggal <V>{masterData.tglSPK}</V>
            </p>

            <p className="mb-6 text-justify">
              Mohon Kiranya <V>{formatTitleCase(penerimaLainnya)}</V> <V>{formatTitleCase(masterData.namaInstansi)}</V> untuk melakukan Serah Terima Pekerjaan <V>{formatTitleCase(masterData.namaPekerjaan)}</V>.
            </p>

            <div className="keep-together">
              <p className="mb-8 text-justify">Demikian Surat Permohonan ini kami buat atas perhatian dan kerjasamanya, kami ucapkan terima kasih.</p>
              <SignatureBlock align="right" greeting="Hormat Kami," company={toUpper(masterData.namaPenyedia)} name={toUpper(direkturNama)} title={formatTitleCase(direkturJabatan)} />
            </div>
          </div>
        </PaperPage>

        {/* ================= SURAT PERMOHONAN PEMBAYARAN ================= */}
        <PaperPage paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage} watermarkImage={watermarkImage} margins={marginProps}>
          <div className="mb-8 text-base-pt leading-relaxed doc-body">
            
            <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
              <V>{masterData.kotaSurat}</V>, <V>{masterData.tglSuratPembayaran}</V>
            </div>

            <table suppressContentEditableWarning className="table-doc" style={{ width: 'auto', marginBottom: '1.5rem', borderCollapse: 'collapse', border: 'none', lineHeight: '1.15' }}>
              <tbody>
                <tr><td className="pr-4 align-top">Nomor</td><td className="align-top">: <V>{masterData.noSuratPembayaran}</V></td></tr>
                <tr><td className="pr-4 align-top">Perihal</td><td className="align-top">: Permohonan Pembayaran Pekerjaan</td></tr>
                <tr><td className="pr-4 align-top">Lampiran</td><td className="align-top">: 1 (Satu) Berkas</td></tr>
              </tbody>
            </table>

            <div style={{ lineHeight: '1.15', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0 }}>Kepada Yth,</p>
              <p style={{ margin: 0 }}><V>{formatTitleCase(penerimaLainnya)}</V></p>
              {masterData.divisiInstansi && masterData.divisiInstansi !== '_____' && <p style={{ margin: 0 }}><V>{formatTitleCase(masterData.divisiInstansi)}</V></p>}
              <p style={{ margin: 0 }} className="font-bold"><V>{formatTitleCase(masterData.namaInstansi)}</V></p>
              <p style={{ margin: 0 }}>Di Tempat</p>
            </div>

            <p className="mb-2 text-justify">Dengan hormat,</p>
            <p className="mb-2 text-justify">
              Sehubungan dengan <V>{formatTitleCase(masterData.namaPekerjaan)}</V>. Maka dengan ini kami mengajukan permohonan pembayaran pelunasan pekerjaan 100%, sebesar <span className="font-bold"><V>{masterData.nilaiSPK}</V></span> <span className="font-bold">(<V>{formatTerbilang(masterData.nilaiSPK)}</V>)</span> , biaya tersebut sudah termasuk pajak-pajak.
            </p>

            <p className="mb-2 text-justify">Kami memohon pembayaran dapat dilakukan dengan metode transfer pada rekening berikut :</p>
            
            <div suppressContentEditableWarning style={{ lineHeight: '1.15', marginBottom: '1rem' }}>
                <table className="table-doc w-full">
                <colgroup><col style={{width:'5%'}}/><col className="grid-col-30"/><col className="grid-col-2"/><col className="grid-col-63"/></colgroup>
                <tbody>
                    <tr><td className="align-top">&nbsp;&nbsp;&nbsp;&bull;</td><td className="align-top">Bank</td><td className="align-top">:</td><td className="align-top"><V>{masterData.bankPenyedia}</V></td></tr>
                    <tr><td className="align-top">&nbsp;&nbsp;&nbsp;&bull;</td><td className="align-top">Cabang</td><td className="align-top">:</td><td className="align-top"><V>{masterData.cabangBank || '-'}</V></td></tr>
                    <tr><td className="align-top">&nbsp;&nbsp;&nbsp;&bull;</td><td className="align-top">Atas Nama</td><td className="align-top">:</td><td className="align-top"><V>{toUpper(masterData.rekeningAtasNama)}</V></td></tr>
                    <tr><td className="align-top">&nbsp;&nbsp;&nbsp;&bull;</td><td className="align-top">Nomor Rekening</td><td className="align-top">:</td><td className="align-top"><V>{masterData.rekeningNomor}</V></td></tr>
                </tbody>
                </table>
            </div>

            <div className="keep-together">
              <p className="mb-8 text-justify">Demikian Surat Permohonan ini kami buat atas perhatian dan kerjasamanya, kami ucapkan terima kasih.</p>
              <SignatureBlock align="right" greeting="Hormat Kami," company={toUpper(masterData.namaPenyedia)} name={toUpper(direkturNama)} title={formatTitleCase(direkturJabatan)} />
            </div>
          </div>
        </PaperPage>

        {/* ================= KWITANSI ================= */}
        <PaperPage paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage} watermarkImage={watermarkImage} margins={marginProps}>
          <div className="mb-8 relative border-2-double text-base-pt leading-relaxed doc-body">
            <h3 className="font-bold text-xl tracking-widest mb-8 text-center border-b-2">KWITANSI</h3>
            
            <table suppressContentEditableWarning className="table-doc w-full mb-10" style={{ lineHeight: '1.25' }}>
              <colgroup><col style={{width:'25%'}}/><col className="grid-col-2"/><col style={{width:'73%'}}/></colgroup>
              <tbody>
                <tr>
                  <td className="pb-4 align-top italic">Nomor</td>
                  <td className="pb-4 align-top">:</td>
                  <td className="pb-4 align-top"><V>{masterData.noSuratKwitansi}</V></td>
                </tr>
                <tr>
                  <td className="pb-4 align-top italic">Sudah Diterima</td>
                  <td className="pb-4 align-top">:</td>
                  <td className="pb-4 align-top">
                    <V>{formatTitleCase(penerimaLainnya)}</V> {masterData.divisiInstansi && masterData.divisiInstansi !== '_____' ? <V>{formatTitleCase(masterData.divisiInstansi)}</V> : ''}
                    <br />
                    <V>{formatTitleCase(masterData.namaInstansi)}</V>
                  </td>
                </tr>
                <tr>
                  <td className="pb-4 align-top italic">Jumlah</td>
                  <td className="pb-4 align-top">:</td>
                  <td className="pb-4 align-top italic"><V>{masterData.nilaiSPK}</V></td>
                </tr>
                <tr>
                  <td className="pb-4 align-top italic">Terbilang</td>
                  <td className="pb-4 align-top">:</td>
                  <td className="pb-4 align-top font-bold text-justify">
                    (<V>{formatTerbilang(masterData.nilaiSPK)}</V>)
                  </td>
                </tr>
                <tr>
                  <td className="pb-4 align-top italic">Untuk Pembayaran</td>
                  <td className="pb-4 align-top">:</td>
                  <td className="pb-4 align-top text-justify">
                    <V>{formatTitleCase(masterData.namaPekerjaan)}</V> Sesuai dengan Surat Perintah Kerja (SPK) : <V>{masterData.noSPK}</V> Tanggal <V>{masterData.tglSPK}</V>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="keep-together">
              <SignatureBlock align="right" date={<><V>{masterData.kotaSurat}</V>, <V>{masterData.tglSuratKwitansi}</V></>} company={toUpper(masterData.namaPenyedia)} name={toUpper(direkturNama)} title={formatTitleCase(direkturJabatan)} />
            </div>
          </div>
        </PaperPage>

        {/* ================= SAMPUL DOKUMEN KUALIFIKASI ================= */}
        <PaperPage paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage} watermarkImage={watermarkImage} margins={marginProps}>
          <div className="doc-body text-center" style={{ paddingTop: '10%' }}>
            <h1 className="font-bold uppercase" style={{ fontSize: '20pt', marginBottom: '2rem' }}>DOKUMEN KUALIFIKASI</h1>
            <p style={{ marginBottom: '1rem', fontSize: '14pt' }}>Untuk Pekerjaan</p>
            <p className="font-bold" style={{ fontSize: '14pt', margin: '0 auto', maxWidth: '85%', lineHeight: '1.5' }}>
              <V>{formatTitleCase(masterData.namaPekerjaan)}</V>
            </p>
            <div style={{ height: '200px' }}></div>
            <h2 className="font-bold uppercase" style={{ fontSize: '20pt' }}><V>{toUpper(masterData.namaPenyedia)}</V></h2>
          </div>
        </PaperPage>

        {/* ================= SURAT PERTANGGUNG JAWABAN MUTLAK ================= */}
        <PaperPage paperSize={paperSize} fontFamily={fontFamily} headerImage={headerImage} watermarkImage={watermarkImage} margins={marginProps}>
          <div className="mb-8 text-base-pt leading-relaxed doc-body">
            <div className="text-center mb-10">
              <h3 className="font-bold text-lg mb-1">SURAT PERTANGGUNG JAWABAN MUTLAK</h3>
              <p className="font-bold text-sm" style={{maxWidth: '48rem', margin: '0 auto'}}><V>{toUpper(masterData.namaPekerjaan)}</V></p>
            </div>

            <div suppressContentEditableWarning style={{ lineHeight: '1.15', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, marginBottom: '8px' }}>Yang bertanda tangan di bawah ini:</p>
              <table className="table-doc w-full">
                <colgroup><col style={{width:'35%'}}/><col style={{width:'2%'}}/><col style={{width:'63%'}}/></colgroup>
                <tbody>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Nama</td><td className="align-top">:</td><td className="align-top"><V>{toUpper(direkturNama)}</V></td></tr>
                  <tr><td className="align-top" style={{ whiteSpace: 'nowrap' }}>&nbsp;&nbsp;&nbsp;No. Identitas</td><td className="align-top">:</td><td className="align-top"><V>{direkturNik}</V></td></tr>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Jabatan</td><td className="align-top">:</td><td className="align-top"><V>{formatTitleCase(direkturJabatan)}</V></td></tr>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Bertindak untuk dan atas nama</td><td className="align-top">:</td><td className="align-top"><V>{toUpper(masterData.namaPenyedia)}</V></td></tr>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Alamat</td><td className="align-top">:</td><td className="align-top"><V>{formatTitleCase(masterData.alamatPenyedia)}</V></td></tr>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Nomor Telepon</td><td className="align-top">:</td><td className="align-top"><V>{masterData.noHpPenyedia}</V></td></tr>
                  <tr><td className="align-top">&nbsp;&nbsp;&nbsp;Email Perusahaan</td><td className="align-top">:</td><td className="align-top"><V>{masterData.emailPenyedia}</V></td></tr>
                </tbody>
              </table>
            </div>

            <p className="mb-2 text-justify">Menyatakan dengan sebenarnya bahwa :</p>
            <ol>
              <li>
                <V>{toUpper(masterData.namaPenyedia)}</V> telah melakukan kontrak <V>{formatTitleCase(masterData.namaPekerjaan)}</V> Sesuai dengan Surat Perintah Kerja (SPK) : <V>{masterData.noSPK}</V> Tanggal <V>{masterData.tglSPK}</V>.
              </li>
              <li>
                Nilai Kesepakatan Kontrak Sebesar : <span className="font-bold"><V>{masterData.nilaiSPK}</V></span> <span className="font-bold">(<V>{formatTerbilang(masterData.nilaiSPK)}</V>)</span>
              </li>
              <li>
                Lama Pekerjaan <V>{formatHari(masterData.waktuPenyelesaian)}</V> hari Kalender.
              </li>
              <li>
                Jika dikemudian hari ternyata ada temuan dari aparat pemeriksa internal (inspektorat) dan eksternal (BPK RI) terkait harga yang berdampak menimbulkan kerugian Negara, kami siap dan bertanggungjawab untuk mengembalikan kerugian negara tersebut ke kas Negara serta bersedia dikenakan sanksi sesuai dengan ketentuan peraturan perundang-undangan yang berlaku.
              </li>
            </ol>

            <div className="keep-together">
              <p className="mb-8 text-justify">
                Demikian surat pernyataan pertanggung Jawaban Mutlak ini dibuat dengan sebenar-benarnya dan tanpa ada paksaan dari pihak manapun.
              </p>
              <SignatureBlock align="right" date={<><V>{masterData.kotaSurat}</V>, <V>{masterData.tglSuratPembayaran}</V></>} company={toUpper(masterData.namaPenyedia)} name={toUpper(direkturNama)} title={formatTitleCase(direkturJabatan)} />
            </div>
          </div>
        </PaperPage>
      </>
    );
  };

  const renderFormSection = (title, fields) => (
    <Card 
      size="small" 
      title={<span style={{fontSize: '13px', fontWeight: 'bold', color: '#1f2937'}}>{title}</span>} 
      style={{ marginBottom: 16, borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}
      headStyle={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', borderRadius: '8px 8px 0 0', padding: '0 16px' }}
      bodyStyle={{ padding: '16px 16px 4px 16px' }}
    >
      <Row gutter={12}>
        {fields.map(f => (
          <Col span={f.span || 12} key={f.key}>
            <FormGroup label={f.label}>
              {f.type === 'textarea' ? (
                <TextArea name={f.key} value={masterData[f.key] || ''} onChange={handleMasterDataChange} autoSize={{minRows:2}} style={{ borderRadius: '6px' }} />
              ) : (
                <Input name={f.key} value={masterData[f.key] || ''} onChange={handleMasterDataChange} style={{ borderRadius: '6px' }} />
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
        <div style={{ background: 'linear-gradient(to right, #e6f7ff, #bae0ff)', padding: '16px', borderRadius: '8px', border: '1px solid #91d5ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, boxShadow: '0 2px 4px rgba(0,109,217,0.1)' }}>
          <span style={{ fontSize: 13, color: '#096dd9', fontWeight: 'bold' }}>Isi Data Master Proyek</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
            <Space>
               {watermarkImage && (
                  <Button size="small" danger onClick={() => setWatermarkImage(null)}>Hapus Watermark</Button>
               )}
               <div style={{ position: 'relative', display: 'inline-block' }}>
                 <Button size="small" icon={<ImageIcon size={14}/>}>Upload Watermark</Button>
                 <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleWatermarkUpload} 
                    onClick={(e) => { e.target.value = null }} 
                    style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 10 }} 
                    title="Upload Logo Transparan untuk Latar Belakang" 
                 />
               </div>
            </Space>
          </div>
        </div>

        {renderFormSection("Informasi Pekerjaan", [
          { key: 'namaPekerjaan', label: 'Nama Pekerjaan', type: 'textarea', span: 24 },
          { key: 'waktuPenyelesaian', label: 'Waktu Penyelesaian (Hari)', span: 12 },
          { key: 'nilaiSPH', label: 'Nilai SPH', span: 12 },
          { key: 'nilaiSPK', label: 'Nilai SPK', span: 12 },
        ])}

        {renderFormSection("Penomoran Surat", [
          { key: 'noSuratPenawaran', label: 'No. SPH', span: 12 },
          { key: 'tglSuratPenawaran', label: 'Tgl SPH', span: 12 },
          { key: 'noSPK', label: 'No. SPK', span: 12 },
          { key: 'tglSPK', label: 'Tgl SPK', span: 12 },
          { key: 'noSuratPemeriksaan', label: 'No. Surat Terima Pekerjaan (STP)', span: 12 },
          { key: 'tglSuratPemeriksaan', label: 'Tgl Surat Terima Pekerjaan (STP)', span: 12 },
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
          { key: 'bankPenyedia', label: 'Bank', span: 6 },
          { key: 'cabangBank', label: 'Cabang Bank', span: 6 },
          { key: 'rekeningNomor', label: 'No. Rekening', span: 6 },
          { key: 'rekeningAtasNama', label: 'Atas Nama', span: 6 },
        ])}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
           <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937' }}>Data Pengurus Perusahaan</span>
           <Button size="small" type="primary" onClick={handleAddPengurus} icon={<Plus size={14} />}>Tambah</Button>
        </div>
        {pengurusData.map((p) => (
          <Card key={p.id} size="small" style={{ marginBottom: 12, borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }} extra={pengurusData.length > 1 && <Button danger type="text" icon={<Trash2 size={14}/>} onClick={() => handleRemovePengurus(p.id)} />}>
             <Row gutter={12}>
                <Col span={8}><FormGroup label="Nama"><Input value={p.nama} onChange={e => handlePengurusChange(p.id, 'nama', e.target.value)} style={{ borderRadius: '6px' }}/></FormGroup></Col>
                <Col span={6}><FormGroup label="Jabatan"><Input value={p.jabatan} onChange={e => handlePengurusChange(p.id, 'jabatan', e.target.value)} style={{ borderRadius: '6px' }}/></FormGroup></Col>
                <Col span={6}><FormGroup label="No Identitas"><Input value={p.noKtp} onChange={e => handlePengurusChange(p.id, 'noKtp', e.target.value)} style={{ borderRadius: '6px' }}/></FormGroup></Col>
                <Col span={4}><FormGroup label="Saham (%)"><Input value={p.sahamPersen} onChange={e => handlePengurusChange(p.id, 'sahamPersen', e.target.value)} style={{ borderRadius: '6px' }}/></FormGroup></Col>
             </Row>
          </Card>
        ))}

        <Divider style={{ margin: '24px 0' }} />

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
          { key: 'kotaSurat', label: 'Kota Surat (Utk Tanda Tangan)', span: 24 },
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
          margin: 10mm 15mm 15mm 20mm; /* Added default page margins for all printed pages */
      }

      .doc-body { font-size: ${fontSize}pt; line-height: 1.5; color: black; }
      
      /* GLOBAL OVERRIDE: Prevent tables from stretching texts (Fixes Image 3 and Image 4 gaps) */
      .doc-body table td { text-align: left; }
      
      /* Explicit justifications only where necessary */
      .text-justify { text-align: justify; }
      
      .text-right { text-align: right !important; }
      .text-center { text-align: center !important; }
      .text-left { text-align: left !important; }
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
      
      .align-top { vertical-align: top; }
      .align-middle { vertical-align: middle; }
      .w-full { width: 100%; }
      .mx-auto { margin-left: auto; margin-right: auto; }
      
      .p-0 { padding: 0 !important; }
      .p-1-5 { padding: 0.375rem; }
      .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
      .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
      .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
      
      /* CSS Global Untuk List Bawaan & Toolbar */
      ol { list-style-type: decimal; padding-left: 2rem; margin-bottom: 1rem; }
      ul { list-style-type: disc; padding-left: 2rem; margin-bottom: 1rem; }
      li { margin-bottom: 0.5rem; text-align: justify; }
      
      .table-doc { width: 100%; border-collapse: collapse; font-size: ${fontSize}pt; }
      .table-doc td { padding-bottom: 0px; vertical-align: top; border: none; }
      
      .table-bordered { width: 100%; border-collapse: collapse; border: 1px solid black; }
      .table-bordered th, .table-bordered td { border: 1px solid black; padding: 4px; word-wrap: break-word; }
      .table-fixed { table-layout: fixed; }
      
      .bg-white { background-color: #ffffff; }
      .bg-transparent { background-color: transparent; }
      
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
      .whitespace-nowrap { white-space: nowrap !important; }
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
          /* Memaksa browser mengeprint warna background tabel, sel, dan watermark */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          
          body, html { background-color: white !important; margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; }
          .print-hidden { display: none !important; }
          
          /* Hilangkan warna biru variabel saat print */
          .var-protect { background-color: transparent !important; color: inherit !important; padding: 0 !important; border: none !important; }
          
          /* Pastikan watermark terprint dengan baik dan posisinya mutlak di tengah kertas cetak */
          .print-watermark { opacity: 0.08 !important; display: flex !important; top: var(--print-center-y) !important; }

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
             position: relative !important;
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

            {/* ALAT BANTU TERBILANG DI SINI */}
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

            <Spin spinning={isLoadingDB} tip="Memuat data dari database..." size="large">
              {filteredProjects.length === 0 && !isLoadingDB ? (
                <div style={{ textAlign: 'center', padding: '80px 0', border: '2px dashed #d9d9d9', borderRadius: 8, background: 'white' }}>
                  <Database size={64} color="#d9d9d9" style={{ margin: '0 auto 16px' }} />
                  <Title level={4} style={{ color: '#8c8c8c' }}>{projects.length === 0 ? 'Belum ada proyek tersimpan.' : 'Tidak ada proyek yang sesuai dengan pencarian.'}</Title>
                  <Text type="secondary">{projects.length === 0 ? 'Klik tombol "Buat Proyek Baru" di atas untuk memulai.' : 'Coba ganti kata kunci pencarian atau pilih PT yang lain.'}</Text>
                </div>
              ) : (
                <>
                  <Row gutter={[24, 24]}>
                    {paginatedProjects.map(proj => (
                      <Col xs={24} lg={12} xl={12} key={proj.id}>
                        <Card hoverable style={{ height: '100%', display: 'flex', flexDirection: 'column' }} bodyStyle={{ flex: 1, padding: '16px' }} actions={[<Button type="link" icon={<Edit2 size={14} />} onClick={() => editProject(proj)} style={{ width: '100%' }}>Buka Editor</Button>]}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <Text style={{ fontSize: '10px', background: '#e6f7ff', color: '#096dd9', padding: '2px 8px', borderRadius: 4, fontWeight: 'bold' }}>{new Date(proj.updatedAt).toLocaleString('id-ID')}</Text>
                            <Space>
                              <Button type="text" size="small" icon={<Copy size={14} />} onClick={() => duplicateProject(proj)} />
                              <Popconfirm title="Hapus proyek permanen?" onConfirm={() => deleteProject(proj.id)}><Button type="text danger" size="small" icon={<Trash2 size={14} />} /></Popconfirm>
                            </Space>
                          </div>
                          
                          <div style={{ marginBottom: '14px' }}>
                            {renderHighlightedTitle(proj.masterData?.namaPekerjaan)}
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                               <Briefcase size={12} style={{ verticalAlign: '-2px', marginRight: 4 }}/> 
                               {proj.masterData?.namaPenyedia && proj.masterData.namaPenyedia !== '_____' ? toUpper(proj.masterData.namaPenyedia) : '-'}
                            </Text>

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
                                <tr><td style={{ color: '#8c8c8c' }}>STP</td><td style={{ fontWeight: 'bold' }}>{proj.masterData?.noSuratPemeriksaan || '-'}</td><td style={{ textAlign: 'right', color: '#8c8c8c' }}>{proj.masterData?.tglSuratPemeriksaan || '-'}</td></tr>
                                <tr><td style={{ color: '#8c8c8c' }}>Pembayaran</td><td style={{ fontWeight: 'bold' }}>{proj.masterData?.noSuratPembayaran || '-'}</td><td style={{ textAlign: 'right', color: '#8c8c8c' }}>{proj.masterData?.tglSuratPembayaran || '-'}</td></tr>
                                <tr><td style={{ color: '#8c8c8c' }}>Kwitansi</td><td style={{ fontWeight: 'bold' }}>{proj.masterData?.noSuratKwitansi || '-'}</td><td style={{ textAlign: 'right', color: '#8c8c8c' }}>{proj.masterData?.tglSuratKwitansi || '-'}</td></tr>
                              </tbody>
                            </table>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                  
                  {/* KOMPONEN PAGINATION DITAMBAHKAN DI SINI */}
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
              <Select 
                value={fontFamily} 
                onChange={setFontFamily} 
                style={{ width: 160 }} 
                showSearch 
                filterOption={(input, option) =>
                  (option?.searchval ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {FONT_OPTIONS.map(font => (
                    <Option key={font.label} value={font.value} searchval={font.label}>
                        <span style={{ fontFamily: font.value }}>{font.label}</span>
                    </Option>
                ))}
              </Select>
              <Select value={fontSize} onChange={setFontSize} style={{ width: 85 }} title="Ukuran Font">
                <Option value={10}>10 pt</Option>
                <Option value={11}>11 pt</Option>
                <Option value={12}>12 pt</Option>
                <Option value={13}>13 pt</Option>
                <Option value={14}>14 pt</Option>
              </Select>

              <Popover placement="bottomRight" title="Atur Margin Kertas (mm)" content={
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '220px' }}>
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
              } trigger="click">
                <Button icon={<Settings size={16}/>}>Margin</Button>
              </Popover>
              
              <Button type="primary" style={{ background: '#52c41a' }} icon={<Save size={16}/>} onClick={saveToCloud}>Simpan</Button>
              <Button type="primary" style={{ background: '#1890ff' }} icon={<FileDown size={16}/>} onClick={handleSaveAsPDF}>Save as PDF</Button>
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
                <Tabs 
                  activeKey={activeTab} 
                  onChange={handleTabChange} 
                  centered
                  style={{ position: 'sticky', top: 0, zIndex: 10, background: '#ffffff', borderBottom: '1px solid #f0f0f0', padding: '0 16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
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
                      <div style={{ background: 'linear-gradient(to right, #f6ffed, #d9f7be)', padding: '16px', borderRadius: '8px', border: '1px solid #b7eb8f', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(56,158,13,0.1)' }}>
                          <span style={{ fontSize: 13, color: '#389e0d', fontWeight: 'bold' }}>Isi Data Pengalaman manual</span>
                          <Button type="primary" size="small" style={{ background: '#52c41a' }} icon={<Plus size={14}/>} onClick={handleAddPengalaman}>Tambah</Button>
                      </div>
                      {pengalamanData.map((item, index) => (
                          <Card key={item.id} size="small" title={<span style={{fontWeight: 'bold', color: '#1f2937'}}>Pengalaman Pekerjaan #{index + 1}</span>} style={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} headStyle={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', borderRadius: '8px 8px 0 0' }} extra={pengalamanData.length > 1 && <Button danger type="text" icon={<Trash2 size={14}/>} onClick={() => handleRemovePengalaman(item.id)} />}>
                              <FormGroup label="Nama Paket Pekerjaan">
                                 <TextArea value={item.namaPaket} onChange={e=>handlePengalamanChange(item.id, 'namaPaket', e.target.value)} autoSize={{ minRows: 2 }} style={{ borderRadius: '6px' }} />
                              </FormGroup>
                              <Row gutter={12}>
                                  <Col span={12}><FormGroup label="Bidang / Sub"><Input value={item.bidang} onChange={e=>handlePengalamanChange(item.id, 'bidang', e.target.value)} style={{ borderRadius: '6px' }} /></FormGroup></Col>
                                  <Col span={12}><FormGroup label="Lokasi"><Input value={item.lokasi} onChange={e=>handlePengalamanChange(item.id, 'lokasi', e.target.value)} style={{ borderRadius: '6px' }} /></FormGroup></Col>
                              </Row>
                              <Divider style={{ margin: '12px 0' }} />
                              <Row gutter={12}>
                                  <Col span={12}><FormGroup label="Pemberi Tugas (Nama)"><Input value={item.pemberiNama} onChange={e=>handlePengalamanChange(item.id, 'pemberiNama', e.target.value)} style={{ borderRadius: '6px' }} /></FormGroup></Col>
                                  <Col span={12}><FormGroup label="Alamat Pemberi Tugas"><Input value={item.pemberiAlamat} onChange={e=>handlePengalamanChange(item.id, 'pemberiAlamat', e.target.value)} style={{ borderRadius: '6px' }} /></FormGroup></Col>
                              </Row>
                              <Divider style={{ margin: '12px 0' }} />
                              <Row gutter={12}>
                                  <Col span={12}><FormGroup label="No & Tgl Kontrak"><TextArea value={item.kontrakNoTgl} onChange={e=>handlePengalamanChange(item.id, 'kontrakNoTgl', e.target.value)} autoSize={{minRows:2}} style={{ borderRadius: '6px' }} /></FormGroup></Col>
                                  <Col span={12}><FormGroup label="Nilai Kontrak"><Input value={item.kontrakNilai} onChange={e=>handlePengalamanChange(item.id, 'kontrakNilai', e.target.value)} style={{marginTop: 4, borderRadius: '6px'}} /></FormGroup></Col>
                              </Row>
                              <Divider style={{ margin: '12px 0' }} />
                              <Row gutter={12}>
                                  <Col span={12}><FormGroup label="Selesai (Kontrak)"><TextArea value={item.selesaiKontrak} onChange={e=>handlePengalamanChange(item.id, 'selesaiKontrak', e.target.value)} autoSize={{minRows:2}} style={{ borderRadius: '6px' }} /></FormGroup></Col>
                                  <Col span={12}><FormGroup label="Selesai (BAST)"><TextArea value={item.selesaiBAST} onChange={e=>handlePengalamanChange(item.id, 'selesaiBAST', e.target.value)} autoSize={{minRows:2}} style={{ borderRadius: '6px' }} /></FormGroup></Col>
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