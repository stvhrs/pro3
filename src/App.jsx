import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getDatabase, ref, onValue, push, remove, update } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

// Import Ant Design Components
import { 
  ConfigProvider, Layout, Typography, Button, Spin, Card, 
  Row, Col, Carousel, Space, Badge, List, Avatar, Breadcrumb, 
  Form, Input, message, Tabs, Table, Modal, Upload, Popconfirm
} from 'antd';

// Import Ant Design Icons
import { 
  BookOutlined, VideoCameraOutlined, FilePdfOutlined, 
  LoginOutlined, LogoutOutlined, ArrowLeftOutlined,
  PlayCircleOutlined, DashboardOutlined, PlusOutlined,
  EditOutlined, DeleteOutlined, UploadOutlined,
  AppstoreOutlined, FullscreenOutlined, FullscreenExitOutlined,
  CloseOutlined, LinkOutlined, FormOutlined, ReadOutlined,
  RocketOutlined
} from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// ============================================================================
// 1. KONFIGURASI FIREBASE & R2 CLOUDFLARE
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
const storage = getStorage(app);

const R2_PUBLIC_DOMAIN = "https://pub-268e4ac098564a4fae1119e480f5a908.r2.dev";
const IMAGE_PLACEHOLDER = "https://via.placeholder.com/400x300?text=No+Image";

