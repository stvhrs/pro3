import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const CountdownDisplay = ({ startedAt, duration, onTimeUp, isActive }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  
  useEffect(() => {
    if (!isActive || !startedAt) { setTimeLeft(null); return; }
    
    let start;
    if (startedAt && typeof startedAt.toMillis === 'function') start = startedAt.toMillis();
    else if (startedAt && startedAt.seconds) start = startedAt.seconds * 1000;
    else start = new Date(startedAt).getTime();
    
    if (isNaN(start)) start = Date.now(); 

    const end = start + (duration * 60 * 1000);
    
    const tick = () => {
      const now = Date.now();
      const diff = end - now;
      
      if (diff <= 0) { 
          setTimeLeft(0); 
          if (isActive && onTimeUp) onTimeUp(); 
      } else { 
          setTimeLeft(diff); 
      }
    };
    
    tick(); 
    const interval = setInterval(tick, 1000); 
    return () => clearInterval(interval);
  }, [startedAt, duration, isActive]);

  if (timeLeft === null) return <span className="font-mono text-slate-300 tracking-widest text-sm">--:--</span>;
  
  const m = Math.floor(timeLeft / 60000); 
  const s = Math.floor((timeLeft % 60000) / 1000); 
  const isCritical = timeLeft < 60000; 
  
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-xl border transition-all shadow-sm ${isCritical ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' : 'bg-white text-emerald-900 border-emerald-100'}`}>
        <Clock size={20} className={isCritical?'text-rose-500':'text-lime-500'} strokeWidth={2.5} />
        {m.toString().padStart(2,'0')}:{s.toString().padStart(2,'0')}
    </div>
  );
};