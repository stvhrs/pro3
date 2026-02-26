import React from 'react';
import { Home, ChevronRight } from 'lucide-react';

export const Breadcrumbs = ({onGoHome, items}) => (
  <div className="flex items-center gap-2 text-sm text-slate-400 mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
    <button onClick={onGoHome} className="hover:text-emerald-800 flex items-center gap-2 font-bold transition-colors flex-shrink-0 group">
      <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100 group-hover:border-emerald-200 group-hover:bg-emerald-50 transition-all">
          <Home size={16} className="text-lime-600 group-hover:text-emerald-700"/>
      </div>
      <span className="hidden sm:inline text-xs uppercase tracking-wider">Dashboard</span>
    </button>
    {items.map((it,i)=>(
      <React.Fragment key={i}>
        <div className="text-slate-300 flex-shrink-0"><ChevronRight size={14} strokeWidth={2}/></div>
        {it.onClick&&!it.active ? 
          <button onClick={it.onClick} className="hover:text-emerald-800 font-medium transition-colors flex-shrink-0 text-xs">{it.label}</button> : 
          <span className={`font-bold flex-shrink-0 ${it.active ? 'text-emerald-900 bg-lime-100 px-3 py-1 rounded-full text-[10px] uppercase tracking-wide border border-lime-200' : 'text-xs'}`}>{it.label}</span>
        }
      </React.Fragment>
    ))}
  </div>
);