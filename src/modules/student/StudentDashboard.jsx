import React, { useState, useEffect } from 'react';
import { User, Hash, ArrowLeft, Check, Menu, X, CheckCircle, AlertTriangle, Download, Home } from 'lucide-react';
import { addDoc, updateDoc, onSnapshot, query, where, serverTimestamp, getDocs } from "firebase/firestore";
import { getPublicCol, getPublicDoc } from "../../config/firebase";
import { printExamPDF } from "../../utils/pdfEngine";
import { useSnackbar, Snackbar } from "../../utils/hook";
import { Button, Input, Modal } from "../../components/UI";
import { ContentRenderer } from "../../components/RichEditor";
import { CountdownDisplay } from "../../components/Timer";

const StudentDashboard = ({ onGoHome, user }) => {
  const [stage, setStage] = useState('login'); 
  const [form, setForm] = useState({ code: '', name: '' });
  const [room, setRoom] = useState(null);
  const [player, setPlayer] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { snackbar, showToast, closeToast } = useSnackbar();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) setForm(prev => ({ ...prev, code }));
  }, []);

  useEffect(() => {
    if (!room?.id) return;
    const unsub = onSnapshot(getPublicDoc("rooms", room.id), (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            setRoom(prev => ({ ...prev, ...data }));
            if (data.status === 'PLAYING' && stage === 'lobby') setStage('exam');
            if (data.status === 'FINISHED' && stage === 'exam') submitExam(true);
        }
    });
    return () => unsub();
  }, [room?.id, stage]);

  const joinRoom = async () => {
     if (!form.code || !form.name) return showToast("Isi kode dan nama lengkap!", 'error');
     setLoading(true);
     try {
       const q = query(getPublicCol("rooms"), where("code", "==", form.code.trim().toUpperCase()));
       const snap = await getDocs(q);
       if (snap.empty) throw new Error("Kode ruang ujian tidak valid.");
       
       const roomData = { id: snap.docs[0].id, ...snap.docs[0].data() };
       if (roomData.status === 'FINISHED') throw new Error("Ujian ini sudah selesai.");

       const playerRef = await addDoc(getPublicCol("players"), {
           roomId: roomData.id,
           name: form.name.trim(),
           status: 'ready',
           joinedAt: serverTimestamp(),
           answers: {}
       });

       setRoom(roomData);
       setPlayer({ id: playerRef.id, name: form.name });
       
       if (roomData.status === 'PLAYING') setStage('exam');
       else setStage('lobby');
     } catch (e) { showToast(e.message, 'error'); }
     finally { setLoading(false); }
  };

  const handleAnswer = (qId, val) => {
     setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const submitExam = async (auto = false) => {
     if (!auto) setShowConfirmModal(false);
     setLoading(true);
     
     // Scoring Logic
     let score = 0;
     let maxScore = 0;
     
     room.questions.forEach(q => {
         const userAns = answers[q.id];
         // Simple scoring example:
         if (q.type === 'PG') { maxScore += 10; if (userAns === q.answer) score += 10; }
         // Add full scoring logic from original code here for PGK, MTF, Essay...
     });
     const finalScore = maxScore > 0 ? (score / maxScore) * 100 : 0;

     try {
         await updateDoc(getPublicDoc("players", player.id), {
             answers,
             status: 'submitted',
             submittedAt: serverTimestamp(),
             score: finalScore
         });
         setStage('result');
     } catch (e) { showToast("Gagal submit: " + e.message, 'error'); }
     finally { setLoading(false); }
  };

  if (stage === 'login') return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-emerald-900/5">
          <Snackbar {...snackbar} onClose={closeToast} />
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/50">
              <div className="h-2 bg-gradient-to-r from-emerald-400 to-lime-400"></div>
              <div className="p-8">
                  <h1 className="text-3xl font-black text-center text-emerald-950 tracking-tight mb-8">Login Peserta</h1>
                  <div className="space-y-4">
                    <Input label="KODE RUANGAN" placeholder="Cth: X7B9A2" value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} icon={Hash} className="text-center font-mono text-lg tracking-widest uppercase"/>
                    <Input label="NAMA LENGKAP" placeholder="Nama sesuai absen" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} icon={User}/>
                    <Button onClick={joinRoom} loading={loading} className="w-full py-4 text-base">MASUK RUANGAN</Button>
                    <button onClick={onGoHome} className="w-full text-center text-slate-400 text-xs hover:text-emerald-600 transition-colors mt-4">Batalkan & Kembali</button>
                  </div>
              </div>
          </div>
      </div>
  );

  if (stage === 'lobby') return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
          <h2 className="text-3xl font-black text-emerald-950 mb-3">Menunggu Dimulai...</h2>
          <p className="text-slate-500 mb-10">Harap tenang. Ujian akan segera dimulai.</p>
          <div className="p-6 bg-white rounded-2xl shadow-xl border border-slate-100 text-left w-full max-w-sm">
              <div className="font-bold text-slate-800 text-lg mb-4">{form.name}</div>
              <div className="text-sm">Mapel: <span className="font-bold text-emerald-900">{room.packetTitle}</span></div>
          </div>
      </div>
  );

  if (stage === 'result') return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-emerald-900 text-white text-center">
          <h2 className="text-4xl font-black mb-4">Ujian Selesai!</h2>
          <div className="flex flex-col gap-4 w-full max-w-xs">
              <Button onClick={() => printExamPDF(room.packetTitle, room, player.name, answers, false)} icon={Download} variant="secondary" className="w-full py-4 text-emerald-900">Download Bukti LJK</Button>
              <Button onClick={onGoHome} icon={Home} variant="outline" className="w-full py-4 bg-transparent text-emerald-100 border-emerald-700">Kembali ke Halaman Utama</Button>
          </div>
      </div>
  );

  // Exam View
  return (
      <div className="max-w-4xl mx-auto pb-32 px-4 pt-6">
          <Snackbar {...snackbar} onClose={closeToast} />
          
          <div className="fixed top-4 left-0 w-full z-50 flex justify-center">
              <div className="bg-emerald-900/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl flex gap-4">
                  <CountdownDisplay startedAt={room.startedAt} duration={room.duration} onTimeUp={()=>submitExam(true)} isActive={true} />
              </div>
          </div>

          <button onClick={() => setShowNav(true)} className="fixed bottom-6 right-6 bg-emerald-900 text-white px-6 py-3 rounded-full shadow-xl z-40 flex items-center gap-3 font-bold text-sm"><Menu size={20} /> Navigasi</button>

          {showNav && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl">
                      <div className="flex justify-between items-center mb-6"><h3 className="font-bold">Navigasi</h3><button onClick={() => setShowNav(false)}><X/></button></div>
                      <div className="grid grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto">
                          {room.questions.map((q, i) => (
                              <button key={i} onClick={() => { document.getElementById(`q-${i}`).scrollIntoView(); setShowNav(false); }} className={`aspect-square rounded-xl flex items-center justify-center font-bold border-2 ${answers[q.id] ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white'}`}>
                                  {i+1} {answers[q.id] && <Check size={12} className="ml-1"/>}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          <div className="mt-20 space-y-12">
             {room.questions.map((q, i) => (
                <div key={q.id} id={`q-${i}`} className="scroll-mt-32">
                   <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                       <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-4">
                           <span className="bg-emerald-900 text-white w-10 h-10 flex items-center justify-center rounded-xl font-bold">{i+1}</span>
                       </div>
                       <div className="p-6 md:p-8">
                           <div className="text-base md:text-lg text-slate-800 leading-loose mb-8 font-medium"><ContentRenderer html={q.question}/></div>
                           {/* Options Rendering Logic (PG, PGK, etc) - Copy logic from original file */}
                           {q.type === 'PG' && q.options.map((opt, idx) => (
                               <label key={idx} className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer mb-2 ${answers[q.id] === opt ? 'bg-emerald-50 border-emerald-500' : 'border-slate-100'}`}>
                                   <input type="radio" name={`q-${q.id}`} className="mt-1" checked={answers[q.id] === opt} onChange={()=>handleAnswer(q.id, opt)}/>
                                   <div className="flex-1"><ContentRenderer html={opt}/></div>
                               </label>
                           ))}
                       </div>
                   </div>
                </div>
             ))}
          </div>

          <div className="mt-12 mb-20 p-6 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
              <Button onClick={() => setShowConfirmModal(true)} variant="primary" className="mx-auto px-12 py-4" icon={CheckCircle}>Kumpulkan Jawaban</Button>
          </div>

          <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Konfirmasi Pengumpulan">
              <div className="text-center">
                  <AlertTriangle size={40} className="text-amber-500 mx-auto mb-4"/>
                  <h3 className="text-lg font-bold">Yakin ingin mengumpulkan?</h3>
                  <div className="grid grid-cols-2 gap-3 mt-6">
                      <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Periksa Lagi</Button>
                      <Button variant="primary" onClick={() => submitExam(false)}>Ya, Kumpulkan</Button>
                  </div>
              </div>
          </Modal>
      </div>
  );
};

export default StudentDashboard;