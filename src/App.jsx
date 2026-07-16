import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getDatabase, ref, onValue, push, remove, update } from 'firebase/database';

// Import Komponen Ant Design
import { 
  ConfigProvider, Layout, Typography, Button, Spin, Card, 
  Row, Col, Carousel, Space, Badge, List, Avatar, Breadcrumb, 
  Form, Input, message, Tabs, Table, Modal, Upload, Popconfirm, Radio, Tag
} from 'antd';

// Import Ikon Ant Design
import { 
  BookOutlined, VideoCameraOutlined, FilePdfOutlined, 
  LoginOutlined, LogoutOutlined, ArrowLeftOutlined,
  PlayCircleOutlined, DashboardOutlined, PlusOutlined,
  EditOutlined, DeleteOutlined, UploadOutlined,
  AppstoreOutlined, FullscreenOutlined, FullscreenExitOutlined,
  CloseOutlined, LinkOutlined, FormOutlined, ReadOutlined,
  RocketOutlined, LeftOutlined, RightOutlined, SolutionOutlined,
  WhatsAppOutlined, LockOutlined
} from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

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

// Pengaturan Cache (1 Minggu)
const CACHE_KEY = 'elkapede_data_cache';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 Hari dalam Milidetik

const R2_PUBLIC_DOMAIN = "https://pub-268e4ac098564a4fae1119e480f5a908.r2.dev";
const IMAGE_PLACEHOLDER = "https://via.placeholder.com/400x300?text=Belum+Ada+Gambar";
const LOGO_PLACEHOLDER = "/images/Logo Garuda.png";

