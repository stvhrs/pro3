import React, { useState, useEffect } from 'react';
import { Upload, Plus, Trash2, Download, Copy, FileText, Settings, Image as ImageIcon, Table } from 'lucide-react';

// Fungsi bantuan bawaan untuk mengunduh file
const saveAs = (blob, filename) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// --- HELPER UNTUK KONVERSI ANGKA KE KATA & TITLE CASE ---
const angkaKeKata = (n) => {
  const angka = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  if (n < 12) return angka[n];
  if (n < 20) return angka[n - 10] + " Belas";
  if (n < 100) return angka[Math.floor(n / 10)] + " Puluh" + (n % 10 !== 0 ? " " + angka[n % 10] : "");
  if (n < 200) return "Seratus " + angkaKeKata(n - 100);
  if (n < 1000) return angka[Math.floor(n / 100)] + " Ratus" + (n % 100 !== 0 ? " " + angkaKeKata(n % 100) : "");
  if (n < 2000) return "Seribu " + angkaKeKata(n - 1000);
  if (n < 10000) return angka[Math.floor(n / 1000)] + " Ribu" + (n % 1000 !== 0 ? " " + angkaKeKata(n % 1000) : "");
  return n.toString();
};

const formatTanggalTerbilang = (tglStr) => {
  if (!tglStr) return "";
  const bulanIndo = {
    'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
    'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
  };
  const parts = tglStr.trim().split(/[\s-]+/);
  if (parts.length >= 3) {
    const tgl = parseInt(parts[0]);
    const blnStr = parts[1].toLowerCase();
    const blnIndex = bulanIndo[blnStr];
    const thn = parseInt(parts[2]);
    
    if (!isNaN(tgl) && blnIndex !== undefined && !isNaN(thn)) {
      const d = new Date(thn, blnIndex, tgl);
      const hariArr = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const hariStr = hariArr[d.getDay()];
      
      return `${hariStr} Tanggal ${angkaKeKata(tgl)} Bulan ${parts[1].charAt(0).toUpperCase() + parts[1].slice(1)} Tahun ${angkaKeKata(thn)}`;
    }
  }
  return "";
};

