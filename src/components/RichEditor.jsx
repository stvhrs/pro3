import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Image as ImageIcon } from 'lucide-react';

export const RichEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);
  
  useEffect(() => { 
    if (editorRef.current && editorRef.current.innerHTML !== value) {
        if (!editorRef.current.matches(':focus')) {
            editorRef.current.innerHTML = value || ''; 
        }
    }
  }, [value]);

  const exec = (cmd, val) => { document.execCommand(cmd, false, val); triggerChange(); };
  
  const triggerChange = () => {
      if (onChange) onChange(editorRef.current.innerHTML);
  };

  const handlePaste = (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    let filePasted = false;
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        filePasted = true;
        e.preventDefault(); 
        const r = new FileReader();
        r.onload = (ev) => exec('insertImage', ev.target.result);
        r.readAsDataURL(item.getAsFile());
      }
    }
  };

  const handleImgClick = (e) => { 
      if(e.target.tagName==='IMG') { 
          const w = prompt("Ubah Ukuran Gambar (px atau %):", e.target.style.width || "100%"); 
          if(w) { e.target.style.width=w; triggerChange(); }
      }
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all duration-300">
      <div className="flex gap-1 p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto scrollbar-hide">
        {[
            ['bold',Bold], ['italic',Italic], ['underline',Underline], 
            ['insertOrderedList',ListOrdered], ['insertUnorderedList',List]
        ].map(([c,Icon]) => (
            <button key={c} onClick={()=>exec(c)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 flex-shrink-0 transition-colors" title={c}>
                <Icon size={16}/>
            </button>
        ))}
        <div className="w-px bg-slate-300 mx-1"></div>
        <button onClick={()=>{const u=prompt("Masukkan URL Gambar:");if(u)exec('insertImage',u)}} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 flex-shrink-0 transition-colors" title="Insert Image from URL">
            <ImageIcon size={16}/>
        </button>
      </div>
      <div 
        ref={editorRef} 
        className="p-4 min-h-[120px] outline-none prose prose-sm max-w-none text-slate-700 font-normal leading-relaxed empty:before:content-[attr(placeholder)] empty:before:text-slate-400" 
        contentEditable 
        onInput={triggerChange} 
        onPaste={handlePaste} 
        onClick={handleImgClick}
        placeholder={placeholder}
      />
    </div>
  );
};

export const ContentRenderer = ({ html }) => {
  const ref = useRef(null);
  
  useEffect(() => {
    if(!ref.current || !html) return;
    ref.current.innerHTML = html;
    
    if(window.katex) { 
        const traverse = (node) => {
        if (node.nodeType === 3) { 
          const text = node.nodeValue;
          if (text.match(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/)) {
            const span = document.createElement('span');
            const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
            parts.forEach(part => {
                if (part.startsWith('$') && part.endsWith('$')) {
                  const math = part.startsWith('$$') ? part.slice(2, -2) : part.slice(1, -1);
                  const display = part.startsWith('$$');
                  const mSpan = document.createElement('span');
                  try { window.katex.render(math, mSpan, { displayMode: display, throwOnError: false }); } catch(e) { mSpan.textContent = part; }
                  span.appendChild(mSpan);
                } else { span.appendChild(document.createTextNode(part)); }
            });
            node.replaceWith(span);
          }
        } else { node.childNodes.forEach(child => traverse(child)); }
      };
      traverse(ref.current);
    }
  }, [html]);
  
  return <div ref={ref} className="prose prose-sm max-w-none text-slate-800 break-words"/>;
};