import React from 'react';
import { Loader2, X, Filter, ChevronDown } from 'lucide-react';

export const DataLoading = () => (
  <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-pulse">
    <Loader2 size={40} className="mb-4 animate-spin text-emerald-500"/>
    <p className="text-xs font-bold uppercase tracking-widest">Memuat Data...</p>
  </div>
);

export const Button = ({ children, onClick, variant='primary', className='', icon:Icon, loading, ...props }) => {
  const baseClass = "flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold tracking-wide transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed text-sm shadow-sm";
  const variants = {
    primary: 'bg-emerald-900 text-white hover:bg-emerald-800 hover:shadow-emerald-900/20 shadow-emerald-900/10',
    secondary: 'bg-lime-400 text-emerald-950 hover:bg-lime-300 hover:shadow-lime-400/30 shadow-lime-400/10',
    outline: 'bg-white text-emerald-900 border border-emerald-900/10 hover:border-emerald-900/30 hover:bg-emerald-50',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-emerald-900 shadow-none',
    danger: 'bg-white text-rose-600 border border-rose-100 hover:bg-rose-50 hover:border-rose-200 hover:shadow-rose-500/10'
  };

  return (
    <button onClick={onClick} className={`${baseClass} ${variants[variant]} ${className}`} disabled={loading} {...props}>
      {loading ? <Loader2 className="animate-spin" size={16}/> : (Icon && <Icon size={18} strokeWidth={2.5} className="flex-shrink-0"/>)} 
      {children}
    </button>
  );
};

export const Card = ({children, title, subtitle, action, className='', id=''}) => (
  <div id={id} className={`bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 overflow-hidden ${className}`}>
    {(title||action) && (
      <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-start md:items-center bg-white gap-4">
        <div>
            {title && <h3 className="font-bold text-emerald-950 text-lg tracking-tight leading-snug">{title}</h3>}
            {subtitle && <p className="text-slate-400 text-xs font-medium mt-1">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

export const Input = ({label, error, icon:Icon, ...props}) => (
  <div className="mb-4 group">
    {label && <label className="block text-xs font-black text-emerald-900 uppercase tracking-widest mb-2 ml-1 opacity-70 group-focus-within:opacity-100 transition-opacity">{label}</label>}
    <div className="relative">
        {Icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors"><Icon size={18}/></div>}
        <input 
            className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 outline-none text-slate-800 font-medium transition-all placeholder:text-slate-300 bg-slate-50/50 focus:bg-white text-sm`} 
            {...props}
        />
    </div>
    {error && <p className="text-rose-500 text-xs mt-1 ml-1 font-medium">{error}</p>}
  </div>
);

export const Select = ({label, options, icon:Icon, className="mb-4", ...props}) => (
  <div className={`w-full group ${className}`}>
    {label && <label className="block text-xs font-black text-emerald-900 uppercase tracking-widest mb-2 ml-1 opacity-70 group-focus-within:opacity-100 transition-opacity">{label}</label>}
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-900/40 group-focus-within:text-emerald-600 transition-colors">
        {Icon ? <Icon size={18}/> : <Filter size={18}/>}
      </div>
      <select className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 outline-none text-slate-800 font-bold bg-white appearance-none cursor-pointer transition-all text-sm bg-transparent" {...props}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-emerald-900 transition-colors" size={16} strokeWidth={3} />
    </div>
  </div>
);

export const Modal = ({isOpen, onClose, title, children, footer}) => { 
  if(!isOpen) return null; 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-white flex-shrink-0">
          <h3 className="font-bold text-xl text-emerald-950 tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-rose-500 transition-all"><X size={20}/></button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>
        {footer && <div className="p-4 bg-slate-50 border-t border-slate-100">{footer}</div>}
      </div>
    </div>
  ); 
};