const toTitleCase = (str) => {
  if (!str) return "";
  const lower = ['di', 'ke', 'dari', 'dan', 'atau', 'untuk', 'yang', 'dalam', 'pada', 'tentang'];
  return str.replace(/\w\S*/g, (txt, offset) => {
    if (offset !== 0 && lower.includes(txt.toLowerCase())) {
      return txt.toLowerCase();
    }
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

// --- INITIAL DEFAULT DATA ---
const defaultTemplateData = {
  no_kontrak: '001/KONTRAK/2026', 
  nomor_spk: '364/SPK/PPK.07.02/IV/2026',
  tanggal_spk: '1 April 2026',
  nama_ppk: 'Rio Setiawan,S.STP., M.A.M., M.Sc.In',
  nip_ppk: 'NIP. 19930406 201507 1 002',
  pangkat_ppk: 'Penata TK I / III.d , Analisa SDA Ahli Muda Biro SDMO',
  nama_penyedia: 'Natasya Putri Aulia Dewanti',
  jabatan_penyedia: 'Direktur',
  perusahaan_penyedia: 'PT PUTRA RAHMAT SENTOSA',
  nama_paket: 'Pengadaan Jasa Lainnya Penyelenggaraan Kegiatan Sosialisasi Dalam Rangka Promosi Tentang Pemenuhan Gizi di Kecamatan Getasan , Kabupaten Semarang Provinsi Jawa Tengah',
  nomor_undangan: 'SP-1/PP.PL- 1170 /SES/PROMED/2026',
  tanggal_undangan: '25 Maret 2026',
  nomor_bahpl: 'BAHPL-1/PP.PL- 1170 /SES/PROMED/2026',
  tanggal_bahpl: '31 Maret 2026',
  sumber_dana: 'Dibebankan Atas DIPA Badan Gizi Nasional Tahun Anggaran 2026 Untuk Mata Anggaran Kegiatan (MAK : 7076.PEH.001.051.F.522191) Kontrak Lampsum dan Pembayaraan Melalui LS',
  nilai_kontrak: 'Rp. 189.245.000,- (Seratus delapan puluh sembilan juta dua ratus empat puluh lima ribu rupiah)',
  waktu_pelaksanaan: '1 April s/d 7 April 2026',
  tanggal_bayar: '11 Maret 2026',
  alamat_penyedia: 'Jl. Pramuka Sari 1 No. 7 Blok F, Kel. Rawasari, Kec. Cempaka Putih, Kota Adm. Jakarta Pusat, Provinsi DKI Jakarta',
  nomor_bast: '228/BAST/PPK.07.02/III/2026',
  tanggal_bast: '10 Maret 2026',
  nomor_bap: '228/BAP/PPK.07.02/III/2026',
  tgl_bast_terbilang: 'Selasa Tanggal Sepuluh Bulan Maret Tahun Dua Ribu Dua Puluh Enam',
  tgl_bap_terbilang: 'Rabu Tanggal Sebelas Bulan Maret Tahun Dua Ribu Dua Puluh Enam'
};

export default function App() {
  const [items, setItems] = useState([{ ...defaultTemplateData, id: Date.now() }]);
  const [selectedId, setSelectedId] = useState(items[0].id);
  const [kopSurat, setKopSurat] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isScriptsLoaded, setIsScriptsLoaded] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  useEffect(() => {
    const loadScripts = async () => {
      const loadScript = (src) => new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      try {
        await Promise.all([
          loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'),
          loadScript('https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js'), 
          loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
          loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
        ]);
        setIsScriptsLoaded(true);
      } catch (e) {
        console.error("Gagal memuat library eksternal", e);
      }
    };
    loadScripts();
  }, []);

  const selectedItem = items.find(i => i.id === selectedId) || items[0];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setKopSurat(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field, value) => {
    setItems(items.map(item => {
      if (item.id === selectedId) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'tanggal_bast') {
          updatedItem.tgl_bast_terbilang = formatTanggalTerbilang(value) || updatedItem.tgl_bast_terbilang;
        }
        if (field === 'tanggal_bayar') {
          updatedItem.tgl_bap_terbilang = formatTanggalTerbilang(value) || updatedItem.tgl_bap_terbilang;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleAddItem = () => {
    const newItem = { ...defaultTemplateData, id: Date.now() };
    setItems([...items, newItem]);
    setSelectedId(newItem.id);
  };

  const handleDuplicateItem = (itemToCopy) => {
    const newItem = { ...itemToCopy, id: Date.now() };
    setItems([...items, newItem]);
    setSelectedId(newItem.id);
  };

  const handleDeleteItem = (id) => {
    if (items.length === 1) return alert('Minimal harus ada 1 dokumen.');
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    if (selectedId === id) setSelectedId(newItems[0].id);
  };

  const handleProcessImport = () => {
    if (!importText.trim()) return;
    
    const rows = importText.trim().split('\n');
    const newItems = [];
    
    rows.forEach((row, index) => {
      const cols = row.split('\t').map(c => c.trim());
      
      if (cols.length >= 10) { 
        if (index === 0 && (cols[0].toLowerCase().includes('kontrak') || cols[0].toLowerCase().includes('no'))) return;

        const tglBayar = cols[14] || '';
        const tglBast = cols[17] || '';

        newItems.push({
          id: Date.now() + index,
          no_kontrak: cols[0] || '',
          nama_ppk: cols[1] || '',
          nip_ppk: cols[2] || '',
          perusahaan_penyedia: cols[3] || '',
          nama_penyedia: cols[4] || '',
          jabatan_penyedia: cols[5] || '',
          nama_paket: cols[6] || '',
          nomor_undangan: cols[7] || '',
          nomor_bahpl: cols[8] || '',
          tanggal_bahpl: cols[9] || '',
          nomor_spk: cols[10] || '',
          tanggal_spk: cols[11] || '',
          nilai_kontrak: cols[12] || '',
          waktu_pelaksanaan: cols[13] || '',
          tanggal_bayar: tglBayar,
          alamat_penyedia: cols[15] || '',
          nomor_bast: cols[16] || '',
          tanggal_bast: tglBast,
          nomor_bap: cols[18] || '',
          
          pangkat_ppk: defaultTemplateData.pangkat_ppk,
          tanggal_undangan: defaultTemplateData.tanggal_undangan,
          sumber_dana: defaultTemplateData.sumber_dana,
          tgl_bast_terbilang: formatTanggalTerbilang(tglBast) || '[Format tanggal tidak didukung, ketik manual]',
          tgl_bap_terbilang: formatTanggalTerbilang(tglBayar) || '[Format tanggal tidak didukung, ketik manual]'
        });
      }
    });

    if (newItems.length > 0) {
      setItems(prev => [...prev, ...newItems]);
      setShowImportModal(false);
      setImportText('');
      setSelectedId(newItems[0].id);
    } else {
      alert('Format tidak dikenali. Pastikan copy-paste urutan kolom dari Excel dengan benar.');
    }
  };

  const generateAndDownloadZip = async () => {
    if (items.length === 0) return;
    if (!isScriptsLoaded) {
      alert("Library pembuat PDF sedang dimuat, mohon tunggu beberapa detik dan coba lagi.");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      const JSZip = window.JSZip;
      const { jsPDF } = window.jspdf;

      const zip = new JSZip();
      const totalDocs = items.length;
      let currentDoc = 0;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        const safeName = item.no_kontrak 
          ? item.no_kontrak.replace(/[^a-zA-Z0-9]/g, '_') 
          : (item.nama_penyedia.replace(/[^a-zA-Z0-9]/g, '_') || `Dokumen_${i+1}`);
        
        // Menggunakan unit 'pt' agar pemetaan teks Native PDF lebih sempurna
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const element = document.getElementById(`pdf-wrapper-${item.id}`);

        const originalDisplay = element.style.display;
        element.style.display = 'block';

        // Menggunakan metode html() untuk output TEKS yang bisa di-select & ukuran file ultra-kecil
        await pdf.html(element, {
          x: 0,
          y: 0,
          width: 595.28, 
          windowWidth: element.offsetWidth,
          autoPaging: 'text',
          margin: [0, 0, 0, 0],
          pageBreak: { mode: ['css', 'legacy'] }
        });

        element.style.display = originalDisplay;

        zip.file(`${safeName}.pdf`, pdf.output('blob'));

        currentDoc++;
        setGenerationProgress(Math.round((currentDoc / totalDocs) * 100));
      }

      const zipContent = await zip.generateAsync({ type: 'blob' });
      saveAs(zipContent, `Batch_Dokumen_${new Date().toISOString().split('T')[0]}.zip`);

    } catch (error) {
      console.error("Gagal men-generate PDF:", error);
      alert("Terjadi kesalahan saat memproses file PDF. Pastikan gambar Kop Surat valid.");
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* NAVBAR */}
      <nav className="bg-blue-800 text-white p-4 shadow-md flex justify-between items-center z-10 relative">
        <div className="flex items-center space-x-2">
          <FileText className="w-6 h-6" />
          <h1 className="text-xl font-bold">SPK & Dokumen Lanjutan Generator</h1>
        </div>
        <div className="flex items-center space-x-4">
          <label className="cursor-pointer bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded flex items-center space-x-2 transition-colors">
            <ImageIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{kopSurat ? 'Ganti Kop Surat' : 'Upload Kop Surat'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
          <button 
            onClick={generateAndDownloadZip} 
            disabled={isGenerating}
            className={`px-4 py-2 rounded flex items-center space-x-2 font-bold transition-colors shadow-lg
              ${isGenerating ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 text-white'}`}
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? `Memproses ${generationProgress}%...` : 'Download ZIP Gabungan'}</span>
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR LIST */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center sticky top-0 z-10">
            <h2 className="font-semibold text-gray-700">Daftar Set Dokumen ({items.length})</h2>
            <div className="flex space-x-2">
              <button onClick={() => setShowImportModal(true)} className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors" title="Paste dari Excel">
                <Table className="w-5 h-5" />
              </button>
              <button onClick={handleAddItem} className="p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors" title="Tambah Baru">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 p-2 space-y-2">
            {items.map((item, index) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedId(item.id)}
                className={`p-3 rounded-lg cursor-pointer border transition-all flex justify-between items-center group
                  ${selectedId === item.id ? 'bg-blue-50 border-blue-400 shadow-sm' : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
              >
                <div className="overflow-hidden">
                  <p className="text-xs text-gray-500 mb-1">Set #{index + 1}</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.no_kontrak || item.nama_penyedia || 'Tanpa Nama'}</p>
                  <p className="text-xs text-gray-500 truncate">{item.nomor_spk}</p>
                </div>
                <div className="flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); handleDuplicateItem(item); }} className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN EDITOR FORM */}
        <div className="flex-1 bg-slate-50 overflow-y-auto p-6 relative">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-20">
            <div className="bg-slate-100 border-b border-gray-200 p-4 flex items-center space-x-2">
              <Settings className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-700">Editor Variabel Dokumen (SPK, BAST, BAP, SPTJM)</h2>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              
              {/* Form Input Variables SPK & General */}
              <div className="col-span-1 md:col-span-2 text-sm font-bold text-blue-800 border-b pb-2">Informasi Surat Perintah Kerja (SPK)</div>
              
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">No Kontrak (Digunakan Untuk Nama File PDF)</label>
                <input type="text" className="w-full p-2 border border-blue-300 rounded outline-none text-sm bg-blue-50 font-semibold" 
                  value={selectedItem.no_kontrak} onChange={e => handleInputChange('no_kontrak', e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nomor SPK</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded outline-none text-sm" 
                  value={selectedItem.nomor_spk} onChange={e => handleInputChange('nomor_spk', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal SPK</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded outline-none text-sm" 
                  value={selectedItem.tanggal_spk} onChange={e => handleInputChange('tanggal_spk', e.target.value)} />
              </div>

              <div className="col-span-1 md:col-span-2 text-sm font-bold text-blue-800 border-b pb-2 mt-4">Pihak Pertama (PPK)</div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama PPK</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded outline-none text-sm" 
                  value={selectedItem.nama_ppk} onChange={e => handleInputChange('nama_ppk', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">NIP PPK</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded outline-none text-sm" 
                  value={selectedItem.nip_ppk} onChange={e => handleInputChange('nip_ppk', e.target.value)} />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Pangkat / Golongan PPK (Untuk SPTJM PPK)</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded outline-none text-sm" 
                  value={selectedItem.pangkat_ppk} onChange={e => handleInputChange('pangkat_ppk', e.target.value)} />
              </div>

              <div className="col-span-1 md:col-span-2 text-sm font-bold text-blue-800 border-b pb-2 mt-4">Pihak Kedua (Penyedia Jasa)</div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Perusahaan Penyedia</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded outline-none text-sm" 
                  value={selectedItem.perusahaan_penyedia} onChange={e => handleInputChange('perusahaan_penyedia', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Alamat Penyedia</label>
                <textarea className="w-full p-2 border border-gray-300 rounded outline-none text-sm min-h-[40px]" 
                  value={selectedItem.alamat_penyedia} onChange={e => handleInputChange('alamat_penyedia', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Penyedia</label>
                  <input type="text" className="w-full p-2 border border-gray-300 rounded outline-none text-sm" 
                    value={selectedItem.nama_penyedia} onChange={e => handleInputChange('nama_penyedia', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Jabatan</label>
                  <input type="text" className="w-full p-2 border border-gray-300 rounded outline-none text-sm" 
                    value={selectedItem.jabatan_penyedia} onChange={e => handleInputChange('jabatan_penyedia', e.target.value)} />
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 text-sm font-bold text-blue-800 border-b pb-2 mt-4">Dokumen Pengadaan & Undangan</div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nomor Undangan</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded outline-none text-sm" 
                  value={selectedItem.nomor_undangan} onChange={e => handleInputChange('nomor_undangan', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal Undangan</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded outline-none text-sm" 
                  value={selectedItem.tanggal_undangan} onChange={e => handleInputChange('tanggal_undangan', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nomor BAHPL</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded outline-none text-sm" 
                  value={selectedItem.nomor_bahpl} onChange={e => handleInputChange('nomor_bahpl', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal BAHPL</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded outline-none text-sm" 
                  value={selectedItem.tanggal_bahpl} onChange={e => handleInputChange('tanggal_bahpl', e.target.value)} />
              </div>

              <div className="col-span-1 md:col-span-2 text-sm font-bold text-blue-800 border-b pb-2 mt-4">Detail Pekerjaan</div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Paket Pengadaan</label>
                <textarea className="w-full p-2 border border-gray-300 rounded outline-none text-sm min-h-[60px]" 
                  value={selectedItem.nama_paket} onChange={e => handleInputChange('nama_paket', e.target.value)} />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Sumber Dana</label>
                <textarea className="w-full p-2 border border-gray-300 rounded outline-none text-sm min-h-[40px]" 
                  value={selectedItem.sumber_dana} onChange={e => handleInputChange('sumber_dana', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nilai Kontrak</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded outline-none text-sm" 
                  value={selectedItem.nilai_kontrak} onChange={e => handleInputChange('nilai_kontrak', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Waktu Pelaksanaan</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded outline-none text-sm" 
                  value={selectedItem.waktu_pelaksanaan} onChange={e => handleInputChange('waktu_pelaksanaan', e.target.value)} />
              </div>

              {/* Data Lanjutan (BAST, BAP, SPTJM) */}
              <div className="col-span-1 md:col-span-2 text-sm font-bold text-blue-800 border-b pb-2 mt-4">Data BAST, BAP & SPTJM</div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nomor BAST</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded outline-none text-sm" 
                  value={selectedItem.nomor_bast} onChange={e => handleInputChange('nomor_bast', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal BAST</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded outline-none text-sm" 
                  value={selectedItem.tanggal_bast} onChange={e => handleInputChange('tanggal_bast', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nomor BAP</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded outline-none text-sm" 
                  value={selectedItem.nomor_bap} onChange={e => handleInputChange('nomor_bap', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal Bayar (SPTJM)</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded outline-none text-sm" 
                  value={selectedItem.tanggal_bayar} onChange={e => handleInputChange('tanggal_bayar', e.target.value)} />
              </div>
              
              <div className="col-span-1 md:col-span-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <label className="block text-xs font-bold text-yellow-800 mb-1">Tanggal Terbilang BAST (Otomatis / Manual)</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded outline-none text-sm bg-white" 
                  value={selectedItem.tgl_bast_terbilang} onChange={e => handleInputChange('tgl_bast_terbilang', e.target.value)} />
                
                <label className="block text-xs font-bold text-yellow-800 mt-3 mb-1">Tanggal Terbilang BAP (Otomatis / Manual)</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded outline-none text-sm bg-white" 
                  value={selectedItem.tgl_bap_terbilang} onChange={e => handleInputChange('tgl_bap_terbilang', e.target.value)} />
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* MODAL IMPORT EXCEL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[800px] max-w-[95%] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center space-x-2">
                <Table className="w-5 h-5 text-green-600" />
                <span>Import Data dari Excel (Format Baru)</span>
              </h3>
            </div>
            <div className="p-4 flex-1">
              <p className="text-sm text-gray-600 mb-3">
                1. <b>Copy</b> cell di Excel Anda.<br/>
                2. <b>Paste (Ctrl + V)</b> ke dalam kotak di bawah ini.<br/>
                <span className="text-xs text-red-500 font-semibold leading-relaxed">
                  *Urutan wajib: No Kontrak | Pejabat | NIP | PT | Direktur | Jabatan | Pekerjaan | No Und. | No BAHPL | Tgl BAHPL | No SPK | Tgl SPK | Nominal | Waktu | Tgl Bayar | Alamat | No BAST | Tgl BAST | No BAP | Aksi
                </span>
              </p>
              <textarea 
                className="w-full h-48 p-3 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-green-500 text-sm whitespace-pre font-mono"
                placeholder="Paste (Ctrl+V) data Excel di sini..."
                value={importText}
                onChange={e => setImportText(e.target.value)}
              />
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button 
                onClick={() => { setShowImportModal(false); setImportText(''); }} 
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-100 font-semibold text-sm"
              >
                Batal
              </button>
              <button 
                onClick={handleProcessImport} 
                className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-500 font-semibold text-sm"
              >
                Proses Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          HIDDEN PDF TEMPLATES CONTAINER (ALL 5 DOCUMENTS COMBINED)
          ===================================================================== */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -100 }}>
        {items.map(item => (
          <div key={`wrapper-${item.id}`} id={`pdf-wrapper-${item.id}`} style={{ width: '595.28pt', backgroundColor: '#ffffff', color: '#000000', fontFamily: 'Arial, sans-serif' }}>

            {/* -------------------------------------------------------------
                1. TEMPLATE SPK (Halaman 1)
                ------------------------------------------------------------- */}
            {/* Margin Bawah Kertas diperbesar (dari 5.6pt menjadi 20pt) agar tidak terpotong printer */}
            <div style={{ width: '595.28pt', height: '841.89pt', boxSizing: 'border-box', overflow: 'hidden', padding: '11.3pt 22.6pt 20pt 22.6pt', fontSize: '10pt', lineHeight: '1.25' }}>
              
              {kopSurat ? ( <img src={kopSurat} alt="Kop Surat" style={{ width: '100%', height: 'auto', marginBottom: '10pt' }} /> ) : ( <div style={{ width: '100%', height: '25mm', marginBottom: '10pt', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '10pt' }}>-- Tempat Kop Surat (Upload gambar untuk mengisi) --</span></div> )}

              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black' }}>
                <tbody>
                  <tr>
                    <td rowSpan={2} style={{ width: '40%', border: '1px solid black', padding: '4pt 10pt 14pt 10pt', textAlign: 'center', verticalAlign: 'middle' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '11pt' }}>SURAT PERINTAH<br/>KERJA (SPK)</span>
                    </td>
                    <td style={{ width: '60%', border: '1px solid black', padding: '4pt 10pt 14pt 10pt', textAlign: 'center', verticalAlign: 'middle' }}>
                      <span style={{ fontWeight: 'bold' }}>SATUAN DEPUTI : DEPUTI PROMOSI DAN KERJASAMA</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid black', padding: '4pt 10pt 14pt 10pt', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '2pt' }}>NOMOR DAN TANGGAL SPK</div>
                      <table style={{ border: 'none', padding: 0, width: '100%' }}>
                        <tbody>
                          <tr><td style={{ width: '60pt', border: 'none', padding: 0 }}>Nomor</td><td style={{ width: '15pt', border: 'none', padding: 0 }}>:</td><td style={{ border: 'none', padding: 0 }}>{item.nomor_spk}</td></tr>
                          <tr><td style={{ border: 'none', padding: 0 }}>Tanggal</td><td style={{ border: 'none', padding: 0 }}>:</td><td style={{ border: 'none', padding: 0 }}>{item.tanggal_spk}</td></tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid black', padding: '4pt 10pt 14pt 10pt', textAlign: 'center', verticalAlign: 'middle' }}>Pejabat Penandatangan Kontrak</td>
                    <td style={{ border: '1px solid black', padding: '4pt 10pt 14pt 10pt', verticalAlign: 'middle' }}>{item.nama_ppk}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid black', padding: '4pt 10pt 14pt 10pt', textAlign: 'center', verticalAlign: 'middle' }}>Nama Penyedia</td>
                    <td style={{ border: '1px solid black', padding: '4pt 10pt 14pt 10pt', verticalAlign: 'middle' }}>{item.nama_penyedia}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid black', padding: '4pt 10pt 14pt 10pt', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '2pt' }}>PAKET PENGADAAN</div>
                      <div>{item.nama_paket}</div>
                    </td>
                    <td style={{ border: '1px solid black', padding: '4pt 10pt 14pt 10pt', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 'bold' }}>NOMOR SURAT UNDANGAN PENGADAAN LANGSUNG</div>
                      <table style={{ border: 'none', padding: 0, width: '100%', marginBottom: '2pt' }}>
                        <tbody>
                          <tr><td style={{ width: '45pt', border: 'none', padding: 0 }}>Nomor</td><td style={{ width: '10pt', border: 'none', padding: 0 }}>:</td><td style={{ border: 'none', padding: 0 }}>{item.nomor_undangan}</td></tr>
                        </tbody>
                      </table>
                      
                      <div style={{ fontWeight: 'bold' }}>TANGGAL SURAT UNDANGAN PENGADAAN LANGSUNG</div>
                      <table style={{ border: 'none', padding: 0, width: '100%', marginBottom: '2pt' }}>
                        <tbody>
                          <tr><td style={{ width: '45pt', border: 'none', padding: 0 }}>Tanggal</td><td style={{ width: '10pt', border: 'none', padding: 0 }}>:</td><td style={{ border: 'none', padding: 0 }}>{item.tanggal_undangan}</td></tr>
                        </tbody>
                      </table>

                      <div style={{ fontWeight: 'bold' }}>NOMOR BERITA ACARA HASIL PENGADAAN LANGSUNG</div>
                      <table style={{ border: 'none', padding: 0, width: '100%' }}>
                        <tbody>
                          <tr><td style={{ width: '45pt', border: 'none', padding: 0 }}>Nomor</td><td style={{ width: '10pt', border: 'none', padding: 0 }}>:</td><td style={{ border: 'none', padding: 0 }}>{item.nomor_bahpl}</td></tr>
                          <tr><td style={{ border: 'none', padding: 0 }}>Tanggal</td><td style={{ border: 'none', padding: 0 }}>:</td><td style={{ border: 'none', padding: 0 }}>{item.tanggal_bahpl}</td></tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid black', padding: '4pt 10pt 14pt 10pt', verticalAlign: 'middle' }}>SUMBER DANA : {item.sumber_dana}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid black', padding: '4pt 10pt 14pt 10pt', verticalAlign: 'middle' }}>Nilai Kontrak Sebesar : {item.nilai_kontrak} Sudah termasuk pajak desuai dengan ketentuan yang berlaku</td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid black', padding: '4pt 10pt 14pt 10pt', verticalAlign: 'middle' }}>Jenis Kontrak : Kontrak Lampsum</td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid black', padding: '4pt 10pt 14pt 10pt', verticalAlign: 'middle' }}>Waktu Pelaksanaan Pekerjaan : {item.waktu_pelaksanaan}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid black', padding: '4pt 10pt 14pt 10pt', textAlign: 'justify', verticalAlign: 'middle' }}>
                      <span style={{ fontWeight: 'bold' }}>INSTRUKSI KEPADA PENYEDIA :</span> Penagihan hanya dapat dilakukan setelah penyelesaian pekerjaan yang diperintahkan dalam SPK ini dan dibuktikan dengan Berita Acara Serah Terima. Jila pekerjaan tidak dapat diselesaikan dalam jangka waktu pelaksanaan pekerjaan karena kesalahan atau kelalaian Penyedia maka Penyedia berkewajiban untuk membayar denda kepada PPK sebesar 1/1000 (satu per seribu) dari nilai SPK sebelum PPN untuk setiap hari kalender keterlambatan.
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid black', padding: 0 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: '65%', borderRight: '1px solid black', padding: '4pt 10pt 14pt 10pt', verticalAlign: 'top', textAlign: 'center' }}>
                              <div>
                                <div style={{ whiteSpace: 'nowrap' }}>Untuk dan Atas Nama Kuasa Pengguna Anggaran</div>
                                <div>Badan Gizi Nasional</div>
                                <div>Pejabat Pembuat Komitmen</div>
                                <div>Deputi Bidang Promosi dan Kerjasama</div>
                              </div>
                              <br/><br/><br/><br/><br/><br/><br/><br/><br/>
                              <div>{item.nama_ppk}<br/>{item.nip_ppk}</div>
                            </td>
                            <td style={{ width: '35%', border: 'none', padding: '4pt 10pt 14pt 10pt', verticalAlign: 'top', textAlign: 'center' }}>
                              <div><div>Untuk dan atas Nama Penyedia Jasa,</div><div>{item.perusahaan_penyedia}</div></div>
                              <br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>
                              <div>{item.nama_penyedia}<br/>{item.jabatan_penyedia}</div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* -------------------------------------------------------------
                2. TEMPLATE BAST (Halaman 2)
                ------------------------------------------------------------- */}
            <div style={{ pageBreakBefore: 'always', width: '595.28pt', height: '841.89pt', boxSizing: 'border-box', overflow: 'hidden', padding: '11.3pt 22.6pt 5.6pt 22.6pt', fontSize: '10pt', lineHeight: '1.25' }}>
              
              {kopSurat ? ( <img src={kopSurat} alt="Kop Surat" style={{ width: '100%', height: 'auto', marginBottom: '15pt' }} /> ) : ( <div style={{ width: '100%', height: '25mm', marginBottom: '15pt', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '10pt' }}>-- Tempat Kop Surat --</span></div> )}

              <div style={{ padding: '0 42.5pt' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '20pt', lineHeight: '1.3', fontSize: '12pt' }}>
                  <div>BERITA ACARA SERAH TERIMA PEKERJAAN</div>
                  <div>{item.nama_paket.toUpperCase()}</div>
                  <div>TAHUN ANGGARAN 2026</div>
                  <div style={{ fontWeight: 'normal', marginTop: '10pt', fontSize: '10pt' }}>Nomor : {item.nomor_bast}</div>
                </div>

                <div style={{ textAlign: 'justify', marginBottom: '15pt' }}>
                  Pada hari ini {item.tgl_bast_terbilang}, Kami yang bertanda tangan dibawah ini :
                </div>

                <table style={{ width: '100%', border: 'none', marginBottom: '15pt' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '5%', verticalAlign: 'top', textAlign: 'center' }}>1</td>
                      <td style={{ width: '25%', verticalAlign: 'top' }}>{item.nama_ppk}</td>
                      <td style={{ width: '3%', verticalAlign: 'top' }}>:</td>
                      <td style={{ width: '67%', verticalAlign: 'top', textAlign: 'justify' }}>
                        Pejabat Pembuat Komitmen Deputi Bidang Promosi dan Kerjasama Badan Gizi Nasional yang berkedudukan di Jl Kebon Sirih No 1 RT 001/007 Kel Kebon Sirih Kec Menteng Kota Jakarta Pusat, Daerah Khusus Jakarta 10340. dalam hal ini bertindak untuk dan atas nama Badan Gizi Nasional Selanjutnya di sebut PIHAK PERTAMA.
                      </td>
                    </tr>
                    <tr><td colSpan={4} style={{ height: '10pt' }}></td></tr>
                    <tr>
                      <td style={{ width: '5%', verticalAlign: 'top', textAlign: 'center' }}>2</td>
                      <td style={{ width: '25%', verticalAlign: 'top' }}>{item.nama_penyedia}</td>
                      <td style={{ width: '3%', verticalAlign: 'top' }}>:</td>
                      <td style={{ width: '67%', verticalAlign: 'top', textAlign: 'justify' }}>
                        {item.jabatan_penyedia} {item.perusahaan_penyedia} yang berkedudukan di {item.alamat_penyedia} dalam hal ini bertindak untuk dan atas nama {item.perusahaan_penyedia} Selanjutnya disebut PIHAK KEDUA
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ textAlign: 'justify', marginBottom: '15pt' }}>
                  Dengan ini menyatakan bahwa PIHAK PERTAMA telah menerima dan memeriksa hasil {toTitleCase(item.nama_paket)} Tahun Anggaran 2026 dari PIHAK KEDUA dalam keadaan lengkap dan baik sesuai ketentuan Surat Perintah Kerja (SPK) Nomor {item.nomor_spk} Tanggal {item.tanggal_spk}.
                </div>

                <div style={{ textAlign: 'justify', marginBottom: '30pt' }}>
                  Demikian Berita Acara ini dibuat dan ditanda tangani di Jakarta pada tanggal yang telah ditetapkan dan untuk dipergunakan sebagaimana mestinya.
                </div>

                <table style={{ width: '100%', border: 'none', textAlign: 'center' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '50%', verticalAlign: 'top' }}>PIHAK KEDUA ,</td>
                      <td style={{ width: '50%', verticalAlign: 'top' }}>PIHAK PERTAMA ,</td>
                    </tr>
                    <tr>
                      <td style={{ height: '100pt' }}></td>
                      <td style={{ height: '100pt' }}></td>
                    </tr>
                    <tr>
                      <td>
                        {item.nama_penyedia}<br/>
                        {item.jabatan_penyedia}
                      </td>
                      <td>
                        {item.nama_ppk}<br/>
                        {item.nip_ppk}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* -------------------------------------------------------------
                3. TEMPLATE BAP (Halaman 3)
                ------------------------------------------------------------- */}
            <div style={{ pageBreakBefore: 'always', width: '595.28pt', height: '841.89pt', boxSizing: 'border-box', overflow: 'hidden', padding: '11.3pt 22.6pt 5.6pt 22.6pt', fontSize: '10pt', lineHeight: '1.25' }}>
              
              {kopSurat ? ( <img src={kopSurat} alt="Kop Surat" style={{ width: '100%', height: 'auto', marginBottom: '15pt' }} /> ) : ( <div style={{ width: '100%', height: '25mm', marginBottom: '15pt', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '10pt' }}>-- Tempat Kop Surat --</span></div> )}

              <div style={{ padding: '0 42.5pt' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '20pt', lineHeight: '1.3', fontSize: '12pt' }}>
                  <div>BERITA ACARA PEMBAYARAN</div>
                  <div>{item.nama_paket.toUpperCase()}</div>
                  <div>TAHUN ANGGARAN 2026</div>
                  <div style={{ fontWeight: 'normal', marginTop: '10pt', fontSize: '10pt' }}>Nomor : {item.nomor_bap}</div>
                </div>

                <div style={{ textAlign: 'justify', marginBottom: '15pt' }}>
                  Pada hari ini {item.tgl_bap_terbilang}, Kami yang bertanda tangan dibawah ini :
                </div>

                <table style={{ width: '100%', border: 'none', marginBottom: '15pt' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '5%', verticalAlign: 'top', textAlign: 'center' }}>1</td>
                      <td style={{ width: '25%', verticalAlign: 'top' }}>{item.nama_ppk}</td>
                      <td style={{ width: '3%', verticalAlign: 'top' }}>:</td>
                      <td style={{ width: '67%', verticalAlign: 'top', textAlign: 'justify' }}>
                        Pejabat Pembuat Komitmen Deputi Bidang Promosi dan Kerjasama Badan Gizi Nasional yang berkedudukan di Jl Kebon Sirih No 1 RT 001/007 Kel Kebon Sirih Kec Menteng Kota Jakarta Pusat, Daerah Khusus Jakarta 10340. dalam hal ini bertindak untuk dan atas nama Badan Gizi Nasional Selanjutnya di sebut PIHAK PERTAMA.
                      </td>
                    </tr>
                    <tr><td colSpan={4} style={{ height: '10pt' }}></td></tr>
                    <tr>
                      <td style={{ width: '5%', verticalAlign: 'top', textAlign: 'center' }}>2</td>
                      <td style={{ width: '25%', verticalAlign: 'top' }}>{item.nama_penyedia}</td>
                      <td style={{ width: '3%', verticalAlign: 'top' }}>:</td>
                      <td style={{ width: '67%', verticalAlign: 'top', textAlign: 'justify' }}>
                        {item.jabatan_penyedia} {item.perusahaan_penyedia} yang berkedudukan di {item.alamat_penyedia} dalam hal ini bertindak untuk dan atas nama {item.perusahaan_penyedia} Selanjutnya disebut PIHAK KEDUA
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ textAlign: 'justify', marginBottom: '15pt' }}>
                  Dengan ini menyatakan bahwa PIHAK KEDUA telah menyerahkan berkas tagihan pembayaran kepada PIHAK PERTAMA dan PIHAK PERTAMA telah menerima berkas tagihan pembayaran dari PIHAK KEDUA. Sehubungan dengan telah diterimanya pekerjaan yang tercantum dalam Berita Acara Serah Terima Hasil Pekerjaan, maka PIHAK KEDUA berhak menerima pembayaran dari PIHAK PERTAMA sebesar {item.nilai_kontrak} Berdasarkan Surat Perintah Kerja (SPK) Nomor : {item.nomor_spk} Tanggal {item.tanggal_spk}.
                </div>

                <div style={{ textAlign: 'justify', marginBottom: '30pt' }}>
                  Demikian Berita Acara dibuat dengan sebenar-benarnya untuk dapat dipergunakan oleh pihak yang berkepentingan.
                </div>

                <table style={{ width: '100%', border: 'none', textAlign: 'center' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '50%', verticalAlign: 'top' }}>PIHAK KEDUA ,</td>
                      <td style={{ width: '50%', verticalAlign: 'top' }}>PIHAK PERTAMA ,</td>
                    </tr>
                    <tr>
                      <td style={{ height: '100pt' }}></td>
                      <td style={{ height: '100pt' }}></td>
                    </tr>
                    <tr>
                      <td>
                        {item.nama_penyedia}<br/>
                        {item.jabatan_penyedia}
                      </td>
                      <td>
                        {item.nama_ppk}<br/>
                        {item.nip_ppk}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* -------------------------------------------------------------
                4. TEMPLATE SPTJM DIREKTUR (Halaman 4)
                ------------------------------------------------------------- */}
            <div style={{ pageBreakBefore: 'always', width: '595.28pt', height: '841.89pt', boxSizing: 'border-box', overflow: 'hidden', padding: '11.3pt 22.6pt 5.6pt 22.6pt', fontSize: '10pt', lineHeight: '1.25' }}>
              
              {kopSurat ? ( <img src={kopSurat} alt="Kop Surat" style={{ width: '100%', height: 'auto', marginBottom: '15pt' }} /> ) : ( <div style={{ width: '100%', height: '25mm', marginBottom: '15pt', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '10pt' }}>-- Tempat Kop Surat --</span></div> )}

              <div style={{ padding: '0 42.5pt' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '25pt', fontSize: '13pt' }}>
                  SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK
                </div>

                <div style={{ marginBottom: '10pt' }}>Yang bertandatangan dibawah ini :</div>

                <table style={{ width: '100%', border: 'none', marginBottom: '15pt' }}>
                  <tbody>
                    <tr><td style={{ width: '150pt' }}>Nama</td><td>: Dr. Gunalan, A.P., M.Si</td></tr>
                    <tr><td>NIP</td><td>: 197501691994121001</td></tr>
                    <tr><td>Pangkat / Gol</td><td>: Pembina Tingkat 1 (IVb)</td></tr>
                    <tr><td>Jabatan</td><td>: Direktur Promosi dan Edukasi Gizi</td></tr>
                    <tr><td>Unit Kerja</td><td>: Deputi Bidang Promosi dan Kerjasama</td></tr>
                  </tbody>
                </table>

                <div style={{ marginBottom: '10pt' }}>Menyatakan dengan sesungguhnya bahwa :</div>

                <div style={{ textAlign: 'justify', marginBottom: '10pt' }}>
                  Bahwa benar segala bentuk kegiatan yang dilakukan pada kegiatan {toTitleCase(item.nama_paket)} di Deputi Promosi dan Kerjasama telah sesuai dengan prosedur yang berlaku dan tidak bertentangan dengan peraturan yang ada.
                </div>

                <div style={{ textAlign: 'justify', marginBottom: '10pt' }}>
                  Saya bertanggung jawab mutlak terhadap segala bentuk dokumen bukti kegiatan, dan apabila di kemudian hari ditemukan ketidaksesuaian atau pelanggaran maka saya bersedia mengembalikan semua kerugian negara sesuai dengan ketentuan yang berlaku.
                </div>

                <div style={{ textAlign: 'justify', marginBottom: '30pt' }}>
                  Demikian surat pernyataan ini saya buat dengan sadar dan sebenar-benarnya serta untuk dipergunakan sebagaimana mestinya.
                </div>

                <table style={{ width: '100%', border: 'none' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '45%' }}></td>
                      <td style={{ width: '55%', verticalAlign: 'top', paddingLeft: '15pt' }}>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ marginBottom: '5pt' }}>Jakarta, {item.tanggal_bayar}</div>
                          <div style={{ whiteSpace: 'nowrap' }}>Direktur Promosi dan Edukasi Gizi</div>
                          <div style={{ whiteSpace: 'nowrap' }}>Pada Deputi Bidang Promosi dan Kerjasama</div>
                          <div style={{ whiteSpace: 'nowrap' }}>Badan Gizi Nasional</div>
                          
                          <div style={{ height: '100pt' }}></div>
                          
                          <div>Dr. Gunalan, A.P., M.Si</div>
                          <div>NIP. 197501691994121001</div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* -------------------------------------------------------------
                5. TEMPLATE SPTJM PPK (Halaman 5 - Baru)
                ------------------------------------------------------------- */}
            <div style={{ pageBreakBefore: 'always', width: '595.28pt', height: '841.89pt', boxSizing: 'border-box', overflow: 'hidden', padding: '11.3pt 22.6pt 5.6pt 22.6pt', fontSize: '10pt', lineHeight: '1.25' }}>
              
              {kopSurat ? ( <img src={kopSurat} alt="Kop Surat" style={{ width: '100%', height: 'auto', marginBottom: '15pt' }} /> ) : ( <div style={{ width: '100%', height: '25mm', marginBottom: '15pt', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '10pt' }}>-- Tempat Kop Surat --</span></div> )}

              <div style={{ padding: '0 42.5pt' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '25pt', fontSize: '13pt' }}>
                  SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK
                </div>

                <div style={{ marginBottom: '10pt' }}>Yang bertanda tangan dibawah ini :</div>

                <table style={{ width: '100%', border: 'none', marginBottom: '15pt' }}>
                  <tbody>
                    <tr><td style={{ width: '150pt', verticalAlign: 'top' }}>Nama</td><td style={{ verticalAlign: 'top' }}>: {item.nama_ppk}</td></tr>
                    <tr><td style={{ verticalAlign: 'top' }}>NIP</td><td style={{ verticalAlign: 'top' }}>: {item.nip_ppk.replace(/NIP\.?\s*/i, '').replace(/\s+/g, '')}</td></tr>
                    <tr>
                      <td style={{ verticalAlign: 'top' }}>Pangkat / Gol</td>
                      <td style={{ verticalAlign: 'top' }}>
                        : {item.pangkat_ppk.split(',')[0].trim()}
                        {item.pangkat_ppk.includes(',') && ' ,'}
                        {item.pangkat_ppk.includes(',') && (
                          <>
                            <br />
                            <span style={{ visibility: 'hidden' }}>: </span>
                            {item.pangkat_ppk.substring(item.pangkat_ppk.indexOf(',') + 1).trim()}
                          </>
                        )}
                      </td>
                    </tr>
                    <tr><td style={{ verticalAlign: 'top' }}>Jabatan</td><td style={{ verticalAlign: 'top' }}>: Pejabat Pembuat Komitmen</td></tr>
                    <tr><td style={{ verticalAlign: 'top' }}>Unit Kerja</td><td style={{ verticalAlign: 'top' }}>: Deputi Bidang Promosi dan Kerjasama</td></tr>
                  </tbody>
                </table>

                <div style={{ marginBottom: '10pt' }}>Menyatakan dengan sesungguhnya bahwa :</div>

                <table style={{ width: '100%', border: 'none', marginBottom: '10pt' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '20pt', verticalAlign: 'top' }}>1</td>
                      <td style={{ textAlign: 'justify', verticalAlign: 'top' }}>
                        Bahwa benar segala bentuk kegiatan yang dilakukan pada Pekerjaan {toTitleCase(item.nama_paket)} di Deputi Promosi dan Kerjasama telah sesuai dengan prosedur yang berlaku dan tidak bertentangan dengan peraturan yang ada.
                      </td>
                    </tr>
                    <tr><td colSpan={2} style={{ height: '8pt' }}></td></tr>
                    <tr>
                      <td style={{ width: '20pt', verticalAlign: 'top' }}>2</td>
                      <td style={{ textAlign: 'justify', verticalAlign: 'top' }}>
                        Saya bertanggung jawab mutlak terhadap segala bentuk dokumen bukti kegiatan, dan apabila di kemudian hari ditemukan ketidaksesuaian atau pelanggaran maka saya bersedia mengembalikan semua kerugian negara sesuai dengan ketentuan yang berlaku.
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ textAlign: 'justify', marginBottom: '30pt' }}>
                  Demikian surat pernyataan ini saya buat dengan sadar dan sebenar-benarnya serta untuk dipergunakan sebagaimana mestinya.
                </div>

                <table style={{ width: '100%', border: 'none' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '45%' }}></td>
                      <td style={{ width: '55%', verticalAlign: 'top', paddingLeft: '15pt' }}>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ marginBottom: '5pt' }}>Jakarta , {item.tanggal_bayar}</div>
                          <div style={{ whiteSpace: 'nowrap' }}>Pejabat Pembuat Komitmen</div>
                          <div style={{ whiteSpace: 'nowrap' }}>Pada Deputi Bidang Promosi dan Kerjasama</div>
                          <div style={{ whiteSpace: 'nowrap' }}>Badan Gizi Nasional</div>
                          
                          <div style={{ height: '100pt' }}></div>
                          
                          <div>{item.nama_ppk}</div>
                          <div>NIP. {item.nip_ppk.replace(/NIP\.?\s*/i, '').replace(/\s+/g, '')}</div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        ))}
      </div>

    </div>
  );
}f