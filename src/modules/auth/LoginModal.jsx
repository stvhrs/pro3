import React, { useState } from 'react';
import { User, Lock, AlertTriangle } from 'lucide-react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase";
import { Modal, Input, Button } from "../../components/UI";

const LoginModal = ({ onClose, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            onSuccess();
        } catch (err) {
            setError('Autentikasi gagal. Periksa kembali kredensial Anda.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Login Administrator">
            <form onSubmit={handleLogin} className="space-y-4">
                {error && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl flex items-center gap-2"><AlertTriangle size={16}/> {error}</div>}
                <Input label="Email Institusi" type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="admin@sekolah.sch.id" icon={User}/>
                <Input label="Kata Sandi" type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" icon={Lock}/>
                <Button type="submit" loading={loading} className="w-full py-3">Masuk Dashboard</Button>
            </form>
        </Modal>
    );
};

export default LoginModal;