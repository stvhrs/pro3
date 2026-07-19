import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getDatabase, ref, get, child, push, remove, update } from 'firebase/database';

// Import Komponen Ant Design
import { 
  ConfigProvider, Layout, Typography, Button, Spin, Card, 
  Row, Col, Carousel, Space, Badge, List, Avatar, Breadcrumb, 
  Form, Input, message, Tabs, Table, Modal, Popconfirm, Radio, Tag, Popover, Select, Divider, Skeleton
} from 'antd';

// Import Ikon Ant Design
import { 
  BookOutlined, VideoCameraOutlined, FilePdfOutlined, 
  LoginOutlined, LogoutOutlined, ArrowLeftOutlined,
  PlayCircleOutlined, DashboardOutlined, PlusOutlined,
  EditOutlined, DeleteOutlined,
  AppstoreOutlined, FullscreenOutlined, FullscreenExitOutlined,
  CloseOutlined, LinkOutlined, FormOutlined, ReadOutlined,
  RocketOutlined, LeftOutlined, RightOutlined, SolutionOutlined,
  WhatsAppOutlined, LockOutlined, BulbOutlined, ExperimentOutlined,
  TrophyOutlined, CrownOutlined, StarOutlined, FilterOutlined
} from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// ============================================================================
// 1. KONFIGURASI FIREBASE & CACHE
// ============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyD-xe1lg7iJmR7q_mRb7EofmtXOb3w_JdU",
  authDomain: "ebookelkapede.firebaseapp.com",
  databaseURL: "https://ebookelkapede-default-rtdb.firebaseio.com",
  projectId: "ebookelkapede",
  storageBucket: "ebookelkapede.firebasestorage.app",
  messagingSenderId: "665892166976",
  appId: "1:665892166976:web:3f348c75df54c5f6e72ea5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const CACHE_KEY = 'elkapede_data_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; 

const saveToCache = (path, data) => {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    cache[path] = { timestamp: Date.now(), data };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    localStorage.removeItem(CACHE_KEY); 
  }
};

const getFromCache = (path) => {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    if (cache[path] && (Date.now() - cache[path].timestamp < CACHE_EXPIRY)) {
      return cache[path].data;
    }
  } catch (e) {}
  return null;
};

const R2_PUBLIC_DOMAIN = "https://pub-268e4ac098564a4fae1119e480f5a908.r2.dev";
const IMAGE_PLACEHOLDER = "https://via.placeholder.com/400x560?text=Memuat+Cover...";
const LOGO_PLACEHOLDER = "/images/Logo Garuda.png";

const getGoogleDriveDirectImageUrl = (url) => {
  if (!url) return '';
  if (url.includes('lh3.googleusercontent.com')) return url;
  
  let fileId = null;
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  const match2 = url.match(/id=([a-zA-Z0-9_-]+)/);
  
  if (match1 && match1[1]) fileId = match1[1];
  else if (match2 && match2[1]) fileId = match2[1];

  if (fileId) return `https://lh3.googleusercontent.com/d/${fileId}`;
  return url;
};

const getValidImageUrl = (member) => {
  let url = member?.imageUrl ? member.imageUrl : (member?.url ? member.url : null);
  if (url && url.startsWith('data:')) return url;
  if (url && (url.includes('drive.google.com') || url.includes('lh3.googleusercontent.com'))) {
    return getGoogleDriveDirectImageUrl(url);
  }
  if (url && url.includes('pub-b7b4f93ec4d845a584a3d90b6a76e10f.r2.dev')) {
    url = url.replace('pub-b7b4f93ec4d845a584a3d90b6a76e10f.r2.dev', 'pub-268e4ac098564a4fae1119e480f5a908.r2.dev');
  } else if (!url && member?.imageKey) {
    url = `${R2_PUBLIC_DOMAIN}/${member.imageKey}`;
  }
  return url || null;
};

const getYouTubeID = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const getYouTubeThumbnail = (url) => {
  const id = getYouTubeID(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
};

const getGoogleDrivePreviewUrl = (url) => {
  if (!url) return '';
  if (url.includes('/preview')) return url;
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return `https://drive.google.com/file/d/${match[1]}/preview`;
  return url;
};

const formatTitleCase = (str) => {
  if (!str) return '';
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

// ============================================================================
// 2. KOMPONEN CUSTOM UI (Fade Image)
// ============================================================================
const FadeImage = ({ src, alt, className, style }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#f1f5f9', ...style }} className={className}>
      {!loaded && !error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="small" />
        </div>
      )}
      <img
        src={error ? IMAGE_PLACEHOLDER : (src || IMAGE_PLACEHOLDER)}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => { setError(true); setLoaded(true); }}
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          opacity: loaded ? 1 : 0, transition: 'opacity 0.5s ease-in-out',
          ...style
        }}
        className={className}
        loading="lazy"
      />
    </div>
  );
};

// ============================================================================
// 3. KOMPONEN UTAMA & STATE MANAGEMENT
// ============================================================================

