# Venditores


Venditores adalah aplikasi web untuk panitia acara yang membantu mengatur pengadaan vendor dari awal sampai acara selesai. Panitia cukup mengunggah proposal acara (PDF), lalu Google Gemini membaca proposal tersebut dan menyusun daftar kebutuhan vendor beserta pembagian anggarannya. Setelah itu panitia mencatat penawaran dari vendor, membandingkannya dengan bantuan AI, dan memantau risiko keterlambatan dari dashboard.


Project ini dibuat untuk tugas akhir mata kuliah Cloud Computing, Universitas Ciputra.


## Tim


| Nama | NIM | Branch | Fokus |
|------|-----|--------|-------|
| Wesley Goeinawan | 0706012410011 | `wes` | Struktur data, CRUD event, halaman event |
| Angga Dhammika Jaya | 0706012410017 | `ang` | Fondasi & konfigurasi, navigasi, kebutuhan vendor & penawaran, dashboard, deploy |
| Keane Juan Suryanto | 0706012410004 | `kin` | Integrasi Gemini, analisis proposal, AI matching, saran risiko |


## Progres fitur


| Fitur | Keterangan | Status |
|-------|------------|--------|
| Akun & verifikasi email | Daftar, login, reset password, dan verifikasi email (starter kit Laravel). Email dikirim lewat Purelymail. | ✅ Selesai |
| Kelola event | Buat, lihat, ubah, hapus event: nama, tanggal, lokasi, total anggaran, deskripsi, dan proposal PDF (maks. 10 MB). Proposal disimpan privat dan hanya bisa diunduh pemiliknya. | ✅ Selesai |
| Analisis proposal dengan AI | Gemini membaca PDF proposal, menulis ringkasan, skala acara, perkiraan jumlah peserta, dan daftar kategori vendor beserta persentase anggaran. | ✅ Selesai |
| Pembagian anggaran otomatis | Persentase dari Gemini diubah menjadi Rupiah oleh `BudgetAllocator` (PHP), sehingga totalnya selalu tepat sama dengan anggaran event. | ✅ Selesai |
| Kebutuhan vendor | Tambah, ubah, hapus kebutuhan secara manual; tandai kebutuhan vital; ubah status pengadaan (Drafting → Searching → Quoted → Deal → Paid). | ✅ Selesai |
| Penawaran vendor | Catat penawaran (nama vendor, kontak, harga, catatan), terima atau tolak penawaran. | ✅ Selesai |
| AI matching penawaran | Gemini menilai kecocokan spesifikasi tiap penawaran; PHP menghitung skor anggaran; skor akhir = 60% spesifikasi + 40% anggaran. | ✅ Selesai |
| Pemantauan risiko | Status risiko dari sisa hari: Urgent (≤ 30 hari), Warning (≤ 60 hari), Low. Ditambah daftar kebutuhan vital yang belum aman. | ✅ Selesai |
| Saran risiko dari AI | Gemini memberi ringkasan risiko dan rekomendasi langkah berdasarkan kondisi pengadaan event. | ✅ Selesai |
| Dashboard | Ringkasan semua event: jumlah event, kebutuhan, penawaran, dan total anggaran; jumlah per status; kebutuhan kritis yang belum aman; peringatan risiko event terdekat. | ✅ Selesai |
| Batas pemakaian AI | Per pengguna per menit: analisis 5x, matching 10x, saran risiko 5x. | ✅ Selesai |
| Deploy | CloudPanel (https://venditores.fsd.my.id), database Supabase Postgres, file proposal di Supabase Storage. Dikerjakan Angga setelah merge final. | 🚀 Siap deploy |


## Cara kerja AI


1. **Gemini tidak pernah menghitung Rupiah.** Gemini hanya mengusulkan persentase per kategori. `app/Services/BudgetAllocator.php` mengubahnya menjadi Rupiah (bilangan bulat) dengan metode *largest remainder*, jadi jumlah semua alokasi selalu sama dengan total anggaran.
2. **Skor penawaran dihitung bersama.** Gemini memberi skor kecocokan spesifikasi (0–100). `app/Services/MatchScoreCalculator.php` memberi skor anggaran: 100 kalau harga ≤ alokasi, berkurang 2 poin untuk setiap 1% di atas alokasi. Skor akhir = 60% spesifikasi + 40% anggaran.
3. **Risiko dihitung di PHP.** `app/Services/RiskMonitor.php` menentukan level risiko dari sisa hari; Gemini (`RiskAdvisor`) hanya menulis saran.
4. Semua panggilan Gemini lewat `app/Services/Gemini/GeminiClient.php` dengan output JSON terstruktur, dan otomatis dicoba ulang saat Gemini sibuk (429/500/503).
5. Semua proses berjalan langsung (tanpa queue worker), jadi tidak perlu menjalankan `queue:work` di server.


## Teknologi


- Laravel 13 (PHP 8.3+), Inertia 2, React 19, TypeScript, Tailwind CSS 4, komponen shadcn/ui
- Google Gemini API (`gemini-3.5-flash`, bisa diganti lewat `GEMINI_MODEL`)
- SQLite untuk development, Supabase Postgres + Supabase Storage untuk production
- Purelymail (SMTP) untuk email verifikasi
- Pest 4 untuk testing


## Menjalankan project setelah clone


### Yang harus terpasang


- PHP 8.3 atau lebih baru, dengan ekstensi `pdo_sqlite`, `sqlite3`, `mbstring`, `openssl`, `fileinfo`, dan `curl` aktif (Laragon/Herd di Windows sudah menyediakan ini; cek dengan `php -m`)
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


- `GEMINI_API_KEY`: minta ke Keane lewat chat pribadi. **Jangan pernah di-commit.** Tanpa key ini, semua fitur lain tetap jalan, hanya tombol AI yang akan menampilkan pesan error.
- `MAIL_MAILER=log` (bawaan): email verifikasi tidak benar-benar dikirim. Link verifikasi bisa dicari di `storage/logs/laravel.log`.
- `PROPOSAL_DISK=local` (bawaan): proposal disimpan di `storage/app/private/proposals`.


### Akun demo


Setelah `php artisan db:seed`, login dengan `test@example.com` / `password`. Akun ini sudah terverifikasi dan punya satu event contoh lengkap dengan kebutuhan dan penawaran. Seeder ini **hanya untuk lokal**, jangan dijalankan di server.


### Setelah `git pull`


```bash
composer install
npm install
php artisan migrate
```


## Testing


```bash
php artisan test              # semua test (Gemini di-mock, tidak memakai kuota)
vendor/bin/pint --test        # cek format PHP
npx eslint .                  # cek lint JavaScript/TypeScript
npx tsc --noEmit              # cek tipe TypeScript
```


## Masalah umum


| Gejala | Solusi |
|--------|--------|
| `could not find driver` | Aktifkan `extension=pdo_sqlite` dan `extension=sqlite3` di `php.ini`, lalu buka ulang terminal. |
| `Unable to locate file in Vite manifest` | Jalankan `composer run dev` (atau `npm run dev`) supaya Vite aktif. |
| `Your requirements could not be resolved` saat `composer install` | Versi PHP terlalu lama. Laravel 13 butuh PHP 8.3+, cek `php -v`. |
| Halaman putih setelah pull | Jalankan `npm install`, lalu `composer run dev` lagi. |
| Tombol AI menampilkan "Too many AI requests" | Batas per menit tercapai, tunggu satu menit. |


## Struktur folder penting


```
app/Enums/                 Status event, pengadaan, penawaran, level risiko
app/Http/Controllers/      Controller event, kebutuhan vendor, penawaran, AI, dashboard
app/Services/              BudgetAllocator, MatchScoreCalculator, RiskMonitor
app/Services/Gemini/       GeminiClient, ProposalAnalyzer, QuoteMatcher, RiskAdvisor
routes/features/           File route per fitur (dimuat otomatis oleh routes/web.php)
resources/js/pages/        Halaman React: dashboard, events, vendor-needs
resources/js/components/   Form, dialog, badge status
tests/Feature, tests/Unit  Test Pest
```
