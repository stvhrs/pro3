import React, { useState, useEffect, useRef } from 'react';
    import { 
    Upload, Printer, Image as ImageIcon, CheckSquare, 
    AlertCircle, FileSpreadsheet, Users, Store, 
    Trash2, Plus, Save, Edit3, Briefcase, Loader2, Calendar, Paperclip, FileText, Download,
    ArrowUpDown, ArrowUp, ArrowDown, 
    Scissors, RotateCcw 
    } from 'lucide-react';

    // --- DATABASE KEGIATAN ARKAS (SAMA SEPERTI SEBELUMNYA) ---
    const ARKAS_ACTIVITIES = [
    { "kode": "02.02.01", "snp": "Isi", "komponen": "Pengembangan Perpustakaan", "uraian": "Kegiatan pemberdayaan perpustakaan terutama untuk pengembangan minat baca peserta didik" },
    { "kode": "02.03.01", "snp": "Isi", "komponen": "Pelaksanaan kegiatan pembelajaran dan ekstrakurikuler", "uraian": "Penyusunan Kurikulum" },
    { "kode": "02.03.02", "snp": "", "komponen": "Pelaksanaan kegiatan pembelajaran dan ekstrakurikuler", "uraian": "Penyusunan kurikulum kompetensi keahlian" },
    { "kode": "02.06.01", "snp": "Isi", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Kegiatan diskusi kolaborasi pengembangan RPP dalam Komunitas Belajar (termasuk KKG/MGMP/MGMPS/MGPMPK)" },
    { "kode": "03.01.01", "snp": "Proses", "komponen": "Penerimaan Peserta Didik Baru", "uraian": "Pelaksanaan Pendaftaran Peserta Didik Baru (PPDB)" },
    { "kode": "03.01.02", "snp": "Proses", "komponen": "Penerimaan Peserta Didik Baru", "uraian": "Pendataan ulang bagi Peserta Didik lama" },
    { "kode": "03.01.03", "snp": "Proses", "komponen": "Penerimaan Peserta Didik Baru", "uraian": "Pelaksanaan kegiatan orientasi siswa baru yang bersifat akademik dan pengenalan lingkungan tanpa kekerasan" },
    { "kode": "03.02.01", "snp": "Proses", "komponen": "Pengembangan Perpustakaan", "uraian": "Pelaksanaan kegiatan publikasi berkala sekolah (Majalah Sekolah, Majalah Dinding)" },
    { "kode": "03.02.02", "snp": "Proses", "komponen": "Pengembangan Perpustakaan", "uraian": "Pembeliaan Buku Lembar Kerja Siswa" },
    { "kode": "03.02.03", "snp": "Proses", "komponen": "Pengembangan Perpustakaan", "uraian": "Penyediaan atau pembiayaan langganan platform perpustakaan digital" },
    { "kode": "03.03.01", "snp": "Proses", "komponen": "Pelaksanaan kegiatan pembelajaran dan ekstrakurikuler", "uraian": "Penyusunan Silabus / Tujuan Pembelajaran" },
    { "kode": "03.03.02", "snp": "Proses", "komponen": "Pelaksanaan kegiatan pembelajaran dan ekstrakurikuler", "uraian": "Pengembangan Kegiatan Literasi dan Numerasi" },
    { "kode": "03.03.04", "snp": "Proses", "komponen": "Pelaksanaan kegiatan pembelajaran dan ekstrakurikuler", "uraian": "Pengembangan pembelajaran berbasis projek (termasuk P5)" },
    { "kode": "03.03.05", "snp": "Proses", "komponen": "Pelaksanaan kegiatan pembelajaran dan ekstrakurikuler", "uraian": "Penyelenggaraan Perbaikan/Pengayaan (Remedial)" },
    { "kode": "03.03.06", "snp": "Proses", "komponen": "Pelaksanaan kegiatan pembelajaran dan ekstrakurikuler", "uraian": "Pelaksanaan Ekstrakurikuler Kepramukaan" },
    { "kode": "03.03.07", "snp": "Proses", "komponen": "Pelaksanaan kegiatan pembelajaran dan ekstrakurikuler", "uraian": "Pelaksanaan Kegiatan Ekstrakurikuler (diluar Kepramukaan)" },
    { "kode": "03.03.08", "snp": "Proses", "komponen": "Pelaksanaan kegiatan pembelajaran dan ekstrakurikuler", "uraian": "Program Pembinaan Kesiswaan dan Kepemimpinan Siswa" },
    { "kode": "03.03.10", "snp": "", "komponen": "", "uraian": "Pengembangan program pencegahan dan penanganan kekerasan di satuan pendidikan (termasuk Program Roots)" },
    { "kode": "03.03.11", "snp": "", "komponen": "Pelaksanaan kegiatan pembelajaran dan ekstrakurikuler", "uraian": "Penerapan Program Pencegahan Perundungan" },
    { "kode": "03.03.12", "snp": "Proses", "komponen": "Pelaksanaan kegiatan pembelajaran dan ekstrakurikuler", "uraian": "Penyelenggaraan: pencegahan penyalahgunaan narkotika, psikotropika, zat adiktif (narkoba), minuman keras, merokok, dan HIV AIDS" },
    { "kode": "03.03.13", "snp": "Proses", "komponen": "Pelaksanaan kegiatan pembelajaran dan ekstrakurikuler", "uraian": "Konsultasi peningkatan mutu pendidikan (Konsultan & Psikolog)" },
    { "kode": "03.03.14", "snp": "Proses", "komponen": "Pelaksanaan kegiatan pembelajaran dan ekstrakurikuler", "uraian": "Penyelenggaraan Pesantren Kilat dan Kegiatan Keagamaan Sejenis" },
    { "kode": "03.03.15", "snp": "Proses", "komponen": "Pelaksanaan kegiatan pembelajaran dan ekstrakurikuler", "uraian": "Pengembangan kegiatan pelibatan orang tua/wali/keluarga di pembelajaran" },
    { "kode": "03.03.16", "snp": "Proses", "komponen": "Pelaksanaan kegiatan pembelajaran dan ekstrakurikuler", "uraian": "Penyusunan Pembagian Tugas Guru dan Jadwal Pelajaran" },
    { "kode": "03.03.17", "snp": "", "komponen": "Pelaksanaan kegiatan pembelajaran dan ekstrakurikuler", "uraian": "Pembiayaan untuk partisipasi kegiatan berbagi praktik baik" },
    { "kode": "03.03.18", "snp": "Proses", "komponen": "Pelaksanaan kegiatan pembelajaran dan ekstrakurikuler", "uraian": "Pengayaan TIK untuk memfasilitasi kegiatan pembelajaran" },
    { "kode": "03.03.19", "snp": "Proses", "komponen": "Pelaksanaan kegiatan pembelajaran dan ekstrakurikuler", "uraian": "Pelaksanaan Lomba Lomba" },
    { "kode": "03.03.20", "snp": "Proses", "komponen": "Pelaksanaan kegiatan pembelajaran dan ekstrakurikuler", "uraian": "Pelaksanaan Program-Program Sekolah Lainnya" },
    { "kode": "03.03.21", "snp": "Proses", "komponen": "Pelaksanaan kegiatan pembelajaran dan ekstrakurikuler", "uraian": "Perayaan Hari Besar Agama, Nasional, dan Daerah" },
    { "kode": "03.03.22", "snp": "Proses", "komponen": "Pelaksanaan kegiatan pembelajaran dan ekstrakurikuler", "uraian": "Penyelenggaraan Pembelajaran aktif, kreatif, efektif, dan nyaman" },
    { "kode": "03.04.01", "snp": "Proses", "komponen": "Pelaksanaan Kegiatan Asesmen dan Evaluasi Pembelajaran", "uraian": "Pelaksanaan supervisi pembelajaran semua mapel/guru di sekolah" },
    { "kode": "03.04.02", "snp": "Proses", "komponen": "Pelaksanaan Kegiatan Asesmen dan Evaluasi Pembelajaran", "uraian": "Pelaksanaan Evaluasi kegiatan ekstrakurikuler" },
    { "kode": "03.05.01", "snp": "", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Kegiatan koordinasi dan pelaporan untuk mendukung Program Prioritas Pusat (Program Indonesia Pintar, BOSP, Sekolah Penggerak, dll.)" },
    { "kode": "03.05.02", "snp": "Proses", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Penyelenggaraan UKS, penyediaan alat peralatan UKS dan bahan/obat-obatan penunjang kesehatan sekolah" },
    { "kode": "03.10.01", "snp": "Proses", "komponen": "Penyelenggaraan kegiatan peningkatan kompetensi keahlian", "uraian": "Pengembangan kerja sama industri dalam rangka peningkatan kompetensi keahlian di SMK atau SMALB" },
    { "kode": "03.10.02", "snp": "Proses", "komponen": "Penyelenggaraan kegiatan peningkatan kompetensi keahlian", "uraian": "Pengembangan Ruang Lingkup Skema Sertifikasi" },
    { "kode": "03.11.01", "snp": "", "komponen": "Penyelenggaraan kegiatan dalam mendukung keterserapan lulusan", "uraian": "Pembelajaran terkait budaya kerja" },
    { "kode": "03.11.02", "snp": "Proses", "komponen": "Penyelenggaraan kegiatan dalam mendukung keterserapan lulusan", "uraian": "Penyelenggaraan bursa kerja khusus SMK atau SMALB" },
    { "kode": "03.11.03", "snp": "Proses", "komponen": "Penyelenggaraan kegiatan dalam mendukung keterserapan lulusan", "uraian": "Pemantauan kebekerjaan lulusan (tracer study) SMK atau SMALB" },
    { "kode": "03.11.04", "snp": "Proses", "komponen": "Penyelenggaraan kegiatan dalam mendukung keterserapan lulusan", "uraian": "Penyelenggaraan Pendidikan Kejuruan bagi Peserta Didik SMK/SMALB" },
    { "kode": "04.06.01", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Pelaksanaan kegiatan komunitas belajar di satuan pendidikan" },
    { "kode": "04.06.02", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Kegiatan Komunitas Belajar antar sekolah (termasuk KKG, MGMP, MGMPS, MGMPK, KKKS, atau MKKS)" },
    { "kode": "04.06.03", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Pengembangan diri guru dan tenaga kependidikan materi lain di luar PMM" },
    { "kode": "04.06.04", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Pengembangan diri guru dan tenaga kependidikan materi lain melalui PMM" },
    { "kode": "04.06.05", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Guru" },
    { "kode": "04.06.06", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Kepala Sekolah" },
    { "kode": "04.06.07", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Pembinaan dan Peningkatan Kompetensi Tenaga Pelaksana Sekolah (Tenaga Ekstrakurikuler, TU, Laboratorium, Perustakaan, dan UKS)" },
    { "kode": "04.06.08", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Fasilitasi kepesertaan Guru dalam berbagai kegiatan prestasi guru" },
    { "kode": "04.06.09", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Kegiatan Magang Guru di Sekolah Lain" },
    { "kode": "04.06.11", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Guru untuk keterlibatan orangtua/wali dan masyarakat dalam pembelajaran" },
    { "kode": "04.06.12", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Guru untuk pengelolaan lingkungan pembelajaran yang aman dan nyaman" },
    { "kode": "04.06.13", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Guru untuk memperkuat numerasi" },
    { "kode": "04.06.14", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Guru untuk memperkuat literasi" },
    { "kode": "04.06.22", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Guru untuk memahami konten pembelajaran dan cara mengajarkannya" },
    { "kode": "04.06.23", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Guru untuk memahami Kurikulum dan cara menggunakannya" },
    { "kode": "04.06.24", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Guru untuk pengembangan diri melalui kebiasaan refleksi" },
    { "kode": "04.06.25", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Guru untuk pembelajaran berorientasi pada peserta didik" },
    { "kode": "04.06.26", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Guru untuk memahami kematangam moral, emosi, dan spiritual untuk berperilaku sesuai kode etik guru" },
    { "kode": "04.06.27", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Guru untuk asesmen, umpan balik dan pelaporan yang berpusat pada peserta didik" },
    { "kode": "04.06.31", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Guru untuk Pemahaman Profil Pelajar Pancasila: Bertakwa Kepada Tuhan YME dan Berakhlak Mulia" },
    { "kode": "04.06.32", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Guru untuk Pemahaman Profil Pelajar Pancasila: Gotong Royong" },
    { "kode": "04.06.33", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Guru untuk Pemahaman Profil Pelajar Pancasila: Kreativitas" },
    { "kode": "04.06.34", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Guru untuk Pemahaman Profil Pelajar Pancasila: Nalar Kritis" },
    { "kode": "04.06.35", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Guru untuk Pemahaman Profil Pelajar Pancasila: Kebinekaan Global" },
    { "kode": "04.06.36", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Guru untuk Pemahaman Profil Pelajar Pancasila: Kemandirian" },
    { "kode": "04.06.41", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Guru untuk memahami tentang perundungan, kekerasan, dan kekerasan seksual" },
    { "kode": "04.06.42", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Guru untuk memahami tentang disiplin positif (dan menghindari hukuman fisik)" },
    { "kode": "04.06.43", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Guru untuk memahami penyalahgunaan narkotika, psikotropika, zat adiktif (narkoba), minuman keras, merokok, dan HIV AIDS" },
    { "kode": "04.06.44", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Guru untuk memahami toleransi/kesetaraan/moderasi beragama dan budaya" },
    { "kode": "04.06.45", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Guru untuk memahami komitmen dan nilai-nilai kebangsaan" },
    { "kode": "04.06.46", "snp": "PTK", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Peningkatan Kompetensi Guru untuk memahami sikap inklusif, toleran, dan kesetaraan gender (termasuk pendidikan inklusif/disabilitas)" },
    { "kode": "05.02.01", "snp": "Sarpras", "komponen": "Pengembangan Perpustakaan", "uraian": "Pemeliharaan buku/koleksi perpustakaan" },
    { "kode": "05.02.02", "snp": "Sarpras", "komponen": "Pengembangan Perpustakaan", "uraian": "Pengadaan buku/koleksi perpustakaan (selain buku teks, pengayaan, dan referensi)" },
    { "kode": "05.02.03", "snp": "Sarpras", "komponen": "Pengembangan Perpustakaan", "uraian": "Pengadaan Buku Teks Utama/Pendamping Peserta Didik" },
    { "kode": "05.02.04", "snp": "Sarpras", "komponen": "Pengembangan Perpustakaan", "uraian": "Pengadaan Buku Teks Utama/Pendamping Guru" },
    { "kode": "05.02.05", "snp": "Sarpras", "komponen": "Pengembangan Perpustakaan", "uraian": "Pengadaan buku pengayaan dan referensi" },
    { "kode": "05.05.01", "snp": "Sarpras", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Penyediaan atau pembuatan media pembelajaran" },
    { "kode": "05.05.02", "snp": "Sarpras", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Pengembangan sekolah sehat, sekolah aman, sekolah ramah anak, sekolah inklusi, sekolah adiwiyata dan sejenisnya" },
    { "kode": "05.08.01", "snp": "Sarpras", "komponen": "Pemeliharaan Sarana dan Prasarana Sekolah", "uraian": "Pemeliharaan Prasarana Lahan, Bangunan dan Ruang" },
    { "kode": "05.08.02", "snp": "Sarpras", "komponen": "Pemeliharaan Sarana dan Prasarana Sekolah", "uraian": "Pengadaan Peralatan Sekolah diluar diluar komponen penyediaan alat multimedia pembelajaran" },
    { "kode": "05.08.03", "snp": "Sarpras", "komponen": "Pemeliharaan Sarana dan Prasarana Sekolah", "uraian": "Pemeliharaan Peralatan Sekolah" },
    { "kode": "05.08.04", "snp": "Sarpras", "komponen": "Pemeliharaan Sarana dan Prasarana Sekolah", "uraian": "Pengadaan Perlengkapan Sekolah diluar komponen penyediaan alat multimedia pembelajaran" },
    { "kode": "05.08.05", "snp": "Sarpras", "komponen": "Pemeliharaan Sarana dan Prasarana Sekolah", "uraian": "Pemeliharaan Perlengkapan Sekolah" },
    { "kode": "05.08.06", "snp": "Sarpras", "komponen": "Pemeliharaan Sarana dan Prasarana Sekolah", "uraian": "Penyediaan prasarana akses/fasilitas bagi Peserta Didik Penyandang Disabilitas" },
    { "kode": "05.08.07", "snp": "", "komponen": "Pemeliharaan Sarana dan Prasarana Sekolah", "uraian": "Pengadaan Peralatan untuk menunjang pembelajaran Peserta Didik Penyandang Disabilitas" },
    { "kode": "05.08.08", "snp": "", "komponen": "Pemeliharaan Sarana dan Prasarana Sekolah", "uraian": "Pengadaan Sarana Perlengkapan untuk mendukung Peserta Didik Disabilitas" },
    { "kode": "05.08.09", "snp": "Sarpras", "komponen": "Pemeliharaan Sarana dan Prasarana Sekolah", "uraian": "Pengadaan Perlengkapan Daya dan Jasa Sekolah (instalasi air, listrik, telepon, internet, termasuk genset/panel surya)" },
    { "kode": "05.08.10", "snp": "Sarpras", "komponen": "Pemeliharaan Sarana dan Prasarana Sekolah", "uraian": "Pemeliharaan Perlengkapan Daya dan Jasa Sekolah (instalasi air, listrik, internet, termasuk genset/panel surya)" },
    { "kode": "05.08.11", "snp": "Sarpras", "komponen": "Pemeliharaan Sarana dan Prasarana Sekolah", "uraian": "Pengadaan seragam untuk peserta didik, pendidik, dan tenaga kependidikan yang menjadi inventaris sekolah" },
    { "kode": "05.08.12", "snp": "Sarpras", "komponen": "Pemeliharaan Sarana dan Prasarana Sekolah", "uraian": "Tindakan tanggap darurat dampak bencana (tidak termasuk perbaikan setelah lewat tanggap darurat)" },
    { "kode": "05.09.01", "snp": "Sarpras", "komponen": "Penyediaan alat multimedia pembelajaran", "uraian": "Pengadaan Komputer Desktop/Work-station untuk Pembelajaran, Administrasi dan Perpustakaan" },
    { "kode": "05.09.02", "snp": "Sarpras", "komponen": "Penyediaan alat multimedia pembelajaran", "uraian": "Pengadaan Komputer Laptop, Notebook untuk Pembelajaran, Administrasi dan Perpustakaan" },
    { "kode": "05.09.04", "snp": "Sarpras", "komponen": "Penyediaan alat multimedia pembelajaran", "uraian": "Pengadaan Printer, Printer+Scanner, dan Scanner" },
    { "kode": "05.09.05", "snp": "Sarpras", "komponen": "Penyediaan alat multimedia pembelajaran", "uraian": "Pengadaan Proyektor, Layar Proyektor, dan Layar LCD/LED >= 32\"" },
    { "kode": "06.05.01", "snp": "Pengelolaan", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Penyusunan perencanaan program satuan pendidikan (Visi Misi Sekolah, RKJM, RKT, RKAS)" },
    { "kode": "06.05.02", "snp": "Pengelolaan", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Pengembangan dan Pelaksanaan Program Kerja Kepala Sekolah" },
    { "kode": "06.05.03", "snp": "Pengelolaan", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Pendataan Dapodik" },
    { "kode": "06.05.04", "snp": "Pengelolaan", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Pelaksanaan Monitoring Program/Kegiatan Sekolah" },
    { "kode": "06.05.05", "snp": "Pengelolaan", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Pelaksanaan Supervisi Administrasi Tata Usaha" },
    { "kode": "06.05.06", "snp": "Pengelolaan", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Konsumsi Rapat Kedinasan dan Tamu Sekolah (diluar kegiatan lain)" },
    { "kode": "06.05.07", "snp": "Pengelolaan", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Pengadaan Bahan Pembelajaran dan Praktik (termasuk Kejuruan/Bengkel)" },
    { "kode": "06.05.08", "snp": "Pengelolaan", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Pembelian Bahan Habis Pakai untuk mendukung pembelajaran dan administrasi sekolah (termasuk ATK, Tinta Printer, Kabel Ekstension, dsb)" },
    { "kode": "06.05.09", "snp": "Pengelolaan", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Pembelian bahan habis pakai/alat penunjang kebersihan dan sanitasi sekolah" },
    { "kode": "06.05.10", "snp": "Pengelolaan", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Pembelian Bahan Habis Pakai (termasuk Suku Cadang Alat) untuk Kegiatan Rumah Tangga Sekolah" },
    { "kode": "06.05.11", "snp": "Pengelolaan", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Pengelolaan dan operasional rutin sekolah dalam pembelajaran jarak jauh" },
    { "kode": "06.05.12", "snp": "Pengelolaan", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Pengembangan dan pemeliharaan Website Sekolah (termasuk media sosial sekolah)" },
    { "kode": "06.05.13", "snp": "Pengelolaan", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Pengembangan Sistem Informasi untuk menunjang Manajemen Sekolah" },
    { "kode": "06.05.14", "snp": "Pengelolaan", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Transportasi atau perjalanan dinas dalam rangka koordinasi dan pelaporan ke Dinas Pendidikan" },
    { "kode": "06.06.01", "snp": "Pengelolaan", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Kegiatan kerjasama dengan sekolah bertaraf internasional untuk peningkatan kompetensi guru" },
    { "kode": "06.07.01", "snp": "Pengelolaan", "komponen": "Pembiayaan langganan daya dan jasa", "uraian": "Pembayaran daya listrik" },
    { "kode": "06.07.02", "snp": "Pengelolaan", "komponen": "Pembiayaan langganan daya dan jasa", "uraian": "Penambahan daya listrik" },
    { "kode": "06.07.03", "snp": "Pengelolaan", "komponen": "Pembiayaan langganan daya dan jasa", "uraian": "Pembayaran langganan air" },
    { "kode": "06.07.04", "snp": "Pengelolaan", "komponen": "Pembiayaan langganan daya dan jasa", "uraian": "Pembayaran biaya telepon" },
    { "kode": "06.07.05", "snp": "Pengelolaan", "komponen": "Pembiayaan langganan daya dan jasa", "uraian": "Pembayaran jasa internet" },
    { "kode": "06.07.06", "snp": "Pengelolaan", "komponen": "Pembiayaan langganan daya dan jasa", "uraian": "Penambahan daya internet" },
    { "kode": "06.07.07", "snp": "Pengelolaan", "komponen": "Pembiayaan langganan daya dan jasa", "uraian": "Pembelian Bahan Bakar Minyak/Gas untuk keperluan pembelajaran/RT Sekolah" },
    { "kode": "06.07.08", "snp": "Pengelolaan", "komponen": "Pembiayaan langganan daya dan jasa", "uraian": "Pembayaran Retribusi keamanan dan sampah" },
    { "kode": "06.07.09", "snp": "Pengelolaan", "komponen": "Pembiayaan langganan daya dan jasa", "uraian": "Pembayaran langganan koran dan majalah" },
    { "kode": "06.07.10", "snp": "Pengelolaan", "komponen": "Pembiayaan langganan daya dan jasa", "uraian": "Sewa genset" },
    { "kode": "06.07.12", "snp": "Pengelolaan", "komponen": "Pembiayaan langganan daya dan jasa", "uraian": "Belanja Sewa Rumah/Gedung/Gudang/Parkir/tanah (diluar bangunan utama sekolah, kecuali untuk Sekolah Swasta)" },
    { "kode": "07.05.01", "snp": "Pembiayaan", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Bea materai, administrasi bank" },
    { "kode": "07.05.02", "snp": "Pembiayaan", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Penggandaan laporan dan/atau surat-menyurat" },
    { "kode": "07.05.03", "snp": "Pembiayaan", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Penyelenggaraan sosialisasi dan pelaporan program, kegiatan hasil-hasil, dan pengelolaan keuangan sekolah" },
    { "kode": "07.05.04", "snp": "Pembiayaan", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Penyelenggaraan kegiatan inventarisasi dan pendokumentasian nilai aset semua sarpras sekolah pada tahun berjalan" },
    { "kode": "07.05.05", "snp": "Pembiayaan", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Penggalangan, pengelolaan dan pelaporan pendanaan dari pihak ketiga (masyarakat umum, dunia industri, dan CSR)" },
    { "kode": "07.05.06", "snp": "Pembiayaan", "komponen": "Pelaksanaan administrasi kegiatan sekolah", "uraian": "Perjalanan dinas dalam rangka mengambil dana BOS di Bank (untuk sekolah terpencil)" },
    { "kode": "07.10.01", "snp": "Pembiayaan", "komponen": "Penyelenggaraan kegiatan peningkatan kompetensi keahlian", "uraian": "Kegiatan pemagangan guru dan/atau Peserta Didik di industri" },
    { "kode": "07.10.02", "snp": "", "komponen": "Penyelenggaraan kegiatan peningkatan kompetensi keahlian", "uraian": "Penyelenggaraan praktik kerja industri atau lapangan bagi Peserta Didik SMK atau SMALB" },
    { "kode": "07.10.03", "snp": "Pembiayaan", "komponen": "Penyelenggaraan kegiatan peningkatan kompetensi keahlian", "uraian": "Penyelenggaraan kegiatan uji kompetensi kemampuan bahasa asing (termasuk bahasa inggris)" },
    { "kode": "07.10.04", "snp": "Pembiayaan", "komponen": "Penyelenggaraan kegiatan peningkatan kompetensi keahlian", "uraian": "Penyelenggaraan Lembaga Sertifikasi Profesi Pihak Pertama" },
    { "kode": "07.10.05", "snp": "Pembiayaan", "komponen": "Penyelenggaraan kegiatan peningkatan kompetensi keahlian", "uraian": "Penyelenggaraan kegiatan uji kompetensi keahlian, sertifikasi kejuruan Peserta Didik SMK atau SMALB" },
    { "kode": "07.11.01", "snp": "", "komponen": "Penyelenggaraan kegiatan peningkatan kompetensi keahlian", "uraian": "Pengembangan Pembelajaran Teaching Factory" },
    { "kode": "07.11.02", "snp": "", "komponen": "", "uraian": "Penyelenggaraan Kegiatan Sertifikasi Kompetensi Peserta Didik" },
    { "kode": "07.12.01", "snp": "Pembiayaan", "komponen": "Pembayaran Honor", "uraian": "Pembayaran honor Guru/Pendidik" },
    { "kode": "07.12.02", "snp": "Pembiayaan", "komponen": "Pembayaran Honor", "uraian": "Pembayaran honor Tenaga Kependidikan (selain pendidik)" },
    { "kode": "07.12.03", "snp": "Pembiayaan", "komponen": "Pembayaran Honor", "uraian": "Pembayaran Honor tenaga administrasi" },
    { "kode": "07.12.04", "snp": "Pembiayaan", "komponen": "Pembayaran Honor", "uraian": "Pembayaran honor Tenaga Penunjang atau pelaksana" },
    { "kode": "08.03.01", "snp": "Penilaian", "komponen": "Pelaksanaan kegiatan pembelajaran dan ekstrakurikuler", "uraian": "Seleksi Siswa Program Bilingual" },
    { "kode": "08.03.02", "snp": "Penilaian", "komponen": "Pelaksanaan kegiatan pembelajaran dan ekstrakurikuler", "uraian": "Seleksi Peserta Didik Program Kelas Akselerasi" },
    { "kode": "08.04.01", "snp": "Penilaian", "komponen": "Pelaksanaan Kegiatan Asesmen dan Evaluasi Pembelajaran", "uraian": "Persiapan, uji coba, simulasi, dan pelaksanaan Asesmen Nasional" },
    { "kode": "08.04.02", "snp": "", "komponen": "Pelaksanaan Kegiatan Asesmen dan Evaluasi Pembelajaran", "uraian": "Penyiapan dan Pelaksanaan Asesmen di Awal Pembelajaran" },
    { "kode": "08.04.03", "snp": "Penilaian", "komponen": "Pelaksanaan Kegiatan Asesmen dan Evaluasi Pembelajaran", "uraian": "Penyusunan kisi-kisi dan penyusunan soal penilaian formatif (ulangan harian)" },
    { "kode": "08.04.04", "snp": "Penilaian", "komponen": "Pelaksanaan Kegiatan Asesmen dan Evaluasi Pembelajaran", "uraian": "Pelaksanaan penilaian formatif (ulangan harian)" },
    { "kode": "08.04.05", "snp": "Penilaian", "komponen": "Pelaksanaan Kegiatan Asesmen dan Evaluasi Pembelajaran", "uraian": "Penyusunan kisi-kisi dan penyusunan soal penilaian sumatif (ulangan tengah semester/akhir semester/kenaikan kelas)" },
    { "kode": "08.04.06", "snp": "Penilaian", "komponen": "Pelaksanaan Kegiatan Asesmen dan Evaluasi Pembelajaran", "uraian": "Pelaksanaan penilaian sumatif (ulangan tengah semester/akhir semester/kenaikan kelas)" },
    { "kode": "08.04.07", "snp": "Penilaian", "komponen": "Pelaksanaan Kegiatan Asesmen dan Evaluasi Pembelajaran", "uraian": "Penyusunan Kisi-Kisi dan Penyusunan Soal Penilaian/Asesmen Sekolah (Akhir Sekolah)" },
    { "kode": "08.04.08", "snp": "Penilaian", "komponen": "Pelaksanaan Kegiatan Asesmen dan Evaluasi Pembelajaran", "uraian": "Penyiapan, Uji Coba, dan Pelaksanaan Penilaian/Asesmen Sekolah (Akhir Sekolah) - Termasuk Asesmen Sekolah Berbasis Komputer" },
    { "kode": "08.04.09", "snp": "Penilaian", "komponen": "Pelaksanaan Kegiatan Asesmen dan Evaluasi Pembelajaran", "uraian": "Penyusunan Kriteria Kenaikan Kelas" },
    { "kode": "08.04.10", "snp": "Penilaian", "komponen": "Pelaksanaan Kegiatan Asesmen dan Evaluasi Pembelajaran", "uraian": "Penyusunan Kompetensi Ketuntasan Minimal" },
    { "kode": "08.04.11", "snp": "", "komponen": "Pelaksanaan Kegiatan Asesmen dan Evaluasi Pembelajaran", "uraian": "Pengembangan Perangkat Asesmen Kejuruan" },
    { "kode": "08.06.01", "snp": "Penilaian", "komponen": "Pengembangan profesi guru dan tenaga kependidikan", "uraian": "Fasilitasi pengembangan kompetensi guru melalui diseminasi PSP (IHT, Pelatihan, Penugasan, Pengembangan Portofolio, Pelaksanaan P5, dan Workshop)" }
    ];

    // --- UTILS ---
    const classNames = (...args) => args.filter(Boolean).join(' ');

    const DEFAULT_RECIPIENTS = [
        { id: '1', nama: 'Budi Santoso, S.Pd', nip: '19800101 200501 1 001', alamat: 'Jl. Pendidikan No. 1', npwp: '12.345.678.9-001.000', hp: '08123456789' },
        { id: '2', nama: 'Siti Aminah, S.E', nip: '19850202 201001 2 005', alamat: 'Jl. Keuangan No. 5', npwp: '98.765.432.1-005.000', hp: '08129876543' },
        { id: 's1', nama: 'Toko Makmur Jaya', nip: '', alamat: 'Jl. Merdeka No. 45', npwp: '12.345.678.9-000', hp: '08567891234' }
    ];

    const terbilang = (angka) => {
    const bil = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    let temp = parseFloat(angka);
    if (isNaN(temp)) return "";
    if (temp < 12) return " " + bil[temp];
    if (temp < 20) return terbilang(temp - 10) + " Belas";
    if (temp < 100) return terbilang(Math.floor(temp / 10)) + " Puluh" + terbilang(temp % 10);
    if (temp < 200) return " Seratus" + terbilang(temp - 100);
    if (temp < 1000) return terbilang(Math.floor(temp / 100)) + " Ratus" + terbilang(temp % 100);
    if (temp < 2000) return " Seribu" + terbilang(temp - 1000);
    if (temp < 1000000) return terbilang(Math.floor(temp / 1000)) + " Ribu" + terbilang(temp % 1000);
    if (temp < 1000000000) return terbilang(Math.floor(temp / 1000000)) + " Juta" + terbilang(temp % 1000000);
    return "";
    };

    const formatRupiah = (number) => {
    if (typeof number !== 'number') return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    };

    const formatDateIndo = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});
    };

    const formatDateExcel = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
    };

    const generateId = () => Math.random().toString(36).substr(2, 9);

    const parseExcelNumber = (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const clean = val.replace(/\./g, '').replace(',', '.');
        const numeric = clean.replace(/[^\d.-]/g, '');
        return parseFloat(numeric) || 0;
    }
    return 0;
    };

    const getPenerimaNama = (penerimaData) => {
    if (!penerimaData) return "..........................";
    if (typeof penerimaData === 'string') return penerimaData;
    if (typeof penerimaData === 'object' && penerimaData.nama) return penerimaData.nama;
    return "..........................";
    };

    // --- 2. KOMPONEN RECEIPT TEMPLATE (KUITANSI) ---
    const ReceiptTemplate = React.forwardRef(({ data, schoolConfig, isPreview = false }, ref) => {
    if (!data) return null;

    const kepsek = schoolConfig.recipients?.find(o => o.id === schoolConfig.selectedKepsek) || { nama: '................', nip: '................' };
    const bendahara = schoolConfig.recipients?.find(o => o.id === schoolConfig.selectedBendahara) || { nama: '................', nip: '................' };
    const penerimaNama = getPenerimaNama(data.penerima);

    return (
        <div
        ref={ref}
        className={classNames(
            "bg-white relative text-black",
            isPreview ? "w-[700px] shadow-xl mb-4 p-8 border border-gray-200 mx-auto" : "w-[700px] bg-white p-8"
        )}
        style={{ fontFamily: 'Arial, sans-serif', fontSize: '10px' }}
        >
        <div className="border border-black p-4 relative overflow-hidden">
            {/* WATERMARK */}
            <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none" 
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='serif' font-size='16' font-weight='bold' fill='black' transform='rotate(-30 60 60)' text-anchor='middle' dominant-baseline='middle'%3EKUITANSI%3C/text%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat'
                }}>
            </div>

            <div className="text-center mb-4 relative z-10">
                <h1 className="font-bold text-lg underline decoration-1 underline-offset-2">KUITANSI</h1>
                <div className="absolute right-0 top-0 text-[10px]">
                    No. Bukti: {data.noBukti}
                </div>
            </div>

            <div className="space-y-3 relative z-10">
                <div className="flex">
                    <div className="w-32 shrink-0">Telah terima dari</div>
                    <div className="w-4 text-center">:</div>
                    <div className="flex-1 border-b border-black border-dotted">
                        Bendahara {schoolConfig.namaSekolah}
                    </div>
                </div>

                <div className="flex">
                    <div className="w-32 shrink-0">Uang sejumlah</div>
                    <div className="w-4 text-center">:</div>
                    <div className="flex-1 font-bold border-b border-black border-dotted">
                        {formatRupiah(data.totalAmount)}
                    </div>
                </div>

                <div className="flex items-start">
                    <div className="w-32 shrink-0">Terbilang</div>
                    <div className="w-4 text-center">:</div>
                    <div className="flex-1 bg-gray-100 p-1 border border-black italic font-bold">
                        # {terbilang(data.totalAmount)} Rupiah #
                    </div>
                </div>

                <div className="flex items-start">
                    <div className="w-32 shrink-0">Untuk pembayaran</div>
                    <div className="w-4 text-center">:</div>
                    <div className="flex-1 border border-black p-1 min-h-[50px]">
                        {data.details.map((d, i) => (
                            <div key={i} className="mb-0.5 flex items-start">
                                <span className="mr-1">•</span>
                                <div className="leading-tight">
                                    <span>{d.uraian}</span>
                                    <span className="ml-1 text-[9px]">
                                        ({d.volume} {d.satuan} x {formatRupiah(d.harga)})
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer - Signatures */}
            <div className="mt-8 border-t border-black border-dashed pt-2 relative z-10">
                <div className="flex justify-between items-end text-center w-full mt-4 text-[9px]">
                    {/* Kepsek */}
                    <div className="flex flex-col items-center w-1/3">
                        <div className="text-left min-w-[120px]">
                            <div className="mb-8">
                                Setuju dibayar,<br/>Kepala Sekolah
                            </div>
                            <div className="font-bold capitalize">{kepsek.nama}</div>
                            <div>NIP. {kepsek.nip || '-'}</div>
                        </div>
                    </div>
                    {/* Bendahara */}
                    <div className="flex flex-col items-center w-1/3">
                        <div className="text-left min-w-[120px]">
                            <div className="mb-8">
                                Lunas dibayar,<br/>Bendahara
                            </div>
                            <div className="font-bold capitalize">{bendahara.nama}</div>
                            <div>NIP. {bendahara.nip || '-'}</div>
                        </div>
                    </div>
                    {/* Penerima */}
                    <div className="flex flex-col items-center w-1/3">
                        <div className="text-left min-w-[120px]">
                            <div className="mb-8">
                                Pati, {formatDateIndo(data.tanggalBayar)}<br/>Yang Menerima,
                            </div>
                            <div className="font-bold capitalize">{penerimaNama}</div>
                            <div className="text-[9px]">NPWP. {data.keterangan || '-'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    )
    });

    // --- 3. KOMPONEN TANDA PENGELUARAN TEMPLATE (A2) ---
    const TandaPengeluaranTemplate = React.forwardRef(({ data, schoolConfig, index, isPreview = false }, ref) => {
        if (!data) return null;
        
        const kepsek = schoolConfig.recipients?.find(o => o.id === schoolConfig.selectedKepsek) || { nama: '................', nip: '................' };
        const bendahara = schoolConfig.recipients?.find(o => o.id === schoolConfig.selectedBendahara) || { nama: '................', nip: '................' };
        
        return (
            <div 
                ref={ref}
                className={classNames(
                    "w-[700px] bg-white p-8 font-sans text-[10px] relative text-black",
                    isPreview ? "mx-auto shadow-md border" : ""
                )}
                style={{ fontFamily: 'Arial, sans-serif' }}
            >
                <div className="border border-black p-4 h-full flex flex-col">
                    <div className="flex flex-col items-center border-b-2 border-black pb-2 mb-4">
                        <h2 className="font-bold text-[12px] uppercase tracking-widest">PEMERINTAH KABUPATEN PATI</h2>
                        <h3 className="font-bold text-[10px] uppercase">DINAS PENDIDIKAN DAN KEBUDAYAAN</h3>
                        <h1 className="font-bold text-[14px] uppercase mt-1">{schoolConfig.namaSekolah}</h1>
                    </div>

                    <div className="text-center font-bold text-[12px] underline decoration-1 underline-offset-2 mb-6">
                        TANDA BUKTI PENGELUARAN
                    </div>

                    <table className="w-full mb-4 text-[10px]">
                        <tbody>
                            <tr>
                                <td className="w-24 align-top">Satuan Kerja</td>
                                <td className="w-4 text-center align-top">:</td>
                                <td className="align-top">{schoolConfig.namaSekolah}</td>
                                <td className="w-24 text-right align-top">Nomor Bukti</td>
                                <td className="w-4 text-center align-top">:</td>
                                <td className="w-32 align-top text-right">{data.noBukti}</td>
                            </tr>
                            <tr>
                                <td className="w-24 align-top">Tahun Anggaran</td>
                                <td className="w-4 text-center align-top">:</td>
                                <td className="align-top">{schoolConfig.tahunAnggaran || new Date().getFullYear()}</td>
                                <td className="w-24 text-right align-top">Kode Rekening</td>
                                <td className="w-4 text-center align-top">:</td>
                                <td className="w-32 align-top text-right">{data.kodeRekening}</td>
                            </tr>
                        </tbody>
                    </table>

                    <table className="w-full mb-6 text-[10px]">
                        <tbody>
                            <tr>
                                <td className="w-32 py-1 align-top">Sudah terima dari</td>
                                <td className="w-4 text-center py-1 align-top">:</td>
                                <td className="py-1 border-b border-black border-dotted align-top">Bendahara {schoolConfig.namaSekolah}</td>
                            </tr>
                            <tr>
                                <td className="w-32 py-1 align-top">Uang Sejumlah</td>
                                <td className="w-4 text-center py-1 align-top">:</td>
                                <td className="py-1 bg-gray-100 font-bold italic border border-black px-2">
                                    {terbilang(data.totalAmount)} Rupiah
                                </td>
                            </tr>
                            <tr>
                                <td className="w-32 py-1"></td>
                                <td className="w-4 text-center py-1"></td>
                                <td className="py-1 font-bold text-[12px]">
                                    Rp. {formatRupiah(data.totalAmount).replace('Rp', '').trim()}
                                </td>
                            </tr>
                            <tr>
                                <td className="w-32 py-1 align-top">Yaitu untuk</td>
                                <td className="w-4 text-center py-1 align-top">:</td>
                                <td className="py-1 align-top">
                                    <ul className="list-disc pl-4 m-0">
                                        {data.details.map((d, i) => (
                                            <li key={i} className="mb-0.5">
                                                {d.uraian} <span className="text-[9px]">({d.volume} {d.satuan} x {formatRupiah(d.harga)})</span>
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                            </tr>
                            <tr>
                                <td className="w-32 py-1 align-top">Kegiatan</td>
                                <td className="w-4 text-center py-1 align-top">:</td>
                                <td className="py-1 align-top font-semibold">{data.kegiatan}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* STATEMENT BLOCK */}
                    <div className="mb-6 text-[10px] italic text-center border-t border-black pt-2">
                        "Sepanjang mengenai pengadaan barang/jasa, barang/jasa tersebut telah diterima/diselesaikan dengan baik dan lengkap."
                    </div>

                    {/* Signatures - A2 Only Kepsek and Bendahara */}
                    <div className="mt-auto pt-4 flex justify-around text-center text-[10px]">
                        <div className="flex flex-col items-center w-1/2">
                            <div className="text-left min-w-[150px]">
                                <div className="mb-10">Mengetahui,<br/>Kepala Sekolah</div>
                                <div className="font-bold capitalize">{kepsek.nama}</div>
                                <div className="pt-1">NIP. {kepsek.nip || '-'}</div>
                            </div>
                        </div>
                        <div className="flex flex-col items-center w-1/2">
                            <div className="text-left min-w-[150px]">
                                <div className="mb-10">Lunas Dibayar,<br/>Bendahara</div>
                                <div className="font-bold capitalize">{bendahara.nama}</div>
                                <div className="pt-1">NIP. {bendahara.nip || '-'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    });

    // --- 4. KOMPONEN LAMPIRAN GAMBAR (DOKUMEN KE-3) ---
    const LampiranGambarTemplate = React.forwardRef(({ data, schoolConfig, isPreview = false }, ref) => {
        if (!data || !data.lampiran) return null;
        
        return (
            <div 
                ref={ref} 
                className={classNames(
                    "w-[700px] min-h-[900px] bg-white p-8 font-sans text-sm relative",
                    isPreview ? "mx-auto shadow-md border" : ""
                )}
                style={{ fontFamily: 'Arial, sans-serif' }}
            >
                <div className="text-center mb-6">
                    <h2 className="font-bold text-base uppercase tracking-wider underline">PEMERINTAH KABUPATEN PATI</h2>
                </div>
                
                <div className="mb-8 p-4 border border-dashed border-gray-400 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                        <div className="w-1/2">
                            <h2 className="text-lg font-bold uppercase underline" style={{ fontFamily: '"Script MT Bold", cursive' }}>LAMPIRAN</h2>
                            <div className="flex mt-2 text-xs">
                                <div className="w-32">Satuan Kerja</div>
                                <div className="w-4 text-center">:</div>
                                <div className="flex-1 font-bold">{schoolConfig.namaSekolah}</div>
                            </div>
                            <div className="flex mt-1 text-xs">
                                <div className="w-32">Tahun Anggaran</div>
                                <div className="w-4 text-center">:</div>
                                <div className="flex-1">{schoolConfig.tahunAnggaran || new Date().getFullYear()}</div>
                            </div>
                            <div className="flex mt-1 text-xs">
                                <div className="w-32">Nomor</div>
                                <div className="w-4 text-center">:</div>
                                <div className="flex-1 font-mono">{data.noBukti}</div>
                            </div>
                        </div>
                        <div className="w-1/2 text-right">
                            <div className="flex justify-end text-xs">
                                <div className="w-24 text-left">Nomor</div>
                                <div className="w-4 text-center">:</div>
                                <div className="w-32 text-left font-mono">{data.kodeRekening}</div>
                            </div>
                            <div className="flex justify-end mt-1 text-xs">
                                <div className="w-24 text-left">Lembar ke-</div>
                                <div className="w-4 text-center">:</div>
                                <div className="w-32 text-left font-bold">2</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full bg-white border-2 border-gray-200 p-2 flex justify-center items-center rounded overflow-hidden min-h-[500px]">
                    <img 
                        src={data.lampiran} 
                        alt="Lampiran" 
                        className="max-w-full max-h-[800px] object-contain shadow-sm" 
                    />
                </div>

                <div className="mt-4 text-center text-xs text-gray-400">
                    Dokumen ini merupakan lampiran sah dari transaksi No. {data.noBukti}
                </div>
            </div>
        );
    });


    // --- 3. SUB-COMPONENTS ---
    const MasterDataRecipients = ({ recipients, setRecipients }) => {
    const [form, setForm] = useState({ id: null, nama: '', alamat: '', hp: '', npwp: '', nip: '' });
    
    const handleSave = () => {
        if (!form.nama) return alert("Nama wajib diisi");
        if (form.id) {
            setRecipients(recipients.map(item => item.id === form.id ? form : item));
        } else {
            setRecipients([...recipients, { ...form, id: generateId() }]);
        }
        setForm({ id: null, nama: '', alamat: '', hp: '', npwp: '', nip: '' });
    };

    const handleEdit = (item) => setForm(item);
    const handleDelete = (id) => setRecipients(recipients.filter(item => item.id !== id));

    return (
        <div className="bg-white p-4 rounded-lg border mb-6">
        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Briefcase size={18}/> Master Data Penerima (Toko / Pejabat)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-4 p-4 bg-gray-50 rounded border border-blue-100">
            <div className="md:col-span-2">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Nama Lengkap / Toko</label>
                <input placeholder="Contoh: Toko Makmur / Budi S.Pd" className="border p-2 rounded w-full text-sm bg-white" value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} />
            </div>
            <div className="md:col-span-2">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Alamat</label>
                <input placeholder="Alamat Lengkap" className="border p-2 rounded w-full text-sm bg-white" value={form.alamat} onChange={e => setForm({...form, alamat: e.target.value})} />
            </div>
            <div className="md:col-span-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">No HP</label>
                <input placeholder="08xxx" className="border p-2 rounded w-full text-sm bg-white" value={form.hp} onChange={e => setForm({...form, hp: e.target.value})} />
            </div>
            <div className="md:col-span-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">NPWP</label>
                <input placeholder="xx.xxx.xxx" className="border p-2 rounded w-full text-sm bg-white" value={form.npwp} onChange={e => setForm({...form, npwp: e.target.value})} />
            </div>
            <div className="md:col-span-2">
                <label className="text-[10px] text-gray-500 font-bold uppercase">NIP (Opsional)</label>
                <input placeholder="Jika Pejabat/Guru" className="border p-2 rounded w-full text-sm bg-white" value={form.nip} onChange={e => setForm({...form, nip: e.target.value})} />
            </div>
            <div className="md:col-span-4 flex items-end">
                <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded text-sm flex justify-center items-center gap-2 w-full hover:bg-blue-700">
                    <Save size={16}/> Simpan Data Penerima
                </button>
            </div>
        </div>

        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm border">
                <thead className="bg-gray-100 text-xs uppercase sticky top-0">
                    <tr>
                        <th className="p-2 text-left">Nama</th>
                        <th className="p-2 text-left">NIP</th>
                        <th className="p-2 text-left">Alamat</th>
                        <th className="p-2 text-left">NPWP / HP</th>
                        <th className="p-2 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {recipients.map(item => (
                        <tr key={item.id} className="border-t hover:bg-gray-50">
                            <td className="p-2 font-medium">{item.nama}</td>
                            <td className="p-2 text-xs font-mono text-gray-600">{item.nip || '-'}</td>
                            <td className="p-2 text-xs text-gray-600">{item.alamat}</td>
                            <td className="p-2 text-xs">
                                <div className="text-blue-600 font-mono">{item.npwp}</div>
                                <div className="text-gray-500">{item.hp}</div>
                            </td>
                            <td className="p-2 flex justify-center gap-2">
                                <button onClick={() => handleEdit(item)} className="text-blue-500 bg-blue-50 p-1.5 rounded hover:bg-blue-100"><Edit3 size={14}/></button>
                                <button onClick={() => handleDelete(item.id)} className="text-red-500 bg-red-50 p-1.5 rounded hover:bg-red-100"><Trash2 size={14}/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        </div>
    );
    };

    // --- 4. MAIN APPLICATION ---
    export default function App() {
    const [activeTab, setActiveTab] = useState('generator');
    const [libsLoaded, setLibsLoaded] = useState(false);
    
    // 1. UPDATE STATE DENGAN LOCAL STORAGE
    const [recipients, setRecipients] = useState(() => {
        const saved = localStorage.getItem('app_recipients');
        return saved ? JSON.parse(saved) : DEFAULT_RECIPIENTS;
    });

    const [data, setData] = useState(() => {
        const saved = localStorage.getItem('app_data');
        return saved ? JSON.parse(saved) : [];
    });

    const [schoolConfig, setSchoolConfig] = useState(() => {
        const saved = localStorage.getItem('app_config');
        return saved ? JSON.parse(saved) : { 
            namaSekolah: '', 
            alamatSekolah: '', 
            tahunAnggaran: new Date().getFullYear().toString(), 
            selectedKepsek: '', 
            selectedBendahara: '', 
            recipients: [] 
        };
    });

    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' }); 
    const [selectedIds, setSelectedIds] = useState([]);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    
    const [previewData, setPreviewData] = useState(null);
    const hiddenCanvasRef = useRef(null);
    const pdfContainerRef = useRef(null);
    const [tempPrintIds, setTempPrintIds] = useState([]); 

    // 2. SIMPAN KE LOCAL STORAGE SETIAP ADA PERUBAHAN
    useEffect(() => { localStorage.setItem('app_recipients', JSON.stringify(recipients)); }, [recipients]);
    useEffect(() => { localStorage.setItem('app_data', JSON.stringify(data)); }, [data]);
    useEffect(() => { localStorage.setItem('app_config', JSON.stringify(schoolConfig)); }, [schoolConfig]);

    useEffect(() => {
        // 3. LOAD LIBRARY & TAILWIND SECARA ROBUST
        const loadScript = (src) => new Promise((resolve, reject) => { 
            if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; } 
            const script = document.createElement('script'); 
            script.src = src; 
            script.onload = () => resolve(); 
            script.onerror = () => reject(new Error(`Failed to load ${src}`)); 
            document.head.appendChild(script); 
        });
        
        const initLibs = async () => {
            try {
                // Load Tailwind & Config lebih awal
                if (!document.querySelector('script[src*="tailwindcss"]')) {
                    await loadScript("https://cdn.tailwindcss.com");
                }

                await Promise.all([
                    loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'), 
                    loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
                    loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js')
                ]);
                
                setTimeout(() => {
                    setLibsLoaded(true);
                }, 800); 
            } catch (e) {
                console.error("Failed to load libs", e);
                setLibsLoaded(true);
            }
        };

        initLibs();
    }, []);

    useEffect(() => { setSchoolConfig(prev => ({ ...prev, recipients })); }, [recipients]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
        }
        setSortConfig({ key, direction });
        
        const sorted = [...data].sort((a, b) => {
            if (a[key] < b[key]) {
                return direction === 'asc' ? -1 : 1;
            }
            if (a[key] > b[key]) {
                return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
        setData(sorted);
    };

    const handleSplit = (itemId, detailIndex) => {
        const newData = [...data];
        const parentIndex = newData.findIndex(d => d.id === itemId);
        if (parentIndex === -1) return;

        const parent = newData[parentIndex];
        if (parent.details.length <= 1) {
            alert("Tidak bisa memisahkan satu-satunya item. Minimal harus ada 2 item.");
            return;
        }

        const detailToSplit = parent.details[detailIndex];
        
        const newItem = {
            ...parent,
            id: generateId(),
            details: [detailToSplit],
            totalAmount: detailToSplit.total,
            isSplit: true,
            parentId: parent.id, 
            noBukti: `${parent.noBukti}-1`
        };

        const updatedParentDetails = parent.details.filter((_, i) => i !== detailIndex);
        const updatedParentTotal = updatedParentDetails.reduce((acc, curr) => acc + curr.total, 0);
        
        newData[parentIndex] = {
            ...parent,
            details: updatedParentDetails,
            totalAmount: updatedParentTotal
        };

        newData.splice(parentIndex + 1, 0, newItem);
        setData(newData);
    };

    const handleRevert = (itemId) => {
        const newData = [...data];
        const childIndex = newData.findIndex(d => d.id === itemId);
        if (childIndex === -1) return;

        const child = newData[childIndex];
        const parentIndex = newData.findIndex(d => d.id === child.parentId);

        if (parentIndex === -1) {
            if(confirm("Data induk tidak ditemukan. Apakah Anda ingin menjadikan ini data normal (bukan pecahan)?")) {
                newData[childIndex] = { ...child, isSplit: false, parentId: null };
                setData(newData);
            }
            return;
        }

        const parent = newData[parentIndex];

        const updatedParentDetails = [...parent.details, ...child.details];
        const updatedParentTotal = updatedParentDetails.reduce((acc, curr) => acc + curr.total, 0);

        newData[parentIndex] = {
            ...parent,
            details: updatedParentDetails,
            totalAmount: updatedParentTotal
        };

        newData.splice(childIndex, 1);
        setData(newData);
    };

    const handleFileUpload = (e) => {
        if (!window.XLSX) return alert("Library Excel belum siap.");
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (evt) => {
        const bstr = evt.target.result;
        const wb = window.XLSX.read(bstr, { type: 'binary' });
        processExcelData(window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }));
        };
        reader.readAsBinaryString(file);
    };

    const processExcelData = (rows) => {
        if (!rows || rows.length === 0) return;

        // 1. Deteksi Header untuk pemetaan kolom
        let headerRowIndex = -1;
        let colMap = {};

        for (let i = 0; i < Math.min(rows.length, 10); i++) {
            const row = rows[i];
            const rowStr = JSON.stringify(row).toLowerCase();
            
            // Cari baris header yang mengandung kata kunci
            if (rowStr.includes('no') && (rowStr.includes('bukti') || rowStr.includes('bku'))) {
                headerRowIndex = i;
                // Map kolom index
                row.forEach((cell, idx) => {
                    const cellStr = String(cell).toLowerCase();
                    if (cellStr.includes('bukti')) colMap['NO_BUKTI'] = idx;
                    else if (cellStr.includes('tanggal')) colMap['TANGGAL'] = idx;
                    else if (cellStr.includes('kegiatan') && cellStr.includes('kode')) colMap['KODE_KEGIATAN'] = idx;
                    else if (cellStr.includes('rekening') && cellStr.includes('kode')) colMap['KODE_REKENING'] = idx;
                    else if (cellStr.includes('uraian')) colMap['URAIAN'] = idx;
                    else if (cellStr.includes('volume') || cellStr.includes('vol')) colMap['VOLUME'] = idx;
                    else if (cellStr.includes('satuan')) colMap['SATUAN'] = idx;
                    // UPDATE: DETEKSI KOLOM HARGA / TARIF
                    else if (cellStr.includes('harga') || cellStr.includes('tarif')) colMap['HARGA'] = idx;
                    
                    // PRIORITAS: PENGELUARAN UNTUK TOTAL
                    else if (cellStr.includes('pengeluaran')) colMap['TOTAL'] = idx;
                    // FALLBACK JIKA TIDAK ADA PENGELUARAN
                    else if (!colMap['TOTAL'] && (cellStr.includes('jumlah') || cellStr.includes('total')) && !cellStr.includes('volume')) colMap['TOTAL'] = idx;
                });
                break;
            }
        }

        if (headerRowIndex === -1) {
            alert("Format Excel tidak dikenali. Pastikan ada kolom 'No. Bukti', 'Tanggal', dll.");
            return;
        }

        // Fallback jika map tidak lengkap (pakai index default RKAS BKU umumnya)
        if (colMap['NO_BUKTI'] === undefined) colMap['NO_BUKTI'] = 2; // Contoh
        if (colMap['URAIAN'] === undefined) colMap['URAIAN'] = 3;

        let processedMap = {};
        // Variables untuk menyimpan state baris sebelumnya (Fill Down)
        let currentNoBukti = null;
        let currentTanggal = '';
        let currentKodeKeg = '';
        let currentKodeRek = '';
        let currentKegiatan = '';

        // Iterasi baris data
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            
            // Ambil No Bukti dari baris saat ini
            const rawNoBukti = row[colMap['NO_BUKTI']];
            const strNoBukti = rawNoBukti ? String(rawNoBukti).trim() : '';

            // JIKA BARIS MEMILIKI NO. BUKTI BARU (Start with BP)
            if (strNoBukti && strNoBukti.startsWith('BP')) {
                // Update state "current" untuk dipakai baris selanjutnya
                currentNoBukti = strNoBukti;
                currentTanggal = row[colMap['TANGGAL']] ? formatDateForInput(row[colMap['TANGGAL']]) : '';
                currentKodeKeg = row[colMap['KODE_KEGIATAN']] ? String(row[colMap['KODE_KEGIATAN']]).trim() : '';
                currentKodeRek = row[colMap['KODE_REKENING']] ? String(row[colMap['KODE_REKENING']]).trim() : '';
                
                // Lookup Nama Kegiatan
                const activityData = ARKAS_ACTIVITIES.find(a => currentKodeKeg.startsWith(a.kode));
                currentKegiatan = activityData ? activityData.uraian : '(Kegiatan Tidak Ditemukan)';
            } 
            // JIKA TIDAK ADA NO BUKTI, TAPI KITA PUNYA STATE SEBELUMNYA (Berarti ini detail item)
            else if (!strNoBukti && currentNoBukti) {
                // Lanjut proses menggunakan currentNoBukti yang tersimpan
            } 
            // JIKA TIDAK ADA NO BUKTI DAN BELUM ADA STATE (Data sampah/kosong di awal), Skip
            else {
                continue;
            }

            // Ambil Data Uraian & Angka
            const strUraian = row[colMap['URAIAN']] ? String(row[colMap['URAIAN']]).trim() : '';
            // Skip jika uraian kosong (baris kosong di excel)
            if(!strUraian) continue;

            const numVol = parseExcelNumber(row[colMap['VOLUME']]);
            const numHarga = parseExcelNumber(row[colMap['HARGA']]);
            // AMBIL TOTAL DARI KOLOM PENGELUARAN (YANG SUDAH DI MAP KE 'TOTAL')
            const numTotal = row[colMap['TOTAL']] ? parseExcelNumber(row[colMap['TOTAL']]) : (numVol * numHarga);

            // GROUPING LOGIC: Gabung ke object berdasarkan currentNoBukti
            if (!processedMap[currentNoBukti]) {
                processedMap[currentNoBukti] = {
                    id: generateId(),
                    noBukti: currentNoBukti,
                    tanggalBayar: currentTanggal, // Gunakan tanggal yang tersimpan
                    tanggalBeli: currentTanggal,  
                    kodeProgram: currentKodeKeg,  
                    kegiatan: currentKegiatan,   
                    kodeRekening: currentKodeRek,
                    details: [],
                    totalAmount: 0,
                    penerima: null,
                    keterangan: '', // Nanti jadi NPWP
                    lampiran: null,
                    isSplit: false,
                    parentId: null
                };
            }

            // Push Detail Item
            processedMap[currentNoBukti].details.push({
                uraian: strUraian,
                volume: numVol,
                satuan: row[colMap['SATUAN']] || '',
                harga: numHarga,
                total: numTotal
            });

            // Accumulate Total (MERGE JUMLAH)
            processedMap[currentNoBukti].totalAmount += numTotal;
        }

        setData(Object.values(processedMap));
    };

    // Helper date parser excel to YYYY-MM-DD
    const formatDateForInput = (excelDate) => {
        if (!excelDate) return '';
        // Jika format excel serial date (angka)
        if (typeof excelDate === 'number') {
            const date = new Date(Math.round((excelDate - 25569)*86400*1000));
            return date.toISOString().split('T')[0];
        }
        // Jika string (coba parse)
        try {
            const d = new Date(excelDate);
            if(!isNaN(d)) return d.toISOString().split('T')[0];
        } catch(e) {}
        return '';
    };

    const handlePenerimaChange = (itemId, val) => {
        const selectedRecipient = recipients.find(s => s.nama === val);
        const autoKeterangan = selectedRecipient?.npwp ? selectedRecipient.npwp : '';

        setData(data.map(item => item.id === itemId ? { 
            ...item, 
            penerima: selectedRecipient ? selectedRecipient : { nama: val },
            keterangan: item.keterangan || autoKeterangan 
        } : item));
    };

    const handleDateChange = (itemId, field, val) => {
        // Disabled di UI, tapi function tetap ada utk safety
        setData(data.map(item => item.id === itemId ? { ...item, [field]: val } : item));
    };

    const handleTextChange = (itemId, field, val) => {
        setData(data.map(item => item.id === itemId ? { ...item, [field]: val } : item));
    };

    const handleLampiranUpload = (itemId, e) => {
        const file = e.target.files[0];
        if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            setData(data.map(item => item.id === itemId ? { ...item, lampiran: e.target.result } : item));
        };
        reader.readAsDataURL(file);
        }
    };

    const toggleSelectAll = () => selectedIds.length === data.length ? setSelectedIds([]) : setSelectedIds(data.map(d => d.id));
    const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    
    const handleDownloadExcel = () => {
        if (!window.XLSX) return alert("Library Excel belum siap.");

        const itemsToExport = selectedIds.length > 0 ? data.filter(d => selectedIds.includes(d.id)) : data;
        if (itemsToExport.length === 0) return alert("Tidak ada data untuk diexport!");

        let flatData = [];

        itemsToExport.forEach((item, index) => {
            const namaPenerima = typeof item.penerima === 'object' ? item.penerima?.nama : item.penerima;
            const alamatPenerima = typeof item.penerima === 'object' ? item.penerima?.alamat : '';
            // UPDATE: Keterangan jadi NPWP
            const npwpPenerima = item.keterangan; 

            item.details.forEach((detail, dIndex) => {
                flatData.push({
                    'NO': index + 1, // Fill for all rows
                    'TANGGAL': formatDateExcel(item.tanggalBayar),
                    'NO. BUKTI': item.noBukti,
                    'KODE KEGIATAN': item.kodeProgram, // Fill for all rows
                    'NAMA KEGIATAN': item.kegiatan, // Fill for all rows
                    'KODE REKENING': item.kodeRekening, // Fill for all rows
                    'URAIAN KEGIATAN': detail.uraian,
                    // UPDATE: MENAMBAHKAN VOLUME, SATUAN, HARGA
                    'VOLUME': detail.volume,
                    'SATUAN': detail.satuan,
                    'HARGA SATUAN': detail.harga,
                    'JUMLAH': detail.total, 
                    'TOTAL KUITANSI': item.totalAmount, // Fill for all rows
                    'PENERIMA': (namaPenerima || ''), // Fill for all rows
                    'ALAMAT': (alamatPenerima || ''), // Fill for all rows
                    'NPWP': (npwpPenerima || '') // Fill for all rows
                });
            });
        });
        
        const wsKuitansi = window.XLSX.utils.json_to_sheet(flatData);
        
        // UPDATE: Set Column Widths agar rapi
        const wscols = [
            {wch:5},  {wch:15}, {wch:15}, {wch:20}, {wch:40}, {wch:20}, 
            {wch:50}, {wch:8}, {wch:8}, {wch:15}, {wch:15}, {wch:20}, {wch:30}, {wch:40}, {wch:25}
        ];
        wsKuitansi['!cols'] = wscols;

        // UPDATE: Kembalikan Sheet Master Penerima
        const recipientData = recipients.map((rec, index) => ({
        'No': index + 1,
        'Nama Penerima': rec.nama,
        'NIP': rec.nip,
        'Alamat': rec.alamat,
        'No HP': rec.hp,
        'NPWP': rec.npwp
        }));
        const wsRecipient = window.XLSX.utils.json_to_sheet(recipientData);
        wsRecipient['!cols'] = [{wch:5}, {wch:30}, {wch:20}, {wch:50}, {wch:15}, {wch:25}];

        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, wsKuitansi, "Rekap Kuitansi");
        window.XLSX.utils.book_append_sheet(wb, wsRecipient, "Master Data Penerima"); // Sheet dikembalikan

        window.XLSX.writeFile(wb, `Data_Kuitansi_New_${new Date().getTime()}.xlsx`);
    };

    const generatePDF = (ids, filename) => {
        if (!window.html2pdf) return alert("Library PDF belum siap");
        
        setIsGeneratingPdf(true);
        setTempPrintIds(ids);

        setTimeout(() => {
            const element = pdfContainerRef.current;
            if (!element) {
                setIsGeneratingPdf(false);
                return alert("Gagal merender area PDF");
            }

            const opt = {
                margin:       [5, 10, 5, 10], 
                filename:     filename,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, scrollY: 0 }, 
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
            };

            window.html2pdf().set(opt).from(element).save()
                .then(() => {
                    setIsGeneratingPdf(false);
                    setTempPrintIds([]);
                })
                .catch(err => {
                    console.error(err);
                    setIsGeneratingPdf(false);
                    alert("Terjadi kesalahan saat membuat PDF");
                });
        }, 500); 
    };

    const handleDownloadPdfSelected = () => {
        if(selectedIds.length === 0) return alert("Pilih data dulu!");
        generatePDF(selectedIds, `Kuitansi-Gabungan-${new Date().getTime()}.pdf`);
    };

    const handleDownloadPdfSingle = (id) => {
        generatePDF([id], `Kuitansi-${id}.pdf`);
    };
    
    const idsToRender = tempPrintIds.length > 0 ? tempPrintIds : []; 
    const dataToRenderPdf = data.filter(d => idsToRender.includes(d.id));

    if (!libsLoaded) return <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /><p className="text-gray-500 font-medium">Memuat Sistem...</p></div>;

    return (
        <div className="p-4 md:p-8 max-w-[98%] mx-auto font-sans bg-gray-50 min-h-screen text-gray-800">
        
        {isGeneratingPdf && (
            <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center flex-col text-white">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p className="font-bold text-lg">Sedang Membuat PDF...</p>
                <p className="text-sm">Mohon tunggu, jangan tutup halaman ini.</p>
            </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 print:hidden">
            <div><h1 className="text-2xl font-bold text-blue-900 flex items-center gap-2"><FileSpreadsheet /> Generator Kuitansi RKAS</h1><p className="text-sm text-gray-500">Buat bukti kas pengeluaran dari Excel dengan data master terintegrasi</p></div>
            <div className="flex gap-2 mt-4 md:mt-0 bg-white p-1 rounded-lg border"><button onClick={() => setActiveTab('generator')} className={classNames("px-4 py-2 rounded-md text-sm font-medium transition-colors", activeTab === 'generator' ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-600")}>Generator</button><button onClick={() => setActiveTab('master')} className={classNames("px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2", activeTab === 'master' ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-600")}><Users size={16}/> Master Data</button></div>
        </div>

        {activeTab === 'master' && <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300"><MasterDataRecipients recipients={recipients} setRecipients={setRecipients} /></div>}

        {activeTab === 'generator' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white p-6 rounded-xl border shadow-sm print:hidden">
                <h2 className="font-bold text-gray-700 mb-4 border-b pb-2">1. Konfigurasi Sekolah & Upload</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">File Excel (Format Baru: No Bukti BP...)</label><input type="file" accept=".xlsx" onChange={handleFileUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mt-1"/></div>
                <div className="lg:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Nama Sekolah</label><input className="w-full border p-2 rounded mt-1 bg-white" placeholder="SD Negeri..." value={schoolConfig.namaSekolah} onChange={e => setSchoolConfig({...schoolConfig, namaSekolah: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase">Kepala Sekolah (Penandatangan)</label><select className="w-full border p-2 rounded mt-1 bg-white" value={schoolConfig.selectedKepsek} onChange={e => setSchoolConfig({...schoolConfig, selectedKepsek: e.target.value})}><option value="">-- Pilih Penandatangan --</option>{recipients.map(o => (<option key={o.id} value={o.id}>{o.nama}</option>))}</select></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase">Bendahara (Penandatangan)</label><select className="w-full border p-2 rounded mt-1 bg-white" value={schoolConfig.selectedBendahara} onChange={e => setSchoolConfig({...schoolConfig, selectedBendahara: e.target.value})}><option value="">-- Pilih Penandatangan --</option>{recipients.map(o => (<option key={o.id} value={o.id}>{o.nama}</option>))}</select></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase">Tahun Anggaran</label><input className="w-full border p-2 rounded mt-1 bg-white" placeholder="YYYY" value={schoolConfig.tahunAnggaran} onChange={e => setSchoolConfig({...schoolConfig, tahunAnggaran: e.target.value})} /></div>
                </div>
            </div>

            {/* Table Data */}
            {data.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden print:hidden">
                <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                    <span className="font-bold flex items-center gap-2"><CheckSquare size={18}/> Data Belanja ({data.length})</span>
                    <div className="flex gap-2">
                        <button onClick={handleDownloadExcel} className="bg-green-600 text-white px-4 py-2 rounded text-sm flex gap-2 items-center hover:bg-green-700 transition-colors shadow-sm font-medium border border-green-700">
                            <FileSpreadsheet size={16}/> Export Excel
                        </button>
                        <button onClick={handleDownloadPdfSelected} className="bg-red-600 text-white px-4 py-2 rounded text-sm flex gap-2 items-center hover:bg-red-700 transition-colors shadow-sm font-medium">
                            <Download size={16}/> Download PDF ({selectedIds.length})
                        </button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 uppercase font-bold text-gray-600 border-b">
                            <tr>
                                <th className="p-3 w-8 text-center"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.length === data.length} /></th>
                                <th className="p-3 w-10 text-center">No</th>
                                
                                <th 
                                    className="p-3 w-32 bg-orange-50 cursor-pointer hover:bg-orange-100 transition-colors group" 
                                    onClick={() => handleSort('tanggalBayar')}
                                >
                                    <div className="flex items-center justify-between">
                                        Tanggal
                                        <span className="text-gray-400 group-hover:text-orange-600">
                                            {sortConfig.key === 'tanggalBayar' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : <ArrowUpDown size={14}/>}
                                        </span>
                                    </div>
                                </th>

                                <th className="p-3 w-20 bg-blue-50">No. Bukti</th>
                                
                                <th className="p-3 w-24 bg-yellow-50">Kode Keg</th>
                                <th className="p-3 w-48 bg-yellow-100">Nama Kegiatan</th>
                                <th className="p-3 w-24 bg-purple-50">Kode Rek</th>
                                
                                <th className="p-3 min-w-[200px]">Uraian Belanja</th>
                                <th className="p-3 w-32 text-right bg-green-50 font-extrabold border-l">Jumlah</th>
                                <th className="p-3 w-40">Penerima</th>
                                <th className="p-3 w-32">Alamat</th>
                                <th className="p-3 w-32 bg-blue-50">NPWP</th>
                                <th className="p-3 w-32 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {data.map((item, index) => (
                                <tr key={item.id} className={classNames("hover:bg-blue-50 align-top", item.isSplit && "bg-yellow-50/50")}>
                                    <td className="p-3 text-center pt-4"><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                                    <td className="p-3 text-center pt-4 font-mono">
                                        {index + 1}
                                        {item.isSplit && <span className="block text-[9px] text-orange-500 font-bold">(Pecahan)</span>}
                                    </td>
                                    
                                    <td className="p-3 pt-4 bg-gray-50"><input disabled type="date" className="w-full border p-1 rounded text-sm bg-gray-100 text-gray-500 cursor-not-allowed" value={item.tanggalBayar} /></td>
                                    
                                    <td className="p-3 pt-4 bg-blue-50/30 font-mono text-sm">{item.noBukti}</td>

                                    <td className="p-3 pt-4 font-mono text-xs bg-yellow-50/30">{item.kodeProgram}</td>
                                    <td className="p-3 pt-4 text-xs bg-yellow-100/30">{item.kegiatan}</td> 
                                    <td className="p-3 pt-4 font-mono text-xs bg-purple-50/30">{item.kodeRekening}</td>
                                    
                                    <td className="p-3">
                                        <ul className="pl-0 space-y-2">
                                            {item.details.map((d,i) => (
                                                <li key={i} className="group relative pr-2">
                                                    <div className="flex flex-col items-start">
                                                        <span className="font-medium">{d.uraian}</span>
                                                        <div className="text-[10px] text-gray-500 bg-gray-100 px-1 rounded flex items-center gap-1 mt-0.5">
                                                            <span className="font-bold">{d.volume} {d.satuan}</span>
                                                            <span>x</span>
                                                            <span>{formatRupiah(d.harga)}</span>
                                                        </div>

                                                        {item.details.length > 1 && (
                                                            <button 
                                                                onClick={() => handleSplit(item.id, i)}
                                                                className="text-[10px] text-blue-500 hover:underline whitespace-nowrap mt-1 flex items-center gap-0.5"
                                                                title="Pisahkan menjadi baris baru"
                                                            >
                                                                <Scissors size={10} /> Pisah
                                                            </button>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                    
                                    <td className="p-3 text-right font-bold text-green-700 bg-green-50/30 border-l pt-4">{formatRupiah(item.totalAmount)}</td>
                                    
                                    <td className="p-3 pt-4">
                                        <div className="relative">
                                            <input list={`shops-${item.id}`} className={classNames("w-full border p-1.5 rounded text-sm bg-white", !item.penerima ? "border-red-300 bg-red-50" : "border-gray-300")} placeholder="Pilih/Ketik..." onChange={(e) => handlePenerimaChange(item.id, e.target.value)} value={item.penerima?.nama || (typeof item.penerima === 'string' ? item.penerima : '')} />
                                            <datalist id={`shops-${item.id}`}>{recipients.map(s => (<option key={s.id} value={s.nama}>{s.alamat}</option>))}</datalist>
                                            {!item.penerima && <AlertCircle size={14} className="text-red-500 absolute right-2 top-2"/>}
                                        </div>
                                    </td>
                                    <td className="p-3 pt-4 text-sm text-gray-600">
                                        {item.penerima?.alamat || '-'}
                                    </td>
                                    <td className="p-3 pt-4 bg-blue-50/30"><input type="text" className="w-full border p-1 rounded text-sm bg-white" placeholder="NPWP..." value={item.keterangan} onChange={(e) => handleTextChange(item.id, 'keterangan', e.target.value)}/></td>

                                    <td className="p-3 text-center pt-4">
                                        <div className="flex justify-center gap-1 flex-wrap">
                                            <button onClick={() => handleDownloadPdfSingle(item.id)} className="flex items-center gap-1 text-xs text-white bg-red-600 p-1.5 rounded hover:bg-red-700" title="PDF">
                                                <FileText size={12}/> PDF
                                            </button>
                                            <label className={classNames("cursor-pointer p-1.5 rounded flex items-center gap-1 text-xs text-white hover:opacity-80", item.lampiran ? "bg-green-600" : "bg-gray-400")} title="Upload Lampiran">
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLampiranUpload(item.id, e)} />
                                                <Paperclip size={12} /> {item.lampiran ? 'Edit' : 'Up'}
                                            </label>
                                            
                                            {item.isSplit && (
                                                <button 
                                                    onClick={() => handleRevert(item.id)} 
                                                    className="flex items-center gap-1 text-xs text-white bg-orange-500 p-1.5 rounded hover:bg-orange-600 w-full justify-center mt-1" 
                                                    title="Kembalikan ke data induk"
                                                >
                                                    <RotateCcw size={12}/> Kembalikan
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                </div>
            )}
            </div>
        )}

        {/* --- HIDDEN CONTAINER FOR PDF GENERATION --- */}
        <div style={{ position: 'fixed', left: '-10000px', top: 0, width: '700px' }}>
            <div ref={pdfContainerRef}>
                {dataToRenderPdf.map((item, idx) => {
                    // UPDATE: Cari index asli dari data utama agar nomor "Lembar ke" konsisten dengan tabel "No"
                    const originalIndex = data.findIndex(d => d.id === item.id) + 1;
                    
                    return (
                        <div key={idx}>
                            {/* Cegah page break di halaman pertama */}
                            {idx > 0 && <div className="html2pdf__page-break" style={{ height: 0, margin: 0 }}></div>}
                            
                            <ReceiptTemplate data={item} schoolConfig={schoolConfig} />
                            
                            <div className="html2pdf__page-break" style={{ height: 0, margin: 0 }}></div>
                            
                            {/* PASS ORIGINAL INDEX */}
                            <TandaPengeluaranTemplate data={item} schoolConfig={schoolConfig} index={originalIndex} />

                            {item.lampiran && (
                                <>
                                    <div className="html2pdf__page-break" style={{ height: 0, margin: 0 }}></div>
                                    <LampiranGambarTemplate data={item} schoolConfig={schoolConfig} />
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
        </div>
    );
    }