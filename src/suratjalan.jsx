import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Printer, FileText, Upload, X, Download } from 'lucide-react';

// Data Baru Spesifik SD Tlogowungu 02
const NEW_DATA = [
  { id: 1, title: "Pendidikan Pancasila", class: "1", qty_siswa: 9, qty_bonus: 1, price: 7500 },
  { id: 2, title: "Bahasa Indonesia", class: "1", qty_siswa: 9, qty_bonus: 1, price: 7500 },
  { id: 3, title: "Matematika", class: "1", qty_siswa: 9, qty_bonus: 1, price: 7500 },
  { id: 4, title: "Bhs Jawa", class: "1", qty_siswa: 9, qty_bonus: 0, price: 7500 },
  
  { id: 5, title: "Pendidikan Pancasila", class: "2", qty_siswa: 12, qty_bonus: 1, price: 7500 },
  { id: 6, title: "Bahasa Indonesia", class: "2", qty_siswa: 12, qty_bonus: 1, price: 7500 },
  { id: 7, title: "Matematika", class: "2", qty_siswa: 12, qty_bonus: 1, price: 7500 },
  { id: 8, title: "Bhs Jawa", class: "2", qty_siswa: 12, qty_bonus: 0, price: 7500 },
  
  { id: 9, title: "Pendidikan Pancasila", class: "3", qty_siswa: 6, qty_bonus: 1, price: 7500 },
  { id: 10, title: "Bahasa Indonesia", class: "3", qty_siswa: 6, qty_bonus: 1, price: 7500 },
  { id: 11, title: "Matematika", class: "3", qty_siswa: 6, qty_bonus: 1, price: 7500 },
  { id: 12, title: "IPAS", class: "3", qty_siswa: 6, qty_bonus: 1, price: 7500 },
  { id: 13, title: "Bhs Inggris", class: "3", qty_siswa: 6, qty_bonus: 1, price: 7500 },
  { id: 14, title: "Seni Rupa", class: "3", qty_siswa: 6, qty_bonus: 0, price: 7500 },
  { id: 15, title: "Bhs Jawa", class: "3", qty_siswa: 6, qty_bonus: 0, price: 7500 },
  
  { id: 16, title: "Pendidikan Pancasila", class: "4", qty_siswa: 14, qty_bonus: 1, price: 7500 },
  { id: 17, title: "Bahasa Indonesia", class: "4", qty_siswa: 14, qty_bonus: 1, price: 7500 },
  { id: 18, title: "Matematika", class: "4", qty_siswa: 14, qty_bonus: 1, price: 7500 },
  { id: 19, title: "IPAS", class: "4", qty_siswa: 14, qty_bonus: 1, price: 7500 },
  { id: 20, title: "Bhs Inggris", class: "4", qty_siswa: 14, qty_bonus: 1, price: 7500 },
  { id: 21, title: "Seni Rupa", class: "4", qty_siswa: 14, qty_bonus: 0, price: 7500 },
  { id: 22, title: "Bhs Jawa", class: "4", qty_siswa: 14, qty_bonus: 0, price: 7500 },
  
  { id: 23, title: "Pendidikan Pancasila", class: "5", qty_siswa: 12, qty_bonus: 1, price: 7500 },
  { id: 24, title: "Bahasa Indonesia", class: "5", qty_siswa: 12, qty_bonus: 1, price: 7500 },
  { id: 25, title: "Matematika", class: "5", qty_siswa: 12, qty_bonus: 1, price: 7500 },
  { id: 26, title: "IPAS", class: "5", qty_siswa: 12, qty_bonus: 1, price: 7500 },
  { id: 27, title: "Bhs Inggris", class: "5", qty_siswa: 12, qty_bonus: 1, price: 7500 },
  { id: 28, title: "Seni Rupa", class: "5", qty_siswa: 12, qty_bonus: 1, price: 7500 },
  { id: 29, title: "Bhs Jawa", class: "5", qty_siswa: 12, qty_bonus: 0, price: 7500 },
];

