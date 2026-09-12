# 🏫 Sistem Pengelolaan Aset & Inventaris

> Sistem berbasis web untuk mengelola aset dan inventaris di lingkungan kampus/universitas — mencakup pendataan, tracking, peminjaman, hingga monitoring melalui dashboard terpusat.

---

## 📋 Deskripsi Proyek

Sistem Pengelolaan Aset & Inventaris adalah aplikasi web yang dirancang untuk membantu institusi pendidikan (kampus/universitas) dalam mengelola seluruh siklus hidup aset dan inventaris secara digital. Sistem ini menggantikan proses manual pencatatan aset dengan solusi terintegrasi yang mencakup pendataan, pelacakan kondisi & lokasi, mekanisme peminjaman/pengembalian, serta dashboard monitoring real-time.

### Latar Belakang

Pengelolaan aset dan inventaris di lingkungan kampus seringkali masih dilakukan secara manual menggunakan spreadsheet atau buku catatan. Hal ini menimbulkan beberapa masalah:

- **Data tidak terpusat** — informasi aset tersebar di berbagai dokumen
- **Sulit melacak kondisi & lokasi** — tidak ada sistem tracking yang terstruktur
- **Proses peminjaman tidak terdokumentasi** — rawan kehilangan dan kerusakan tanpa pertanggungjawaban
- **Tidak ada visibilitas real-time** — stakeholder tidak bisa melihat status aset secara langsung
- **Pencarian informasi aset memakan waktu** — harus cek manual satu per satu

### Tujuan

1. Menyediakan platform terpusat untuk pendataan seluruh aset & inventaris kampus
2. Memudahkan pelacakan kondisi, status, dan lokasi aset secara real-time
3. Mendigitalisasi proses peminjaman dan pengembalian aset
4. Menyediakan dashboard monitoring untuk pengambilan keputusan
5. Mengintegrasikan AI Chatbot untuk mempermudah pencarian informasi aset

---

## 👥 Target Pengguna

| Role | Deskripsi | Akses |
|------|-----------|-------|
| **Super Admin** | Administrator sistem, full access | Semua fitur + manajemen user |
| **Admin Unit** | Pengelola aset di unit/fakultas tertentu | CRUD aset unit, approval peminjaman |
| **Operator** | Staff yang menginput & mengupdate data | Input data, update kondisi/lokasi |
| **Peminjam** | Dosen/Staff/Mahasiswa yang meminjam aset | Request peminjaman, lihat status |
| **Viewer** | Stakeholder yang hanya melihat data | Dashboard & laporan (read-only) |

> **Catatan:** Struktur role di atas bersifat tentatif dan akan disesuaikan setelah SOP dari dosen pembimbing diterima.

---

## 🚀 Fitur

### Fitur Utama (Wajib)

#### 1. 📦 Manajemen Data Aset & Inventaris (CRUD)
- Tambah, edit, hapus, dan lihat data aset
- Kategorisasi aset (elektronik, furnitur, alat lab, dll.)
- Informasi detail: nama, kode aset, kategori, tahun perolehan, nilai/harga, foto, dll.
- Pencarian & filter data aset

#### 2. 📍 Tracking Lokasi, Kondisi & Status
- Pencatatan lokasi aset (gedung, ruangan, lantai)
- Status aset: **Tersedia** | **Dipinjam** | **Dalam Perbaikan** | **Rusak** | **Dihapuskan**
- Kondisi aset: **Baik** | **Cukup** | **Kurang** | **Rusak Ringan** | **Rusak Berat**
- Riwayat perubahan status & kondisi (audit trail)

#### 3. 🔄 Peminjaman & Pengembalian Aset
- Request peminjaman oleh user
- Approval flow (sesuai SOP — *menunggu SOP dari dosen pembimbing*)
- Pencatatan tanggal pinjam & estimasi pengembalian
- Reminder/notifikasi jatuh tempo pengembalian
- Pencatatan kondisi aset saat dipinjam vs. dikembalikan
- Riwayat peminjaman per aset & per peminjam

> ⚠️ **Status: Menunggu SOP**
> Mekanisme dan alur peminjaman/pengembalian akan didefinisikan lebih lanjut setelah SOP resmi dari dosen pembimbing diterima. Wireframe dan flow diagram akan dibuat setelah SOP confirmed.

#### 4. 👤 Manajemen User & Role
- Registrasi & autentikasi user (login/logout)
- Role-based access control (RBAC)
- Manajemen akun user (aktivasi, deaktivasi, reset password)
- Audit log aktivitas user

