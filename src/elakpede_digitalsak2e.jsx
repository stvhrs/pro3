import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getDatabase, ref, onValue, push, remove, update } from 'firebase/database';
import { 
  BookOpen, Video, FileText, ChevronLeft, ChevronRight, LogIn, 
  LogOut, Plus, Trash2, Edit, LayoutDashboard, Image as ImageIcon, 
  Layers, PlayCircle, ExternalLink, X, Loader2, Maximize, Minimize
} from 'lucide-react';

// ============================================================================
// 1. KONFIGURASI FIREBASE & R2 CLOUDFLARE
// ============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyCvctm-NCBiIfcT0ZkoVoT_QDVwJYAZUwI",
  authDomain: "pt-tulus-karya.firebaseapp.com",
  databaseURL: "https://pt-tulus-karya-default-rtdb.firebaseio.com",
  projectId: "pt-tulus-karya",
  storageBucket: "pt-tulus-karya.firebasestorage.app",
  messagingSenderId: "690211397833",
  appId: "1:690211397833:web:4e9a562e85592bce7fed18",
  measurementId: "G-0PXZ4H00ZX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const R2_PUBLIC_DOMAIN = "https://pub-268e4ac098564a4fae1119e480f5a908.r2.dev";
const IMAGE_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

const getValidImageUrl = (member) => {
  let url = member.imageUrl ? member.imageUrl : (member.url ? member.url : null);
  if (url && url.startsWith('data:')) return url;
  if (url && url.includes('pub-b7b4f93ec4d845a584a3d90b6a76e10f.r2.dev')) {
    url = url.replace('pub-b7b4f93ec4d845a584a3d90b6a76e10f.r2.dev', 'pub-268e4ac098564a4fae1119e480f5a908.r2.dev');
  } else if (!url && member.imageKey) {
    url = `${R2_PUBLIC_DOMAIN}/${member.imageKey}`;
  }
  return url || IMAGE_PLACEHOLDER;
};

const getYouTubeID = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const uploadFileToR2 = async (file) => {
  if (!file) return null;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// ============================================================================
// 2. KOMPONEN UTAMA & STATE MANAGEMENT (DENGAN HASH ROUTING)
// ============================================================================

export default function App() {
  const [user, setUser] = useState(null);
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');
  
  const [banners, setBanners] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [contents, setContents] = useState([]);

  // Inject Tailwind CSS
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  // Hash Routing Listener (Memungkinkan tombol Back Browser berfungsi)
  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash || '#/');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && window.location.hash === '#/login') {
        window.location.hash = '#/admin';
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Data Firebase
  useEffect(() => {
    onValue(ref(db, 'banners'), s => setBanners(s.val() ? Object.keys(s.val()).map(k => ({ id: k, ...s.val()[k] })) : []));
    onValue(ref(db, 'classes'), s => setClasses(s.val() ? Object.keys(s.val()).map(k => ({ id: k, ...s.val()[k] })) : []));
    onValue(ref(db, 'subjects'), s => setSubjects(s.val() ? Object.keys(s.val()).map(k => ({ id: k, ...s.val()[k] })) : []));
    onValue(ref(db, 'contents'), s => setContents(s.val() ? Object.keys(s.val()).map(k => ({ id: k, ...s.val()[k] })) : []));
  }, []);

  // Routing Logic State Derivation
  let currentView = 'public';
  let selectedClass = null;
  let selectedSubject = null;
  let viewingContent = null;

  if (currentHash === '#/login') {
    currentView = 'admin_login';
  } else if (currentHash === '#/admin') {
    currentView = 'admin_dashboard';
  } else if (currentHash.startsWith('#/class/')) {
    selectedClass = classes.find(c => c.id === currentHash.replace('#/class/', ''));
  } else if (currentHash.startsWith('#/subject/')) {
    selectedSubject = subjects.find(s => s.id === currentHash.replace('#/subject/', ''));
    if (selectedSubject) selectedClass = classes.find(c => c.id === selectedSubject.classId);
  } else if (currentHash.startsWith('#/content/')) {
    viewingContent = contents.find(c => c.id === currentHash.replace('#/content/', ''));
    if (viewingContent) {
      selectedSubject = subjects.find(s => s.id === viewingContent.subjectId);
      if (selectedSubject) selectedClass = classes.find(c => c.id === selectedSubject.classId);
    }
  }

  const handleLogout = () => {
    signOut(auth);
    window.location.hash = '#/';
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.hash = '#/'}>
            <BookOpen className="text-emerald-600" size={28} />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
              Elkapede Digital
            </h1>
          </div>
          <div>
            {user ? (
              <div className="flex items-center gap-4">
                <button onClick={() => window.location.hash = '#/admin'} className={`text-sm font-medium ${currentView === 'admin_dashboard' ? 'text-emerald-600' : 'text-slate-600 hover:text-emerald-600'}`}>Dashboard</button>
                <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors"><LogOut size={16} /> Keluar</button>
              </div>
            ) : (
              <button onClick={() => window.location.hash = '#/login'} className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"><LogIn size={18} /> Admin Login</button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        {currentView === 'public' && (
          <PublicView 
            banners={banners} classes={classes} subjects={subjects} contents={contents}
            selectedClass={selectedClass} selectedSubject={selectedSubject} viewingContent={viewingContent}
          />
        )}
        {currentView === 'admin_login' && <AdminLogin />}
        {currentView === 'admin_dashboard' && <AdminDashboard banners={banners} classes={classes} subjects={subjects} contents={contents} />}
      </main>
    </div>
  );
}

