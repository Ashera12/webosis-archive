'use client';

import React, { useState } from 'react';
import { 
  FaQuran, 
  FaUserGraduate, 
  FaBook, 
  FaChartLine, 
  FaLeaf, 
  FaMobileAlt 
} from 'react-icons/fa';

interface Proker {
  nama: string;
  penanggungJawab: string;
  dasarPemikiran: string;
  tujuan: string;
  waktu: string;
  teknis: string;
  anggaran: string;
  evaluasi: string;
}

interface Sekbid {
  id: number;
  nama: string;
  icon: React.ReactNode;
  color: string;
  prokers: Proker[];
}

const ProgramKerjaSection: React.FC = () => {
  const [activeSekbid, setActiveSekbid] = useState<number>(1);

  const sekbidData: Sekbid[] = [
    {
      id: 1,
      nama: "Kerohanian",
      icon: <FaQuran size={24} />,
      color: "from-green-400 to-emerald-500",
      prokers: [
        {
          nama: "Setel Murotal Setiap Pagi Pakai Speaker",
          penanggungJawab: "Muhammad Irsyad Kaamil Pasha",
          dasarPemikiran: "Misi OSIS SMK untuk menciptakan karakter yang islami dengan membiasakan siswa mendengarkan murotal Al-Qur'an. Menambahkan murotal Al-Kahf setiap hari Jumat untuk memperkuat hafalan.",
          tujuan: "Membiasakan siswa mendengarkan murotal dan secara tidak langsung menguatkan hafalan mereka karena mendengarkan murotal setiap pagi.",
          waktu: "Setiap hari Senin-Kamis pagi: juz 30 & 29. Setiap hari Jumat pagi: murotal Al-Kahf",
          teknis: "Menyiapkan speaker yang biasa digunakan untuk upacara atau speaker masjid, lalu menyetel murotal melalui speaker yang terhubung ke HP. Murotal yang disetel adalah juz 30 & 29 (untuk Jumat khusus Al-Kahf), bergantian setiap harinya.",
          anggaran: "Tidak memerlukan anggaran khusus, hanya kesiapan PJ untuk menjalankannya.",
          evaluasi: "Tahun sebelumnya hanya ada murotal, mars FI, dan lagu Indonesia Raya. Inovasi baru adalah menambahkan murotal Al-Kahf setiap hari Jumat."
        },
        {
          nama: "Kultum Bulanan tentang Pendekatan Diri dengan Al-Qur'an",
          penanggungJawab: "Nazmia Tsakib Hanani",
          dasarPemikiran: "Pendekatan diri dengan Al-Qur'an bukan hanya tentang mengetahui tafsir atau kaidah, tetapi merasakan bahwa Al-Qur'an memberikan ketenangan dan pengaruh besar dalam kehidupan sehari-hari. Dengan merasakan 'sentuhan rasa' dari Al-Qur'an, proses menghafal dan murojaah menjadi lebih mudah.",
          tujuan: "Menjadi motivasi dalam mengenal Al-Qur'an untuk mempermudah dalam menghafal, dan diharapkan program ini dapat disampaikan ke lingkungan siswa dan siswi sekolah SMK dan SMA Fitrah Insani.",
          waktu: "Setiap satu bulan sekali di minggu terakhir (kemungkinan perubahan menjadi dua kali dalam sebulan)",
          teknis: "Satu orang membacakan materi kultum secara rutin selama satu bulan sekali.",
          anggaran: "Kegiatan ini tidak akan mengeluarkan anggaran.",
          evaluasi: "Karena ini merupakan kegiatan baru, dimulai dari awal tanpa evaluasi dari proker sebelumnya."
        },
        {
          nama: "Murojaah Bersama Sebelum Sholat dan Berdoa Bersama Setelah Sholat",
          penanggungJawab: "Alifah Shafina Amanda",
          dasarPemikiran: "Banyak siswa dan siswi yang lip sync saat murojaah dan berdoa, bahkan tidak ikut membaca saat murojaah dan berdoa. Dengan memilih siswa untuk membacakan surat-surat pendek dan doa yang telah disiapkan, diharapkan seluruh siswa terlibat secara aktif.",
          tujuan: "Membiasakan peserta didik untuk beribadah dengan khusyuk dan tertib.",
          waktu: "Minggu ke-4 setiap sebelum dan sesudah shalat dzuhur",
          teknis: "Setiap sebelum sholat dzuhur, menyiapkan surat-surat pendek untuk siswa yang terpilih membacakannya bersama-sama. Setelah sholat dzuhur, menyiapkan doa yang telah disiapkan untuk dibaca bersama-sama oleh siswa yang terpilih.",
          anggaran: "Kegiatan ini tidak akan mengeluarkan anggaran.",
          evaluasi: "Karena ini merupakan kegiatan baru, dimulai dari awal tanpa evaluasi dari proker sebelumnya."
        }
      ]
    },
    {
      id: 2,
      nama: "Kaderisasi",
      icon: <FaUserGraduate size={24} />,
      color: "from-blue-400 to-indigo-500",
      prokers: [
        {
          nama: "Tepat Waktu Disiplin (TWD)",
          penanggungJawab: "Safa Aprilia Ansari",
          dasarPemikiran: "Menciptakan budaya kedisiplinan yang kuat di kalangan siswa dengan memperhatikan ketepatan waktu. Program 'Tepat Waktu Challenge' menggunakan sistem absensi digital berbasis QR Code yang memungkinkan pendataan kedatangan siswa secara otomatis melalui Google Form.",
          tujuan: "Menumbuhkan budaya disiplin dan tanggung jawab di kalangan siswa, khususnya dalam hal ketepatan waktu hadir di sekolah, kelas, dan kegiatan keagamaan. Mendorong siswa untuk lebih menghargai waktu dan memahami pentingnya datang tepat waktu sebagai bentuk karakter positif.",
          waktu: "Setiap hari Senin-Jumat",
          teknis: "Siswa mengisi Google Form yang sudah disediakan oleh anggota OSIS dengan mencatat nama, kelengkapan atribut, dan waktu kedatangan.",
          anggaran: "Tidak ada anggaran",
          evaluasi: "-"
        },
        {
          nama: "Piket Pagi",
          penanggungJawab: "Almer Shaquille Althafurrahman Darmawan",
          dasarPemikiran: "Berfokus pada pembentukan kedisiplinan, ketertiban, dan budaya tepat waktu di kalangan siswa. Dengan adanya pengecekan oleh anggota OSIS, siswa diharapkan dapat lebih sadar akan pentingnya datang tepat waktu, menjaga rapi penampilan, dan mematuhi peraturan sekolah.",
          tujuan: "Memastikan bahwa siswa datang ke sekolah tepat waktu, mengurangi keterlambatan, dan membentuk budaya disiplin. Program ini juga memantau kerapian seragam, kelengkapan atribut sekolah, dan memastikan siswa mematuhi peraturan sekolah terkait penampilan.",
          waktu: "Setiap hari Senin-Jumat pukul 06.00-07.00 sesuai jadwal piket yang telah ditentukan",
          teknis: "Enam orang siswa pengurus OSIS melaksanakan piket pagi setiap hari (Senin-Jumat) 06.00-07.00 dan menjaga di depan tangga menuju kelas, depan masjid, dan gerbang bawah. Piket dilaksanakan sesuai jadwal yang dibuat oleh koordinator Sekbid 2.",
          anggaran: "Tidak ada anggaran",
          evaluasi: "Masih banyak siswa yang lolos atau melanggar dari peraturan berseragam. Masih ada beberapa pengurus OSIS yang terlambat atau tidak melaksanakan piket pagi sesuai jadwal."
        },
        {
          nama: "Piket Siang",
          penanggungJawab: "Raihan Akbar Putra Jaya",
          dasarPemikiran: "Kedisiplinan dan tanggung jawab merupakan nilai penting yang harus diterapkan dalam hal pelaksanaan ibadah dan ketepatan waktu. Perlu adanya sistem pengawasan yang efektif untuk memastikan seluruh siswa mengikuti kegiatan ibadah tepat waktu dan tertib.",
          tujuan: "Memberikan kesadaran kepada siswa dan siswi SMK Informatika Fitrah Insani dalam datang tepat waktu untuk beribadah. Memastikan seluruh siswa dan siswi hadir tepat waktu ke masjid atau rooftop untuk melaksanakan shalat dzuhur berjamaah.",
          waktu: "Setiap hari bergantian antara ikhwan dan akhwat",
          teknis: "Petugas piket mengecek ke setiap kelas untuk memastikan siswa dan siswi sudah menuju ke tempat ibadahnya tepat waktu.",
          anggaran: "Tidak ada anggaran",
          evaluasi: "Tidak ada jadwal yang teratur. Tidak ada dokumentasi saat pelaksanaan piket siang."
        },
        {
          nama: "Thoharah Reminder",
          penanggungJawab: "Qaulan Tsakilla",
          dasarPemikiran: "Sebagai siswi muslimah, menjaga ketaatan dalam beribadah merupakan bagian penting dari pembentukan karakter dan akhlak yang baik. Salah satu hal yang sering diabaikan adalah kedisiplinan dalam menjalankan kewajiban ibadah setelah masa haid berakhir.",
          tujuan: "Mengingatkan akhwat yang sudah selesai masa muthadiroh agar segera thoharoh. Meningkatkan kesadaran akhwat terhadap pentingnya kedisiplinan dalam ibadah. Membantu siswi agar lebih teratur mencatat dan mengenali siklus haidnya. Menumbuhkan rasa tanggung jawab pribadi serta kejujuran dalam hal ibadah.",
          waktu: "Sesuai kebutuhan",
          teknis: "Mencatat data semua siswi yang sedang haid dan hari keberapa masa haidnya. Data bersifat rahasia dan internal, hanya digunakan sebagai pengingat agar para akhwat dapat segera melakukan thoharoh dan kembali menunaikan ibadah.",
          anggaran: "Tidak ada anggaran",
          evaluasi: "-"
        }
      ]
    },
    {
      id: 3,
      nama: "Akademik Non-Akademik",
      icon: <FaBook size={24} />,
      color: "from-purple-400 to-pink-500",
      prokers: [
        {
          nama: "Mading (Majalah Dinding)",
          penanggungJawab: "Alvira Alifiah Raiq",
          dasarPemikiran: "Setiap siswa memiliki potensi, kreativitas, dan kemampuan yang berbeda-beda. Apresiasi terhadap karya dan pencapaian siswa sangat penting untuk menumbuhkan semangat belajar, berkreasi, serta meningkatkan rasa percaya diri. Mading Apresiasi menghadirkan sarana untuk menampilkan berbagai karya, desain, tulisan, dan prestasi siswa.",
          tujuan: "Meningkatkan semangat untuk berprestasi dan menghargai siswa atas pencapaiannya. Menciptakan suasana sekolah yang lebih inspiratif, kompetitif, dan berbudaya apresiatif yang sejalan dengan visi OSIS untuk mengembangkan potensi peserta didik secara menyeluruh.",
          waktu: "Rutinan",
          teknis: "Informasi lomba akan dipajang di mading dan siswa yang mendapatkan prestasi akan dipajang di mading sekolah dengan apresiasi khusus.",
          anggaran: "Tidak ada anggaran khusus",
          evaluasi: "-"
        },
        {
          nama: "Literasi Pintar",
          penanggungJawab: "Tsurayya Naqiya Octanary",
          dasarPemikiran: "Membaca merupakan kunci utama untuk memperluas wawasan, memperkaya pengetahuan, dan menumbuhkan daya berpikir kritis. Seiring berkembangnya teknologi dan media sosial, minat baca di kalangan pelajar mulai menurun. Perlu adanya upaya untuk menumbuhkan kembali semangat membaca di kalangan siswa-siswi.",
          tujuan: "Menambah pola pikir siswa, meningkatkan minat baca, dan meningkatkan citra sekolah yang peduli literasi. Melalui kegiatan rutin membaca buku cerita, novel, atau buku inspiratif, siswa dapat menikmati kegiatan membaca sebagai bagian dari gaya hidup yang bermanfaat dan menyenangkan.",
          waktu: "Setiap 2 minggu sekali",
          teknis: "Setiap siswa membawa buku cerita atau novel, membuat resume di kertas lembar, dan menyerahkannya kepada guru Indonesia.",
          anggaran: "Tidak ada anggaran khusus",
          evaluasi: "-"
        },
        {
          nama: "Classmeet",
          penanggungJawab: "Alfadjri Alifaumi",
          dasarPemikiran: "Classmeet adalah kegiatan untuk meningkatkan kebersamaan dan keakraban antar siswa di luar rutinitas belajar formal. Penting untuk mengembangkan keterampilan non-akademis seperti kepemimpinan, manajemen waktu, problem-solving, dan kemampuan berbicara di depan umum. Kegiatan ini juga dapat mengurangi stres akademik dan menambah silaturahmi antar adik kelas dan kakak kelas.",
          tujuan: "Mempererat hubungan sosial dan meningkatkan kekompakan antar siswa. Mengasah kemampuan soft skill dan membangun hubungan pertemanan yang lebih baik dalam suasana yang santai dan non-formal.",
          waktu: "Insidental",
          teknis: "Mengadakan berbagai aktivitas yang dirancang untuk membangun hubungan sosial, kerjasama tim, dan memberikan hiburan dengan melibatkan berbagai pertandingan olahraga, lomba kreativitas, atau games.",
          anggaran: "Tidak ada anggaran khusus",
          evaluasi: "Kekurangan komunikasi antar koordinator dan anggota Sekbid 3"
        },
        {
          nama: "Pameran Seni Karya",
          penanggungJawab: "Alfadjri Alifaumi",
          dasarPemikiran: "Pameran seni berfungsi sebagai wadah bagi seniman untuk mengekspresikan diri melalui karya-karya visual dan menyampaikan pesan, gagasan, atau kritik sosial. Pameran seni bukan hanya kesempatan untuk melihat karya seni, tetapi juga untuk mengapresiasi proses kreatif dan memahami nilai artistik serta konteks budaya yang mempengaruhi penciptaan karya.",
          tujuan: "Memperkenalkan karya seni kepada publik yang lebih luas dan memperkaya pengalaman kultural dan intelektual masyarakat. Mendukung ekosistem seni dan budaya dalam komunitas sekolah dengan memberikan apresiasi terhadap karya siswa.",
          waktu: "Insidental",
          teknis: "Menampilkan hasil karya siswa dari berbagai proyek seni yang telah dikerjakan atau memberikan waktu sekitar 1 bulan untuk pembuatan seni karya khusus untuk pameran.",
          anggaran: "Tidak ada anggaran khusus",
          evaluasi: "-"
        },
        {
          nama: "Peringatan 17 Agustus",
          penanggungJawab: "M. Syaddad Muallim",
          dasarPemikiran: "17 Agustus adalah hari peringatan kemerdekaan Republik Indonesia yang penting bagi seluruh rakyat untuk merayakan kebebasan dan mengenang perjuangan para pahlawan. Program ini dilaksanakan untuk meningkatkan kreativitas, sportivitas, rasa cinta tanah air, dan pemahaman makna kemerdekaan dalam diri generasi muda.",
          tujuan: "Membuat generasi muda memiliki jiwa yang bersemangat dalam merayakan hari kemerdekaan Indonesia. Membentuk generasi muda yang mencintai tanah air, memahami arti penting kemerdekaan, menghargai perjuangan para pahlawan, dan meningkatkan rasa persatuan dan kesatuan.",
          waktu: "Insidental",
          teknis: "Mulai dari pembentukan panitia, penentuan tema, hingga pelaksanaan acara. Melibatkan seluruh siswa, membuat jadwal, menyiapkan anggaran, dan melakukan evaluasi setelah acara untuk perbaikan di tahun berikutnya.",
          anggaran: "Tidak ada anggaran khusus",
          evaluasi: "Kurangnya komunikasi dan rundown yang tidak jelas"
        }
      ]
    },
    {
      id: 4,
      nama: "Ekonomi Kreatif",
      icon: <FaChartLine size={24} />,
      color: "from-yellow-400 to-orange-500",
      prokers: [
        {
          nama: "Promosi Lab Produksi dan Business Center",
          penanggungJawab: "Muhammad Shofwan Abdul Hakim",
          dasarPemikiran: "Memanfaatkan fasilitas yang ada di SMK Informatika Fitrah Insani untuk mengembangkan dan memproduksi barang kreatif seperti mug, pin, dan sebagainya. Business center mengembangkan jasa foto seperti pas foto, dokumentasi acara, dan dokumentasi video 360 derajat.",
          tujuan: "Anggota OSIS mendapat pengalaman dan pelajaran mengenai promosi produk dan berwirausaha. Menjadikan OSIS sebagai organisasi yang independen dengan memanfaatkan pendapatan untuk acara-acara besar.",
          waktu: "Fleksibel",
          teknis: "Sekbid 4 bekerjasama dengan pihak sekolah untuk mempromosikan jasa yang ditawarkan baik dalam sekolah maupun luar sekolah. Setelah mendapatkan pesanan, anggota mencatat barang yang dipesan dan memberikannya pada sekolah, kemudian memproses pesanan dan mengirimnya kepada pembeli.",
          anggaran: "Tidak ada anggaran khusus",
          evaluasi: "Harga barang atau jasa yang tidak jelas"
        },
        {
          nama: "Lomba Konten Promosi Produk",
          penanggungJawab: "Medina Zulfanisa",
          dasarPemikiran: "Kompetisi ini mendorong peserta untuk berpikir kreatif dan menghasilkan media promosi yang dapat membantu mempromosikan suatu produk. Meningkatkan skill mempromosikan produk dan berkontribusi pada peningkatan keterampilan dan pengetahuan tentang berwirausaha di era modern.",
          tujuan: "Mendorong kreativitas dan daya saing di kalangan peserta dalam menghasilkan solusi yang inovatif. Mengidentifikasi dan mengembangkan ide-ide baru yang dapat meningkatkan skill berwirausaha dan memberikan dampak positif secara sosial dan ekonomi.",
          waktu: "Insidental",
          teknis: "Sekbid 4 mengadakan lomba konten promosi produk dan mensosialisasikannya. Para siswa membuat konten promosi produk yang dijual, mengirimnya ke Google Drive, dan menguploadnya di akun Instagram kelas masing-masing. Konten dinilai oleh juri untuk menentukan pemenang.",
          anggaran: "Tidak ada anggaran khusus",
          evaluasi: "-"
        },
        {
          nama: "Market Day",
          penanggungJawab: "Darrel Khalfan Gunadi",
          dasarPemikiran: "Para peserta, baik individu maupun kelompok, dapat menjual produk atau layanan mereka kepada siswa, guru di SMA, SMK, dan SMP Fitrah Insani. Platform ideal untuk mengembangkan keterampilan wirausaha sejak dini, belajar tentang cara menjual produk, menentukan harga, dan berinteraksi dengan pelanggan.",
          tujuan: "Mengembangkan keterampilan wirausaha dan komunikasi bagi siswa. Memberikan pengalaman berwirausaha yang akan berguna di masa depan dan melatih keterampilan negosiasi yang penting dalam kehidupan sehari-hari.",
          waktu: "Insidental",
          teknis: "Sekbid 4 menentukan tempat dan waktu Market Day, menyiapkan tempat untuk siswa berjualan, dan mempersilahkan siswa untuk menampilkan produk yang akan dijual.",
          anggaran: "Tidak ada anggaran khusus",
          evaluasi: "-"
        },
        {
          nama: "Weekly Market",
          penanggungJawab: "Resti Dewi Lestari",
          dasarPemikiran: "Anggota OSIS dapat menjual produk mereka kepada siswa dan guru di lingkungan sekolah. Platform ideal untuk mengembangkan keterampilan wirausaha, menentukan harga, dan berinteraksi dengan pelanggan. Kegiatan ini melatih keterampilan komunikasi dan negosiasi yang penting.",
          tujuan: "Mengembangkan keterampilan wirausaha dan komunikasi bagi seluruh anggota OSIS. Memberikan pengalaman berwirausaha yang akan berguna di masa depan dan menjadikan OSIS sebagai organisasi yang independen dengan memanfaatkan pendapatan untuk acara-acara besar.",
          waktu: "Rutinan",
          teknis: "Sekbid 4 membuat jadwal untuk anggota OSIS yang akan berjualan, membeli makanan atau barang untuk dijual, dan saat jam istirahat memanggil anggota yang sudah dijadwalkan. Setelah dagangan habis atau waktu istirahat berakhir, menghitung penghasilan dari penjualan tersebut.",
          anggaran: "Tidak ada anggaran khusus",
          evaluasi: "Kurangnya komunikasi antar anggota Sekbid 4"
        },
        {
          nama: "Tanya Tanya Wirausahawan",
          penanggungJawab: "Muhammad Shofwan Abdul Hakim",
          dasarPemikiran: "Anggota OSIS mewawancarai para wirausahawan seperti para pelaku UMKM tentang jerih payah dan susah senangnya membangun usaha yang mereka jalani. Membantu mengembangkan keterampilan wirausaha sejak dini melalui pengalaman dan wawasan langsung dari praktisi bisnis.",
          tujuan: "Mengembangkan keterampilan wirausaha dan komunikasi bagi seluruh anggota OSIS. Memberikan pengalaman dan motivasi tentang pentingnya mempersiapkan diri menjadi wirausahawan sejak dini.",
          waktu: "Rutinan",
          teknis: "Sekbid 4 mencari para wirausahawan atau pelaku UMKM untuk diwawancarai, mengajak mereka untuk membuat konten wawancara yang nantinya akan dibagikan di akun Instagram OSIS dan dijadikan poster yang ditempel di mading sekolah.",
          anggaran: "Tidak ada anggaran khusus",
          evaluasi: "-"
        },
        {
          nama: "Market Stand",
          penanggungJawab: "Nasya Ghalia Muharti",
          dasarPemikiran: "Anggota OSIS membuka stand untuk menjual produk berupa barang, makanan, atau minuman di sebuah pasar minggu atau di tenant sebuah event acara. Memotivasi siswa tentang apa saja yang harus dipersiapkan jika ingin menjadi wirausahawan sejak dini.",
          tujuan: "Memotivasi dan mengajak siswa dan siswi untuk mendirikan usaha sejak dini. Memberikan pengalaman yang berguna di masa depan dan menjadikan OSIS sebagai organisasi yang dapat memberikan motivasi kepada siswa melalui Sekbid 4.",
          waktu: "Rutinan",
          teknis: "Sekbid 4 mencari tempat atau event untuk membuka stand, dan menjual produk yang sudah disediakan sebelumnya di stand tersebut.",
          anggaran: "Tidak ada anggaran khusus",
          evaluasi: "-"
        }
      ]
    },
    {
      id: 5,
      nama: "Kesehatan Lingkungan",
      icon: <FaLeaf size={24} />,
      color: "from-green-400 to-teal-500",
      prokers: [
        {
          nama: "Jumat Gizi, Sehat Pasti",
          penanggungJawab: "Annisa",
          dasarPemikiran: "Gaya hidup yang kurang sehat menjadi permasalahan yang dialami oleh remaja, termasuk pola makan yang tidak seimbang dan tingginya konsumsi makanan cepat saji. Program ini mendorong kebiasaan baik dalam konsumsi buah-buahan setiap hari Jumat karena kaya akan vitamin, serat, dan mineral yang penting.",
          tujuan: "Mendorong kebiasaan baik dalam konsumsi buah-buahan setiap hari Jumat. Menjaga kesehatan tubuh dan pikiran, serta meningkatkan daya tahan tubuh dan konsentrasi belajar siswa.",
          waktu: "Setiap hari Jumat selama jam istirahat pertama",
          teknis: "Anggota OSIS akan mem-broadcast WhatsApp sebelum hari Jumat dan saat istirahat pertama mengenai materi fakta unik tentang buah-buahan dengan tema berbeda setiap pekan. Siswa membawa 1 buah untuk dikonsumsi saat jam istirahat pertama Jumat, dan jika ada yang tidak membawa, temannya diharapkan membagi buah-buahannya. OSIS berkoordinasi dengan ketua kelas untuk memonitor.",
          anggaran: "Tidak ada anggaran khusus",
          evaluasi: "Banyaknya siswa yang tidak membawa buah dan kurangnya dokumentasi dari OSIS"
        },
        {
          nama: "Recycle Day (Daur Ulang Sampah)",
          penanggungJawab: "Zahra",
          dasarPemikiran: "Daur ulang sampah dapat mengurangi jumlah sampah yang dibuang ke tempat pembuangan akhir, sehingga mengurangi dampak lingkungan yang negatif. Ini adalah salah satu cara untuk meningkatkan kesadaran siswa tentang pentingnya menjaga lingkungan dan mengurangi masalah sampah di sekolah.",
          tujuan: "Mengurangi dampak lingkungan yang negatif dan meningkatkan kesadaran siswa tentang pentingnya menjaga lingkungan. Membuat siswa lebih kreatif dalam mengolah ulang sampah menjadi barang yang berguna dan mempunyai daya tarik tersendiri.",
          waktu: "Insidental",
          teknis: "Program ini dilaksanakan secara insidental dan akan diinformasikan sebelumnya agar siswa dapat mempersiapkan barang yang akan didaur ulang. Setiap kelas mendaur ulang sampah secara bersama-sama dengan kreativitasnya masing-masing. OSIS akan mendokumentasikan hasil karya dan memilih yang terbaik untuk diberikan penghargaan dan rewards.",
          anggaran: "Rp. 50.000",
          evaluasi: "Tidak terlaksana"
        },
        {
          nama: "Fit Everyday (Senam Pagi)",
          penanggungJawab: "Kiki",
          dasarPemikiran: "Aktivitas fisik memiliki peran penting dalam menjaga kesehatan fisik dan mental siswa. Banyak siswa yang cenderung kurang aktif bergerak karena padatnya aktivitas akademik dan pengaruh gaya hidup modern. Senam pagi dipilih karena merupakan bentuk olahraga ringan yang dapat diikuti oleh seluruh siswa tanpa memerlukan alat khusus.",
          tujuan: "Meningkatkan kebugaran dan membiasakan pola hidup sehat sejak dini. Memulai hari dengan lebih segar dan bersemangat melalui kegiatan senam pagi yang rutin.",
          waktu: "Fleksibel",
          teknis: "Siswa berkumpul di lapangan untuk melakukan pemanasan ringan yang dipimpin oleh instruktur atau perwakilan OSIS. Kemudian melaksanakan senam bersama dengan dipandu oleh instruktur atau perwakilan OSIS melalui mikrofon dan musik yang telah dipersiapkan.",
          anggaran: "Tidak ada anggaran khusus",
          evaluasi: "Kurangnya variasi senam dan instruktur senam yang selalu sama setiap proker berlangsung. Kurangnya dokumentasi"
        },
        {
          nama: "Jumsih (Jumat Bersih)",
          penanggungJawab: "Marrisa",
          dasarPemikiran: "Kebersihan merupakan aspek penting dalam menciptakan lingkungan yang sehat dan nyaman bagi seluruh warga sekolah. Banyak sekolah menghadapi permasalahan kurangnya kesadaran siswa dalam menjaga kebersihan lingkungan. Program ini meningkatkan kesadaran dan melibatkan seluruh warga sekolah dalam menciptakan lingkungan yang bersih.",
          tujuan: "Meningkatkan kesadaran akan pentingnya kebersihan dan lingkungan yang sehat. Melibatkan siswa dalam membersihkan area sekolah secara rutin dan membangun rasa tanggung jawab serta kepedulian terhadap kebersihan lingkungan.",
          waktu: "Menggantikan pengkondisian pagi di 2 minggu sekali di hari Jumat",
          teknis: "OSIS memberikan pengumuman pembagian area kebersihan melalui pengeras suara atau perwakilan guru. Siswa membersihkan area yang telah ditentukan, kemudian OSIS dan guru melakukan pengecekan kebersihan dan memastikan semua area sudah bersih serta merapikan kembali alat kebersihan.",
          anggaran: "Tidak ada anggaran khusus",
          evaluasi: "Siswa ikhwan lambat menuju tempat yang ditentukan - solusi: lebih tegas dalam menjalankan proker. Kurangnya alat bersih sehingga banyak siswa yang diam saja - solusi: menyiapkan alat bersih atau memberi tugas kebersihan lainnya."
        },
        {
          nama: "P3K Apel (Pertolongan Pertama Kali saat Apel)",
          penanggungJawab: "Lian",
          dasarPemikiran: "Kegiatan apel merupakan bagian dari pembinaan disiplin dan semangat kebangsaan. Kegiatan ini memiliki risiko kesehatan, terutama saat berlangsung dalam waktu yang cukup lama dan di bawah kondisi cuaca ekstrem seperti panas terik. Minimnya kesiapsiagaan dapat memperburuk kondisi siswa yang mengalami masalah kesehatan.",
          tujuan: "Meningkatkan keselamatan dan kesehatan siswa selama mengikuti kegiatan apel. Memberikan pertolongan pertama secara cepat kepada siswa yang mengalami masalah kesehatan dan meminimalkan risiko kesehatan yang lebih serius.",
          waktu: "Insidental",
          teknis: "Selama apel berlangsung, P3K bertugas mengawasi dari belakang barisan. Jika ada siswa yang terlihat sakit, akan didatangi dan dilayani dengan memberikan obat-obatan sebagai pencegahan atau pertolongan pertama dengan cepat dan tanggap.",
          anggaran: "Rp. 50.000 - Rp. 100.000",
          evaluasi: "Obat-obatan kurang dan kurang peka terhadap siswa yang terlihat kurang enak badan"
        }
      ]
    },
    {
      id: 6,
      nama: "Kominfo",
      icon: <FaMobileAlt size={24} />,
      color: "from-cyan-400 to-blue-500",
      prokers: [
        {
          nama: "Mengelola Sosial Media",
          penanggungJawab: "Athaya Zanirah Ramadhani",
          dasarPemikiran: "Sosial media adalah platform yang sangat populer di kalangan masyarakat. Dengan menggunakan sosial media, OSIS SMK Informatika Fitrah Insani dapat berkomunikasi secara efektif dengan siswa serta warga sekolah dan meningkatkan keterlibatan mereka. Konten Instagram yang menarik dan relevan dapat mendorong lebih banyak siswa berpartisipasi dalam kegiatan sekolah.",
          tujuan: "Sebagai referensi, bukti, atau sumber informasi siswa-siswi SMK Informatika Fitrah Insani di masa yang akan datang. Meningkatkan keterlibatan siswa, mempermudah penyampaian informasi, dan mendorong pengembangan kreativitas melalui partisipasi dalam pembuatan konten.",
          waktu: "2 kali dalam sebulan dan insidental (PHBI dan PHBN)",
          teknis: "Merencanakan konten yang akan dibuat, menganalisis dan mengevaluasi konten yang sudah dibuat, serta berkolaborasi dengan melibatkan sekbid lain, pihak sekolah, dan siswa dalam pembuatan konten dengan format video.",
          anggaran: "Tidak ada anggaran khusus",
          evaluasi: "Konten feeds dan reels Instagram belum berjalan dengan baik. Konten kerjasama dengan bidang lain belum dapat berjalan dengan baik. SOLUSI: Membuat dan mempost konten feeds dan reels harus konsisten. Berkoordinasi dengan bidang lain agar tidak terjadi mis-komunikasi."
        },
        {
          nama: "Jurnalistik",
          penanggungJawab: "Adzrahaifa Amadea Dwi",
          dasarPemikiran: "Jurnalistik adalah suatu aktivitas mencari, mengumpulkan, dan menyebarluaskan informasi serta berita berupa catatan kepada publik. Program ini membantu mempublikasi kegiatan yang ada di sekolah dan menjadi media komunikasi dalam penyampaian informasi kepada warga sekolah dan luar sekolah.",
          tujuan: "Memberikan informasi dan berita kepada pembaca (warga sekolah maupun luar sekolah). Meningkatkan minat literasi siswa dan memastikan tersampaikannya informasi mengenai kegiatan yang dilaksanakan di sekolah.",
          waktu: "1 bulan sekali",
          teknis: "Mencari dan mengumpulkan informasi terkait kegiatan yang ada, merancang narasi untuk dipublikasikan, dan mempublikasi narasi yang telah dibuat.",
          anggaran: "Tidak ada anggaran khusus",
          evaluasi: "Pengunggahan jurnalistik di story Instagram OSIS tidak tepat waktu. Jarak antara kegiatan berlangsung dengan waktu pengunggahan cukup berjauhan. SOLUSI: Menyusun jadwal pembuatan dan pengunggahan yang lebih terstruktur sesuai waktu kegiatan."
        },
        {
          nama: "Web Development",
          penanggungJawab: "Irga Andreansyah Setiawan",
          dasarPemikiran: "Website adalah sekumpulan halaman informasi digital yang saling terhubung di Internet, dikelola oleh satu atau lebih individu, kelompok, atau organisasi. Website dapat menjadi pusat informasi dan komunikasi resmi, profil organisasi dan portofolio digital bagi OSIS, serta alat untuk meningkatkan citra dan profesionalisme di mata siswa, guru, dan masyarakat.",
          tujuan: "Mengelola dan mengembangkan Website OSIS serta memfasilitasi komunikasi dan pusat informasi. Meningkatkan kredibilitas dan branding SMK Informatika Fitrah Insani, mendukung digitalisasi sekolah, dan mempermudah keterlibatan siswa.",
          waktu: "Dilaksanakan setiap ada kegiatan dan informasi terbaru dari OSIS SMK Informatika Fitrah Insani",
          teknis: "Mengumpulkan dan merencanakan informasi yang akan ditampilkan di Website seperti visi misi, profil anggota sekbid, dan program kerja OSIS. Memasukkan informasi terbaru tentang acara atau kegiatan yang diselenggarakan oleh OSIS dan dapat berkolaborasi untuk meminimalkan anggaran yang tidak perlu.",
          anggaran: "VPS: Rp. 97.000-311.000 per 10 bulan (Server); GitHub Copilot: Rp. 170.000; Domain: Rp. 211.000; Cadangan: Rp. 300.000. Total: Rp. 3.888.000",
          evaluasi: "-"
        },
        {
          nama: "Media Komunikasi Kreatif (MKK)",
          penanggungJawab: "Najwan Azhiim Muntadzor",
          dasarPemikiran: "Mading (Majalah Dinding) adalah media komunikasi luar jaringan yang ditempel di dinding untuk memajang berbagai konten seperti pengumuman, artikel, karya seni, atau informasi lainnya. Mading berfungsi sebagai sarana berbagi informasi yang mudah diakses dan bersifat fisik, serta media untuk menyalurkan kreativitas.",
          tujuan: "Menjadikan mading sebagai sarana untuk menyampaikan informasi secara jelas dan sarana untuk menyalurkan kreativitas melalui media luar jaringan. Meningkatkan minat membaca dengan konten yang menarik dan beragam, serta mempermudah siswa mendapatkan informasi terbaru tentang organisasi dan kegiatan sekolah.",
          waktu: "1 bulan sekali atau setiap ada konten terbaru dan menarik untuk dipublikasikan",
          teknis: "Menghias mading per-kelas sesuai tema yang sudah ditentukan dan bergantian setiap 1 bulan sekali. Merencanakan konten yang akan dipublikasikan, menganalisis dan membuat konten, serta berkolaborasi dengan melibatkan sekbid lain, pihak sekolah, dan siswa dalam pembuatan konten dan menghias mading.",
          anggaran: "Tidak ada anggaran khusus",
          evaluasi: "-"
        }
      ]
    }
  ];

  const activeSekbidData = sekbidData.find(s => s.id === activeSekbid);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Sekbid Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
        {sekbidData.map((sekbid) => (
          <button
            key={sekbid.id}
            onClick={() => setActiveSekbid(sekbid.id)}
            className={`group relative p-6 rounded-xl transition-all duration-300 ${
              activeSekbid === sekbid.id
                ? 'bg-gradient-to-br ' + sekbid.color + ' text-white shadow-2xl scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-lg hover:scale-102'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className={`p-3 rounded-lg ${
                activeSekbid === sekbid.id 
                  ? 'bg-white/20' 
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {sekbid.icon}
              </div>
              <span className="text-sm font-semibold text-center">
                Sekbid {sekbid.id}
              </span>
              <span className="text-xs text-center leading-tight">
                {sekbid.nama}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Program Kerja Cards */}
      {activeSekbidData && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Program Kerja{' '}
              <span className={`bg-gradient-to-r ${activeSekbidData.color} bg-clip-text text-transparent`}>
                {activeSekbidData.nama}
              </span>
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {activeSekbidData.prokers.length} Program Kerja
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeSekbidData.prokers.map((proker, index) => (
              <div
                key={index}
                className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                {/* Gradient Accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${activeSekbidData.color}`} />
                
                <div className="p-6">
                  {/* Proker Number Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br ${activeSekbidData.color} text-white text-sm font-bold`}>
                      {index + 1}
                    </div>
                  </div>

                  {/* Proker Title */}
                  <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-yellow-600 group-hover:to-amber-600 transition-all">
                    {proker.nama}
                  </h4>

                  {/* Proker Details */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-500 dark:text-yellow-400 mt-1 text-lg">👤</span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Penanggung Jawab</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">{proker.penanggungJawab}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-blue-500 dark:text-blue-400 mt-1 text-lg">📅</span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Waktu Pelaksanaan</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{proker.waktu}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-green-500 dark:text-green-400 mt-1 text-lg">🎯</span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Tujuan</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">{proker.tujuan}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-purple-500 dark:text-purple-400 mt-1 text-lg">💡</span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Dasar Pemikiran</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">{proker.dasarPemikiran}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-orange-500 dark:text-orange-400 mt-1 text-lg">⚙️</span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Teknis Pelaksanaan</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">{proker.teknis}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-red-500 dark:text-red-400 mt-1 text-lg">💰</span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Anggaran</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">{proker.anggaran}</p>
                      </div>
                    </div>

                    {proker.evaluasi !== "-" && (
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-500 dark:text-indigo-400 mt-1 text-lg">📊</span>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Evaluasi Tahun Lalu</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">{proker.evaluasi}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramKerjaSection;
