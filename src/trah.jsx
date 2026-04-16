import React, { useState, useEffect, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { 
  Typography, Button, Form, Input, 
  Upload, message, Badge, ConfigProvider, Select, 
  DatePicker, Image, Spin, Radio, Dropdown, Modal, Descriptions
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  NodeIndexOutlined, AimOutlined, 
  EyeOutlined, ZoomInOutlined, ZoomOutOutlined, LoadingOutlined,
  ArrowLeftOutlined, MoreOutlined, HeartOutlined, ShareAltOutlined, IdcardOutlined
} from '@ant-design/icons';
import { initializeApp } from "firebase/app";
import { getDatabase, ref as firebaseRef, onValue, set, push, update, remove } from "firebase/database";
import dayjs from 'dayjs';

const { Title } = Typography;

// ==========================================
// 1. CONFIGURATION (Firebase & R2)
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
const R2_BUCKET_NAME = "poncoharsoyoheritage";
const R2_ENDPOINT = "https://755ea71baf9479dda3bbacc2e3b7426f.r2.cloudflarestorage.com";
const R2_PUBLIC_DOMAIN = "https://pub-268e4ac098564a4fae1119e480f5a908.r2.dev";

const IMAGE_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

// Helper untuk format R2 Image URL
const getValidImageUrl = (member) => {
  let url = member.imageUrl ? member.imageUrl : null;
  if (url && url.includes('pub-b7b4f93ec4d845a584a3d90b6a76e10f.r2.dev')) {
    url = url.replace('pub-b7b4f93ec4d845a584a3d90b6a76e10f.r2.dev', 'pub-268e4ac098564a4fae1119e480f5a908.r2.dev');
  } else if (!url && member.imageKey) {
    url = `${R2_PUBLIC_DOMAIN}/${member.imageKey}`;
  }
  return url || IMAGE_PLACEHOLDER;
};

// ==========================================
// 2. HALAMAN FORMULIR (MOBILE RESPONSIVE)
// ==========================================
const MemberFormPage = forwardRef(({ members, searchOptions, awsLoaded }, ref) => {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isAliveForm, setIsAliveForm] = useState(true);
  const [relationType, setRelationType] = useState('root');
  const [editingId, setEditingId] = useState(null);
  const [oldImageUrl, setOldImageUrl] = useState(null);

  const validConnectionOptions = useMemo(() => {
    return searchOptions.filter(opt => opt.value !== editingId);
  }, [searchOptions, editingId]);

  useImperativeHandle(ref, () => ({
    openForm: (member = null, defaultId = null, defaultType = 'child', avatarUrl = null) => {
      setOpen(true);
      const treeView = document.getElementById('main-tree-view');
      if (treeView) treeView.style.display = 'none';

      if (member) {
        setEditingId(member.id);
        setOldImageUrl(member.imageUrl || null);
        const isAliveVal = member.isAlive !== false;
        setIsAliveForm(isAliveVal);
        
        let relType = member.parentId ? 'child' : (member.spouseOf ? 'spouse' : 'root');
        setRelationType(relType);
        
        form.setFieldsValue({
          name: member.name,
          isAlive: isAliveVal,
          birthDate: member.birthDate ? dayjs(member.birthDate) : null,
          deathDate: member.deathDate ? dayjs(member.deathDate) : null,
          relationType: relType,
          connectedId: member.parentId || member.spouseOf || null,
          phone: member.phone || '',
          address: member.address || ''
        });
        
        if (avatarUrl && !avatarUrl.startsWith('data:image/svg') && !avatarUrl.includes('dicebear')) {
          setFileList([{ uid: '-1', name: 'Foto', status: 'done', url: avatarUrl }]);
        } else {
          setFileList([]);
        }
      } else {
        setEditingId(null);
        setOldImageUrl(null);
        setIsAliveForm(true);
        let relType = defaultId ? defaultType : 'root';
        setRelationType(relType);
        form.resetFields();
        setTimeout(() => {
          form.setFieldsValue({ relationType: relType, connectedId: defaultId || null, isAlive: true, phone: '', address: '' });
        }, 0);
        setFileList([]);
      }
    }
  }));

  const handleClose = () => {
    const treeView = document.getElementById('main-tree-view');
    if (treeView) treeView.style.display = 'flex';
    setOpen(false);
    
    form.resetFields();
    setFileList([]);
    setIsAliveForm(true);
    setRelationType('root');
    setEditingId(null);
    setOldImageUrl(null);
  };

  const handleSave = async (values) => {
    try {
      setUploading(true);
      let newImageUrl = oldImageUrl;
      
      if (fileList.length > 0 && fileList[0].originFileObj) {
        if (!window.AWS || !awsLoaded) throw new Error("Sistem upload belum siap, silakan tunggu sebentar.");

        const s3 = new window.AWS.S3({
          endpoint: R2_ENDPOINT,
          accessKeyId: "b79756a12f35285a3f2d0b09b2337edc", 
          secretAccessKey: "e45f6c4c498de952ad4bfd65f36818dc01ed2b57162ccbdbeedfce365435178a",
          region: "auto", signatureVersion: "v4"
        });
        
        const file = fileList[0].originFileObj; 
        const fileExt = file.name.split('.').pop();
        const fileName = `trah_ponco_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        await s3.putObject({ 
          Bucket: R2_BUCKET_NAME, Key: fileName, Body: file, 
          ContentType: file.type, ACL: 'public-read' 
        }).promise();
        newImageUrl = `${R2_PUBLIC_DOMAIN}/${fileName}`;
      } else if (fileList.length === 0) { 
        newImageUrl = null;
      }

      const name = String(values.name || "Tanpa Nama");
      const memberData = {
        name, 
        nameLower: name.toLowerCase(), 
        isAlive: values.isAlive, 
        imageUrl: newImageUrl,
        parentId: values.relationType === 'child' ? (values.connectedId || null) : null,
        spouseOf: values.relationType === 'spouse' ? (values.connectedId || null) : null,
        birthDate: values.birthDate ? values.birthDate.format('YYYY-MM-DD') : null,
        deathDate: values.isAlive ? null : (values.deathDate ? values.deathDate.format('YYYY-MM-DD') : null),
        phone: values.phone || null,
        address: values.address || null
      };

      if (editingId) {
        memberData.id = editingId; 
        await update(firebaseRef(db, `familyTree/${editingId}`), memberData);
      } else {
        const newRef = push(firebaseRef(db, 'familyTree')); 
        memberData.id = newRef.key; 
        await set(newRef, memberData);
      }
      
      message.success("Data berhasil disimpan.");
      handleClose();
    } catch (err) { 
      message.error(err.message || "Gagal menyimpan data."); 
    } finally { 
      setUploading(false); 
    }
  };

  if (!open) return null;

  return (
    <div className="form-page-layer">
      <div className="form-page-header">
        <Button type="text" icon={<ArrowLeftOutlined />} size="large" onClick={handleClose} style={{ marginRight: 12 }} />
        <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#064e3b' }}>
          {editingId ? "Edit Profil Anggota" : "Tambah Anggota Baru"}
        </Title>
      </div>
      
      <div className="form-page-body">
        <div className="form-page-card">
          <Form form={form} layout="vertical" onFinish={handleSave} requiredMark={false}>
            <Form.Item name="name" label={<span style={{ fontWeight: 600 }}>Nama Lengkap</span>} rules={[{ required: true, message: 'Nama wajib diisi' }]}>
              <Input size="large" placeholder="Masukkan nama..." style={{ borderRadius: 12 }} />
            </Form.Item>
            
            <Form.Item name="isAlive" label={<span style={{ fontWeight: 600 }}>Status Kehidupan</span>} style={{ marginBottom: 16 }}>
              <Radio.Group className="pill-radio-group" onChange={e => setIsAliveForm(e.target.value)} optionType="button" buttonStyle="solid">
                <Radio.Button value={true}>Hidup</Radio.Button>
                <Radio.Button value={false}>Wafat</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <div className="form-row-responsive">
              <div style={{ flex: 1 }}>
                <Form.Item name="birthDate" label={<span style={{ fontWeight: 600 }}>Tgl Lahir</span>}>
                  <DatePicker format="YYYY-MM-DD" style={{ width: '100%', borderRadius: 12 }} size="large" placeholder="Pilih tanggal" />
                </Form.Item>
              </div>
              {!isAliveForm && (
                <div style={{ flex: 1 }}>
                  <Form.Item name="deathDate" label={<span style={{ fontWeight: 600 }}>Tgl Wafat</span>}>
                    <DatePicker format="YYYY-MM-DD" style={{ width: '100%', borderRadius: 12 }} size="large" placeholder="Pilih tanggal" />
                  </Form.Item>
                </div>
              )}
            </div>

            <Form.Item name="relationType" label={<span style={{ fontWeight: 600 }}>Koneksi Diagram</span>}>
              <Radio.Group onChange={e => setRelationType(e.target.value)}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Radio value="root">Leluhur Utama (Paling Atas)</Radio>
                  <Radio value="child">Anak (Darah Murni) dari...</Radio>
                  <Radio value="spouse">Pasangan (Istri/Suami) dari...</Radio>
                </div>
              </Radio.Group>
            </Form.Item>
            
            <div style={{ display: relationType !== 'root' ? 'block' : 'none' }}>
              <Form.Item 
                name="connectedId" 
                label={<span style={{ fontWeight: 600 }}>{relationType === 'spouse' ? 'Pilih Pasangannya:' : 'Pilih Orang Tua:'}</span>} 
                rules={[{ required: relationType !== 'root', message: 'Pilih anggota keluarga yang terhubung' }]}
              >
                <Select 
                  className="select-search"
                  showSearch allowClear size="large" 
                  placeholder="Cari & Pilih Nama..." 
                  options={validConnectionOptions} 
                  optionLabelProp="label"
                  filterOption={(input, option) => (option?.searchText ?? '').includes(input.toLowerCase())}
                  style={{ width: '100%', borderRadius: 12 }} virtual={true}
                  notFoundContent="Nama tidak ditemukan"
                  getPopupContainer={(trigger) => trigger.parentNode}
                />
              </Form.Item>
            </div>

            <Form.Item name="phone" label={<span style={{ fontWeight: 600 }}>No. Handphone / WhatsApp</span>}>
              <Input size="large" placeholder="Masukkan nomor HP..." style={{ borderRadius: 12 }} />
            </Form.Item>

            <Form.Item name="address" label={<span style={{ fontWeight: 600 }}>Alamat / Domisili</span>}>
              <Input.TextArea rows={3} placeholder="Masukkan alamat lengkap saat ini..." style={{ borderRadius: 12 }} />
            </Form.Item>
            
            <Form.Item label={<span style={{ fontWeight: 600 }}>Foto Profil</span>}>
              <Upload 
                listType="picture-card" maxCount={1} fileList={fileList} 
                onChange={({ fileList: n }) => {
                  const updatedFileList = n.map(file => {
                    if (file.originFileObj && !file.url && !file.thumbUrl) {
                      return { ...file, thumbUrl: URL.createObjectURL(file.originFileObj) };
                    }
                    return file;
                  });
                  setFileList(updatedFileList);
                }} 
                beforeUpload={() => false}
              >
                {fileList.length === 0 && (
                  <div style={{ color: '#4b5563', fontWeight: 600, fontSize: 13 }}>
                    <PlusOutlined style={{ fontSize: 20, marginBottom: 8 }} /><br/>Upload Foto
                  </div>
                )}
              </Upload>
            </Form.Item>
            
            <Button type="primary" block size="large" htmlType="submit" loading={uploading} style={{ height: 50, borderRadius: 16, fontWeight: 700, fontSize: 16, marginTop: 10 }}>
              {uploading ? "Menyimpan Data..." : (editingId ? "Perbarui Anggota" : "Simpan Anggota")}
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
});

// ==========================================
// 2.5 MODAL DETAIL ANGGOTA (LIHAT SAJA)
// ==========================================
const MemberDetailsModal = forwardRef(({ members, generations }, ref) => {
  const [open, setOpen] = useState(false);
  const [memberId, setMemberId] = useState(null);

  useImperativeHandle(ref, () => ({
    openModal: (id) => {
      setMemberId(id);
      setOpen(true);
    }
  }));

  const member = memberId ? members[memberId] : null;
  if (!member) return null;

  const avatarUrl = getValidImageUrl(member);
  const isDead = member.isAlive === false;
  const gen = generations ? generations[member.id] : '?';

  return (
    <Modal open={open} onCancel={() => setOpen(false)} footer={null} title={<span style={{ fontWeight: 800, color: '#064e3b' }}>Profil Anggota Keluarga</span>} centered width={400} bodyStyle={{ padding: '24px 0 0 0' }}>
      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
         <Image src={avatarUrl} width={120} height={120} style={{ borderRadius: '50%', objectFit: 'cover', border: '4px solid #f1f5f9', aspectRatio: '1/1' }} fallback={IMAGE_PLACEHOLDER} preview={{ mask: <EyeOutlined /> }} />
         <Title level={4} style={{ marginTop: 16, marginBottom: 4, fontWeight: 800, textAlign: 'center' }}>{member.name}</Title>
         <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
           <Badge count={`Generasi ${gen}`} style={{ backgroundColor: '#10b981', color: '#fff', fontWeight: 600 }} />
           {member.spouseOf && <Badge count="Pasangan" style={{ backgroundColor: '#f43f5e', color: '#fff', fontWeight: 600 }} />}
         </div>
      </div>
      <div style={{ background: '#f8fafc', padding: '20px 24px', borderTop: '1px solid #e2e8f0', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
        <Descriptions column={1} size="small" labelStyle={{ fontWeight: 700, color: '#64748b', width: '90px' }} contentStyle={{ fontWeight: 600, color: '#1e293b' }}>
          <Descriptions.Item label="Status">{isDead ? <span style={{ color: '#ef4444' }}>Wafat</span> : <span style={{ color: '#059669' }}>Hidup</span>}</Descriptions.Item>
          <Descriptions.Item label="Tgl Lahir">{member.birthDate || '-'}</Descriptions.Item>
          {isDead && <Descriptions.Item label="Tgl Wafat">{member.deathDate || '-'}</Descriptions.Item>}
          <Descriptions.Item label="No. HP">{member.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="Alamat">{member.address || '-'}</Descriptions.Item>
        </Descriptions>
      </div>
    </Modal>
  );
});


// ==========================================
// 3. TREE NODE COMPONENTS
// ==========================================
const areNodesEqual = (prevProps, nextProps) => {
  if (prevProps.member !== nextProps.member) return false;
  
  if (prevProps.spousesList.length !== nextProps.spousesList.length) return false;
  for (let i = 0; i < prevProps.spousesList.length; i++) {
    if (prevProps.spousesList[i] !== nextProps.spousesList[i]) return false;
  }
  
  if (prevProps.childrenList.length !== nextProps.childrenList.length) return false;
  for (let i = 0; i < prevProps.childrenList.length; i++) {
    if (prevProps.childrenList[i] !== nextProps.childrenList[i]) return false;
  }
  
  return true; 
};

const MemoizedTreeNode = React.memo(({ member, spousesList, parent, childrenList, generations, members, cmap, smap, engineRef }) => {
  
  const renderCard = (m, isSpouse = false) => {
    const isDead = m.isAlive === false;
    const gen = generations[m.id];
    const avatarUrl = getValidImageUrl(m);
    
    let ageStr = null;
    if (m.birthDate) {
      const bDate = dayjs(m.birthDate);
      if (bDate.isValid()) {
        let age = isDead && m.deathDate ? dayjs(m.deathDate).diff(bDate, 'year') : dayjs().diff(bDate, 'year');
        if (!isNaN(age) && age !== null) ageStr = `${age} Thn`;
      }
    }

    const fireFocus = (id) => engineRef.current.focusOnMember(id);
    const fireForm = (mToEdit, dId, dType) => engineRef.current.openForm(mToEdit, dId, dType, mToEdit ? avatarUrl : null);
    const fireDelete = (id) => engineRef.current.deleteMember(id);
    const fireCopyLink = (id) => {
      const url = `${window.location.origin}${window.location.pathname}#/member/${id}`;
      navigator.clipboard.writeText(url).then(() => {
        message.success("Link profil berhasil disalin! Silakan bagikan.");
      });
    };

    const cardMenuActions = [
      {
        key: 'view-details',
        icon: <IdcardOutlined style={{ color: '#059669' }} />,
        label: <span style={{ fontWeight: 700, color: '#064e3b' }}>Lihat Detail</span>,
        onClick: (e) => { e?.domEvent?.stopPropagation(); engineRef.current.viewDetails(m.id); }
      },
      { type: 'divider' },
      {
        key: 'copy-link',
        icon: <ShareAltOutlined style={{ color: '#2563eb' }} />,
        label: 'Salin Link Profil',
        onClick: (e) => { e?.domEvent?.stopPropagation(); fireCopyLink(m.id); }
      },
      { type: 'divider' }
    ];

    if (!isSpouse) {
      cardMenuActions.push({
        key: 'add-child', icon: <PlusOutlined />, label: 'Tambah Anak',
        onClick: (e) => { e?.domEvent?.stopPropagation(); fireForm(null, m.id, 'child'); }
      });
      cardMenuActions.push({
        key: 'add-spouse', icon: <HeartOutlined style={{ color: '#f43f5e' }} />, label: 'Tambah Pasangan',
        onClick: (e) => { e?.domEvent?.stopPropagation(); fireForm(null, m.id, 'spouse'); }
      });
      cardMenuActions.push({ type: 'divider' });
    }

    cardMenuActions.push(
      {
        key: 'edit', icon: <EditOutlined style={{ color: '#059669' }} />, label: 'Edit Profil',
        onClick: (e) => { e?.domEvent?.stopPropagation(); fireForm(m); }
      },
      {
        key: 'delete', icon: <DeleteOutlined />, label: 'Hapus Anggota', danger: true,
        onClick: (e) => { e?.domEvent?.stopPropagation(); fireDelete(m.id); }
      }
    );

    return (
      <div id={`member-${m.id}`} className={`tree-card ${isDead ? 'card-dead' : ''} ${isSpouse ? 'card-spouse' : ''}`}>
        
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 20 }}>
          <Dropdown menu={{ items: cardMenuActions }} trigger={['click']} placement="bottomRight">
            <Button 
              size="small" shape="circle" icon={<MoreOutlined />} onClick={e => e.stopPropagation()} 
              style={{ background: 'rgba(255,255,255,0.95)', border: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }} 
            />
          </Dropdown>
        </div>

        <div className="card-top">
          {isDead && <Badge count="Wafat" className="badge-dead" />}
          <Image src={avatarUrl} className="card-img" preview={{ mask: <EyeOutlined /> }} fallback={IMAGE_PLACEHOLDER} />
        </div>
        
        <div className="card-bottom">
          <h3 className="card-name">{String(m.name)}</h3>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            <span className="card-tag gen-tag">Gen {gen}</span>
            {isSpouse && <span className="card-tag spouse-tag">Pasangan</span>}
            {ageStr && <span className="card-tag age-tag">{ageStr}</span>}
          </div>
        </div>
        
        {!isSpouse && (parent || childrenList.length > 0) && (
          <div className="card-relations">
            {parent && (
              <div className="relation-item">
                <span className="relation-label">Orang Tua</span>
                <div className="relation-children">
                  <div className="relation-link parent-link" onClick={(e) => { e.stopPropagation(); fireFocus(parent.id); }}>
                    {parent.name}
                  </div>
                </div>
              </div>
            )}
            {childrenList.length > 0 && (
              <div className="relation-item">
                <span className="relation-label">Anak ({childrenList.length})</span>
                <div className="relation-children">
                  {childrenList.map(child => (
                    <div key={child.id} className="relation-link" onClick={(e) => { e.stopPropagation(); fireFocus(child.id); }}>
                      {child.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <li className="tree-node">
      <div className="node-content">
        {/* Render Anggota Keluarga Darah Murni */}
        {renderCard(member, false)}
        
        {/* Render Pasangan (Istri/Suami) */}
        {spousesList.map(sp => (
          <React.Fragment key={sp.id}>
            <div className="spouse-connector">
              <HeartOutlined style={{ zIndex: 2, background: '#F7F7F5', padding: '0 4px' }} />
            </div>
            {renderCard(sp, true)}
          </React.Fragment>
        ))}
      </div>
      
      {childrenList.length > 0 && (
        <ul className="tree-children">
          {childrenList.map(child => (
             <TreeBuilder 
               key={child.id} memberId={child.id} 
               members={members} cmap={cmap} smap={smap}
               generations={generations} engineRef={engineRef} 
             />
          ))}
        </ul>
      )}
    </li>
  );
}, areNodesEqual);

const TreeBuilder = ({ memberId, members, cmap, smap, generations, engineRef }) => {
  const member = members[memberId];
  if (!member) return null;

  const parent = member.parentId ? members[member.parentId] : null;
  const childrenIds = cmap[memberId] || [];
  const childrenList = childrenIds.map(id => members[id]).filter(Boolean);
  
  const spouseIds = smap[memberId] || [];
  const spousesList = spouseIds.map(id => members[id]).filter(Boolean);

  return (
    <MemoizedTreeNode 
      member={member} spousesList={spousesList} parent={parent} 
      childrenList={childrenList} generations={generations} 
      members={members} cmap={cmap} smap={smap} engineRef={engineRef} 
    />
  );
};


// ==========================================
// 4. MAIN APPLICATION (THE ENGINE)
// ==========================================
export default function App() {
  const [members, setMembers] = useState({});
  const [loading, setLoading] = useState(true);
  const [awsLoaded, setAwsLoaded] = useState(false);
  const [initialCenterDone, setInitialCenterDone] = useState(false);

  const formPageRef = useRef(null);
  const detailsModalRef = useRef(null);
  const engineRef = useRef({}); 

  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const containerRef = useRef(null);
  const treeWrapperRef = useRef(null);
  const activePointers = useRef(new Map());
  const initialPinchDist = useRef(0);
  const initialPinchScale = useRef(1);

  useEffect(() => {
    document.title = "Trah Poncoharsoyo";
    if (window.AWS) { setAwsLoaded(true); } 
    else if (!document.getElementById('aws-sdk-script')) {
      const awsScript = document.createElement('script');
      awsScript.id = 'aws-sdk-script';
      awsScript.src = "https://cdnjs.cloudflare.com/ajax/libs/aws-sdk/2.1390.0/aws-sdk.min.js";
      awsScript.onload = () => setAwsLoaded(true);
      document.head.appendChild(awsScript);
    }

    const membersRef = firebaseRef(db, 'familyTree');
    const unsubscribe = onValue(membersRef, (snapshot) => {
      const data = snapshot.val() || {};
      setMembers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update Mapping for Children (cmap) & Spouses (smap)
  const { cmap, smap, roots } = useMemo(() => {
    const c = {};
    const s = {};
    const r = [];
    Object.values(members).forEach(m => {
      if (m.parentId) {
        if (!c[m.parentId]) c[m.parentId] = [];
        c[m.parentId].push(m.id);
      } else if (m.spouseOf) {
        if (!s[m.spouseOf]) s[m.spouseOf] = [];
        s[m.spouseOf].push(m.id);
      } else {
        r.push(m.id);
      }
    });
    // Sort children by birthDate
    for (let k in c) {
      c[k].sort((a,b) => new Date(members[a].birthDate||0) - new Date(members[b].birthDate||0));
    }
    return { cmap: c, smap: s, roots: r };
  }, [members]);

  // Hitung Kedalaman Generasi
  const generations = useMemo(() => {
    const gens = {};
    const queue = roots.map(id => ({ id, gen: 1 }));
    while(queue.length > 0) {
      const curr = queue.shift();
      gens[curr.id] = curr.gen;
      
      // Pasangan memiliki generasi yang sama
      const spouses = smap[curr.id] || [];
      spouses.forEach(spId => { gens[spId] = curr.gen; });
      
      // Anak-anak mendapat generasi + 1
      const children = cmap[curr.id] || [];
      children.forEach(cId => { queue.push({ id: cId, gen: curr.gen + 1 }); });
    }
    return gens;
  }, [roots, cmap, smap]);

  const updateTransform = useCallback(() => {
    if (treeWrapperRef.current) {
      const { x, y, scale } = transformRef.current;
      treeWrapperRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    }
  }, []);

  const focusOnMember = useCallback((id, smooth = true, initialFocus = false) => {
    if (!id) return false;
    const el = document.getElementById(`member-${id}`);
    const container = containerRef.current;
    const wrapper = treeWrapperRef.current;

    // Update URL hash untuk share link deep linking
    window.history.replaceState(null, '', `#/member/${id}`);

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
        if (wrapper) wrapper.style.transition = 'none';
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
    engineRef.current = {
      focusOnMember,
      openForm: (m, id, type, url) => formPageRef.current?.openForm(m, id, type, url),
      viewDetails: (id) => detailsModalRef.current?.openModal(id),
      deleteMember: (id) => {
        Modal.confirm({
          title: 'Hapus Anggota?', 
          content: 'Apakah Anda yakin ingin menghapus data ini? Jika memiliki anak atau pasangan, ikatan mereka akan terlepas.',
          okType: 'danger', centered: true, maskClosable: true,
          onOk: async () => {
            try {
              // Menggunakan sistem UPDATE ATOMIK Firebase
              // Jauh lebih handal daripada remove() dan update() terpisah
              const updates = {};
              
              Object.values(members).forEach(child => {
                // Jika yang dihapus adalah parent, lepas ikatan parentId anak-anaknya
                if (child.parentId === id) updates[`${child.id}/parentId`] = null;
                // Jika yang dihapus adalah member utama, lepas ikatan spouseOf pasangannya
                if (child.spouseOf === id) updates[`${child.id}/spouseOf`] = null;
              });
              
              // Hapus anggota itu sendiri (dengan menset root ID-nya menjadi null)
              updates[id] = null;
              
              // Panggil eksekusi 1 kali yang merangkum semua perubahan
              await update(firebaseRef(db, 'familyTree'), updates);
              
              message.success("Anggota berhasil dihapus.");
            } catch (error) {
              message.error("Gagal menghapus: " + error.message);
            }
          }
        });
      }
    };
  }, [focusOnMember, members]);

  // Options Pencarian - Diperbarui agar lebih rapi saat terpilih (selected)
  const searchOptions = useMemo(() => {
    return Object.values(members)
      .map(m => {
        const finalUrl = getValidImageUrl(m);
        const genLabel = generations[m.id] ? `(Gen ${generations[m.id]})` : '';

        return { 
          value: m.id, 
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img 
                src={finalUrl} alt="avatar" 
                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', aspectRatio: '1/1' }} 
              />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontWeight: 600, lineHeight: 1.2, margin: 0 }}>{m.name || "Tanpa Nama"}</span>
                {(genLabel || m.spouseOf) && (
                  <span style={{ fontSize: 11, color: '#64748b', lineHeight: 1.2, marginTop: 2 }}>{genLabel} {m.spouseOf ? '• Pasangan' : ''}</span>
                )}
              </div>
            </div>
          ),
          searchText: (m.name || "").toLowerCase(),
          textLabel: m.name || "Tanpa Nama"
        };
      })
      .sort((a, b) => a.textLabel.localeCompare(b.textLabel));
  }, [members, generations]);

  // Initial Load & Deep Link Handling
  useEffect(() => {
    if (loading || roots.length === 0 || initialCenterDone) return;
    
    // Cek apakah ada Deep Link / Hash di URL saat load pertama
    const hash = window.location.hash;
    let targetId = roots[0];

    if (hash.startsWith('#/member/')) {
      const hashId = hash.replace('#/member/', '');
      if (members[hashId]) {
        targetId = hashId;
      }
    }
    
    const timer = setTimeout(() => {
      const success = focusOnMember(targetId, false, true); 
      if (success) {
         setInitialCenterDone(true);
      }
    }, 300); // Beri sedikit jeda lebih lama agar DOM siap rendering lengkap

    return () => clearTimeout(timer);
  }, [loading, roots, initialCenterDone, focusOnMember, members]);

  // Event Listeners for Zoom/Pan
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
      if (e.target.closest('button') || e.target.closest('.ant-select') || e.target.closest('.ant-dropdown-trigger') || e.target.closest('.relation-link') || e.target.closest('.ant-image-mask')) return;
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

  const resetView = () => {
    if (roots.length > 0) focusOnMember(roots[0], true, true);
  };

  const zoomToCenter = useCallback((scaleChange) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const { x, y, scale } = transformRef.current;
    const newScale = Math.max(0.05, Math.min(scale + scaleChange, 4));
    const newX = centerX - ((centerX - x) * (newScale / scale));
    const newY = centerY - ((centerY - y) * (newScale / scale));
    transformRef.current = { x: newX, y: newY, scale: newScale };
    if (treeWrapperRef.current) {
      treeWrapperRef.current.style.transition = 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)';
      updateTransform();
      setTimeout(() => {
        if (treeWrapperRef.current) treeWrapperRef.current.style.transition = 'none';
      }, 200);
    }
  }, [updateTransform]);


  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#065f46', borderRadius: 12, fontFamily: 'Inter, sans-serif' } }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', backgroundColor: '#F7F7F5' }}>
        
        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
          body { margin: 0; background: #F7F7F5; }
          .form-page-layer { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #F7F7F5; z-index: 9999; display: flex; flex-direction: column; }
          .form-page-header { flex-shrink: 0; display: flex; align-items: center; padding: 16px 24px; background: #fff; border-bottom: 1px solid #e5e5e5; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
          .form-page-body { flex: 1; overflow-y: auto; padding: 24px; }
          .form-page-card { max-width: 600px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
          .form-row-responsive { display: flex; gap: 16px; width: 100%; }
          .app-main-view { display: flex; flex-direction: column; height: 100%; width: 100%; position: relative; }
          .app-header { flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; height: 76px; background: #ffffff !important; z-index: 100; border-bottom: 1px solid rgba(0,0,0,0.05); box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
          .header-main-row { display: flex; align-items: center; gap: 14px; }
          .header-brand { display: flex; align-items: center; gap: 14px; }
          .header-actions { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
          .pill-radio-group { display: flex; width: 100%; background: #f3f4f6; padding: 4px; border-radius: 100px; }
          .pill-radio-group .ant-radio-button-wrapper { flex: 1; text-align: center; background: transparent; border: none; border-radius: 100px !important; height: 38px; line-height: 38px; color: #6b7280; font-weight: 600; padding: 0; }
          .pill-radio-group .ant-radio-button-wrapper-checked { background: #fff !important; color: #065f46 !important; box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important; font-weight: 700; }
          .pill-radio-group .ant-radio-button-wrapper::before { display: none !important; }
          
          /* ======================================================== */
          /* FIX: Styling Khusus Dropdown Select agar Rapi & Tidak Timpa */
          /* ======================================================== */
          .select-search .ant-select-selector { height: 54px !important; display: flex; align-items: center; }
          .select-search .ant-select-selection-item, .select-search .ant-select-selection-placeholder { 
            display: flex !important; 
            align-items: center !important; 
            line-height: normal !important; 
          }
          
          .canvas-container { flex: 1 1 auto; position: relative; width: 100%; overflow: hidden; background-color: #F7F7F5; background-image: radial-gradient(#cbd5e1 1.2px, transparent 1.2px); background-size: 24px 24px; cursor: grab; touch-action: none; user-select: none; -webkit-user-select: none; }
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
          
          .node-content { display: inline-flex; align-items: center; justify-content: center; padding: 0 16px; position: relative; }
          
          /* Spouse Connector Styling */
          .spouse-connector { display: flex; align-items: center; justify-content: center; color: #f43f5e; font-size: 24px; width: 40px; position: relative; }
          .spouse-connector::before { content: ''; position: absolute; height: 2px; width: 100%; background: #f43f5e; z-index: 1; }
          
          .tree-card { width: 220px; background: white; border-radius: 24px; border: 1px solid #e7e5e4; overflow: hidden; position: relative; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); pointer-events: auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .tree-card:hover { transform: translateY(-4px); box-shadow: 0 10px 20px -3px rgba(0, 0, 0, 0.1); }
          
          /* Visual beda untuk pasangan */
          .card-spouse { border: 2px solid #ffe4e6; box-shadow: 0 4px 12px rgba(244, 63, 94, 0.08); }
          
          .card-top { height: 220px; width: 100%; background: #f5f5f4; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
          
          /* ======================================================== */
          /* FIX: Aspect Ratio Image Pada Kartu Harus Konsisten 1:1   */
          /* ======================================================== */
          .card-top .ant-image { width: 100%; height: 100%; display: flex; }
          .card-top .ant-image-img { width: 100% !important; height: 100% !important; object-fit: cover !important; aspect-ratio: 1/1; }
          
          .card-dead { opacity: 0.8; filter: grayscale(70%); }
          .badge-dead { position: absolute; top: 12px; left: 12px; z-index: 10; font-weight: bold; }
          
          .card-bottom { padding: 14px; text-align: center; background: #fff; }
          .card-name { margin: 0; font-weight: 800; font-size: 16px; color: #1c1917; line-height: 1.3; }
          
          /* Tags inside card (Gen, Age, Spouse) */
          .card-tag { font-size: 11px; font-weight: 700; display: inline-block; padding: 3px 10px; border-radius: 20px; border: 1px solid; }
          .gen-tag { color: #047857; background: #d1fae5; border-color: #a7f3d0; }
          .age-tag { color: #4b5563; background: #f3f4f6; border-color: #e5e7eb; }
          .spouse-tag { color: #e11d48; background: #ffe4e6; border-color: #fecdd3; }
          
          .card-relations { padding: 12px 14px; text-align: center; border-top: 1px solid #f3f4f6; background: #fafaf9; }
          .relation-item { margin-bottom: 10px; }
          .relation-item:last-child { margin-bottom: 0; }
          .relation-label { font-weight: 800; color: #9ca3af; display: block; margin-bottom: 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          .relation-children { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
          .relation-link { color: #059669; font-weight: 700; font-size: 11px; cursor: pointer; text-decoration: none; transition: all 0.2s ease; padding: 6px 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; max-width: 100%; white-space: normal; text-align: center; line-height: 1.3; word-break: break-word; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
          .relation-link.parent-link { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
          
          .zoom-controls { position: absolute; bottom: 30px; right: 30px; display: flex; flex-direction: column; gap: 8px; background: rgba(255,255,255,0.9); backdrop-filter: blur(5px); padding: 6px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); z-index: 1000; border: 1px solid rgba(0,0,0,0.05); }
          .highlight-glow { border: 3px solid #10b981 !important; box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.2), 0 10px 25px rgba(0,0,0,0.1) !important; transform: scale(1.05) !important; z-index: 200; }
          
          @media (max-width: 768px) {
            .app-header { flex-direction: column; padding: 12px 16px; height: auto; gap: 12px; align-items: stretch; }
            .header-main-row { display: flex; justify-content: space-between; width: 100%; align-items: center; }
            .header-actions { width: 100%; display: flex; flex-wrap: nowrap; gap: 8px; }
            .header-actions .ant-select.select-search { width: 100% !important; }
            .zoom-controls { bottom: 40px; right: 16px; transform: scale(0.9); transform-origin: bottom right; z-index: 1000; }
            
            .tree-card { width: 170px; border-radius: 16px; }
            .card-top { height: 170px; }
            .card-name { font-size: 14px; }
            .node-content { gap: 0; padding: 0 8px; }
            .spouse-connector { width: 30px; font-size: 18px; }
            
            .tf-tree ul { padding-top: 40px; }
            .tree-node { padding-top: 40px; }
            .tree-children::before { height: 40px; }
            .tree-node::before, .tree-node::after { height: 40px; }
            
            .card-relations { padding: 10px; }
            .relation-link { font-size: 11px; padding: 5px 10px; }
            .form-page-body { padding: 0; background: #fff; }
            .form-page-card { padding: 20px 16px; border-radius: 0; box-shadow: none; min-height: 100%; }
            .form-row-responsive { flex-direction: column; gap: 0; }
          }
        `}} />

        <div id="main-tree-view" className="app-main-view">
          <header className="app-header">
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
                    FAMILY TREE EXPLORER
                  </span>
                </div>
              </div>
            </div>
            
            <div className="header-actions">
              <Select 
                className="select-search" showSearch size="large" placeholder="Cari Anggota..." 
                style={{ width: '100%', minWidth: 260, maxWidth: 400 }} 
                onChange={(id) => {
                  focusOnMember(id);
                  setTimeout(() => { if (document.activeElement) document.activeElement.blur(); }, 10);
                }} 
                options={searchOptions}
                optionLabelProp="label"
                filterOption={(input, option) => (option?.searchText ?? '').includes(input.toLowerCase())}
                suffixIcon={<AimOutlined />} virtual={true}
              />
            </div>
          </header>

          <main className="canvas-container" ref={containerRef}>
            {loading ? (
              <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 40, color: '#059669' }} spin />} />
                <Typography.Text style={{ color: '#059669', fontWeight: 600, marginTop: 16 }}>Memuat Silsilah Keluarga...</Typography.Text>
              </div>
            ) : Object.keys(members).length === 0 ? (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#a8a29e' }}>
                <NodeIndexOutlined style={{ fontSize: 80, marginBottom: 20, opacity: 0.5 }} />
                <Title level={3} style={{ color: '#78716c' }}>Silsilah Masih Kosong</Title>
                <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => formPageRef.current?.openForm()} style={{ marginTop: 20, borderRadius: 16 }}>Mulai Buat Silsilah</Button>
              </div>
            ) : (
              <>
                {!initialCenterDone && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F7F7F5' }}>
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 40, color: '#059669' }} spin />} />
                    <Typography.Text style={{ color: '#059669', fontWeight: 600, marginTop: 16 }}>Menggambar Silsilah...</Typography.Text>
                  </div>
                )}
                <div ref={treeWrapperRef} className="tree-wrapper" style={{ opacity: initialCenterDone ? 1 : 0, transition: 'opacity 0.3s ease-in' }}>
                   <div className="tf-tree">
                     <ul>
                       {roots.map(rootId => (
                         <TreeBuilder 
                            key={rootId} memberId={rootId} members={members} 
                            cmap={cmap} smap={smap} generations={generations}
                            engineRef={engineRef} 
                         />
                       ))}
                     </ul>
                   </div>
                </div>
              </>
            )}
            {!loading && Object.keys(members).length > 0 && initialCenterDone && (
              <div className="zoom-controls">
                <Button type="text" size="large" icon={<ZoomInOutlined />} onClick={() => zoomToCenter(0.15)} />
                <Button type="text" size="large" icon={<AimOutlined />} onClick={resetView} style={{ color: '#059669', background: '#ecfdf5' }} />
                <Button type="text" size="large" icon={<ZoomOutOutlined />} onClick={() => zoomToCenter(-0.15)} />
              </div>
            )}
          </main>
        </div>

        <MemberFormPage 
          ref={formPageRef}
          members={members} searchOptions={searchOptions} awsLoaded={awsLoaded}
        />
        
        <MemberDetailsModal 
          ref={detailsModalRef}
          members={members} generations={generations}
        />
        
      </div>
    </ConfigProvider>
  );
}