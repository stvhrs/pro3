import React, { useState } from 'react';
import { User, LayoutDashboard, ChevronRight, CheckCircle, FileText, Monitor, Lock } from 'lucide-react';
import LoginModal from '../auth/LoginModal';

const LandingPage = ({ onSelectRole }) => {
    const [showLogin, setShowLogin] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-lime-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
            </div>

            <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center relative z-10">
                <div className="text-white space-y-8 animate-in slide-in-from-left-10 duration-700">
                    <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-200 text-xs font-bold uppercase tracking-wider backdrop-blur-sm shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse shadow-[0_0_10px_#84cc16]"/> ELKAPEDE V3.0 PRO
                    </div>
                    <div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-4">
                            Tryout <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-lime-400">Gratis</span> <br/> No Ribet.
                        </h1>
                        <p className="text-emerald-100/70 text-lg md:text-xl leading-relaxed max-w-lg font-light">
                            Pilih Paket Soal tersedia, buat ruang Tryout, kerjakan langsung penilaian.
                        </p>
                    </div>
                </div>
                
                <div className="grid gap-5 animate-in slide-in-from-right-10 duration-700 delay-200">
                    <button onClick={() => onSelectRole('student')} className="group bg-white hover:bg-lime-50 p-6 md:p-8 rounded-3xl shadow-2xl transition-all hover:-translate-y-1 hover:shadow-lime-400/20 flex items-center gap-6 relative overflow-hidden">
                        <div className="w-16 h-16 bg-lime-100 text-emerald-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner flex-shrink-0">
                            <User size={32} strokeWidth={2}/>
                        </div>
                        <div className="text-left relative z-10">
                            <h3 className="text-2xl font-black text-emerald-950 group-hover:text-emerald-700 transition-colors">Masuk sebagai Siswa</h3>
                            <p className="text-slate-500 text-sm font-medium mt-1">Kerjakan ujian dengan kode ruangan</p>
                        </div>
                        <div className="ml-auto text-slate-300 group-hover:text-emerald-600 transition-colors"><ChevronRight size={28}/></div>
                    </button>

                    <button onClick={() => onSelectRole('teacher')} className="group bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-3xl transition-all hover:-translate-y-1 flex items-center gap-6">
                        <div className="w-16 h-16 bg-emerald-800/50 text-emerald-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0 border border-white/5">
                            <LayoutDashboard size={32} strokeWidth={2}/>
                        </div>
                        <div className="text-left text-white">
                            <h3 className="text-2xl font-black">Portal Pengajar</h3>
                            <p className="text-emerald-200/60 text-sm font-medium mt-1">Buat soal dan pantau sesi ujian</p>
                        </div>
                    </button>
                </div>
            </div>
            
            <div className="absolute bottom-6 right-6 z-20">
                <button onClick={() => setShowLogin(true)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/80 hover:bg-emerald-900 text-emerald-600 hover:text-emerald-400 text-[10px] font-bold uppercase tracking-widest transition-all border border-emerald-900 hover:border-emerald-700 backdrop-blur">
                    <Lock size={10}/> Admin Access
                </button>
            </div>

            {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSuccess={() => onSelectRole('admin')} />}
        </div>
    );
};

export default LandingPage;