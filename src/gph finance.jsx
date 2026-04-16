import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, remove, set, update, runTransaction } from 'firebase/database';
import { Trash2, Plus, Save, Printer, Calendar, CheckSquare, Square, BookOpen, LayoutDashboard, X, Loader, ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, Wallet, DollarSign, Pencil, Edit, History, RefreshCcw, ShoppingBag, List, Send, Users, Store, Package, Search } from 'lucide-react';

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAiI8WtsByC8eNaH8_eyyu97nAOvADeMT0",
  authDomain: "gphfinance-674cb.firebaseapp.com",
  databaseURL: "https://gphfinance-674cb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gphfinance-674cb",
  storageBucket: "gphfinance-674cb.firebasestorage.app",
  messagingSenderId: "247872950244",
  appId: "1:247872950244:web:0130a09f33f3a3952dc1f1",
  measurementId: "G-Q06SCZ9XF1"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- HELPER FORMAT ---
const formatRupiah = (number) => {
  const safeNumber = Number(number) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(safeNumber);
};

const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

// --- STOCK LOGIC (AKUNTANSI) ---

const adjustStock = async (bookId, quantityChange) => {
  if (!bookId) return;
  const bookRef = ref(db, `books/${bookId}/stock`);
  try {
    await runTransaction(bookRef, (currentStock) => {
      return (currentStock || 0) + quantityChange;
    });
  } catch (e) {
    console.error("Stock update failed", e);
  }
};

// --- PDF GENERATOR SERVICE (Dynamic Loader) ---
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

const generatePDF = async (invoices) => {
  try {
    if (!window.jspdf) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.29/jspdf.plugin.autotable.min.js');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4'); // A4 Portrait
    
    // A4 Height ~297mm. We will print 2 invoices per page (Top and Bottom)
    // Top starts at Y=0, Bottom starts at Y=148.5
    const halfHeight = 148.5;
    const pageWidth = doc.internal.pageSize.width;

    // Helper to draw a single invoice at a specific Y position
    const drawInvoice = (invoice, startY) => {
      // Recalculate totals - STRICTLY USE SELLING PRICE (HARGA UMUM) FOR PDF AS REQUESTED
      const items = invoice.items || [];
      const subTotal = items.reduce((acc, item) => {
        // PDF ALWAYS USES SELLING PRICE (Face Value/Harga Umum)
        // Ignoring salesPrice here because it is "Secret"
        const price = Number(item.sellingPrice) || 0;
        return acc + (Number(item.quantity || 0) * price);
      }, 0);

      const discountPct = Number(invoice.discount) || 0;
      const taxPct = Number(invoice.tax) || 0;
      const discountVal = subTotal * (discountPct / 100);
      const taxVal = (subTotal - discountVal) * (taxPct / 100);
      const total = subTotal - discountVal + taxVal;

      // Header
      doc.setFontSize(14); 
      doc.setTextColor(22, 101, 52); 
      doc.setFont("helvetica", "bold");
      doc.text("CV Gubuk Pustaka Harmoni", 15, startY + 15);
      
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      doc.setFont("helvetica", "normal");
      doc.text("PENERBIT DAN PERCETAKAN", 15, startY + 20);
      doc.text("Dusun 2, Pilangrejo, Kec. Gemolong,", 15, startY + 24);
      doc.text("Kabupaten Sragen Jawa Tengah 57274", 15, startY + 28);
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(22, 101, 52);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", pageWidth - 15, startY + 20, { align: 'right' });
  
      doc.setDrawColor(22, 101, 52);
      doc.setLineWidth(0.5);
      doc.line(15, startY + 32, 65, startY + 32);
      doc.setDrawColor(200, 200, 200);
      doc.line(65, startY + 32, pageWidth - 15, startY + 32);
  
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text("GUBUKPUSTAKAHARMONI.COM", 70, startY + 35);
  
      // Bill To Section (Box)
      doc.setFillColor(245, 245, 245);
      doc.rect(15, startY + 40, pageWidth - 30, 28, 'F');
  
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text("Kepada:", 20, startY + 45);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(invoice.school || "-", 20, startY + 50);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(invoice.recipient || "-", 20, startY + 54);
      doc.text(`${invoice.noHp || "-"} / ${invoice.address || "-"}`, 20, startY + 58);
  
      // Meta
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`No : ${invoice.invoiceNo || invoice.id.substring(1, 8).toUpperCase()}`, pageWidth - 20, startY + 45, { align: 'right' });
      doc.setFont("helvetica", "normal");
      doc.text(formatDate(invoice.date), pageWidth - 20, startY + 50, { align: 'right' });
  
      const tableData = items.map((item, i) => {
        // PDF TABLE ALWAYS USES SELLING PRICE (HARGA UMUM)
        const price = Number(item.sellingPrice) || 0;
        return [
          i + 1,
          item.book.name,
          item.quantity,
          formatRupiah(price),
          formatRupiah(Number(item.quantity) * price)
        ];
      });
  
      doc.autoTable({
        startY: startY + 70,
        head: [['No', 'Judul Buku', 'Qty', 'Harga', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [22, 101, 52], textColor: [255, 255, 255], fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 1.5 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { halign: 'left' },
          2: { halign: 'center', cellWidth: 15 },
          3: { halign: 'right', cellWidth: 30 },
          4: { halign: 'right', cellWidth: 30 },
        },
        margin: { left: 15, right: 15 }
      });
  
      const finalY = doc.lastAutoTable.finalY + 5;
      const rightColX = pageWidth - 80;
      
      // Summary
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      
      doc.text("Subtotal", rightColX, finalY + 4);
      doc.text(formatRupiah(subTotal), pageWidth - 15, finalY + 4, { align: 'right' });
  
      if (discountVal > 0) {
          doc.text(`Diskon (${discountPct}%)`, rightColX, finalY + 8);
          doc.text(`- ${formatRupiah(discountVal)}`, pageWidth - 15, finalY + 8, { align: 'right' });
      }

      if (taxVal > 0) {
          doc.text(`PPN (${taxPct}%)`, rightColX, finalY + 12);
          doc.text(`+ ${formatRupiah(taxVal)}`, pageWidth - 15, finalY + 12, { align: 'right' });
      }
      
      const totalY = finalY + (discountVal > 0 || taxVal > 0 ? 16 : 8);

      doc.setFillColor(22, 101, 52);
      doc.rect(rightColX, totalY, pageWidth - rightColX - 15, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("Total", rightColX + 2, totalY + 4);
      doc.text(formatRupiah(total), pageWidth - 17, totalY + 4, { align: 'right' });
  
      // Bank & Sign
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      let bankY = finalY + 5;
      
      doc.setFont("helvetica", "bold");
      doc.text("Bank Transfer:", 15, bankY);
      doc.setFont("helvetica", "normal");
      doc.text("BRI: 0559-0100-0754-567 (CV Gubuk Pustaka Harmoni)", 15, bankY + 4);
      doc.text("MANDIRI: 13800-2675-3595", 15, bankY + 8);
  
      const footerY = startY + halfHeight - 25; // Anchor to bottom of half page
      
      doc.setFontSize(8);
      doc.text("Director", pageWidth - 35, footerY, { align: 'center' });
      doc.setFont("times", "italic");
      doc.setFontSize(12);
      doc.text("Zulfikar Ali", pageWidth - 35, footerY + 10, { align: 'center' });
    };

    // --- LOOP LOGIC: 2 DIFFERENT INVOICES PER PAGE ---
    for (let i = 0; i < invoices.length; i += 2) {
      if (i > 0) doc.addPage();

      // 1. Draw Top Invoice (Invoice A)
      drawInvoice(invoices[i], 0);

      // Always draw the cut line marker in the middle
      doc.setDrawColor(150, 150, 150);
      doc.setLineDashPattern([3, 3], 0);
      doc.line(10, halfHeight, pageWidth - 10, halfHeight);
      doc.setLineDashPattern([], 0); // Reset
      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      doc.text("- - - Potong di sini - - -", pageWidth / 2, halfHeight - 2, { align: 'center' });

      // 2. Draw Bottom Invoice (Invoice B) - only if it exists
      if (i + 1 < invoices.length) {
        drawInvoice(invoices[i + 1], halfHeight);
      }
    }
  
    doc.save(`invoices_gph_${new Date().getTime()}.pdf`);
  } catch (err) {
    console.error("PDF Generation failed:", err);
    alert("Gagal memuat library PDF. Periksa koneksi internet Anda.");
  }
};

