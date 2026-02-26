import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Activity, History, Play, FolderArchive, Users, Eye, 
  StopCircle, Download, GraduationCap, Clock, MessageCircle, Phone,
  MonitorPlay, Check, CheckCircle, X, AlertTriangle, ArrowLeft
} from 'lucide-react';
import { addDoc, updateDoc, onSnapshot, query, where, serverTimestamp, getDoc } from "firebase/firestore";
import { getPublicCol, getPublicDoc } from "../../config/firebase";
import { updateURL, formatIndoDate } from "../../utils/helpers";
import { getExamHTMLTemplate, printExamPDF, downloadRawHTML } from "../../utils/pdfEngine";
import { useSnackbar, Snackbar } from "../../utils/hook";
import { Button, Card, Input, Select, Modal, DataLoading } from "../../components/UI";
import { Breadcrumbs } from "../../components/Layout";
import { CountdownDisplay } from "../../components/Timer";
import { ContentRenderer } from "../../components/RichEditor"; // Pastikan ini diimport untuk render soal

// ==========================================
// INTERNAL COMPONENT: SIMULATION ENGINE
// ==========================================
const SimulationRunner = ({ packet, onClose }) => {
  const [answers, setAnswers] = useState({});
  const [stage, setStage] = useState('working'); // 'working' | 'result'
  const [score, setScore] = useState(0);

  // Scroll ke atas saat init
  useEffect(() => window.scrollTo(0,0), []);

  const handleAnswer = (qId, val) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const calculateScore = () => {
    let rawScore = 0;
    let maxScore = 0;

    packet.questions.forEach(q => {
        const userAns = answers[q.id];
        
        // Logika Penilaian Sederhana
        if (q.type === 'PG') { 
            maxScore += 10; 
            if (userAns === q.answer) rawScore += 10; 
        } 
        else if (q.type === 'PGK') {
            maxScore += 10;
            // Logika PGK: Jika jawaban siswa (array) sama persis/mengandung kunci
            if (Array.isArray(userAns) && Array.isArray(q.answer)) {
                // Hitung irisan yang benar
                const correctPicks = userAns.filter(a => q.answer.includes(a)).length;
                // Penilaian proporsional (bisa disesuaikan)
                if(q.answer.length > 0) rawScore += (correctPicks / q.answer.length) * 10;
            }
        }
        else if (q.type === 'MTF' || q.type === 'MATCH' || q.type === 'ESSAY') {
             maxScore += 10;
             // Untuk simulasi cepat, kita anggap Essay benar jika mengandung kata kunci
             if(q.type === 'ESSAY' && userAns && q.answer) {
                 const keywords = q.answer.toLowerCase().split(',').map(s=>s.trim());
                 if(keywords.some(k => userAns.toLowerCase().includes(k))) rawScore += 10;
             }
             // MTF/MATCH scoring simplified
             // (Implementasi detail scoring bisa disamakan dengan StudentDashboard)
        }
    });

    const finalScore = maxScore === 0 ? 0 : (rawScore / maxScore) * 100;
    setScore(finalScore);
    setStage('result');
    window.scrollTo(0,0);
  };

  if (stage === 'result') {
    return (
      <div className="fixed inset-0 z-[60] bg-slate-50 overflow-y-auto animate-in fade-in duration-300">
         <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full">
                <div className="mb-6">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">Simulasi Selesai</h2>
                    <p className="text-slate-500 text-sm">Berikut adalah hasil pengerjaan Anda</p>
                </div>

                <div className="py-6 border-t border-b border-slate-100 mb-6">
                    <div className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-2">Nilai Akhir</div>
                    <div className="text-6xl font-black text-emerald-600">{score.toFixed(0)}</div>
                </div>

                <div className="space-y-3">
                    <Button onClick={() => printExamPDF(packet.title, packet, "GURU (SIMULASI)", answers, true, score)} variant="outline" icon={Download} className="w-full">
                        Download LJK & Nilai
                    </Button>
                    <Button onClick={onClose} variant="primary" className="w-full">
                        Tutup Simulasi
                    </Button>
                </div>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-slate-50 overflow-y-auto animate-in slide-in-from-bottom-10 duration-300">
        {/* Header Simulasi */}
        <div className="sticky top-0 bg-slate-900 text-white p-4 shadow-lg z-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-lg"><MonitorPlay size={20}/></div>
                <div>
                    <div className="font-bold text-sm">Mode Simulasi</div>
                    <div className="text-xs text-slate-400">{packet.title}</div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="bg-slate-800 px-3 py-1 rounded text-xs font-mono hidden sm:block">Timer tidak aktif</div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
            </div>
        </div>

        {/* Content Soal (Mirip StudentDashboard) */}
        <div className="max-w-4xl mx-auto p-6 pb-32">
            <div className="space-y-8">
                {packet.questions.map((q, i) => (
                    <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center gap-3">
                             <span className="bg-slate-800 text-white w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm">{i+1}</span>
                             <span className="text-xs font-bold text-slate-400 uppercase">{q.type}</span>
                        </div>
                        <div className="p-6">
                            <div className="text-slate-800 mb-6 font-medium leading-relaxed">
                                <ContentRenderer html={q.question} />
                            </div>
                            
                            {/* Opsi Jawaban */}
                            <div className="space-y-3">
                                {q.type === 'PG' && q.options.map((opt, idx) => (
                                    <label key={idx} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-slate-50 ${answers[q.id] === opt ? 'bg-emerald-50 border-emerald-500' : 'border-slate-100'}`}>
                                        <input type="radio" name={`q-${q.id}`} className="mt-1" checked={answers[q.id] === opt} onChange={()=>handleAnswer(q.id, opt)}/>
                                        <div className="flex-1 text-sm"><ContentRenderer html={opt}/></div>
                                    </label>
                                ))}
                                
                                {q.type === 'PGK' && q.options.map((opt, idx) => {
                                    const current = answers[q.id] || [];
                                    const checked = current.includes(opt);
                                    return (
                                        <label key={idx} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-slate-50 ${checked ? 'bg-emerald-50 border-emerald-500' : 'border-slate-100'}`}>
                                            <input type="checkbox" className="mt-1" checked={checked} onChange={()=>{
                                                const newVal = checked ? current.filter(x=>x!==opt) : [...current, opt];
                                                handleAnswer(q.id, newVal);
                                            }}/>
                                            <div className="flex-1 text-sm"><ContentRenderer html={opt}/></div>
                                        </label>
                                    );
                                })}

                                {q.type === 'ESSAY' && (
                                    <textarea 
                                        className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-emerald-500 outline-none" 
                                        rows={4} 
                                        placeholder="Ketik jawaban simulasi..."
                                        value={answers[q.id] || ''}
                                        onChange={e => handleAnswer(q.id, e.target.value)}
                                    />
                                )}
                                
                                {/* Fallback untuk tipe lain (MTF/MATCH) agar tidak error */}
                                {(q.type === 'MTF' || q.type === 'MATCH') && (
                                    <div className="text-xs text-slate-400 italic p-2 border border-dashed rounded bg-slate-50">
                                        Interaksi tipe soal ini disederhanakan di mode simulasi.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Footer Submit */}
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-50">
             <div className="max-w-4xl mx-auto flex justify-between items-center">
                 <div className="text-sm text-slate-500 hidden sm:block">Pastikan semua soal terjawab.</div>
                 <div className="flex gap-3 w-full sm:w-auto">
                     <Button variant="ghost" onClick={onClose} className="flex-1 sm:flex-none">Batal</Button>
                     <Button variant="primary" onClick={() => { if(window.confirm("Selesai simulasi dan lihat nilai?")) calculateScore(); }} className="flex-1 sm:flex-none shadow-lg shadow-emerald-500/20">
                         Submit & Lihat Nilai
                     </Button>
                 </div>
             </div>
        </div>
    </div>
  );
};


// ==========================================
// MAIN COMPONENT: TEACHER DASHBOARD
// ==========================================
const TeacherDashboard = ({ onGoHome, user }) => {
  const [view, setView] = useState('browse'); 
  const [activeTab, setActiveTab] = useState('browse'); 
  const [packets, setPackets] = useState([]);
  const [localSessions, setLocalSessions] = useState([]);
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPkt, setSelectedPkt] = useState(null);
  const [form, setForm] = useState({teacher:'', school:''});
  const [customDuration, setCustomDuration] = useState(60); 
  const [filterMapel, setFilterMapel] = useState('All');
  const [filterKelas, setFilterKelas] = useState('All');
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  
  // STATE BARU: Untuk Simulasi Lokal
  const [simulationPacket, setSimulationPacket] = useState(null);

  const { snackbar, showToast, closeToast } = useSnackbar();

  // Load Data
  useEffect(() => {
    const savedSessions = localStorage.getItem('elkapede_teacher_sessions');
    if (savedSessions) setLocalSessions(JSON.parse(savedSessions));

    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('roomId');
    if (roomId) {
        getDoc(getPublicDoc("rooms", roomId)).then(doc => { if (doc.exists()) { setRoom({ id: doc.id, ...doc.data() }); setView('lobby'); } });
    }
    
    const unsub = onSnapshot(getPublicCol("packets"), s => {
        setPackets(s.docs.map(d=>({id:d.id,...d.data()})));
        setIsFetching(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (room?.id) {
       updateURL({ role: 'teacher', roomId: room.id });
       const uPlayers = onSnapshot(query(getPublicCol("players"), where("roomId","==",room.id)), s => setPlayers(s.docs.map(d=>({id:d.id,...d.data()}))));
       const uRoom = onSnapshot(getPublicDoc("rooms", room.id), d => {
           if(d.exists()) {
               const data = d.data();
               setRoom(prev => ({...prev, ...data}));
               if(data.status === 'FINISHED') updateLocalSessionStatus(room.id, 'FINISHED');
           }
       });
       return () => { uPlayers(); uRoom(); };
    }
  }, [room?.id]);

  const updateLocalSessionStatus = (roomId, newStatus) => {
      setLocalSessions(prev => {
          const updated = prev.map(s => s.id === roomId ? { ...s, status: newStatus } : s);
          localStorage.setItem('elkapede_teacher_sessions', JSON.stringify(updated));
          return updated;
      });
  };

  const uniqueMapels = ['All', ...new Set(packets.map(p => p.mapel).filter(Boolean))];
  const uniqueClasses = ['All', ...new Set(packets.map(p => p.kelas).filter(Boolean))].sort();
  const filteredPackets = packets.filter(p => (filterMapel==='All'||p.mapel===filterMapel) && (filterKelas==='All'||p.kelas===filterKelas));

  const activeSessions = localSessions.filter(r => r.status !== 'FINISHED').sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  const finishedSessions = localSessions.filter(r => r.status === 'FINISHED').sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const createRoom = async () => {
     if(!form.school || !form.teacher) return showToast("Lengkapi data Guru dan Sekolah!", 'error');
     setLoading(true);
     try {
       const code = Math.random().toString(36).substring(2,8).toUpperCase();
       const { id, ...packetData } = selectedPkt; 
       const now = serverTimestamp();
       
       const newRoomData = { 
           ...packetData, 
           code, 
           packetId: selectedPkt.id, 
           packetTitle: selectedPkt.title, 
           teacherId: user.uid, 
           teacherName: form.teacher, 
           schoolName: form.school, 
           status: 'WAITING', 
           createdAt: now, 
           duration: customDuration, 
       };
       
       const ref = await addDoc(getPublicCol("rooms"), newRoomData);
       const localRoomData = {
           id: ref.id,
           ...newRoomData,
           createdAt: { seconds: Date.now() / 1000 } 
       };

       const newLocalSessions = [localRoomData, ...localSessions];
       setLocalSessions(newLocalSessions);
       localStorage.setItem('elkapede_teacher_sessions', JSON.stringify(newLocalSessions));

       setRoom(localRoomData);
       setView('lobby'); 
       setShowModal(false);
       showToast("Ruang ujian berhasil dibuat!");
     } catch(e) { showToast("Gagal membuat room: " + e.message, 'error'); } 
     finally { setLoading(false); }
  };

  const endSession = async () => {
      if(!room) return;
      if(!window.confirm("Akhiri sesi ujian? Siswa tidak akan bisa mengerjakan lagi.")) return;
      
      updateLocalSessionStatus(room.id, 'FINISHED');
      try {
          await updateDoc(getPublicDoc("rooms", room.id), { status: 'FINISHED' });
          showToast("Sesi diakhiri.");
      } catch(e) { console.error("Firestore Error", e); }
  };

  const copyLink = async () => {
     const url = `${window.location.origin}${window.location.pathname}?code=${room.code}`;
     try {
       await navigator.clipboard.writeText(url);
       setLinkCopied(true);
       setTimeout(() => setLinkCopied(false), 3000); 
     } catch(e) { showToast("Gagal menyalin link.", 'error'); }
  };

  // Batch Download Logic
  const handleBatchDownload = async () => {
      if (!window.JSZip || !window.saveAs || !window.html2canvas || !window.jspdf) {
          return showToast("Library PDF/ZIP sedang dimuat. Silakan tunggu & coba lagi.", 'info');
      }

      const submittedPlayers = players.filter(p => p.status === 'submitted');
      if (submittedPlayers.length === 0) return showToast("Belum ada siswa yang mengumpulkan.", 'error');

      setLoading(true);
      showToast(`Memulai proses generate ${submittedPlayers.length} file PDF... Mohon tunggu.`, 'info');

      const zip = new window.JSZip();
      const container = document.createElement('div');
      container.style.position = 'fixed'; container.style.top = '-9999px'; container.style.left = '0';
      container.style.width = '210mm'; container.style.minHeight = '297mm';
      container.style.backgroundColor = 'white'; container.style.padding = '20px'; container.style.zIndex = '-100';
      document.body.appendChild(container);

      try {
          const { jsPDF } = window.jspdf;
          for (let i = 0; i < submittedPlayers.length; i++) {
              const p = submittedPlayers[i];
              let htmlContent = getExamHTMLTemplate(room.packetTitle, {questions: room.questions, ...room}, p.name, p.answers, true, p.score);
              container.innerHTML = htmlContent;

              if (window.katex) {
                  // Math Rendering logic if needed
              }

              await new Promise(r => setTimeout(r, 500));
              const canvas = await window.html2canvas(container, { scale: 1.5, useCORS: true, logging: false });
              const imgData = canvas.toDataURL('image/jpeg', 0.8);
              
              const doc = new jsPDF('p', 'mm', 'a4');
              const imgWidth = 210; 
              const pageHeight = 297; 
              const imgHeight = canvas.height * imgWidth / canvas.width;
              let heightLeft = imgHeight;
              let position = 0;

              doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
              while (heightLeft >= 0) {
                  position = heightLeft - imgHeight;
                  doc.addPage();
                  doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                  heightLeft -= pageHeight;
              }
              zip.file(`LJK_${p.name.replace(/[^a-z0-9]/gi, '_')}.pdf`, doc.output('blob'));
          }
          const content = await zip.generateAsync({ type: "blob" });
          window.saveAs(content, `LJK_Batch_${room.code}_PDF.zip`);
          showToast("Berhasil! Semua LJK telah diunduh.");
      } catch (e) {
          console.error(e);
          showToast("Gagal generate PDF: " + e.message, 'error');
      } finally {
          document.body.removeChild(container);
          setLoading(false);
      }
  };

  if (view === 'lobby') {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8 pb-20">
           <Snackbar {...snackbar} onClose={closeToast} />
           <Breadcrumbs onGoHome={()=>{updateURL({ role: 'teacher', roomId: null }); setView('browse')}} items={[{label:'Guru',onClick:()=>setView('browse')},{label:'Live Control Room',active:true}]}/>
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2">
                   <Card title={`Peserta Terdaftar (${players.length})`} subtitle="Pantau status pengerjaan siswa secara realtime."
                       action={players.some(p => p.status === 'submitted') && (<button onClick={handleBatchDownload} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors disabled:opacity-50">{loading ? "Loading..." : "Download ZIP"}</button>)}>
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                          {players.map(p => (
                             <div key={p.id} className={`border p-4 rounded-xl text-center ${p.status==='submitted'?'bg-emerald-50 border-emerald-200':'bg-slate-50 border-slate-100'}`}>
                                <div className="font-bold text-slate-800 truncate mb-1">{p.name}</div>
                                <div className="text-[10px] uppercase font-bold">{p.status}</div>
                                {p.status === 'submitted' && <div className="font-black text-emerald-600 mt-2">{p.score?.toFixed(0)}</div>}
                             </div>
                          ))}
                       </div>
                   </Card>
               </div>
               <div>
                   <Card title="Kontrol Ruangan">
                      <div className="text-center p-8 bg-slate-900 rounded-2xl mb-6 relative overflow-hidden group">
                         <div onClick={copyLink} className="relative z-10 text-6xl font-black text-lime-400 font-mono cursor-pointer hover:scale-105 transition-transform tracking-widest">{room.code}</div>
                         <div className={`relative z-10 text-xs mt-2 font-mono transition-all duration-300 ${linkCopied ? 'text-lime-400 font-bold scale-110' : 'text-emerald-400/60'}`}>{linkCopied ? "Link Tersalin" : "Klik Kode untuk Salin"}</div>
                      </div>
                      {room.status === 'WAITING' && <Button onClick={()=>{updateDoc(getPublicDoc("rooms",room.id),{status:'PLAYING',startedAt:serverTimestamp()}); updateLocalSessionStatus(room.id, 'PLAYING');}} className="w-full h-12 text-lg" variant="secondary" icon={Play}>MULAI UJIAN</Button>}
                      {room.status === 'PLAYING' && (
                          <>
                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center mb-2"><CountdownDisplay startedAt={room.startedAt} duration={room.duration} isActive={true} /></div>
                            <Button onClick={endSession} className="w-full h-12" variant="danger" icon={StopCircle}>AKHIRI SESI</Button>
                          </>
                      )}
                      {room.status === 'FINISHED' && (
                          <Button onClick={() => {
                              const html = `<h2>REKAP NILAI</h2>`; 
                              downloadRawHTML(`Rekap_Nilai_${room.code}`, html);
                          }} className="w-full" variant="outline" icon={Download}>Download Rekap Nilai</Button>
                      )}
                   </Card>
               </div>
           </div>
        </div>
    );
  }

  // RENDER UTAMA
  return (
     <div className="max-w-7xl mx-auto px-4 py-6">
        <Snackbar {...snackbar} onClose={closeToast} />
        
        {/* RENDER SIMULASI OVERLAY JIKA AKTIF */}
        {simulationPacket && (
            <SimulationRunner packet={simulationPacket} onClose={() => setSimulationPacket(null)} />
        )}

        <Breadcrumbs onGoHome={onGoHome} items={[{label:'Portal Guru',active:true}]}/>
        
        {/* Whatsapp Widget */}
        <a href="https://wa.me/6285174484832" target="_blank" rel="noreferrer" className="mb-8 block p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-5 text-emerald-900 hover:shadow-lg transition-all">
           <MessageCircle size={28} className="text-emerald-600"/>
           <div className="flex-1">
             <div className="font-bold text-lg">Butuh Soal Custom?</div>
             <div className="text-sm opacity-70">Tim kami siap membantu. Chat via WhatsApp.</div>
           </div>
           <div className="font-bold text-emerald-600 bg-white px-4 py-2 rounded-lg flex items-center gap-2"><Phone size={16}/> 0851-7448-4832</div>
        </a>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-slate-200 overflow-x-auto scrollbar-hide">
           {['browse', 'active', 'history'].map(tab => (
               <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-4 text-sm font-bold border-b-2 transition-all capitalize whitespace-nowrap ${activeTab === tab ? 'border-emerald-600 text-emerald-900' : 'border-transparent text-slate-400'}`}>
                   {tab === 'browse' ? 'Bank Soal' : tab === 'active' ? 'Sesi Aktif' : 'Riwayat'}
               </button>
           ))}
        </div>

        {activeTab === 'browse' && (
           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <Select label="Mata Pelajaran" icon={BookOpen} value={filterMapel} onChange={e=>setFilterMapel(e.target.value)} options={uniqueMapels.map(m=>({value:m,label:m}))} className="mb-0"/>
                  <Select label="Kelas" icon={Activity} value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} options={uniqueClasses.map(c=>({value:c,label:`Kelas ${c}`}))} className="mb-0"/>
              </div>
           </div>
        )}

        {activeTab === 'browse' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {isFetching ? <div className="col-span-full"><DataLoading/></div> : filteredPackets.map(p => (
                   <Card key={p.id} className="h-full flex flex-col">
                       <h3 className="font-bold text-lg text-slate-800 mb-1">{p.title}</h3>
                       <p className="text-xs text-slate-400 mb-6">{p.mapel} • Kelas {p.kelas}</p>
                       
                       <div className="flex gap-2 mb-4 mt-auto">
                           {/* Tombol Buat Sesi */}
                           <Button onClick={()=>{setSelectedPkt(p); setCustomDuration(p.duration); setShowModal(true);}} className="flex-1" icon={Play} variant="secondary">Buat Sesi</Button>
                           
                           {/* Tombol Simulasi (BARU) */}
                           <button 
                                onClick={() => setSimulationPacket(p)}
                                className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-700 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/20"
                                title="Simulasi kerjakan soal"
                           >
                                <MonitorPlay size={18} />
                           </button>
                       </div>

                       <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 mt-2">
                            <button onClick={() => printExamPDF(p.title, p, null, null, false)} className="flex items-center justify-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl py-3 transition-all shadow-sm hover:shadow-md group">
                                <Download size={16} className="text-blue-500 group-hover:scale-110 transition-transform"/> Soal
                            </button>
                            <button onClick={() => printExamPDF(p.title, p, null, null, true)} className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl py-3 transition-all shadow-sm hover:shadow-md group">
                                <CheckCircle size={16} className="text-emerald-500 group-hover:scale-110 transition-transform"/> Kunci
                            </button>
                       </div>
                   </Card>
               ))}
           </div>
        )}
        
        {activeTab === 'active' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {activeSessions.map(r => (
                     <div key={r.id} onClick={() => { setRoom(r); setView('lobby'); }} className="bg-emerald-950 text-white p-6 rounded-2xl cursor-pointer hover:shadow-2xl transition-all border border-emerald-800">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-2 h-2 bg-lime-400 rounded-full animate-pulse shadow-[0_0_10px_#84cc16]"/>
                            <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest bg-emerald-900/50 px-2 py-1 rounded">{r.status}</span>
                        </div>
                        <h3 className="text-xl font-bold mb-1 truncate">{r.packetTitle}</h3>
                        <div className="font-mono text-4xl font-black text-lime-400 my-4 tracking-widest">{r.code}</div>
                        <div className="text-xs text-emerald-400/60 flex justify-between font-medium">
                            <span className="flex items-center gap-1"><GraduationCap size={14}/> {r.schoolName}</span>
                            <span>{formatIndoDate(r.createdAt)}</span>
                        </div>
                     </div>
                 ))}
                 {activeSessions.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 bg-slate-50 rounded-3xl border border-dashed flex flex-col items-center"><Play size={40} className="mb-4 opacity-20"/>Tidak ada sesi ujian yang sedang aktif.</div>}
             </div>
        )}

        {activeTab === 'history' && (
             <div className="space-y-4">
                 {finishedSessions.map(r => (
                     <div key={r.id} onClick={() => { setRoom(r); setView('lobby'); }} className="flex justify-between items-center bg-white p-5 rounded-xl border border-slate-100 hover:border-emerald-200 cursor-pointer transition-all shadow-sm hover:shadow-md group">
                         <div>
                             <h4 className="font-bold text-slate-800 group-hover:text-emerald-800 transition-colors">{r.packetTitle}</h4>
                             <div className="text-xs text-slate-400 mt-2 flex gap-3 font-mono">
                                 <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{r.code}</span>
                                 <span>•</span>
                                 <span>{formatIndoDate(r.createdAt)}</span>
                             </div>
                         </div>
                         <div className="p-2 bg-slate-50 rounded-full group-hover:bg-emerald-50 text-slate-300 group-hover:text-emerald-600 transition-colors">
                             <ArrowLeft size={18} className="rotate-180"/>
                         </div>
                     </div>
                 ))}
                 {finishedSessions.length === 0 && <div className="py-20 text-center text-slate-400 bg-slate-50 rounded-3xl border border-dashed">Belum ada riwayat sesi.</div>}
             </div>
        )}

        <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title="Buat Sesi Ujian Baru">
           <div className="space-y-5">
              <Input label="Nama Guru / Pengawas" value={form.teacher} onChange={e=>setForm({...form,teacher:e.target.value})} icon={Users}/>
              <Input label="Nama Sekolah / Institusi" value={form.school} onChange={e=>setForm({...form,school:e.target.value})} icon={GraduationCap}/>
              <Input label="Durasi Ujian (Menit)" type="number" value={customDuration} onChange={e=>setCustomDuration(parseInt(e.target.value)||0)} icon={Clock}/>
              <Button onClick={createRoom} loading={loading} className="w-full py-4 text-base">Mulai Sesi Sekarang</Button>
           </div>
        </Modal>
     </div>
  );
};

export default TeacherDashboard;