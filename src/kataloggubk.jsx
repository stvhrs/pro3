import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, update, remove } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';

// --- 1. CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBX63m5Z8op6p0SkNDCplulOwbbNg6kBP8",
  authDomain: "kataloggubuk.firebaseapp.com",
  projectId: "kataloggubuk",
  storageBucket: "kataloggubuk.firebasestorage.app",
  messagingSenderId: "156833615394",
  appId: "1:156833615394:web:b0805838375bfde166047b",
  measurementId: "G-D9FMS1KHP2"
};

let app, db, auth;
try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  auth = getAuth(app);
  // Setting persistence might fail in some environments (like restricted iframes), catch it silently.
  setPersistence(auth, browserLocalPersistence).catch(error => {
    console.warn("Auth Persistence Warning:", error);
  });
} catch (error) {
  console.error("Firebase Init Error:", error);
}

// --- 2. HELPERS ---
const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

const generateIdFromTitle = (title) => {
  if (!title) return `unknown-${Date.now()}`;
  const slug = title.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${slug}-${randomSuffix}`;
};

const formatCategoryLabel = (catKey) => {
  if (!catKey || typeof catKey !== 'string') return "";
  return catKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

const parseSoldCount = (str) => {
  if (!str) return 0;
  const s = String(str).toLowerCase();
  let multiplier = 1;
  if (s.includes('rb') || s.includes('k')) multiplier = 1000;
  if (s.includes('jt') || s.includes('m')) multiplier = 1000000;
  const numStr = s.replace(/[^0-9.,]/g, '').replace(',', '.');
  const num = parseFloat(numStr);
  if (isNaN(num)) return 0;
  return Math.round(num * multiplier);
};

// --- 3. HOOKS & CONTEXT ---
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const ProductContext = createContext({
  products: [],
  categories: [],
  loading: true
});

const useProducts = () => useContext(ProductContext);

function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
        setLoading(false);
        return;
    }
    
    // Safety timeout: if DB takes too long, stop loading
    const safetyTimeout = setTimeout(() => {
        if (loading) setLoading(false);
    }, 10000); // 10 seconds

    const productsRef = ref(db, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      clearTimeout(safetyTimeout); // Clear timeout if successful
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setProducts(list);

        const counts = {};
        list.forEach(p => {
          if (p.categories) Object.keys(p.categories).forEach(cat => counts[cat] = (counts[cat] || 0) + 1);
          else if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
          else counts['uncategorized'] = (counts['uncategorized'] || 0) + 1;
        });
        const cats = Object.keys(counts).map(k => ({ key: k, label: formatCategoryLabel(k), count: counts[k] }));
        // Removed 'Semua Koleksi' (All Collections)
        setCategories(cats);
      } else {
        setProducts([]);
        setCategories([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase Read Error:", error);
      setLoading(false);
    });

    return () => {
        unsubscribe();
        clearTimeout(safetyTimeout);
    };
  }, []);

  return (
    <ProductContext.Provider value={{ products, categories, loading }}>
      {children}
    </ProductContext.Provider>
  );
}

// --- 4. STYLES & ICONS ---
const GlobalStyles = () => (
  <style>{`
    body { background-color: #fafaf9; font-family: 'Inter', sans-serif; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes slideDown { from { transform: translateY(0); } to { transform: translateY(100%); } }
    .animate-slide-down { animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .animate-spin-fast { animation: spin 0.6s linear infinite; }
    @keyframes pop { 0% { transform: scale(0.8); opacity: 0; } 50% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
    .animate-pop { animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    @keyframes badgeBounce { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
    .badge-bounce { animation: badgeBounce 0.3s ease-in-out; }
  `}</style>
);

const Icons = {
  Spreadsheet: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></svg>,
  Grid: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>,
  Search: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Image: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>,
  Upload: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>,
  Database: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s 9-1.34 9-3V5"/></svg>,
  Edit: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Save: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Plus: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  User: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  LogOut: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  Cart: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>,
  CartPlus: (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/><line x1="19" y1="5" x2="19" y2="11" /><line x1="16" y1="8" x2="22" y2="8" />
    </svg>
  ),
  Check: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  WhatsApp: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
  Info: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  ChevronLeft: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  ChevronRight: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  ChevronUp: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>,
  ChevronDown: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  ChevronsLeft: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/></svg>,
  ChevronsRight: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/></svg>,
  Sort: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>,
  CheckCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  ArrowLeft: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
};

// --- 5. PAGE COMPONENTS ---

// Flying Image Component (Precise Landing)
const FlyingImage = ({ src, startRect, endRect, onComplete }) => {
  const [style, setStyle] = useState({
    position: 'fixed',
    top: startRect.top,
    left: startRect.left,
    width: startRect.width,
    height: startRect.height,
    zIndex: 9999,
    transition: 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)', // Smooth Bezier
    opacity: 1,
    borderRadius: '8px',
    pointerEvents: 'none',
    objectFit: 'cover',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
  });

  useEffect(() => {
    const targetWidth = 24;
    const targetHeight = 24;
    const endCenterX = endRect.left + (endRect.width / 2);
    const endCenterY = endRect.top + (endRect.height / 2);
    const endTop = endCenterY - (targetHeight / 2);
    const endLeft = endCenterX - (targetWidth / 2);

    // Initial delay for browser paint
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        setStyle(prev => ({
          ...prev,
          top: endTop,
          left: endLeft,
          width: `${targetWidth}px`,
          height: `${targetHeight}px`,
          opacity: 0.5,
          borderRadius: '50%'
        }));
      });
      return () => cancelAnimationFrame(raf2);
    });

    const timer = setTimeout(onComplete, 800);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf1);
    };
  }, []);

  return createPortal(<img src={src} style={style} alt="" />, document.body);
};

const ProductSkeleton = () => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 animate-pulse break-inside-avoid mb-4">
    <div className="bg-stone-200 h-40 w-full rounded-xl mb-4"></div>
    <div className="h-4 bg-stone-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-stone-200 rounded w-1/2"></div>
  </div>
);

// --- 6. PAGES ---

function ManagePage() {
  const { products, categories: allCategories, loading } = useProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  
  // States for Selection and Sort
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // Filter and Sort Logic
  const filteredAndSortedProducts = useMemo(() => {
    // 1. Filter
    let result = products.filter(p => {
      const term = searchTerm.toLowerCase();
      // Search by title OR category keys
      const titleMatch = p.title?.toLowerCase().includes(term);
      const catMatch = p.categories 
        ? Object.keys(p.categories).some(cat => cat.replace(/_/g, ' ').toLowerCase().includes(term))
        : false;
      return titleMatch || catMatch;
    });

    // 2. Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Ensure proper types for comparison
        if (sortConfig.key === 'title') {
            aValue = (aValue || '').toString().toLowerCase();
            bValue = (bValue || '').toString().toLowerCase();
        } else {
            // Price and Sold should be numbers
            aValue = Number(aValue) || 0;
            bValue = Number(bValue) || 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [products, searchTerm, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1); // Reset to first page on filter/sort change
  }, [searchTerm, sortConfig]);

  // Handlers
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Select all visible (paginated) items or all filtered items?
      // Usually "Select All" selects visible page or all data.
      // Let's select all filtered data to be powerful.
      setSelectedItems(filteredAndSortedProducts.map(p => p.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    if (window.confirm(`Yakin ingin menghapus ${selectedItems.length} produk terpilih?`)) {
      try {
        const updates = {};
        selectedItems.forEach(id => {
          updates[`products/${id}`] = null;
          // Clean up category_products if you were maintaining that structure deeper,
          // but mainly we just delete the product node here for simplicity.
        });
        await update(ref(db), updates);
        setSelectedItems([]);
      } catch (error) {
        alert("Gagal menghapus: " + error.message);
      }
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Yakin ingin menghapus produk "${title}"?`)) {
      try {
        await remove(ref(db, `products/${id}`));
      } catch (error) {
        alert("Gagal menghapus: " + error.message);
      }
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct({ ...product, categories: product.categories || {} });
  };

  const handleAddClick = () => {
    setEditingProduct({
      title: "",
      price: "",
      image: "",
      sold: 0,
      categories: {}
    });
  };

  const toggleCategory = (catKey) => {
    setEditingProduct(prev => {
      const newCats = { ...prev.categories };
      if (newCats[catKey]) delete newCats[catKey];
      else newCats[catKey] = true;
      return { ...prev, categories: newCats };
    });
  };

  const addNewCategory = () => {
    if (!newCategoryName.trim()) return;
    const key = newCategoryName.trim().toLowerCase().replace(/\s+/g, '_');
    setEditingProduct(prev => ({
      ...prev,
      categories: { ...prev.categories, [key]: true }
    }));
    setNewCategoryName("");
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    try {
      const pid = editingProduct.id || generateIdFromTitle(editingProduct.title);
      const updateData = {
        title: editingProduct.title,
        price: parseInt(editingProduct.price),
        image: editingProduct.image,
        sold: parseInt(editingProduct.sold || 0),
        store: editingProduct.store || "",
        categories: editingProduct.categories,
        created_at: editingProduct.created_at || new Date().toISOString()
      };
      await update(ref(db, `products/${pid}`), updateData);
      setEditingProduct(null);
    } catch (error) {
      alert("Gagal menyimpan: " + error.message);
    }
  };

  // UI Helpers
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <Icons.Sort size={14} className="text-stone-300 opacity-50" />;
    return sortConfig.direction === 'asc' 
        ? <Icons.ChevronUp size={14} className="text-emerald-600" />
        : <Icons.ChevronDown size={14} className="text-emerald-600" />;
  };

  const isAllSelected = filteredAndSortedProducts.length > 0 && selectedItems.length === filteredAndSortedProducts.length;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-serif font-bold text-emerald-800">Kelola Produk</h2>
        
        <div className="flex w-full md:w-auto gap-3 items-center">
          {selectedItems.length > 0 && (
             <button onClick={handleBulkDelete} className="flex-shrink-0 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all text-sm animate-pop">
                <Icons.Trash size={16} /> Hapus ({selectedItems.length})
             </button>
          )}
          <button onClick={handleAddClick} className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all text-sm">
            <Icons.Plus size={18} /> Tambah Produk
          </button>
          <div className="relative w-full md:w-64">
             <input 
               type="text" 
               placeholder="Cari produk / kategori..." 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
             />
             <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />
          </div>
        </div>
      </div>

      {loading ? (
         <div className="text-center py-20"><div className="animate-spin-fast inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-stone-50 text-stone-500 text-xs uppercase font-bold sticky top-0 z-10">
                <tr>
                  <th className="p-4 w-10">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-stone-300 accent-emerald-600 cursor-pointer"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-stone-100 transition-colors select-none" onClick={() => handleSort('title')}>
                    <div className="flex items-center gap-1">Produk {getSortIcon('title')}</div>
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-stone-100 transition-colors select-none" onClick={() => handleSort('price')}>
                    <div className="flex items-center gap-1">Harga {getSortIcon('price')}</div>
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-stone-100 transition-colors select-none" onClick={() => handleSort('sold')}>
                    <div className="flex items-center gap-1">Terjual {getSortIcon('sold')}</div>
                  </th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm text-stone-700">
                {paginatedProducts.map(product => (
                  <tr key={product.id} className={`hover:bg-stone-50/50 transition-colors ${selectedItems.includes(product.id) ? 'bg-emerald-50/30' : ''}`}>
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-stone-300 accent-emerald-600 cursor-pointer"
                        checked={selectedItems.includes(product.id)}
                        onChange={() => handleSelectItem(product.id)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-stone-100 flex-shrink-0 overflow-hidden border border-stone-200">
                          <img src={product.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold line-clamp-2 max-w-[200px]" title={product.title}>{product.title}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-emerald-700 font-bold">{formatRupiah(product.price)}</td>
                    <td className="p-4 text-stone-500">{product.sold || 0}</td>
                    <td className="p-4 max-w-[200px]">
                      <div className="flex flex-wrap gap-1">
                         {product.categories ? Object.keys(product.categories).map(c => (
                           <span key={c} className="text-[10px] bg-stone-100 px-2 py-0.5 rounded text-stone-500 border border-stone-200 font-medium">{formatCategoryLabel(c)}</span>
                         )) : '-'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEditClick(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Icons.Edit size={16}/></button>
                        <button onClick={() => handleDelete(product.id, product.title)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Icons.Trash size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedProducts.length === 0 && (
                  <tr><td colSpan="6" className="p-8 text-center text-stone-400">Tidak ada produk ditemukan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
                <div className="text-sm text-stone-500">
                    Menampilkan <b>{((currentPage - 1) * itemsPerPage) + 1}</b> - <b>{Math.min(currentPage * itemsPerPage, filteredAndSortedProducts.length)}</b> dari <b>{filteredAndSortedProducts.length}</b>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg bg-white border border-stone-200 hover:bg-emerald-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                    >
                        <Icons.ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center px-4 bg-white border border-stone-200 rounded-lg text-sm font-bold text-stone-600">
                        {currentPage} / {totalPages}
                    </div>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg bg-white border border-stone-200 hover:bg-emerald-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                    >
                        <Icons.ChevronRight size={18} />
                    </button>
                </div>
            </div>
          )}
        </div>
      )}

      {/* Edit/Add Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-pop">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <h3 className="font-bold text-lg text-emerald-800">{editingProduct.id ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
              <button onClick={() => setEditingProduct(null)} className="text-stone-400 hover:text-stone-600 font-bold text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
               <div>
                 <label className="block text-xs font-bold text-stone-500 mb-1">Judul Buku</label>
                 <input className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={editingProduct.title} onChange={e => setEditingProduct({...editingProduct, title: e.target.value})} placeholder="Masukkan judul buku" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-stone-500 mb-1">Harga (Rp)</label>
                   <input type="number" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} placeholder="0" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-stone-500 mb-1">Terjual</label>
                   <input type="number" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={editingProduct.sold} onChange={e => setEditingProduct({...editingProduct, sold: e.target.value})} placeholder="0" />
                 </div>
               </div>
               <div>
                 <label className="block text-xs font-bold text-stone-500 mb-1">URL Gambar</label>
                 <div className="flex gap-2">
                   <div className="w-12 h-12 bg-stone-100 rounded-lg border flex-shrink-0 overflow-hidden"><img src={editingProduct.image} className="w-full h-full object-cover" onError={e => e.target.style.display='none'} /></div>
                   <input className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={editingProduct.image} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} placeholder="https://..." />
                 </div>
               </div>
               
               <div>
                 <label className="block text-xs font-bold text-stone-500 mb-2">Kategori</label>
                 <div className="flex flex-wrap gap-2 mb-3">
                    {/* Render Existing Categories as Chips */}
                    {allCategories.map(cat => (
                      <button
                        key={cat.key}
                        onClick={() => toggleCategory(cat.key)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          editingProduct.categories && editingProduct.categories[cat.key]
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-stone-600 border-stone-200 hover:border-emerald-400'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                    
                    {/* Show newly added categories that might not be in allCategories yet */}
                    {Object.keys(editingProduct.categories || {}).map(key => {
                        const exists = allCategories.find(c => c.key === key);
                        if (exists) return null;
                        return (
                          <button
                            key={key}
                            onClick={() => toggleCategory(key)}
                            className="text-xs px-3 py-1.5 rounded-full border bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          >
                            {formatCategoryLabel(key)}
                          </button>
                        )
                    })}
                 </div>
                 
                 {/* Add New Category Input */}
                 <div className="flex items-center gap-2">
                    <input 
                      className="flex-grow p-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                      placeholder="Buat kategori baru..." 
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addNewCategory()}
                    />
                    <button 
                      onClick={addNewCategory}
                      disabled={!newCategoryName.trim()}
                      className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 disabled:opacity-50"
                      title="Tambah Kategori"
                    >
                      <Icons.Plus size={18} />
                    </button>
                 </div>
               </div>
            </div>
            <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-end gap-3">
               <button onClick={() => setEditingProduct(null)} className="px-4 py-2 rounded-lg font-bold text-stone-500 hover:bg-stone-200 transition-colors">Batal</button>
               <button onClick={handleSaveEdit} className="px-6 py-2 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-colors">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try { await signInWithEmailAndPassword(auth, email, password); onLoginSuccess(); } 
    catch (err) { setError("Gagal login."); } 
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-stone-200">
        <div className="flex flex-col items-center mb-6 text-emerald-700">
          <div className="p-3 bg-emerald-100 rounded-full mb-3"><Icons.User size={32} /></div>
          <h2 className="text-2xl font-bold font-serif">Admin Login</h2>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div><label className="text-xs font-bold text-stone-600">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500" required/></div>
          <div><label className="text-xs font-bold text-stone-600">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500" required/></div>
          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-700 text-white font-bold rounded-lg">{loading ? "..." : "Masuk"}</button>
        </form>
      </div>
    </div>
  );
}

function CartPage({ cart, updateQty, removeItem, toggleCheck, setCart, merchantPhone }) {
  const checkedItems = cart.filter(item => item.checked);
  const totalPrice = checkedItems.reduce((acc, item) => acc + (item.price * (typeof item.qty === 'number' ? item.qty : 0)), 0);

  const handleCheckout = () => {
    if (checkedItems.length === 0) return alert("Pilih minimal 1 buku untuk dipesan.");
    
    const now = new Date();
    const dateOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    const dateStr = now.toLocaleDateString('id-ID', dateOptions);

    // MODIFIED: Removed emojis from message template
    let message = `*Tanggal:* ${dateStr}\n`;
    message += `*Sekolah:* ____________________\n\n`;
    message += `*DATA PESANAN*\n`;
    message += `─────────────────────\n`;

    checkedItems.forEach((item, index) => {
      const subTotal = item.price * (item.qty || 1);
      message += `*${item.title}*\n`;
      message += `   Qty: ${item.qty}\n`;
      message += `   Harga: ${formatRupiah(item.price)}\n`;
      message += `   Subtotal: ${formatRupiah(subTotal)}\n\n`;
    });

    message += `─────────────────────\n`;
    message += `*TOTAL Pesanan: ${formatRupiah(totalPrice)}*`;

    // Use dynamic merchant phone or fallback
    const targetPhone = merchantPhone || "6285117783572";
    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const confirmDelete = (id, title) => { if (window.confirm(`Hapus "${title}"?`)) removeItem(id); };
  const handleBulkDelete = () => { if (window.confirm(`Hapus ${checkedItems.length} item?`)) setCart(prev => prev.filter(item => !item.checked)); };

  const handleInputChange = (id, val) => {
    if (val === "" || /^[0-9\b]+$/.test(val)) {
      if (val === "") updateQty(id, "");
      else updateQty(id, parseInt(val));
    }
  };

  const handleInputBlur = (id, val) => {
    if (val === "" || val < 1) updateQty(id, 1);
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Cart Page Header with Back Button - Only visible in Cart Page View */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-serif font-bold text-emerald-800 flex items-center gap-2"><Icons.Cart className="text-emerald-600" /> Keranjang Belanja</h2>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-stone-300">
          <p className="text-stone-400 font-medium mb-4">Keranjang kosong.</p>
          <button onClick={() => window.location.hash = '#/'} className="text-emerald-600 font-bold hover:underline">Belanja Sekarang</button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-4 bg-stone-50 border-b border-stone-200 flex justify-between items-center">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-stone-600">
                <input type="checkbox" checked={cart.length > 0 && cart.every(i => i.checked)} onChange={(e) => { const val = e.target.checked; setCart(prev => prev.map(i => ({...i, checked: val}))); }} className="accent-emerald-600 w-4 h-4"/> Pilih Semua
              </label>
              {checkedItems.length > 0 && <button onClick={handleBulkDelete} className="text-red-500 text-xs font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1"><Icons.Trash className="w-3 h-3"/> Hapus</button>}
            </div>
            <div className="divide-y divide-stone-100">
              {cart.map((item) => (
                <div key={item.id} className={`p-4 flex gap-3 items-start transition-colors ${item.checked ? 'bg-white' : 'bg-stone-50/50'}`}>
                  <input type="checkbox" checked={item.checked} onChange={() => toggleCheck(item.id)} className="accent-emerald-600 w-5 h-5 mt-1 flex-shrink-0" />
                  <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0 border border-stone-200">
                    <img src={item.image} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display='none'}/>
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-bold text-stone-800 text-sm line-clamp-2" title={item.title}>{item.title}</h3>
                    <p className="text-emerald-700 font-bold text-sm mt-1">{formatRupiah(item.price)}</p>
                    
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden h-8">
                        <button onClick={() => updateQty(item.id, Math.max(1, (item.qty || 1) - 1))} className="w-8 h-full flex items-center justify-center bg-stone-50 hover:bg-stone-100 text-stone-600 font-bold">-</button>
                        <input 
                          type="text" 
                          value={item.qty} 
                          onChange={(e) => handleInputChange(item.id, e.target.value)} 
                          onBlur={(e) => handleInputBlur(item.id, e.target.value)}
                          className="w-10 h-full text-center text-xs font-bold text-stone-700 outline-none border-x border-stone-200"
                        />
                        <button onClick={() => updateQty(item.id, (item.qty || 1) + 1)} className="w-8 h-full flex items-center justify-center bg-stone-50 hover:bg-stone-100 text-stone-600 font-bold">+</button>
                      </div>
                      <button onClick={() => confirmDelete(item.id, item.title)} className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Icons.Trash className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-6 sticky bottom-4 z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="text-stone-500 text-sm font-medium">Total ({cart.reduce((a, b) => a + (b.qty || 0), 0)} item)</div>
              <div className="text-2xl font-bold text-emerald-800">{formatRupiah(totalPrice)}</div>
            </div>
            <button onClick={handleCheckout} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-lg">
              <Icons.WhatsApp className="w-6 h-6 md:hidden" /> Pesan Sekarang
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StorePage({ onAddToCart, initialCategory, merchantPhone }) {
  const { products: displayProducts, categories: displayCategories, loading: displayLoading } = useProducts();
  
  // Use passed initialCategory if available
  // MODIFIED: Default to 'novel' instead of 'all'
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'kurmer_smp'); 
  const [searchTerm, setSearchTerm] = useState("");
  const [activeProduct, setActiveProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [sortOption, setSortOption] = useState('best_selling'); // Default sort option changed to Alphabet A-Z
  const [isClosingSheet, setIsClosingSheet] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [canCloseWelcome, setCanCloseWelcome] = useState(false);
  const [countdown, setCountdown] = useState(3);
  
  // NEW: Class filter state
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');

  // Update selected category when prop changes
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  // Animation Logic
  const [flyingProps, setFlyingProps] = useState(null);
  const sourceImgRef = useRef(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [isPageLoading, setIsPageLoading] = useState(false); // New state for fake loading
  const itemsPerPage = 12;

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const isSearching = searchTerm !== debouncedSearchTerm;

  const romanClasses = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

  const filteredProducts = useMemo(() => {
    let result = displayProducts.filter(p => {
      const inCategory = !selectedCategory || (selectedCategory === 'all') || 
                   (p.categories && p.categories[selectedCategory]) || 
                   (p.category === selectedCategory);
      const matchSearch = p.title?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      return inCategory && matchSearch;
    });

    // NEW: Class Filter Logic with Regex for Word Boundary
    if (selectedClassFilter !== 'all') {
        // Create regex to match "Kelas [RomanNumeral]" as a whole word to avoid V matching VII
        const classRegex = new RegExp(`Kelas\\s+${selectedClassFilter}\\b`, 'i');
        result = result.filter(p => classRegex.test(p.title));
    }

    if (sortOption === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'alphabet_asc') {
      result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortOption === 'best_selling') {
      result.sort((a, b) => (b.sold || 0) - (a.sold || 0));
    } else {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return result;
  }, [displayProducts, selectedCategory, debouncedSearchTerm, sortOption, selectedClassFilter]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => { 
    setCurrentPage(1); 
    setPageInput("1");
  }, [selectedCategory, debouncedSearchTerm, sortOption, selectedClassFilter]);

  // MODIFIED: Page Change Effect (Loading & Scroll)
  useEffect(() => {
    setPageInput(String(currentPage));
    setIsPageLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Simulate short network delay for "loading" feel
    const timer = setTimeout(() => {
        setIsPageLoading(false);
    }, 400);
    
    return () => clearTimeout(timer);
  }, [currentPage]);

  // --- WELCOME MODAL TIMER ---
  useEffect(() => {
    // Check local storage inside effect to avoid hydration mismatch if SSR (though this is likely CSR)
    const seen = localStorage.getItem('seen_welcome');
    if (seen) {
      setShowWelcome(false);
    } else {
      setCanCloseWelcome(false);
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanCloseWelcome(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, []);

  const handlePageInputChange = (e) => {
    const val = e.target.value;
    if (val === "" || /^[0-9\b]+$/.test(val)) {
      setPageInput(val);
    }
  };

  const handlePageInputSubmit = (e) => {
    if (e.key === 'Enter') {
      let page = parseInt(pageInput);
      if (isNaN(page) || page < 1) page = 1;
      if (page > totalPages) page = totalPages;
      setCurrentPage(page);
      setPageInput(String(page));
      e.target.blur();
    }
  };

  const handlePageInputBlur = () => {
    let page = parseInt(pageInput);
    if (isNaN(page) || page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    setCurrentPage(page);
    setPageInput(String(page));
  };

  const handleAddToCartConfirm = () => {
    if (sourceImgRef.current) {
      const start = sourceImgRef.current.getBoundingClientRect();
      const cartIcon = document.getElementById('cart-icon-dest');
      const end = cartIcon ? cartIcon.getBoundingClientRect() : { top: 0, left: window.innerWidth, width: 0, height: 0 };
      
      setFlyingProps({
        src: activeProduct.image,
        startRect: start,
        endRect: end
      });
    }

    setIsClosingSheet(true); 
    
    setTimeout(() => {
      const finalQty = qty === "" ? 1 : parseInt(qty);
      onAddToCart(activeProduct, finalQty);
      
      setIsClosingSheet(false);
      setActiveProduct(null);
      setFlyingProps(null);
    }, 800);
  };

  const handleSheetQtyChange = (val) => {
    if (val === "" || /^[0-9\b]+$/.test(val)) {
      if (val === "") setQty("");
      else setQty(parseInt(val));
    }
  };

  const handleSheetQtyBlur = () => {
    if (qty === "" || qty < 1) setQty(1);
  };

  const handleCategoryClick = (key) => {
    // MODIFIED: Preserve phone URL parameter when changing categories
    let newHash = `#/store?category=${key}`;
    if (merchantPhone && merchantPhone !== "6285117783572") {
        newHash += `&phone=${merchantPhone}`;
    }
    
    if (key === 'all' || selectedCategory === key) {
        // Even for 'default' or 'all', keep the phone if set
        newHash = '#/store';
        if (merchantPhone && merchantPhone !== "6285117783572") {
            newHash += `?phone=${merchantPhone}`;
        }
        window.location.hash = newHash;
    } else {
        window.location.hash = newHash;
    }
    
    // State update will happen via App's route listener, but we can optimistically update here too
    if (key === 'all') setSelectedCategory(null);
    else setSelectedCategory(key);
  };

  return (
    <>
      {showWelcome && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
              <Icons.Info size={32} />
            </div>
            <h2 className="text-xl font-bold font-serif text-emerald-800 mb-2">Selamat Datang di Katalog Gubuk!</h2>
            <p className="text-stone-500 mb-6 text-sm leading-relaxed">
              Cara memesan buku sangat mudah:<br/><br/>
              1. Pilih buku dan klik icon <b>(+)</b>. <br/>
              2. Buka icon <b>Keranjang</b> di pojok kanan atas. <br/>
              3. Klik <b>Pesan ke WhatsApp</b> untuk mengirim order.
            </p>
            <button 
              onClick={() => { setShowWelcome(false); localStorage.setItem('seen_welcome', 'true'); }} 
              disabled={!canCloseWelcome}
              className={`w-full py-3 font-bold rounded-xl shadow-md transition-all ${canCloseWelcome ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'bg-stone-300 text-stone-500 cursor-not-allowed'}`}
            >
              {canCloseWelcome ? "Mengerti, Mulai Belanja!" : `Mohon baca dulu (${countdown})`}
            </button>
          </div>
        </div>
      )}

      {flyingProps && (
        <FlyingImage 
          src={flyingProps.src} 
          startRect={flyingProps.startRect} 
          endRect={flyingProps.endRect} 
          onComplete={() => {}} 
        />
      )}

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="lg:w-64 flex-shrink-0 hidden lg:block">
          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-stone-200 sticky top-24">
            
            <h3 className="font-serif font-bold text-stone-700 mb-4 px-1 hidden lg:block">Kategori</h3>
            
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
              {displayLoading ? [...Array(5)].map((_, i) => <div key={i} className="h-10 bg-stone-100 rounded-xl w-full animate-pulse flex-shrink-0 w-24 lg:w-full"></div>) : 
               [
                 // MODIFIED: Removed 'Semua Koleksi' manual entry here
                 ...displayCategories
               ].map(c => ( 
                <button 
                  key={c.key} 
                  onClick={() => handleCategoryClick(c.key)}
                  className={`
                    transition-all flex-shrink-0 
                    lg:flex lg:justify-between lg:items-center lg:px-4 lg:py-3 lg:rounded-xl lg:text-sm lg:w-full lg:text-left 
                    ${(selectedCategory === c.key) || (c.key === 'all' && !selectedCategory)
                      ? 'lg:bg-emerald-700 lg:text-white lg:shadow-md bg-emerald-700 text-white border-emerald-700' 
                      : 'lg:bg-stone-50 lg:text-stone-600 lg:hover:bg-emerald-50 bg-white text-stone-600 border-stone-200 hover:border-emerald-500'}
                    
                    inline-flex items-center px-4 py-2 rounded-full border lg:border-0 text-sm font-medium whitespace-nowrap
                  `}
                >
                  <span className="capitalize">{c.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ml-2 ${(selectedCategory === c.key) || (c.key === 'all' && !selectedCategory) ? 'bg-emerald-600 text-emerald-100' : 'bg-stone-200 text-stone-500'}`}>{c.count}</span>
                </button>
               ))
              }
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-[600px]">
          {/* MODIFIED: Search & Sort moved here (main content top) */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200 mb-6 flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <input type="text" placeholder="Cari buku..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50" />
              <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
            </div>
            
            {/* NEW: Class Filter Dropdown */}
            <div className="relative w-full md:w-48 flex-shrink-0">
               <select
                 value={selectedClassFilter}
                 onChange={(e) => setSelectedClassFilter(e.target.value)}
                 className="w-full pl-4 pr-10 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer"
               >
                 <option value="all">Semua Kelas</option>
                 {romanClasses.map(roman => (
                    <option key={roman} value={roman}>Kelas {roman}</option>
                 ))}
               </select>
               <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400 pointer-events-none">
                 <Icons.ChevronDown size={16} />
               </div>
            </div>

            <div className="relative w-full md:w-48 flex-shrink-0">
              <select 
                value={sortOption} 
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer"
              >
                <option value="alphabet_asc">Abjad A-Z</option>
                <option value="best_selling">Terlaris</option>
                <option value="price_asc">Harga Terendah</option>
                <option value="price_desc">Harga Tertinggi</option>
              </select>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400">
                <Icons.Sort size={16} />
              </div>
            </div>
          </div>

          {/* MODIFIED: Mobile Category List (Ensured it's here) */}
          <div className="lg:hidden mb-6">
             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
               {displayLoading ? [...Array(5)].map((_, i) => <div key={i} className="h-10 w-24 bg-stone-100 rounded-full animate-pulse flex-shrink-0"></div>) : 
                 displayCategories.map(c => (
                   <button 
                     key={c.key} 
                     onClick={() => handleCategoryClick(c.key)}
                     className={`
                       flex-shrink-0 inline-flex items-center px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all
                       ${(selectedCategory === c.key) || (c.key === 'all' && !selectedCategory)
                         ? 'bg-emerald-700 text-white border-emerald-700 shadow-md' 
                         : 'bg-white text-stone-600 border-stone-200 hover:border-emerald-500'}
                     `}
                   >
                     <span className="capitalize">{c.label}</span>
                     <span className={`text-xs px-2 py-0.5 rounded-full ml-2 ${(selectedCategory === c.key) || (c.key === 'all' && !selectedCategory) ? 'bg-emerald-600 text-emerald-100' : 'bg-stone-200 text-stone-500'}`}>{c.count}</span>
                   </button>
                 ))
               }
             </div>
          </div>

          {displayLoading || isSearching ? (
            <div className="columns-2 gap-4 space-y-4 md:space-y-0 md:grid md:grid-cols-3 xl:grid-cols-4 md:gap-6">
              {[...Array(8)].map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : currentProducts.length === 0 ? (
            <div className="text-center py-20 text-stone-400 bg-white rounded-2xl border border-dashed border-stone-200">
              Tidak ada buku ditemukan.
            </div>
          ) : (
            <>
              {isPageLoading ? (
                 <div className="columns-2 gap-4 space-y-4 md:space-y-0 md:grid md:grid-cols-3 xl:grid-cols-4 md:gap-6 opacity-60 pointer-events-none animate-pulse">
                     {currentProducts.map((item) => (
                        <div key={item.id} className="h-64 bg-stone-100 rounded-2xl"></div>
                     ))}
                 </div>
              ) : (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 md:gap-6 mb-8 animate-fade-in">
                    {currentProducts.map((item) => (
                      <div key={item.id} className="break-inside-avoid bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-100 flex flex-col group overflow-hidden relative rounded-t-2xl">
                        <div className="relative w-full aspect-square overflow-hidden bg-stone-100">
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                            onError={e => e.target.style.display='none'}
                            loading="lazy" 
                          />
                          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent opacity-80"></div>
                          
                          <button 
                            onClick={() => { setActiveProduct(item); setQty(1); }} 
                            className="absolute bottom-3 right-3 bg-emerald-600 text-white p-2.5 rounded-full shadow-lg active:scale-95 transition-transform duration-100 hover:bg-emerald-700 z-10"
                          >
                            <Icons.Plus size={20} />
                          </button>
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                          <div className="flex flex-wrap gap-1 mb-2">
                            {item.categories ? Object.keys(item.categories).slice(0, 2).map(cat => (
                              <span key={cat} className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase bg-emerald-50 w-fit px-2 py-0.5 rounded-md">{formatCategoryLabel(cat)}</span>
                            )) : null}
                          </div>
                          <h3 className="text-xs md:text-sm font-bold text-stone-800 leading-tight mb-2 font-sans" title={item.title}>{item.title}</h3>
                          <div className="mt-auto border-t border-stone-50 pt-2 flex flex-col">
                            <span className="text-base font-bold text-emerald-700">{formatRupiah(item.price)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
              )}
              
              {/* Pagination UI */}
              {totalPages > 1 && (
                <div className="mt-auto flex justify-center items-center gap-2 py-4">
                  <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 rounded-full bg-white border border-stone-200 text-stone-600 hover:bg-emerald-50 disabled:opacity-50 transition-colors shadow-sm" title="Ke Halaman Pertama"><Icons.ChevronsLeft size={20} /></button>
                  <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-full bg-white border border-stone-200 text-stone-600 hover:bg-emerald-50 disabled:opacity-50 transition-colors shadow-sm" title="Halaman Sebelumnya"><Icons.ChevronLeft size={20} /></button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-stone-600 hidden sm:inline">Halaman</span>
                    <input 
                      type="text"
                      value={pageInput}
                      onChange={handlePageInputChange}
                      onKeyDown={handlePageInputSubmit}
                      onBlur={handlePageInputBlur}
                      className="w-12 text-center border border-stone-200 rounded-lg py-1.5 text-sm font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    />
                    <span className="text-sm font-bold text-stone-600">/ {totalPages}</span>
                  </div>
                  <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-full bg-white border border-stone-200 text-stone-600 hover:bg-emerald-50 disabled:opacity-50 transition-colors shadow-sm" title="Halaman Selanjutnya"><Icons.ChevronRight size={20} /></button>
                  <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-2 rounded-full bg-white border border-stone-200 text-stone-600 hover:bg-emerald-50 disabled:opacity-50 transition-colors shadow-sm" title="Ke Halaman Terakhir"><Icons.ChevronsRight size={20} /></button>
                </div>
              )}
            </>
          )}
        </div>

        {activeProduct && (
          <div className="fixed inset-0 z-[100] flex justify-center items-end bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setActiveProduct(null)}>
            <div 
              className={`bg-white w-full max-w-lg rounded-t-3xl p-6 pb-8 shadow-2xl ${isClosingSheet ? 'animate-slide-down' : 'animate-slide-up'}`} 
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mb-6"></div>
              <div className="flex gap-4 mb-6">
                <div className="w-24 h-24 bg-stone-100 rounded-xl overflow-hidden flex-shrink-0">
                   <img ref={sourceImgRef} src={activeProduct.image} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-stone-800 font-serif leading-tight line-clamp-2">{activeProduct.title}</h3>
                  <div className="flex flex-col mt-2">
                    <p className="text-emerald-700 font-bold text-xl">{formatRupiah(activeProduct.price)}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between bg-stone-50 p-4 rounded-xl mb-6">
                <span className="font-bold text-stone-600">Jumlah</span>
                <div className="flex items-center bg-white rounded-lg shadow-sm border border-stone-200 h-10">
                  <button onClick={() => setQty(Math.max(1, (parseInt(qty) || 1) - 1))} className="w-12 h-full flex items-center justify-center text-stone-600 hover:bg-stone-100 font-bold text-lg">-</button>
                  <input 
                    type="text"
                    value={qty}
                    onChange={(e) => handleSheetQtyChange(e.target.value)}
                    onBlur={handleSheetQtyBlur}
                    className="w-14 h-full text-center font-bold text-emerald-800 outline-none border-x border-stone-200"
                  />
                  <button onClick={() => setQty((parseInt(qty) || 0) + 1)} className="w-12 h-full flex items-center justify-center text-stone-600 hover:bg-stone-100 font-bold text-lg">+</button>
                </div>
              </div>
              <button onClick={handleAddToCartConfirm} className="w-full py-4 bg-emerald-700 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-800 transition-all flex items-center justify-center gap-2">
                <Icons.Cart size={20} /> Tambah - {formatRupiah(activeProduct.price * (parseInt(qty) || 1))}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function AdminPage() {
  const [excelData, setExcelData] = useState([]);
  const [storeName, setStoreName] = useState("");
  const [categoryInput, setCategoryInput] = useState(""); 
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Dynamically load SheetJS for Excel processing
    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src = "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (!window.XLSX) return alert("Library Excel sedang dimuat, coba sesaat lagi.");

    const readExcelFile = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const wb = window.XLSX.read(evt.target.result, { type: 'binary' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data = window.XLSX.utils.sheet_to_json(ws);
          resolve(data);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsBinaryString(file);
      });
    };

    try {
      const promises = Array.from(files).map(file => readExcelFile(file));
      const allData = await Promise.all(promises);
      const combinedRawData = allData.flat();
      processExcel(combinedRawData);
    } catch (error) {
      console.error("Error processing files:", error);
      alert("Gagal membaca file Excel.");
    }
  };

  const detectColumns = (data) => {
    if (!data || data.length === 0) return { titleKey: 'data2', priceKey: 'data9', discountKey: null, soldKey: null };
    const headers = Object.keys(data[0]);
    
    let bestTitle = '';
    let bestPrice = '';
    let bestImage = '';
    let bestDiscount = '';
    let bestSold = '';

    for (const key of headers) {
      const k = key.toLowerCase();
      if (k === 'judul') bestTitle = key;
      else if (k === 'harga') bestPrice = key;
      else if (k === 'gambar') bestImage = key;
      else if (k === 'diskon') bestDiscount = key;
      else if (k === 'terjual' || k === 'sold') bestSold = key;
    }

    if (!bestTitle) bestTitle = 'data2'; 
    if (!bestPrice) bestPrice = 'data9'; 
    if (!bestImage) bestImage = 'image3';
    if (!bestDiscount) bestDiscount = 'data3';
    
    if (!bestSold) {
      const sample = data.slice(0, 5);
      for (const key of headers) {
        if (key.includes('image')) continue;
        const hasSoldKeyword = sample.some(row => String(row[key]).toLowerCase().includes('terjual'));
        if (hasSoldKeyword) { bestSold = key; break; }
      }
    }

    return { titleKey: bestTitle, priceKey: bestPrice, imageKey: bestImage, discountKey: bestDiscount, soldKey: bestSold };
  };

  const processExcel = (rawData) => {
    const { titleKey, priceKey, imageKey, discountKey, soldKey } = detectColumns(rawData);
    const processed = rawData.map((item, index) => {
      const title = item[titleKey] || "Tanpa Judul";
      const image = item[imageKey] || ""; 
      
      const priceRaw = item[priceKey] || "0";
      const priceAfterDiscount = parseFloat(String(priceRaw).replace(/[^0-9]/g, ''));
      
      let sellingPrice = priceAfterDiscount;

      if (discountKey && item[discountKey]) {
         const discountRaw = String(item[discountKey]);
         const cleanDiscount = discountRaw.replace(/[^0-9.,]/g, '').replace(',', '.');
         const discountVal = parseFloat(cleanDiscount);

         if (discountRaw.includes('%') && !isNaN(discountVal) && discountVal > 0 && discountVal < 100) {
             sellingPrice = Math.round(priceAfterDiscount / (1 - (discountVal / 100)));
         }
      }

      let soldCount = 0;
      if (soldKey && item[soldKey]) {
        soldCount = parseSoldCount(item[soldKey]);
      }
      
      return { id: index, title, image, price: sellingPrice, sold: soldCount };
    });
    setExcelData(processed);
  };

  const handlePushToFirebase = async () => {
    if (excelData.length === 0 || !storeName || !categoryInput) return alert("Lengkapi data!");
    setIsUploading(true);
    const categoryKeys = categoryInput.split(',').map(c => c.trim().toLowerCase().replace(/\s+/g, '_')).filter(Boolean);
    const updates = {};
    categoryKeys.forEach(key => { updates[`categories/${key}`] = true; });
    excelData.forEach(item => {
      const pid = generateIdFromTitle(item.title);
      const prodCats = {};
      categoryKeys.forEach(k => prodCats[k] = true);
      updates[`products/${pid}`] = { 
        title: item.title, image: item.image, price: item.price, 
        store: storeName, categories: prodCats, 
        sold: item.sold, 
        created_at: new Date().toISOString() 
      };
      categoryKeys.forEach(key => { updates[`category_products/${key}/${pid}`] = true; });
    });
    try { await update(ref(db), updates); setExcelData([]); setCategoryInput(""); alert("Sukses!"); } 
    catch (e) { alert("Gagal: " + e.message); }
    setIsUploading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
       {/* Panduan Format Excel */}
       <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-blue-800 shadow-sm">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Icons.Info size={20} /> Panduan Format Kolom Excel
          </h3>
          <p className="text-sm mb-4 text-blue-700">
            Agar sistem dapat membaca data dengan benar, pastikan baris pertama Excel Anda menggunakan nama kolom berikut (huruf besar/kecil tidak berpengaruh):
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
             <div className="bg-white p-3 rounded-lg border border-blue-200">
                <span className="block font-bold text-blue-900 mb-1">Judul</span>
                <span className="text-xs text-stone-500">Wajib ada. Nama buku/produk.</span>
             </div>
             <div className="bg-white p-3 rounded-lg border border-blue-200">
                <span className="block font-bold text-blue-900 mb-1">Harga</span>
                <span className="text-xs text-stone-500">Wajib ada. Contoh: 50000</span>
             </div>
             <div className="bg-white p-3 rounded-lg border border-blue-200">
                <span className="block font-bold text-blue-900 mb-1">Gambar</span>
                <span className="text-xs text-stone-500">Link URL gambar (https://...)</span>
             </div>
             <div className="bg-white p-3 rounded-lg border border-blue-200">
                <span className="block font-bold text-blue-900 mb-1">Terjual</span>
                <span className="text-xs text-stone-500">Angka terjual (opsional)</span>
             </div>
             <div className="bg-white p-3 rounded-lg border border-blue-200">
                <span className="block font-bold text-blue-900 mb-1">Diskon</span>
                <span className="text-xs text-stone-500">Contoh: 10% (opsional)</span>
             </div>
          </div>
       </div>

       <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
        <h2 className="text-xl font-serif font-bold mb-6 text-emerald-800">Upload Excel</h2>
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          multiple 
          onChange={handleFileUpload} 
          className="block w-full text-sm text-stone-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:bg-emerald-600 file:text-white cursor-pointer"
        />
        <p className="text-xs text-stone-400 mt-2 ml-2">* Bisa pilih banyak file sekaligus (Ctrl + Click)</p>
       </div>
       {excelData.length > 0 && (
         <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
             <input placeholder="Nama Toko" value={storeName} onChange={e=>setStoreName(e.target.value)} className="w-full px-4 py-3 border border-stone-200 rounded-xl bg-stone-50"/>
             <div className="relative">
              <input placeholder="Kategori (pisahkan koma)" value={categoryInput} onChange={e=>setCategoryInput(e.target.value)} className="w-full px-4 py-3 border border-stone-200 rounded-xl bg-stone-50 lowercase"/>
             </div>
           </div>
           <div className="mb-4">
            <p className="text-xs text-stone-500 mb-2 font-bold">Total Data: {excelData.length} baris (Preview 5 baris pertama):</p>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50"><tr><th className="p-2">Judul</th><th className="p-2">Harga Jual (Normal)</th><th className="p-2">Terjual</th></tr></thead>
                <tbody>
                  {excelData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 truncate max-w-[200px]">{row.title}</td>
                      <td className="p-2 text-emerald-600 font-bold">{formatRupiah(row.price)}</td>
                      <td className="p-2 text-stone-500">{row.sold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
           </div>
           <button onClick={handlePushToFirebase} disabled={isUploading} className="w-full py-4 bg-emerald-700 text-white font-bold rounded-xl">{isUploading ? "..." : "Simpan"}</button>
         </div>
       )}
    </div>
  );
}

// --- 7. MAIN APP COMPONENT ---
export default function App() {
  const [currentRoute, setCurrentRoute] = useState('store'); 
  const [currentCategory, setCurrentCategory] = useState(null); // Fix for category routing
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [showWelcome, setShowWelcome] = useState(false);
  const [merchantPhone, setMerchantPhone] = useState("6285117783572"); // Default Number

  // Route handling
  useEffect(() => {
    const handleHashChange = () => {
        let processingHash = window.location.hash.replace('#/', '').replace('#', '') || 'store';
        
        // Extract phone if present in "weird" format or standard query
        let foundPhone = null;
        
        // Regex to catch phone?=number pattern from the weird URL format
        const phoneRegex = /phone\?=([0-9]+)/;
        const match = processingHash.match(phoneRegex);
        
        if (match) {
            foundPhone = match[1];
            // Remove the phone part to normalize the route path
            // e.g. "phone?=08123/store?cat=novel" -> "/store?cat=novel"
            processingHash = processingHash.replace(match[0], '').replace(/^\/+/, ''); 
        }
        
        const [routePart, queryPart] = processingHash.split('?');
        setCurrentRoute(routePart || 'store'); // Default to store if empty after removal

        // Fix: Extract category from query param
        if (queryPart) {
            const params = new URLSearchParams(queryPart);
            const cat = params.get('category');
            const queryPhone = params.get('phone'); // Also check standard query param
            
            setCurrentCategory(cat);
            if (queryPhone) foundPhone = queryPhone;
        } else {
            setCurrentCategory(null);
        }

        if (foundPhone) {
             // Normalize 08xxx to 628xxx for WhatsApp API
             let p = foundPhone.replace(/\D/g, ''); // Remove non-digits
             if (p.startsWith('0')) {
                 p = '62' + p.slice(1);
             }
             setMerchantPhone(p);
        }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route) => { 
      // MODIFIED: Preserve phone URL parameter when navigating
      let url = `#/${route}`;
      if (merchantPhone && merchantPhone !== "6285117783572") {
          url += `?phone=${merchantPhone}`;
      }
      window.location.hash = url; 
  };

  // Data Fetching
  useEffect(() => {
    try {
        const savedCart = localStorage.getItem('gubuk_cart');
        if (savedCart) setCart(JSON.parse(savedCart));
        const seenWelcome = localStorage.getItem('seen_welcome');
        if (!seenWelcome) setShowWelcome(true);
    } catch (e) { console.error("Storage Error", e); }
  }, []);

  useEffect(() => { localStorage.setItem('gubuk_cart', JSON.stringify(cart)); }, [cart]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser); else setUser(null);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => { await signOut(auth); navigateTo('store'); };

  const addToCart = (product, qty) => {
    setCart(prev => {
        const existing = prev.find(item => item.id === product.id);
        if (existing) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + qty, checked: true } : item);
        return [...prev, { ...product, qty, checked: true }];
    });
  };

  const updateCartQty = (id, newQty) => setCart(prev => prev.map(item => item.id === id ? { ...item, qty: newQty } : item));
  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));
  const toggleCheck = (id) => setCart(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  
  // --- UPDATED CART BADGE LOGIC ---
  const totalCartQty = cart.length;

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <GlobalStyles />
        <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-emerald-200 rounded-full mb-4"></div>
            <div className="h-4 w-32 bg-stone-200 rounded"></div>
        </div>
    </div>
  );

  return (
    <ProductProvider>
        <div className="min-h-screen bg-stone-50 font-sans text-stone-800 selection:bg-emerald-200">
        <GlobalStyles />
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-stone-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center gap-4">
                {currentRoute === 'cart' ? (
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigateTo('store')} 
                            className="p-2 rounded-full hover:bg-stone-100 text-stone-600 transition-colors"
                            aria-label="Kembali ke Katalog"
                        >
                            <Icons.ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-lg md:text-xl font-bold text-emerald-800 font-sans">Keranjang Belanja</h1>
                    </div>
                ) : (
                    <h1 className="text-xl md:text-2xl font-bold text-emerald-800 flex items-center gap-2 font-serif cursor-pointer" onClick={() => navigateTo('store')}>
                        <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-700">
                            <Icons.Database className="w-6 h-6" />
                        </div>
                        Katalog Gubuk
                    </h1>
                )}
                
                <nav className="flex items-center gap-2">
                    {!user && (
                        <button 
                            id="cart-icon-dest" 
                            onClick={() => navigateTo('cart')} 
                            className={`
                                relative flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all shadow-sm
                                ${currentRoute === 'cart' 
                                    ? 'bg-emerald-700 text-white ring-2 ring-emerald-700 ring-offset-2' 
                                    : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300'}
                            `}
                        >
                            <Icons.Cart className="w-5 h-5" />
                            <span className="hidden sm:inline text-sm">Keranjang</span>
                            
                            {totalCartQty > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md badge-bounce border-2 border-white">
                                    {totalCartQty}
                                </span>
                            )}
                        </button>
                    )}

                    {user && (
                        <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-full ml-2 border border-stone-200">
                            <button onClick={() => navigateTo('store')} className={`p-2 rounded-full transition-all ${currentRoute === 'store' ? 'bg-white shadow text-emerald-700' : 'text-stone-500 hover:text-emerald-600 hover:bg-stone-200'}`} title="Lihat Katalog"><Icons.Grid className="w-4 h-4" /></button>
                            <button onClick={() => navigateTo('admin')} className={`p-2 rounded-full transition-all ${currentRoute === 'admin' ? 'bg-white shadow text-emerald-700' : 'text-stone-500 hover:text-emerald-600 hover:bg-stone-200'}`} title="Upload Excel"><Icons.Upload className="w-4 h-4" /></button>
                            <button onClick={() => navigateTo('manage')} className={`p-2 rounded-full transition-all ${currentRoute === 'manage' ? 'bg-white shadow text-emerald-700' : 'text-stone-500 hover:text-emerald-600 hover:bg-stone-200'}`} title="Kelola Data"><Icons.Edit className="w-4 h-4" /></button>
                            <div className="w-px h-4 bg-stone-300 mx-1"></div>
                            <button onClick={handleLogout} className="p-2 rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition-all" title="Logout"><Icons.LogOut className="w-4 h-4" /></button>
                        </div>
                    )}
                </nav>
            </div>
            </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 pb-24">
            {(currentRoute === 'admin' || currentRoute === 'manage') && !user ? (
                <LoginPage onLoginSuccess={() => navigateTo('manage')} />
            ) : (
                <>
                    {currentRoute === 'login' && <LoginPage onLoginSuccess={() => navigateTo('manage')} />}
                    {currentRoute === 'admin' && user && <AdminPage />}
                    {currentRoute === 'manage' && user && <ManagePage />}
                    {currentRoute === 'store' && <StorePage onAddToCart={addToCart} initialCategory={currentCategory} merchantPhone={merchantPhone} />}
                    {currentRoute === 'cart' && <CartPage cart={cart} updateQty={updateCartQty} removeItem={removeFromCart} toggleCheck={toggleCheck} setCart={setCart} merchantPhone={merchantPhone} />}
                </>
            )}
        </main>
        </div>
    </ProductProvider>
  );
}