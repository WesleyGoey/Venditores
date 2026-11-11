# Venditores

Aplikasi web untuk panitia acara yang membantu mengatur pengadaan vendor dari awal sampai acara selesai.

Panitia mengunggah proposal acara (PDF), lalu Google Gemini membaca proposal itu dan menyusun daftar kebutuhan vendor beserta pembagian anggarannya. Setelah itu panitia mencari vendor (manual atau lewat pencarian internet), mencatat penawaran, membandingkannya dengan bantuan AI, dan memantau risiko keterlambatan dari dashboard.

Project ini dibuat untuk tugas akhir mata kuliah Cloud Computing, Universitas Ciputra.

**Website:** https://venditores.fsd.my.id

## Daftar isi

- [Tim](#tim)
- [Fitur](#fitur)
- [Alur penggunaan](#alur-penggunaan)
- [Arti status](#arti-status)
- [Cara kerja AI](#cara-kerja-ai)
- [Teknologi](#teknologi)
- [Menjalankan project](#menjalankan-project)
- [Testing](#testing)
- [CI/CD dan deploy](#cicd-dan-deploy)
- [Struktur folder](#struktur-folder)
- [Masalah umum](#masalah-umum)

## Tim

| Nama | NIM | Branch | Fokus |
|------|-----|--------|-------|
| Wesley Goeinawan | 0706012410011 | `wes` | Struktur data, CRUD event, halaman event |
| Angga Dhammika Jaya | 0706012410017 | `ang` | Fondasi & konfigurasi, navigasi, kebutuhan vendor & penawaran, dashboard, deploy |
| Keane Juan Suryanto | 0706012410004 | `kin` | Integrasi Gemini, analisis proposal, AI matching, pencarian vendor online |

## Fitur

| Fitur | Keterangan |
|-------|------------|
| Akun & verifikasi email | Daftar, login, reset password, dan verifikasi email. Email dikirim lewat Purelymail. |
| Kelola event | Buat, lihat, ubah, hapus event: nama, tanggal, lokasi, total anggaran, deskripsi, dan proposal PDF (maks. 10 MB). Proposal disimpan privat dan hanya bisa diunduh pemiliknya. |
| Analisis proposal dengan AI | Gemini membaca PDF proposal, menulis ringkasan, skala acara, perkiraan jumlah peserta, dan daftar kategori vendor beserta persentase anggaran. |
| Pembagian anggaran otomatis | Persentase dari Gemini diubah menjadi Rupiah oleh `BudgetAllocator` (PHP), sehingga total alokasi selalu sama dengan anggaran event. |
| Kebutuhan vendor | Tambah, ubah, hapus kebutuhan secara manual dan tandai kebutuhan **vital**. Setiap kebutuhan punya status pengadaan dan stepper progres. |
| Cari vendor di internet | Tombol **Find vendors online**: Gemini + Google Search mencari vendor nyata sesuai kategori dan lokasi event. Hasilnya bisa langsung ditambahkan sebagai penawaran lewat **Add as quote**. Ada juga tombol **Open in Google** untuk mencari manual. |
| Penawaran vendor | Catat penawaran secara manual (nama, kontak, harga, catatan) atau dari hasil pencarian internet. Pilih penawaran dengan satu klik lewat tombol **Choose**, atau tolak. |
| AI matching penawaran | Gemini menilai kecocokan spesifikasi tiap penawaran. Skor akhir = 60% spesifikasi + 40% anggaran. |
| Pemantauan risiko | Level risiko dari sisa hari: Urgent (≤ 30 hari), Warning (≤ 60 hari), Low. Ditambah daftar kebutuhan vital yang belum aman. |
| Dashboard | Jumlah event, kebutuhan, penawaran, dan total anggaran; jumlah per status; kebutuhan kritis; peringatan risiko event terdekat. |
| Batas pemakaian AI | Per pengguna per menit: analisis proposal 5x, matching 10x, pencarian vendor 10x. |

## Alur penggunaan

1. **Buat event** dan unggah proposal PDF.
2. **Analyze proposal with AI** untuk mendapat daftar kebutuhan vendor dan anggarannya. Kebutuhan juga bisa ditambah manual.
3. Buka satu kebutuhan, lalu **Find vendors online** atau **Add quote** untuk mencatat penawaran.
4. **Match quotes with AI** untuk membandingkan penawaran, lalu **Choose** penawaran terbaik.
5. Setelah vendor dibayar, ubah status kebutuhan menjadi **Paid**.
6. Pantau semuanya dari **Dashboard**, lalu tandai event **Completed** kalau sudah selesai.

## Arti status

Tombol **What do the statuses mean?** di aplikasi menampilkan penjelasan yang sama.

**Status kebutuhan vendor**

| Status | Artinya | Berubah |
|--------|---------|---------|
| Not started | Kebutuhan sudah dibuat, belum ada vendor yang dicari. | Otomatis (status awal) |
| Finding vendors | Sedang mencari vendor, belum ada penawaran. | Otomatis saat mencari vendor online |
| Comparing offers | Sudah ada penawaran, tinggal dibandingkan. | Otomatis saat menambah penawaran |
| Vendor chosen | Satu penawaran dipilih, vendor aman, belum dibayar. | Otomatis saat memilih penawaran |
| Paid | Vendor sudah dibayar, kebutuhan selesai. | Manual |

Status mundur satu langkah kalau penawaran yang dipilih dibatalkan atau penawaran terakhir ditolak. Status **Paid** tidak pernah mundur otomatis.

**Status penawaran:** *Under review* (belum diputuskan), *Chosen* (dipilih), *Declined* (ditolak).

**Status event:** *Draft* (proposal belum dianalisis), *Analyzed* (pengadaan berjalan), *Completed* (selesai, tidak masuk peringatan dini).

## Cara kerja AI

1. **Gemini tidak pernah menghitung Rupiah.** Gemini hanya mengusulkan persentase per kategori. `app/Services/BudgetAllocator.php` mengubahnya menjadi Rupiah (bilangan bulat) dengan metode *largest remainder*.
2. **Skor penawaran dihitung bersama.** Gemini memberi skor kecocokan spesifikasi (0–100). `app/Services/MatchScoreCalculator.php` memberi skor anggaran: 100 kalau harga ≤ alokasi, berkurang 2 poin untuk setiap 1% di atas alokasi.
3. **Risiko dihitung di PHP.** `app/Services/RiskMonitor.php` menentukan level risiko dari sisa hari. Tidak ada AI yang terlibat.
4. **Pencarian vendor memakai Google Search grounding.** `app/Services/Gemini/VendorFinder.php` meminta Gemini mencari di web, lalu hanya meneruskan tautan `http(s)`. Hasilnya saran, bukan data terverifikasi: harga dan kontak harus dicek ke vendor sebelum memilih.
5. Panggilan Gemini lewat `app/Services/Gemini/GeminiClient.php`. Output terstruktur berupa JSON, dan otomatis dicoba ulang saat Gemini sibuk (429/500/503).
6. Semua proses berjalan langsung tanpa queue worker, jadi tidak perlu menjalankan `queue:work` di server.

## Teknologi

- Laravel 13 (PHP 8.3+, CI dan production memakai PHP 8.5), Inertia 2, React 19, TypeScript, Tailwind CSS 4, komponen shadcn/ui
- Google Gemini API (`gemini-3.5-flash`, bisa diganti lewat `GEMINI_MODEL`)
- SQLite untuk development, Supabase Postgres + Supabase Storage untuk production
- Purelymail (SMTP) untuk email verifikasi
- Pest 4 untuk testing, GitHub Actions untuk CI/CD

## Menjalankan project

### Yang harus terpasang

- PHP 8.3 atau lebih baru, dengan ekstensi `pdo_sqlite`, `sqlite3`, `mbstring`, `openssl`, `fileinfo`, dan `curl` aktif (cek dengan `php -m`)
- Composer 2
- Node.js 22 dan npm
- Git

### Langkah

```bash
# 1. Clone dan masuk ke folder project
git clone https://github.com/WesleyGoey/Venditores.git
cd Venditores

# 2. Pindah ke branch masing-masing (wes / ang / kin)
git switch kin

# 3. Install dependency PHP dan JavaScript
composer install
npm install

# 4. Buat file .env dari contoh
cp .env.example .env          # Windows CMD: copy .env.example .env

# 5. Buat APP_KEY
php artisan key:generate

# 6. Buat database SQLite lalu jalankan migration
touch database/database.sqlite   # Windows PowerShell: New-Item database/database.sqlite
php artisan migrate

# 7. (Opsional) isi data demo
php artisan db:seed

# 8. Jalankan aplikasi
composer run dev
```

Buka http://127.0.0.1:8000. `composer run dev` menjalankan server Laravel, Vite, log, dan queue listener sekaligus; hentikan dengan `Ctrl+C`.

### Isi `.env` untuk development

| Variabel | Keterangan |
|----------|------------|
| `GEMINI_API_KEY` | Minta ke Keane lewat chat pribadi. **Jangan pernah di-commit.** Tanpa key ini fitur lain tetap jalan, hanya tombol AI yang menampilkan pesan error. |
| `MAIL_MAILER=log` | Bawaan. Email verifikasi tidak benar-benar dikirim; link verifikasi ada di `storage/logs/laravel.log`. |
| `PROPOSAL_DISK=local` | Bawaan. Proposal disimpan di `storage/app/private/proposals`. |

### Akun demo

Setelah `php artisan db:seed`, login dengan `test@example.com` / `password`. Akun ini sudah terverifikasi dan punya satu event contoh lengkap dengan kebutuhan dan penawaran. Seeder ini **hanya untuk lokal**, jangan dijalankan di server.

### Setelah `git pull`

```bash
composer install
npm install
php artisan migrate
```

### Autocomplete di VS Code

Kalau Intelephense menampilkan banyak error `Undefined method` (misalnya pada `Storage::disk()`), buat file helper IDE lalu muat ulang VS Code:

```bash
php artisan ide-helper:generate
```

File `_ide_helper.php` otomatis diabaikan Git.

## Testing

```bash
php artisan test              # semua test (Gemini di-mock, tidak memakai kuota)
npx eslint .                  # cek lint JavaScript/TypeScript
npx tsc --noEmit              # cek tipe TypeScript
```

## CI/CD dan deploy

Workflow ada di `.github/workflows/deploy.yaml` dan berjalan setiap ada push ke branch `main`.

1. **Run Tests & Build Assets**: PHP 8.5, install dependency, build asset, lalu `php artisan test`.
2. **Deploy to Live Hosting** (hanya jika test lolos): install dependency production, build asset, kirim `vendor/` dan `public/build/` ke server lewat SCP, lalu lewat SSH menjalankan `git pull`, mengganti folder, `php artisan migrate --force`, dan `php artisan config:cache`.

Kedua folder dikirim terpisah karena sengaja tidak ada di Git dan server tidak memakai Composer maupun Node.

### Secret GitHub yang dibutuhkan

Isi di **Settings → Secrets and variables → Actions**:

| Secret | Isi |
|--------|-----|
| `SSH_HOST` | Alamat server |
| `SSH_USERNAME` | User SSH situs di CloudPanel |
| `SSH_PASSWORD` | Password user SSH |
| `DEPLOY_PATH` | Folder project di server, contoh `/home/<user-situs>/htdocs/venditores.fsd.my.id` |

### Yang harus ada di server (sekali saja)

- Project sudah di-clone di `DEPLOY_PATH` dan `git pull origin main` bisa jalan tanpa password.
- File `.env` production sudah diisi: `APP_KEY`, `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL`, database Supabase (`DB_*`), `GEMINI_API_KEY`, pengaturan Purelymail (`MAIL_*`), dan disk proposal untuk Supabase Storage.
- Jangan menjalankan `php artisan db:seed` di server.

## Struktur folder

```
app/Enums/                 Status event, pengadaan, penawaran, level risiko
app/Http/Controllers/      Controller event, kebutuhan vendor, penawaran, pencarian vendor, dashboard
app/Services/              BudgetAllocator, MatchScoreCalculator, RiskMonitor
app/Services/Gemini/       GeminiClient, ProposalAnalyzer, QuoteMatcher, VendorFinder
routes/features/           File route per fitur (dimuat otomatis oleh routes/web.php)
resources/js/pages/        Halaman React: dashboard, events, vendor-needs
resources/js/components/   Form, dialog, badge, stepper, panduan status, pencarian vendor
resources/js/lib/          Format angka/tanggal dan metadata status (label, deskripsi, warna)
tests/Feature, tests/Unit  Test Pest
.github/workflows/         CI/CD (deploy.yaml)
```

## Masalah umum

| Gejala | Solusi |
|--------|--------|
| `could not find driver` | Aktifkan `extension=pdo_sqlite` dan `extension=sqlite3` di `php.ini`, lalu buka ulang terminal. |
| `Unable to locate file in Vite manifest` | Jalankan `composer run dev` (atau `npm run dev`) supaya Vite aktif. |
| `Your requirements could not be resolved` saat `composer install` | Versi PHP terlalu lama. Laravel 13 butuh PHP 8.3+, cek `php -v`. |
| Halaman putih setelah pull | Jalankan `npm install`, lalu `composer run dev` lagi. |
| Tombol AI menampilkan "Too many AI requests" | Batas per menit tercapai, tunggu satu menit. |
| Find vendors online gagal atau hasilnya kosong | Cek `GEMINI_API_KEY`, lalu coba kata kunci lain. Pencarian dibatasi 10x per menit. |
| Banyak error `Undefined method` di VS Code | Jalankan `php artisan ide-helper:generate`, lalu muat ulang VS Code. |
| Deploy gagal di langkah SCP/SSH | Cek empat secret GitHub di atas dan pastikan `DEPLOY_PATH` benar. |