export default function App() {
  const [user, setUser] = useState(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');
  
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isFetchingSubjects, setIsFetchingSubjects] = useState(false);
  const [isFetchingContents, setIsFetchingContents] = useState(false);
  
  const [banners, setBanners] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [contents, setContents] = useState([]);

  const fetchingRef = useRef({ banners: false, classes: false, subjects: false, contents: false });

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash || '#/');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAppReady(true);
      if (currentUser && window.location.hash === '#/login') {
        window.location.hash = '#/admin';
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async (path, force = false) => {
    const setter = path === 'banners' ? setBanners :
                   path === 'classes' ? setClasses :
                   path === 'subjects' ? setSubjects : setContents;

    if (!force) {
      const cached = getFromCache(path);
      if (cached) { setter(cached); return; }
    }

    if (fetchingRef.current[path]) return;
    fetchingRef.current[path] = true;

    if (path === 'subjects') setIsFetchingSubjects(true);
    if (path === 'contents') setIsFetchingContents(true);

    try {
      const snapshot = await get(child(ref(db), path));
      const d = snapshot.val() ? Object.keys(snapshot.val()).map(k => ({ id: k, ...snapshot.val()[k] })) : [];
      setter(d);
      saveToCache(path, d);
    } catch (e) {
      console.error(`Gagal memuat ${path}`, e);
    } finally {
      fetchingRef.current[path] = false;
      if (path === 'subjects') setIsFetchingSubjects(false);
      if (path === 'contents') setIsFetchingContents(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsDataLoading(true);
      await Promise.all([fetchData('banners'), fetchData('classes')]);
      setIsDataLoading(false);
    };
    init();
  }, []);

  let currentView = 'public';
  let selectedClass = null;
  let selectedSubject = null;
  let viewingContent = null;
  let viewingExternalBookId = null;

  if (currentHash === '#/login') currentView = 'admin_login';
  else if (currentHash === '#/admin') currentView = 'admin_dashboard';
  else if (currentHash.startsWith('#/class/')) {
    selectedClass = classes.find(c => c.id === currentHash.replace('#/class/', ''));
  }
  else if (currentHash.startsWith('#/subject/')) {
    selectedSubject = subjects.find(s => s.id === currentHash.replace('#/subject/', ''));
    if (selectedSubject) selectedClass = classes.find(c => c.id === selectedSubject.classId);
  } else if (currentHash.startsWith('#/content/')) {
    viewingContent = contents.find(c => c.id === currentHash.replace('#/content/', ''));
    if (viewingContent) {
      selectedSubject = subjects.find(s => s.id === viewingContent.subjectId);
      if (selectedSubject) selectedClass = classes.find(c => c.id === selectedSubject.classId);
    }
  } else if (currentHash.startsWith('#/external-book/')) {
    viewingExternalBookId = currentHash.replace('#/external-book/', '');
  }

  const needsSubjects = currentView === 'admin_dashboard' || currentHash.startsWith('#/class/') || currentHash.startsWith('#/subject/') || currentHash.startsWith('#/content/');
  useEffect(() => { if (needsSubjects) fetchData('subjects'); }, [needsSubjects]);

  const needsContents = currentView === 'admin_dashboard' || currentHash.startsWith('#/subject/') || currentHash.startsWith('#/content/');
  useEffect(() => { if (needsContents) fetchData('contents'); }, [needsContents]);

  if (currentView === 'admin_dashboard' && !user) currentView = 'admin_login';

  const handleLogout = () => {
    signOut(auth);
    window.location.hash = '#/';
    message.success("Berhasil keluar");
  };

  // Redesign: Radius dikurangi agar tidak terlalu membulat (borderRadius: 6)
  const themeConfig = {
    token: {
      colorPrimary: '#0f172a', 
      colorInfo: '#0f172a',
      fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
      borderRadius: 6,
    },
    components: {
      Layout: { headerBg: '#ffffff', bodyBg: '#f8fafc' },
      Card: { borderRadiusLG: 8 }
    }
  };

  if (!isAppReady && currentView.includes('admin')) {
    return (
      <ConfigProvider theme={themeConfig}>
        <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', background: '#f8fafc' }}>
          <Spin size="large" />
          <Title level={4} style={{ marginTop: 24, color: '#0f172a' }}>Elkapede Digital</Title>
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={themeConfig}>
      <style>{`
        .hover-card { transition: all 0.3s ease; border: 1px solid #e2e8f0; }
        .hover-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.08); border-color: #cbd5e1; }
        
        .book-3d {
          aspect-ratio: 1 / 1.414; 
          object-fit: cover;
          border-radius: 2px 6px 6px 2px;
          box-shadow: 
            inset 4px 0 10px rgba(0, 0, 0, 0.1),
            inset -1px 0 2px rgba(255, 255, 255, 0.3),
            3px 3px 10px rgba(0, 0, 0, 0.15),
            -1px 0 0 rgba(220, 220, 220, 1);
          background-color: #fff;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .book-card:hover .book-3d {
          transform: translateY(-8px) rotateY(-5deg) scale(1.02);
          box-shadow: 
            inset 4px 0 10px rgba(0, 0, 0, 0.1),
            inset -1px 0 2px rgba(255, 255, 255, 0.3),
            8px 12px 20px rgba(0, 0, 0, 0.2),
            -1px 0 0 rgba(220, 220, 220, 1);
        }

        .video-card .thumbnail-wrapper img { transition: transform 0.4s ease; }
        .video-card:hover .thumbnail-wrapper img { transform: scale(1.05); }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeUp 0.5s ease-out forwards; }
      `}</style>
      
      <Layout style={{ minHeight: '100vh' }}>
        {(!viewingContent && !viewingExternalBookId) && (
          <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50 }}>
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => window.location.hash = '#/'}>
              <img src={LOGO_PLACEHOLDER} alt="Elkapede Digital" style={{ height: 36, objectFit: 'contain' }} loading="lazy" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Popover 
                content={
                  <div style={{ maxWidth: 260, padding: '8px 4px' }}>
                    <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>Pusat Layanan 24/7</Text>
                    <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.5 }}>
                      Butuh <b>Soal Custom</b>, request <b>Fitur Sekolah</b>, atau punya kritik & saran? Jangan ragu hubungi kami via WhatsApp.
                    </Text>
                  </div>
                } 
                placement="bottomRight" trigger="hover"
              >
                <Button
                  shape="round"
                  icon={<WhatsAppOutlined />}
                  style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1', color: '#0f172a', fontWeight: '500' }}
                  onClick={() => window.open(`https://wa.me/6285601721370?text=${encodeURIComponent("Halo Admin Elkapede Digital, saya ingin berdiskusi mengenai layanan (Soal Custom / Request Fitur / Kritik & Saran):\n\n")}`, '_blank')}
                >
                  Bantuan & Request
                </Button>
              </Popover>

              {user && (
                <Space>
                  <Button type="text" onClick={() => window.location.hash = '#/admin'} icon={<DashboardOutlined />}>Dashboard Admin</Button>
                  <Button danger type="text" onClick={handleLogout} icon={<LogoutOutlined />}>Keluar</Button>
                </Space>
              )}
            </div>
          </Header>
        )}

        <Content style={{ padding: (viewingContent || viewingExternalBookId) ? '0' : '32px 24px', maxWidth: (viewingContent || viewingExternalBookId) ? '100%' : 1200, margin: '0 auto', width: '100%', position: 'relative' }}>
          <div style={{ position: 'relative', zIndex: 1, height: (viewingContent || viewingExternalBookId) ? '100%' : 'auto' }}>
            {currentView === 'public' && (
              <PublicView 
                currentHash={currentHash} banners={banners} classes={classes} subjects={subjects} contents={contents}
                selectedClass={selectedClass} selectedSubject={selectedSubject} viewingContent={viewingContent}
                viewingExternalBookId={viewingExternalBookId} isLoading={isDataLoading}
                isFetchingSubjects={isFetchingSubjects} isFetchingContents={isFetchingContents}
              />
            )}
            {currentView === 'admin_login' && <AdminLogin />}
            {currentView === 'admin_dashboard' && <AdminDashboard banners={banners} classes={classes} subjects={subjects} contents={contents} fetchData={fetchData} />}
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