// Fungsi Mengubah Link Google Drive menjadi Direct Image URL (Untuk Sampul/Banner)
const getGoogleDriveDirectImageUrl = (url) => {
  if (!url) return '';
  if (url.includes('lh3.googleusercontent.com')) return url;
  
  let fileId = null;
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  const match2 = url.match(/id=([a-zA-Z0-9_-]+)/);
  
  if (match1 && match1[1]) fileId = match1[1];
  else if (match2 && match2[1]) fileId = match2[1];

  if (fileId) {
    // Membuka blokir hotlinking gambar Google Drive menggunakan server LH3
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return url; // Jika bukan Google Drive URL, gunakan URL asli
};

const getValidImageUrl = (member) => {
  let url = member.imageUrl ? member.imageUrl : (member.url ? member.url : null);
  if (url && url.startsWith('data:')) return url;
  if (url && (url.includes('drive.google.com') || url.includes('lh3.googleusercontent.com'))) {
    return getGoogleDriveDirectImageUrl(url);
  }
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

// Fungsi Mengubah Link Google Drive ke Format Embed/Preview (Untuk Modul PDF)
const getGoogleDrivePreviewUrl = (url) => {
  if (!url) return '';
  if (url.includes('/preview')) return url; // Jika sudah format preview
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return url; // Fallback jika bukan URL standar
};

// ============================================================================
// 2. KOMPONEN UTAMA & STATE MANAGEMENT
// ============================================================================

export default function App() {
  const [user, setUser] = useState(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  const [banners, setBanners] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [contents, setContents] = useState([]);

  // Pengaturan Hash Routing
  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash || '#/');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Listener Auth
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

  // Mengambil Data Firebase dengan CACHE & PROGRESSIVE LOADING
  useEffect(() => {
    // 1. Cek Data di LocalStorage Cache (Membuat web instan saat di-reload)
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      try {
        const { timestamp, data } = JSON.parse(cachedData);
        // Validasi kedaluwarsa 1 Minggu
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          setBanners(data.banners || []);
          setClasses(data.classes || []);
          setSubjects(data.subjects || []);
          setContents(data.contents || []);
          setIsDataLoading(false); // Langsung matikan loading!
        }
      } catch (err) {
        console.error("Gagal membaca cache lokal", err);
      }
    }

    // 2. Load Data dari Firebase di Background
    let bLoaded = false, cLoaded = false, sLoaded = false, cntLoaded = false;
    
    const checkData = () => { 
      const hash = window.location.hash;
      if (hash.startsWith('#/content/') || hash.startsWith('#/subject/')) {
         if (bLoaded && cLoaded && sLoaded && cntLoaded) setIsDataLoading(false);
      } else {
         if (bLoaded && cLoaded && sLoaded) setIsDataLoading(false);
      }
    };

    onValue(ref(db, 'banners'), s => { const d = s.val() ? Object.keys(s.val()).map(k => ({ id: k, ...s.val()[k] })) : []; setBanners(d); bLoaded = true; checkData(); });
    onValue(ref(db, 'classes'), s => { const d = s.val() ? Object.keys(s.val()).map(k => ({ id: k, ...s.val()[k] })) : []; setClasses(d); cLoaded = true; checkData(); });
    onValue(ref(db, 'subjects'), s => { const d = s.val() ? Object.keys(s.val()).map(k => ({ id: k, ...s.val()[k] })) : []; setSubjects(d); sLoaded = true; checkData(); });
    onValue(ref(db, 'contents'), s => { const d = s.val() ? Object.keys(s.val()).map(k => ({ id: k, ...s.val()[k] })) : []; setContents(d); cntLoaded = true; checkData(); });
  }, []);

  // Update Cache ke LocalStorage Setiap Kali Ada Data Baru Dari Firebase
  useEffect(() => {
    if (!isDataLoading && (classes.length > 0 || banners.length > 0)) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          data: { banners, classes, subjects, contents }
        }));
      } catch (e) {
        console.warn("Penyimpanan cache melebihi kuota. Mengabaikan proses caching lokal.");
        try { localStorage.removeItem(CACHE_KEY); } catch(err) {}
      }
    }
  }, [banners, classes, subjects, contents, isDataLoading]);

  // Logika Derivasi Routing
  let currentView = 'public';
  let selectedClass = null;
  let selectedSubject = null;
  let viewingContent = null;

  if (currentHash === '#/login') currentView = 'admin_login';
  else if (currentHash === '#/admin') currentView = 'admin_dashboard';
  else if (currentHash.startsWith('#/class/')) selectedClass = classes.find(c => c.id === currentHash.replace('#/class/', ''));
  else if (currentHash.startsWith('#/subject/')) {
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
    message.success("Berhasil keluar");
  };

  // Konfigurasi Tema Ant Design
  const themeConfig = {
    token: {
      colorPrimary: '#10b981', 
      colorInfo: '#10b981',
      fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
      borderRadius: 8,
    },
    components: {
      Layout: { headerBg: '#ffffff', bodyBg: '#f8fafc' },
      Card: { borderRadiusLG: 16 }
    }
  };

  if (!isAppReady) {
    return (
      <ConfigProvider theme={themeConfig}>
        <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', background: '#f8fafc' }}>
          <Spin size="large" />
          <Title level={4} style={{ marginTop: 24, color: '#10b981' }}>Elkapede Digital</Title>
          <Text type="secondary">Memuat ruang belajar...</Text>
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={themeConfig}>
      {/* Injeksi Gaya CSS */}
      <style>{`
        .hover-list-item:hover { background-color: #f8fafc; border-radius: 8px; }
        .banner-container {
          width: 100%;
          aspect-ratio: 29/9;
          background-size: cover;
          background-position: center;
          position: relative;
        }
        .book-3d {
          aspect-ratio: 1 / 1.414; 
          object-fit: cover;
          border-radius: 3px 8px 8px 3px;
          box-shadow: 
            inset 4px 0 10px rgba(0, 0, 0, 0.15),
            inset -1px 0 2px rgba(255, 255, 255, 0.4),
            5px 5px 15px rgba(0, 0, 0, 0.25),
            -2px 0 0 rgba(220, 220, 220, 1);
          background-color: #fff;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .book-3d-hover:hover {
          transform: translateY(-5px) perspective(600px) rotateY(-10deg);
          box-shadow: 
            inset 4px 0 10px rgba(0, 0, 0, 0.15),
            inset -1px 0 2px rgba(255, 255, 255, 0.4),
            12px 12px 20px rgba(0, 0, 0, 0.3),
            -2px 0 0 rgba(220, 220, 220, 1);
        }
      `}</style>
      
      <Layout style={{ minHeight: '100vh' }}>
        {/* Bagian Header App */}
        {!viewingContent && (
          <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', position: 'sticky', top: 0, zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => window.location.hash = '#/'}>
              <img src={LOGO_PLACEHOLDER} alt="Elkapede Digital" style={{ height: 40, objectFit: 'contain' }} loading="lazy" />
            </div>
            <div>
              {user ? (
                <Space>
                  <Button type="text" onClick={() => window.location.hash = '#/admin'} icon={<DashboardOutlined />}>Dashboard Admin</Button>
                  <Button danger type="text" onClick={handleLogout} icon={<LogoutOutlined />}>Keluar</Button>
                </Space>
              ) : (
                // Tombol Login Admin Dihilangkan sesuai permintaan (Akses via URL #/login)
                null
              )}
            </div>
          </Header>
        )}

        {/* Area Konten dengan background doodle */}
        <Content style={{ 
          padding: viewingContent ? '0' : '24px', 
          maxWidth: viewingContent ? '100%' : 1200, 
          margin: '0 auto', width: '100%', position: 'relative'
        }}>
          {/* Latar Belakang Doodle */}
          {currentView === 'public' && !viewingContent && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 0, 
              opacity: 0.06, 
              pointerEvents: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke='%2310b981' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20,30 H40 A5,5 0 0 1 45,35 V55 A5,5 0 0 0 40,50 H20 Z' /%3E%3Cpath d='M45,35 A5,5 0 0 1 50,30 H70 V50 H50 A5,5 0 0 0 45,55' /%3E%3Cpath d='M45,35 V55' /%3E%3Cellipse cx='90' cy='30' rx='12' ry='4' transform='rotate(45 90 30)' /%3E%3Cellipse cx='90' cy='30' rx='12' ry='4' transform='rotate(-45 90 30)' /%3E%3Ccircle cx='90' cy='30' r='2' fill='%2310b981' /%3E%3Cpath d='M25,95 L40,80 L45,85 L30,100 Z' /%3E%3Cpath d='M40,80 L45,75 L50,80 L45,85' /%3E%3Cpath d='M25,95 L20,100 L25,100 Z' fill='%2310b981' /%3E%3Cpath d='M70,85 L90,75 L110,85 L90,95 Z' /%3E%3Cpath d='M75,88 V98 C75,102 105,102 105,98 V88' /%3E%3Cpath d='M50,15 L52,20 L57,22 L52,24 L50,29 L48,24 L43,22 L48,20 Z' fill='%2310b981' /%3E%3Ccircle cx='15' cy='70' r='1.5' fill='%2310b981' /%3E%3Ccircle cx='80' cy='50' r='2' fill='%2310b981' /%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '120px 120px',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat',
              backgroundAttachment: 'fixed'
            }}></div>
          )}

          <div style={{ position: 'relative', zIndex: 1, height: viewingContent ? '100%' : 'auto' }}>
            {currentView === 'public' && (
              <PublicView 
                banners={banners} classes={classes} subjects={subjects} contents={contents}
                selectedClass={selectedClass} selectedSubject={selectedSubject} viewingContent={viewingContent}
                isLoading={isDataLoading}
              />
            )}
            {currentView === 'admin_login' && <AdminLogin />}
            {currentView === 'admin_dashboard' && <AdminDashboard banners={banners} classes={classes} subjects={subjects} contents={contents} />}
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

