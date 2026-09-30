# 🏫 Sistem Pengelolaan Aset & Inventaris (SISETRIS)

> Sistem berbasis web untuk mengelola aset dan inventaris di lingkungan kampus/universitas — mencakup pendataan, tracking, peminjaman dengan **agreement legal**, **biaya sewa & diskon kampus**, hingga monitoring melalui dashboard terpusat.

---

## 📋 Deskripsi Proyek

Sistem Pengelolaan Aset & Inventaris adalah aplikasi web yang dirancang untuk membantu institusi pendidikan (kampus/universitas) dalam mengelola seluruh siklus hidup aset dan inventaris secara digital. Sistem ini menggantikan proses manual pencatatan aset dengan solusi terintegrasi yang mencakup pendataan, pelacakan kondisi & lokasi, mekanisme peminjaman/pengembalian **berbasis perjanjian legal**, serta dashboard monitoring real-time.

### Latar Belakang

Pengelolaan aset dan inventaris di lingkungan kampus seringkali masih dilakukan secara manual menggunakan spreadsheet atau buku catatan. Hal ini menimbulkan beberapa masalah:

- **Data tidak terpusat** — informasi aset tersebar di berbagai dokumen
- **Sulit melacak kondisi & lokasi** — tidak ada sistem tracking yang terstruktur
- **Proses peminjaman tidak terdokumentasi** — rawan kehilangan dan kerusakan tanpa pertanggungjawaban
- **Tidak ada agreement formal** — jika terjadi pelanggaran, sulit untuk menggugat
- **Tidak ada mekanisme biaya** — peminjaman tanpa biaya dan tanpa insentif pengembalian tepat waktu
- **Tidak ada visibilitas real-time** — stakeholder tidak bisa melihat status aset secara langsung
- **Pencarian informasi aset memakan waktu** — harus cek manual satu per satu

### Tujuan

1. Menyediakan platform terpusat untuk pendataan seluruh aset & inventaris kampus
2. Memudahkan pelacakan kondisi, status, dan lokasi aset secara real-time
3. Mendigitalisasi proses peminjaman dan pengembalian aset **dengan perjanjian legal**
4. Menerapkan **sistem biaya peminjaman** dengan diskon khusus untuk civitas kampus
5. Mengakomodasi **peminjam tamu/guest** dari luar kampus dengan verifikasi identitas
6. Menyediakan dashboard monitoring dan **laporan dana masuk** untuk pengambilan keputusan
7. Mengintegrasikan AI Chatbot untuk mempermudah pencarian informasi aset

---

## 👥 Target Pengguna

| Role | Deskripsi | Akses |
|------|-----------|-------|
| **Super Admin** | Administrator sistem, full access | Semua fitur + manajemen user |
| **Admin Unit** | Pengelola aset di unit/fakultas tertentu | CRUD aset unit, approval peminjaman, monitoring agreement, pengaturan biaya |
| **Operator** | Staff yang menginput & mengupdate data | Input data, update kondisi/lokasi |
| **Peminjam** | Dosen/Staff/Mahasiswa yang meminjam aset | Request peminjaman (dengan diskon kampus), lihat status |
| **Tamu / Guest** | User umum dari luar kampus | Request peminjaman (tarif penuh, wajib verifikasi identitas & DP) |
| **Viewer** | Stakeholder yang hanya melihat data | Dashboard & laporan (read-only) |

---

## 🚀 Fitur

### Fitur Utama (Wajib)

#### 1. 📦 Manajemen Data Aset & Inventaris (CRUD)
- Tambah, edit, hapus, dan lihat data aset
- Kategorisasi aset (elektronik, furnitur, alat lab, dll.)
- Informasi detail: nama, kode aset, kategori, tahun perolehan, nilai/harga, **biaya sewa per hari**, foto, dll.
- Pencarian & filter data aset
- **Tampilan kategori (card grid)** dan tampilan tabel dengan **pagination**
- Toggle view antara tampilan kategori dan tabel

