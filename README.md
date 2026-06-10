# e-RW (Elektronik Rukun Warga) - Decoupled SPA

Aplikasi Layanan Administratif dan Keuangan Elektronik tingkat Rukun Warga (e-RW) dengan arsitektur decoupled (memisahkan Frontend SPA dan Backend REST API).

Aplikasi ini menggunakan **Next.js** untuk Frontend, **Laravel** untuk Backend API, dan **MySQL** (Laragon) sebagai database. Tampilan dirancang khusus dengan tema **putih minimalis, ringan, bersih, dan cepat** sesuai dengan instruksi kemudahan performa, serta dilengkapi profil avatar default berbasis jenis kelamin (👨/👩).

---

## 🗺️ Blueprint Proyek

### 1. Arsitektur Sistem
```
                +---------------------------------+
                |      Frontend (Next.js SPA)     |
                |      URL: localhost:3000        |
                +----------------+----------------+
                                 |
                        Request  |  Response
                       (JSON/API)|  (Bearer Token)
                                 v
                +----------------+----------------+
                |      Backend (Laravel API)      |
                |      URL: 127.0.0.1:8000        |
                +----------------+----------------+
                                 |
                            ORM  |  Query
                        (Eloquent)|  (SQL)
                                 v
                +----------------+----------------+
                |       Database (MySQL)          |
                |       DB Name: e_rw             |
                +---------------------------------+
```

### 2. Spesifikasi Role & Akses Cepat
Aplikasi ini mendukung **4 Role Pengguna** dengan batasan akses masing-masing. Di halaman `/login` tersedia **Grid Akses Cepat** untuk masuk langsung tanpa mengetik password secara manual:

| Role | Akun Uji Coba | Password Bawaan | Hak Akses Utama | Ikon Profil Default |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@erw.com` | `password` | Akses penuh seluruh sistem (Kelola Warga, Surat, Aduan, Kas Keuangan, & Tagihan Iuran) | 👨 (Laki-laki) |
| **Ketua RT** | `admin@erw.com` | `password` | CRUD Warga, Persetujuan Surat, Tanggapan Pengaduan, Tulis Pengumuman | 👨 (Laki-laki) |
| **Bendahara** | `bendahara@erw.com` | `password` | Kelola Buku Kas RW, Membuat Tagihan Bulanan, Konfirmasi Pembayaran Warga | 👩 (Perempuan) |
| **Warga** | `warga@erw.com` | `password` | Mengajukan Surat Pengantar, Kirim Laporan Aduan, Cek Tagihan, Baca Pengumuman | 👨 (Laki-laki) |

---

## 🗄️ Blueprint Database (Skema MySQL)

Berikut adalah struktur tabel yang digunakan di dalam database `e_rw`:

### A. Tabel `users`
Menyimpan data pengguna, profil kependudukan, role, dan jenis kelamin untuk emoji profile default.
*   `id` (BigInt, PK, Auto Increment)
*   `name` (String) - Nama Lengkap
*   `email` (String, Unique) - Email (sekaligus username login)
*   `password` (String) - Hash Password (bcrypt)
*   `role` (Enum: `'super_admin'`, `'admin'`, `'bendahara'`, `'warga'`)
*   `gender` (Enum: `'L'`, `'P'`) - Jenis kelamin (Laki-laki / Perempuan)
*   `no_kk` (String, Nullable) - Nomor Kartu Keluarga
*   `no_rt` (String, Nullable) - Nomor Rukun Tetangga (RT)
*   `no_rw` (String, Nullable) - Nomor Rukun Warga (RW)
*   `phone` (String, Nullable) - Nomor HP/Kontak
*   `address` (Text, Nullable) - Alamat Rumah Lengkap
*   `status_warga` (String, Default: `'aktif'`) - Status keaktifan (aktif, pendatang, pindah, meninggal)
*   `created_at` / `updated_at` (Timestamps)

### B. Tabel `announcements`
Menyimpan informasi/pengumuman penting pengurus RW.
*   `id` (BigInt, PK, Auto Increment)
*   `title` (String) - Judul Pengumuman
*   `content` (Text) - Isi Pengumuman
*   `author_id` (BigInt, FK -> `users.id`) - Penulis Pengumuman
*   `created_at` / `updated_at` (Timestamps)

### C. Tabel `complaints`
Wadah pelaporan aduan atau keluhan lingkungan oleh warga beserta status tindak lanjutnya.
*   `id` (BigInt, PK, Auto Increment)
*   `user_id` (BigInt, FK -> `users.id`) - Warga pelapor
*   `title` (String) - Judul Laporan
*   `content` (Text) - Detail Laporan/Kronologi
*   `status` (Enum: `'pending'`, `'processed'`, `'resolved'`) - Status aduan
*   `reply` (Text, Nullable) - Tanggapan dari Admin RT/RW
*   `created_at` / `updated_at` (Timestamps)

### D. Tabel `letter_requests`
Alur kerja pengajuan surat pengantar administratif RT/RW secara online.
*   `id` (BigInt, PK, Auto Increment)
*   `user_id` (BigInt, FK -> `users.id`) - Warga pengaju
*   `letter_type` (String) - Jenis Surat (misal: Surat Pengantar KTP, Domisili, dll.)
*   `purpose` (Text) - Keperluan pengajuan
*   `status` (Enum: `'pending'`, `'approved'`, `'rejected'`) - Status persetujuan
*   `notes` (Text, Nullable) - Catatan nomor surat atau alasan penolakan
*   `created_at` / `updated_at` (Timestamps)

### E. Tabel `finances`
Pencatatan kas masuk (pemasukan) dan kas keluar (pengeluaran) RW.
*   `id` (BigInt, PK, Auto Increment)
*   `type` (Enum: `'income'`, `'expense'`) - Tipe Transaksi
*   `amount` (Decimal 15,2) - Nominal Uang
*   `description` (String) - Keterangan Transaksi
*   `date` (Date) - Tanggal Transaksi
*   `created_at` / `updated_at` (Timestamps)

### F. Tabel `bills`
Tagihan iuran rutin bulanan untuk warga (misal: biaya keamanan, sampah, dll.).
*   `id` (BigInt, PK, Auto Increment)
*   `user_id` (BigInt, FK -> `users.id`) - Warga penerima tagihan
*   `month` (String) - Periode Bulan (Format: `YYYY-MM`)
*   `amount` (Decimal 15,2) - Jumlah Tagihan
*   `status` (Enum: `'unpaid'`, `'paid'`) - Status Pembayaran
*   `payment_date` (Date, Nullable) - Tanggal Pelunasan
*   `created_at` / `updated_at` (Timestamps)

---

## ⚙️ Cara Menjalankan Proyek Secara Lokal

### Prasyarat
1.  **PHP >= 8.2** & **Composer**
2.  **Node.js >= 18** & **NPM**
3.  **Laragon** (atau MySQL Server lokal lainnya)

---

### Langkah 1: Pengaturan Database (Laragon/MySQL)
1.  Buka Laragon, lalu buat database baru bernama `e_rw`.
2.  Pastikan port MySQL Anda berjalan (secara default `3306`).

---

### Langkah 2: Setup Backend (Laravel)
1.  Masuk ke direktori `/backend`:
    ```bash
    cd backend
    ```
2.  Install dependensi PHP composer:
    ```bash
    composer install
    ```
3.  Salin berkas `.env.example` menjadi `.env`:
    ```bash
    cp .env.example .env
    ```
4.  Sesuaikan pengaturan database di `.env` (Laragon default):
    ```env
    DB_CONNECTION=mysql
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_DATABASE=e_rw
    DB_USERNAME=root
    DB_PASSWORD=123456  # Sesuaikan dengan password database Laragon Anda
    ```
5.  Generate application key:
    ```bash
    php artisan key:generate
    ```
6.  Jalankan migrasi tabel dan seeding data mock awal:
    ```bash
    php artisan migrate --seed
    ```
7.  Jalankan server Laravel API:
    ```bash
    php artisan serve
    ```
    *API Backend berjalan di: `http://127.0.0.1:8000`*

---

### Langkah 3: Setup Frontend (Next.js)
1.  Buka terminal baru di direktori `/frontend`:
    ```bash
    cd frontend
    ```
2.  Install seluruh package Next.js:
    ```bash
    npm install
    ```
3.  Jalankan server pengembangan:
    ```bash
    npm run dev
    ```
    *Aplikasi Frontend berjalan di: `http://localhost:3000`*

---

### 🚀 Cara Menjalankan Cepat dari Root Folder
Di root folder proyek (`e-rw`), kami sudah menyediakan skrip npm otomatis di `package.json` untuk menjalankan frontend dan backend secara lebih efisien tanpa berpindah-pindah folder manual:

*   **Menjalankan Frontend:**
    ```bash
    npm run dev:frontend
    ```
*   **Menjalankan Backend (Artisan serve):**
    ```bash
    npm run serve:backend
    ```