// ============================================================================
// 3. KOMPONEN PUBLIC VIEW (USER ANONIM)
// ============================================================================

function PublicView({ banners, classes, subjects, contents, selectedClass, selectedSubject, viewingContent }) {
  const viewerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (viewingContent) {
    const activeList = contents.filter(c => c.subjectId === viewingContent.subjectId && c.type === viewingContent.type);
    const currentIndex = activeList.findIndex(c => c.id === viewingContent.id);
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < activeList.length - 1;

    // Navigasi diganti dengan update Hash untuk support Back browser
    const handlePrev = () => window.location.hash = '#/content/' + activeList[currentIndex - 1].id;
    const handleNext = () => window.location.hash = '#/content/' + activeList[currentIndex + 1].id;
    const handleClose = () => window.location.hash = '#/subject/' + (selectedSubject ? selectedSubject.id : viewingContent.subjectId);

    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        if (viewerRef.current) viewerRef.current.requestFullscreen().catch(err => console.log(err));
      } else {
        document.exitFullscreen();
      }
    };

    return (
      <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-300">
        <div ref={viewerRef} className={`bg-slate-900 w-full h-full ${isFullscreen ? '' : 'md:h-[95vh] md:w-[95vw] md:rounded-2xl'} shadow-2xl flex flex-col overflow-hidden relative border border-slate-800`}>
          
          <div className="p-3 md:p-4 bg-slate-950 text-white flex flex-col md:flex-row md:justify-between md:items-center gap-3 shadow-md z-10">
            <div className="flex items-center gap-3 flex-1 overflow-hidden">
              <button onClick={handleClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-colors flex-shrink-0" title="Kembali">
                <ChevronLeft size={28} />
              </button>
              <div className="flex items-center gap-2 truncate">
                {viewingContent.type === 'video' ? <Video className="text-red-500 flex-shrink-0" size={24} /> : <FileText className="text-emerald-500 flex-shrink-0" size={24} />}
                <h2 className="text-lg md:text-2xl font-bold truncate">{viewingContent.title}</h2>
              </div>
            </div>
            
            <div className="flex items-center justify-between md:justify-end gap-2 flex-shrink-0">
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                <button onClick={handlePrev} disabled={!hasPrev} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-bold transition-colors ${hasPrev ? 'text-white hover:bg-slate-700' : 'text-slate-600 cursor-not-allowed'}`}>
                  <ChevronLeft size={20} /> <span className="hidden sm:inline">Bab Sebelumnya</span>
                </button>
                <div className="w-px h-6 bg-slate-600 mx-1"></div>
                <button onClick={handleNext} disabled={!hasNext} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-bold transition-colors ${hasNext ? 'text-white hover:bg-slate-700' : 'text-slate-600 cursor-not-allowed'}`}>
                  <span className="hidden sm:inline">Bab Selanjutnya</span> <ChevronRight size={20} />
                </button>
              </div>

              <div className="flex items-center gap-1 ml-2">
                <button onClick={toggleFullscreen} className="p-3 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors" title="Layar Penuh (Fullscreen)">
                  {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                </button>
                <button onClick={handleClose} className="p-3 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors ml-1" title="Tutup Viewer">
                  <X size={28} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full relative bg-slate-800">
            {viewingContent.type === 'video' ? (
              <iframe 
                className="w-full h-full absolute inset-0"
                src={`https://www.youtube.com/embed/${getYouTubeID(viewingContent.url)}?autoplay=1`} 
                title={viewingContent.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
                allowFullScreen
              ></iframe>
            ) : (
              // Revert PDF Viewer ke Iframe Bawaan Browser
              <iframe 
                src={viewingContent.url} 
                className="w-full h-full absolute inset-0 bg-white" 
                title={viewingContent.title}
                allowFullScreen
              ></iframe>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (selectedSubject) {
    const subjectContents = contents.filter(c => c.subjectId === selectedSubject.id);
    const pdfs = subjectContents.filter(c => c.type === 'pdf');
    const videos = subjectContents.filter(c => c.type === 'video');

    return (
      <div className="animate-in slide-in-from-right duration-300">
        <button onClick={() => window.location.hash = '#/class/' + (selectedClass ? selectedClass.id : '')} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-medium transition-colors">
          <ChevronLeft size={20} /> Kembali ke Daftar Mapel
        </button>

        <div className="flex items-center gap-4 mb-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <img src={getValidImageUrl(selectedSubject)} alt={selectedSubject.name} className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-2xl shadow-sm border border-slate-100 bg-white" />
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">{selectedSubject.name}</h2>
            <p className="text-slate-500 mt-1 mb-2 text-sm md:text-base">Daftar materi per bab / modul pembelajaran</p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-medium bg-red-50 text-red-600 px-3 py-1 rounded-full border border-red-100">
                <Video size={14} /> {videos.length} Video List
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">
                <FileText size={14} /> {pdfs.length} Modul PDF
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <PlayCircle className="text-red-500" size={24} />
              <h3 className="text-xl font-bold text-slate-800">Daftar Video</h3>
            </div>
            {videos.length > 0 ? (
              <div className="space-y-3">
                {videos.map((video, index) => (
                  <div key={video.id} onClick={() => window.location.hash = '#/content/' + video.id} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-red-50 border border-slate-100 hover:border-red-200 cursor-pointer transition-all">
                    <div className="bg-slate-100 text-slate-500 w-10 h-10 flex items-center justify-center rounded-lg group-hover:bg-red-500 group-hover:text-white transition-colors font-bold flex-shrink-0">{index + 1}</div>
                    <div className="flex-1 truncate">
                      <span className="font-bold text-slate-700 group-hover:text-red-700 block truncate">{video.title}</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Video size={12}/> Putar Video Bab {index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic text-sm">Belum ada video pembelajaran ditambahkan.</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <BookOpen className="text-emerald-500" size={24} />
              <h3 className="text-xl font-bold text-slate-800">Daftar Modul PDF</h3>
            </div>
            {pdfs.length > 0 ? (
              <div className="space-y-3">
                {pdfs.map((pdf, index) => (
                  <div key={pdf.id} onClick={() => window.location.hash = '#/content/' + pdf.id} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 cursor-pointer transition-all">
                    <div className="bg-slate-100 text-slate-500 w-10 h-10 flex items-center justify-center rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors font-bold flex-shrink-0">{index + 1}</div>
                    <div className="flex-1 truncate">
                      <span className="font-bold text-slate-700 group-hover:text-emerald-700 block truncate">{pdf.title}</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><FileText size={12}/> Baca Modul Bab {index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic text-sm">Belum ada modul PDF ditambahkan.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (selectedClass) {
    const classSubjects = subjects.filter(s => s.classId === selectedClass.id);
    return (
      <div className="animate-in slide-in-from-right duration-300">
        <button onClick={() => window.location.hash = '#/'} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-medium transition-colors">
          <ChevronLeft size={20} /> Kembali ke Beranda
        </button>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800">Kelas: {selectedClass.name}</h2>
          <p className="text-slate-500 mt-2">Daftar Mata Pelajaran yang tersedia.</p>
        </div>

        {classSubjects.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {classSubjects.map(subject => {
              const subjectContents = contents.filter(c => c.subjectId === subject.id);
              const pdfCount = subjectContents.filter(c => c.type === 'pdf').length;
              const videoCount = subjectContents.filter(c => c.type === 'video').length;

              return (
                <div key={subject.id} onClick={() => window.location.hash = '#/subject/' + subject.id} className="bg-white group rounded-2xl p-4 md:p-6 text-center cursor-pointer shadow-sm hover:shadow-xl border border-slate-100 hover:border-emerald-200 transition-all transform hover:-translate-y-1 flex flex-col items-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 mb-4 rounded-full overflow-hidden border-4 border-slate-50 group-hover:border-emerald-100 transition-colors relative">
                    <img src={getValidImageUrl(subject)} alt={subject.name} className="w-full h-full object-cover bg-white" />
                  </div>
                  <h3 className="font-bold text-slate-700 group-hover:text-emerald-600 transition-colors mb-3">{subject.name}</h3>
                  <div className="w-full flex justify-center gap-2 mt-auto">
                    <span title="Total Video" className="flex items-center gap-1 text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded-md">
                      <Video size={12} /> {videoCount}
                    </span>
                    <span title="Total PDF" className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-md">
                      <FileText size={12} /> {pdfCount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <Layers className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500">Belum ada mata pelajaran untuk kelas ini.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      {banners.length > 0 && (
        <div className="relative w-full h-48 md:h-80 rounded-2xl overflow-hidden shadow-lg mb-10 group bg-slate-900">
          {banners.map((banner, index) => (
            <div key={banner.id} className={`absolute inset-0 transition-opacity duration-1000 cursor-pointer ${index === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`} onClick={() => banner.linkUrl && window.open(banner.linkUrl, '_blank')}>
              <img src={getValidImageUrl(banner)} alt="Banner" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
              {banner.linkUrl && (
                <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                  <span>Klik untuk buka</span> <ExternalLink size={16} />
                </div>
              )}
            </div>
          ))}
          {banners.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setCurrentBannerIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1)); }} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/30 hover:bg-white/70 backdrop-blur-sm p-2 rounded-full text-white hover:text-black transition-all"><ChevronLeft size={24} /></button>
              <button onClick={(e) => { e.stopPropagation(); setCurrentBannerIndex((prev) => (prev + 1) % banners.length); }} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/30 hover:bg-white/70 backdrop-blur-sm p-2 rounded-full text-white hover:text-black transition-all"><ChevronRight size={24} /></button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {banners.map((_, idx) => (
                  <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentBannerIndex ? 'bg-white w-6' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="mb-6 flex items-center gap-3">
        <Layers className="text-emerald-600" size={28} />
        <h2 className="text-2xl font-bold text-slate-800">Pilih Kelas</h2>
      </div>

      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {classes.map(cls => (
            <div key={cls.id} onClick={() => window.location.hash = '#/class/' + cls.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300 cursor-pointer transition-all transform hover:-translate-y-1 flex flex-col justify-between h-40 group">
              <div>
                <h3 className="text-xl font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{cls.name}</h3>
                <p className="text-slate-500 text-sm mt-2 line-clamp-2">{cls.description || 'Kelas pembelajaran interaktif.'}</p>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-slate-400 font-medium">{subjects.filter(s => s.classId === cls.id).length} Mapel</span>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors text-slate-400">
                  <ChevronRight size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-500">Belum ada kelas yang ditambahkan admin.</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 4. KOMPONEN ADMIN LOGIN
// ============================================================================

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('Gagal login: Periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 md:mt-20 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"><LogIn size={32} /></div>
        <h2 className="text-2xl font-bold text-slate-800">Login Administrator</h2>
        <p className="text-slate-500 text-sm mt-2">Masuk untuk mengelola kelas dan materi Elkapede.</p>
      </div>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">{error}</div>}
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email Firebase</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="admin@example.com" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="••••••••" required />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2">
          {loading ? <><Loader2 className="animate-spin" size={18} /> Memproses...</> : 'Masuk Dashboard'}
        </button>
      </form>
    </div>
  );
}

// ============================================================================
// 5. KOMPONEN ADMIN DASHBOARD (CMS)
// ============================================================================

function AdminDashboard({ banners, classes, subjects, contents }) {
  const [activeTab, setActiveTab] = useState('classes'); 
  const [isUploading, setIsUploading] = useState(false);
  const [managingClassId, setManagingClassId] = useState(null);
  const [managingSubjectId, setManagingSubjectId] = useState(null);

  const [formBanner, setFormBanner] = useState({ id: null, url: '', linkUrl: '', file: null });
  const [formClass, setFormClass] = useState({ id: null, name: '', description: '' });
  const [formSubject, setFormSubject] = useState({ id: null, name: '', url: '', file: null });
  const [formContent, setFormContent] = useState({ id: null, title: '', url: '', type: 'pdf', file: null });

  const handleSave = async (path, formState, resetFn) => {
    try {
      if (formState.id) {
        const { id, file, ...updateData } = formState; 
        await update(ref(db, `${path}/${id}`), updateData);
      } else {
        const { id, file, ...newData } = formState; 
        await push(ref(db, path), newData);
      }
      resetFn();
    } catch (err) {
      alert('Terjadi kesalahan saat menyimpan data: ' + err.message);
    }
  };

  const handleDelete = async (path, id) => {
    if (window.confirm('Yakin ingin menghapus item ini?')) {
      await remove(ref(db, `${path}/${id}`));
    }
  };

  if (managingSubjectId) {
    const subject = subjects.find(s => s.id === managingSubjectId);
    if (!subject) return <div onClick={() => setManagingSubjectId(null)}>Mapel tidak ditemukan. Kembali.</div>;
    const subjectContents = contents.filter(c => c.subjectId === managingSubjectId);

    const submitContent = async (e) => {
      e.preventDefault();
      setIsUploading(true);
      let finalUrl = formContent.url;
      if (formContent.type === 'pdf' && formContent.file) {
        const uploadedUrl = await uploadFileToR2(formContent.file);
        if (uploadedUrl) finalUrl = uploadedUrl;
      }
      await handleSave('contents', { ...formContent, url: finalUrl, subjectId: managingSubjectId }, () => setFormContent({ id: null, title: '', url: '', type: 'pdf', file: null }));
      setIsUploading(false);
    };

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <button onClick={() => setManagingSubjectId(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><ChevronLeft size={20} /></button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Materi: {subject.name}</h2>
            <p className="text-sm text-slate-500">Upload PDF ke Cloudflare R2 atau input Video YouTube</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-emerald-50 p-5 rounded-xl border border-emerald-100 h-fit">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Plus size={18} /> {formContent.id ? 'Edit Materi' : 'Tambah Materi Baru'}</h3>
            <form onSubmit={submitContent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tipe Materi</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setFormContent({...formContent, type: 'pdf'})} className={`flex-1 py-2 rounded-lg text-sm font-medium border flex justify-center items-center gap-2 ${formContent.type === 'pdf' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'}`}><FileText size={16}/> PDF</button>
                  <button type="button" onClick={() => setFormContent({...formContent, type: 'video'})} className={`flex-1 py-2 rounded-lg text-sm font-medium border flex justify-center items-center gap-2 ${formContent.type === 'video' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-500 border-slate-200'}`}><Video size={16}/> YouTube</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Judul Materi</label>
                <input type="text" required value={formContent.title} onChange={e => setFormContent({...formContent, title: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500" placeholder="Cth: Bab 1 Pendahuluan" />
              </div>
              {formContent.type === 'pdf' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Upload File PDF (Cloudflare R2)</label>
                  <input type="file" accept="application/pdf" onChange={e => setFormContent({...formContent, file: e.target.files[0]})} className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                  {formContent.url && !formContent.file && <p className="text-[10px] text-slate-500 mt-1 truncate">File Saat ini: {formContent.url}</p>}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">URL Video YouTube</label>
                  <input type="url" required value={formContent.url} onChange={e => setFormContent({...formContent, url: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500" placeholder="https://youtube.com/watch?v=..." />
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={isUploading} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-70 flex justify-center items-center gap-2">
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : 'Simpan'}
                </button>
                {formContent.id && <button type="button" onClick={() => setFormContent({ id: null, title: '', url: '', type: 'pdf', file: null })} className="px-3 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Batal</button>}
              </div>
            </form>
          </div>
          <div className="lg:col-span-2">
            {subjectContents.length === 0 ? (
              <p className="text-slate-400 italic text-sm p-4 bg-slate-50 rounded-xl">Belum ada materi ditambahkan.</p>
            ) : (
              <div className="space-y-3">
                {subjectContents.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-emerald-200">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`p-2 rounded-lg ${c.type === 'pdf' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {c.type === 'pdf' ? <FileText size={20}/> : <Video size={20}/>}
                      </div>
                      <div className="truncate">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{c.title}</h4>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{c.url}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <button onClick={() => setFormContent(c)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-md"><Edit size={16}/></button>
                      <button onClick={() => handleDelete('contents', c.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (managingClassId) {
    const cls = classes.find(c => c.id === managingClassId);
    if (!cls) return <div onClick={() => setManagingClassId(null)}>Kelas tidak ditemukan. Kembali.</div>;
    const classSubjects = subjects.filter(s => s.classId === managingClassId);

    const submitSubject = async (e) => {
      e.preventDefault();
      setIsUploading(true);
      let finalUrl = formSubject.url || formSubject.imageKey; 
      if (formSubject.file) {
        const uploadedUrl = await uploadFileToR2(formSubject.file);
        if (uploadedUrl) finalUrl = uploadedUrl;
      }
      await handleSave('subjects', { ...formSubject, url: finalUrl, classId: managingClassId }, () => setFormSubject({ id: null, name: '', url: '', file: null }));
      setIsUploading(false);
    };

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <button onClick={() => setManagingClassId(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><ChevronLeft size={20} /></button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Mapel untuk Kelas: {cls.name}</h2>
            <p className="text-sm text-slate-500">Tambahkan mata pelajaran dan Upload Ikon ke R2 Cloudflare.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-emerald-50 p-5 rounded-xl border border-emerald-100 h-fit">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Plus size={18} /> {formSubject.id ? 'Edit Mapel' : 'Tambah Mapel Baru'}</h3>
            <form onSubmit={submitSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nama Mapel</label>
                <input type="text" required value={formSubject.name} onChange={e => setFormSubject({...formSubject, name: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500" placeholder="Matematika" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Upload Ikon Mapel (Gambar)</label>
                <input type="file" accept="image/*" onChange={e => setFormSubject({...formSubject, file: e.target.files[0]})} className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
              </div>
              {formSubject.url && !formSubject.file && (
                <div className="mt-2 flex justify-center">
                   <img src={getValidImageUrl(formSubject)} alt="Preview" className="w-16 h-16 object-cover rounded-lg shadow-sm border border-slate-200 bg-white" />
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={isUploading} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-70 flex justify-center items-center gap-2">
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : 'Simpan'}
                </button>
                {formSubject.id && <button type="button" onClick={() => setFormSubject({ id: null, name: '', url: '', file: null })} className="px-3 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Batal</button>}
              </div>
            </form>
          </div>
          <div className="lg:col-span-2">
            {classSubjects.length === 0 ? (
              <p className="text-slate-400 italic text-sm p-4 bg-slate-50 rounded-xl">Belum ada mata pelajaran.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classSubjects.map(s => (
                  <div key={s.id} className="flex flex-col p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-emerald-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <img src={getValidImageUrl(s)} alt={s.name} className="w-10 h-10 object-cover rounded-full bg-slate-100 border border-slate-200" />
                        <h4 className="font-bold text-slate-800">{s.name}</h4>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setFormSubject(s)} className="p-1 text-slate-400 hover:text-emerald-600"><Edit size={16}/></button>
                        <button onClick={() => handleDelete('subjects', s.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                      </div>
                    </div>
                    <button onClick={() => setManagingSubjectId(s.id)} className="mt-auto w-full py-2 bg-emerald-50 text-emerald-600 font-medium text-sm rounded-lg hover:bg-emerald-600 hover:text-white transition-colors flex items-center justify-center gap-2">
                      <LayoutDashboard size={16} /> Kelola Materi
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const submitBanner = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    let finalUrl = formBanner.url || formBanner.imageKey;
    if (formBanner.file) {
      const uploadedUrl = await uploadFileToR2(formBanner.file);
      if (uploadedUrl) finalUrl = uploadedUrl;
    }
    await handleSave('banners', { ...formBanner, url: finalUrl }, () => setFormBanner({ id: null, url: '', linkUrl: '', file: null }));
    setIsUploading(false);
  };

  const submitClass = (e) => {
    e.preventDefault();
    handleSave('classes', formClass, () => setFormClass({ id: null, name: '', description: '' }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-6 md:px-8">
        <h2 className="text-2xl font-bold">CMS Administrator</h2>
        <p className="text-slate-400 text-sm mt-1">Kelola konten Elkapede Digital Anda.</p>
        <div className="flex gap-2 mt-6">
          <button onClick={() => setActiveTab('classes')} className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${activeTab === 'classes' ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>Manajemen Kelas</button>
          <button onClick={() => setActiveTab('banners')} className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${activeTab === 'banners' ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>Slider Banners</button>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {activeTab === 'classes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-emerald-50 p-5 rounded-xl border border-emerald-100 h-fit">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Plus size={18} /> {formClass.id ? 'Edit Kelas' : 'Tambah Kelas'}</h3>
              <form onSubmit={submitClass} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nama Kelas</label>
                  <input type="text" required value={formClass.name} onChange={e => setFormClass({...formClass, name: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500" placeholder="Kelas 10 IPA" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Deskripsi Singkat</label>
                  <textarea value={formClass.description} onChange={e => setFormClass({...formClass, description: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500 resize-none h-20" placeholder="Deskripsi opsional..." />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">Simpan</button>
                  {formClass.id && <button type="button" onClick={() => setFormClass({ id: null, name: '', description: '' })} className="px-3 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Batal</button>}
                </div>
              </form>
            </div>
            <div className="lg:col-span-2 space-y-4">
              {classes.length === 0 ? (
                 <p className="text-slate-400 italic text-sm p-4 bg-slate-50 rounded-xl">Belum ada kelas ditambahkan.</p>
              ) : (
                classes.map(cls => (
                  <div key={cls.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="mb-4 sm:mb-0">
                      <h4 className="font-bold text-slate-800 text-lg">{cls.name}</h4>
                      <p className="text-sm text-slate-500 truncate max-w-sm">{cls.description}</p>
                      <div className="mt-2 text-xs font-medium bg-emerald-50 text-emerald-600 inline-block px-2 py-1 rounded-md">
                        {subjects.filter(s => s.classId === cls.id).length} Mata Pelajaran
                      </div>
                    </div>
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 shrink-0">
                      <button onClick={() => setManagingClassId(cls.id)} className="px-3 py-2 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-1"><Layers size={16} /> Buka Mapel</button>
                      <button onClick={() => setFormClass(cls)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Edit size={18}/></button>
                      <button onClick={() => handleDelete('classes', cls.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'banners' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-emerald-50 p-5 rounded-xl border border-emerald-100 h-fit">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><ImageIcon size={18} /> {formBanner.id ? 'Edit Banner' : 'Tambah Banner'}</h3>
              <form onSubmit={submitBanner} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Upload Gambar Banner (R2)</label>
                  <input type="file" accept="image/*" onChange={e => setFormBanner({...formBanner, file: e.target.files[0]})} className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Target URL Saat Diklik (Opsional)</label>
                  <input type="url" value={formBanner.linkUrl} onChange={e => setFormBanner({...formBanner, linkUrl: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500" placeholder="https://..." />
                </div>
                {formBanner.url && !formBanner.file && (
                  <div className="mt-2">
                     <p className="text-xs text-slate-500 mb-1">Preview Gambar Saat Ini:</p>
                     <img src={getValidImageUrl(formBanner)} alt="Preview" className="w-full h-24 object-cover rounded-lg shadow-sm border border-slate-200 bg-slate-200" />
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={isUploading} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-70 flex items-center justify-center gap-2">
                    {isUploading ? <Loader2 size={16} className="animate-spin" /> : 'Simpan'}
                  </button>
                  {formBanner.id && <button type="button" onClick={() => setFormBanner({ id: null, url: '', linkUrl: '', file: null })} className="px-3 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Batal</button>}
                </div>
              </form>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.length === 0 ? (
                 <p className="col-span-2 text-slate-400 italic text-sm p-4 bg-slate-50 rounded-xl">Belum ada banner aktif.</p>
              ) : (
                banners.map(banner => (
                  <div key={banner.id} className="relative group rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white">
                    <img src={getValidImageUrl(banner)} alt="Banner" className="w-full h-32 object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button onClick={() => setFormBanner(banner)} className="p-2 bg-white text-slate-800 rounded-full hover:bg-emerald-500 hover:text-white transition-colors"><Edit size={18}/></button>
                      <button onClick={() => handleDelete('banners', banner.id)} className="p-2 bg-white text-slate-800 rounded-full hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={18}/></button>
                    </div>
                    {banner.linkUrl && <div className="p-2 bg-white border-t border-slate-100 truncate text-xs text-emerald-600 font-medium">🔗 {banner.linkUrl}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}