// ============================================================================
// 4. KOMPONEN PUBLIC VIEW (PENGGUNA UMUM)
// ============================================================================

function PublicView({ currentHash, banners, classes, subjects, contents, selectedClass, selectedSubject, viewingContent, viewingExternalBookId, isLoading, isFetchingSubjects, isFetchingContents }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [externalBooks, setExternalBooks] = useState([]);
  const [isExternalLoading, setIsExternalLoading] = useState(false);
  
  // Filter Kemdikbud
  const [kemdikbudClassFilter, setKemdikbudClassFilter] = useState(null);
  const [kemdikbudSubjectFilter, setKemdikbudSubjectFilter] = useState(null);

  const [isTeacherModalVisible, setIsTeacherModalVisible] = useState(false);
  const [teacherPassword, setTeacherPassword] = useState('');
  const [pendingTeacherEbookId, setPendingTeacherEbookId] = useState(null);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Fetch Kemdikbud API
  useEffect(() => {
    const isHome = currentHash === '#/' || currentHash === '';
    const isExternalRoute = currentHash.startsWith('#/external-book/');
    if (!isHome && !isExternalRoute) return;
    if (externalBooks.length > 0) return; 

    const fetchExternalBooks = async () => {
      const cacheKey = 'elkapede_external_books_cache';
      try {
        const cached = JSON.parse(localStorage.getItem(cacheKey));
        if (cached && (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000)) { 
          setExternalBooks(cached.data); return; 
        }
      } catch (e) {}

      setIsExternalLoading(true);
      try {
        const response = await fetch("https://api.buku.cloudapp.web.id/api/catalogue/getPenggerakTextBooks?limit=600&type_pdf&order_by=updated_at&level_sd");
        const result = await response.json();
        if (result.status === 'success' && result.results) {
          setExternalBooks(result.results);
          try { localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: result.results })); } catch (e) {}
        }
      } catch (error) {
        console.error("Gagal mengambil koleksi buku eksternal:", error);
      } finally {
        setIsExternalLoading(false);
      }
    };
    fetchExternalBooks();
  }, [currentHash, externalBooks.length]);

  const externalBookToView = viewingExternalBookId ? externalBooks.find(b => b.id === viewingExternalBookId) : null;

  // Derivasi Filter untuk Kemdikbud
  const availableClasses = [...new Set(externalBooks.map(b => b.class).filter(Boolean))].sort((a,b) => a.localeCompare(b));
  const availableSubjects = [...new Set(externalBooks.map(b => b.subject).filter(Boolean))].sort((a,b) => a.localeCompare(b));
  
  const filteredExternalBooks = externalBooks.filter(book => {
    const matchClass = kemdikbudClassFilter ? book.class === kemdikbudClassFilter : true;
    const matchSubject = kemdikbudSubjectFilter ? book.subject === kemdikbudSubjectFilter : true;
    return matchClass && matchSubject;
  });

  // Animasi Loading
  if (currentHash.startsWith('#/external-book/') && (!externalBookToView || isExternalLoading)) return <div style={{ height: '50vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin size="large" /></div>;
  if (currentHash.startsWith('#/content/') && (!viewingContent || isFetchingContents)) return <div style={{ height: '50vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin size="large" /></div>;
  if (currentHash.startsWith('#/subject/') && (!selectedSubject || isFetchingContents)) return <div style={{ height: '50vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin size="large" /></div>;
  if (currentHash.startsWith('#/class/') && (!selectedClass || isFetchingSubjects)) return <div style={{ height: '50vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin size="large" /></div>;

  // THEATER MODE EKSTERNAL KEMDIKBUD
  if (externalBookToView) {
    const toggleFullscreen = () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e => {});
      else document.exitFullscreen();
    };
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        <div style={{ background: '#ffffff', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
             <Button icon={<ArrowLeftOutlined />} shape="circle" onClick={() => window.location.hash = '#/'} />
             <Breadcrumb items={[
                 { title: <span onClick={() => window.location.hash = '#/'} style={{ cursor: 'pointer' }}>Beranda</span> },
                 { title: 'Buku Penggerak' },
                 { title: <span style={{ maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{externalBookToView.title}</span> }
               ]}
             />
          </div>
          <Space>
             <Button type="text" icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} onClick={toggleFullscreen} />
             <Button type="text" danger icon={<CloseOutlined />} onClick={() => window.location.hash = '#/'} />
          </Space>
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <iframe src={externalBookToView.attachment} style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', top: 0, left: 0 }} title={externalBookToView.title} allowFullScreen loading="lazy"></iframe>
        </div>
      </div>
    );
  }

  // THEATER MODE UTAMA
  if (viewingContent) {
    const handleClose = () => window.location.hash = '#/subject/' + (selectedSubject ? selectedSubject.id : viewingContent.subjectId);
    const toggleFullscreen = () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e => {});
      else document.exitFullscreen();
    };
    let finalUrl = viewingContent.url;
    if (viewingContent.type === 'pdf' || viewingContent.type === 'teacher_pdf') finalUrl = getGoogleDrivePreviewUrl(viewingContent.url);

    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
        <div style={{ background: '#020617', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size="middle" style={{ color: '#fff' }}>
             <Button type="text" style={{ color: '#94a3b8' }} icon={<ArrowLeftOutlined />} onClick={handleClose} />
             {viewingContent.type === 'video' ? <VideoCameraOutlined style={{ color: '#ef4444' }} /> : <ReadOutlined style={{ color: '#3b82f6' }} />}
             <Title level={5} style={{ margin: 0, color: '#fff' }} ellipsis>{viewingContent.title}</Title>
          </Space>
          <Space>
             <Button type="text" style={{ color: '#94a3b8' }} icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} onClick={toggleFullscreen} />
             <Button type="text" danger icon={<CloseOutlined />} onClick={handleClose} />
          </Space>
        </div>
        <div style={{ flex: 1, position: 'relative', backgroundColor: '#000' }}>
          {viewingContent.type === 'video' ? (
            <iframe src={`https://www.youtube.com/embed/${getYouTubeID(viewingContent.url)}?autoplay=1`} style={{ width: '100%', height: '100%', border: 'none', position: 'absolute' }} title={viewingContent.title} allow="autoplay; fullscreen" allowFullScreen loading="lazy"></iframe>
          ) : (
            <iframe src={finalUrl} style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', background: '#fff' }} title={viewingContent.title} allowFullScreen loading="lazy"></iframe>
          )}
        </div>
      </div>
    );
  }

  // TAMPILAN MATERI MAPEL (BUKU, VIDEO, SOAL)
  if (selectedSubject) {
    const subjectContents = contents.filter(c => c.subjectId === selectedSubject.id);
    const pdfs = subjectContents.filter(c => c.type === 'pdf');
    const teacherPdfs = subjectContents.filter(c => c.type === 'teacher_pdf');
    const videos = subjectContents.filter(c => c.type === 'video');
    const quizzes = subjectContents.filter(c => c.type === 'quiz');

    const mainEbook = pdfs.length > 0 ? pdfs[0] : null;
    const teacherEbook = teacherPdfs.length > 0 ? teacherPdfs[0] : null;

    return (
      <div className="animate-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <Button icon={<ArrowLeftOutlined />} shape="circle" onClick={() => window.location.hash = '#/class/' + (selectedClass?.id || '')} />
          <Breadcrumb 
            items={[
              { title: <span onClick={() => window.location.hash = '#/'} style={{ cursor: 'pointer' }}>Beranda</span> },
              { title: <span onClick={() => window.location.hash = '#/class/' + (selectedClass?.id || '')} style={{ cursor: 'pointer' }}>Kelas {selectedClass?.name || ''}</span> },
              { title: selectedSubject?.name || '' }
            ]}
          />
        </div>

        {/* Hero Section Mapel */}
        <div style={{ backgroundColor: selectedSubject.themeColor || '#0f172a', padding: '32px 40px', borderRadius: 12, display: 'flex', gap: 32, alignItems: 'center', marginBottom: 32, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <div style={{ width: 120, flexShrink: 0 }}>
             <FadeImage src={getValidImageUrl(selectedSubject)} alt={selectedSubject.name} className="book-3d" />
          </div>
          <div>
            <Title level={2} style={{ color: 'white', margin: '0 0 12px 0' }}>{selectedSubject?.name}</Title>
            <Space wrap>
              <Tag color="rgba(255,255,255,0.2)" style={{ border: 'none', color: 'white', padding: '4px 12px' }}>{videos.length} Video</Tag>
              <Tag color="rgba(255,255,255,0.2)" style={{ border: 'none', color: 'white', padding: '4px 12px' }}>{quizzes.length} Latihan</Tag>
              {mainEbook && <Tag color="rgba(255,255,255,0.2)" style={{ border: 'none', color: '#a7f3d0', padding: '4px 12px' }}>Buku Tersedia</Tag>}
            </Space>
          </div>
        </div>

        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          {mainEbook && (
            <Col xs={24} md={12}>
              <Card className="hover-card" onClick={() => window.location.hash = '#/content/' + mainEbook.id} style={{ cursor: 'pointer', height: '100%', borderColor: '#cbd5e1' }} bodyStyle={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Avatar size={48} style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }} icon={<ReadOutlined />} />
                <div>
                  <Title level={5} style={{ margin: 0 }}>Buku Modul Siswa</Title>
                  <Text type="secondary" style={{ fontSize: 13 }}>Baca modul pembelajaran digital</Text>
                </div>
              </Card>
            </Col>
          )}
          {teacherEbook && (
            <Col xs={24} md={12}>
              <Card className="hover-card" onClick={() => { setPendingTeacherEbookId(teacherEbook.id); setIsTeacherModalVisible(true); }} style={{ cursor: 'pointer', height: '100%', borderColor: '#cbd5e1' }} bodyStyle={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Avatar size={48} style={{ backgroundColor: '#fef3c7', color: '#f59e0b' }} icon={<LockOutlined />} />
                <div>
                  <Title level={5} style={{ margin: 0 }}>Buku Panduan Guru</Title>
                  <Text type="secondary" style={{ fontSize: 13 }}>Akses terbatas kunci jawaban</Text>
                </div>
              </Card>
            </Col>
          )}
        </Row>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card title={<><VideoCameraOutlined style={{ color: '#ef4444', marginRight: 8 }} /> Video Pembelajaran</>} bordered={false} style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
               <List 
                  itemLayout="horizontal" dataSource={videos} pagination={{ pageSize: 4, size: 'small' }} locale={{ emptyText: 'Belum ada video' }}
                  renderItem={(item) => (
                    <List.Item onClick={() => window.location.hash = '#/content/' + item.id} style={{ cursor: 'pointer', padding: '12px', borderBottom: '1px solid #f1f5f9' }} className="video-card hover-card">
                      <div style={{ display: 'flex', gap: 16, width: '100%' }}>
                        <div className="thumbnail-wrapper" style={{ width: 120, height: 68, borderRadius: 6, overflow: 'hidden', backgroundColor: '#e2e8f0', flexShrink: 0 }}>
                          {getYouTubeThumbnail(item.url) ? (
                            <img src={getYouTubeThumbnail(item.url)} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PlayCircleOutlined style={{ color: '#94a3b8', fontSize: 24 }} /></div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <Text strong style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>{item.title}</Text>
                        </div>
                      </div>
                    </List.Item>
                  )}
               />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title={<><FormOutlined style={{ color: '#3b82f6', marginRight: 8 }} /> Bank Soal & Latihan</>} bordered={false} style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
               <List 
                  itemLayout="horizontal" dataSource={quizzes} pagination={{ pageSize: 4, size: 'small' }} locale={{ emptyText: 'Belum ada latihan soal' }}
                  renderItem={(item, index) => (
                    <List.Item onClick={() => window.open(item.url, '_blank')} style={{ cursor: 'pointer', padding: '16px 12px' }} className="hover-card">
                      <List.Item.Meta 
                         avatar={<Avatar shape="square" size={48} style={{ backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: 8, fontWeight: 'bold' }}>{index + 1}</Avatar>}
                         title={<Text strong>{item.title}</Text>}
                         description={<Text type="secondary" style={{ fontSize: 13 }}><LinkOutlined /> Buka Latihan Ujian</Text>}
                      />
                    </List.Item>
                  )}
               />
            </Card>
          </Col>
        </Row>

       <Modal
  title={
    <>
      <LockOutlined style={{ color: '#f59e0b', marginRight: 8 }} />
      Akses Terbatas Khusus Guru
    </>
  }
  open={isTeacherModalVisible}
  onCancel={() => {
    setIsTeacherModalVisible(false);
    setTeacherPassword('');
  }}
  footer={null}
  centered
>
  <div style={{ marginBottom: 24 }}>
    <Text type="secondary">
      Silakan masukkan password (gubukpustaka) untuk membuka dokumen
      panduan guru ini.
    </Text>
  </div>

  <Form
    layout="vertical"
    onFinish={() => {
      if (teacherPassword === 'gubukpustaka') {
        setIsTeacherModalVisible(false);
        setTeacherPassword('');
        window.location.hash = '#/content/' + pendingTeacherEbookId;
      } else {
        message.error('Password salah!');
      }
    }}
  >
    <Form.Item label="Password Akses">
      <Input.Password
        size="large"
        value={teacherPassword}
        onChange={(e) => setTeacherPassword(e.target.value)}
      />
    </Form.Item>

    <Form.Item style={{ marginBottom: 12 }}>
      <Button
        type="primary"
        htmlType="submit"
        size="large"
        block
        style={{ backgroundColor: '#f59e0b' }}
      >
        Buka Dokumen
      </Button>
    </Form.Item>

    <Button
      block
      size="large"
      icon={<WhatsAppOutlined />}
      style={{
        borderColor: '#25D366',
        color: '#25D366',
        fontWeight: 600,
      }}
      onClick={() =>
        window.open(
          `https://wa.me/6285601721370?text=${encodeURIComponent(
            "Halo Admin Elkapede Digital,\n\nSaya ingin meminta password akses Dokumen Panduan Guru.\n\nNama:\nSekolah:\nJudul Buku:\n\nTerima kasih."
          )}`,
          '_blank'
        )
      }
    >
      Tanya Password via WhatsApp
    </Button>
  </Form>
</Modal>
      </div>
    );
  }

  // TAMPILAN DAFTAR MAPEL
  if (selectedClass) {
    const classSubjects = subjects.filter(s => s.classId === selectedClass.id);
    return (
      <div className="animate-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <Button icon={<ArrowLeftOutlined />} shape="circle" onClick={() => window.location.hash = '#/'} />
          <Breadcrumb items={[ { title: <span onClick={() => window.location.hash = '#/'} style={{ cursor: 'pointer' }}>Beranda</span> }, { title: `Kelas ${selectedClass?.name || ''}` } ]} />
        </div>

        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Modul Kelas {selectedClass.name}</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>Pilih mata pelajaran yang ingin dipelajari.</Text>
        </div>

        {classSubjects.length > 0 ? (
          <Row gutter={[32, 32]} justify="center">
            {classSubjects.map((subject, index) => (
              <Col xs={12} sm={8} md={6} lg={4} key={subject.id} style={{ animationDelay: `${index * 0.05}s` }} className="animate-fade-up">
                <div onClick={() => window.location.hash = '#/subject/' + subject.id} style={{ cursor: 'pointer' }} className="book-card">
                  <div style={{ marginBottom: 16, position: 'relative', width: '100%' }}>
                     <FadeImage src={getValidImageUrl(subject)} alt={subject?.name || ''} className="book-3d" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <Text strong style={{ fontSize: 14, color: '#1e293b', display: 'block', lineHeight: 1.2 }}>{subject.name}</Text>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        ) : (
          <Card style={{ textAlign: 'center', padding: '60px 0', borderStyle: 'dashed' }}>
            <AppstoreOutlined style={{ fontSize: 48, color: '#cbd5e1', marginBottom: 16 }} />
            <br />
            <Text type="secondary">Belum ada modul pelajaran untuk kelas ini.</Text>
          </Card>
        )}
      </div>
    );
  }

  // TAMPILAN BERANDA (KELAS & BUKU PENGGERAK)
  // Konfigurasi Tema Kartu Kelas tanpa gambar
  const classThemes = [
    { bg: 'linear-gradient(135deg, #0ea5e9, #2563eb)', icon: <RocketOutlined /> },
    { bg: 'linear-gradient(135deg, #10b981, #059669)', icon: <BulbOutlined /> },
    { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', icon: <ExperimentOutlined /> },
    { bg: 'linear-gradient(135deg, #ef4444, #dc2626)', icon: <TrophyOutlined /> },
    { bg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', icon: <CrownOutlined /> },
    { bg: 'linear-gradient(135deg, #06b6d4, #0369a1)', icon: <StarOutlined /> },
  ];

  return (
    <div className="animate-fade-up">
      {/* Banner */}
      {isLoading ? (
         <Skeleton.Image style={{ width: '100%', height: 300, marginBottom: 40 }} active />
      ) : banners.length > 0 ? (
        <Carousel autoplay effect="fade" style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 48, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          {banners.map((banner) => (
            <div key={banner.id} onClick={() => banner.linkUrl && window.open(banner.linkUrl, '_blank')} style={{ cursor: banner.linkUrl ? 'pointer' : 'default' }}>
              <div className="banner-container" style={{ height: 280 }}>
                <FadeImage src={getValidImageUrl(banner)} alt="Banner" style={{ position: 'absolute', inset: 0 }} />
              </div>
            </div>
          ))}
        </Carousel>
      ) : null}

      {}
      {/* Banner Tryout Portal */}
      <Card 
        hoverable
        style={{ 
          marginBottom: 48, 
          background: 'linear-gradient(135deg, #1e293b 0%, #312e81 100%)', 
          border: 'none', 
          borderRadius: 16,
          position: 'relative',
          overflow: 'hidden'
        }}
        bodyStyle={{ 
          padding: '32px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: 16,
          position: 'relative',
          zIndex: 1
        }}
        onClick={() => window.open('https://elkapede.web.app/', '_blank')}
      >
        <div style={{ 
          position: 'absolute', 
          right: -20, 
          bottom: -20, 
          fontSize: '150px', 
          color: 'rgba(255, 255, 255, 0.05)', 
          transform: 'rotate(15deg)',
          pointerEvents: 'none'
        }}>
          <TrophyOutlined />
        </div>

        <div>
          <Title level={3} style={{ color: 'white', margin: 0 }}>Portal Tryout Elkapede</Title>
          <Text style={{ color: '#c7d2fe', fontSize: 16 }}>Akses platform ujian dan tryout khusus untuk Guru dan Siswa.</Text>
        </div>
        <Button 
          icon={<ReadOutlined />} 
          type="primary" 
          size="large" 
          style={{ 
            background: '#ffffff', 
            color: '#312e81', 
            fontWeight: 'bold', 
            border: 'none',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            padding: '0 24px',
            height: 44,
            fontSize: '15px'
          }}
          onClick={(e) => {
             e.stopPropagation(); // Mencegah klik ganda jika mengklik tombol
             window.open('https://elkapede.web.app/', '_blank');
          }}
        >
          Buka Portal Tryout
        </Button>
      </Card>

      {/* Grid Kelas Holistik */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Pilih Kelas Pembelajaran</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>Modul Interaktif, Video, & Bank Soal Lengkap</Text>
      </div>

      {isLoading ? (
        <Row gutter={[24, 24]}><Col span={24}><Spin style={{ display: 'block', margin: '40px auto' }} /></Col></Row>
      ) : classes.length > 0 ? (
        <Row gutter={[24, 24]} justify="center">
          {classes.map((cls, index) => {
            const theme = classThemes[index % classThemes.length];
            return (
              <Col xs={24} sm={12} md={8} key={cls.id} className="animate-fade-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <Card 
                  hoverable 
                  className="hover-card"
                  onClick={() => window.location.hash = '#/class/' + cls.id}
                  style={{ border: 'none', background: theme.bg, color: 'white', overflow: 'hidden', position: 'relative' }}
                  bodyStyle={{ padding: '32px 24px', position: 'relative', zIndex: 1, minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                >
                  <div style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.1, fontSize: 120, transform: 'rotate(-15deg)' }}>
                    {theme.icon}
                  </div>
                  <Title level={2} style={{ color: 'white', margin: 0, fontWeight: 800 }}>Kelas {cls.name}</Title>
                  <div style={{ marginTop: 12, opacity: 0.9 }}>
                    <Text style={{ color: 'white', display: 'block', fontSize: 13 }}>• Video Modul Digital</Text>
                    <Text style={{ color: 'white', display: 'block', fontSize: 13 }}>• Kunci Jawaban Guru</Text>
                    <Text style={{ color: 'white', display: 'block', fontSize: 13 }}>• Bank Soal Ujian</Text>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Card style={{ textAlign: 'center', padding: '40px 0', borderStyle: 'dashed' }}>
          <Text type="secondary">Belum ada data kelas.</Text>
        </Card>
      )}

      {/* FILTER & KOLEKSI BUKU PENGGERAK KEMDIKBUD */}
      <div style={{ marginTop: 80, paddingTop: 40, borderTop: '1px solid #e2e8f0' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={3} style={{ margin: 0, fontWeight: 800 }}>Buku Penggerak (Kemdikbud)</Title>
            <Text type="secondary">Koleksi buku kurikulum merdeka gratis.</Text>
          </Col>
          <Col>
            <Space wrap>
              <Select 
                allowClear placeholder="Filter Kelas" style={{ width: 140 }} 
                onChange={setKemdikbudClassFilter} value={kemdikbudClassFilter}
                suffixIcon={<FilterOutlined />}
              >
                {availableClasses.map(c => <Option key={c} value={c}>Kelas {c}</Option>)}
              </Select>
              <Select 
                allowClear placeholder="Filter Mapel" style={{ width: 200 }} 
                onChange={setKemdikbudSubjectFilter} value={kemdikbudSubjectFilter}
              >
                {availableSubjects.map(s => <Option key={s} value={s}>{formatTitleCase(s)}</Option>)}
              </Select>
            </Space>
          </Col>
        </Row>

        <List 
          grid={{ gutter: [24, 40], xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
          dataSource={filteredExternalBooks}
          loading={isExternalLoading}
          pagination={{ pageSize: 12, align: 'center' }}
          renderItem={(book, index) => (
             <List.Item className="animate-fade-up" style={{ animationDelay: `${(index % 12) * 0.05}s` }}>
               <div onClick={() => window.location.hash = `#/external-book/${book.id}`} style={{ cursor: 'pointer' }} className="book-card">
                 <div style={{ marginBottom: 12, position: 'relative', width: '100%' }}>
                    <FadeImage src={book.image} alt={book.title} className="book-3d" />
                 </div>
                 <div style={{ textAlign: 'center' }}>
                   <Text strong style={{ fontSize: 13, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: '#1e293b' }} title={book.title}>
                     {book.title}
                   </Text>
                   <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>Kelas {book.class} • {formatTitleCase(book.subject)}</Text>
                 </div>
               </div>
             </List.Item>
          )}
        />
      </div>

    </div>
  );
}

// ============================================================================
// 5. KOMPONEN LOGIN ADMIN
// ============================================================================

function AdminLogin() {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      message.success("Berhasil login!");
    } catch (err) {
      message.error('Gagal login: Periksa kredensial Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '60px auto 0' }}>
      <Card bordered={false} style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Avatar size={64} style={{ backgroundColor: '#f1f5f9', color: '#0f172a', marginBottom: 16 }} icon={<LockOutlined />} />
          <Title level={3} style={{ margin: 0 }}>Login Sistem</Title>
        </div>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Email Administrator" name="email" rules={[{ required: true }]}><Input size="large" /></Form.Item>
          <Form.Item label="Kata Sandi" name="password" rules={[{ required: true }]}><Input.Password size="large" /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ backgroundColor: '#0f172a' }}>Masuk Dashboard</Button></Form.Item>
        </Form>
      </Card>
    </div>
  );
}

// ============================================================================
// 6. KOMPONEN DASHBOARD ADMIN (CMS)
// ============================================================================

function AdminDashboard({ banners, classes, subjects, contents, fetchData }) {
  const [activeTab, setActiveTab] = useState('classes'); 
  const [managingClass, setManagingClass] = useState(null);
  const [managingSubject, setManagingSubject] = useState(null);

  const [formClass] = Form.useForm();
  const [formBanner] = Form.useForm();
  const [formSubject] = Form.useForm();
  const [formContent] = Form.useForm();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState(''); 
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async (path, payload, id) => {
    try {
      if (id) await update(ref(db, `${path}/${id}`), payload);
      else await push(ref(db, path), payload);
      message.success('Data berhasil disimpan');
      await fetchData(path, true);
      setIsModalVisible(false);
    } catch (err) { message.error('Gagal menyimpan data'); }
  };

  const handleDelete = async (path, id) => {
    try {
      await remove(ref(db, `${path}/${id}`));
      message.success('Data dihapus');
      await fetchData(path, true);
    } catch (err) { message.error('Gagal menghapus'); }
  };

  const openModal = (type, record = null) => {
    setModalType(type);
    setEditingId(record ? record.id : null);
    if (type === 'class') record ? formClass.setFieldsValue(record) : formClass.resetFields();
    else if (type === 'banner') record ? formBanner.setFieldsValue(record) : formBanner.resetFields();
    else if (type === 'subject') record ? formSubject.setFieldsValue(record) : formSubject.setFieldsValue({ themeColor: '#0f172a' });
    else if (type === 'content') {
       if (record) formContent.setFieldsValue(record);
       else { formContent.resetFields(); formContent.setFieldsValue({ type: 'pdf' }); }
    }
    setIsModalVisible(true);
  };

  const onFinishModal = async (values) => {
    setSubmitting(true);
    try {
      const payload = { ...values };
      if (payload.imageUrl) payload.imageUrl = getGoogleDriveDirectImageUrl(payload.imageUrl);

      if (modalType === 'class') await handleSave('classes', payload, editingId);
      else if (modalType === 'banner') await handleSave('banners', payload, editingId);
      else if (modalType === 'subject') await handleSave('subjects', { ...payload, classId: managingClass.id }, editingId);
      else if (modalType === 'content') await handleSave('contents', { ...payload, subjectId: managingSubject.id }, editingId);
    } catch (error) {} finally { setSubmitting(false); }
  };

  // MATERI
  if (managingSubject) {
    const subjectContents = contents.filter(c => c.subjectId === managingSubject.id);
    return (
      <Card title={<><Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setManagingSubject(null)} /> Materi Mapel: {managingSubject.name}</>} extra={<Button type="primary" onClick={() => openModal('content')}>Tambah Materi</Button>}>
         <Table dataSource={subjectContents} rowKey="id" columns={[
           { title: 'Judul', dataIndex: 'title' },
           { title: 'Aksi', render: (_, r) => (<Space><Button size="small" onClick={() => openModal('content', r)}>Edit</Button><Popconfirm title="Hapus?" onConfirm={() => handleDelete('contents', r.id)}><Button danger size="small">Hapus</Button></Popconfirm></Space>) }
         ]} />
         <Modal title={editingId ? "Edit" : "Tambah"} open={isModalVisible && modalType === 'content'} onCancel={() => setIsModalVisible(false)} footer={null}>
           <Form form={formContent} layout="vertical" onFinish={onFinishModal}>
             <Form.Item name="type" label="Tipe"><Radio.Group><Radio.Button value="pdf">Buku</Radio.Button><Radio.Button value="teacher_pdf">Pegangan Guru</Radio.Button><Radio.Button value="video">Video</Radio.Button><Radio.Button value="quiz">Soal</Radio.Button></Radio.Group></Form.Item>
             <Form.Item name="title" label="Judul" rules={[{ required: true }]}><Input /></Form.Item>
             <Form.Item name="url" label="URL (G-Drive / YouTube / Link)" rules={[{ required: true }]}><Input /></Form.Item>
             <Form.Item><Button type="primary" htmlType="submit" loading={submitting} block>Simpan</Button></Form.Item>
           </Form>
         </Modal>
      </Card>
    );
  }

  // MAPEL
  if (managingClass) {
    const classSubjects = subjects.filter(s => s.classId === managingClass.id);
    return (
      <Card title={<><Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setManagingClass(null)} /> Mapel Kelas {managingClass.name}</>} extra={<Button type="primary" onClick={() => openModal('subject')}>Tambah Mapel</Button>}>
         <Table dataSource={classSubjects} rowKey="id" columns={[
           { title: 'Nama', dataIndex: 'name' },
           { title: 'Aksi', render: (_, r) => (<Space><Button size="small" type="primary" ghost onClick={() => setManagingSubject(r)}>Materi</Button><Button size="small" onClick={() => openModal('subject', r)}>Edit</Button><Popconfirm title="Hapus?" onConfirm={() => handleDelete('subjects', r.id)}><Button danger size="small">Hapus</Button></Popconfirm></Space>) }
         ]} />
         <Modal title={editingId ? "Edit" : "Tambah"} open={isModalVisible && modalType === 'subject'} onCancel={() => setIsModalVisible(false)} footer={null}>
           <Form form={formSubject} layout="vertical" onFinish={onFinishModal}>
             <Form.Item name="name" label="Nama" rules={[{ required: true }]}><Input /></Form.Item>
             <Form.Item name="imageUrl" label="URL Gambar G-Drive"><Input /></Form.Item>
             <Form.Item><Button type="primary" htmlType="submit" loading={submitting} block>Simpan</Button></Form.Item>
           </Form>
         </Modal>
      </Card>
    );
  }

  // DASHBOARD
  return (
    <Card bordered={false} bodyStyle={{ padding: 0 }}>
      <div style={{ background: '#0f172a', padding: 24 }}>
         <Title level={3} style={{ color: 'white', margin: 0 }}>Dashboard Admin</Title>
         <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginTop: 16 }} tabBarStyle={{ marginBottom: 0, borderBottom: 'none' }} items={[ { key: 'classes', label: <span style={{color:'white'}}>Kelas</span> }, { key: 'banners', label: <span style={{color:'white'}}>Banner</span> } ]} />
      </div>
      <div style={{ padding: 24 }}>
        {activeTab === 'classes' && (
          <div>
             <Button type="primary" onClick={() => openModal('class')} style={{ marginBottom: 16 }}>Tambah Kelas</Button>
             <Table dataSource={classes} rowKey="id" columns={[ { title: 'Nama', dataIndex: 'name' }, { title: 'Aksi', render: (_, r) => (<Space><Button type="primary" ghost onClick={() => setManagingClass(r)}>Buka Mapel</Button><Button onClick={() => openModal('class', r)}>Edit</Button></Space>) } ]} />
          </div>
        )}
        {activeTab === 'banners' && (
          <div>
             <Button type="primary" onClick={() => openModal('banner')} style={{ marginBottom: 16 }}>Tambah Banner</Button>
             <Table dataSource={banners} rowKey="id" columns={[ { title: 'Aksi', render: (_, r) => (<Button danger onClick={() => handleDelete('banners', r.id)}>Hapus</Button>) } ]} />
          </div>
        )}
      </div>

      <Modal title={editingId ? "Edit Kelas" : "Tambah Kelas"} open={isModalVisible && modalType === 'class'} onCancel={() => setIsModalVisible(false)} footer={null}>
        <Form form={formClass} layout="vertical" onFinish={onFinishModal}>
          <Form.Item name="name" label="Nama Kelas" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" loading={submitting} block>Simpan</Button></Form.Item>
        </Form>
      </Modal>

      <Modal title={editingId ? "Edit Banner" : "Tambah Banner"} open={isModalVisible && modalType === 'banner'} onCancel={() => setIsModalVisible(false)} footer={null}>
        <Form form={formBanner} layout="vertical" onFinish={onFinishModal}>
          <Form.Item name="imageUrl" label="URL Banner" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="linkUrl" label="Link Target"><Input /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" loading={submitting} block>Simpan</Button></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}