#### 2. 📍 Tracking Lokasi, Kondisi & Status
- Pencatatan lokasi aset (gedung, ruangan, lantai)
- Status aset: **Tersedia** | **Dipinjam** | **Dalam Perbaikan** | **Rusak** | **Dihapuskan**
- Kondisi aset: **Baik** | **Cukup** | **Kurang** | **Rusak Ringan** | **Rusak Berat**
- Riwayat perubahan status & kondisi (audit trail)

#### 3. 🔄 Peminjaman & Pengembalian Aset
- Request peminjaman oleh user (internal kampus maupun tamu)
- **Perjanjian Peminjaman (Agreement Legal)**:
  - Setiap peminjaman wajib menyetujui perjanjian formal
  - Perjanjian mencakup tanggung jawab kerusakan, keterlambatan, denda, dan penggantian
  - Perjanjian bersifat **mengikat secara hukum** dan dapat dijadikan dasar gugatan
  - Tercatat timestamp persetujuan sebagai bukti
  - Admin Unit dapat **memonitor** seluruh agreement dan menandai pelanggaran
- **Biaya Peminjaman**:
  - Setiap aset memiliki biaya sewa per hari yang **fleksibel** (diatur oleh Admin Unit)
  - **Diskon khusus** untuk civitas kampus (dosen, mahasiswa, staff) — persentase diatur oleh Admin Unit
  - **Tamu/Guest** dikenakan **tarif penuh** tanpa diskon
  - Kalkulasi biaya otomatis (biaya × hari - diskon)
  - Denda keterlambatan per hari
- **Mekanisme Guest/Tamu**:
  - Registrasi dengan data identitas lengkap (nama, No. KTP, foto KTP, telepon, email, alamat)
  - Verifikasi identitas oleh Admin Unit sebelum bisa meminjam
  - Wajib membayar **DP/deposit** (50% dari total biaya) sebelum aset dapat diambil
- Approval flow oleh Admin Unit
- Pencatatan tanggal pinjam & estimasi pengembalian
- Reminder/notifikasi jatuh tempo pengembalian
- Pencatatan kondisi aset saat dipinjam vs. dikembalikan
- Riwayat peminjaman per aset & per peminjam

#### 4. 👤 Manajemen User & Role
- Registrasi & autentikasi user (login/logout)
- Role-based access control (RBAC) — termasuk role **Guest/Tamu**
- Registrasi tamu dengan verifikasi identitas
- Manajemen akun user (aktivasi, deaktivasi, reset password)
- Audit log aktivitas user

#### 5. 📊 Dashboard & Statistik
- Overview total aset per kategori
- Grafik distribusi kondisi aset
- Status peminjaman aktif
- Aset yang mendekati jatuh tempo pengembalian
- Statistik aset per unit/lokasi
- **Dana masuk bulan ini dan total** dari biaya peminjaman
- Dashboard khusus per role (Super Admin, Admin Unit, Operator, Peminjam, Guest, Viewer)

#### 6. 📝 Monitoring Agreement (Admin Unit)
- Tabel seluruh perjanjian peminjaman yang telah disetujui
- Filter berdasarkan status: Berlaku / Selesai / Dilanggar
- Detail isi perjanjian per peminjaman
- Fitur **tandai pelanggaran** untuk kasus yang melanggar perjanjian
- Dapat dijadikan dasar aju banding/gugatan

#### 7. 💰 Pengaturan Biaya (Admin Unit)
- Atur biaya sewa per aset (fleksibel per item)
- Atur persentase diskon kampus
- Atur denda keterlambatan per hari
- Ringkasan konfigurasi biaya unit

### Fitur Tambahan (Opsional / Fase Selanjutnya)