// PLACEHOLDER LOGO APP
const LOGO_PLACEHOLDER = "/images/Logo Garuda.png";

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

  // Hash Routing
  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash || '#/');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Auth Listener
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

  // Fetch Data Firebase
  useEffect(() => {
    let bLoaded = false, cLoaded = false, sLoaded = false, cntLoaded = false;
    const checkAll = () => { if (bLoaded && cLoaded && sLoaded && cntLoaded) setIsDataLoading(false); };

    onValue(ref(db, 'banners'), s => { setBanners(s.val() ? Object.keys(s.val()).map(k => ({ id: k, ...s.val()[k] })) : []); bLoaded = true; checkAll(); });
    onValue(ref(db, 'classes'), s => { setClasses(s.val() ? Object.keys(s.val()).map(k => ({ id: k, ...s.val()[k] })) : []); cLoaded = true; checkAll(); });
    onValue(ref(db, 'subjects'), s => { setSubjects(s.val() ? Object.keys(s.val()).map(k => ({ id: k, ...s.val()[k] })) : []); sLoaded = true; checkAll(); });
    onValue(ref(db, 'contents'), s => { setContents(s.val() ? Object.keys(s.val()).map(k => ({ id: k, ...s.val()[k] })) : []); cntLoaded = true; checkAll(); });
  }, []);

  // Routing Derivation
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
    message.success("Berhasil logout");
  };

  // Ant Design Theme Configuration
  const themeConfig = {
    token: {
      colorPrimary: '#10b981', // Emerald 500
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
      {/* Styles Injection */}
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
          aspect-ratio: 1 / 1.414; /* Rasio A4 Cover Buku */
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
        {/* Header App */}
        {!viewingContent && (
          <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', position: 'sticky', top: 0, zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => window.location.hash = '#/'}>
              <img src={LOGO_PLACEHOLDER} alt="Elkapede Digital" style={{ height: 40, objectFit: 'contain' }} />
            </div>
            <div>
              {user ? (
                <Space>
                  <Button type="text" onClick={() => window.location.hash = '#/admin'} icon={<DashboardOutlined />}>Dashboard</Button>
                  <Button danger type="text" onClick={handleLogout} icon={<LogoutOutlined />}>Keluar</Button>
                </Space>
              ) : (
                <Button type="text" onClick={() => window.location.hash = '#/login'} icon={<LoginOutlined />}>Admin Login</Button>
              )}
            </div>
          </Header>
        )}

        {/* Content Area dengan background doodle */}
        <Content style={{ 
          padding: viewingContent ? '0' : '24px', 
          maxWidth: viewingContent ? '100%' : 1200, 
          margin: '0 auto', width: '100%', position: 'relative'
        }}>
          {/* Background Doodle */}
          {currentView === 'public' && !viewingContent && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 0, opacity: 0.06, pointerEvents: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke='%2310b981' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20,30 H40 A5,5 0 0 1 45,35 V55 A5,5 0 0 0 40,50 H20 Z' /%3E%3Cpath d='M45,35 A5,5 0 0 1 50,30 H70 V50 H50 A5,5 0 0 0 45,55' /%3E%3Cpath d='M45,35 V55' /%3E%3Cellipse cx='90' cy='30' rx='12' ry='4' transform='rotate(45 90 30)' /%3E%3Cellipse cx='90' cy='30' rx='12' ry='4' transform='rotate(-45 90 30)' /%3E%3Ccircle cx='90' cy='30' r='2' fill='%2310b981' /%3E%3Cpath d='M25,95 L40,80 L45,85 L30,100 Z' /%3E%3Cpath d='M40,80 L45,75 L50,80 L45,85' /%3E%3Cpath d='M25,95 L20,100 L25,100 Z' fill='%2310b981' /%3E%3Cpath d='M70,85 L90,75 L110,85 L90,95 Z' /%3E%3Cpath d='M75,88 V98 C75,102 105,102 105,98 V88' /%3E%3Cpath d='M50,15 L52,20 L57,22 L52,24 L50,29 L48,24 L43,22 L48,20 Z' fill='%2310b981' /%3E%3Ccircle cx='15' cy='70' r='1.5' fill='%2310b981' /%3E%3Ccircle cx='80' cy='50' r='2' fill='%2310b981' /%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '120px 120px'
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
// 3. KOMPONEN PUBLIC VIEW (USER ANONIM)
// ============================================================================

function PublicView({ banners, classes, subjects, contents, selectedClass, selectedSubject, viewingContent, isLoading }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
    if (viewingContent.type === 'pdf') {
       finalUrl += finalUrl.includes('#') ? '&toolbar=0&navpanes=0' : '#toolbar=0&navpanes=0';
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
            ></iframe>
          ) : (
            <iframe 
              src={finalUrl} 
              style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', top: 0, left: 0, background: '#fff' }}
              title={viewingContent.title}
              allowFullScreen
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
    const videos = subjectContents.filter(c => c.type === 'video');
    const quizzes = subjectContents.filter(c => c.type === 'quiz');

    // 1 Mapel = 1 Buku (ambil PDF pertama jika ada)
    const mainEbook = pdfs.length > 0 ? pdfs[0] : null;

    return (
      <div>
        <Breadcrumb style={{ marginBottom: 24 }}>
          <Breadcrumb.Item onClick={() => window.location.hash = '#/'} style={{ cursor: 'pointer' }}>Beranda</Breadcrumb.Item>
          <Breadcrumb.Item onClick={() => window.location.hash = '#/class/' + (selectedClass?.id || '')} style={{ cursor: 'pointer' }}>
             Kelas {selectedClass ? selectedClass.name : ''}
          </Breadcrumb.Item>
          <Breadcrumb.Item>{selectedSubject.name}</Breadcrumb.Item>
        </Breadcrumb>

        <Card style={{ marginBottom: 24 }}>
          <Card.Meta 
            avatar={
              <img 
                src={getValidImageUrl(selectedSubject)} 
                alt={selectedSubject.name} 
                className="book-3d"
                style={{ width: 80 }} 
              />
            }
            title={<Title level={3} style={{ margin: 0 }}>{selectedSubject.name}</Title>}
            description={
              <Space style={{ marginTop: 8 }} wrap>
                <Badge count={`${videos.length} Video`} style={{ backgroundColor: '#ef4444' }} />
                <Badge count={`${quizzes.length} Latihan Soal`} style={{ backgroundColor: '#3b82f6' }} />
                {mainEbook && <Badge count={`E-Book Tersedia`} style={{ backgroundColor: '#10b981' }} />}
              </Space>
            }
          />
        </Card>

        {/* Tampilan 1 Buku Digital Besar (Jika Ada) */}
        {mainEbook && (
          <Card 
            hoverable 
            onClick={() => window.location.hash = '#/content/' + mainEbook.id}
            style={{ marginBottom: 24, backgroundColor: selectedSubject.themeColor || '#10b981', border: 'none' }}
            bodyStyle={{ padding: '24px 32px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <ReadOutlined style={{ fontSize: 48, color: 'white', opacity: 0.9 }} />
              <div>
                <Title level={3} style={{ color: 'white', margin: 0 }}>Buku Digital: {mainEbook.title}</Title>
                <Text style={{ color: '#d1fae5', fontSize: 16 }}>Klik untuk mulai membaca modul pembelajaran</Text>
              </div>
            </div>
          </Card>
        )}

        {/* Row List Video & List Latihan Soal */}
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card title={<><PlayCircleOutlined style={{ color: '#ef4444', marginRight: 8 }} /> Daftar Video Pembelajaran</>} bordered={false}>
               <List 
                  itemLayout="horizontal"
                  dataSource={videos}
                  locale={{ emptyText: 'Belum ada video ditambahkan' }}
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
      </div>
    );
  }

  // 3. TAMPILAN DAFTAR MAPEL
  if (selectedClass) {
    const classSubjects = subjects.filter(s => s.classId === selectedClass.id);
    return (
      <div>
        <Breadcrumb style={{ marginBottom: 24 }}>
          <Breadcrumb.Item onClick={() => window.location.hash = '#/'} style={{ cursor: 'pointer' }}>Beranda</Breadcrumb.Item>
          <Breadcrumb.Item>Kelas {selectedClass.name}</Breadcrumb.Item>
        </Breadcrumb>

        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>Kelas {selectedClass.name}</Title>
          <Text type="secondary">Pilih mata pelajaran yang tersedia di bawah ini.</Text>
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
                        alt={subject.name} 
                        className="book-3d book-3d-hover"
                        style={{ width: 100 }} 
                      />
                    </div>
                    <Title level={5} style={{ marginBottom: 16 }}>{subject.name}</Title>
                    
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', color: '#64748b', fontSize: 13 }}>
                      <span title="Total Video"><VideoCameraOutlined style={{ color: '#ef4444' }} /> {videoCount}</span>
                      <span title="Latihan Soal"><FormOutlined style={{ color: '#3b82f6' }} /> {quizCount}</span>
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
        <Carousel autoplay effect="fade" style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 40 }}>
          {banners.map(banner => (
            <div key={banner.id} onClick={() => banner.linkUrl && window.open(banner.linkUrl, '_blank')} style={{ cursor: banner.linkUrl ? 'pointer' : 'default' }}>
              <div className="banner-container" style={{ backgroundImage: `url(${getValidImageUrl(banner)})` }}>
                {banner.linkUrl && (
                  <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: 20, color: 'white' }}>
                    <Text style={{ color: 'white' }}>Klik untuk buka <LinkOutlined style={{ fontSize: 14 }} /></Text>
                  </div>
                )}
              </div>
            </div>
          ))}
        </Carousel>
      ) : null}

      {/* Portal Tryout CTA Banner */}
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

      {/* Class List */}
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
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24 }}
              >
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
          <Text type="secondary">Belum ada kelas yang ditambahkan admin.</Text>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// 4. KOMPONEN ADMIN LOGIN
