import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { UploadCloud, FileSpreadsheet, Copy, Trash2, CheckCircle2, AlertCircle, FileText, LayoutGrid, Download, FileArchive, ImagePlus, X } from 'lucide-react';

export default function App() {
  const [filesData, setFilesData] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [libsLoaded, setLibsLoaded] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('spk'); 
  const [kopImage, setKopImage] = useState(null); // State untuk menyimpan gambar Kop Surat
  
  const fileInputRef = useRef(null);
  const kopInputRef = useRef(null);

  // Load semua library yang dibutuhkan untuk Ekstraksi, PDF, dan ZIP
  useEffect(() => {
    const loadScript = (src) => new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const script = document.createElement('script');
      script.src = src;
      script.async = false; // load sequentially or guarantee execution
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });

    Promise.all([
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js')
    ]).then(() => {
      setLibsLoaded(true);
    }).catch(err => {
      console.error("Gagal memuat library:", err);
      showToast("Gagal memuat sistem PDF/ZIP. Pastikan internet stabil.");
    });
  }, []);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fungsi mengubah angka menjadi Terbilang (Huruf)
  const angkaTerbilang = (angka) => {
    const bil = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
    if (angka === 0) return "";
    if (angka < 12) return " " + bil[angka];
    if (angka < 20) return angkaTerbilang(angka - 10) + " belas";
    if (angka < 100) return angkaTerbilang(Math.floor(angka / 10)) + " puluh" + angkaTerbilang(angka % 10);
    if (angka < 200) return " seratus" + angkaTerbilang(angka - 100);
    if (angka < 1000) return angkaTerbilang(Math.floor(angka / 100)) + " ratus" + angkaTerbilang(angka % 100);
    if (angka < 2000) return " seribu" + angkaTerbilang(angka - 1000);
    if (angka < 1000000) return angkaTerbilang(Math.floor(angka / 1000)) + " ribu" + angkaTerbilang(angka % 1000);
    if (angka < 1000000000) return angkaTerbilang(Math.floor(angka / 1000000)) + " juta" + angkaTerbilang(angka % 1000000);
    if (angka < 1000000000000) return angkaTerbilang(Math.floor(angka / 1000000000)) + " miliar" + angkaTerbilang(angka % 1000000000);
    return "";
  };

  const handleKopUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        // Load image object to get original dimensions to maintain aspect ratio
        const img = new Image();
        img.onload = () => {
          setKopImage({
            src: event.target.result,
            width: img.width,
            height: img.height
          });
          showToast("Gambar Kop Surat berhasil dimuat!");
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      showToast("Harap upload file gambar dengan format PNG atau JPG.");
    }
    // Reset input
    e.target.value = null;
  };

  const getTerbilang = (num) => {
    let result = angkaTerbilang(num).trim();
    if (!result) return "Nol rupiah";
    return result.charAt(0).toUpperCase() + result.slice(1) + " rupiah";
  };

  const processFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = window.XLSX.read(data, { type: 'array' });
          
          // --- PROSES SHEET 1 (SPK) ---
          const sheetSpkName = workbook.SheetNames[0];
          const sheetSpk = workbook.Sheets[sheetSpkName];
          
          const getCellValue = (sheet, cellId) => {
            const cell = sheet[cellId];
            return cell ? (cell.w || cell.v) : '';
          };

          const parseExcelDate = (cell) => {
            if (!cell || typeof cell.v !== 'number') return null;
            const date = new Date((cell.v - 25569) * 86400 * 1000);
            return new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
          };

          const formatDateIndo = (dateObj, includeYear = true) => {
            if (!dateObj) return '';
            const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            const d = dateObj.getDate();
            const m = months[dateObj.getMonth()];
            const y = dateObj.getFullYear();
            return includeYear ? `${d} ${m} ${y}` : `${d} ${m}`;
          };

          // --- FUNGSI BARU: Konversi Teks Tanggal Excel (e.g. "13-Apr-26" -> "13 April 2026") ---
          const parseTextDateToIndo = (text) => {
            if (!text || typeof text !== 'string') return text;
            
            // Menggunakan global replace (/g) dan word boundary (\b) agar tanggal di dalam teks ikut terubah
            const regex = /\b(\d{1,2})[\s\-]+([a-zA-Z]+)[\s\-]+(\d{2,4})\b/g;
            
            const monthMap = {
              'jan': 'Januari', 'feb': 'Februari', 'mar': 'Maret', 
              'apr': 'April', 'may': 'Mei', 'mei': 'Mei', 
              'jun': 'Juni', 'jul': 'Juli', 'aug': 'Agustus', 
              'agu': 'Agustus', 'sep': 'September', 'oct': 'Oktober', 
              'okt': 'Oktober', 'nov': 'November', 'dec': 'Desember', 
              'des': 'Desember'
            };
            
            return text.replace(regex, (match, d, m, y) => {
              const day = parseInt(d, 10);
              const monthStr = m.toLowerCase();
              let year = parseInt(y, 10);
              
              // Jika tahun 2 digit (misal: 26), ubah menjadi 2026
              if (year < 100) year += 2000;
              
              let foundMonth = null;
              for (const key in monthMap) {
                if (monthStr.startsWith(key)) {
                  foundMonth = monthMap[key];
                  break;
                }
              }
              
              if (foundMonth) {
                return `${day} ${foundMonth} ${year}`;
              }
              return match;
            });
          };

          const pejabat = getCellValue(sheetSpk, 'D58');
          const nip = getCellValue(sheetSpk, 'D59');
          const pt = getCellValue(sheetSpk, 'D77');
          const alamatPt = getCellValue(sheetSpk, 'D78');
          const direktur = getCellValue(sheetSpk, 'D87');
          const jabatanDir = getCellValue(sheetSpk, 'D89');
          const pekerjaan = getCellValue(sheetSpk, 'D28');
          const noUndangan = getCellValue(sheetSpk, 'D8');
          const noBahpl = getCellValue(sheetSpk, 'D14');
          const noSpk = getCellValue(sheetSpk, 'D19');
          const nominalSpk = getCellValue(sheetSpk, 'F41');
          const noBast = getCellValue(sheetSpk, 'D21');
          const noBap = getCellValue(sheetSpk, 'D23');

          const dateBahpl = parseExcelDate(sheetSpk['E14']);
          const tglBahpl = dateBahpl ? formatDateIndo(dateBahpl) : parseTextDateToIndo(getCellValue(sheetSpk, 'E14'));

          const dateSpk = parseExcelDate(sheetSpk['E19']);
          const tglSpk = dateSpk ? formatDateIndo(dateSpk) : parseTextDateToIndo(getCellValue(sheetSpk, 'E19'));

          const dateAkhir = parseExcelDate(sheetSpk['E21']);
          
          let waktuPelaksanaan = '';
          if (dateSpk && dateAkhir) {
            if (dateSpk.getFullYear() === dateAkhir.getFullYear()) {
              waktuPelaksanaan = `${formatDateIndo(dateSpk, false)} s/d ${formatDateIndo(dateAkhir, true)}`;
            } else {
              waktuPelaksanaan = `${formatDateIndo(dateSpk, true)} s/d ${formatDateIndo(dateAkhir, true)}`;
            }
          } else {
            const textAwal = parseTextDateToIndo(getCellValue(sheetSpk, 'E19'));
            const textAkhir = parseTextDateToIndo(getCellValue(sheetSpk, 'E21'));
            waktuPelaksanaan = (textAwal || textAkhir) ? `${textAwal} s/d ${textAkhir}` : '';
          }

          const tglBayar = dateAkhir ? formatDateIndo(dateAkhir) : parseTextDateToIndo(getCellValue(sheetSpk, 'E21'));
          const tglBast = dateAkhir ? formatDateIndo(dateAkhir) : parseTextDateToIndo(getCellValue(sheetSpk, 'E21'));

          const matchNo = file.name.match(/^(\d+)/);
          const noKontrak = matchNo ? matchNo[1] : file.name.replace(/\.[^/.]+$/, "");

          const formatValue = (val) => val && String(val).trim() !== '' ? val : '(Kosong)';

          // --- PROSES SHEET "MATRIX" ---
          const sheetMatrixName = workbook.SheetNames.find(n => n.trim().toUpperCase() === 'MATRIX');
          let matrixData = [];
          
          if (sheetMatrixName) {
            const sheetMatrix = workbook.Sheets[sheetMatrixName];
            
            for (let i = 9; i <= 64; i++) {
              matrixData.push([
                getCellValue(sheetMatrix, `A${i}`), 
                parseTextDateToIndo(String(getCellValue(sheetMatrix, `B${i}`) || "")), // Deteksi tanggal di Uraian
                parseTextDateToIndo(String(getCellValue(sheetMatrix, `C${i}`) || "")), // Deteksi tanggal di Spesifikasi Teknis
                getCellValue(sheetMatrix, `D${i}`), 
                getCellValue(sheetMatrix, `E${i}`), 
                getCellValue(sheetMatrix, `F${i}`), 
                getCellValue(sheetMatrix, `G${i}`), 
                getCellValue(sheetMatrix, `H${i}`), 
                "", "", "", "",                     
                getCellValue(sheetMatrix, `M${i}`), 
                getCellValue(sheetMatrix, `N${i}`)  
              ]);
            }

            // --- AUTO LETTERING / PENOMORAN ABJAD OTOMATIS ---
            let currentLetterCode = 97; // Mulai dari huruf 'a' (ASCII 97)
            
            // Daftar kata kunci kategori yang akan memicu pemberian huruf otomatis
            const targetKeywords = [
              "alat tulis", "penggandaan", "fotocopy", "spanduk", "backdrop",
              "id card", "pelaporan", "seminar kit", "konsumsi", "snack"
            ];

            for (let r = 0; r < matrixData.length; r++) {
              let colB = String(matrixData[r][1] || "").toLowerCase();
              
              // Cek apakah isi kolom B adalah salah satu kategori di atas
              let isTarget = targetKeywords.some(kw => colB.includes(kw));

              if (isTarget) {
                // Timpa (replace) kolom A secara paksa dengan huruf yang berurutan
                matrixData[r][0] = String.fromCharCode(currentLetterCode);
                currentLetterCode++; // Lanjut ke huruf berikutnya (b, c, d, dst)
              }
            }
            
            matrixData.push([
              "TOTAL KESELURUHAN", "", "", "", "", "", "", "", "", "", "", "", "", 
              getCellValue(sheetMatrix, `N65`)                                     
            ]);
            
            matrixData.push([
              "PEMBULATAN", "", "", "", "", "", "", "", "", "", "", "", "",        
              getCellValue(sheetMatrix, `N66`)                                     
            ]);
          }

          resolve({
            id: crypto.randomUUID(),
            filename: file.name,
            noKontrak: formatValue(noKontrak),
            pejabat: formatValue(pejabat),
            nip: formatValue(nip),
            pt: formatValue(pt),
            direktur: formatValue(direktur),
            jabatanDir: formatValue(jabatanDir),
            pekerjaan: formatValue(pekerjaan),
            noUndangan: formatValue(noUndangan),
            noBahpl: formatValue(noBahpl),
            tglBahpl: formatValue(tglBahpl),
            noSpk: formatValue(noSpk),
            tglSpk: formatValue(tglSpk),
            nominalSpk: formatValue(nominalSpk),
            waktuPelaksanaan: formatValue(waktuPelaksanaan),
            tglBayar: formatValue(tglBayar),
            alamatPt: formatValue(alamatPt),
            noBast: formatValue(noBast),
            tglBast: formatValue(tglBast),
            noBap: formatValue(noBap),
            matrixData: matrixData 
          });
        } catch (error) {
          console.error("Gagal membaca file:", file.name, error);
          resolve({ id: crypto.randomUUID(), filename: file.name, pt: 'Error', matrixData: [] });
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFiles = async (files) => {
    if (!libsLoaded) {
      showToast("Sistem pemrosesan sedang dimuat, mohon tunggu sebentar.");
      return;
    }

    setIsLoading(true);
    const validFiles = Array.from(files).filter(
      (f) => f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv')
    );

    if (validFiles.length === 0) {
      setIsLoading(false);
      showToast("Tolong masukkan file Excel yang valid (.xlsx atau .xls).");
      return;
    }

    const results = await Promise.all(validFiles.map(processFile));
    
    setFilesData((prev) => {
      const combinedFiles = [...prev, ...results];
      return combinedFiles.sort((a, b) => {
        const matchA = a.filename.match(/^(\d+)/);
        const matchB = b.filename.match(/^(\d+)/);
        const numA = matchA ? parseInt(matchA[1], 10) : 999999;
        const numB = matchB ? parseInt(matchB[1], 10) : 999999;
        return numA - numB;
      });
    });
    
    setIsLoading(false);
  };

  const onDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [libsLoaded]);

  const onFileInputChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = null; 
  };

  // =============== FITUR GENERATE PDF ===============
  const generatePDF = (file) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    let metadataStartY = 46;

    // --- KOP SURAT ---
    if (kopImage) {
      // Menjaga Aspect Ratio Kop Surat
      const format = kopImage.src.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      const maxW = 180;
      const maxH = 35; // Batas tinggi maksimal gambar
      const ratio = kopImage.width / kopImage.height;
      
      let renderW = maxW;
      let renderH = renderW / ratio;

      // Jika tingginya melebihi batas, scale down berdasarkan tinggi
      if (renderH > maxH) {
        renderH = maxH;
        renderW = renderH * ratio;
      }

      // Posisikan gambar persis di tengah (center) horizontal
      const xPos = 15 + ((maxW - renderW) / 2);
      
      doc.addImage(kopImage.src, format, xPos, 10, renderW, renderH);
      
      // Sesuaikan start Y untuk metadata jika kop terlalu tinggi
      metadataStartY = Math.max(46, 10 + renderH + 5);
    } else {
      // Fallback: Jika tidak ada gambar, gunakan teks bawaan
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(23, 54, 93); 
      doc.text("BADAN GIZI NASIONAL (NATIONAL NUTRITION AGENCY)", 40, 20);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0); 
      doc.text("Jalan Kebon Sirih No.1 RT.1 RW.7 Kebon Sirih, Kec. Menteng,", 40, 26);
      doc.text("Kota Jakarta Pusat, Daerah Khusus Jakarta 10340", 40, 31);
      
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.circle(25, 23, 11);
      doc.circle(25, 23, 10);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("LOGO BGN", 25, 23, {align: 'center', baseline: 'middle'});
      
      // Garis Bawah Kop
      doc.setLineWidth(0.8);
      doc.line(15, 36, 195, 36);
      doc.setLineWidth(0.3);
      doc.line(15, 37.5, 195, 37.5);
    }
    
    // --- METADATA SURAT ---
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Lampiran", 15, metadataStartY); doc.text(": Surat Perintah Kerja", 35, metadataStartY);
    doc.text("Nomor", 15, metadataStartY + 5);    doc.text(`: ${file.noSpk || '-'}`, 35, metadataStartY + 5);
    doc.text("Tanggal", 15, metadataStartY + 10);  doc.text(`: ${file.tglSpk || '-'}`, 35, metadataStartY + 10);
    
    // --- JUDUL PEKERJAAN ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const titleText = file.pekerjaan || "(Nama Pekerjaan Belum Ditemukan)";
    const titleLines = doc.splitTextToSize(titleText, 160);
    doc.text(titleLines, 105, metadataStartY + 22, { align: 'center' });
    
    let startY = metadataStartY + 22 + (titleLines.length * 5) + 6;
    
    // --- TABEL MATRIX (RAB) ---
    const tableBody = [];
    let totalAmount = 0;
    
    if(file.matrixData && file.matrixData.length > 0) {
      file.matrixData.forEach(row => {
        let no = row[0];
        let uraian = row[1]; // Kolom B
        let spek = row[2];   // Kolom C (Spesifikasi Teknis)
        let vol = [row[3], row[4], row[5], row[6], row[7]].filter(Boolean).join(' '); // Kolom D-H
        let harga = row[12]; // Kolom M
        let total = row[13]; // Kolom N
        
        if(no === "TOTAL KESELURUHAN" || no === "PEMBULATAN") {
          tableBody.push([
            {content: String(no), colSpan: 5, styles: {halign: 'center', fontStyle: 'bold'}}, 
            {content: String(total), styles: {halign: 'right', fontStyle: 'bold'}}
          ]);
          if(no === "PEMBULATAN") {
            totalAmount = parseInt(String(total).replace(/[^0-9]/g, ''), 10) || 0;
          }
        } else {
          // Hanya masukkan ke tabel jika setidaknya salah satu kolom ada isinya
          if(String(no).trim() || String(uraian).trim() || String(spek).trim() || String(vol).trim() || String(harga).trim() || String(total).trim()){
             tableBody.push([
               String(no || ""), 
               String(uraian || ""), 
               String(spek || ""),
               String(vol || ""), 
               String(harga || ""), 
               String(total || "")
             ]);
          }
        }
      });
    }
    
    // Fallback ambil dari SPK kalau matrix kosong / error
    if(totalAmount === 0) {
      totalAmount = parseInt(String(file.nominalSpk).replace(/[^0-9]/g, ''), 10) || 0;
    }
    
    doc.autoTable({
      startY: startY,
      showHead: 'firstPage', // Memastikan header hanya muncul di halaman pertama
      head: [['NO', 'URAIAN', 'SPESIFIKASI TEKNIS', 'VOLUME', 'HARGA SATUAN', 'BIAYA TOTAL']],
      body: tableBody,
      theme: 'grid',
      headStyles: { 
        fillColor: [255, 255, 255], 
        textColor: 0, 
        fontStyle: 'bold', 
        font: 'helvetica', 
        lineWidth: 0.1, 
        lineColor: 0, 
        halign: 'center',
        valign: 'middle' // Header rata tengah vertikal
      },
      styles: { 
        font: 'helvetica', 
        fontSize: 9, 
        textColor: 0, 
        lineColor: 0, 
        lineWidth: 0.1,
        valign: 'middle' // Seluruh isi tabel rata tengah vertikal
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left' },   // Uraian (Dibiarkan otomatis mengambil sisa ruang)
        2: { halign: 'center', minCellWidth: 35 }, // Spesifikasi Teknis (Kunci lebar minimal agar header tidak vertikal)
        3: { halign: 'center', minCellWidth: 32 }, // Volume: Center & diperlebar agar tidak turun baris
        4: { halign: 'right', minCellWidth: 25 },  // Harga
        5: { halign: 'right', minCellWidth: 25 }   // Total
      },
      margin: { left: 15, right: 15 }
    });
    
    let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : startY + 20;
    
    // --- TERBILANG ---
    doc.setFont("helvetica", "normal"); // Mengubah font menjadi normal (tidak bold/italic)
    doc.setFontSize(10);
    const terbilangStr = getTerbilang(totalAmount);
    // Menambahkan tanda kurung mengapit teks terbilang
    const terbilangLines = doc.splitTextToSize(`Terbilang : (${terbilangStr})`, 170);
    doc.text(terbilangLines, 15, finalY);
    
    finalY += (terbilangLines.length * 5) + 12;
    
    // Pindah halaman jika tanda tangan terpotong
    if (finalY > 240) {
      doc.addPage();
      finalY = 25;
    }
    
    // --- TANDA TANGAN ---
    doc.setFont("helvetica", "normal");
    doc.text("PIHAK KEDUA ,", 55, finalY, {align: 'center'});
    doc.text("PIHAK PERTAMA ,", 155, finalY, {align: 'center'});
    
    finalY += 28; // Spasi untuk coretan tanda tangan
    
    doc.text(file.direktur !== '(Kosong)' ? file.direktur : "(Nama Direktur)", 55, finalY, {align: 'center'});
    doc.text(file.jabatanDir !== '(Kosong)' ? file.jabatanDir : "Direktur", 55, finalY + 5, {align: 'center'});
    
    doc.text(file.pejabat !== '(Kosong)' ? file.pejabat : "(Nama Pejabat)", 155, finalY, {align: 'center'});
    doc.text(`NIP. ${file.nip !== '(Kosong)' ? file.nip : "-"}`, 155, finalY + 5, {align: 'center'});
    
    return doc;
  };

  const downloadAllPDFsZIP = async () => {
    if (filesData.length === 0) return;
    setIsExporting(true);
    
    try {
      const zip = new window.JSZip();
      
      for (const file of filesData) {
        // Buat PDF
        const doc = generatePDF(file);
        const pdfBlob = doc.output('blob');
        
        // Bersihkan nama file dari karakter terlarang Windows
        const safeNoKontrak = (file.noKontrak || file.filename).replace(/[/\\?%*:|"<>]/g, '-');
        const filename = `lampiran_spk_${safeNoKontrak}.pdf`;
        
        // Masukkan file PDF ke dalam instansi ZIP
        zip.file(filename, pdfBlob);
      }
      
      // Generate ZIP dan trigger Download
      const zipContent = await zip.generateAsync({ type: 'blob' });
      window.saveAs(zipContent, 'Dokumen_Lampiran_SPK_Full.zip');
      
      showToast("Berhasil mendownload semua PDF dalam bentuk ZIP!");
    } catch (error) {
      console.error("Error generating ZIP:", error);
      showToast("Terjadi kesalahan saat memproses ZIP.");
    } finally {
      setIsExporting(false);
    }
  };

  const copySPKData = () => {
    if (filesData.length === 0) return;
    const textToCopy = filesData.map(row => {
      return [
        row.noKontrak, row.pejabat, row.nip, row.pt, row.direktur, row.jabatanDir,
        row.pekerjaan, row.noUndangan, row.noBahpl, row.tglBahpl, row.noSpk,
        row.tglSpk, row.nominalSpk, row.waktuPelaksanaan, row.tglBayar, row.alamatPt,
        row.noBast, row.tglBast, row.noBap
      ].join('\t');
    }).join('\n');

    executeCopy(textToCopy, "Berhasil di-copy! Siap di-paste ke 19 Kolom Excel SPK.");
  };

  const copyMatrixData = (fileId = null) => {
    const filesToCopy = fileId ? filesData.filter(f => f.id === fileId) : filesData;
    if (filesToCopy.length === 0) return;

    const textToCopy = filesToCopy.map(file => {
      if (!file.matrixData || file.matrixData.length === 0) return ``; 
      return file.matrixData.map(row => row.join('\t')).join('\n');
    }).filter(text => text !== "").join('\n\n'); 

    if (!textToCopy) {
      showToast("Data Matrix tidak ditemukan pada file yang dipilih.");
      return;
    }

    executeCopy(textToCopy, `Berhasil copy Matrix ${fileId ? 'untuk 1 file' : 'semua file'}! Paste di A9.`);
  };

  const executeCopy = (text, successMsg) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast(successMsg);
    } catch (err) {
      console.error('Gagal menyalin:', err);
      showToast("Gagal menyalin ke clipboard.");
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const clearData = () => setFilesData([]);
  const removeRow = (idToRemove) => setFilesData(prev => prev.filter(row => row.id !== idToRemove));

  const duplicatePrefixes = useMemo(() => {
    const seen = {};
    const dupes = new Set();
    filesData.forEach(item => {
      const match = item.filename.match(/^(\d+)/);
      if (match) {
        const numStr = match[1];
        if (seen[numStr]) dupes.add(numStr);
        seen[numStr] = true;
      }
    });
    return Array.from(dupes);
  }, [filesData]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800 relative">
      
      {/* Loading Overlay Exporting ZIP */}
      {isExporting && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white">
           <FileArchive size={64} className="mb-4 animate-bounce text-emerald-400" />
           <h2 className="text-2xl font-bold">Merangkai PDF & ZIP...</h2>
           <p className="mt-2 text-slate-200">Mohon tunggu, memproses {filesData.length} dokumen SPK & Matrix.</p>
        </div>
      )}

      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 z-40 animate-bounce">
          <CheckCircle2 size={20} className="text-green-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-3">
            <FileSpreadsheet className="text-emerald-600" size={32} />
            Data Extractor: PDF & SPK Auto-Generate
          </h1>
          <p className="text-slate-500">
            Tarik file Excel ke sini. Unduh otomatis puluhan PDF Lampiran SPK persis seperti format aslinya.
          </p>
        </div>

        {/* Section Upload Kop Surat */}
        <div className="max-w-3xl mx-auto bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${kopImage ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
              <ImagePlus size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-700 text-sm">Kop Surat Kustom (Opsional)</h3>
              <p className="text-xs text-slate-500">Upload format PNG/JPG untuk mengganti Kop bawaan di PDF.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {kopImage && (
              <div className="relative border border-slate-200 rounded overflow-hidden w-24 h-10 flex items-center justify-center bg-slate-50">
                <img src={kopImage.src} alt="Kop Surat Preview" className="max-h-full max-w-full object-contain" />
                <button 
                  onClick={() => setKopImage(null)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                  title="Hapus Kop Surat"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            <input 
              type="file" 
              accept=".png, .jpg, .jpeg" 
              className="hidden" 
              ref={kopInputRef} 
              onChange={handleKopUpload} 
            />
            <button 
              onClick={() => kopInputRef.current?.click()}
              className="px-4 py-2 text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
            >
              {kopImage ? 'Ganti Gambar' : 'Pilih Gambar'}
            </button>
          </div>
        </div>

        <div 
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            max-w-3xl mx-auto border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
            flex flex-col items-center justify-center gap-4 bg-white
            ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'}
            ${!libsLoaded ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input type="file" multiple accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} onChange={onFileInputChange} />
          <div className={`p-4 rounded-full ${isDragging ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
            <UploadCloud size={48} />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-700">
              {isDragging ? 'Lepaskan file di sini...' : 'Tarik & Lepas file Excel Anda ke sini'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {libsLoaded ? "Siap memproses ratusan file sekaligus" : "Memuat sistem (Loading...)"}
            </p>
          </div>
        </div>

        {duplicatePrefixes.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 rounded-xl flex items-start gap-3 shadow-sm max-w-3xl mx-auto">
            <AlertCircle className="shrink-0 mt-0.5 text-amber-600" size={24} />
            <div>
              <h3 className="font-semibold text-lg">Perhatian: Ada Nomor Urut Ganda!</h3>
              <p className="mt-1 text-sm">
                Ditemukan file dengan awalan angka kembar: <strong className="bg-amber-200 px-2 py-0.5 rounded">{duplicatePrefixes.join(', ')}</strong>.
              </p>
            </div>
          </div>
        )}

        {filesData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* TABS NAVIGATION */}
            <div className="flex border-b border-slate-200 bg-slate-50">
              <button 
                onClick={() => setActiveTab('spk')}
                className={`flex-1 py-4 font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${activeTab === 'spk' ? 'border-b-2 border-emerald-500 text-emerald-700 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
              >
                <FileText size={18} /> Data SPK & Dokumen PDF
              </button>
              <button 
                onClick={() => setActiveTab('matrix')}
                className={`flex-1 py-4 font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${activeTab === 'matrix' ? 'border-b-2 border-emerald-500 text-emerald-700 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
              >
                <LayoutGrid size={18} /> Data Matrix / RAB
              </button>
            </div>

            {/* TAB CONTENT: SPK */}
            {activeTab === 'spk' && (
              <>
                <div className="p-4 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-4">
                  <h2 className="font-semibold text-slate-700">Hasil SPK ({filesData.length} file)</h2>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={clearData} className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2">
                      <Trash2 size={16} /> Bersihkan
                    </button>
                    <button onClick={copySPKData} className="px-4 py-2 text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg shadow-sm transition-all flex items-center gap-2">
                      <Copy size={16} /> Copy 19 Kolom SPK
                    </button>
                    <button 
                      onClick={downloadAllPDFsZIP} 
                      disabled={isExporting}
                      className="px-4 py-2 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      <Download size={16} /> {isExporting ? "Memproses..." : "Download Semua PDF (ZIP)"}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto relative">
                  <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <th className="p-3 font-medium sticky left-0 bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Nama File</th>
                        <th className="p-3 font-medium border-l border-slate-200 bg-amber-50 text-amber-700">No Kontrak</th>
                        <th className="p-3 font-medium border-l border-slate-200">Pejabat (D58)</th>
                        <th className="p-3 font-medium border-l border-slate-200">NIP (D59)</th>
                        <th className="p-3 font-medium border-l border-slate-200">PT (D77)</th>
                        <th className="p-3 font-medium border-l border-slate-200">Direktur (D87)</th>
                        <th className="p-3 font-medium border-l border-slate-200">Jabatan (D89)</th>
                        <th className="p-3 font-medium border-l border-slate-200">Pekerjaan (D28)</th>
                        <th className="p-3 font-medium border-l border-slate-200">No Undangan (D8)</th>
                        <th className="p-3 font-medium border-l border-slate-200">No BAHPL (D14)</th>
                        <th className="p-3 font-medium border-l border-slate-200">Tgl BAHPL (E14)</th>
                        <th className="p-3 font-medium border-l border-slate-200">No SPK (D19)</th>
                        <th className="p-3 font-medium border-l border-slate-200">Tgl SPK (E19)</th>
                        <th className="p-3 font-medium border-l border-slate-200">Nominal (F41)</th>
                        <th className="p-3 font-medium border-l border-slate-200 text-emerald-600">Waktu (E19-E21)</th>
                        <th className="p-3 font-medium border-l border-slate-200">Tgl Bayar (E21)</th>
                        <th className="p-3 font-medium border-l border-slate-200">Alamat (D78)</th>
                        <th className="p-3 font-medium border-l border-slate-200">No BAST (D21)</th>
                        <th className="p-3 font-medium border-l border-slate-200">Tgl BAST (E21)</th>
                        <th className="p-3 font-medium border-l border-slate-200">No BAP (D23)</th>
                        <th className="p-3 font-medium text-center border-l border-slate-200">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filesData.map((row) => (
                        <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-slate-600 max-w-[150px] truncate sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]" title={row.filename}>{row.filename}</td>
                          <td className="p-3 border-l border-slate-100 font-medium text-amber-700 bg-amber-50/40">{row.noKontrak}</td>
                          <td className="p-3 border-l border-slate-100">{row.pejabat}</td>
                          <td className="p-3 border-l border-slate-100 text-slate-500">{row.nip}</td>
                          <td className="p-3 border-l border-slate-100 font-medium text-emerald-700 bg-emerald-50/20">{row.pt}</td>
                          <td className="p-3 border-l border-slate-100">{row.direktur}</td>
                          <td className="p-3 border-l border-slate-100 text-slate-500">{row.jabatanDir}</td>
                          <td className="p-3 border-l border-slate-100 max-w-[200px] truncate" title={row.pekerjaan}>{row.pekerjaan}</td>
                          <td className="p-3 border-l border-slate-100">{row.noUndangan}</td>
                          <td className="p-3 border-l border-slate-100">{row.noBahpl}</td>
                          <td className="p-3 border-l border-slate-100">{row.tglBahpl}</td>
                          <td className="p-3 border-l border-slate-100 font-medium text-slate-700">{row.noSpk}</td>
                          <td className="p-3 border-l border-slate-100">{row.tglSpk}</td>
                          <td className="p-3 border-l border-slate-100 font-medium">{row.nominalSpk}</td>
                          <td className="p-3 border-l border-slate-100 font-medium text-emerald-600 bg-emerald-50/40">{row.waktuPelaksanaan}</td>
                          <td className="p-3 border-l border-slate-100">{row.tglBayar}</td>
                          <td className="p-3 border-l border-slate-100 max-w-[200px] truncate" title={row.alamatPt}>{row.alamatPt}</td>
                          <td className="p-3 border-l border-slate-100">{row.noBast}</td>
                          <td className="p-3 border-l border-slate-100">{row.tglBast}</td>
                          <td className="p-3 border-l border-slate-100">{row.noBap}</td>
                          <td className="p-3 text-center border-l border-slate-100">
                            <button onClick={() => removeRow(row.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* TAB CONTENT: MATRIX */}
            {activeTab === 'matrix' && (
              <>
                <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
                  <h2 className="font-semibold text-slate-700">Daftar Sheet Matrix</h2>
                  <button onClick={() => copyMatrixData()} className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm transition-all flex items-center gap-2 active:scale-95">
                    <Copy size={16} /> Copy Semua Matrix
                  </button>
                </div>

                <div className="p-4">
                  <table className="w-full text-left border-collapse text-sm border border-slate-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <th className="p-3 font-medium w-12 text-center">No</th>
                        <th className="p-3 font-medium">Nama File</th>
                        <th className="p-3 font-medium">Status Sheet MATRIX</th>
                        <th className="p-3 font-medium text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filesData.map((row, index) => {
                        const hasMatrix = row.matrixData && row.matrixData.length > 0;
                        return (
                          <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-slate-500 text-center">{index + 1}</td>
                            <td className="p-3 text-slate-700 font-medium">{row.filename}</td>
                            <td className="p-3">
                              {hasMatrix ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700">
                                  <CheckCircle2 size={14} /> Berhasil (Baris 9 - 66)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700">
                                  <AlertCircle size={14} /> Sheet tidak ditemukan
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <button 
                                onClick={() => copyMatrixData(row.id)}
                                disabled={!hasMatrix}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-2 ml-auto transition-colors ${hasMatrix ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-emerald-600 shadow-sm' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                              >
                                <Copy size={14} /> Copy Matrix
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {isLoading && (
              <div className="p-6 text-center text-slate-500 flex justify-center items-center gap-3">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                Sedang mengekstrak file Excel...
              </div>
            )}
            
          </div>
        )}

      </div>
    </div>
  );
}