export default function App() {
  const [selectedBookId, setSelectedBookId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [logo, setLogo] = useState(null); 
  const fileInputRef = useRef(null);
  
  // Load html2pdf library
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if(document.body.contains(script)){
        document.body.removeChild(script);
      }
    }
  }, []);

  // Initialize cart with NEW_DATA
  const [cart, setCart] = useState(NEW_DATA);
  
  const [docType, setDocType] = useState('nota'); // Default ke Nota agar diskon terlihat
  
  // Dokumen Info
  const [docNumber, setDocNumber] = useState(`INV/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`);
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);

  const sender = {
    name: "CV. GUBUK PUSTAKA HARMONI",
    address: "Pilangrejo, Gemolong, Sragen Regency, Central Java 57274",
    phone: "-"
  };

  const receiver = {
    name: "SD Tlogowungu 02",
    address: "Kec. Tlogowungu, Kabupaten Pati", // Placeholder as full address wasn't specified
    phone: "-"
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number);
  };

  // Add Item Logic (Modified for simple addition)
  const addToCart = () => {
    // For manual add, we default to no bonus for simplicity unless UI is expanded
    // This is just a basic implementation for the manual input fallback
    if (!selectedBookId) return;
    const book = NEW_DATA.find(b => b.id === parseInt(selectedBookId));
    
    const existingItem = cart.find(item => item.id === book.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === book.id ? { ...item, qty_siswa: item.qty_siswa + parseInt(quantity) } : item
      ));
    } else {
      setCart([...cart, { ...book, qty_siswa: parseInt(quantity), qty_bonus: 0 }]);
    }
    setQuantity(1);
    setSelectedBookId("");
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Calculations
  const calculateTotalGross = () => {
    return cart.reduce((acc, item) => acc + ((item.qty_siswa + item.qty_bonus) * item.price), 0);
  };

  const calculateTotalDiscount = () => {
    return cart.reduce((acc, item) => acc + (item.qty_bonus * item.price), 0);
  };

  const calculateGrandTotal = () => {
    return calculateTotalGross() - calculateTotalDiscount();
  };
  
  const calculateTotalQty = () => {
     return cart.reduce((acc, item) => acc + item.qty_siswa + item.qty_bonus, 0);
  }

  const handleDownloadPDF = () => {
    const element = document.querySelector('.printable-area');
    const filename = `${docType === 'suratjalan' ? 'Surat_Jalan' : 'Nota'}_${docNumber.replace(/[\/\\?%*:|"<>]/g, '-')}.pdf`;
    
    // Perubahan: Margin diperkecil agar muat 1 halaman
    const opt = {
      margin:       [5, 5, 5, 5], 
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    if (window.html2pdf) {
      window.html2pdf().set(opt).from(element).save();
    } else {
      alert('Fitur PDF sedang dimuat, silakan coba beberapa detik lagi atau gunakan fitur Print bawaan.');
      window.print();
    }
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogo(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      <style>{`
        @media print {
          @page { margin: 5mm; size: auto; } /* Margin kertas diperkecil */
          body { -webkit-print-color-adjust: exact; background-color: white; }
          .no-print { display: none !important; }
          .printable-area { 
            display: block !important; 
            width: 100%; 
            height: auto !important;
            margin: 0; 
            padding: 0;
            box-shadow: none;
            border: none;
            overflow: visible !important;
            font-size: 11px; /* Ukuran font dasar diperkecil untuk print */
          }
          thead { display: table-header-group; }
          tfoot { display: table-row-group; }
          tr { page-break-inside: avoid; }
          
          /* Kustomisasi tabel saat print agar lebih padat */
          td, th {
            padding-top: 2px !important;
            padding-bottom: 2px !important;
            font-size: 10px !important;
          }
          
          /* Perkecil header saat print */
          h1 { font-size: 18px !important; }
          h2 { font-size: 14px !important; }
          p { font-size: 10px !important; }
          
          /* Perkecil jarak tanda tangan */
          .signature-space {
             margin-bottom: 40px !important; /* Kurangi spasi tanda tangan */
          }
        }
      `}</style>

      {/* Control Panel - No changes here */}
      <div className="no-print bg-white shadow-md p-4 mb-6 sticky top-0 z-10 max-h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-8 h-8 text-green-700" />
            Generator Dokumen - Gubuk Pustaka
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="md:col-span-6">
              <label className="block text-sm font-medium mb-1 text-green-900">Tambah Buku Manual</label>
              <select 
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 border-green-300"
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
              >
                <option value="">-- Pilih Buku --</option>
                {NEW_DATA.map(book => (
                  <option key={book.id} value={book.id}>
                    {book.title} (Kls {book.class})
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-green-900">Jml Siswa</label>
              <input 
                type="number" 
                min="1"
                className="w-full p-2 border rounded border-green-300 focus:ring-2 focus:ring-green-500"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="md:col-span-2 flex items-end">
              <button 
                onClick={addToCart}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Plus size={18} /> Tambah
              </button>
            </div>
             <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-green-900">Logo Kop Surat</label>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => fileInputRef.current.click()}
                        className="w-full bg-white border border-green-300 text-green-800 hover:bg-green-50 font-medium py-2 px-2 rounded flex items-center justify-center gap-1 text-xs transition-colors"
                    >
                        <Upload size={14} /> {logo ? "Ganti" : "Upload"}
                    </button>
                    {logo && (
                        <button onClick={removeLogo} className="text-red-500 p-2 hover:bg-red-50 rounded transition-colors">
                            <X size={16} />
                        </button>
                    )}
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleLogoUpload}
                />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nomor Dokumen</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tanggal</label>
              <input 
                type="date" 
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <button 
                onClick={() => setDocType('suratjalan')}
                className={`flex-1 py-2 px-4 rounded font-medium transition-colors shadow-sm ${docType === 'suratjalan' ? 'bg-green-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Surat Jalan
              </button>
              <button 
                onClick={() => setDocType('nota')}
                className={`flex-1 py-2 px-4 rounded font-medium transition-colors shadow-sm ${docType === 'nota' ? 'bg-green-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Nota
              </button>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button 
              onClick={() => window.print()}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
            >
              <Printer size={20} /> Print Biasa
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
            >
              <Download size={20} /> Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* DOCUMENT PREVIEW - UPDATED FOR COMPACT LAYOUT */}
      <div className="printable-area max-w-[210mm] mx-auto bg-white shadow-2xl p-6 relative text-xs md:text-sm">
        <div className="absolute top-0 left-0 w-full h-2 bg-green-700"></div>

        {/* HEADER - Compact */}
        <div className="flex justify-between items-start border-b-2 border-green-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
             {logo && (
                <div className="w-16 h-16 relative flex-shrink-0">
                    <img src={logo} alt="Company Logo" className="w-full h-full object-contain" />
                </div>
            )}
            <div>
              <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider text-green-900">{sender.name}</h2>
              <p className="text-green-800 font-semibold text-xs mt-0.5 tracking-wide">Distributor, Penerbit Buku, Mitra Pendidikan</p>
              <p className="text-gray-600 text-xs mt-0.5 max-w-[250px] leading-snug">{sender.address}</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-2xl md:text-3xl font-extrabold text-green-800 uppercase tracking-widest">
              {docType === 'suratjalan' ? 'SURAT JALAN' : 'NOTA PENJUALAN'}
            </h1>
            <p className="text-green-600 font-mono mt-1 text-sm md:text-base font-bold">{docNumber}</p>
          </div>
        </div>

        {/* INFO - Compact */}
        <div className="flex justify-between mb-4 text-xs">
          <div className="w-1/2 pr-2">
            <h3 className="font-bold text-green-700 uppercase text-[10px] mb-0.5">Kepada Yth:</h3>
            <div className="p-2 bg-green-50 rounded border border-green-200 shadow-sm">
              <p className="font-bold text-sm text-gray-800">{receiver.name}</p>
              <p className="text-gray-700 mt-0.5 text-xs">{receiver.address}</p>
            </div>
          </div>
          <div className="w-1/3 text-right">
            <h3 className="font-bold text-green-700 uppercase text-[10px] mb-0.5">Tanggal:</h3>
            <p className="font-medium text-sm mb-2 text-gray-800">
              {new Date(docDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* TABLE - Very Compact */}
        <table className="w-full mb-4 border-collapse text-[10px] md:text-xs">
          <thead>
            <tr className="bg-green-800 text-white uppercase tracking-wider">
              <th className="py-1 px-2 text-left w-8 border border-green-800 rounded-tl-sm">No</th>
              <th className="py-1 px-2 text-left border border-green-800">Judul Buku</th>
              <th className="py-1 px-2 text-center w-10 border border-green-800">Kls</th>
              <th className="py-1 px-2 text-center w-12 border border-green-800">Siswa</th>
              <th className="py-1 px-2 text-center w-12 border border-green-800">PG</th>
              
              {docType === 'nota' && (
                <>
                  <th className="py-1 px-2 text-right w-20 border border-green-800">Harga</th>
                  <th className="py-1 px-2 text-right w-24 border border-green-800 rounded-tr-sm">Total</th>
                </>
              )}
              {docType === 'suratjalan' && <th className="hidden"></th>}
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {cart.map((item, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-green-50 transition-colors">
                <td className="py-0.5 px-2 border-l border-r border-gray-100 text-center text-gray-500">{index + 1}</td>
                <td className="py-0.5 px-2 border-r border-gray-100 font-medium text-gray-800">{item.title}</td>
                <td className="py-0.5 px-2 border-r border-gray-100 text-center font-semibold text-gray-700">{item.class}</td>
                <td className="py-0.5 px-2 border-r border-gray-100 text-center font-bold text-green-700">{item.qty_siswa}</td>
                <td className="py-0.5 px-2 border-r border-gray-100 text-center font-bold text-blue-600">{item.qty_bonus > 0 ? item.qty_bonus : '-'}</td>
                
                {docType === 'nota' && (
                  <>
                    <td className="py-0.5 px-2 border-r border-gray-100 text-right text-gray-600">{formatRupiah(item.price)}</td>
                    <td className="py-0.5 px-2 border-r border-gray-100 text-right font-bold text-gray-900">
                      {formatRupiah((item.qty_siswa + item.qty_bonus) * item.price)}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
          
          {docType === 'nota' && (
            <tfoot>
              {/* Total Qty Row */}
               <tr className="bg-gray-50 font-semibold text-gray-600">
                <td colSpan="3" className="py-1 px-2 text-right border-t border-gray-300 text-[10px]">Total Item:</td>
                <td className="py-1 px-2 text-center border-t border-gray-300 text-[10px]">{cart.reduce((a,b)=>a+b.qty_siswa,0)}</td>
                <td className="py-1 px-2 text-center border-t border-gray-300 text-[10px]">{cart.reduce((a,b)=>a+b.qty_bonus,0)}</td>
                <td colSpan="2" className="py-1 px-2 border-t border-gray-300"></td>
              </tr>
              
              {/* Rekapitulasi - Compact */}
              <tr>
                <td colSpan="5" className="py-1 px-2 text-right border-t-2 border-green-800 font-bold text-gray-600 bg-white text-xs">TOTAL KOTOR</td>
                <td colSpan="2" className="py-1 px-2 text-right border-t-2 border-green-800 font-bold text-gray-800 bg-white text-xs">
                  {formatRupiah(calculateTotalGross())}
                </td>
              </tr>
              <tr>
                <td colSpan="5" className="py-1 px-2 text-right font-bold text-red-500 bg-white text-xs">DISKON (Bonus PG)</td>
                <td colSpan="2" className="py-1 px-2 text-right font-bold text-red-500 bg-white text-xs">
                  ({formatRupiah(calculateTotalDiscount())})
                </td>
              </tr>
              <tr className="text-sm">
                <td colSpan="5" className="py-2 px-2 text-right border-t border-green-800 font-bold text-green-800 bg-green-200 rounded-bl-sm">GRAND TOTAL</td>
                <td colSpan="2" className="py-2 px-2 text-right border-t border-green-800 bg-green-200 font-bold text-green-900 rounded-br-sm">
                  {formatRupiah(calculateGrandTotal())}
                </td>
              </tr>
            </tfoot>
          )}
        </table>

        {/* SIGNATURE - Compact */}
        <div className="mt-8 break-inside-avoid">
          {docType === 'suratjalan' ? (
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <p className="font-bold mb-8 text-gray-600 signature-space">Penerima</p>
                <div className="border-b border-gray-300 w-3/4 mx-auto mb-1"></div>
                <p className="text-[10px] text-gray-500 italic">(Nama Terang & Stempel)</p>
              </div>
              <div>
                <p className="font-bold mb-8 text-gray-600 signature-space">Sopir / Kurir</p>
                <div className="border-b border-gray-300 w-3/4 mx-auto mb-1"></div>
                <p className="text-[10px] text-gray-500 italic">(Nama Terang)</p>
              </div>
              <div>
                <p className="font-bold mb-8 text-gray-600 signature-space">Hormat Kami,</p>
                <div className="border-b border-gray-300 w-3/4 mx-auto mb-1"></div>
                <p className="text-[10px] text-green-800 font-bold">CV. Gubuk Pustaka Harmoni</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-between text-center text-xs">
               <div className="w-1/3">
                <p className="mb-0.5 text-transparent">.</p> 
                <p className="font-bold mb-8 text-gray-600 signature-space">Kepala Sekolah</p>
                <div className="border-b border-gray-300 w-3/4 mx-auto mb-1"></div>
                <p className="text-[10px] text-gray-500 italic">(Nama Terang & Stempel)</p>
              </div>
              <div className="w-1/3">
                <p className="mb-0.5 text-gray-600">Sragen, {new Date(docDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-bold mb-8 text-gray-600 signature-space">Hormat Kami,</p>
                <div className="border-b border-gray-300 w-3/4 mx-auto mb-1"></div>
                <p className="text-[10px] font-bold text-green-800 uppercase">CV. Gubuk Pustaka Harmoni</p>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER - Compact */}
        <div className="mt-4 pt-2 border-t border-green-100 text-[10px] text-gray-500 flex justify-between items-end">
          <div className="max-w-[80%]">
            <p className="font-bold text-green-700 mb-0.5">Catatan Penting:</p>
            <ul className="list-disc pl-3 space-y-0">
              <li>Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan kecuali ada perjanjian khusus.</li>
              <li>Mohon periksa kondisi barang saat diterima sebelum menandatangani surat jalan.</li>
              <li>Pembayaran dianggap sah setelah dana masuk ke rekening perusahaan.</li>
            </ul>
          </div>
          <div className="text-right italic text-green-600/50">
            ~ Berilmu & Beradab ~
          </div>
        </div>

      </div>
    </div>
  );
}