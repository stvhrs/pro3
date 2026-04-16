import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layout, Typography, Table, Button, Modal, Form, 
  Input, Select, Space, message, Popconfirm, Tag, Tooltip, Spin, Result, QRCode, Tabs, Card, Row, Col, Statistic, Grid, DatePicker
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  CopyOutlined, LinkOutlined, QrcodeOutlined, GlobalOutlined, SearchOutlined, DatabaseOutlined, LogoutOutlined, UserOutlined, CalendarOutlined
} from '@ant-design/icons';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, push, set, remove, update, get, query, orderByChild, limitToLast, runTransaction, equalTo, increment } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;

// ==========================================
// 1. KONFIGURASI FIREBASE REALTIME DATABASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyANgoNbU3mvcZItj5_y0x581lAkZPQiaVU",
  authDomain: "elkapededigital.firebaseapp.com",
  databaseURL: "https://elkapededigital-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "elkapededigital",
  storageBucket: "elkapededigital.firebasestorage.app",
  messagingSenderId: "921510245995",
  appId: "1:921510245995:web:db96c6ab76c49e8b31a32e",
  measurementId: "G-L6CXY04E12"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// ==========================================
// 1.5 KOMPONEN LOGIN
// ==========================================
const Login = () => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      message.success("Berjaya log masuk!");
    } catch (error) {
      message.error("Gagal log masuk: Periksa e-mel dan kata laluan anda.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: '16px' }}>
      <Card style={{ width: '100%', maxWidth: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 8 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <QrcodeOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          <Title level={3} style={{ margin: '8px 0 0' }}>Log Masuk Admin</Title>
          <Text type="secondary">CMS LKPD Digital QR</Text>
        </div>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="email" label="E-mel" rules={[{ required: true, type: 'email', message: 'Sila masukkan e-mel yang sah!' }]}>
            <Input placeholder="admin@elkapededigital.com" size="large" />
          </Form.Item>
          <Form.Item name="password" label="Kata Laluan" rules={[{ required: true, message: 'Sila masukkan kata laluan!' }]}>
            <Input.Password placeholder="••••••••" size="large" />
          </Form.Item>
          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              Log Masuk
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

// ==========================================
// 2. KOMPONEN REDIRECT (USER VIEW)
// ==========================================
const RedirectHandler = ({ qrId }) => {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const fetchAndRedirect = async () => {
      try {
        const qrRef = ref(db, `qr_links/${qrId}`);
        const snapshot = await get(qrRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          
          const lastScanKey = `scanned_${qrId}`;
          const lastScanTime = localStorage.getItem(lastScanKey);
          const now = Date.now();
          const cooldown = 60 * 1000; // 1 Menit cooldown anti-spam
          
          if (!lastScanTime || now - parseInt(lastScanTime) > cooldown) {
            try {
              let ipAddress = "Tidak diketahui";
              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
                clearTimeout(timeoutId);
                const ipData = await res.json();
                ipAddress = ipData.ip;
              } catch (e) {
                console.warn("Gagal mendapatkan IP, abaikan.");
              }

              const scanLogKey = push(ref(db, `qr_links/${qrId}/scanLogs`)).key;
              const timestampIso = new Date().toISOString();
              
              const updates = {};
              updates[`qr_links/${qrId}/scanCount`] = increment(1);
              updates[`qr_links/${qrId}/lastScannedAt`] = timestampIso;
              updates[`qr_links/${qrId}/scanLogs/${scanLogKey}`] = {
                timestamp: timestampIso,
                userAgent: navigator.userAgent,
                ipAddress: ipAddress 
              };
              
              await update(ref(db), updates);
              localStorage.setItem(lastScanKey, now.toString());
            } catch (e) {
              console.warn("Gagal merekod metrik riwayat.", e);
            }
          }

          // Cek jika targetUrl kosong
          if (data.targetUrl && data.targetUrl.trim() !== '') {
            window.location.replace(data.targetUrl);
          } else {
            setStatus('empty_link');
          }

        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error("Error fetching QR data:", error);
        setStatus('error');
      }
    };
    fetchAndRedirect();
  }, [qrId]);

  if (status === 'error') {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: '16px' }}>
        <Result
          status="404"
          title="Tautan Tidak Ditemukan"
          subTitle="Maaf, Link yang Anda tuju tidak tersedia atau sudah dihapus."
          extra={<Button type="primary" onClick={() => window.location.href = '/'}>Ke Halaman Utama</Button>}
        />
      </div>
    );
  }

  if (status === 'empty_link') {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: '16px' }}>
        <Result
          status="warning"
          title="Konten Belum Tersedia"
          subTitle="Maaf, Pautan (Link) untuk materi ini belum dimasukkan oleh Admin. Silakan cek kembali nanti."
          extra={<Button type="primary" onClick={() => window.location.href = '/'}>Ke Halaman Utama</Button>}
        />
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Spin size="large" />
      <Title level={4} style={{ marginTop: 24, color: '#1890ff' }}>Mengalihkan...</Title>
    </div>
  );
};