// --- COMPONENTS ---

// ... BooksPage component remains the same ...
const BooksPage = () => {
  const [books, setBooks] = useState([]);
  const [invoices, setInvoices] = useState([]); // Needed for history
  const [form, setForm] = useState({ name: '', costPrice: 0, sellingPrice: 12000, salesPrice: 10000, stock: 0 });
  const [editingId, setEditingId] = useState(null);
  const [viewHistoryBook, setViewHistoryBook] = useState(null); // Book ID for modal history
  const [showStockOpname, setShowStockOpname] = useState(false);
  const [opnameForm, setOpnameForm] = useState({ bookId: '', adjustment: 0, reason: '' });

  useEffect(() => {
    const booksRef = ref(db, 'books');
    onValue(booksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setBooks(list);
      } else {
        setBooks([]);
      }
    });

    const invRef = ref(db, 'invoices');
    onValue(invRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setInvoices(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      } else {
        setInvoices([]);
      }
    });
  }, []);

  const handleSaveBook = () => {
    if (!form.name) return alert("Nama buku wajib diisi");
    
    const bookData = {
      ...form,
      costPrice: Number(form.costPrice) || 0,
      sellingPrice: Number(form.sellingPrice) || 0,
      salesPrice: Number(form.salesPrice) || 0,
      stock: Number(form.stock) || 0
    };

    if (editingId) {
      update(ref(db, `books/${editingId}`), bookData)
        .then(() => {
          setEditingId(null);
          setForm({ name: '', costPrice: 0, sellingPrice: 12000, salesPrice: 10000, stock: 0 });
        })
        .catch(err => alert("Gagal update: " + err.message));
    } else {
      const newBookRef = push(ref(db, 'books'));
      set(newBookRef, {
        ...bookData,
        createdAt: Date.now()
      }).catch(err => alert("Gagal simpan: " + err.message));
      setForm({ name: '', costPrice: 0, sellingPrice: 12000, salesPrice: 10000, stock: 0 });
    }
  };

  const handleEdit = (book) => {
    setForm({
      name: book.name,
      costPrice: book.costPrice,
      sellingPrice: book.sellingPrice,
      salesPrice: book.salesPrice,
      stock: book.stock || 0
    });
    setEditingId(book.id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', costPrice: 0, sellingPrice: 12000, salesPrice: 10000, stock: 0 });
  };

  const handleDelete = (id) => {
    if (confirm("Hapus buku ini?")) {
      remove(ref(db, `books/${id}`));
    }
  };

  const handleOpname = async () => {
    if (!opnameForm.bookId || opnameForm.adjustment === 0) return alert("Pilih buku dan isi penyesuaian");
    
    await adjustStock(opnameForm.bookId, Number(opnameForm.adjustment));
    
    // Optional: Save opname history log here if needed
    alert("Stok berhasil disesuaikan");
    setShowStockOpname(false);
    setOpnameForm({ bookId: '', adjustment: 0, reason: '' });
  };

  // Filter invoices containing specific book
  const getBookHistory = (bookId) => {
    return invoices.filter(inv => 
      inv.items && inv.items.some(item => item.book.id === bookId)
    ).sort((a,b) => b.createdAt - a.createdAt);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-800 flex items-center gap-2">
          <BookOpen /> Data Buku & Stok
        </h2>
        <button 
          onClick={() => setShowStockOpname(!showStockOpname)}
          className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600 flex items-center gap-2"
        >
          <RefreshCcw size={16} /> Stock Opname
        </button>
      </div>

      {/* Stock Opname Modal */}
      {showStockOpname && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-6">
          <h3 className="font-bold text-orange-800 mb-2">Form Stock Opname (Penyesuaian)</h3>
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-orange-800">Pilih Buku</label>
              <select 
                className="w-full border p-2 rounded text-sm"
                value={opnameForm.bookId}
                onChange={e => setOpnameForm({...opnameForm, bookId: e.target.value})}
              >
                <option value="">-- Pilih Buku --</option>
                {books.map(b => <option key={b.id} value={b.id}>{b.name} (Stok: {b.stock || 0})</option>)}
              </select>
            </div>
            <div className="w-32">
              <label className="text-xs font-semibold text-orange-800">Penyesuaian (+/-)</label>
              <input 
                type="number" 
                className="w-full border p-2 rounded text-sm"
                placeholder="Contoh: 5 atau -2"
                value={opnameForm.adjustment}
                onChange={e => setOpnameForm({...opnameForm, adjustment: e.target.value})}
              />
            </div>
            <button onClick={handleOpname} className="bg-orange-600 text-white px-4 py-2 rounded h-10">Simpan</button>
          </div>
          <p className="text-xs text-gray-500 mt-2">* Masukkan angka positif untuk menambah stok (retur/stok awal), negatif untuk mengurangi (rusak/hilang).</p>
        </div>
      )}

      {/* Book History Modal */}
      {viewHistoryBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">Riwayat Pembelian: {books.find(b=>b.id===viewHistoryBook)?.name}</h3>
              <button onClick={() => setViewHistoryBook(null)}><X /></button>
            </div>
            <div className="p-0 overflow-auto flex-1">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Invoice</th>
                    <th className="p-3">Pembeli</th>
                    <th className="p-3 text-right">Qty Beli</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {getBookHistory(viewHistoryBook).map(inv => {
                    const item = inv.items.find(i => i.book.id === viewHistoryBook);
                    return (
                      <tr key={inv.id}>
                        <td className="p-3">{formatDate(inv.date)}</td>
                        <td className="p-3 font-mono text-xs">{inv.invoiceNo}</td>
                        <td className="p-3 font-medium">{inv.school}</td>
                        <td className="p-3 text-right font-bold text-green-700">{item?.quantity || 0}</td>
                      </tr>
                    )
                  })}
                  {getBookHistory(viewHistoryBook).length === 0 && (
                    <tr><td colSpan="4" className="p-4 text-center text-gray-500">Belum ada transaksi</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Buku</label>
          <input 
            type="text" 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            placeholder="Contoh: Buku Elkapede"
          />
        </div>
        <div className="w-24">
          <label className="block text-sm font-medium text-gray-700 mb-1">Stok Awal</label>
          <input 
            type="number" 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none bg-gray-50"
            value={form.stock}
            disabled={editingId} // Disable editing stock directly here to enforce accounting/opname
            title={editingId ? "Gunakan Stock Opname untuk ubah stok" : "Isi stok awal"}
            onChange={e => setForm({...form, stock: e.target.value})}
          />
        </div>
        <div className="w-28">
          <label className="block text-sm font-medium text-gray-700 mb-1">Hrg Modal</label>
          <input 
            type="number" 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none"
            value={form.costPrice}
            onChange={e => setForm({...form, costPrice: e.target.value})}
          />
        </div>
        <div className="w-28">
          <label className="block text-sm font-medium text-gray-700 mb-1">Hrg Sales</label>
          <input 
            type="number" 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none"
            value={form.salesPrice}
            onChange={e => setForm({...form, salesPrice: e.target.value})}
          />
        </div>
        <div className="w-28">
          <label className="block text-sm font-medium text-gray-700 mb-1">Hrg Umum</label>
          <input 
            type="number" 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none"
            value={form.sellingPrice}
            onChange={e => setForm({...form, sellingPrice: e.target.value})}
          />
        </div>
        <div className="flex gap-2">
          {editingId && (
            <button 
              onClick={handleCancelEdit}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex items-center gap-2"
            >
              <X size={18} /> Batal
            </button>
          )}
          <button 
            onClick={handleSaveBook}
            className={`text-white px-4 py-2 rounded flex items-center gap-2 ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-700 hover:bg-green-800'}`}
          >
            {editingId ? <Save size={18} /> : <Plus size={18} />}
            {editingId ? 'Update' : 'Tambah'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-green-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-green-800 uppercase tracking-wider">Nama Buku</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-green-800 uppercase tracking-wider">Stok</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-green-800 uppercase tracking-wider">Modal</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-green-800 uppercase tracking-wider">Hrg Sales</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-green-800 uppercase tracking-wider">Hrg Umum</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-green-800 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {books.map((book) => (
              <tr key={book.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{book.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    (book.stock || 0) < 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {book.stock || 0}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{formatRupiah(book.costPrice)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">{formatRupiah(book.salesPrice)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-semibold">{formatRupiah(book.sellingPrice)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center flex justify-center gap-2">
                  <button onClick={() => setViewHistoryBook(book.id)} className="text-gray-600 hover:text-green-800" title="Riwayat Pembeli">
                    <History size={18} />
                  </button>
                  <button onClick={() => handleEdit(book)} className="text-blue-600 hover:text-blue-900" title="Edit">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => handleDelete(book.id)} className="text-red-600 hover:text-red-900" title="Hapus">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {books.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">Belum ada data buku</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CreateInvoicePage = ({ setActiveView, invoiceToEdit, setInvoiceToEdit }) => {
  const [books, setBooks] = useState([]);
  
  // State for Current Invoice Being Built
  const [cart, setCart] = useState([]);
  const [header, setHeader] = useState({
    school: '', recipient: '', address: '', noHp: '', date: new Date().toISOString().split('T')[0]
  });
  
  // State for Batch/Queue (List of Invoices waiting to be saved)
  const [invoiceQueue, setInvoiceQueue] = useState([]);
  
  const [selectedBookId, setSelectedBookId] = useState('');
  const [priceType, setPriceType] = useState('umum');
  const [qty, setQty] = useState(1);
  const [priceOverride, setPriceOverride] = useState(0);

  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);

  useEffect(() => {
    const booksRef = ref(db, 'books');
    onValue(booksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBooks(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      }
    });
  }, []);

  useEffect(() => {
    // If editing existing invoice, disable queue mode (simplified for edit logic)
    if (invoiceToEdit) {
      setHeader({
        school: invoiceToEdit.school,
        recipient: invoiceToEdit.recipient,
        address: invoiceToEdit.address,
        noHp: invoiceToEdit.noHp,
        date: invoiceToEdit.date
      });
      setCart(invoiceToEdit.items || []);
      setDiscountPercent(invoiceToEdit.discount || 0);
      setTaxPercent(invoiceToEdit.tax || 0);
    }
  }, [invoiceToEdit]);

  useEffect(() => {
    if (selectedBookId) {
      const b = books.find(x => x.id === selectedBookId);
      if (b) {
        setPriceOverride(priceType === 'sales' ? (b.salesPrice || 0) : (b.sellingPrice || 0));
      }
    }
  }, [selectedBookId, priceType, books]);

  const addToCart = () => {
    if (!selectedBookId) return;
    const book = books.find(b => b.id === selectedBookId);
    
    const quantity = Number(qty) || 0;
    const price = Number(priceOverride) || 0;
    const cost = Number(book.costPrice) || 0; 

    const newItem = {
      book: { id: book.id, name: book.name },
      quantity: quantity,
      costPrice: cost,
      sellingPrice: price, // Compatibility for old data
      salesPrice: price,   // NEW: Explicitly storing Sales Price as requested
      totalPrice: quantity * price,
      priceType: priceType // SAVING PRICE TYPE FOR DASHBOARD BREAKDOWN
    };

    setCart([...cart, newItem]);
  };

  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  const handleCancel = () => {
    if (setInvoiceToEdit) setInvoiceToEdit(null);
    setActiveView('history');
  };

  const removeFromQueue = (index) => {
    const newQueue = invoiceQueue.filter((_, i) => i !== index);
    setInvoiceQueue(newQueue);
  };

  // Calculations for current cart
  const subTotal = cart.reduce((acc, item) => acc + (Number(item.totalPrice) || 0), 0);
  const totalDiscount = Math.round(subTotal * (Number(discountPercent || 0) / 100));
  const totalTax = Math.round((subTotal - totalDiscount) * (Number(taxPercent || 0) / 100));
  const total = subTotal - totalDiscount + totalTax;

  // --- NEW LOGIC: ADD TO QUEUE (Instead of saving to DB directly) ---
  const handleAddToQueue = () => {
    if (cart.length === 0) return alert("Keranjang kosong!");
    if (!header.school) return alert("Nama Sekolah/Instansi wajib diisi");

    const newInvoiceObject = {
      ...header,
      items: cart,
      subTotal: Number(subTotal) || 0,
      discount: Number(discountPercent) || 0,
      totalDiscount: Number(totalDiscount) || 0,
      tax: Number(taxPercent) || 0,
      totalTax: Number(totalTax) || 0,
      total: Number(total) || 0,
      tempId: Date.now() // temporary ID for frontend key
    };

    setInvoiceQueue([...invoiceQueue, newInvoiceObject]);
    
    // Reset Form for Next School, but keep Date
    setCart([]);
    setHeader(prev => ({
        school: '', 
        recipient: '', 
        address: '', 
        noHp: '', 
        date: prev.date 
    }));
    setDiscountPercent(0);
    setTaxPercent(0);
    
    // Scroll to top or alert visual cue
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- NEW LOGIC: BATCH SAVE TO FIREBASE ---
  const handleSaveAllInvoices = async () => {
    if (invoiceQueue.length === 0) return;
    if (!confirm(`Simpan ${invoiceQueue.length} transaksi sekaligus? Stok akan dipotong.`)) return;

    try {
        const promises = invoiceQueue.map(async (invoice) => {
            const finalData = {
                ...invoice,
                createdAt: Date.now(),
                invoiceNo: `INV-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}` // Random unique for batch
            };
            delete finalData.tempId; // remove temp id

            // 1. Deduct Stock
            for (const item of invoice.items) {
                await adjustStock(item.book.id, -Number(item.quantity));
            }

            // 2. Push Invoice
            return push(ref(db, 'invoices'), finalData);
        });

        await Promise.all(promises);
        
        alert("Semua Transaksi Berhasil Disimpan!");
        setInvoiceQueue([]);
        setActiveView('history');

    } catch (error) {
        console.error(error);
        alert("Terjadi kesalahan saat menyimpan batch: " + error.message);
    }
  };

  // OLD SINGLE UPDATE LOGIC (For editing existing only)
  const handleUpdateSingle = async () => {
      const invoiceData = {
        ...header,
        items: cart,
        subTotal: Number(subTotal) || 0,
        discount: Number(discountPercent) || 0,
        totalDiscount: Number(totalDiscount) || 0,
        tax: Number(taxPercent) || 0,
        totalTax: Number(totalTax) || 0,
        total: Number(total) || 0,
        createdAt: invoiceToEdit.createdAt,
        invoiceNo: invoiceToEdit.invoiceNo
      };

      // Accounting: Revert Old Stock, Then Apply New Stock
      const oldItems = invoiceToEdit.items || [];
      for (const item of oldItems) {
          await adjustStock(item.book.id, Number(item.quantity)); 
      }
      for (const item of cart) {
          await adjustStock(item.book.id, -Number(item.quantity));
      }

      await update(ref(db, `invoices/${invoiceToEdit.id}`), invoiceData);
      alert("Transaksi diperbarui!");
      setInvoiceToEdit(null);
      setActiveView('history');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-800 flex items-center gap-2">
          {invoiceToEdit ? <Edit /> : <Plus />} 
          {invoiceToEdit ? 'Edit Transaksi' : 'Buat Transaksi Baru (Batch)'}
        </h2>
        <button onClick={handleCancel} className="text-gray-500 hover:text-green-800">
          <X />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form (Consumes 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 1. School Info */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-green-100">
            <h3 className="font-bold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">
                <ShoppingBag size={18}/> Info Sekolah / Customer
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500">Tanggal</label>
                <input 
                  type="date" 
                  className="w-full border p-2 rounded text-sm"
                  value={header.date}
                  onChange={e => setHeader({...header, date: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Sekolah / Instansi</label>
                <input 
                  type="text" 
                  className="w-full border p-2 rounded text-sm bg-yellow-50"
                  placeholder="Nama Sekolah"
                  value={header.school}
                  onChange={e => setHeader({...header, school: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Penerima</label>
                <input 
                  type="text" 
                  className="w-full border p-2 rounded text-sm"
                  placeholder="Nama Penerima"
                  value={header.recipient}
                  onChange={e => setHeader({...header, recipient: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Alamat</label>
                <textarea 
                  className="w-full border p-2 rounded text-sm h-16"
                  placeholder="Alamat Lengkap"
                  value={header.address}
                  onChange={e => setHeader({...header, address: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">No HP</label>
                <input 
                  type="text" 
                  className="w-full border p-2 rounded text-sm"
                  placeholder="08xx-xxxx-xxxx"
                  value={header.noHp}
                  onChange={e => setHeader({...header, noHp: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* 2. Add Book Form */}
          <div className="bg-green-50 p-5 rounded-lg border border-green-200">
            <h3 className="font-bold text-green-800 mb-3 border-b border-green-200 pb-2">Pilih Buku</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-green-700">Tipe Harga</label>
                <div className="flex gap-2">
                  <button 
                    className={`flex-1 py-1 text-xs rounded border ${priceType === 'umum' ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-600 border-gray-300'}`}
                    onClick={() => setPriceType('umum')}
                  >
                    Umum
                  </button>
                  <button 
                    className={`flex-1 py-1 text-xs rounded border ${priceType === 'sales' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}
                    onClick={() => setPriceType('sales')}
                  >
                    Sales
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-green-700">Judul Buku</label>
                <select 
                  className="w-full border p-2 rounded text-sm bg-white"
                  value={selectedBookId}
                  onChange={e => setSelectedBookId(e.target.value)}
                >
                  <option value="">-- Pilih Buku --</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} (Stok: {b.stock || 0})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-green-700">Qty</label>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full border p-2 rounded text-sm"
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                  />
                </div>
                <div className="flex-[2]">
                  <label className="text-xs font-semibold text-green-700">Harga (Rp)</label>
                  <input 
                    type="number" 
                    className="w-full border p-2 rounded text-sm"
                    value={priceOverride}
                    onChange={e => setPriceOverride(e.target.value)}
                  />
                </div>
              </div>
              <button 
                onClick={addToCart}
                className="w-full bg-green-700 text-white py-2 rounded shadow hover:bg-green-800 font-semibold"
              >
                + Tambah Item
              </button>
            </div>
          </div>
        </div>

        {/* Middle Column: Current Cart & Actions (Consumes 4 cols) */}
        <div className="lg:col-span-4 flex flex-col h-full">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-bold text-gray-700">Item untuk: {header.school || "..."}</h3>
            </div>
            
            <div className="flex-1 overflow-auto p-0 min-h-[300px]">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 font-medium">
                  <tr>
                    <th className="p-3">Item</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cart.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3">
                        <div className="font-medium text-xs">{item.book.name}</div>
                        <div className="text-[10px] text-gray-400">@ {formatRupiah(item.sellingPrice)}</div>
                      </td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-right font-medium">{formatRupiah(item.totalPrice)}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => removeFromCart(idx)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cart.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-gray-400 italic">
                        Belum ada buku dipilih untuk sekolah ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t bg-gray-50">
                {/* Discount & Tax inputs inside the cart summary */}
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">Diskon (%):</span>
                    <input type="number" className="w-12 border rounded text-right text-xs" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} />
                </div>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-600">Pajak (%):</span>
                    <input type="number" className="w-12 border rounded text-right text-xs" value={taxPercent} onChange={e => setTaxPercent(e.target.value)} />
                </div>
                
              <div className="flex justify-between items-center border-t pt-2 mb-4">
                <span className="font-bold text-gray-800">Total:</span>
                <span className="font-bold text-green-800 text-lg">{formatRupiah(total)}</span>
              </div>
              
              {invoiceToEdit ? (
                  <button 
                    onClick={handleUpdateSingle}
                    className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold shadow"
                  >
                    UPDATE TRANSAKSI INI
                  </button>
              ) : (
                  <button 
                    onClick={handleAddToQueue}
                    disabled={cart.length === 0}
                    className={`w-full py-3 rounded-lg text-white font-bold shadow flex items-center justify-center gap-2 ${cart.length === 0 ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    <Plus size={18} /> TAMBAH KE ANTREAN
                  </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Queue List (Consumes 4 cols) */}
        {!invoiceToEdit && (
            <div className="lg:col-span-4 flex flex-col h-full">
            <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 flex-1 flex flex-col">
                <div className="p-4 bg-yellow-100 border-b border-yellow-200 flex justify-between items-center">
                <h3 className="font-bold text-yellow-800 flex items-center gap-2">
                    <List size={18} /> Antrean ({invoiceQueue.length})
                </h3>
                </div>
                
                <div className="flex-1 overflow-auto p-0 min-h-[300px]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-yellow-100 text-yellow-800 font-medium">
                    <tr>
                        <th className="p-3">Sekolah</th>
                        <th className="p-3 text-center">Buku</th>
                        <th className="p-3 text-right">Total</th>
                        <th className="p-3 w-10"></th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-yellow-200">
                    {invoiceQueue.map((inv, idx) => (
                        <tr key={idx} className="bg-white hover:bg-yellow-50">
                        <td className="p-3">
                            <div className="font-bold text-gray-800">{inv.school}</div>
                            <div className="text-xs text-gray-500">{inv.items.length} jenis buku</div>
                        </td>
                        <td className="p-3 text-center font-bold">
                            {inv.items.reduce((acc, i) => acc + Number(i.quantity), 0)}
                        </td>
                        <td className="p-3 text-right font-medium text-green-700">
                            {formatRupiah(inv.total)}
                        </td>
                        <td className="p-3 text-center">
                            <button onClick={() => removeFromQueue(idx)} className="text-red-500 hover:text-red-700">
                            <X size={16} />
                            </button>
                        </td>
                        </tr>
                    ))}
                    {invoiceQueue.length === 0 && (
                        <tr>
                        <td colSpan="4" className="p-8 text-center text-gray-400 italic">
                            Belum ada antrean transaksi. <br/>Input sekolah di kiri lalu klik "Tambah ke Antrean".
                        </td>
                        </tr>
                    )}
                    </tbody>
                </table>
                </div>

                <div className="p-4 border-t border-yellow-200 bg-yellow-50">
                <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-gray-700">Grand Total:</span>
                    <span className="font-bold text-2xl text-green-800">
                        {formatRupiah(invoiceQueue.reduce((acc, inv) => acc + inv.total, 0))}
                    </span>
                </div>
                
                <button 
                    onClick={handleSaveAllInvoices}
                    disabled={invoiceQueue.length === 0}
                    className={`w-full py-4 rounded-lg text-white font-bold shadow-lg flex items-center justify-center gap-2 ${invoiceQueue.length === 0 ? 'bg-gray-400' : 'bg-green-700 hover:bg-green-800'}`}
                >
                    <Save size={20} /> SIMPAN SEMUA ({invoiceQueue.length})
                </button>
                </div>
            </div>
            </div>
        )}
      </div>
    </div>
  );
};

// HELPER FOR RECALCULATING INVOICE ON THE FLY
const calculateInvoiceReal = (inv) => {
  if (!inv || !inv.items) return 0;
  
  const subTotal = (inv.items || []).reduce((acc, item) => {
    // Prioritize salesPrice if it exists, otherwise fallback to sellingPrice
    const price = (item.salesPrice !== undefined && item.salesPrice !== null) 
                  ? Number(item.salesPrice) 
                  : (Number(item.sellingPrice) || 0);
    return acc + (Number(item.quantity || 0) * price);
  }, 0);

  const discountPercent = Number(inv.discount) || 0;
  const discountAmount = subTotal * (discountPercent / 100);
  const taxPercent = Number(inv.tax) || 0;
  const taxAmount = (subTotal - discountAmount) * (taxPercent / 100);

  return subTotal - discountAmount + taxAmount;
};

const HistoryPage = ({ onEditInvoice }) => {
  const [invoices, setInvoices] = useState([]);
  const [books, setBooks] = useState([]); 
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // NEW STATE
  
  // Default dates: Jan 1st of current year to Today (Inclusive)
  const now = new Date();
  const currentYear = now.getFullYear();
  // Ensure strict YYYY-MM-DD format with padding
  const todayStr = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const startYearStr = `${currentYear}-01-01`;

  const [dateStart, setDateStart] = useState(startYearStr);
  const [dateEnd, setDateEnd] = useState(todayStr);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  useEffect(() => {
    const invRef = ref(db, 'invoices');
    onValue(invRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setInvoices(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      } else {
        setInvoices([]);
      }
    });

    const booksRef = ref(db, 'books');
    onValue(booksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBooks(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      }
    });
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processedData = useMemo(() => {
    let filtered = invoices.filter(inv => {
      // Date filter logic with strict time boundaries
      const invDate = new Date(inv.date);
      const invTime = invDate.getTime();
      
      let startTime = 0;
      if (dateStart) {
        const sd = new Date(dateStart);
        sd.setHours(0,0,0,0);
        startTime = sd.getTime();
      }
      
      let endTime = Infinity;
      if (dateEnd) {
        const ed = new Date(dateEnd);
        ed.setHours(23,59,59,999);
        endTime = ed.getTime();
      }

      const isDateMatch = invTime >= startTime && invTime <= endTime;

      if (!isDateMatch) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          (inv.school || '').toLowerCase().includes(q) ||
          (inv.recipient || '').toLowerCase().includes(q) ||
          (inv.address || '').toLowerCase().includes(q)
        );
      }

      return true;
    });

    return filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'itemCount') {
        aValue = (a.items || []).length;
        bValue = (b.items || []).length;
      }
      else if (sortConfig.key === 'date') {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      }
      else if (sortConfig.key === 'total') {
        aValue = calculateInvoiceReal(a);
        bValue = calculateInvoiceReal(b);
      }
      else if (sortConfig.key === 'school' || sortConfig.key === 'recipient' || sortConfig.key === 'address') {
        aValue = (a[sortConfig.key] || '').toLowerCase();
        bValue = (b[sortConfig.key] || '').toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [invoices, dateStart, dateEnd, sortConfig, searchQuery]);

  const dashboard = useMemo(() => {
    let retailRevenue = 0;
    let salesRevenue = 0;
    let totalCost = 0;
    let totalSalesGross = 0; 
    let totalInvoiceDiscounts = 0; 
    let totalInvoiceTaxes = 0; 
    let totalQty = 0;

    processedData.forEach(inv => {
      // Calculate real invoice total
      const invSubTotal = inv.items ? inv.items.reduce((a, b) => {
        const price = (b.salesPrice !== undefined && b.salesPrice !== null) 
                      ? Number(b.salesPrice) 
                      : (Number(b.sellingPrice) || 0);
        return a + (price * Number(b.quantity));
      }, 0) : 0;

      const invRealTotal = calculateInvoiceReal(inv); 
      
      const discountPct = Number(inv.discount) || 0;
      const taxPct = Number(inv.tax) || 0;
      const discountVal = invSubTotal * (discountPct / 100);
      const taxVal = (invSubTotal - discountVal) * (taxPct / 100);

      totalInvoiceDiscounts += discountVal;
      totalInvoiceTaxes += taxVal;

      if (inv.items) {
        inv.items.forEach(item => {
          const qty = Number(item.quantity) || 0;
          totalQty += qty;
          
          // Real Price used for Profit & Sales Revenue
          const linePrice = (item.salesPrice !== undefined && item.salesPrice !== null) 
                            ? Number(item.salesPrice) 
                            : (Number(item.sellingPrice) || 0);

          const lineTotalGross = linePrice * qty;
          totalSalesGross += lineTotalGross;

          // Cost
          let cost = Number(item.costPrice);
          const bookRef = books.find(b => b.id === item.book.id);
          if (isNaN(cost)) {
             cost = bookRef ? Number(bookRef.costPrice) : 0;
          }
          const totalLineCost = cost * qty;
          totalCost += totalLineCost;

          // --- REVISED DASHBOARD LOGIC ---
          // 1. Retail Revenue (Omzet Retail): Sum of (Selling Price * Qty) for ALL items
          // This represents the "Face Value" or "Public Price" value of goods sold.
          const standardPrice = Number(item.sellingPrice) || 0;
          retailRevenue += (standardPrice * qty);

          // 2. Sales Revenue (Omzet Sales / Real): Sum of (Actual Price * Qty)
          // This is the actual money coming in (before invoice-level discounts)
          salesRevenue += lineTotalGross;
        });
      }
    });

    const profit = (totalSalesGross - totalCost) - totalInvoiceDiscounts + totalInvoiceTaxes;

    return {
      retailRevenue,
      salesRevenue,
      totalCost,
      profit,
      totalQty
    };
  }, [processedData, books]);

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === processedData.length && processedData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(processedData.map(i => i.id)));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus transaksi ini? Stok akan dikembalikan.")) return;
    
    const inv = invoices.find(i => i.id === id);
    if (inv && inv.items) {
          for (const item of inv.items) {
            await adjustStock(item.book.id, Number(item.quantity)); 
          }
    }
    await remove(ref(db, `invoices/${id}`));
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Hapus ${selectedIds.size} transaksi terpilih? Stok akan dikembalikan.`)) return;
    
    setIsDeleting(true);
    try {
      const updates = {};
      const stockAdjustments = [];

      const idsToDelete = Array.from(selectedIds);

      for (const id of idsToDelete) {
        const inv = invoices.find(i => i.id === id);
        if (inv) {
          updates[`invoices/${id}`] = null;
          if (inv.items) {
            for (const item of inv.items) {
              stockAdjustments.push(() => adjustStock(item.book.id, Number(item.quantity)));
            }
          }
        }
      }

      for (const adjustFn of stockAdjustments) {
        await adjustFn();
      }

      await update(ref(db), updates);

      setSelectedIds(new Set());
      alert('Berhasil dihapus');
    } catch (error) {
      console.error("Bulk delete error", error);
      alert("Gagal menghapus beberapa data: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkPrint = async () => {
    const toPrint = processedData.filter(inv => selectedIds.has(inv.id));
    if (toPrint.length === 0) return alert("Pilih transaksi dulu!");
    
    setLoadingPdf(true);
    await generatePDF(toPrint);
    setLoadingPdf(false);
  };

  const SortIcon = ({ colKey }) => {
    if (sortConfig.key !== colKey) return <ArrowUpDown size={14} className="ml-1 text-gray-300" />;
    return sortConfig.direction === 'asc' ? 
      <ArrowUp size={14} className="ml-1 text-green-800" /> : 
      <ArrowDown size={14} className="ml-1 text-green-800" />;
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-green-800 flex items-center gap-2">
        <LayoutDashboard /> Riwayat & Keuangan
      </h2>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-green-100 flex flex-col justify-between">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase mb-1">Total Nilai Retail</p>
            <h3 className="text-xl font-bold text-green-800">{formatRupiah(dashboard.retailRevenue)}</h3>
          </div>
          <div className="self-end p-2 bg-green-50 text-green-600 rounded-lg mt-2">
            <Store size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-blue-100 flex flex-col justify-between">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase mb-1">Total Omzet (Real)</p>
            <h3 className="text-xl font-bold text-blue-800">{formatRupiah(dashboard.salesRevenue)}</h3>
          </div>
          <div className="self-end p-2 bg-blue-50 text-blue-600 rounded-lg mt-2">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-orange-100 flex flex-col justify-between">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase mb-1">Total Modal</p>
            <h3 className="text-xl font-bold text-orange-800">{formatRupiah(dashboard.totalCost)}</h3>
          </div>
          <div className="self-end p-2 bg-orange-50 text-orange-600 rounded-lg mt-2">
            <Wallet size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-purple-100 flex flex-col justify-between">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase mb-1">Total Profit Bersih</p>
            <h3 className={`text-xl font-bold ${dashboard.profit >= 0 ? 'text-purple-800' : 'text-red-600'}`}>
              {formatRupiah(dashboard.profit)}
            </h3>
          </div>
          <div className={`self-end p-2 rounded-lg mt-2 ${dashboard.profit >= 0 ? 'bg-purple-50 text-purple-600' : 'bg-red-50 text-red-600'}`}>
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-100 flex flex-col justify-between">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase mb-1">Total Buku Terjual</p>
            <h3 className="text-xl font-bold text-indigo-800">{dashboard.totalQty} <span className="text-sm font-normal text-gray-500">Eks</span></h3>
          </div>
          <div className="self-end p-2 bg-indigo-50 text-indigo-600 rounded-lg mt-2">
            <BookOpen size={20} />
          </div>
        </div>
      </div>

      {/* Filter & Actions Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-500" />
            <input 
              type="date" 
              className="border rounded p-1 text-sm"
              value={dateStart}
              onChange={e => setDateStart(e.target.value)}
            />
            <span className="text-gray-400">-</span>
            <input 
              type="date" 
              className="border rounded p-1 text-sm"
              value={dateEnd}
              onChange={e => setDateEnd(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <Search size={18} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari Sekolah, Nama, Alamat..." 
              className="pl-8 border rounded p-1 text-sm w-64"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <>
              <button 
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="bg-red-100 text-red-700 px-3 py-1.5 rounded hover:bg-red-200 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
              >
                {isDeleting ? <Loader className="animate-spin" size={16} /> : <Trash2 size={16} />} 
                Hapus ({selectedIds.size})
              </button>
              <button 
                onClick={handleBulkPrint}
                disabled={loadingPdf || isDeleting}
                className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 flex items-center gap-2 text-sm font-medium disabled:bg-blue-300"
              >
                {loadingPdf ? <Loader className="animate-spin" size={16} /> : <Printer size={16} />}
                Download PDF ({selectedIds.size})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 w-10 text-center">
                <button onClick={toggleSelectAll}>
                  {selectedIds.size === processedData.length && processedData.length > 0 ? 
                    <CheckSquare size={18} className="text-green-700" /> : 
                    <Square size={18} className="text-gray-400" />
                  }
                </button>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center">Tanggal <SortIcon colKey="date" /></div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('school')}
              >
                <div className="flex items-center">Sekolah <SortIcon colKey="school" /></div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('recipient')}
              >
                <div className="flex items-center">Penerima <SortIcon colKey="recipient" /></div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('address')}
              >
                <div className="flex items-center">Alamat <SortIcon colKey="address" /></div>
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('total')}
              >
                <div className="flex items-center justify-end">Total <SortIcon colKey="total" /></div>
              </th>
              <th 
                className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('itemCount')}
              >
                <div className="flex items-center justify-center">Total Qty <SortIcon colKey="itemCount" /></div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedData.map((inv) => (
              <tr key={inv.id} className={`hover:bg-green-50 ${selectedIds.has(inv.id) ? 'bg-green-50' : ''}`}>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleSelect(inv.id)}>
                    {selectedIds.has(inv.id) ? 
                      <CheckSquare size={18} className="text-green-700" /> : 
                      <Square size={18} className="text-gray-300" />
                    }
                  </button>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(inv.date)}</td>
                <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{inv.school}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{inv.recipient || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate" title={inv.address}>{inv.address || '-'}</td>
                <td className="px-4 py-3 text-sm text-right font-bold text-gray-800">
                  {formatRupiah(calculateInvoiceReal(inv))}
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-500 font-medium">
                  {(inv.items || []).reduce((sum, item) => sum + Number(item.quantity), 0)}
                </td>
                <td className="px-4 py-3 text-center">
                   <button 
                     onClick={() => onEditInvoice(inv)} 
                     className="text-blue-600 hover:text-blue-900 mx-1" 
                     title="Edit Transaksi"
                   >
                     <Pencil size={18} />
                   </button>
                   <button 
                     onClick={() => handleDelete(inv.id)} 
                     className="text-red-600 hover:text-red-900 mx-1" 
                     title="Hapus Transaksi"
                   >
                     <Trash2 size={18} />
                   </button>
                </td>
              </tr>
            ))}
            {processedData.length === 0 && (
              <tr>
                <td colSpan="9" className="p-8 text-center text-gray-400">Tidak ada transaksi ditemukan</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ... App Component remains the same ...
function App() {
  const [view, setView] = useState('history'); 
  const [invoiceToEdit, setInvoiceToEdit] = useState(null);

  // AUTO INJECT TAILWIND FOR LOCAL USE
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.tailwindcss.com";
    document.head.appendChild(script);
  }, []);

  const handleCreateNew = () => {
    setInvoiceToEdit(null);
    setView('create');
  };

  const handleEditInvoice = (invoice) => {
    setInvoiceToEdit(invoice);
    setView('create');
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      <nav className="bg-green-800 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded-full text-green-800 font-bold w-8 h-8 flex items-center justify-center">
                GP
              </div>
              <span className="font-bold text-lg tracking-wide">Gubuk Pustaka Finance</span>
            </div>
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setView('history')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'history' ? 'bg-green-900 text-white' : 'text-green-100 hover:bg-green-700'}`}
              >
                Riwayat
              </button>
              <button 
                onClick={() => setView('books')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'books' ? 'bg-green-900 text-white' : 'text-green-100 hover:bg-green-700'}`}
              >
                Data Buku
              </button>
              <button 
                onClick={handleCreateNew}
                className={`ml-4 px-4 py-2 rounded-md text-sm font-medium bg-yellow-500 hover:bg-yellow-600 text-white shadow-md flex items-center gap-2`}
              >
                <Plus size={16} /> Buat Transaksi
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {view === 'books' && <BooksPage />}
        {view === 'create' && (
          <CreateInvoicePage 
            setActiveView={setView} 
            invoiceToEdit={invoiceToEdit} 
            setInvoiceToEdit={setInvoiceToEdit} 
          />
        )}
        {view === 'history' && (
          <HistoryPage onEditInvoice={handleEditInvoice} />
        )}
      </main>
    </div>
  );
}

export default App;