#### 5. 📊 Dashboard & Statistik
- Overview total aset per kategori
- Grafik distribusi kondisi aset
- Status peminjaman aktif
- Aset yang mendekati jatuh tempo pengembalian
- Statistik aset per unit/lokasi
- Trend pergerakan aset (historis)

### Fitur Tambahan (Opsional / Fase Selanjutnya)

#### 6. 🤖 AI Chatbot (n8n Integration)
- Chatbot berbasis AI untuk query informasi aset
- User bisa bertanya langsung, misalnya: *"Berapa jumlah proyektor yang tersedia di Gedung A?"*
- Integrasi melalui n8n workflow automation
- Mengurangi kebutuhan pengecekan manual

#### 7. 📄 Laporan & Export Data
- Generate laporan aset (per kategori, per unit, per periode)
- Export ke format PDF dan/atau Excel
- Laporan peminjaman berkala

#### 8. 📱 QR Code / Barcode
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
│   / MySQL)   │    Documents)        │   AI Chatbot)      │
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
- [ ] Terima SOP peminjaman dari dosen pembimbing
- [ ] Finalisasi tech stack
- [ ] Setup repository & project structure
- [ ] Desain database schema (ERD)
- [ ] Wireframe / mockup UI
- [ ] Setup development environment

### Fase 2: Core Development (Minggu 3–6)
> *Oktober 2026 (Minggu 1–4)*

- [ ] Implementasi autentikasi & manajemen user
- [ ] CRUD aset & inventaris
- [ ] Tracking lokasi, kondisi & status
- [ ] Dashboard dasar

### Fase 3: Fitur Peminjaman & Polish (Minggu 7–9)
> *November 2026 (Minggu 1–3)*

- [ ] Modul peminjaman & pengembalian (sesuai SOP)
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
| README / Scope Definition | ✅ Selesai |
| SOP Peminjaman | ⏳ Menunggu dari Dosen Pembimbing |
| Tech Stack | 🔲 Belum ditentukan |
| Database Design (ERD) | 🔲 Belum dimulai |
| Wireframe / Mockup | 🔲 Belum dimulai |
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
| **AI Chatbot** | n8n + LLM API | Opsional, fase lanjut |
| **Deployment** | VPS / Cloud | Akan ditentukan |

---

## 📂 Struktur Proyek (Rencana)

```
Pengelola_Aset&Inventaris/
├── README.md                  # Dokumentasi proyek (file ini)
├── docs/                      # Dokumentasi tambahan
│   ├── erd.md                 # Entity Relationship Diagram
│   ├── sop-peminjaman.md      # SOP Peminjaman (setelah diterima)
│   ├── wireframes/            # Mockup & wireframe UI
│   └── api-spec.md            # Spesifikasi API
├── frontend/                  # Source code frontend
├── backend/                   # Source code backend
├── database/                  # Migration & seed files
└── .github/                   # CI/CD workflows (opsional)
```

---

## 🚧 Yang Perlu Dilakukan Selanjutnya

1. **🔴 Prioritas Tinggi:** Dapatkan SOP peminjaman & pengembalian dari dosen pembimbing
2. **🟡 Prioritas Menengah:** Tentukan tech stack final
3. **🟡 Prioritas Menengah:** Buat ERD (database schema design)
4. **🟢 Bisa Paralel:** Buat wireframe/mockup UI untuk halaman utama
5. **🟢 Bisa Paralel:** Setup project structure & dev environment

---

## 👨‍💻 Tim Proyek

| Nama | Role | Tanggung Jawab |
|------|------|---------------|
| *(Nama kamu)* | Project Manager & Developer | Scope, planning, development, testing |
| *(Dosen Pembimbing)* | Pembimbing | SOP, review, guidance |

---

## 📌 Catatan Penting

- Proyek ini merupakan bagian dari mata kuliah **PPS (Semester 7)**
- Mekanisme peminjaman & pengembalian **bergantung pada SOP** yang akan diberikan oleh dosen pembimbing
- Desain sistem dibuat **API-first** agar memungkinkan pengembangan ke mobile app di masa depan
- Fitur AI Chatbot (n8n) bersifat **opsional** dan akan dikerjakan jika timeline memungkinkan
- QR Code juga bersifat **opsional** untuk fase selanjutnya

---

*Terakhir diperbarui: 12 September 2026*