#### 8. 📄 Laporan & Export Data
- Generate laporan aset (per kategori, per unit, per periode)
- Export ke format PDF dan/atau Excel
- **Laporan Kondisi Aset** — export Excel dengan **sheet terpisah per kondisi** (Baik, Cukup, Kurang, Rusak Ringan, Rusak Berat) menggunakan SheetJS
- Laporan peminjaman berkala
- **Laporan Dana Masuk** — rekap pendapatan dari biaya peminjaman (dari kampus vs. tamu, per bulan)

#### 9. 🤖 AI Chatbot (n8n Integration)
- Chatbot berbasis AI untuk query informasi aset
- User bisa bertanya langsung, misalnya: *"Berapa jumlah proyektor yang tersedia di Gedung A?"* atau *"Berapa biaya sewa kamera DSLR?"*
- Integrasi melalui n8n workflow automation
- Mengurangi kebutuhan pengecekan manual

#### 10. 📱 QR Code / Barcode
- Generate QR Code per aset untuk identifikasi cepat
- Scan QR untuk melihat detail aset langsung

---

## 🏗️ Arsitektur Sistem (Rencana)

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (Web)                      │
│              Framework: TBD (React / Next.js)            │
│          Responsive Design (Mobile-Friendly)             │
├─────────────────────────────────────────────────────────┤
│                     Backend (API)                         │
│              Framework: TBD (Node.js / Laravel)          │
│                    RESTful API                            │
├──────────────┬──────────────────────┬───────────────────┤
│   Database   │   File Storage       │  External Service  │
│  (PostgreSQL │   (Aset Photos,      │  (n8n Workflow,    │
│   / MySQL)   │    KTP, Documents)   │   AI Chatbot)      │
└──────────────┴──────────────────────┴───────────────────┘
```

> **Catatan:** Tech stack final akan ditentukan setelah diskusi lebih lanjut. Arsitektur dirancang agar mudah di-extend ke mobile app di masa depan (melalui API).

### Pertimbangan Arsitektur

- **API-First Design** — Backend mengekspos RESTful API sehingga frontend web dan (nantinya) mobile app bisa menggunakan backend yang sama
- **Responsive Web** — Desain web yang responsif agar bisa digunakan di perangkat mobile melalui browser sebelum native app tersedia
- **Modular** — Fitur dibangun secara modular agar bisa ditambahkan bertahap

---

## 📅 Timeline & Roadmap

**Durasi Proyek:** ± 2.5 bulan (Pertengahan September — Akhir November 2026)

### Fase 1: Planning & Setup (Minggu 1–2)
> *Mid September — Akhir September 2026*

- [x] Definisi scope & fitur (README ini)
- [x] Konsultasi dosen — definisi alur agreement, biaya, dan guest
- [x] Mockup UI statis (HTML) — termasuk fitur agreement, biaya, guest
- [ ] Finalisasi tech stack
- [ ] Setup repository & project structure
- [ ] Desain database schema (ERD)
- [ ] Setup development environment

### Fase 2: Core Development (Minggu 3–6)
> *Oktober 2026 (Minggu 1–4)*

- [ ] Implementasi autentikasi & manajemen user (termasuk Guest)
- [ ] CRUD aset & inventaris (dengan biaya sewa)
- [ ] Tracking lokasi, kondisi & status
- [ ] Dashboard dasar (termasuk dana masuk)

### Fase 3: Fitur Peminjaman & Polish (Minggu 7–9)
> *November 2026 (Minggu 1–3)*

- [ ] Modul peminjaman & pengembalian (dengan agreement & biaya)
- [ ] Monitoring agreement (Admin Unit)
- [ ] Pengaturan biaya & diskon (Admin Unit)
- [ ] Mekanisme guest (registrasi, verifikasi, deposit)
- [ ] Laporan & export (termasuk Excel multi-sheet dan laporan dana masuk)
- [ ] Dashboard lanjutan & statistik
- [ ] AI Chatbot integration (n8n) — *jika waktu memungkinkan*
- [ ] UI/UX polish & responsive testing

### Fase 4: Testing & Deployment (Minggu 10)
> *November 2026 (Minggu 4)*

- [ ] Integration testing
- [ ] Bug fixing & optimization
- [ ] Deployment
- [ ] Dokumentasi akhir

---

## 📝 Status Proyek

| Item | Status |
|------|--------|
| README / Scope Definition | ✅ Selesai (diperbarui) |
| Konsultasi Dosen (Agreement, Biaya, Guest) | ✅ Selesai |
| Mockup UI Statis (HTML) | ✅ Selesai |
| Tech Stack | 🔲 Belum ditentukan |
| Database Design (ERD) | 🔲 Belum dimulai |
| Development | 🔲 Belum dimulai |
| Testing | 🔲 Belum dimulai |
| Deployment | 🔲 Belum dimulai |

---

## 🔧 Tech Stack (Kandidat)

| Layer | Opsi | Catatan |
|-------|------|---------|
| **Frontend** | React / Next.js / Vue | Akan ditentukan |
| **Backend** | Node.js (Express) / Laravel (PHP) | Akan ditentukan |
| **Database** | PostgreSQL / MySQL | Akan ditentukan |
| **Auth** | JWT / Session-based | Akan ditentukan |
| **File Storage** | Local / S3 | Untuk foto KTP guest, dokumen |
| **Export Excel** | SheetJS (xlsx) | Untuk export multi-sheet |
| **AI Chatbot** | n8n + LLM API | Opsional, fase lanjut |
| **Deployment** | VPS / Cloud | Akan ditentukan |

---

## 📂 Struktur Proyek (Rencana)

```
Pengelola_Aset&Inventaris/
├── README.md                  # Dokumentasi proyek (file ini)
├── Sistem peminjaman aset     # Mockup UI statis (HTML)
│   dan inventaris PPS.html
├── docs/                      # Dokumentasi tambahan
│   ├── erd.md                 # Entity Relationship Diagram
│   ├── sop-peminjaman.md      # SOP Peminjaman (agreement, biaya, guest)
│   ├── wireframes/            # Mockup & wireframe UI
│   └── api-spec.md            # Spesifikasi API
├── frontend/                  # Source code frontend
├── backend/                   # Source code backend
├── database/                  # Migration & seed files
└── .github/                   # CI/CD workflows (opsional)
```

---

## 🚧 Yang Perlu Dilakukan Selanjutnya

1. **🟡 Prioritas Menengah:** Tentukan tech stack final
2. **🟡 Prioritas Menengah:** Buat ERD (database schema design) — termasuk tabel agreement, biaya, guest
3. **🟢 Bisa Paralel:** Setup project structure & dev environment
4. **🟢 Bisa Paralel:** Buat SOP formal peminjaman berdasarkan mockup

---

## 👨‍💻 Tim Proyek

| Nama | Role | Tanggung Jawab |
|------|------|---------------|
| *(Nama kamu)* | Project Manager & Developer | Scope, planning, development, testing |
| *(Dosen Pembimbing)* | Pembimbing | SOP, review, guidance |

---

## 📌 Catatan Penting

- Proyek ini merupakan bagian dari mata kuliah **PPS (Semester 7)**
- Mekanisme peminjaman sudah didefinisikan berdasarkan konsultasi dosen: **agreement legal, biaya sewa, diskon kampus, guest/tamu**
- Desain sistem dibuat **API-first** agar memungkinkan pengembangan ke mobile app di masa depan
- Fitur AI Chatbot (n8n) bersifat **opsional** dan akan dikerjakan jika timeline memungkinkan
- QR Code juga bersifat **opsional** untuk fase selanjutnya
- Pada mockup, login menggunakan dropdown role untuk demo. Pada **versi real, login menggunakan email & password** saja — role ditentukan otomatis oleh sistem

---

*Terakhir diperbarui: 15 September 2026*
