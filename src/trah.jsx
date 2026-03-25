import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Layout, Typography, Button, Modal, Form, Input, 
  Upload, message, Badge, ConfigProvider, Select, 
  DatePicker, Image, Spin, Radio, Space, Switch
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  UserOutlined, NodeIndexOutlined, AimOutlined, 
  EyeOutlined, ZoomInOutlined, ZoomOutOutlined, LoadingOutlined,
  UnlockOutlined, LockOutlined
} from '@ant-design/icons';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push, update, remove } from "firebase/database";
import dayjs from 'dayjs';

const { Header, Content } = Layout;
const { Title } = Typography;

// ==========================================
// 1. CONFIGURATION (Firebase)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDq1EGOFt1jg3JSlA758m1qlkrtoQ4vReg",
  authDomain: "trahponcoharsoyo.firebaseapp.com",
  databaseURL: "https://trahponcoharsoyo-default-rtdb.firebaseio.com",
  projectId: "trahponcoharsoyo",
  storageBucket: "trahponcoharsoyo.firebasestorage.app",
  messagingSenderId: "728495724027",
  appId: "1:728495724027:web:ffb4ba80257e5687dbe75e",
  measurementId: "G-DM4ECR1JVL"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const R2_BUCKET_NAME = "elkapede";

// ==========================================
// 2. KOMPONEN MODAL (SUPER CEPAT & MODERN UI)
// ==========================================
const MemberEditorModal = React.memo(({ 
  open, onCancel, editParams, members, searchOptions, awsLoaded, signedUrls, onSaveSuccess 
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isAliveForm, setIsAliveForm] = useState(true);
  const [relationType, setRelationType] = useState('root');

  useEffect(() => {
    if (open && editParams) {
      const { member, defaultId, defaultType } = editParams;
      if (member) {
        const isAliveVal = member.isAlive !== false; 
        setIsAliveForm(isAliveVal);
        let relType = member.parentId ? 'child' : 'root';
        let connId = member.parentId || null;
        setRelationType(relType);
        
        form.setFieldsValue({
          ...member, isAlive: isAliveVal,
          birthDate: member.birthDate ? dayjs(member.birthDate) : null,
          deathDate: member.deathDate ? dayjs(member.deathDate) : null,
          relationType: relType, connectedId: connId
        });
        setFileList(member.imageKey && signedUrls[member.imageKey] ? [{ uid: '-1', name: 'Foto', status: 'done', url: signedUrls[member.imageKey] }] : []);
      } else {
        setIsAliveForm(true); 
        let relType = defaultId ? defaultType : 'root'; 
        setRelationType(relType);
        form.resetFields();
        form.setFieldsValue({ relationType: relType, connectedId: defaultId || null, isAlive: true });
        setFileList([]);
      }
    } else if (!open) {
      setTimeout(() => {
        form.resetFields();
        setFileList([]);
        setIsAliveForm(true);
        setRelationType('root');
      }, 300);
    }
  }, [open, editParams, form, signedUrls]);

  const handleSave = async (values) => {
    try {
      setUploading(true);
      const editingId = editParams?.member?.id;
      let imageKey = editingId ? members[editingId].imageKey : null;
      
      if (fileList.length > 0 && fileList[0].originFileObj && awsLoaded) {
        const s3 = new window.AWS.S3({
          endpoint: "https://755ea71baf9479dda3bbacc2e3b7426f.r2.cloudflarestorage.com",
          accessKeyId: "4b56a26a6cb9e3512882fa6d45b326da", secretAccessKey: "4adc9e3567829245ec1db122165a878b6503e70ce03ed4b90dcea016dfc2099e",
          region: "auto", signatureVersion: "v4"
        });
        const file = fileList[0].originFileObj; const fileExt = file.name.split('.').pop();
        const fileName = `trah_ponco_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        await s3.putObject({ Bucket: R2_BUCKET_NAME, Key: fileName, Body: file, ContentType: file.type }).promise();
        imageKey = fileName;
      } else if (fileList.length === 0) { 
        imageKey = null; 
      }

      const name = String(values.name || "Tanpa Nama");
      const memberData = {
        name, nameLower: name.toLowerCase(), isAlive: values.isAlive, imageKey,
        parentId: values.relationType === 'child' ? (values.connectedId || null) : null,
        birthDate: values.birthDate ? values.birthDate.format('YYYY-MM-DD') : null,
        deathDate: values.isAlive ? null : (values.deathDate ? values.deathDate.format('YYYY-MM-DD') : null)
      };

      if (editingId) {
        memberData.id = editingId; await update(ref(db, `familyTree/${editingId}`), memberData);
      } else {
        const newRef = push(ref(db, 'familyTree')); memberData.id = newRef.key; await set(newRef, memberData);
      }
      
      message.success("Data berhasil disimpan.");
      onSaveSuccess();
    } catch (err) { 
      message.error("Gagal menyimpan data."); 
    } finally { 
      setUploading(false); 
    }
  };

  return (
    <Modal 
      title={<span style={{ fontWeight: 800, fontSize: 18 }}>{editParams?.member ? "Edit Profil" : "Tambah Anggota Baru"}</span>} 
      open={open} onCancel={onCancel} footer={null} centered width={450} forceRender={true}
      styles={{ content: { padding: 24, borderRadius: 24 } }}
    >
      <Form form={form} layout="vertical" onFinish={handleSave} requiredMark={false} style={{ marginTop: 20 }}>
        
        <Form.Item name="name" label={<span style={{ fontWeight: 600 }}>Nama Lengkap</span>} rules={[{ required: true, message: 'Nama wajib diisi' }]}>
          <Input size="large" placeholder="Masukkan nama..." style={{ borderRadius: 12 }} />
        </Form.Item>
        
        {/* STATUS MENGGUNAKAN STANDAR BUTTON SOLID ANTD (AMAN DARI OVERLAP) */}
        <Form.Item name="isAlive" label={<span style={{ fontWeight: 600 }}>Status Kehidupan</span>} style={{ marginBottom: 16 }}>
          <Radio.Group onChange={e => setIsAliveForm(e.target.value)} optionType="button" buttonStyle="solid" size="large" style={{ display: 'flex', width: '100%' }}>
            <Radio.Button value={true} style={{ flex: 1, textAlign: 'center', borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }}>Hidup</Radio.Button>
            <Radio.Button value={false} style={{ flex: 1, textAlign: 'center', borderTopRightRadius: 12, borderBottomRightRadius: 12 }}>Wafat</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Space size="middle" style={{ display: 'flex', width: '100%' }}>
           <Form.Item name="birthDate" label={<span style={{ fontWeight: 600 }}>Tgl Lahir</span>} style={{ flex: 1 }}>
             <DatePicker format="YYYY-MM-DD" style={{ width: '100%', borderRadius: 12 }} size="large" placeholder="Pilih tanggal" />
           </Form.Item>
           {!isAliveForm && (
             <Form.Item name="deathDate" label={<span style={{ fontWeight: 600 }}>Tgl Wafat</span>} style={{ flex: 1 }}>
               <DatePicker format="YYYY-MM-DD" style={{ width: '100%', borderRadius: 12 }} size="large" placeholder="Pilih tanggal" />
             </Form.Item>
           )}
        </Space>

        <Form.Item name="relationType" label={<span style={{ fontWeight: 600 }}>Koneksi Diagram (Darah Murni)</span>}>
          <Radio.Group onChange={e => setRelationType(e.target.value)}>
            <Space direction="vertical">
              <Radio value="root">Leluhur Utama (Paling Atas)</Radio>
              <Radio value="child">Anak dari seseorang...</Radio>
            </Space>
          </Radio.Group>
        </Form.Item>
        
        <div style={{ display: relationType !== 'root' ? 'block' : 'none' }}>
          <Form.Item name="connectedId" label={<span style={{ fontWeight: 600 }}>Pilih Orang Tua:</span>} rules={[{ required: relationType !== 'root', message: 'Pilih anggota keluarga' }]}>
            <Select 
              showSearch size="large" placeholder="Ketik nama orang tua..." 
              options={searchOptions} optionFilterProp="searchText" virtual={true}
              style={{ borderRadius: 12 }}
            />
          </Form.Item>
        </div>
        
        <Form.Item label={<span style={{ fontWeight: 600 }}>Foto Profil</span>}>
          <Upload listType="picture-card" maxCount={1} fileList={fileList} onChange={({ fileList: n }) => setFileList(n)} beforeUpload={() => false}>
            {fileList.length === 0 && (
              <div style={{ color: '#4b5563', fontWeight: 600, fontSize: 13 }}>
                <PlusOutlined style={{ fontSize: 20, marginBottom: 8 }} /><br/>Upload Foto
              </div>
            )}
          </Upload>
        </Form.Item>
        
        <Button type="primary" block size="large" htmlType="submit" loading={uploading} style={{ height: 50, borderRadius: 16, fontWeight: 700, fontSize: 16, marginTop: 10 }}>
          {uploading ? "Menyimpan Data..." : "Simpan Anggota"}
        </Button>
      </Form>
    </Modal>
  );
});

// ==========================================
// 3. MAIN APPLICATION COMPONENT
// ==========================================
export default function App() {
  const [members, setMembers] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Deteksi Mode Admin via Toggle Manual (Bukan URL Lagi)
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editParams, setEditParams] = useState(null);
  
  const [signedUrls, setSignedUrls] = useState({});
  const [awsLoaded, setAwsLoaded] = useState(false);
  const [initialCenterDone, setInitialCenterDone] = useState(false);

  // --- ENGINE ZOOM & PAN ---
  const transformRef = useRef({ x: 0, y: 0, scale: 0.8 });
  const containerRef = useRef(null);
  const treeWrapperRef = useRef(null);
  const activePointers = useRef(new Map());
  const initialPinchDist = useRef(0);
  const initialPinchScale = useRef(0.8);

  // ------------------------------------------
  // INITIALIZATION & DATA SYNC
  // ------------------------------------------
  useEffect(() => {
    document.title = "Trah Poncoharsoyo";
    
    // Blok if(window.location.pathname.includes('/admin')) telah dihapus.
    
    if (window.AWS) { setAwsLoaded(true); } else {
      const awsScript = document.createElement('script');
      awsScript.src = "https://cdnjs.cloudflare.com/ajax/libs/aws-sdk/2.1390.0/aws-sdk.min.js";
      awsScript.onload = () => setAwsLoaded(true);
      document.head.appendChild(awsScript);
    }

    const membersRef = ref(db, 'familyTree');
    const unsubscribe = onValue(membersRef, (snapshot) => {
      const data = snapshot.val() || {};
      setMembers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateTransform = useCallback(() => {
    if (treeWrapperRef.current) {
      const { x, y, scale } = transformRef.current;
      treeWrapperRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    }
  }, []);

  const searchOptions = useMemo(() => {
    return Object.values(members)
      .map(m => ({
        value: m.id,
        label: m.name || "Tanpa Nama",
        searchText: (m.name || "").toLowerCase()
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [members]);

  // ------------------------------------------
  // S3 SIGNED URL BATCH LOADER
  // ------------------------------------------
  useEffect(() => {
    const fetchSignedUrls = async () => {
      if (!awsLoaded || !window.AWS) return;
      const s3 = new window.AWS.S3({
        endpoint: "https://755ea71baf9479dda3bbacc2e3b7426f.r2.cloudflarestorage.com",
        accessKeyId: "4b56a26a6cb9e3512882fa6d45b326da", secretAccessKey: "4adc9e3567829245ec1db122165a878b6503e70ce03ed4b90dcea016dfc2099e",
        region: "auto", signatureVersion: "v4"
      });
      const newUrls = { ...signedUrls };
      let updated = false;
      
      Object.values(members).forEach(member => {
        if (member.imageKey && !newUrls[member.imageKey]) {
          try {
            newUrls[member.imageKey] = s3.getSignedUrl('getObject', { Bucket: R2_BUCKET_NAME, Key: member.imageKey, Expires: 3600 });
            updated = true;
          } catch (err) { console.error("URL Sign Error:", err); }
        }
      });
      if (updated) setSignedUrls(newUrls);
    };
    if (Object.keys(members).length > 0) fetchSignedUrls();
  }, [members, awsLoaded]);

  // ------------------------------------------
  // AUTO CENTER ON ROOT LELUHUR
  // ------------------------------------------
  const focusOnMember = useCallback((id, smooth = true, initialFocus = false) => {
    if (!id) return false;
    
    const el = document.getElementById(`member-${id}`);
    const container = containerRef.current;
    const wrapper = treeWrapperRef.current;

    if (el && container && wrapper && el.offsetWidth > 0) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      
      const elScreenX = elRect.left + elRect.width / 2;
      const elScreenY = elRect.top + elRect.height / 2;

      const { x: currentX, y: currentY, scale: currentScale } = transformRef.current;
      
      const wrapperViewportX = containerRect.left + currentX;
      const wrapperViewportY = containerRect.top + currentY;
      
      const unscaledX = (elScreenX - wrapperViewportX) / currentScale;
      const unscaledY = (elScreenY - wrapperViewportY) / currentScale;

      const isMobile = window.innerWidth <= 768;
      const targetScale = initialFocus ? (isMobile ? 0.6 : 0.8) : 1; 
      
      const newX = (containerRect.width / 2) - (unscaledX * targetScale);
      const newY = (containerRect.height / 2) - (unscaledY * targetScale);

      transformRef.current = { x: newX, y: newY, scale: targetScale };
      
      if (smooth) {
        wrapper.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
        updateTransform();
        setTimeout(() => { if (wrapper) wrapper.style.transition = 'none'; }, 800);
      } else {
        updateTransform();
      }

      if (!initialFocus) {
        el.classList.add('highlight-glow');
        setTimeout(() => { if(el) el.classList.remove('highlight-glow'); }, 3000);
      }
      return true; 
    }
    return false; 
  }, [updateTransform]);

  useEffect(() => {
    if (loading || Object.keys(members).length === 0 || initialCenterDone) return;
    
    const roots = Object.values(members).filter(m => !m.parentId);
    if (roots.length === 0) return;

    const rootId = roots[0].id;
    let attempts = 0;

    const attemptCenter = () => {
      const isSuccess = focusOnMember(rootId, true, true); 
      if (isSuccess) {
         setInitialCenterDone(true);
         setTimeout(() => focusOnMember(rootId, true, true), 1000);
      } else if (attempts < 50) { 
         attempts++;
         setTimeout(attemptCenter, 100);
      }
    };

    attemptCenter();
  }, [loading, members, initialCenterDone, focusOnMember]);

  // ------------------------------------------
  // ENGINE: POINTER & GESTURE (SMOOTH PAN/ZOOM)
  // ------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const { x, y, scale } = transformRef.current;
      
      const delta = -e.deltaY;
      const scaleAmount = delta > 0 ? 1.05 : 0.95;
      const newScale = Math.max(0.05, Math.min(scale * scaleAmount, 4));

      const newX = mouseX - ((mouseX - x) * (newScale / scale));
      const newY = mouseY - ((mouseY - y) * (newScale / scale));

      transformRef.current = { x: newX, y: newY, scale: newScale };
      updateTransform();
    };

    const onPointerDown = (e) => {
      if (e.target.closest('button') || e.target.closest('.ant-select') || e.target.closest('.ant-modal-root') || e.target.closest('.ant-image-mask')) return;
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      
      if (activePointers.current.size === 2) {
        const pts = Array.from(activePointers.current.values());
        initialPinchDist.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        initialPinchScale.current = transformRef.current.scale;
      }
      container.setPointerCapture(e.pointerId);
      container.style.cursor = 'grabbing';
    };

    const onPointerMove = (e) => {
      if (!activePointers.current.has(e.pointerId)) return;
      const prevPos = activePointers.current.get(e.pointerId);
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.current.size === 1) {
        const dx = e.clientX - prevPos.x;
        const dy = e.clientY - prevPos.y;
        transformRef.current.x += dx;
        transformRef.current.y += dy;
        requestAnimationFrame(updateTransform);
      } else if (activePointers.current.size === 2) {
        const pts = Array.from(activePointers.current.values());
        const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const centerX = (pts[0].x + pts[1].x) / 2;
        const centerY = (pts[0].y + pts[1].y) / 2;
        const rect = container.getBoundingClientRect();
        const newScale = Math.max(0.05, Math.min(initialPinchScale.current * (currentDist / initialPinchDist.current), 4));
        const { x, y, scale } = transformRef.current;
        const focusX = centerX - rect.left;
        const focusY = centerY - rect.top;
        const newX = focusX - ((focusX - x) * (newScale / scale));
        const newY = focusY - ((focusY - y) * (newScale / scale));
        transformRef.current = { x: newX, y: newY, scale: newScale };
        requestAnimationFrame(updateTransform);
      }
    };

    const onPointerUp = (e) => {
      activePointers.current.delete(e.pointerId);
      if (activePointers.current.size === 0) container.style.cursor = 'grab';
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerUp);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerUp);
    };
  }, [updateTransform]);

  // ------------------------------------------
  // ACTIONS & HANDLERS
  // ------------------------------------------
  const resetView = () => {
    const roots = Object.values(members).filter(m => !m.parentId);
    if (roots.length > 0) focusOnMember(roots[0].id, true, true);
  };

  // RUMUS MATEMATIKA ZOOM KE TITIK TENGAH (CENTER)
  const zoomToCenter = useCallback((scaleChange) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    
    // Titik tengah layar secara presisi
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const { x, y, scale } = transformRef.current;
    const newScale = Math.max(0.05, Math.min(scale + scaleChange, 4));
    
    // Kompensasi koordinat agar elemen di titik tengah tidak bergeser lari
    const newX = centerX - ((centerX - x) * (newScale / scale));
    const newY = centerY - ((centerY - y) * (newScale / scale));

    transformRef.current = { x: newX, y: newY, scale: newScale };
    
    // Efek transisi mulus saat tombol diklik
    if (treeWrapperRef.current) {
      treeWrapperRef.current.style.transition = 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)';
      updateTransform();
      setTimeout(() => {
        if (treeWrapperRef.current) treeWrapperRef.current.style.transition = 'none';
      }, 200);
    }
  }, [updateTransform]);

  const handleZoomIn = () => zoomToCenter(0.15);
  const handleZoomOut = () => zoomToCenter(-0.15);

  const handleOpenModal = useCallback((member = null, defaultId = null, defaultType = 'child') => {
    setEditParams({ member, defaultId, defaultType });
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => setEditParams(null), 300);
  }, []);

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Hapus Anggota?', content: 'Apakah Anda yakin ingin menghapus data ini?',
      okType: 'danger', centered: true, maskClosable: true,
      onOk: async () => {
        Object.values(members).forEach(child => {
          if (child.parentId === id) update(ref(db, `familyTree/${child.id}`), { parentId: null });
        });
        await remove(ref(db, `familyTree/${id}`)); 
        message.success("Berhasil dihapus.");
      }
    });
  };

  // ------------------------------------------
  // ANTI-FREEZE TREE RENDERING
  // ------------------------------------------
  const RenderedTree = useMemo(() => {
    if (Object.keys(members).length === 0) return null;

    const getAgeStr = (member) => {
      if (!member.birthDate) return null;
      const bDate = dayjs(member.birthDate);
      if (!bDate.isValid()) return null;

      let age = null;
      if (member.isAlive !== false) {
        age = dayjs().diff(bDate, 'year');
      } else if (member.deathDate) {
        const dDate = dayjs(member.deathDate);
        if (dDate.isValid()) {
          age = dDate.diff(bDate, 'year');
        }
      }
      return age !== null && !isNaN(age) ? `${age} Tahun` : null;
    };

    const renderMemberCard = (member) => {
      const isDead = member.isAlive === false;
      const avatarUrl = member.imageKey && signedUrls[member.imageKey] ? signedUrls[member.imageKey] : null;
      const ageStr = getAgeStr(member); 
      
      return (
        <div id={`member-${member.id}`} className={`tree-card ${isDead ? 'card-dead' : ''}`}>
          
          {/* HANYA MUNCUL JIKA MODE ADMIN */}
          {isAdmin && (
            <div className="card-hover-actions">
              <Button shape="circle" type="primary" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); handleOpenModal(member); }} />
              <Button shape="circle" danger icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); handleDelete(member.id); }} />
              <Button shape="round" size="small" icon={<PlusOutlined />} onClick={(e) => { e.stopPropagation(); handleOpenModal(null, member.id, 'child'); }}>Tambah Anak</Button>
            </div>
          )}

          <div className="card-top">
            {isDead && <Badge count="Wafat" className="badge-dead" />}
            {avatarUrl ? (
              <Image src={avatarUrl} className="card-img" preview={{ mask: <EyeOutlined /> }} fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="/>
            ) : (
              <UserOutlined style={{ fontSize: 80, color: '#6b7280' }} />
            )}
          </div>
          <div className="card-bottom">
            <h3 className="card-name">{String(member.name)}</h3>
            {ageStr && <div className="card-age">{ageStr}</div>}
          </div>
        </div>
      );
    };

    const renderTreeNode = (member) => {
      const children = Object.values(members)
        .filter(m => String(m.parentId) === String(member.id))
        .sort((a, b) => (new Date(a.birthDate || 0)) - (new Date(b.birthDate || 0)));

      return (
        <li className="tree-node" key={member.id}>
          <div className="node-content">
            {renderMemberCard(member)}
          </div>
          {children.length > 0 && (
            <ul className="tree-children">
              {children.map(child => renderTreeNode(child))}
            </ul>
          )}
        </li>
      );
    };

    const roots = Object.values(members).filter(m => !m.parentId);
    return (
      <div className="tf-tree">
        <ul>{roots.map(m => renderTreeNode(m))}</ul>
      </div>
    );
  }, [members, signedUrls, handleOpenModal, isAdmin]); 


  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#065f46', borderRadius: 12, fontFamily: 'Inter, sans-serif' } }}>
      <Layout style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
          body { margin: 0; background: #F7F7F5; }
          
          .app-header { flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; min-height: 76px; height: auto; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); z-index: 100; border-bottom: 1px solid rgba(0,0,0,0.05); box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
          .header-main-row { display: flex; align-items: center; gap: 14px; }
          .header-brand { display: flex; align-items: center; gap: 14px; }
          .header-actions { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
          .btn-tambah-mobile { display: none !important; }
          
          .canvas-container { flex: 1 1 auto; position: relative; width: 100%; overflow: hidden; background: #F7F7F5; cursor: grab; touch-action: none; user-select: none; -webkit-user-select: none; }
          
          .tree-wrapper { position: absolute; transform-origin: 0 0; will-change: transform; display: inline-block; min-width: 100%; }
          .tf-tree ul { padding-top: 50px; position: relative; display: flex; justify-content: center; list-style: none; margin: 0; padding-left: 0; }
          .tree-node { float: left; text-align: center; position: relative; padding-top: 50px; }
          .tree-node::before, .tree-node::after { content: ''; position: absolute; top: 0; right: 50%; border-top: 2px solid #a8a29e; width: 50%; height: 50px; }
          .tree-node::after { right: auto; left: 50%; border-left: 2px solid #a8a29e; }
          .tree-node:only-child::after, .tree-node:only-child::before { display: none; }
          .tree-node:only-child { padding-top: 0; }
          .tree-node:first-child::before, .tree-node:last-child::after { border: 0 none; }
          .tree-node:last-child::before { border-right: 2px solid #a8a29e; border-top-right-radius: 12px; }
          .tree-node:first-child::after { border-top-left-radius: 12px; }
          .tree-children::before { content: ''; position: absolute; top: 0; left: 50%; border-left: 2px solid #a8a29e; height: 50px; margin-left: -1px; }
          .node-content { display: inline-flex; align-items: center; gap: 24px; padding: 0 16px; position: relative; }
          
          .tree-card { width: 240px; background: white; border-radius: 24px; border: 1px solid #e7e5e4; overflow: hidden; position: relative; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); pointer-events: auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .tree-card:hover { transform: translateY(-4px); box-shadow: 0 10px 20px -3px rgba(0, 0, 0, 0.1); }
          .card-top { height: 240px; background: #f5f5f4; position: relative; display: flex; align-items: center; justify-content: center; }
          .card-img { width: 100%; height: 100%; object-fit: cover; }
          .card-dead { opacity: 0.8; filter: grayscale(70%); }
          .badge-dead { position: absolute; top: 12px; left: 12px; z-index: 10; font-weight: bold; }
          
          .card-bottom { padding: 16px; text-align: center; background: #fff; }
          .card-name { margin: 0; font-weight: 800; font-size: 17px; color: #1c1917; line-height: 1.3; }
          .card-age { margin-top: 6px; font-size: 12px; font-weight: 700; color: #6b7280; background: #f3f4f6; display: inline-block; padding: 3px 12px; border-radius: 20px; border: 1px solid #e5e7eb; }
          
          /* OPTIMASI HOVER ACTION: Hapus backdrop filter untuk zero-lag, hanya background hitam transparan */
          .tree-card:hover .card-hover-actions { opacity: 1; }
          
          .zoom-controls { position: absolute; bottom: 30px; right: 30px; display: flex; flex-direction: column; gap: 8px; background: rgba(255,255,255,0.9); backdrop-filter: blur(5px); padding: 6px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); z-index: 1000; border: 1px solid rgba(0,0,0,0.05); }
          .highlight-glow { border: 2px solid #10b981 !important; box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.2), 0 10px 25px rgba(0,0,0,0.1) !important; transform: scale(1.05) !important; z-index: 200; }
          
          @media (max-width: 768px) {
            .app-header { flex-direction: column; padding: 12px 16px; gap: 12px; align-items: stretch; }
            .header-main-row { display: flex; justify-content: space-between; width: 100%; align-items: center; }
            .btn-tambah-mobile { display: flex !important; align-items: center; justify-content: center; }
            .btn-tambah-desktop { display: none !important; }
            .header-actions { width: 100%; display: flex; }
            .header-actions .ant-select { width: 100% !important; }
            
            .zoom-controls { bottom: 40px; right: 16px; transform: scale(0.9); transform-origin: bottom right; z-index: 1000; }
            
            .tree-card { width: 180px; border-radius: 20px; }
            .card-top { height: 180px; }
            .card-name { font-size: 15px; }
            .node-content { gap: 16px; padding: 0 10px; }
            .tf-tree ul { padding-top: 40px; }
            .tree-node { padding-top: 40px; }
            .tree-children::before { height: 40px; }
            .tree-node::before, .tree-node::after { height: 40px; }
          }
        `}} />

        <Header className="app-header">
          <div className="header-main-row">
            <div className="header-brand">
              <div style={{ 
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', 
                width: 46, height: 46, borderRadius: 14, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                color: '#fff', boxShadow: '0 4px 12px rgba(5,150,105,0.3)', flexShrink: 0
              }}>
                <NodeIndexOutlined style={{ fontSize: 24 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 46 }}>
                <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#064e3b', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                  Trah Poncoharsoyo
                </Title>
                <span style={{ fontSize: 12, color: '#059669', fontWeight: 800, letterSpacing: '0.5px', marginTop: 2, lineHeight: 1 }}>
                  {isAdmin ? "ADMIN DASHBOARD" : "FAMILY TREE EXPLORER"}
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* TOGGLE EDIT MODE */}
              <Switch 
                checked={isAdmin} 
                onChange={setIsAdmin} 
                checkedChildren={<UnlockOutlined />} 
                unCheckedChildren={<LockOutlined />}
                style={{ background: isAdmin ? '#059669' : '#a8a29e' }}
              />
              
              {/* TAMPILKAN TOMBOL TAMBAH MOBILE HANYA JIKA MODE ADMIN */}
              {isAdmin && (
                <Button 
                  className="btn-tambah-mobile" 
                  type="primary" 
                  shape="circle"
                  size="large"
                  icon={<PlusOutlined />} 
                  onClick={() => handleOpenModal()} 
                  style={{ boxShadow: '0 4px 12px rgba(6, 95, 70, 0.3)' }}
                />
              )}
            </div>
          </div>
          
          <div className="header-actions">
            <Select 
              showSearch 
              size="large" 
              placeholder="Cari Cepat..." 
              style={{ width: 260 }} 
              onChange={(id) => focusOnMember(id)} 
              options={searchOptions}
              filterOption={(input, option) => (option?.searchText ?? '').includes(input.toLowerCase())}
              suffixIcon={<AimOutlined />}
              virtual={true}
            />
            {isAdmin && (
              <Button className="btn-tambah-desktop" type="primary" size="large" icon={<PlusOutlined />} onClick={() => handleOpenModal()} style={{ fontWeight: 600, boxShadow: '0 4px 12px rgba(6, 95, 70, 0.2)' }}>
                Tambah
              </Button>
            )}
          </div>
        </Header>

        <Content className="canvas-container" ref={containerRef}>
          {loading ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 40, color: '#059669' }} spin />} />
              <Typography.Text style={{ color: '#059669', fontWeight: 600 }}>Memuat Silsilah Keluarga...</Typography.Text>
            </div>
          ) : Object.keys(members).length === 0 ? (
            <div style={{ paddingTop: '15vh', textAlign: 'center', width: '100%', color: '#a8a29e' }}>
              <NodeIndexOutlined style={{ fontSize: 80, marginBottom: 20, opacity: 0.5 }} />
              <Title level={3} style={{ color: '#78716c' }}>Silsilah Masih Kosong</Title>
              {isAdmin && (
                <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => handleOpenModal()} style={{ marginTop: 20, borderRadius: 16 }}>Mulai Buat Silsilah</Button>
              )}
            </div>
          ) : (
            <div ref={treeWrapperRef} className="tree-wrapper">
               {RenderedTree}
            </div>
          )}
          
          {!loading && Object.keys(members).length > 0 && (
            <div className="zoom-controls">
              <Button type="text" size="large" icon={<ZoomInOutlined />} onClick={handleZoomIn} />
              <Button type="text" size="large" icon={<AimOutlined />} onClick={resetView} style={{ color: '#059669', background: '#ecfdf5' }} />
              <Button type="text" size="large" icon={<ZoomOutOutlined />} onClick={handleZoomOut} />
            </div>
          )}
        </Content>

        <MemberEditorModal 
          open={isModalOpen}
          onCancel={handleCloseModal}
          editParams={editParams}
          members={members}
          searchOptions={searchOptions}
          awsLoaded={awsLoaded}
          signedUrls={signedUrls}
          onSaveSuccess={handleCloseModal}
        />
      </Layout>
    </ConfigProvider>
  );
}