// ============================================================================
// 3. KOMPONEN PUBLIC VIEW (PENGGUNA UMUM)
// ============================================================================

function PublicView({ banners, classes, subjects, contents, selectedClass, selectedSubject, viewingContent, isLoading }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // State untuk Password Pegangan Guru
  const [isTeacherModalVisible, setIsTeacherModalVisible] = useState(false);
  const [teacherPassword, setTeacherPassword] = useState('');
  const [pendingTeacherEbookId, setPendingTeacherEbookId] = useState(null);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Fungsi Menangani Klik Buku Pegangan Guru
  const handleTeacherPdfClick = (id) => {
    setPendingTeacherEbookId(id);
    setIsTeacherModalVisible(true);
  };

  // Fungsi Verifikasi Password Pegangan Guru
  const handleTeacherPasswordSubmit = () => {
    if (teacherPassword === 'gubukpustaka') {
      setIsTeacherModalVisible(false);
      setTeacherPassword('');
      window.location.hash = '#/content/' + pendingTeacherEbookId;
    } else {
      message.error('Password salah! Silakan hubungi CS Admin.');
    }
  };

  // Fungsi Menghubungi Admin CS via WhatsApp
  const handleWhatsAppCS = () => {
    const defaultMessage = "Halo Admin, saya adalah Guru dan ingin meminta password untuk membuka buku Pegangan Guru / Kunci Jawaban di Elkapede Digital.";
    const waUrl = `https://wa.me/6285601721370?text=${encodeURIComponent(defaultMessage)}`;
    window.open(waUrl, '_blank');
  };

  // 1. TAMPILAN THEATER MODE (VIDEO & PDF VIEWER)
  if (viewingContent) {
    const handleClose = () => window.location.hash = '#/subject/' + (selectedSubject ? selectedSubject.id : viewingContent.subjectId);

    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(err));
      } else {
        document.exitFullscreen();
      }
    };

    let finalUrl = viewingContent.url;
    if (viewingContent.type === 'pdf' || viewingContent.type === 'teacher_pdf') {
       finalUrl = getGoogleDrivePreviewUrl(viewingContent.url);
    }

    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
        <div style={{ background: '#020617', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b' }}>
          <Space size="middle" style={{ color: '#fff' }}>
             <Button type="text" style={{ color: '#94a3b8' }} icon={<ArrowLeftOutlined />} onClick={handleClose} />
             {viewingContent.type === 'video' ? <VideoCameraOutlined style={{ color: '#ef4444', fontSize: 20 }} /> : <ReadOutlined style={{ color: '#10b981', fontSize: 20 }} />}
             <Title level={5} style={{ margin: 0, color: '#fff' }} ellipsis>{viewingContent.title}</Title>
          </Space>
          <Space>
             <Button type="text" style={{ color: '#94a3b8' }} icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} onClick={toggleFullscreen} />
             <Button type="text" danger icon={<CloseOutlined />} onClick={handleClose} />
          </Space>
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          {viewingContent.type === 'video' ? (
            <iframe 
              style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', top: 0, left: 0 }}
              src={`https://www.youtube.com/embed/${getYouTubeID(viewingContent.url)}?autoplay=1`} 
              title={viewingContent.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
              allowFullScreen
              loading="lazy"
            ></iframe>
          ) : (
            <iframe 
              src={finalUrl} 
              style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', top: 0, left: 0, background: '#fff' }}
              title={viewingContent.title}
              allowFullScreen
              loading="lazy"
            ></iframe>
          )}
        </div>
      </div>
    );
  }

  // 2. TAMPILAN MATERI (BUKU, VIDEO & SOAL LATIHAN)
  if (selectedSubject) {
    const subjectContents = contents.filter(c => c.subjectId === selectedSubject.id);
    const pdfs = subjectContents.filter(c => c.type === 'pdf');
    const teacherPdfs = subjectContents.filter(c => c.type === 'teacher_pdf');
    const videos = subjectContents.filter(c => c.type === 'video');
    const quizzes = subjectContents.filter(c => c.type === 'quiz');

    const mainEbook = pdfs.length > 0 ? pdfs[0] : null;
    const teacherEbook = teacherPdfs.length > 0 ? teacherPdfs[0] : null;

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            shape="circle" 
            onClick={() => window.location.hash = '#/class/' + (selectedClass?.id || '')}
            style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          />
          <Breadcrumb 
            items={[
              { title: <span onClick={() => window.location.hash = '#/'} style={{ cursor: 'pointer' }}>Beranda</span> },
              { title: <span onClick={() => window.location.hash = '#/class/' + (selectedClass?.id || '')} style={{ cursor: 'pointer' }}>Kelas {selectedClass?.name || ''}</span> },
              { title: selectedSubject?.name || '' }
            ]}
          />
        </div>

        <Card style={{ marginBottom: 24 }}>
          <Card.Meta 
            avatar={
              <img 
                src={getValidImageUrl(selectedSubject)} 
                alt={selectedSubject?.name || ''} 
                className="book-3d"
                style={{ width: 80 }} 
                loading="lazy"
              />
            }
            title={<Title level={3} style={{ margin: 0 }}>{selectedSubject?.name || ''}</Title>}
            description={
              <Space style={{ marginTop: 8 }} wrap>
                <Tag color="red">{videos.length} Video</Tag>
                <Tag color="blue">{quizzes.length} Latihan Soal</Tag>
                {mainEbook && <Tag color="green">Buku Digital Tersedia</Tag>}
                {teacherEbook && <Tag color="orange">Pegangan Guru</Tag>}
              </Space>
            }
          />
        </Card>

        {/* Tampilan Buku Digital & Pegangan Guru */}
        {(mainEbook || teacherEbook) && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {mainEbook && (
              <Col xs={24} md={teacherEbook ? 12 : 24}>
                <Card 
                  hoverable 
                  onClick={() => window.location.hash = '#/content/' + mainEbook.id}
                  style={{ backgroundColor: selectedSubject.themeColor || '#10b981', border: 'none', height: '100%' }}
                  bodyStyle={{ padding: '16px 20px', height: '100%', display: 'flex', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <ReadOutlined style={{ fontSize: 36, color: 'white', opacity: 0.9 }} />
                    <div>
                      <Title level={4} style={{ color: 'white', margin: 0 }}>Buku Digital: {mainEbook.title}</Title>
                      <Text style={{ color: '#d1fae5', fontSize: 13 }}>Klik di sini untuk membaca modul pembelajaran</Text>
                    </div>
                  </div>
                </Card>
              </Col>
            )}

            {teacherEbook && (
              <Col xs={24} md={mainEbook ? 12 : 24}>
                <Card 
                  hoverable 
                  onClick={() => handleTeacherPdfClick(teacherEbook.id)}
                  style={{ backgroundColor: '#f59e0b', border: 'none', height: '100%' }}
                  bodyStyle={{ padding: '16px 20px', height: '100%', display: 'flex', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <SolutionOutlined style={{ fontSize: 36, color: 'white', opacity: 0.9 }} />
                    <div>
                      <Title level={4} style={{ color: 'white', margin: 0 }}>Pegangan Guru: {teacherEbook.title}</Title>
                      <Text style={{ color: '#fef3c7', fontSize: 13 }}>Klik di sini untuk membaca buku panduan/kunci jawaban</Text>
                    </div>
                  </div>
                </Card>
              </Col>
            )}
          </Row>
        )}

        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card title={<><PlayCircleOutlined style={{ color: '#ef4444', marginRight: 8 }} /> Daftar Video Pembelajaran</>} bordered={false}>
               <List 
                  itemLayout="horizontal"
                  dataSource={videos}
                  pagination={{ pageSize: 4, size: 'small' }} 
                  locale={{ emptyText: 'Belum ada video' }}
                  renderItem={(item, index) => (
                    <List.Item onClick={() => window.location.hash = '#/content/' + item.id} style={{ cursor: 'pointer', transition: 'background 0.3s' }} className="hover-list-item">
                      <List.Item.Meta 
                         avatar={<Avatar style={{ backgroundColor: '#fee2e2', color: '#ef4444', fontWeight: 'bold' }}>{index + 1}</Avatar>}
                         title={item.title}
                         description={<Text type="secondary"><VideoCameraOutlined /> Tonton Video</Text>}
                      />
                    </List.Item>
                  )}
               />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title={<><FormOutlined style={{ color: '#3b82f6', marginRight: 8 }} /> Daftar Latihan Soal</>} bordered={false}>
               <List 
                  itemLayout="horizontal"
                  dataSource={quizzes}
                  pagination={{ pageSize: 4, size: 'small' }} 
                  locale={{ emptyText: 'Belum ada latihan soal' }}
                  renderItem={(item, index) => (
                    <List.Item onClick={() => window.open(item.url, '_blank')} style={{ cursor: 'pointer', transition: 'background 0.3s' }} className="hover-list-item">
                      <List.Item.Meta 
                         avatar={<Avatar style={{ backgroundColor: '#eff6ff', color: '#3b82f6', fontWeight: 'bold' }}>{index + 1}</Avatar>}
                         title={item.title}
                         description={<Text type="secondary"><LinkOutlined /> Buka Latihan</Text>}
                      />
                    </List.Item>
                  )}
               />
            </Card>
          </Col>
        </Row>

        {/* Modal Konfirmasi Password untuk Pegangan Guru dipindah ke SINI agar termuat saat membuka Mapel */}
        <Modal
          title={<><LockOutlined style={{ color: '#f59e0b', marginRight: 8 }} /> Akses Terbatas Khusus Guru</>}
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
              Buku ini berisi panduan dan kunci jawaban yang dikhususkan untuk Guru. Silakan masukkan password untuk membuka dokumen ini.
            </Text>
          </div>
          
          <Form layout="vertical" onFinish={handleTeacherPasswordSubmit}>
            <Form.Item label="Password Akses" required>
              <Input.Password 
                size="large" 
                placeholder="Masukkan password..." 
                value={teacherPassword}
                onChange={(e) => setTeacherPassword(e.target.value)}
                prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
              />
            </Form.Item>
            
            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" block style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}>
                Buka Pegangan Guru
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>Tidak tau atau lupa password?</Text>
            <Button 
              type="default" 
              icon={<WhatsAppOutlined />} 
              onClick={handleWhatsAppCS}
              style={{ color: '#16a34a', borderColor: '#16a34a' }}
            >
              Tanya CS Admin (WhatsApp)
            </Button>
          </div>
        </Modal>

      </div>
    );
  }

  // 3. TAMPILAN DAFTAR MAPEL
  if (selectedClass) {
    const classSubjects = subjects.filter(s => s.classId === selectedClass.id);
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            shape="circle" 
            onClick={() => window.location.hash = '#/'}
            style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          />
          <Breadcrumb 
            items={[
              { title: <span onClick={() => window.location.hash = '#/'} style={{ cursor: 'pointer' }}>Beranda</span> },
              { title: `Kelas ${selectedClass?.name || ''}` }
            ]}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>Kelas {selectedClass.name}</Title>
          <Text type="secondary">Pilih mata pelajaran di bawah ini.</Text>
        </div>

        {classSubjects.length > 0 ? (
          <Row gutter={[24, 24]}>
            {classSubjects.map(subject => {
              const sContents = contents.filter(c => c.subjectId === subject.id);
              const pdfCount = sContents.filter(c => c.type === 'pdf').length;
              const videoCount = sContents.filter(c => c.type === 'video').length;
              const quizCount = sContents.filter(c => c.type === 'quiz').length;

              return (
                <Col xs={12} sm={8} md={6} key={subject.id}>
                  <Card 
                    hoverable 
                    style={{ textAlign: 'center', height: '100%', borderTop: `4px solid ${subject.themeColor || '#10b981'}` }}
                    bodyStyle={{ padding: '24px 16px' }}
                    onClick={() => window.location.hash = '#/subject/' + subject.id}
                  >
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                      <img 
                        src={getValidImageUrl(subject)} 
                        alt={subject?.name || ''} 
                        className="book-3d book-3d-hover"
                        style={{ width: 100 }} 
                        loading="lazy"
                      />
                    </div>
                    <Title level={5} style={{ marginBottom: 16 }}>{subject.name}</Title>
                    
                    {/* Tampilan indikator ikon disederhanakan tanpa angka */}
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', color: '#64748b', fontSize: 16 }}>
                      {videoCount > 0 && <span title="Video Tersedia"><VideoCameraOutlined style={{ color: '#ef4444' }} /></span>}
                      {quizCount > 0 && <span title="Latihan Soal Tersedia"><FormOutlined style={{ color: '#3b82f6' }} /></span>}
                      {pdfCount > 0 && <span title="Buku Digital Tersedia"><ReadOutlined style={{ color: '#10b981' }} /></span>}
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : (
          <Card style={{ textAlign: 'center', padding: '40px 0' }}>
            <AppstoreOutlined style={{ fontSize: 48, color: '#cbd5e1', marginBottom: 16 }} />
            <br />
            <Text type="secondary">Belum ada mata pelajaran untuk kelas ini.</Text>
          </Card>
        )}
      </div>
    );
  }

  // 4. TAMPILAN BERANDA (BANNERS & KELAS)
  return (
    <div>
      {/* Banners */}
      {isLoading ? (
         <Card loading style={{ height: 300, marginBottom: 40 }} />
      ) : banners.length > 0 ? (
        <Carousel autoplay effect="fade" arrows={true} style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 40 }}>
          {banners.map((banner, index) => (
            <div key={banner.id} onClick={() => banner.linkUrl && window.open(banner.linkUrl, '_blank')} style={{ cursor: banner.linkUrl ? 'pointer' : 'default' }}>
              <div className="banner-container" style={{ backgroundImage: `url(${getValidImageUrl(banner)})` }}>
                {banner.linkUrl && (
                  <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: 20, color: 'white' }}>
                    <Text style={{ color: 'white' }}>Klik untuk membuka <LinkOutlined style={{ fontSize: 14 }} /></Text>
                  </div>
                )}
                {/* Custom Carousel Arrows */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  <button onClick={(e) => { e.stopPropagation(); setCurrentBannerIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1)); }} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 20, background: 'rgba(255,255,255,0.3)', border: 'none', padding: 8, borderRadius: '50%', color: 'white', pointerEvents: 'auto', cursor: 'pointer', backdropFilter: 'blur(4px)' }}><LeftOutlined style={{ fontSize: 24 }} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setCurrentBannerIndex((prev) => (prev + 1) % banners.length); }} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 20, background: 'rgba(255,255,255,0.3)', border: 'none', padding: 8, borderRadius: '50%', color: 'white', pointerEvents: 'auto', cursor: 'pointer', backdropFilter: 'blur(4px)' }}><RightOutlined style={{ fontSize: 24 }} /></button>
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      ) : null}

      {/* Banner Portal Tryout CTA */}
      <Card 
        hoverable
        style={{ marginBottom: 40, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none' }}
        bodyStyle={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}
        onClick={() => window.open('https://elkapede.web.app/', '_blank')}
      >
        <div>
          <Title level={3} style={{ color: 'white', margin: 0 }}>Portal Tryout Elkapede</Title>
          <Text style={{ color: '#d1fae5', fontSize: 16 }}>Akses platform ujian dan tryout khusus untuk Guru dan Siswa.</Text>
        </div>
        <Button icon={<RocketOutlined />} type="primary" size="large" style={{ backgroundColor: 'white', color: '#059669', fontWeight: 'bold', border: 'none' }}>
          Buka Portal Tryout
        </Button>
      </Card>

      {/* Daftar Kelas */}
      <Space style={{ marginBottom: 24 }}>
        <AppstoreOutlined style={{ fontSize: 28, color: '#10b981' }} />
        <Title level={3} style={{ margin: 0 }}>Pilih Kelas</Title>
      </Space>

      {isLoading ? (
        <Row gutter={[24, 24]}>
          {[1,2,3].map(i => <Col xs={24} md={8} key={i}><Card loading /></Col>)}
        </Row>
      ) : classes.length > 0 ? (
        <Row gutter={[24, 24]}>
          {classes.map(cls => (
            <Col xs={24} md={8} key={cls.id}>
              <Card 
                hoverable
                onClick={() => window.location.hash = '#/class/' + cls.id}
                style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}
                bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, position: 'relative', zIndex: 1 }}
              >
                {/* Latar Belakang Gambar Siluet Kelas */}
                <div style={{
                    position: 'absolute', 
                    inset: 0, 
                    backgroundImage: `url(${getValidImageUrl(cls)})`, 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center',
                    opacity: 0.1, 
                    filter: 'grayscale(100%)',
                    zIndex: -1
                }} />

                <div style={{ marginBottom: 16 }}>
                   <Title level={3} style={{ margin: 0, color: '#10b981' }}>Kelas {cls.name}</Title>
                </div>
                <Paragraph ellipsis={{ rows: 2 }} type="secondary" style={{ flex: 1 }}>{cls.description}</Paragraph>
                <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <Text type="secondary"><BookOutlined /> {subjects.filter(s => s.classId === cls.id).length} Mapel</Text>
                   <Button type="primary" shape="circle" icon={<ArrowLeftOutlined style={{ transform: 'rotate(180deg)' }} />} />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="secondary">Belum ada kelas yang ditambahkan.</Text>
        </Card>
      )}

    </div>
  );
}

