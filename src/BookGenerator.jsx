import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  PlusCircle, BookOpen, List, Image as ImageIcon, Trash2, Layout, Maximize2, 
  GripVertical, Sigma, ArrowLeft, Library, Calendar, Settings, X, Check, 
  FileCode, Type, AlignLeft, Box, MoveUp, MoveDown, MoreHorizontal, FileText, 
  ChevronDown, ChevronRight, ChevronUp, Palette, Table as TableIcon, Grid,
  ArrowRight, CornerDownRight, Edit3, Minus
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getDatabase, ref, onValue, push, set, update, remove 
} from 'firebase/database';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBR7WYA0kftRtrF0DXWyGgJ-k22VEN_jDU",
  authDomain: "gubukpustakaharmoni-f5319.firebaseapp.com",
  databaseURL: "https://gubukpustakaharmoni-f5319-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gubukpustakaharmoni-f5319",
  storageBucket: "gubukpustakaharmoni-f5319.firebasestorage.app",
  messagingSenderId: "519346211398",
  appId: "1:519346211398:web:2e8bb7f3e046365b4cd847",
  measurementId: "G-NHGTM9B7V5"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Sanitize App ID
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'editor-buku-sd-widgets-v6-theme';
const appId = rawAppId.replace(/[.#$[\]]/g, '_');

// --- Helper Functions ---
const ensureArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data.filter(item => item !== null && item !== undefined);
  return Object.values(data);
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

// --- Constants ---
const PAPER_SIZES = {
  'lks': { name: 'LKS (190x270mm)', width: 190, height: 270 },
  'a4': { name: 'A4 (210x297mm)', width: 210, height: 297 },
  'b5': { name: 'B5 (176x250mm)', width: 176, height: 250 },
  'f4': { name: 'F4/Folio (215x330mm)', width: 215, height: 330 },
};

const DEFAULT_THEME = {
  primary: '#4f46e5',   // Indigo 600
  secondary: '#ec4899', // Pink 500
  accent: '#f59e0b',    // Amber 500
  text: '#1e293b'       // Slate 800
};

// --- WIDGET RENDERERS (PREVIEW) ---
const WidgetPreview = ({ block, theme }) => {
  if (!block || !block.data) return null;
  const t = theme || DEFAULT_THEME;

  switch (block.type) {
    case 'header':
      return (
        <div className="mb-3 mt-4 border-b pb-1 break-inside-avoid" style={{ borderColor: `${t.primary}30` }}>
          <h2 className="text-lg font-bold uppercase tracking-wide border-l-4 pl-3" 
              style={{ color: t.text, borderColor: t.primary }}>
            {block.data.text || 'Judul Bagian'}
          </h2>
        </div>
      );
    case 'paragraph':
      return (
        <div 
          className="mb-3 text-justify text-sm leading-relaxed" 
          style={{ color: t.text }}
          dangerouslySetInnerHTML={{__html: block.data.text || ''}} 
        />
      );
    case 'image_card':
      return (
        <div className="mb-4 flex gap-4 items-start bg-slate-50 p-3 rounded border border-slate-200 break-inside-avoid">
          <div className="flex-1 text-sm text-justify leading-relaxed">
             {block.data.text || 'Deskripsi gambar...'}
          </div>
          <div className="w-1/3 flex flex-col items-center">
             {block.data.imageUrl ? (
               <img src={block.data.imageUrl} className="w-full h-auto rounded shadow-sm border border-white" alt="Illustrasi" />
             ) : (
               <div className="w-full h-24 bg-slate-200 flex items-center justify-center text-xs text-slate-400">No Image</div>
             )}
             <div className="mt-1 text-[10px] text-center w-full">
                <span className="font-bold block" style={{ color: t.primary }}>Gbr {block.data.imageIndex || '?'}</span>
                <span className="text-slate-400 italic">{block.data.source || '-'}</span>
             </div>
          </div>
        </div>
      );
    case 'latex':
      return (
        <div className="mb-3 p-3 border-l-4 text-center rounded my-2 break-inside-avoid" 
             style={{ backgroundColor: `${t.primary}10`, borderColor: t.primary }}>
           <div className="latex-render font-serif text-lg">
             {`$$ ${block.data.formula || ''} $$`}
           </div>
        </div>
      );
    case 'card_note':
      return (
        <div className="mb-3 p-3 rounded-lg shadow-sm border break-inside-avoid" 
             style={{ backgroundColor: `${t.accent}10`, borderColor: `${t.accent}40` }}>
           <h4 className="font-bold text-sm mb-1 flex items-center gap-2" style={{ color: t.accent }}>
             <span className="p-1 rounded text-white" style={{ backgroundColor: t.accent }}>💡</span>
             {block.data.title || 'Catatan Penting'}
           </h4>
           <p className="text-xs leading-relaxed" style={{ color: '#7c2d12' }}>{block.data.content}</p>
        </div>
      );
    case 'table':
      const rows = block.data.rows || [];
      return (
        <div className="mb-4 overflow-hidden break-inside-avoid">
           <table className="w-full text-xs border-collapse">
             <tbody>
               {rows.map((row, rIdx) => (
                 <tr key={rIdx}>
                   {row.map((cell, cIdx) => {
                     if (!cell) return null; // Skip if merged
                     if (cell.merged) return null; // Skip placeholder
                     
                     // Style Logic
                     const cellStyle = {
                       backgroundColor: cell.style?.bgColor || 'transparent',
                       borderWidth: '1px',
                       borderStyle: cell.style?.borderStyle || 'solid',
                       borderColor: cell.style?.borderColor || '#e2e8f0', // Slate 200 default
                       textAlign: cell.style?.align || 'left',
                       padding: '8px',
                       fontWeight: cell.style?.bold ? 'bold' : 'normal',
                       color: t.text
                     };

                     // Special: Header Theme Integration
                     if (cell.isHeader) {
                        cellStyle.backgroundColor = t.primary;
                        cellStyle.color = 'white';
                        cellStyle.borderColor = t.primary;
                     }

                     return (
                       <td 
                         key={`${rIdx}-${cIdx}`} 
                         colSpan={cell.colSpan || 1} 
                         rowSpan={cell.rowSpan || 1}
                         style={cellStyle}
                       >
                         <div dangerouslySetInnerHTML={{__html: cell.content || ''}} />
                       </td>
                     );
                   })}
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      );
    case 'page_break':
      return (
        <div className="w-full h-[1px] bg-red-300 my-4 relative print:hidden page-break-marker">
           <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-red-100 text-red-500 text-[10px] px-2 rounded-full border border-red-200">Page Break</span>
        </div>
      );
    case 'section_title':
        return (
            <div className="mb-6 mt-8 pb-2 border-b-4 border-double break-inside-avoid" style={{ borderColor: `${t.secondary}40` }}>
                <h1 className="text-2xl font-black uppercase tracking-tight" style={{ color: t.text }}>{block.data.text}</h1>
            </div>
        );
    default:
      return null;
  }
};

// --- PAGINATION PREVIEW ---
const PaginatedPreview = ({ title, author, blocks, settings }) => {
    const [pages, setPages] = useState([]);
    const hiddenRef = useRef(null);
    const paperKey = settings.paperSize || 'lks';
    const paper = PAPER_SIZES[paperKey];
    const theme = settings.theme || DEFAULT_THEME;
    
    const PX_PER_MM = 3.78; 
    
    const pageHeightPx = paper.height * PX_PER_MM;
    const marginTopPx = settings.margins.top * PX_PER_MM;
    const marginBottomPx = settings.margins.bottom * PX_PER_MM;
    const contentHeightLimit = pageHeightPx - marginTopPx - marginBottomPx;

    const pageStyle = {
        width: `${paper.width}mm`,
        height: `${paper.height}mm`,
        padding: `${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm`,
    };

    // --- Pagination Logic ---
    useEffect(() => {
        if (!hiddenRef.current) return;
        
        const children = Array.from(hiddenRef.current.children);
        const newPages = [];
        let currentPage = [];
        let currentHeight = 0;

        children.forEach((child, index) => {
            const blockData = blocks[index];
            if (!blockData) return;
            const childHeight = child.offsetHeight;
            const isPageBreak = blockData.type === 'page_break';

            if (isPageBreak || (currentHeight + childHeight > contentHeightLimit - 10)) {
                if (currentPage.length > 0) {
                    newPages.push(currentPage);
                    currentPage = [];
                    currentHeight = 0;
                }
                
                if (!isPageBreak) {
                    currentPage.push(blockData);
                    currentHeight += childHeight;
                }
            } else {
                currentPage.push(blockData);
                currentHeight += childHeight;
            }
        });

        if (currentPage.length > 0) {
            newPages.push(currentPage);
        }

        setPages(newPages);
    }, [blocks, settings, paperKey]);

    useEffect(() => {
        if (window.katex && typeof window.renderMathInElement === 'function') {
            document.querySelectorAll('.preview-page-content').forEach(elem => {
                try {
                    window.renderMathInElement(elem, {
                        delimiters: [{left: '$$', right: '$$', display: true}],
                        throwOnError: false
                    });
                } catch(e) {}
            });
        }
    });

    return (
        <div className="flex flex-col items-center gap-8 pb-20">
            {/* Hidden Measurement Container */}
            <div 
                ref={hiddenRef} 
                style={{ 
                    width: `${paper.width - settings.margins.left - settings.margins.right}mm`, 
                    position: 'absolute', top: '-9999px', left: '-9999px', visibility: 'hidden' 
                }}
            >
                {blocks.map((block, idx) => (
                    <div key={`measure-${block.id || idx}`}>
                        <WidgetPreview block={block} theme={theme} />
                    </div>
                ))}
            </div>

            {/* Rendered Pages */}
            {pages.length === 0 && blocks.length > 0 ? (
                <div className="text-white">Menghitung tata letak...</div>
            ) : (
                pages.map((pageBlocks, pageIdx) => {
                    const isHakCiptaPage = pageIdx === 0;
                    return (
                        <div 
                            key={pageIdx}
                            className="bg-white shadow-2xl relative overflow-hidden transform origin-top md:scale-100 shrink-0 preview-page-root"
                            style={pageStyle}
                        >
                            <div className="absolute top-2 right-4 text-[9px] font-bold uppercase tracking-widest" style={{ color: `${theme.primary}60` }}>{title}</div>
                            
                            <div className="preview-page-content h-full w-full">
                                {pageBlocks.map((block, idx) => (
                                    <WidgetPreview key={block.id || `${pageIdx}-${idx}`} block={block} theme={theme} />
                                ))}
                            </div>

                            {!isHakCiptaPage && (
                                <div className="absolute bottom-3 left-0 right-0 text-center flex justify-center items-center gap-2">
                                     <div className="h-[1px] w-8" style={{ backgroundColor: theme.primary }}></div>
                                     <span className="text-[10px] font-bold" style={{ color: theme.primary }}>{pageIdx}</span>
                                     <div className="h-[1px] w-8" style={{ backgroundColor: theme.primary }}></div>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
};

// --- TABLE EDITOR COMPONENT ---
const TableEditor = ({ data, onSave, onClose }) => {
  const [rows, setRows] = useState(data.rows || [[{ content: 'Cell 1', colSpan: 1, rowSpan: 1 }]]);
  const [selectedCells, setSelectedCells] = useState([]); // Array of {r, c}
  const [activeTab, setActiveTab] = useState('structure');

  // Helper to get safe cell
  const getCell = (r, c) => rows[r] && rows[r][c];

  const addRow = () => {
    const colCount = rows[0] ? rows[0].length : 1;
    const newRow = Array(colCount).fill().map(() => ({ content: '', colSpan: 1, rowSpan: 1 }));
    setRows([...rows, newRow]);
  };

  const addCol = () => {
    const newRows = rows.map(row => [...row, { content: '', colSpan: 1, rowSpan: 1 }]);
    setRows(newRows);
  };

  const handleCellClick = (r, c, e) => {
     if(e.ctrlKey || e.metaKey) {
       setSelectedCells(prev => [...prev, {r, c}]);
     } else {
       setSelectedCells([{r, c}]);
     }
  };

  const updateSelectedCells = (field, value) => {
    const newRows = [...rows];
    selectedCells.forEach(({r, c}) => {
      if(!newRows[r][c].style) newRows[r][c].style = {};
      if (field === 'content') newRows[r][c].content = value;
      else if (field === 'isHeader') newRows[r][c].isHeader = value;
      else newRows[r][c].style[field] = value;
    });
    setRows(newRows);
  };

  // Basic Merge Logic (Rectangle check omitted for brevity in single file, assumes user selects rectangle)
  const mergeCells = () => {
    if(selectedCells.length < 2) return;
    
    // Find bounds
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    selectedCells.forEach(({r, c}) => {
      minR = Math.min(minR, r); maxR = Math.max(maxR, r);
      minC = Math.min(minC, c); maxC = Math.max(maxC, c);
    });

    const newRows = [...rows];
    const mainCell = newRows[minR][minC];
    mainCell.rowSpan = (maxR - minR) + 1;
    mainCell.colSpan = (maxC - minC) + 1;

    // Mark others as merged/null
    for(let i=minR; i<=maxR; i++){
      for(let j=minC; j<=maxC; j++){
        if(i===minR && j===minC) continue;
        newRows[i][j] = { ...newRows[i][j], merged: true };
      }
    }
    setRows(newRows);
    setSelectedCells([{r: minR, c: minC}]);
  };

  const resetMerge = () => {
    const newRows = [...rows];
    selectedCells.forEach(({r, c}) => {
        // Simple reset for selected cell, effectively unmerges if it was a main cell
        newRows[r][c].rowSpan = 1;
        newRows[r][c].colSpan = 1;
        // This is a naive unmerge, strict unmerge requires finding all hidden cells. 
        // For this demo, we'll assume reset entire table structure or careful usage.
        // Better strategy: iterate whole table, if cell is hidden by this selection, unhide it.
    });
    // Brute force fix for demo:
    const fixRows = newRows.map(row => row.map(cell => ({...cell, merged: false, rowSpan: 1, colSpan: 1})));
    setRows(fixRows);
  }

  const selectedValue = selectedCells.length === 1 ? getCell(selectedCells[0].r, selectedCells[0].c)?.content : '';

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
      <div className="bg-slate-800 w-full max-w-4xl h-[90vh] rounded-xl flex flex-col shadow-2xl border border-slate-700">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900 rounded-t-xl">
           <h3 className="text-white font-bold flex items-center gap-2"><TableIcon size={18} /> Table Editor</h3>
           <div className="flex gap-2">
             <button onClick={() => onSave({ rows })} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded text-sm font-bold">Simpan</button>
             <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-1 rounded text-sm">Batal</button>
           </div>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
           {/* Sidebar Tools */}
           <div className="w-64 bg-slate-900 border-r border-slate-700 p-4 overflow-y-auto space-y-6">
              
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Structure</label>
                <div className="grid grid-cols-2 gap-2">
                   <button onClick={addRow} className="bg-slate-800 border border-slate-600 text-slate-300 text-xs py-1 rounded hover:bg-indigo-600">Add Row</button>
                   <button onClick={addCol} className="bg-slate-800 border border-slate-600 text-slate-300 text-xs py-1 rounded hover:bg-indigo-600">Add Col</button>
                   <button onClick={mergeCells} className="bg-indigo-900 border border-indigo-700 text-indigo-200 text-xs py-1 rounded hover:bg-indigo-600">Merge</button>
                   <button onClick={resetMerge} className="bg-red-900 border border-red-700 text-red-200 text-xs py-1 rounded hover:bg-red-600">Reset All</button>
                </div>
              </div>

              {selectedCells.length > 0 && (
                <div className="animate-in fade-in slide-in-from-left-4">
                   <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Cell Content</label>
                   <textarea 
                     value={selectedCells.length === 1 ? (rows[selectedCells[0].r][selectedCells[0].c].content || '') : ''}
                     onChange={(e) => updateSelectedCells('content', e.target.value)}
                     className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-xs mb-4"
                     rows={3}
                     placeholder="HTML content supported"
                   />

                   <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Style</label>
                   <div className="space-y-3">
                      <div className="flex items-center gap-2">
                         <input type="checkbox" checked={rows[selectedCells[0].r][selectedCells[0].c].isHeader || false} onChange={(e) => updateSelectedCells('isHeader', e.target.checked)} />
                         <span className="text-xs text-slate-300">Header Cell (Use Theme)</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">Background</span>
                        <div className="flex gap-1 flex-wrap">
                          {['transparent', '#f1f5f9', '#fee2e2', '#dcfce7', '#dbeafe', '#fef9c3'].map(c => (
                            <button key={c} onClick={() => updateSelectedCells('bgColor', c)} className="w-6 h-6 rounded border border-slate-500" style={{backgroundColor: c}} title={c} />
                          ))}
                        </div>
                      </div>
                      <div>
                         <span className="text-[10px] text-slate-400 block mb-1">Border</span>
                         <select className="w-full bg-slate-800 border border-slate-600 text-white text-xs rounded p-1" onChange={(e) => updateSelectedCells('borderStyle', e.target.value)}>
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="none">None</option>
                         </select>
                      </div>
                      <div>
                         <span className="text-[10px] text-slate-400 block mb-1">Align</span>
                         <div className="flex gap-1">
                            {['left', 'center', 'right', 'justify'].map(a => (
                               <button key={a} onClick={() => updateSelectedCells('align', a)} className="flex-1 bg-slate-800 border border-slate-600 text-slate-300 text-[10px] py-1 capitalize">{a}</button>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
              )}
           </div>

           {/* Preview Area */}
           <div className="flex-1 bg-slate-200 overflow-auto p-8 flex items-start justify-center">
              <div className="bg-white shadow-lg p-8 min-w-[500px]">
                <table className="w-full border-collapse">
                  <tbody>
                    {rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => {
                          if (cell.merged) return null;
                          const isSelected = selectedCells.find(s => s.r === rIdx && s.c === cIdx);
                          return (
                            <td 
                              key={`${rIdx}-${cIdx}`}
                              rowSpan={cell.rowSpan}
                              colSpan={cell.colSpan}
                              onClick={(e) => handleCellClick(rIdx, cIdx, e)}
                              className={`border relative cursor-pointer hover:bg-indigo-50 transition-colors p-2 text-sm ${isSelected ? 'ring-2 ring-indigo-500 z-10' : ''}`}
                              style={{
                                backgroundColor: cell.isHeader ? '#4f46e5' : (cell.style?.bgColor || 'transparent'),
                                color: cell.isHeader ? 'white' : 'inherit',
                                borderColor: cell.style?.borderColor || '#cbd5e1',
                                borderStyle: cell.style?.borderStyle || 'solid',
                                borderWidth: '1px',
                                textAlign: cell.style?.align || 'left'
                              }}
                            >
                               <div dangerouslySetInnerHTML={{__html: cell.content || '<span class="opacity-20">Cell</span>'}} />
                               {isSelected && <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[8px] px-1">{rIdx},{cIdx}</div>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ onSelectBook, onCreateBook, books, loading }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTitle || !newAuthor) return;
    onCreateBook(newTitle, newAuthor);
    setNewTitle('');
    setNewAuthor('');
    setIsCreating(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12 border-b border-slate-700 pb-6">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <BookOpen className="text-indigo-500" size={32} />
              Gubuk Pustaka Editor
            </h1>
            <p className="text-slate-400 mt-2">CMS Modul Ajar Digital (Themes & Nested Sections)</p>
          </div>
          <button onClick={() => setIsCreating(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg">
            <PlusCircle size={20} /> Buat Buku Baru
          </button>
        </header>

        {isCreating && (
          <div className="mb-12 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-2xl animate-in fade-in slide-in-from-top-4">
            <h2 className="text-xl font-bold mb-4 text-white">Detail Buku Baru</h2>
            <form onSubmit={handleSubmit} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Judul Buku</label>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Contoh: Matematika Kelas 1" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Penulis</label>
                <input type="text" value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Nama Penulis" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded font-bold">Simpan</button>
                <button type="button" onClick={() => setIsCreating(false)} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded font-bold">Batal</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
           <div className="text-center py-20 text-slate-500">Memuat data dari server...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.length === 0 ? (
              <div className="col-span-full text-center py-20 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
                <Library size={48} className="mx-auto mb-4 opacity-50" />
                <p>Belum ada buku. Mulai dengan membuat buku baru.</p>
              </div>
            ) : (
              books.map((book) => (
                <div key={book.id} onClick={() => onSelectBook(book.id)} className="group bg-white hover:bg-indigo-50 transition-all cursor-pointer rounded-r-xl rounded-l-sm overflow-hidden flex shadow-xl hover:shadow-2xl hover:-translate-y-1 relative">
                  <div className="w-4 bg-indigo-700 h-full absolute left-0 top-0 bottom-0 z-10 shadow-inner"></div>
                  <div className="flex-1 p-6 pl-10 flex flex-col h-64 relative">
                    <div className="flex-1 z-10">
                      <h3 className="text-xl font-black text-slate-800 leading-tight mb-2 group-hover:text-indigo-700 line-clamp-3">{book.title}</h3>
                      <p className="text-sm font-medium text-slate-500 italic">Oleh: {book.author}</p>
                    </div>
                    <div className="mt-auto border-t border-slate-100 pt-4 flex justify-between items-center text-xs text-slate-400 z-10">
                      <span className="flex items-center gap-1"><FileText size={12} /> {book.sections ? Object.keys(book.sections).length : 0} Bagian</span>
                      <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(book.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Editor = ({ bookId, onBack }) => {
  const [bookData, setBookData] = useState(null);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tableEditorOpen, setTableEditorOpen] = useState(false);
  const [activeBlockForTable, setActiveBlockForTable] = useState(null);

  const [localSettings, setLocalSettings] = useState({ 
    paperSize: 'lks', 
    margins: { top: 20, bottom: 20, left: 20, right: 20 },
    theme: DEFAULT_THEME
  });
  
  // Collapse State
  const [collapsedBlocks, setCollapsedBlocks] = useState({});

  // Drag & Drop State
  const dragItem = useRef();
  const dragOverItem = useRef();
  const sidebarDragItem = useRef();
  const sidebarDragOverItem = useRef();

  // UI States
  const [showNav, setShowNav] = useState(true);
  const [showEditor, setShowEditor] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [settingsTab, setSettingsTab] = useState('layout'); // 'layout' or 'theme'

  // Data Processing for Sections (Flat to Hierarchy)
  const sectionsList = useMemo(() => {
    if (!bookData || !bookData.sections) return [];
    // Convert to array and sort by order
    let list = Object.entries(bookData.sections).map(([id, val]) => ({ id, ...val }));
    list.sort((a, b) => (a.order || 0) - (b.order || 0));
    return list;
  }, [bookData]);

  // Hierarchical view logic for Sidebar
  const buildHierarchy = (sections) => {
    // For simplicity in rendering, we will just use visual indentation based on `depth` property if we had one.
    // But since we want "sort drag drop" and "beranak", let's use a flat list approach where 
    // we manage parentId. 
    // However, to make it robust for this single file, we will render a flat list but with visual indentation 
    // derived from a `parentId` map.
    // Simpler: Just allow arbitrary indentation levels (0, 1, 2) stored as `depth` or `indent`.
    // Let's use `parentId`.
    
    // We need to order them such that children appear under parents.
    // A robust tree sort is complex.
    // ALTERNATIVE: Use a simple linear list but with an `indent` property.
    // This is much easier to drag-and-drop sort.
    return sections;
  };

  const activeSection = (bookData && bookData.sections && activeSectionId) ? bookData.sections[activeSectionId] : null;
  const blocks = (activeSection && activeSection.blocks) ? ensureArray(activeSection.blocks) : [];

  // Flatten Blocks for Pagination Preview
  const flattenedBlocks = useMemo(() => {
     let all = [];
     sectionsList.forEach((section) => {
         if (section.title !== "Hak Cipta") {
             // Pass theme info indirectly if needed, but Theme is global in settings
             all.push({ 
               id: `title-${section.id}`, 
               type: 'section_title', 
               data: { text: section.title },
               indent: section.indent || 0 // Pass indent info
             });
         }
         if (section.blocks) {
            all.push(...ensureArray(section.blocks));
         }
     });
     return all;
  }, [sectionsList]);

  // --- Initial Setup ---
  useEffect(() => {
    const scripts = [
      { src: "https://cdn.tailwindcss.com", id: "tailwind" },
      { src: "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js", id: "katex-js" },
      { src: "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js", id: "katex-auto" }
    ];
    const styles = ["https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"];

    styles.forEach(href => {
      if(!document.querySelector(`link[href="${href}"]`)){
        const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = href; document.head.appendChild(link);
      }
    });

    scripts.forEach(s => {
      if(!document.getElementById(s.id)) {
        const script = document.createElement('script'); script.src = s.src; script.id = s.id; script.async = true; document.head.appendChild(script);
      }
    });
  }, []);

  // Database Sync
  useEffect(() => {
    if (!bookId) return;
    const bookRef = ref(db, `artifacts/${appId}/books/${bookId}`);
    const unsubscribe = onValue(bookRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBookData(data);
        if (data.settings) setLocalSettings(data.settings);
      }
    });
    return () => unsubscribe();
  }, [bookId]);

  useEffect(() => {
    if (bookData && bookData.sections && !activeSectionId) {
       if (sectionsList.length > 0) setActiveSectionId(sectionsList[0].id);
    }
  }, [bookData]);

  // --- ACTIONS ---

  const addBlock = (type) => {
    if (!activeSectionId) return;
    const newBlock = { id: generateId(), type, data: {} };
    if(type === 'header') newBlock.data = { text: 'Judul Baru' };
    if(type === 'paragraph') newBlock.data = { text: 'Tulis paragraf disini...' };
    if(type === 'image_card') newBlock.data = { text: 'Jelaskan gambar ini...', imageIndex: '1', source: 'Dok. Pribadi' };
    if(type === 'latex') newBlock.data = { formula: '\\frac{a}{b}' };
    if(type === 'card_note') newBlock.data = { title: 'Ingat!', content: 'Isi catatan...' };
    if(type === 'table') newBlock.data = { rows: [[{ content: 'Data', colSpan: 1, rowSpan: 1 }]] };

    const currentBlocks = ensureArray(activeSection.blocks);
    const updatedBlocks = [...currentBlocks, newBlock];
    update(ref(db, `artifacts/${appId}/books/${bookId}/sections/${activeSectionId}`), { blocks: updatedBlocks });
  };

  const updateBlock = (blockId, field, value) => {
    const currentBlocks = ensureArray(activeSection.blocks);
    const updatedBlocks = currentBlocks.map(b => {
      if (b.id === blockId) {
        if (field === 'data') return { ...b, data: value }; // Full replace for table
        return { ...b, data: { ...b.data, [field]: value } };
      }
      return b;
    });
    update(ref(db, `artifacts/${appId}/books/${bookId}/sections/${activeSectionId}`), { blocks: updatedBlocks });
  };

  const deleteBlock = (blockId) => {
    if(!confirm("Hapus blok ini?")) return;
    const currentBlocks = ensureArray(activeSection.blocks);
    const updatedBlocks = currentBlocks.filter(b => b.id !== blockId);
    update(ref(db, `artifacts/${appId}/books/${bookId}/sections/${activeSectionId}`), { blocks: updatedBlocks });
  };

  // --- Widget Drag & Drop ---
  const handleBlockDragStart = (e, position) => { dragItem.current = position; };
  const handleBlockDragEnter = (e, position) => { dragOverItem.current = position; };
  const handleBlockDragEnd = (e) => {
    const startIdx = dragItem.current;
    const endIdx = dragOverItem.current;
    if (startIdx === undefined || endIdx === undefined || startIdx === endIdx) return;
    const currentBlocks = ensureArray(activeSection.blocks);
    const newBlocks = [...currentBlocks];
    const dragItemContent = newBlocks[startIdx];
    newBlocks.splice(startIdx, 1);
    newBlocks.splice(endIdx, 0, dragItemContent);
    dragItem.current = null; dragOverItem.current = null;
    update(ref(db, `artifacts/${appId}/books/${bookId}/sections/${activeSectionId}`), { blocks: newBlocks });
  };

  // --- Sidebar Section Drag & Drop & Indent ---
  const handleSectionDragStart = (e, index) => { sidebarDragItem.current = index; };
  const handleSectionDragEnter = (e, index) => { sidebarDragOverItem.current = index; };
  const handleSectionDragEnd = () => {
      const start = sidebarDragItem.current;
      const end = sidebarDragOverItem.current;
      if (start === undefined || end === undefined || start === end) return;

      const newSections = [...sectionsList];
      const item = newSections[start];
      newSections.splice(start, 1);
      newSections.splice(end, 0, item);

      // Re-index Order
      const updates = {};
      newSections.forEach((sec, idx) => {
          updates[`${sec.id}/order`] = idx;
      });
      update(ref(db, `artifacts/${appId}/books/${bookId}/sections`), updates);
      
      sidebarDragItem.current = null;
      sidebarDragOverItem.current = null;
  };

  const changeSectionIndent = (sectionId, change) => {
      const section = sectionsList.find(s => s.id === sectionId);
      if(!section) return;
      const currentIndent = section.indent || 0;
      const newIndent = Math.max(0, Math.min(2, currentIndent + change)); // Max depth 2
      update(ref(db, `artifacts/${appId}/books/${bookId}/sections/${sectionId}`), { indent: newIndent });
  };

  const handleImageUpload = (blockId, file) => {
    if(file) {
      const reader = new FileReader();
      reader.onload = (e) => updateBlock(blockId, 'imageUrl', e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // --- EXPORT HTML ---
  const handleExportHTML = () => {
    const paperSizeKey = localSettings.paperSize || 'lks';
    const paper = PAPER_SIZES[paperSizeKey];
    
    const previewContainer = document.querySelector('.preview-container-root');
    if(!previewContainer) { alert("Tunggu preview selesai dimuat"); return; }

    const pagesHTML = Array.from(document.querySelectorAll('.preview-page-root')).map(el => el.outerHTML).join('');

    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${bookData.title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
    <style>
        body { background: #f0f0f0; margin: 0; padding: 20px; font-family: sans-serif; }
        .page-root {
            background: white;
            width: ${paper.width}mm;
            min-height: ${paper.height}mm;
            margin: 0 auto 20px auto;
            page-break-after: always;
            position: relative;
        }
        @media print {
            body { padding: 0; background: white; }
            .preview-page-root { width: 100% !important; box-shadow: none !important; margin: 0 !important; transform: none !important; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    ${pagesHTML}
    <script>
        document.addEventListener("DOMContentLoaded", function() {
            renderMathInElement(document.body);
        });
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bookData.title}.html`;
    a.click();
  };

  const addSection = () => {
    const newRef = push(ref(db, `artifacts/${appId}/books/${bookId}/sections`));
    const maxOrder = sectionsList.length > 0 ? Math.max(...sectionsList.map(v=>v.order||0)) : 0;
    set(newRef, { title: 'Bagian Baru', order: maxOrder + 1, blocks: [], indent: 0 }).then(() => setActiveSectionId(newRef.key));
  };

  const deleteSection = (id) => {
    if(confirm("Hapus bagian ini?")) {
      remove(ref(db, `artifacts/${appId}/books/${bookId}/sections/${id}`));
      if(activeSectionId === id) setActiveSectionId(null);
    }
  };

  const openTableEditor = (block) => {
     setActiveBlockForTable(block);
     setTableEditorOpen(true);
  };

  if (!bookData) return <div className="flex h-screen items-center justify-center text-white">Memuat...</div>;

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200 font-sans overflow-hidden">
      
      {/* --- TABLE EDITOR MODAL --- */}
      {tableEditorOpen && activeBlockForTable && (
          <TableEditor 
             data={activeBlockForTable.data} 
             onClose={() => setTableEditorOpen(false)}
             onSave={(newData) => {
                 updateBlock(activeBlockForTable.id, 'data', newData);
                 setTableEditorOpen(false);
             }}
          />
      )}

      {/* --- FLOATING CONTROLS --- */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-800/90 backdrop-blur border border-slate-700 p-2 rounded-full shadow-2xl z-50">
        <button onClick={() => setShowNav(!showNav)} className={`p-2 rounded-full transition-colors ${showNav ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700'}`} title="Navigasi"><List size={20} /></button>
        <button onClick={() => setShowEditor(!showEditor)} className={`p-2 rounded-full transition-colors ${showEditor ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700'}`} title="Widget Editor"><Layout size={20} /></button>
        <button onClick={() => setShowPreview(!showPreview)} className={`p-2 rounded-full transition-colors ${showPreview ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700'}`} title="Preview"><BookOpen size={20} /></button>
        <div className="w-[1px] h-6 bg-slate-600 mx-1"></div>
        <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-slate-700 text-slate-300" title="Settings"><Settings size={20} /></button>
      </div>

      {/* --- LEFT PANEL: NAVIGATION --- */}
      {showNav && (
        <div className="w-72 bg-slate-800 border-r border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700 flex items-center gap-2">
            <button onClick={onBack} className="p-1 hover:bg-slate-700 rounded text-slate-400"><ArrowLeft size={18} /></button>
            <h1 className="font-bold text-indigo-400 truncate text-sm">{bookData.title}</h1>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sectionsList.map((section, idx) => (
              <div 
                key={section.id} 
                draggable
                onDragStart={(e) => handleSectionDragStart(e, idx)}
                onDragEnter={(e) => handleSectionDragEnter(e, idx)}
                onDragEnd={handleSectionDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`group flex items-center p-2 rounded cursor-pointer transition-colors ${activeSectionId === section.id ? 'bg-slate-700 border-l-2 border-indigo-500' : 'hover:bg-slate-700/50'}`}
                style={{ marginLeft: `${(section.indent || 0) * 16}px` }}
                onClick={() => setActiveSectionId(section.id)}
              >
                <div className="cursor-move text-slate-600 hover:text-slate-400 mr-2"><GripVertical size={12} /></div>
                <div className="flex-1 min-w-0">
                    <span className={`text-xs truncate block ${activeSectionId === section.id ? 'text-white font-medium' : 'text-slate-400'}`}>
                        {section.title}
                    </span>
                </div>
                {/* Indent Controls */}
                <div className="flex opacity-0 group-hover:opacity-100 items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); changeSectionIndent(section.id, -1); }} className="p-1 hover:bg-slate-600 rounded text-slate-400" title="Outdent"><ChevronDown size={10} className="rotate-90" /></button>
                    <button onClick={(e) => { e.stopPropagation(); changeSectionIndent(section.id, 1); }} className="p-1 hover:bg-slate-600 rounded text-slate-400" title="Indent"><ChevronRight size={10} /></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }} className="p-1 hover:bg-red-900/50 rounded text-red-400"><Trash2 size={10} /></button>
                </div>
              </div>
            ))}
            <button onClick={addSection} className="w-full flex items-center gap-2 p-3 mt-4 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300 justify-center border border-dashed border-slate-600">
              <PlusCircle size={14} /> Tambah Bagian
            </button>
          </div>
        </div>
      )}

      {/* --- CENTER PANEL: WIDGET EDITOR --- */}
      {showEditor && (
        <div className="flex-1 flex flex-col bg-slate-900 border-r border-slate-700 min-w-[350px] relative">
          <div className="h-14 border-b border-slate-700 flex items-center px-4 bg-slate-800 justify-between">
            <span className="font-bold text-white text-sm">Widget Editor</span>
            {activeSection && (
               <input 
                 value={activeSection.title} 
                 onChange={(e) => update(ref(db, `artifacts/${appId}/books/${bookId}/sections/${activeSectionId}`), { title: e.target.value })} 
                 className="bg-transparent border-b border-slate-600 text-right text-sm text-white focus:outline-none w-1/2 focus:border-indigo-500 transition-colors"
               />
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
            {activeSection ? (
              <>
                {blocks.length === 0 && (
                  <div className="text-center py-10 text-slate-500 text-sm border-2 border-dashed border-slate-700 rounded bg-slate-800/50">
                    Belum ada widget. Tambahkan widget di bawah.
                  </div>
                )}

                {blocks.map((block, index) => (
                  <div 
                    key={block.id || index} 
                    draggable
                    onDragStart={(e) => handleBlockDragStart(e, index)}
                    onDragEnter={(e) => handleBlockDragEnter(e, index)}
                    onDragEnd={handleBlockDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className={`bg-slate-800 rounded border border-slate-700 shadow-lg relative group transition-all hover:border-indigo-500/50 ${collapsedBlocks[block.id] ? 'p-2' : 'p-3'}`}
                  >
                    {/* Block Toolbar */}
                    <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="cursor-move p-1 hover:bg-slate-700 rounded text-slate-500"><GripVertical size={14} /></div>
                          <span className="text-[10px] font-bold uppercase text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded">{block.type.replace('_', ' ')}</span>
                          <span className="text-[10px] text-slate-500 truncate max-w-[150px]">
                             {collapsedBlocks[block.id] && (block.data.text || block.data.title || "Konten tersembunyi")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setCollapsedBlocks(prev => ({ ...prev, [block.id]: !prev[block.id] }))} className="p-1 hover:bg-slate-700 rounded text-slate-400">
                             {collapsedBlocks[block.id] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                          </button>
                          <button onClick={() => deleteBlock(block.id)} className="p-1 hover:bg-red-900/50 text-red-400 rounded"><Trash2 size={12} /></button>
                        </div>
                    </div>

                    {/* Block Inputs */}
                    {!collapsedBlocks[block.id] && (
                        <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                        {block.type === 'header' && (
                            <input type="text" value={block.data.text} onChange={(e) => updateBlock(block.id, 'text', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white font-bold" placeholder="Judul Bagian..." />
                        )}
                        
                        {block.type === 'paragraph' && (
                            <textarea rows={3} value={block.data.text} onChange={(e) => updateBlock(block.id, 'text', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm font-light leading-relaxed" placeholder="Tulis paragraf (HTML supported)..." />
                        )}

                        {block.type === 'image_card' && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="col-span-2">
                                <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">Upload Gambar</label>
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(block.id, e.target.files[0])} className="text-xs text-slate-400 w-full file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-700 file:text-white hover:file:bg-slate-600" />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">Teks Deskripsi</label>
                                <textarea rows={3} value={block.data.text} onChange={(e) => updateBlock(block.id, 'text', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Nomor</label>
                                <input type="text" value={block.data.imageIndex} onChange={(e) => updateBlock(block.id, 'imageIndex', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-xs" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Sumber</label>
                                <input type="text" value={block.data.source} onChange={(e) => updateBlock(block.id, 'source', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-xs" />
                              </div>
                            </div>
                        )}

                        {block.type === 'latex' && (
                            <div>
                              <label className="block text-[10px] text-slate-400 mb-1">Rumus LaTeX</label>
                              <div className="flex gap-2 items-center">
                                <span className="text-slate-500">$$</span>
                                <input type="text" value={block.data.formula} onChange={(e) => updateBlock(block.id, 'formula', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-indigo-300 font-mono text-sm" />
                                <span className="text-slate-500">$$</span>
                              </div>
                            </div>
                        )}

                        {block.type === 'card_note' && (
                            <>
                            <input type="text" value={block.data.title} onChange={(e) => updateBlock(block.id, 'title', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-orange-300 font-bold mb-2" placeholder="Judul Kartu" />
                            <textarea rows={2} value={block.data.content} onChange={(e) => updateBlock(block.id, 'content', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm" placeholder="Isi catatan..." />
                            </>
                        )}

                        {block.type === 'table' && (
                            <div className="text-center py-4 bg-slate-900 rounded border border-dashed border-slate-700">
                                <p className="text-xs text-slate-400 mb-3">
                                    {block.data.rows?.length || 0} baris x {block.data.rows?.[0]?.length || 0} kolom
                                </p>
                                <button onClick={() => openTableEditor(block)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded font-bold flex items-center gap-2 mx-auto">
                                    <Edit3 size={14} /> Edit Table Content & Style
                                </button>
                            </div>
                        )}
                        
                        {block.type === 'page_break' && (
                            <div className="text-center text-xs text-red-400 italic">-- Pemisah Halaman --</div>
                        )}
                        </div>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500 text-sm">Pilih Bagian di Kiri</div>
            )}
          </div>

          {/* FIXED TOOLBAR AT BOTTOM */}
          {activeSection && (
            <div className="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 p-2 z-20 shadow-lg">
                <div className="grid grid-cols-7 gap-1">
                   <button onClick={() => addBlock('header')} className="flex flex-col items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 hover:border-indigo-500 transition-all h-14" title="Judul">
                      <Type size={16} className="text-indigo-400" /> 
                   </button>
                   <button onClick={() => addBlock('paragraph')} className="flex flex-col items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 hover:border-indigo-500 transition-all h-14" title="Paragraf">
                      <AlignLeft size={16} className="text-green-400" />
                   </button>
                   <button onClick={() => addBlock('image_card')} className="flex flex-col items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 hover:border-indigo-500 transition-all h-14" title="Gambar">
                      <Layout size={16} className="text-blue-400" />
                   </button>
                   <button onClick={() => addBlock('table')} className="flex flex-col items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 hover:border-indigo-500 transition-all h-14" title="Tabel">
                      <TableIcon size={16} className="text-cyan-400" />
                   </button>
                   <button onClick={() => addBlock('card_note')} className="flex flex-col items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 hover:border-indigo-500 transition-all h-14" title="Catatan">
                      <Box size={16} className="text-orange-400" />
                   </button>
                   <button onClick={() => addBlock('latex')} className="flex flex-col items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 hover:border-indigo-500 transition-all h-14" title="Matematika">
                      <Sigma size={16} className="text-purple-400" />
                   </button>
                   <button onClick={() => addBlock('page_break')} className="flex flex-col items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 hover:border-red-500 transition-all h-14" title="Page Break">
                      <MoreHorizontal size={16} className="text-red-400" />
                   </button>
                </div>
            </div>
          )}
        </div>
      )}

      {/* --- RIGHT PANEL: PAGINATED PREVIEW --- */}
      {showPreview && (
        <div className="flex-1 bg-slate-800 border-l border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
            <h2 className="font-bold flex items-center gap-2"><Maximize2 size={16} /> Live Preview</h2>
            <button onClick={handleExportHTML} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 shadow-lg">
               <FileCode size={14} /> Export HTML
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 bg-slate-700 custom-scrollbar preview-container-root relative">
             <PaginatedPreview 
               title={bookData.title}
               author={bookData.author}
               blocks={flattenedBlocks}
               settings={localSettings}
             />
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
           <div className="bg-slate-800 rounded-lg shadow-2xl w-96 border border-slate-700 overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-900">
                 <h2 className="text-lg font-bold text-white flex items-center gap-2"><Settings size={18} /> Pengaturan Buku</h2>
                 <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
              </div>
              
              <div className="flex border-b border-slate-700">
                 <button onClick={() => setSettingsTab('layout')} className={`flex-1 py-2 text-sm font-medium ${settingsTab === 'layout' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}>Layout</button>
                 <button onClick={() => setSettingsTab('theme')} className={`flex-1 py-2 text-sm font-medium ${settingsTab === 'theme' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}>Tema Warna</button>
              </div>

              <div className="p-6 space-y-4">
                 {settingsTab === 'layout' ? (
                    <>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Ukuran Kertas</label>
                        <select className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm" value={localSettings.paperSize} onChange={(e) => setLocalSettings({...localSettings, paperSize: e.target.value})}>
                            {Object.entries(PAPER_SIZES).map(([key, size]) => (<option key={key} value={key}>{size.name}</option>))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {['top', 'bottom', 'left', 'right'].map(m => (
                            <div key={m}>
                                <span className="text-[10px] text-slate-500 block mb-1 uppercase">{m}</span>
                                <input type="number" className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-white text-sm" value={localSettings.margins[m]} onChange={(e) => setLocalSettings({...localSettings, margins: {...localSettings.margins, [m]: Number(e.target.value)}})} />
                            </div>
                        ))}
                    </div>
                    </>
                 ) : (
                    <>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Primary Color (Headers)</label>
                            <div className="flex gap-2">
                                <input type="color" className="h-8 w-8 bg-transparent border-0 rounded cursor-pointer" value={localSettings.theme?.primary || DEFAULT_THEME.primary} onChange={(e) => setLocalSettings({...localSettings, theme: {...localSettings.theme, primary: e.target.value}})} />
                                <input type="text" className="flex-1 bg-slate-900 border border-slate-600 rounded p-1 text-white text-xs" value={localSettings.theme?.primary || DEFAULT_THEME.primary} onChange={(e) => setLocalSettings({...localSettings, theme: {...localSettings.theme, primary: e.target.value}})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Secondary Color (Subheaders)</label>
                            <div className="flex gap-2">
                                <input type="color" className="h-8 w-8 bg-transparent border-0 rounded cursor-pointer" value={localSettings.theme?.secondary || DEFAULT_THEME.secondary} onChange={(e) => setLocalSettings({...localSettings, theme: {...localSettings.theme, secondary: e.target.value}})} />
                                <input type="text" className="flex-1 bg-slate-900 border border-slate-600 rounded p-1 text-white text-xs" value={localSettings.theme?.secondary || DEFAULT_THEME.secondary} onChange={(e) => setLocalSettings({...localSettings, theme: {...localSettings.theme, secondary: e.target.value}})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Accent Color (Notes)</label>
                            <div className="flex gap-2">
                                <input type="color" className="h-8 w-8 bg-transparent border-0 rounded cursor-pointer" value={localSettings.theme?.accent || DEFAULT_THEME.accent} onChange={(e) => setLocalSettings({...localSettings, theme: {...localSettings.theme, accent: e.target.value}})} />
                                <input type="text" className="flex-1 bg-slate-900 border border-slate-600 rounded p-1 text-white text-xs" value={localSettings.theme?.accent || DEFAULT_THEME.accent} onChange={(e) => setLocalSettings({...localSettings, theme: {...localSettings.theme, accent: e.target.value}})} />
                            </div>
                        </div>
                    </div>
                    </>
                 )}
              </div>
              <div className="p-4 bg-slate-900">
                 <button onClick={() => { update(ref(db, `artifacts/${appId}/books/${bookId}/settings`), localSettings); setIsSettingsOpen(false); }} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded font-bold transition-colors">Simpan Pengaturan</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('dashboard');
  const [activeBookId, setActiveBookId] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const booksRef = ref(db, `artifacts/${appId}/books`);
    const unsubscribe = onValue(booksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBooks(Object.entries(data).map(([id, val]) => ({ id, ...val })));
      } else {
        setBooks([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateBook = (title, author) => {
    const booksRef = ref(db, `artifacts/${appId}/books`);
    const newBookRef = push(booksRef);
    
    // Teks Hak Cipta yang diminta
    const copyrightContent = `
      <div style="font-size: 10px; line-height: 1.4;">
        <p style="text-align: center; margin-bottom: 10px;"><strong>Hak Cipta pada Kementerian Pendidikan Dasar dan Menengah Republik Indonesia.</strong><br>Dilindungi Undang-Undang.</p>
        <p style="text-align: justify; margin-bottom: 10px;"><strong>Penafian:</strong> Buku ini disiapkan oleh Pemerintah dalam rangka pemenuhan kebutuhan buku pendidikan yang bermutu, murah, dan merata sesuai dengan amanat dalam UU No. 3 Tahun 2017. Buku ini disusun dan ditelaah oleh berbagai pihak di bawah koordinasi Kementerian Pendidikan Dasar dan Menengah. Buku ini merupakan dokumen hidup yang senantiasa diperbaiki, diperbarui, dan dimutakhirkan sesuai dengan dinamika kebutuhan dan perubahan zaman. Masukan dari berbagai kalangan yang dialamatkan kepada penulis atau melalui alamat surel buku@kemendikdasmen.go.id diharapkan dapat meningkatkan kualitas buku ini.</p>
        <p style="margin-bottom: 10px;"><strong>${title}</strong></p>
        <div style="margin-bottom: 10px;">
          <strong>Penulis</strong><br>${author}<br><br>
          <strong>Penerbit</strong><br>Kementerian Pendidikan Dasar dan Menengah<br><br>
          Edisi Revisi, 2025<br>
        </div>
      </div>
    `;

    set(newBookRef, { 
      title, 
      author, 
      createdAt: Date.now(), 
      settings: { 
          paperSize: 'lks', 
          margins: { top: 20, bottom: 20, left: 20, right: 20 },
          theme: DEFAULT_THEME 
      } 
    }).then(async () => {
       const sectionsRef = ref(db, `artifacts/${appId}/books/${newBookRef.key}/sections`);
       
       const createSection = (title, order, indent, blocks = []) => {
         const secRef = push(sectionsRef);
         return set(secRef, { title, order, indent, blocks });
       };

       // 1. Hak Cipta
       await createSection("Hak Cipta", 1, 0, [{ id: generateId(), type: 'paragraph', data: { text: copyrightContent } }]);
       
       // 2. Panduan Umum
       await createSection("Panduan Umum", 2, 0);
       await createSection("Pendahuluan", 3, 1, [{ id: generateId(), type: 'paragraph', data: { text: "Isi Pendahuluan..." } }]);
       await createSection("Capaian Pembelajaran", 4, 1);

       // 3. Bab 1
       await createSection("Bab I Makanan Bergizi", 5, 0, [{ id: generateId(), type: 'header', data: { text: 'Bab I' } }]);
       await createSection("Apersepsi", 6, 1);
       await createSection("Kegiatan Inti", 7, 1);
       
       setActiveBookId(newBookRef.key);
       setView('editor');
    });
  };

  return (
    <>
      {view === 'dashboard' && <Dashboard books={books} loading={loading} onSelectBook={(id) => { setActiveBookId(id); setView('editor'); }} onCreateBook={handleCreateBook} />}
      {view === 'editor' && <Editor bookId={activeBookId} onBack={() => { setActiveBookId(null); setView('dashboard'); }} />}
    </>
  );
}