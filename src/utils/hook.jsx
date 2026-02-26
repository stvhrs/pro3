import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, X } from 'lucide-react';

export const useExternalResources = () => {
  useEffect(() => {
    const scripts = [
        "https://cdn.tailwindcss.com",
        "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
    ];
    
    scripts.forEach(src => {
        if (!document.querySelector(`script[src="${src}"]`)) {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            document.head.appendChild(script);
        }
    });

    if (!document.querySelector('link[href*="katex.min.css"]')) {
      const link = document.createElement('link');
      link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
  }, []);
};

export const Snackbar = ({ message, type, isVisible, onClose }) => {
  if (!isVisible) return null;
  const config = {
    error: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', icon: <AlertTriangle size={18} className="text-red-600"/> },
    success: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', icon: <CheckCircle size={18} className="text-emerald-600"/> },
    info: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', icon: <AlertCircle size={18} className="text-blue-600"/> }
  };
  const theme = config[type] || config.success;

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 font-medium text-sm animate-in slide-in-from-bottom-5 fade-in duration-300 border ${theme.bg} ${theme.border} ${theme.text} min-w-[320px] justify-between backdrop-blur-sm bg-opacity-95`}>
      <div className="flex items-center gap-3">
        {theme.icon}
        <span>{message}</span>
      </div>
      <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors"><X size={14}/></button>
    </div>
  );
};

export const useSnackbar = () => {
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });
  const showToast = useCallback((message, type = 'success') => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => setSnackbar(prev => ({ ...prev, show: false })), 4000);
  }, []);
  const closeToast = useCallback(() => setSnackbar(prev => ({ ...prev, show: false })), []);
  return { snackbar, showToast, closeToast };
};