// ============================================================================
// 4. KOMPONEN LOGIN ADMIN
// ============================================================================

function AdminLogin() {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      message.success("Berhasil login!");
    } catch (err) {
      message.error('Gagal login: Periksa kembali email dan kata sandi Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '60px auto 0' }}>
      <Card bordered={false} style={{ boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Avatar size={64} style={{ backgroundColor: '#d1fae5', color: '#10b981', marginBottom: 16 }} icon={<LoginOutlined />} />
          <Title level={3}>Login Administrator</Title>
          <Text type="secondary">Kelola kelas dan materi Elkapede Digital.</Text>
        </div>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Email Firebase" name="email" rules={[{ required: true, message: 'Masukkan email!' }]}>
            <Input size="large" placeholder="admin@example.com" />
          </Form.Item>
          <Form.Item label="Kata Sandi" name="password" rules={[{ required: true, message: 'Masukkan kata sandi!' }]}>
            <Input.Password size="large" placeholder="••••••••" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              Masuk Dashboard
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

// ============================================================================
// 5. KOMPONEN DASHBOARD ADMIN (CMS)
// ============================================================================

function AdminDashboard({ banners, classes, subjects, contents }) {
  const [activeTab, setActiveTab] = useState('classes'); 
  const [managingClass, setManagingClass] = useState(null);
  const [managingSubject, setManagingSubject] = useState(null);

  // Form Instances
  const [formClass] = Form.useForm();
  const [formBanner] = Form.useForm();
  const [formSubject] = Form.useForm();
  const [formContent] = Form.useForm();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState(''); 
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Handler Umum
  const handleSave = async (path, payload, id) => {
    try {
      if (id) {
        await update(ref(db, `${path}/${id}`), payload);
        message.success('Data berhasil diperbarui');
      } else {
        await push(ref(db, path), payload);
        message.success('Data berhasil ditambahkan');
      }
      setIsModalVisible(false);
    } catch (err) {
      message.error('Gagal menyimpan data: ' + err.message);
    }
  };

  const handleDelete = async (path, id) => {
    try {
      await remove(ref(db, `${path}/${id}`));
      message.success('Data berhasil dihapus');
    } catch (err) {
      message.error('Gagal menghapus data');
    }
  };

  // Logika Membuka Modal
  const openModal = (type, record = null) => {
    setModalType(type);
    setEditingId(record ? record.id : null);

    if (type === 'class') {
       if (record) formClass.setFieldsValue(record); else formClass.resetFields();
    } else if (type === 'banner') {
       if (record) formBanner.setFieldsValue(record); else formBanner.resetFields();
    } else if (type === 'subject') {
       if (record) formSubject.setFieldsValue(record); else formSubject.setFieldsValue({ themeColor: '#10b981' });
    } else if (type === 'content') {
       if (record) {
           formContent.setFieldsValue(record);
       } else {
           formContent.resetFields();
           const hasPdf = contents.some(c => c.subjectId === managingSubject?.id && c.type === 'pdf');
           formContent.setFieldsValue({ type: hasPdf ? 'video' : 'pdf' });
       }
    }
    setIsModalVisible(true);
  };

  // Logika Mengirim Data
  const onFinishModal = async (values) => {
    setSubmitting(true);
    
    try {
      const payload = { ...values };

      // Konversi link Google Drive menjadi Direct Link khusus untuk Input Gambar
      if (payload.imageUrl) {
        payload.imageUrl = getGoogleDriveDirectImageUrl(payload.imageUrl);
      }

      if (modalType === 'class') await handleSave('classes', payload, editingId);
      else if (modalType === 'banner') await handleSave('banners', payload, editingId);
      else if (modalType === 'subject') await handleSave('subjects', { ...payload, classId: managingClass.id }, editingId);
      else if (modalType === 'content') await handleSave('contents', { ...payload, subjectId: managingSubject.id }, editingId);
    } catch (error) {
      message.error({ content: 'Gagal menyimpan: ' + error.message, duration: 3 });
    } finally {
      setSubmitting(false);
    }
  };

  // RENDER: MENGATUR MATERI (Tingkat 3)
  if (managingSubject) {
    const subjectContents = contents.filter(c => c.subjectId === managingSubject.id);
    const columns = [
      { title: 'Tipe', dataIndex: 'type', render: t => t === 'pdf' ? <Badge status="success" text="Buku PDF" /> : t === 'teacher_pdf' ? <Badge status="warning" text="Pegangan Guru" /> : t === 'video' ? <Badge status="error" text="Video" /> : <Badge status="processing" text="Soal" /> },
      { title: 'Judul', dataIndex: 'title' },
      { title: 'URL Target', dataIndex: 'url', render: url => <Text ellipsis style={{ maxWidth: 200 }}>{url}</Text> },
      { title: 'Aksi', render: (_, record) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => openModal('content', record)} />
            <Popconfirm title="Hapus materi ini?" onConfirm={() => handleDelete('contents', record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        )
      }
    ];

    const existingPdf = subjectContents.find(c => c.type === 'pdf');
    const isPdfDisabled = existingPdf && editingId !== existingPdf?.id;

    const existingTeacherPdf = subjectContents.find(c => c.type === 'teacher_pdf');
    const isTeacherPdfDisabled = existingTeacherPdf && editingId !== existingTeacherPdf?.id;

    return (
      <Card title={<><Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setManagingSubject(null)} /> Materi Mapel: {managingSubject.name}</>} extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('content')}>Tambah Materi</Button>}>
         <Table dataSource={subjectContents} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} scroll={{ x: 600 }} />
         
         <Modal title={editingId ? "Edit Materi" : "Tambah Materi"} open={isModalVisible && modalType === 'content'} onCancel={() => setIsModalVisible(false)} footer={null}>
           <Form form={formContent} layout="vertical" onFinish={onFinishModal}>
             
             <Form.Item name="type" label="Tipe Materi" rules={[{ required: true, message: 'Pilih tipe materi' }]}>
               <Radio.Group buttonStyle="solid" style={{ display: 'flex', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
                  <Radio.Button value="pdf" disabled={isPdfDisabled} style={{ flex: '1 1 45%', textAlign: 'center' }}>
                    <ReadOutlined/> Buku (1 PDF)
                  </Radio.Button>
                  <Radio.Button value="teacher_pdf" disabled={isTeacherPdfDisabled} style={{ flex: '1 1 45%', textAlign: 'center' }}>
                    <SolutionOutlined/> Pegangan Guru
                  </Radio.Button>
                  <Radio.Button value="video" style={{ flex: '1 1 45%', textAlign: 'center' }}>
                    <VideoCameraOutlined/> Video
                  </Radio.Button>
                  <Radio.Button value="quiz" style={{ flex: '1 1 45%', textAlign: 'center' }}>
                    <FormOutlined/> Soal
                  </Radio.Button>
               </Radio.Group>
             </Form.Item>

             <Form.Item name="title" label="Judul Materi" rules={[{ required: true, message: 'Judul wajib diisi' }]}><Input /></Form.Item>
             
             {/* BUG FIX: Memanfaatkan shouldUpdate bawaan Ant Design untuk render Input Field yang dinamis tanpa useWatch */}
             <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}>
               {({ getFieldValue }) => {
                 const type = getFieldValue('type');
                 
                 if (type === 'pdf' || type === 'teacher_pdf') {
                   return (
                     <Form.Item name="url" label={`URL Link Google Drive ${type === 'pdf' ? 'Buku (PDF)' : 'Pegangan Guru (PDF)'}`} rules={[{ required: true, message: 'URL Google Drive wajib diisi!' }]}>
                        <Input placeholder="https://drive.google.com/file/d/.../view" />
                     </Form.Item>
                   );
                 }
                 if (type === 'video') {
                   return (
                     <Form.Item name="url" label="URL YouTube" rules={[{ required: true, message: 'URL YouTube wajib diisi' }]}>
                        <Input placeholder="https://youtube.com/watch?v=..." />
                     </Form.Item>
                   );
                 }
                 if (type === 'quiz') {
                   return (
                     <Form.Item name="url" label="URL Link Latihan Soal (Google Form, Quizizz, dll)" rules={[{ required: true, message: 'URL Latihan Soal wajib diisi' }]}>
                        <Input placeholder="https://forms.gle/..." />
                     </Form.Item>
                   );
                 }
                 return null;
               }}
             </Form.Item>
             
             <Form.Item><Button type="primary" htmlType="submit" loading={submitting} block>Simpan Materi</Button></Form.Item>
           </Form>
         </Modal>
      </Card>
    );
  }

  // RENDER: MENGATUR MAPEL (Tingkat 2)
  if (managingClass) {
    const classSubjects = subjects.filter(s => s.classId === managingClass.id);
    const columns = [
      { title: 'Cover Buku', render: (_, r) => <img src={getValidImageUrl(r)} alt={r?.name || ''} className="book-3d" style={{ width: 40 }} loading="lazy" /> },
      { title: 'Nama Mapel', dataIndex: 'name' },
      { title: 'Aksi', render: (_, record) => (
          <Space>
            <Button size="small" type="primary" ghost onClick={() => setManagingSubject(record)}>Kelola Materi</Button>
            <Button size="small" icon={<EditOutlined />} onClick={() => openModal('subject', record)} />
            <Popconfirm title="Hapus mapel?" onConfirm={() => handleDelete('subjects', record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        )
      }
    ];

    return (
      <Card title={<><Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setManagingClass(null)} /> Mapel Kelas {managingClass.name}</>} extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('subject')}>Tambah Mapel</Button>}>
         <Table dataSource={classSubjects} columns={columns} rowKey="id" pagination={{ pageSize: 8 }} scroll={{ x: 600 }} />
         
         <Modal title={editingId ? "Edit Mapel" : "Tambah Mapel"} open={isModalVisible && modalType === 'subject'} onCancel={() => setIsModalVisible(false)} footer={null}>
           <Form form={formSubject} layout="vertical" onFinish={onFinishModal}>
             <Form.Item name="name" label="Nama Mata Pelajaran" rules={[{ required: true }]}><Input /></Form.Item>
             <Form.Item name="themeColor" label="Warna Tema Mapel">
                <Input type="color" style={{ width: '100%', height: 40, padding: 4 }} />
             </Form.Item>
             <Form.Item name="imageUrl" label="URL Gambar Ikon/Cover (Google Drive)">
                <Input placeholder="https://drive.google.com/file/d/.../view" />
             </Form.Item>
             <Form.Item noStyle shouldUpdate={(prev, cur) => prev.imageUrl !== cur.imageUrl}>
                {() => {
                  const imgUrl = formSubject.getFieldValue('imageUrl');
                  if (!imgUrl) return null;
                  return (
                    <div className="mt-2 flex justify-center" style={{ display: 'flex', justifyContent: 'center' }}>
                       <img src={getGoogleDriveDirectImageUrl(imgUrl)} alt="Preview" className="book-3d" style={{ width: 80, marginBottom: 16 }} loading="lazy" />
                    </div>
                  );
                }}
             </Form.Item>
             <Form.Item><Button type="primary" htmlType="submit" loading={submitting} block>Simpan Mapel</Button></Form.Item>
           </Form>
         </Modal>
      </Card>
    );
  }

  // RENDER: DASHBOARD (Tingkat 1)
  return (
    <Card bordered={false} bodyStyle={{ padding: 0 }}>
      <div style={{ background: '#0f172a', color: 'white', padding: '32px 32px 0 32px', borderRadius: '16px 16px 0 0' }}>
         <Title level={2} style={{ color: 'white', margin: 0 }}>CMS Administrator</Title>
         <Text style={{ color: '#94a3b8' }}>Kelola konten Elkapede Digital Anda.</Text>
         <Tabs 
           activeKey={activeTab} onChange={setActiveTab} style={{ marginTop: 24 }} tabBarStyle={{ marginBottom: 0, borderBottom: 'none' }}
           items={[
             { key: 'classes', label: <span style={{ color: activeTab === 'classes' ? '#10b981' : 'white' }}>Manajemen Kelas</span> },
             { key: 'banners', label: <span style={{ color: activeTab === 'banners' ? '#10b981' : 'white' }}>Slider Banner</span> }
           ]}
         />
      </div>

      <div style={{ padding: '24px 16px' }}>
        {activeTab === 'classes' && (
          <div>
             <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('class')}>Tambah Kelas Baru</Button>
             </div>
             <Table 
               dataSource={classes} rowKey="id" pagination={{ pageSize: 8 }} scroll={{ x: 700 }}
               columns={[
                 { title: 'Nama Kelas', dataIndex: 'name', width: '25%', render: t => `Kelas ${t}` },
                 { title: 'Keterangan', dataIndex: 'description' },
                 { title: 'Aksi', render: (_, r) => (
                    <Space>
                      <Button size="small" type="primary" ghost onClick={() => setManagingClass(r)}>Buka Mapel</Button>
                      <Button size="small" icon={<EditOutlined />} onClick={() => openModal('class', r)} />
                      <Popconfirm title="Hapus kelas?" onConfirm={() => handleDelete('classes', r.id)}>
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                 )}
               ]}
             />
          </div>
        )}

        {activeTab === 'banners' && (
          <div>
             <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('banner')}>Tambah Banner</Button>
             </div>
             <Table 
               dataSource={banners} rowKey="id" pagination={{ pageSize: 8 }} scroll={{ x: 700 }}
               columns={[
                 { title: 'Preview', render: (_, r) => <img src={getValidImageUrl(r)} alt="Banner" style={{ width: 120, height: 60, objectFit: 'cover', borderRadius: 4 }} loading="lazy" /> },
                 { title: 'Link Target', dataIndex: 'linkUrl', render: text => text || '-' },
                 { title: 'Aksi', render: (_, r) => (
                    <Space>
                      <Button size="small" icon={<EditOutlined />} onClick={() => openModal('banner', r)} />
                      <Popconfirm title="Hapus banner?" onConfirm={() => handleDelete('banners', r.id)}>
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                 )}
               ]}
             />
          </div>
        )}
      </div>

      {/* MODALS ADMIN */}
      <Modal title={editingId ? "Edit Kelas" : "Tambah Kelas"} open={isModalVisible && modalType === 'class'} onCancel={() => setIsModalVisible(false)} footer={null}>
        <Form form={formClass} layout="vertical" onFinish={onFinishModal}>
          <Form.Item name="name" label="Nama Kelas (Contoh: 1, 2, 3)" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Keterangan"><TextArea rows={3} /></Form.Item>
          <Form.Item name="imageUrl" label="URL Gambar Cover (Google Drive)">
             <Input placeholder="https://drive.google.com/file/d/.../view" />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.imageUrl !== cur.imageUrl}>
             {() => {
                const imgUrl = formClass.getFieldValue('imageUrl');
                if (!imgUrl) return null;
                return (
                  <div className="mt-2 flex justify-center" style={{ display: 'flex', justifyContent: 'center' }}>
                     <img src={getGoogleDriveDirectImageUrl(imgUrl)} alt="Preview" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }} loading="lazy" />
                  </div>
                );
             }}
          </Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" loading={submitting} block>Simpan Kelas</Button></Form.Item>
        </Form>
      </Modal>

      <Modal title={editingId ? "Edit Banner" : "Tambah Banner"} open={isModalVisible && modalType === 'banner'} onCancel={() => setIsModalVisible(false)} footer={null}>
        <Form form={formBanner} layout="vertical" onFinish={onFinishModal}>
          <Form.Item name="imageUrl" label="URL Gambar Banner (Google Drive)" rules={[{ required: true, message: 'URL Banner wajib diisi!' }]}>
             <Input placeholder="https://drive.google.com/file/d/.../view" />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.imageUrl !== cur.imageUrl}>
             {() => {
                const imgUrl = formBanner.getFieldValue('imageUrl');
                if (!imgUrl) return null;
                return (
                  <div className="mt-2 flex justify-center" style={{ display: 'flex', justifyContent: 'center' }}>
                     <img src={getGoogleDriveDirectImageUrl(imgUrl)} alt="Preview" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }} loading="lazy" />
                  </div>
                );
             }}
          </Form.Item>
          <Form.Item name="linkUrl" label="URL Target Saat Diklik (Opsional)"><Input placeholder="https://..." /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" loading={submitting} block>Simpan Banner</Button></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}