// ============================================================================

function AdminLogin() {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      message.success("Login berhasil!");
    } catch (err) {
      message.error('Gagal login: Periksa email dan password Anda.');
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
          <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Masukkan password!' }]}>
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
// 5. KOMPONEN ADMIN DASHBOARD (CMS)
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
  const [modalType, setModalType] = useState(''); // 'class', 'banner', 'subject', 'content'
  const [editingId, setEditingId] = useState(null);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Generic Handlers
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
      message.success('Data dihapus');
    } catch (err) {
      message.error('Gagal menghapus data');
    }
  };

  // Open Modal Logic
  const openModal = (type, record = null) => {
    setModalType(type);
    setEditingId(record ? record.id : null);
    setFileToUpload(null);

    if (type === 'class') {
       if (record) formClass.setFieldsValue(record); else formClass.resetFields();
    } else if (type === 'banner') {
       if (record) formBanner.setFieldsValue(record); else formBanner.resetFields();
    } else if (type === 'subject') {
       if (record) formSubject.setFieldsValue(record); else formSubject.setFieldsValue({ themeColor: '#10b981' });
    } else if (type === 'content') {
       if (record) formContent.setFieldsValue(record); else formContent.setFieldsValue({ type: 'pdf' });
    }
    setIsModalVisible(true);
  };

  // Submit Logic
  const onFinishModal = async (values) => {
    setSubmitting(true);
    
    try {
      let fileUrl = null;

      if (fileToUpload) {
        message.loading({ content: 'Mengunggah file ke Storage...', key: 'uploadMsg', duration: 0 });
        const fileExt = fileToUpload.name.split('.').pop();
        const fileName = `uploads/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const sRef = storageRef(storage, fileName);
        await uploadBytes(sRef, fileToUpload);
        fileUrl = await getDownloadURL(sRef);
        message.success({ content: 'Unggahan berhasil', key: 'uploadMsg', duration: 2 });
      }

      const payload = { ...values };
      delete payload.upload;
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      // Assign URL if a file was uploaded
      if (fileUrl) {
        if (modalType === 'content') payload.url = fileUrl;
        else payload.imageUrl = fileUrl;
      }

      if (modalType === 'class') await handleSave('classes', payload, editingId);
      else if (modalType === 'banner') await handleSave('banners', payload, editingId);
      else if (modalType === 'subject') await handleSave('subjects', { ...payload, classId: managingClass.id }, editingId);
      else if (modalType === 'content') await handleSave('contents', { ...payload, subjectId: managingSubject.id }, editingId);
    } catch (error) {
      message.error({ content: 'Gagal mengunggah: ' + error.message, key: 'uploadMsg', duration: 3 });
    } finally {
      setSubmitting(false);
    }
  };

  // RENDER: MANAGE CONTENTS (Level 3)
  if (managingSubject) {
    const subjectContents = contents.filter(c => c.subjectId === managingSubject.id);
    const columns = [
      { title: 'Tipe', dataIndex: 'type', render: t => t === 'pdf' ? <Badge status="success" text="Buku PDF" /> : t === 'video' ? <Badge status="error" text="Video" /> : <Badge status="processing" text="Soal" /> },
      { title: 'Judul', dataIndex: 'title' },
      { title: 'URL Target', dataIndex: 'url', render: url => <Text ellipsis style={{ maxWidth: 200 }}>{url}</Text> },
      { title: 'Aksi', render: (_, record) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => openModal('content', record)} />
            <Popconfirm title="Hapus materi?" onConfirm={() => handleDelete('contents', record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        )
      }
    ];

    return (
      <Card title={<><Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setManagingSubject(null)} /> Materi Mapel: {managingSubject.name}</>} extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('content')}>Tambah Materi</Button>}>
         <Table dataSource={subjectContents} columns={columns} rowKey="id" pagination={false} />
         
         <Modal title={editingId ? "Edit Materi" : "Tambah Materi"} open={isModalVisible && modalType === 'content'} onCancel={() => setIsModalVisible(false)} footer={null}>
           <Form form={formContent} layout="vertical" onFinish={onFinishModal}>
             <Form.Item name="type" label="Tipe Materi" rules={[{ required: true }]}>
                <Input.Group compact>
                   <Button type={formContent.getFieldValue('type') === 'pdf' ? 'primary' : 'default'} onClick={() => formContent.setFieldsValue({type: 'pdf'})} style={{ width: '33.33%' }}><ReadOutlined/> E-Book (PDF)</Button>
                   <Button type={formContent.getFieldValue('type') === 'video' ? 'primary' : 'default'} onClick={() => formContent.setFieldsValue({type: 'video'})} style={{ width: '33.33%' }}><VideoCameraOutlined/> Video</Button>
                   <Button type={formContent.getFieldValue('type') === 'quiz' ? 'primary' : 'default'} onClick={() => formContent.setFieldsValue({type: 'quiz'})} style={{ width: '33.33%' }}><FormOutlined/> Soal</Button>
                </Input.Group>
             </Form.Item>
             <Form.Item name="title" label="Judul Materi" rules={[{ required: true }]}><Input /></Form.Item>
             
             {/* Dynamic Field Based on Type */}
             <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
               {() => {
                 const type = formContent.getFieldValue('type');
                 if (type === 'pdf') {
                   return (
                     <Form.Item name="upload" label="Upload File Buku (PDF)">
                        <Upload beforeUpload={(file) => { setFileToUpload(file); return false; }} maxCount={1} accept="application/pdf">
                           <Button icon={<UploadOutlined />}>Pilih File PDF</Button>
                        </Upload>
                     </Form.Item>
                   );
                 } else if (type === 'video') {
                   return (
                     <Form.Item name="url" label="URL YouTube" rules={[{ required: true }]}><Input placeholder="https://youtube.com/watch?v=..." /></Form.Item>
                   );
                 } else {
                   return (
                     <Form.Item name="url" label="URL Link Latihan Soal (Google Form, Quizizz, dll)" rules={[{ required: true }]}><Input placeholder="https://forms.gle/..." /></Form.Item>
                   );
                 }
               }}
             </Form.Item>
             
             <Form.Item><Button type="primary" htmlType="submit" loading={submitting} block>Simpan Materi</Button></Form.Item>
           </Form>
         </Modal>
      </Card>
    );
  }

  // RENDER: MANAGE SUBJECTS (Level 2)
  if (managingClass) {
    const classSubjects = subjects.filter(s => s.classId === managingClass.id);
    const columns = [
      { title: 'Cover Buku', render: (_, r) => <img src={getValidImageUrl(r)} alt={r.name} className="book-3d" style={{ width: 40 }} /> },
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
         <Table dataSource={classSubjects} columns={columns} rowKey="id" pagination={false} />
         
         <Modal title={editingId ? "Edit Mapel" : "Tambah Mapel"} open={isModalVisible && modalType === 'subject'} onCancel={() => setIsModalVisible(false)} footer={null}>
           <Form form={formSubject} layout="vertical" onFinish={onFinishModal}>
             <Form.Item name="name" label="Nama Mata Pelajaran" rules={[{ required: true }]}><Input /></Form.Item>
             <Form.Item name="themeColor" label="Warna Tema Mapel">
                <Input type="color" style={{ width: '100%', height: 40, padding: 4 }} />
             </Form.Item>
             <Form.Item name="upload" label="Upload Ikon/Cover Gambar">
                <Upload beforeUpload={(file) => { setFileToUpload(file); return false; }} maxCount={1} accept="image/*" listType="picture">
                   <Button icon={<UploadOutlined />}>Pilih Gambar</Button>
                </Upload>
             </Form.Item>
             {formSubject.url && !formSubject.file && (
                <div className="mt-2 flex justify-center">
                   <img src={getValidImageUrl(formSubject)} alt="Preview" className="book-3d" style={{ width: 80, marginBottom: 16 }} />
                </div>
             )}
             <Form.Item><Button type="primary" htmlType="submit" loading={submitting} block>Simpan Mapel</Button></Form.Item>
           </Form>
         </Modal>
      </Card>
    );
  }

  // RENDER: DASHBOARD (Level 1)
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

      <div style={{ padding: 32 }}>
        {activeTab === 'classes' && (
          <div>
             <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('class')}>Tambah Kelas Baru</Button>
             </div>
             <Table 
               dataSource={classes} rowKey="id" pagination={false}
               columns={[
                 { title: 'Nama Kelas', dataIndex: 'name', width: '25%', render: t => `Kelas ${t}` },
                 { title: 'Deskripsi', dataIndex: 'description' },
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
               dataSource={banners} rowKey="id" pagination={false}
               columns={[
                 { title: 'Preview', render: (_, r) => <img src={getValidImageUrl(r)} alt="Banner" style={{ width: 120, height: 60, objectFit: 'cover', borderRadius: 4 }} /> },
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
          <Form.Item name="description" label="Deskripsi"><TextArea rows={3} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" loading={submitting} block>Simpan Kelas</Button></Form.Item>
        </Form>
      </Modal>

      <Modal title={editingId ? "Edit Banner" : "Tambah Banner"} open={isModalVisible && modalType === 'banner'} onCancel={() => setIsModalVisible(false)} footer={null}>
        <Form form={formBanner} layout="vertical" onFinish={onFinishModal}>
          <Form.Item name="upload" label="Upload Gambar Banner">
             <Upload beforeUpload={(file) => { setFileToUpload(file); return false; }} maxCount={1} accept="image/*" listType="picture">
                <Button icon={<UploadOutlined />}>Pilih Banner</Button>
             </Upload>
          </Form.Item>
          <Form.Item name="linkUrl" label="URL Target Saat Diklik (Opsional)"><Input placeholder="https://..." /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" loading={submitting} block>Simpan Banner</Button></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}