import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Printer, Upload, AlertCircle, Settings, Image as ImageIcon, FileText, Download, RefreshCw, Save, Archive, Calendar, Table as TableIcon, FileCode, LayoutTemplate, Mail } from 'lucide-react';

const App = () => {
  // Data default katalog (bisa diubah dari text area JSON)
  const defaultData = [
    {
      "id": "1",
      "title": "Pendidikan Agama Islam dan Budi Pekerti untuk SMP Kelas VII",
      "published_year": "2021",
      "price_zone_1": "22000",
      "image": "https://static.buku.kemdikbud.go.id/content/image/coverteks/coverkurikulum21/PAI_BS_KLS_VII_COVER.png"
    },
    {
      "id": "2",
      "title": "Buku Panduan Guru Pendidikan Agama Islam dan Budi Pekerti untuk SMP Kelas VII",
      "published_year": "2021",
      "price_zone_1": "86600",
      "image": "https://static.buku.kemdikbud.go.id/content/image/coverteks/coverkurikulum21/PAI_BG_KLS_VII_COVER.png"
    },
    {
      "id": "3",
      "title": "Informatika untuk SMP Kelas VII",
      "published_year": "2021",
      "price_zone_1": "22000",
      "image": "https://static.buku.kemdikbud.go.id/content/image/coverteks/coverkurikulum21/INFORMATIKA_BS_KLS_VII_COVER.png"
    },
    {
      "title": "Koding dan Kecerdasan Artifisial untuk SMP/MTs Kelas VII",
      "published_year": "2025",
      "price_zone_1": "25000", 
      "image": "https://placehold.co/400x600?text=Koding+SMP"
    },
    {
      "title": "Elkapede Bahasa Inggris Kelas 7",
      "published_year": "2024",
      "price_zone_1": "0",
      "image": "https://placehold.co/400x600?text=Elkapede+B.Inggris"
    }
  ];

  const [jsonInput, setJsonInput] = useState(JSON.stringify(defaultData, null, 2));
  const [processedBooks, setProcessedBooks] = useState([]);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('catalog'); // 'catalog', 'form', 'simple', 'letter'
  const [orderState, setOrderState] = useState({});
  const [schoolInfo, setSchoolInfo] = useState({
    namaSekolah: "SMP Negeri 2 Gemolong", 
    alamat: "",
    kepalaSekolah: "",
    bendahara: "",
    noHp: ""
  });

  const [showInput, setShowInput] = useState(true);
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const printRef = useRef();

  const [headerConfig, setHeaderConfig] = useState({
    name: "CV. Gubuk Pustaka Harmoni",
    slogan: "Penerbit, Mitra Pendidikan & Penyedia Buku",
    contact: "Pilangrejo, Gemolong, Sragen Regency, Central Java 57274",
    logo: null
  });

  // --- AUTO INJECT TAILWIND CSS ---
  useEffect(() => {
    if (!document.querySelector('script[src*="tailwindcss"]')) {
      const script = document.createElement('script');
      script.src = "https://cdn.tailwindcss.com";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // Load external libraries
  useEffect(() => {
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
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
    };

    Promise.all([
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js")
    ]).then(() => {
      setIsLibraryLoaded(true);
    }).catch(err => console.error("Failed to load libraries", err));
  }, []);

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeaderConfig(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const extractYear = (dateString) => {
    if (!dateString) return null;
    const year = dateString.substring(0, 4);
    return isNaN(year) ? null : year;
  };

  // --- LOGIC CATALOG GRID & ORDER FORM DATA (DYNAMIC) ---
  useEffect(() => {
    try {
      const rawData = JSON.parse(jsonInput);
      if (!Array.isArray(rawData)) throw new Error("Format JSON harus berupa Array []");

      let books = rawData.map(book => {
        const judul = book.title || book.Judul || book.judul || book.name || book.Nama || "Tanpa Judul";
        const imageUrl = book.image || book.Gambar || book.gambar || book.cover || book.Cover || "https://placehold.co/400x600?text=No+Image";
        const publishedDate = book.published_year || book.TahunTerbit || book.tahun_terbit || book.tahun || book.Tahun || "";
        const tahun = extractYear(publishedDate);

        // Bersihkan Harga dari teks (misal: "Rp 14.000" menjadi "14000")
        const hargaRaw = book.price_zone_1 || book.Harga || book.harga || book.price || "0";
        const hargaClean = String(hargaRaw).replace(/[^0-9]/g, '');

        return {
          Judul: judul,
          Harga: hargaClean || "0",
          Gambar: imageUrl,
          Tahun: tahun,
          LinkPdf: book.attachment || book.LinkPdf || book.link_pdf || book.pdf || "" 
        };
      });

      // Sorting: Buku Guru di bawah
      books.sort((a, b) => {
        const isGuruA = a.Judul.toLowerCase().includes("panduan guru");
        const isGuruB = b.Judul.toLowerCase().includes("panduan guru");
        if (isGuruA && !isGuruB) return 1;
        if (!isGuruA && isGuruB) return -1;
        return 0;
      });

      setProcessedBooks(books);
      setOrderState({}); // Reset pesanan saat data berubah agar tidak meleset
      setError(null);
    } catch (err) {
      setError(err.message);
      setProcessedBooks([]);
    }
  }, [jsonInput]);

  // --- LOGIC ORDER FORM ---
  const handleOrderChange = (index, qty) => {
    setOrderState(prev => ({
      ...prev,
      [index]: parseInt(qty) || 0
    }));
  };

  // Menghitung total langsung dari data processedBooks yang dinamis
  const calculateTotalOrder = () => {
    return processedBooks.reduce((total, book, index) => {
      const qty = orderState[index] || 0;
      const price = parseInt(book.Harga) || 0;
      return total + (qty * price);
    }, 0);
  };

  // --- UTILS IMAGE FETCH ---
  const fetchImageBlob = async (url) => {
    const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=jpg`;
    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`Proxy error: ${response.status}`);
      return await response.blob();
    } catch (e) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Direct fetch error: ${response.status}`);
        return await response.blob();
      } catch (directError) {
        throw new Error("Gagal mengambil gambar dari semua sumber.");
      }
    }
  };

  const handleDownloadSingleImage = async (url, title) => {
    if (!url) return;
    const filename = "download.jpg";
    try {
      const blob = await fetchImageBlob(url);
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Gagal download gambar:", error);
      window.open(url, '_blank');
    }
  };

  const handleDownloadZip = async () => {
    if (!isLibraryLoaded || !window.JSZip) {
      alert("Sedang memuat pustaka ZIP...");
      return;
    }
    if (processedBooks.length === 0) return;

    setIsZipping(true);
    setLoadingMessage("Menyiapkan ZIP...");

    try {
      const zip = new window.JSZip();
      const folder = zip.folder("cover_buku");
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < processedBooks.length; i++) {
        const book = processedBooks[i];
        
        const price = parseInt(book.Harga);
        if (viewMode === 'catalog' && (!price || price <= 0)) continue;

        setLoadingMessage(`Mengambil gambar ${i + 1}/${processedBooks.length}...`);
        
        try {
          const safeTitle = book.Judul.replace(/[/\\?%*:|"<>]/g, '_').trim();
          const filename = `${safeTitle}.jpg`; 
          const blob = await fetchImageBlob(book.Gambar);
          folder.file(filename, blob);
          successCount++;
        } catch (err) {
          console.error(`Gagal: ${book.Judul}`, err);
          failCount++;
          folder.file(`MISSING_${book.Judul.substring(0,20).replace(/[/\\?%*:|"<>]/g, '_')}.txt`, "File tidak ditemukan/CORS error.");
        }
      }

      setLoadingMessage("Mengompres ZIP...");
      const content = await zip.generateAsync({ type: "blob" });
      const blobUrl = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Katalog_Buku_${new Date().toISOString().slice(0,10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      alert(`Download Selesai!\nBerhasil: ${successCount}\nGagal: ${failCount}`);
    } catch (error) {
      alert("Terjadi kesalahan ZIP.");
    } finally {
      setIsZipping(false);
      setLoadingMessage("");
    }
  };

  // --- FUNGSI DOWNLOAD HTML ---
  const handleDownloadHTML = () => {
    const element = printRef.current;
    if (!element) return;

    const clone = element.cloneNode(true);
    const buttons = clone.querySelectorAll('button');
    buttons.forEach(btn => btn.remove());

    const documentTitle = viewMode === 'catalog' ? 'Katalog Buku' 
                        : viewMode === 'simple' ? 'Katalog Simpel'
                        : viewMode === 'letter' ? 'Surat Penawaran' 
                        : 'Surat Pesanan';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${documentTitle}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print { 
            @page { size: A4; margin: 10mm; } 
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
          }
          body { font-family: Arial, sans-serif; background-color: white; padding: 20px; }
          td, th { vertical-align: middle !important; padding: 6px 4px !important; line-height: 1.3 !important; }
        </style>
      </head>
      <body>
        <div style="max-width: 210mm; margin: 0 auto;">
          ${clone.innerHTML}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentTitle.replace(/\s+/g, '-')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  }

  // --- HELPER UNTUK MENGAMBIL DATA YANG DITAMPILKAN ---
  const getDisplayedBooks = () => {
    if (viewMode === 'catalog') {
      return processedBooks.filter(b => parseInt(b.Harga) > 0);
    } else if (viewMode === 'simple') {
      return processedBooks;
    }
    return [];
  };

  const displayedBooks = getDisplayedBooks();

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-12 print:bg-white print:pb-0" style={{fontFamily: 'Arial, sans-serif'}}>
      
      {/* PANEL KONTROL */}
      <div className="bg-green-900 text-white p-6 mb-8 print:hidden shadow-xl border-b-4 border-yellow-500">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-yellow-400">
              <Settings size={24} /> Panel Admin
            </h2>
            <div className="flex flex-wrap gap-2 items-center">
               <button onClick={() => setViewMode('catalog')} className={`px-3 py-2 rounded text-xs sm:text-sm font-bold border transition ${viewMode === 'catalog' ? 'bg-white text-green-900 border-white' : 'bg-green-700 border-green-600 hover:bg-green-600 text-white'}`}>
                 <BookOpen size={14} className="inline mr-1"/> Katalog
               </button>
               <button onClick={() => setViewMode('simple')} className={`px-3 py-2 rounded text-xs sm:text-sm font-bold border transition ${viewMode === 'simple' ? 'bg-white text-green-900 border-white' : 'bg-green-700 border-green-600 hover:bg-green-600 text-white'}`}>
                 <LayoutTemplate size={14} className="inline mr-1"/> Simpel
               </button>
               <button onClick={() => setViewMode('form')} className={`px-3 py-2 rounded text-xs sm:text-sm font-bold border transition ${viewMode === 'form' ? 'bg-white text-green-900 border-white' : 'bg-green-700 border-green-600 hover:bg-green-600 text-white'}`}>
                 <TableIcon size={14} className="inline mr-1"/> Pesanan
               </button>
               <button onClick={() => setViewMode('letter')} className={`px-3 py-2 rounded text-xs sm:text-sm font-bold border transition ${viewMode === 'letter' ? 'bg-white text-green-900 border-white' : 'bg-green-700 border-green-600 hover:bg-green-600 text-white'}`}>
                 <Mail size={14} className="inline mr-1"/> Penawaran
               </button>
               
               <div className="w-px h-8 bg-green-600 mx-2"></div>

               <button onClick={() => setShowInput(!showInput)} className="bg-green-800 hover:bg-green-700 border border-green-700 px-3 py-2 rounded text-xs sm:text-sm transition flex items-center gap-1">
                {showInput ? "Tutup Edit" : "Edit Kop"}
               </button>
               <button onClick={handlePrint} className="bg-white text-green-900 hover:bg-gray-100 px-3 py-2 rounded font-bold transition shadow-sm flex items-center gap-1 text-xs sm:text-sm">
                <Printer size={14} /> Print
               </button>
               <button onClick={handleDownloadHTML} className="bg-yellow-500 hover:bg-yellow-400 text-green-900 px-3 py-2 rounded font-bold transition shadow-lg flex items-center gap-1 text-xs sm:text-sm">
                  <FileCode size={14} /> HTML
               </button>
               {(viewMode === 'catalog' || viewMode === 'simple') && (
                  <button onClick={handleDownloadZip} disabled={isZipping} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded font-bold transition shadow-lg flex items-center gap-1 disabled:opacity-50 text-xs sm:text-sm">
                    {isZipping ? <span className="flex items-center gap-1"><RefreshCw size={12} className="animate-spin" /> ZIP...</span> : <><Archive size={14} /> ZIP</>}
                  </button>
               )}
            </div>
          </div>

          {showInput && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="bg-green-800 p-5 rounded-lg border border-green-700">
                <h3 className="text-sm font-bold uppercase tracking-wider text-yellow-400 mb-4 flex items-center gap-2">
                  <ImageIcon size={16} /> Edit Kop Surat & Logo
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-green-200 mb-1">Upload Logo Perusahaan</label>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm text-green-200 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 cursor-pointer bg-green-900 rounded border border-green-700" />
                  </div>
                  <div>
                    <label className="block text-xs text-green-200 mb-1">Nama Perusahaan</label>
                    <input type="text" value={headerConfig.name} onChange={(e) => setHeaderConfig({...headerConfig, name: e.target.value})} className="w-full bg-green-900 border border-green-700 rounded p-2 text-sm focus:outline-none focus:border-yellow-500 text-white" />
                  </div>
                  <div>
                    <label className="block text-xs text-green-200 mb-1">Slogan</label>
                    <input type="text" value={headerConfig.slogan} onChange={(e) => setHeaderConfig({...headerConfig, slogan: e.target.value})} className="w-full bg-green-900 border border-green-700 rounded p-2 text-sm focus:outline-none focus:border-yellow-500 text-white" />
                  </div>
                  <div>
                    <label className="block text-xs text-green-200 mb-1">Kontak</label>
                    <textarea value={headerConfig.contact} onChange={(e) => setHeaderConfig({...headerConfig, contact: e.target.value})} className="w-full bg-green-900 border border-green-700 rounded p-2 text-sm focus:outline-none focus:border-yellow-500 text-white h-20 resize-none" />
                  </div>
                </div>
              </div>
              
              {/* Form Data Sekolah (Tampil di Mode Form & Letter) */}
              {(viewMode === 'form' || viewMode === 'letter') ? (
                <div className="bg-green-800 p-5 rounded-lg border border-green-700 flex flex-col">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-yellow-400 mb-4 flex items-center gap-2">
                    <FileText size={16} /> Data Tujuan / Sekolah
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs text-green-200 mb-1">Nama Sekolah Tujuan (Kepada Yth.)</label>
                      <input type="text" value={schoolInfo.namaSekolah} onChange={(e) => setSchoolInfo({...schoolInfo, namaSekolah: e.target.value})} className="w-full bg-green-900 border border-green-700 rounded p-2 text-sm text-white" placeholder="SMP N 2 Gemolong..." />
                    </div>
                    {viewMode === 'form' && (
                      <>
                        <div>
                          <label className="block text-xs text-green-200 mb-1">No. HP / Telp</label>
                          <input type="text" value={schoolInfo.noHp} onChange={(e) => setSchoolInfo({...schoolInfo, noHp: e.target.value})} className="w-full bg-green-900 border border-green-700 rounded p-2 text-sm text-white" placeholder="0812..." />
                        </div>
                        <div>
                          <label className="block text-xs text-green-200 mb-1">Nama Kepala Sekolah</label>
                          <input type="text" value={schoolInfo.kepalaSekolah} onChange={(e) => setSchoolInfo({...schoolInfo, kepalaSekolah: e.target.value})} className="w-full bg-green-900 border border-green-700 rounded p-2 text-sm text-white" />
                        </div>
                        <div>
                          <label className="block text-xs text-green-200 mb-1">Nama Bendahara</label>
                          <input type="text" value={schoolInfo.bendahara} onChange={(e) => setSchoolInfo({...schoolInfo, bendahara: e.target.value})} className="w-full bg-green-900 border border-green-700 rounded p-2 text-sm text-white" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-green-200 mb-1">Alamat Sekolah</label>
                          <input type="text" value={schoolInfo.alamat} onChange={(e) => setSchoolInfo({...schoolInfo, alamat: e.target.value})} className="w-full bg-green-900 border border-green-700 rounded p-2 text-sm text-white" placeholder="Jl. ..." />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-green-800 p-5 rounded-lg border border-green-700 flex flex-col">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-yellow-400 mb-4 flex items-center gap-2">
                    <Upload size={16} /> Input Data Buku (JSON)
                  </h3>
                  <textarea className="w-full flex-grow bg-green-900 border border-green-700 rounded p-3 text-xs font-mono text-green-200 focus:outline-none focus:border-yellow-500 min-h-[200px]" value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} placeholder='Paste JSON disini...' />
                  {error && <div className="mt-2 text-red-300 text-xs flex items-center gap-2 bg-red-900/40 p-2 rounded"><AlertCircle size={14} /> Error: {error}</div>}
                  <div className="mt-2 text-[10px] text-green-400">
                    *Tabel pesanan akan otomatis mengikuti data yang ada di JSON ini.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- CANVAS UTAMA (Kertas A4) --- */}
      <div className="flex justify-center print:block print:w-full">
        <div ref={printRef} className="w-[210mm] min-h-[297mm] bg-white p-8 shadow-2xl print:shadow-none print:w-full print:p-0 mx-auto print:mx-0">
          
          {/* HEADER KOP SURAT */}
          <header className="border-b-4 border-double border-green-800 mb-6 pb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-left">
              <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-lg bg-white">
                {headerConfig.logo ? (
                  <img src={headerConfig.logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-green-800 text-white flex items-center justify-center rounded-lg">
                    <BookOpen size={40} />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-green-900 uppercase tracking-wide leading-tight">{headerConfig.name}</h1>
                <p className="text-green-700 text-xs italic font-medium mt-1">{headerConfig.slogan}</p>
                <p className="text-slate-500 text-[10px] mt-1 max-w-sm leading-relaxed whitespace-pre-line">{headerConfig.contact}</p>
              </div>
            </div>
            {/* Judul Dokumen di Kanan Atas */}
            <div className="text-right">
              {/* QR Code Section - Tampil di Katalog */}
              {(viewMode === 'catalog' || viewMode === 'simple') && (
                <div className="flex flex-col items-end mb-2">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=https://kataloggubuk.web.app/`} 
                    alt="QR Katalog"
                    className="w-16 h-16 border border-slate-200"
                  />
                  <span className="text-[8px] font-bold mt-1 text-slate-600">Full Katalog Kami</span>
                </div>
              )}

              {viewMode === 'letter' ? (
                // Tampilan Khusus Surat
                <div className="text-right mt-2">
                  <p className="text-sm font-bold text-slate-700">Sragen, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-green-900 tracking-tight">
                    {viewMode === 'form' ? 'FORMULIR PEMESANAN' : (viewMode === 'simple' ? 'KATALOG SIMPEL' : 'KATALOG BUKU')}
                  </h2>
                  <div className="inline-block bg-yellow-400 text-green-900 text-[10px] font-bold px-2 py-1 mt-1 mb-1 shadow-sm transform -rotate-1 print:bg-yellow-400 print:text-black">EDISI TERBARU</div>
                  <p className="text-[10px] text-slate-500 mt-1">Kurikulum Merdeka</p>
                </>
              )}
            </div>
          </header>

          {/* --- TAMPILAN 1 & 2: GRID KATALOG (Lengkap / Simpel) --- */}
          {(viewMode === 'catalog' || viewMode === 'simple') && (
            <>
              {displayedBooks.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-green-200 rounded-lg"><p className="text-slate-400">Data buku kosong.</p></div>
              ) : (
                <div className="grid grid-cols-4 gap-4 print:grid-cols-4 print:gap-4">
                  {displayedBooks.map((book, index) => {
                    const isGuru = book.Judul.toLowerCase().includes("panduan guru");
                    return (
                      <div key={index} className={`flex flex-col bg-white rounded border border-green-200 overflow-hidden ${isGuru ? 'bg-green-50 print:bg-green-50' : ''}`} style={{ breakInside: 'avoid' }}>
                        <div className="relative h-40 w-full bg-white flex items-center justify-center overflow-hidden border-b border-green-100 p-2 group">
                          <img 
                            src={book.Gambar} 
                            alt={book.Judul}
                            className="h-full object-contain drop-shadow-md"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://placehold.co/300x400?text=${encodeURIComponent(book.Judul.substring(0,20))}`;
                            }}
                          />
                          <button onClick={() => handleDownloadSingleImage(book.Gambar, book.Judul)} className="absolute top-1 left-1 bg-white/90 p-1.5 rounded-full shadow hover:bg-white hover:text-blue-600 text-gray-600 print:hidden transition opacity-0 group-hover:opacity-100 focus:opacity-100" title="Download Gambar">
                            <Save size={14} />
                          </button>
                          
                          {isGuru && <div className="absolute top-0 right-0 bg-yellow-500 text-green-900 text-[8px] font-bold px-2 py-0.5 rounded-bl shadow-sm print:bg-yellow-500 print:text-black">GURU</div>}
                          
                          {viewMode === 'catalog' && book.Tahun && (
                            <div className="absolute bottom-0 right-0 bg-green-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-tl shadow-sm print:bg-green-700 flex items-center gap-1">
                               <Calendar size={8} /> {book.Tahun}
                            </div>
                          )}
                        </div>
                        <div className="p-3 flex flex-col flex-grow justify-between">
                          <div className="mb-2">
                            <h3 className="font-bold text-green-900 text-[10px] leading-snug line-clamp-3 mb-1 min-h-[2.5rem]">{book.Judul}</h3>
                            <div className="w-8 h-0.5 bg-green-500 rounded mt-1 print:bg-green-500"></div>
                          </div>
                          
                          {viewMode === 'catalog' && (
                            <div className="mt-auto">
                              {book.LinkPdf && <div className="flex items-center gap-1 text-[9px] text-green-600 mb-2 truncate"><FileText size={10} /><span>Tersedia PDF</span></div>}
                              <div className="pt-2 border-t border-dashed border-green-200 flex flex-col items-end">
                                <span className="text-[8px] text-slate-400 uppercase font-bold">Harga</span>
                                <span className="text-sm font-bold text-green-700 print:text-green-900">{formatRupiah(book.Harga)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* --- TAMPILAN 3: FORMULIR PEMESANAN --- */}
          {viewMode === 'form' && (
            <div className="font-sans">
              
              <div className="mb-6 p-4 border border-green-200 bg-green-50/50 rounded text-xs print:border-green-800 print:bg-transparent">
                <table className="w-full">
                  <tbody>
                    <tr><td className="w-32 py-1 font-bold">Nama Sekolah</td><td className="w-4">:</td><td>{schoolInfo.namaSekolah || ".............................................................."}</td></tr>
                    <tr><td className="py-1 font-bold">Alamat</td><td>:</td><td>{schoolInfo.alamat || ".............................................................."}</td></tr>
                    <tr><td className="py-1 font-bold">No. Telp/HP</td><td>:</td><td>{schoolInfo.noHp || ".............................................................."}</td></tr>
                  </tbody>
                </table>
              </div>
              
              {/* QR Code Section - Di-comment agar tidak tampil di atas tabel sesuai request sebelumnya */}
              {/* <div className="mt-4 mb-4 flex justify-end">
                ...
              </div> 
              */}

              <table className="w-full text-[10px] border-collapse border border-green-800">
                <thead>
                  <tr className="bg-green-100 print:bg-green-200 text-green-900 text-center font-bold">
                    <th className="border border-green-800 p-2 w-8 align-middle">No</th>
                    <th className="border border-green-800 p-2 align-middle">Judul Buku</th>
                    <th className="border border-green-800 p-2 w-8 align-middle">Kls</th>
                    <th className="border border-green-800 p-2 w-12 align-middle">Jenis</th>
                    <th className="border border-green-800 p-2 w-20 align-middle">Harga</th>
                    <th className="border border-green-800 p-2 w-12 bg-yellow-100 print:bg-yellow-100 align-middle">Pesan</th>
                    <th className="border border-green-800 p-2 w-24 align-middle">Jumlah (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const rows = [];
                    const bukuReguler = processedBooks.filter(b => !b.Judul.toLowerCase().includes('elkapede'));
                    const bukuElkapede = processedBooks.filter(b => b.Judul.toLowerCase().includes('elkapede'));

                    const createRow = (book, originalIndex, itemNo) => {
                      const qty = orderState[originalIndex] || 0;
                      const harga = parseInt(book.Harga) || 0;
                      const subtotal = qty * harga;
                      
                      const kelasMatch = book.Judul.match(/Kelas\s+([IVX]+|\d+)/i);
                      const kelas = kelasMatch ? kelasMatch[1].toUpperCase() : '-';
                      const lowerTitle = book.Judul.toLowerCase();
                      const jenis = lowerTitle.includes('guru') ? 'GURU' : 'SISWA';

                      return (
                        <tr key={`book-${originalIndex}`} className={itemNo % 2 === 0 ? "bg-white" : "bg-green-50 print:bg-green-50"}>
                          <td className="border border-green-800 p-2 text-center align-middle">{itemNo}</td>
                          <td className="border border-green-800 p-2 font-medium align-middle leading-snug">{book.Judul}</td>
                          <td className="border border-green-800 p-2 text-center align-middle">{kelas}</td>
                          <td className="border border-green-800 p-2 text-center align-middle">{jenis}</td>
                          <td className="border border-green-800 p-2 text-right align-middle">{harga > 0 ? formatRupiah(harga).replace("Rp", "") : "0"}</td>
                          <td className="border border-green-800 p-0 text-center bg-yellow-50 print:bg-transparent align-middle">
                            <input 
                              type="number" 
                              min="0"
                              className="w-full h-full text-center bg-transparent focus:bg-yellow-100 outline-none p-1 print:hidden"
                              value={orderState[originalIndex] || ""}
                              onChange={(e) => handleOrderChange(originalIndex, e.target.value)}
                              placeholder="" 
                            />
                            <span className="hidden print:block font-bold">{qty > 0 ? qty : ""}</span>
                          </td>
                          <td className="border border-green-800 p-2 text-right font-medium align-middle">
                            {subtotal > 0 ? formatRupiah(subtotal).replace("Rp", "") : "-"}
                          </td>
                        </tr>
                      );
                    };

                    if (bukuReguler.length > 0) {
                      rows.push(
                        <tr key="header-a" className="bg-green-200 print:bg-green-200 font-bold text-green-900">
                          <td colSpan="7" className="border border-green-800 p-2 align-middle">A. KATALOG BUKU KURIKULUM MERDEKA SMP</td>
                        </tr>
                      );
                      bukuReguler.forEach((book, i) => {
                        const originalIndex = processedBooks.indexOf(book);
                        rows.push(createRow(book, originalIndex, i + 1));
                      });
                    }

                    if (bukuElkapede.length > 0) {
                      rows.push(
                        <tr key="header-b" className="bg-green-200 print:bg-green-200 font-bold text-green-900">
                          <td colSpan="7" className="border border-green-800 p-2 align-middle">B. ELKAPEDE</td>
                        </tr>
                      );
                      bukuElkapede.forEach((book, i) => {
                        const originalIndex = processedBooks.indexOf(book);
                        rows.push(createRow(book, originalIndex, i + 1));
                      });
                    }

                    return rows;
                  })()}
                </tbody>
                <tfoot>
                  <tr className="bg-white text-black font-bold print:bg-white print:text-black">
                    <td colSpan="6" className="border border-green-800 p-2 text-right">TOTAL PEMBAYARAN</td>
                    <td className="border border-green-800 p-2 text-right">
                      {calculateTotalOrder() > 0 ? formatRupiah(calculateTotalOrder()) : ""}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div className="mt-8 flex justify-around text-xs text-center break-inside-avoid">
                <div className="w-1/3 flex flex-col items-center">
                  <p className="mb-16 font-bold">Kepala Sekolah</p>
                  <p className="font-bold underline">{schoolInfo.kepalaSekolah || "( ........................................... )"}</p>
                </div>
                <div className="w-1/3 flex flex-col items-center">
                  <p className="mb-16 font-bold">Bendahara</p>
                  <p className="font-bold underline">{schoolInfo.bendahara || "( ........................................... )"}</p>
                </div>
              </div>
            </div>
          )}

          {/* --- TAMPILAN 4: SURAT PENAWARAN (BARU - DIPERBARUI) --- */}
          {viewMode === 'letter' && (
            <div className="font-sans text-sm leading-relaxed text-gray-800 max-w-4xl mx-auto pl-4 pr-4">
              <div className="mb-6">
                <table>
                  <tbody>
                    <tr>
                      <td className="w-20 align-top">Nomor</td>
                      <td className="w-4 align-top">:</td>
                      <td className="align-top">001/PH/PENAWARAN/I/{new Date().getFullYear()}</td>
                    </tr>
                    <tr>
                      <td className="align-top">Lampiran</td>
                      <td className="align-top">:</td>
                      <td className="align-top">1 (Satu) Berkas Katalog</td>
                    </tr>
                    <tr>
                      <td className="align-top">Perihal</td>
                      <td className="align-top">:</td>
                      <td className="font-bold align-top">Penawaran Buku & Peralatan Elektronik</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mb-8">
                <p>Kepada Yth,</p>
                <p className="font-bold">Kepala Sekolah {schoolInfo.namaSekolah || "..................."}</p>
                <p>Di Tempat</p>
              </div>

              <div className="mb-6 space-y-4 text-justify">
                <p>Dengan hormat,</p>
                <p>
                  Puji syukur kita panjatkan kehadirat Tuhan Yang Maha Esa atas segala limpahan rahmat dan karunia-Nya. 
                  Bersama surat ini, kami dari <strong>{headerConfig.name}</strong> bermaksud untuk memperkenalkan perusahaan kami 
                  yang bergerak di bidang penyediaan sarana dan prasarana pendidikan.
                </p>
                <p>
                  Dalam rangka mendukung proses belajar mengajar yang efektif dan sesuai dengan perkembangan kurikulum saat ini, 
                  kami mengajukan penawaran pengadaan buku dan peralatan elektronik berkualitas sebagai berikut:
                </p>
                
                <ul className="list-disc pl-8 space-y-1 font-medium">
                  <li>Buku Pelajaran Kurikulum Merdeka</li>
                  <li>Buku Teks Pendamping & Buku Ujian</li>
                  <li>Buku Novel & Literasi Perpustakaan</li>
                  <li>Perlengkapan Elektronik Sekolah (Printer, LCD Proyektor, TV, Laptop/PC)</li>
                </ul>

                <p className="mt-4">
                  Produk yang kami tawarkan adalah produk original dengan kualitas cetak dan fisik terbaik, serta bergaransi resmi 
                  untuk peralatan elektronik. Kami juga memberikan layanan purna jual dan harga yang kompetitif.
                </p>
                <p>
                  Besar harapan kami agar penawaran ini dapat menjadi pertimbangan Bapak/Ibu Kepala Sekolah dalam memenuhi kebutuhan 
                  sekolah. Untuk informasi lebih lanjut mengenai detail harga dan spesifikasi produk, Bapak/Ibu dapat menghubungi 
                  kami melalui kontak yang tertera di kop surat ini.
                </p>
                <p>
                  Demikian surat penawaran ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.
                </p>
              </div>

              <div className="mt-12 ml-auto w-1/3 text-center">
                <p className="mb-16">Hormat Kami,</p>
                <p className="font-bold underline">Zulfikar Ali</p>
                <p>Direktur</p>
              </div>
            </div>
          )}

          <footer className="mt-8 pt-4 border-t-2 border-green-800 text-center text-slate-500 text-[10px]">
            <p className="font-semibold text-green-800">Terima kasih atas kepercayaan Anda kepada {headerConfig.name}</p>
            <p className="mt-1">Dicetak pada: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </footer>
        </div>
      </div>
      <style>{`
        @media print { 
          @page { size: A4; margin: 10mm; } 
          body { background-color: white; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } 
          .font-sans, body { font-family: Arial, sans-serif !important; }
          td, th { vertical-align: middle !important; padding: 6px 4px !important; line-height: 1.3 !important; }
        }
      `}</style>
    </div>
  );
};

export default App;