// ==========================================
// 3. KOMPONEN MASTER DATA (KELAS & MAPEL)
// ==========================================
const MasterCrudTable = ({ title, dbNode }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const dbRef = ref(db, dbNode);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const dbData = snapshot.val();
      if (dbData) {
        setData(Object.keys(dbData).map(key => ({ id: key, ...dbData[key] })));
      } else {
        setData([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [dbNode]);

  const handleSubmit = async (values) => {
    try {
      if (editingId) {
        await update(ref(db, `${dbNode}/${editingId}`), values);
        message.success(`${title} berjaya dikemas kini!`);
      } else {
        await push(ref(db, dbNode), values);
        message.success(`${title} berjaya ditambah!`);
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await remove(ref(db, `${dbNode}/${id}`));
      message.success('Data berjaya dihapus!');
    } catch (error) {
      message.error(error.message);
    }
  };

  const columns = [
    { title: 'Nama', dataIndex: 'nama', key: 'nama' },
    {
      title: 'Tindakan',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditingId(record.id); form.setFieldsValue(record); setIsModalOpen(true); }} />
          <Popconfirm title="Hapus?" onConfirm={() => handleDelete(record.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }} style={{ marginBottom: 16 }}>Tambah {title}</Button>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 5 }} bordered scroll={{ x: 400 }} />
      
      <Modal title={`${editingId ? 'Edit' : 'Tambah'} ${title}`} open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="nama" label={`Nama ${title}`} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// ==========================================
// 4. KOMPONEN ADMIN CMS (UTAMA)
// ==========================================
const AdminCMS = () => {
  const [form] = Form.useForm();
  const screens = useBreakpoint();
  
  const [masterKelas, setMasterKelas] = useState([]);
  const [masterMapel, setMasterMapel] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalData, setTotalData] = useState(0);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isQrModalVisible, setIsQrModalVisible] = useState(false);
  const [selectedQrRecord, setSelectedQrRecord] = useState(null);
  const [showInlineQr, setShowInlineQr] = useState(false);

  // State untuk Log Riwayat Scan & Analytics (Global & Modal)
  const [isLogModalVisible, setIsLogModalVisible] = useState(false);
  const [scanLogs, setScanLogs] = useState([]);
  const [logDateRange, setLogDateRange] = useState(null); 
  const [globalDateRange, setGlobalDateRange] = useState(null); 

  // State untuk pencarian terpisah
  const [searchKelas, setSearchKelas] = useState('');
  const [searchBab, setSearchBab] = useState('');
  const [searchKeterangan, setSearchKeterangan] = useState('');
  
  // State untuk menyimpan nilai terakhir (Smart Default Form)
  const [lastUsedFormValues, setLastUsedFormValues] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tableFilters, setTableFilters] = useState({});
  const [tableSorter, setTableSorter] = useState({}); 

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString('id-ID', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  useEffect(() => {
    onValue(ref(db, 'master_kelas'), (snap) => {
      const d = snap.val();
      if(d) setMasterKelas(Object.values(d).map(k => k.nama));
    });
    onValue(ref(db, 'master_mapel'), (snap) => {
      const d = snap.val();
      if(d) setMasterMapel(Object.values(d).map(m => m.nama));
    });
    onValue(ref(db, 'metadata/total_qr'), (snap) => {
      setTotalData(snap.val() || 0);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    let dbQuery;
    const linksRef = ref(db, 'qr_links');

    const isSearching = searchBab || searchKeterangan || searchKelas;
    const fetchLimit = isSearching ? 1000 : (currentPage * pageSize) + 50;

    if (!isSearching && tableFilters.kelas && tableFilters.kelas.length > 0) {
      dbQuery = query(linksRef, orderByChild('kelas'), equalTo(tableFilters.kelas[0]), limitToLast(fetchLimit));
    }
    else if (!isSearching && tableFilters.mapel && tableFilters.mapel.length > 0) {
      dbQuery = query(linksRef, orderByChild('mapel'), equalTo(tableFilters.mapel[0]), limitToLast(fetchLimit));
    }
    else {
      dbQuery = query(linksRef, orderByChild('dateCreated'), limitToLast(fetchLimit));
    }

    const unsubscribe = onValue(dbQuery, (snapshot) => {
      const dbData = snapshot.val();
      let formattedData = [];
      if (dbData) {
        formattedData = Object.keys(dbData).map(key => ({ id: key, ...dbData[key] }));
        
        formattedData.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));

        if (searchBab) {
          const keyword = searchBab.toLowerCase();
          formattedData = formattedData.filter(item => item.bab && item.bab.toLowerCase().includes(keyword));
        }

        if (searchKeterangan) {
          const keyword = searchKeterangan.toLowerCase();
          formattedData = formattedData.filter(item => item.keterangan && item.keterangan.toLowerCase().includes(keyword));
        }

        if (searchKelas) {
          const keyword = searchKelas.toLowerCase();
          formattedData = formattedData.filter(item => item.kelas && item.kelas.toLowerCase().includes(keyword));
        }

        if (tableFilters.semester && tableFilters.semester.length > 0) {
          formattedData = formattedData.filter(item => tableFilters.semester.includes(item.semester));
        }
        
        if (isSearching) {
            if (tableFilters.kelas && tableFilters.kelas.length > 0) {
                formattedData = formattedData.filter(item => item.kelas === tableFilters.kelas[0]);
            }
            if (tableFilters.mapel && tableFilters.mapel.length > 0) {
                formattedData = formattedData.filter(item => item.mapel === tableFilters.mapel[0]);
            }
        }
      }
      
      setData(formattedData);
      setLoading(false);
    }, (error) => {
      message.error("Gagal memuatkan data: " + error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [searchBab, searchKeterangan, searchKelas, currentPage, pageSize, tableFilters]);

  // Kalkulasi Analitik Global berdasarkan Date Range
  const globalMetrics = useMemo(() => {
    let totalScans = 0;
    let uniqueIps = new Set();

    data.forEach(item => {
      if (!globalDateRange || globalDateRange.length === 0 || !globalDateRange[0] || !globalDateRange[1]) {
        totalScans += (item.scanCount || 0);
        if (item.scanLogs) {
          Object.values(item.scanLogs).forEach(log => {
             uniqueIps.add(log.ipAddress || log.userAgent);
          });
        }
      } else {
        const [start, end] = globalDateRange;
        if (item.scanLogs) {
          Object.values(item.scanLogs).forEach(log => {
            const logTime = new Date(log.timestamp).getTime();
            if (logTime >= start.startOf('day').valueOf() && logTime <= end.endOf('day').valueOf()) {
              totalScans++;
              uniqueIps.add(log.ipAddress || log.userAgent);
            }
          });
        }
      }
    });

    return { totalScans, uniqueVisitors: uniqueIps.size };
  }, [data, globalDateRange]);


  const handleTableChange = (pagination, filters, sorter) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
    setTableFilters(filters);
    setTableSorter(sorter); 
  };

  const handleOpenModal = (record = null) => {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue(record);
    } else {
      setEditingId(null);
      form.resetFields();
      
      // Kembalikan nilai default sebelumnya jika ada
      if (lastUsedFormValues) {
        form.setFieldsValue({
          kelas: lastUsedFormValues.kelas,
          semester: lastUsedFormValues.semester,
          mapel: lastUsedFormValues.mapel
        });
      }
    }
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingId(null);
  };

  const handleSubmit = async (values) => {
    try {
      const timestamp = new Date().toISOString();
      
      // Selesaikan isu Firebase "undefined" dengan menetapkan nilai lalai "" (string kosong)
      const safeValues = {
        ...values,
        keterangan: values.keterangan || "",
        targetUrl: values.targetUrl || ""
      };
      
      if (editingId) {
        const oldData = data.find(d => d.id === editingId);
        const updates = {};
        updates[`qr_links/${editingId}`] = {
          ...safeValues, 
          lastEdited: timestamp,
          dateCreated: oldData?.dateCreated || timestamp
        };
        await update(ref(db), updates);
        message.success('Data berjaya dikemas kini!');
      } else {
        const newLinkRef = push(ref(db, 'qr_links'));
        await set(newLinkRef, { 
          ...safeValues, 
          dateCreated: timestamp, 
          lastEdited: timestamp 
        });
        await runTransaction(ref(db, 'metadata/total_qr'), (current) => (current || 0) + 1);
        
        // Simpan nilai untuk kegunaan pengisian seterusnya
        setLastUsedFormValues({
          kelas: safeValues.kelas,
          semester: safeValues.semester,
          mapel: safeValues.mapel
        });

        message.success('Data baru berjaya ditambah!');
      }
      handleCloseModal();
    } catch (error) {
      message.error('Ralat: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await remove(ref(db, `qr_links/${id}`));
      await runTransaction(ref(db, 'metadata/total_qr'), (current) => Math.max((current || 1) - 1, 0));
      message.success('Data berjaya dihapus!');
    } catch (error) {
      message.error('Gagal menghapus: ' + error.message);
    }
  };

  const handleCopyLink = (id) => {
    const localUrl = `https://elkapededigital.web.app/${id}`;
    
    const textArea = document.createElement("textarea");
    textArea.value = localUrl;
    
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    
    document.body.appendChild(textArea);
    textArea.focus(); 
    textArea.select();
    
    try { 
      document.execCommand('copy'); 
      message.success('Pautan berjaya disalin!'); 
    } catch (err) { 
      message.error('Gagal menyalin pautan.'); 
      console.error(err);
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const handleViewLogs = (record) => {
    setSelectedQrRecord(record);
    const logsObj = record.scanLogs || {};
    const logsArr = Object.keys(logsObj).map(k => ({ id: k, ...logsObj[k] }));
    logsArr.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    setScanLogs(logsArr);
    setLogDateRange(globalDateRange); // Wariskan filter dari Dashboard jika ada
    setIsLogModalVisible(true);
  };

  const filteredLogs = useMemo(() => {
    if (!logDateRange || logDateRange.length === 0 || !logDateRange[0] || !logDateRange[1]) {
      return scanLogs;
    }
    const [start, end] = logDateRange;
    return scanLogs.filter(log => {
      const logTime = new Date(log.timestamp).getTime();
      return logTime >= start.startOf('day').valueOf() && logTime <= end.endOf('day').valueOf();
    });
  }, [scanLogs, logDateRange]);

  const uniqueVisitors = useMemo(() => {
    const uniqueIps = new Set(filteredLogs.map(log => log.ipAddress || log.userAgent));
    return uniqueIps.size;
  }, [filteredLogs]);

  const columns = [
    ...(showInlineQr ? [{
      title: 'QR Code',
      key: 'inline_qr',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <QRCode value={`https://elkapededigital.web.app/${record.id}`} size={80} errorLevel="M" />
        </div>
      )
    }] : []),
    {
      title: 'Kelas', dataIndex: 'kelas', key: 'kelas',
      filters: masterKelas.map(k => ({ text: k, value: k })),
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Semester', dataIndex: 'semester', key: 'semester',
      filters: [{ text: 'Ganjil', value: 'Ganjil' }, { text: 'Genap', value: 'Genap' }, { text: 'Tahunan', value: 'Tahunan' }],
    },
    {
      title: 'Mapel', dataIndex: 'mapel', key: 'mapel',
      filters: masterMapel.map(m => ({ text: m, value: m })),
    },
    { title: 'Bab', dataIndex: 'bab', key: 'bab', sorter: true },
    { title: 'Keterangan', dataIndex: 'keterangan', key: 'keterangan', ellipsis: true, sorter: true },
    {
      title: 'Pautan Sasaran', dataIndex: 'targetUrl', key: 'targetUrl',
      sorter: true,
      render: (url) => (
        url ? (
          <Tooltip title={url}>
            <a href={url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <GlobalOutlined /> {url?.length > 20 ? url.substring(0, 20) + '...' : url}
            </a>
          </Tooltip>
        ) : (
          <Tag color="error">Kosong</Tag>
        )
      )
    },
    {
      title: 'Total Scan', dataIndex: 'scanCount', key: 'scanCount', sorter: true, width: 120, align: 'center',
      render: (val, record) => {
        let displayCount = val || 0;
        
        // Sesuaikan angka pada tabel jika Filter Analitik Global sedang aktif
        if (globalDateRange && globalDateRange.length === 2 && globalDateRange[0] && globalDateRange[1]) {
          const [start, end] = globalDateRange;
          const logsObj = record.scanLogs || {};
          displayCount = Object.values(logsObj).filter(log => {
             const logTime = new Date(log.timestamp).getTime();
             return logTime >= start.startOf('day').valueOf() && logTime <= end.endOf('day').valueOf();
          }).length;
        }

        return (
          <Tooltip title="Klik untuk lihat Analitik & Riwayat">
            <Tag color="green" style={{ cursor: 'pointer', padding: '0 8px' }} onClick={() => handleViewLogs(record)}>
              {displayCount} kali
            </Tag>
          </Tooltip>
        );
      }
    },
    {
      title: 'Dibuat Pada', dataIndex: 'dateCreated', key: 'dateCreated', sorter: true, width: 140,
      render: (val) => formatDate(val)
    },
    {
      title: 'Terakhir Diedit', dataIndex: 'lastEdited', key: 'lastEdited', sorter: true, width: 140,
      render: (val) => formatDate(val)
    },
    {
      title: 'Tindakan', key: 'action', fixed: 'right', width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Kod QR"><Button type="dashed" size="small" icon={<QrcodeOutlined />} onClick={() => { setSelectedQrRecord(record); setIsQrModalVisible(true); }} /></Tooltip>
          <Tooltip title="Salin"><Button type="dashed" size="small" icon={<CopyOutlined />} onClick={() => handleCopyLink(record.id)} /></Tooltip>
          <Tooltip title="Edit"><Button type="primary" size="small" ghost icon={<EditOutlined />} onClick={() => handleOpenModal(record)} /></Tooltip>
          <Popconfirm title="Hapus?" onConfirm={() => handleDelete(record.id)} okButtonProps={{ danger: true }}>
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const isSearching = searchBab || searchKeterangan || searchKelas;
  const isFiltering = isSearching || Object.values(tableFilters).some(v => v && v.length > 0);
  const displayTotal = isFiltering ? data.length : totalData;
  const statisticTitle = isFiltering ? "Hasil Carian/Tapis" : "Jumlah Pautan QR";

  let displayData = [...data];
  const currentSorter = Array.isArray(tableSorter) ? tableSorter[0] : tableSorter;
  
  if (currentSorter && currentSorter.field && currentSorter.order) {
    displayData.sort((a, b) => {
      const valA = a[currentSorter.field] || '';
      const valB = b[currentSorter.field] || '';
      
      if (currentSorter.field === 'targetUrl') {
        if (!valA && valB) return currentSorter.order === 'ascend' ? -1 : 1;
        if (valA && !valB) return currentSorter.order === 'ascend' ? 1 : -1;
      }

      if (currentSorter.field === 'scanCount') {
        const getCount = (item) => {
          if (globalDateRange && globalDateRange[0] && globalDateRange[1]) {
            const [start, end] = globalDateRange;
            const logsObj = item.scanLogs || {};
            return Object.values(logsObj).filter(log => {
              const logTime = new Date(log.timestamp).getTime();
              return logTime >= start.startOf('day').valueOf() && logTime <= end.endOf('day').valueOf();
            }).length;
          }
          return item.scanCount || 0;
        };
        const numA = getCount(a);
        const numB = getCount(b);
        return currentSorter.order === 'ascend' ? numA - numB : numB - numA;
      }

      if (currentSorter.field === 'dateCreated' || currentSorter.field === 'lastEdited') {
        const dateA = valA ? new Date(valA).getTime() : 0;
        const dateB = valB ? new Date(valB).getTime() : 0;
        return currentSorter.order === 'ascend' ? dateA - dateB : dateB - dateA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (strA < strB) return currentSorter.order === 'ascend' ? -1 : 1;
      if (strA > strB) return currentSorter.order === 'ascend' ? 1 : -1;
      return 0;
    });
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      message.success("Anda telah log keluar.");
    } catch (error) {
      message.error("Ralat ketika log keluar.");
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{ background: '#fff', padding: screens.xs ? '0 16px' : '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px #f0f1f2' }}>
        <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <QrcodeOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '12px', minWidth: '24px' }} />
          <Title level={screens.xs ? 4 : 3} style={{ margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            LKPD QR CMS
          </Title>
        </div>
        <Button danger type={screens.xs ? "default" : "primary"} icon={<LogoutOutlined />} onClick={handleLogout}>
          {!screens.xs && "Log Keluar"}
        </Button>
      </Header>
      
      <Content style={{ padding: screens.xs ? '16px 12px' : '24px', margin: 0 }}>
        <Tabs type="card" items={[
          {
            key: '1',
            label: 'Data QR Redirect',
            children: (
              <div style={{ background: '#fff', padding: screens.xs ? '16px' : '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                
                {/* --- BAGIAN STATISTIK GLOBAL --- */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  <Col xs={24} md={8}>
                    <Card size="small" style={{ height: '100%' }}>
                      <Statistic 
                        title={statisticTitle} 
                        value={displayTotal} 
                        prefix={isFiltering ? <SearchOutlined /> : <DatabaseOutlined />} 
                        valueStyle={{ color: isFiltering ? '#cf1322' : '#3f51b5' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f', height: '100%' }}>
                      <Statistic 
                        title={globalDateRange ? "Total Scan (Dalam Rentang)" : "Total Keseluruhan Scan"} 
                        value={globalMetrics.totalScans} 
                        prefix={<QrcodeOutlined />} 
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card size="small" style={{ background: '#e6f7ff', borderColor: '#91d5ff', height: '100%' }}>
                      <Statistic 
                        title={globalDateRange ? "Pengunjung Unik (Dalam Rentang)" : "Pengunjung Unik Global"} 
                        value={globalMetrics.uniqueVisitors} 
                        prefix={<UserOutlined />} 
                        valueStyle={{ color: '#096dd9' }}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* --- BAGIAN FILTER & ALAT --- */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <Space wrap style={{ flex: '1 1 auto' }}>
                    <Text strong><CalendarOutlined /> Filter Analitik:</Text>
                    <RangePicker 
                      onChange={(dates) => setGlobalDateRange(dates)} 
                      style={{ width: screens.xs ? '100%' : '260px' }}
                      allowClear
                      placeholder={["Mulai Tgl", "Sampai Tgl"]}
                    />
                  </Space>

                  <Space wrap style={{ flex: '1 1 auto', justifyContent: screens.md ? 'flex-end' : 'flex-start' }}>
                    <Input 
                      placeholder="Cari Kelas..." 
                      prefix={<SearchOutlined style={{color: '#bfbfbf'}}/>} 
                      allowClear
                      onChange={(e) => {
                        setSearchKelas(e.target.value);
                        setCurrentPage(1);
                      }}
                      style={{ width: screens.xs ? '100%' : '120px' }}
                    />
                    <Input 
                      placeholder="Cari Bab..." 
                      prefix={<SearchOutlined style={{color: '#bfbfbf'}}/>} 
                      allowClear
                      onChange={(e) => {
                        setSearchBab(e.target.value);
                        setCurrentPage(1);
                      }}
                      style={{ width: screens.xs ? '100%' : '130px' }}
                    />
                    <Input 
                      placeholder="Cari Keterangan..." 
                      prefix={<SearchOutlined style={{color: '#bfbfbf'}}/>} 
                      allowClear
                      onChange={(e) => {
                        setSearchKeterangan(e.target.value);
                        setCurrentPage(1);
                      }}
                      style={{ width: screens.xs ? '100%' : '140px' }}
                    />
                    <Button 
                      type={showInlineQr ? "primary" : "default"} 
                      danger={showInlineQr}
                      icon={<QrcodeOutlined />} 
                      onClick={() => setShowInlineQr(!showInlineQr)} 
                    >
                      {showInlineQr ? "Sembunyikan QR" : "Tampilkan QR"}
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
                      Tambah Tautan
                    </Button>
                  </Space>
                </div>

                <Table 
                  columns={columns} 
                  dataSource={isSearching ? displayData : displayData.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                  rowKey="id" 
                  loading={loading}
                  onChange={handleTableChange}
                  pagination={{ 
                    current: currentPage, 
                    pageSize: pageSize, 
                    total: isFiltering ? data.length : totalData,
                    showSizeChanger: true,
                    size: screens.xs ? 'small' : 'default'
                  }}
                  scroll={{ x: 1300 }}
                  bordered
                  size={screens.xs ? 'small' : 'default'}
                />
              </div>
            )
          },
          {
            key: '2',
            label: 'Master Kelas',
            children: <div style={{ background: '#fff', padding: screens.xs ? '16px' : '24px', borderRadius: '8px' }}><MasterCrudTable title="Kelas" dbNode="master_kelas" /></div>
          },
          {
            key: '3',
            label: 'Master Mapel',
            children: <div style={{ background: '#fff', padding: screens.xs ? '16px' : '24px', borderRadius: '8px' }}><MasterCrudTable title="Mata Pelajaran" dbNode="master_mapel" /></div>
          }
        ]} />
      </Content>

      <Modal title={editingId ? "Edit Pautan" : "Tambah Pautan Baru"} open={isModalVisible} onCancel={handleCloseModal} footer={null} destroyOnClose style={{ top: 20 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="kelas" label="Kelas Master" rules={[{ required: true }]}>
            <Select placeholder="Pilih Kelas" showSearch>
              {masterKelas.map(k => <Option key={k} value={k}>{k}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="semester" label="Semester" rules={[{ required: true }]}>
            <Select placeholder="Pilih Semester">
              <Option value="Ganjil">Ganjil</Option>
              <Option value="Genap">Genap</Option>
              <Option value="Tahunan">Tahunan</Option>
            </Select>
          </Form.Item>
          <Form.Item name="mapel" label="Mata Pelajaran Master" rules={[{ required: true }]}>
            <Select placeholder="Pilih Mapel" showSearch>
              {masterMapel.map(m => <Option key={m} value={m}>{m}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="bab" label="Bab / Materi" rules={[{ required: true }]}>
            <Input placeholder="Masukkan nama Bab" />
          </Form.Item>
          
          {/* KETERANGAN TIDAK ADA RULES (OPSIONAL) */}
          <Form.Item name="keterangan" label="Keterangan">
            <Input.TextArea rows={2} placeholder="Keterangan opsional" />
          </Form.Item>
          
          {/* TARGET URL TIDAK ADA RULES (OPSIONAL) */}
          <Form.Item name="targetUrl" label="Pautan Sasaran Redirect">
            <Input prefix={<LinkOutlined />} placeholder="https://domain.com/file (Boleh dibiarkan kosong)" />
          </Form.Item>
          
          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <Space><Button onClick={handleCloseModal}>Batal</Button><Button type="primary" htmlType="submit">Simpan Data</Button></Space>
          </div>
        </Form>
      </Modal>

      <Modal title="Kod QR & Pautan" open={isQrModalVisible} onCancel={() => setIsQrModalVisible(false)} footer={[
          <Button key="download" type="primary" onClick={() => {
            const canvas = document.getElementById('qr-code-canvas')?.querySelector('canvas');
            if (canvas) {
              const a = document.createElement('a');
              a.download = `QR_${selectedQrRecord?.mapel}_${selectedQrRecord?.bab}.png`;
              a.href = canvas.toDataURL();
              a.click();
            }
          }}>Muat Turun PNG</Button>,
          <Button key="close" onClick={() => setIsQrModalVisible(false)}>Tutup</Button>
        ]}>
        <div id="qr-code-canvas" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', overflow: 'hidden' }}>
          {selectedQrRecord && (
            <>
              <QRCode value={`https://elkapededigital.web.app/${selectedQrRecord.id}`} size={220} errorLevel="M" />
              <Text style={{ marginTop: 16, textAlign: 'center' }} strong>{selectedQrRecord.mapel} - {selectedQrRecord.bab}</Text>
              <Text type="secondary">Kelas {selectedQrRecord.kelas} / Semester {selectedQrRecord.semester}</Text>
            </>
          )}
        </div>
      </Modal>

      <Modal title={`Analitik Scan: ${selectedQrRecord?.mapel} - ${selectedQrRecord?.bab}`} open={isLogModalVisible} onCancel={() => setIsLogModalVisible(false)} footer={null} width={800}>
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>Filter Tanggal Scan:</Text>
          <RangePicker 
            onChange={(dates) => setLogDateRange(dates)} 
            style={{ width: '100%', maxWidth: '400px' }}
            allowClear
            value={logDateRange}
          />
        </div>
        
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
              <Statistic title="Total Scan (Dalam Rentang)" value={filteredLogs.length} prefix={<QrcodeOutlined />} />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" style={{ background: '#e6f7ff', borderColor: '#91d5ff' }}>
              <Statistic title="Pengunjung Unik (Berdasarkan IP)" value={uniqueVisitors} prefix={<UserOutlined />} />
            </Card>
          </Col>
        </Row>

        <Table 
          dataSource={filteredLogs} 
          rowKey="id" 
          size="small"
          pagination={{ pageSize: 5 }}
          scroll={{ x: 600 }}
          columns={[
            { title: 'Waktu Scan', dataIndex: 'timestamp', width: 150, render: val => formatDate(val) },
            { title: 'Alamat IP', dataIndex: 'ipAddress', width: 140, render: val => <Tag color="geekblue">{val || 'Tidak diketahui'}</Tag> },
            { title: 'Perangkat / Browser', dataIndex: 'userAgent', ellipsis: true }
          ]}
        />
      </Modal>
    </Layout>
  );
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.hash);
  const [currentPath] = useState(window.location.pathname);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const handleHashChange = () => setCurrentRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      unsubscribeAuth();
    };
  }, []);

  if (currentPath !== '/' && currentPath.length > 1 && !currentPath.includes('.')) {
    return <RedirectHandler qrId={currentPath.substring(1)} />;
  }

  if (currentRoute.startsWith('#/qr/')) {
    return <RedirectHandler qrId={currentRoute.replace('#/qr/', '')} />;
  }

  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <AdminCMS />;
}