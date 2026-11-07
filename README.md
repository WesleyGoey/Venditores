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


Status per Sabtu, 7 November 2026. Tabel ini diperbarui di README final.


| Fitur | Keterangan | PIC | Target | Status |
|-------|------------|-----|--------|--------|
| Fondasi project | Upgrade ke Laravel 13, konfigurasi Purelymail, Supabase, Gemini, branding Venditores, halaman landing | Angga | Sabtu | ✅ Selesai |
| Struktur data | Tabel & model event, kebutuhan vendor, penawaran; enum status | Wesley | Sabtu | ✅ Selesai |
| Inti AI | Gemini client, `BudgetAllocator`, `MatchScoreCalculator`, `RiskMonitor` + unit test | Keane | Sabtu | ✅ Selesai |
| Akun & verifikasi email | Daftar, login, verifikasi email lewat Purelymail | Angga & Wesley | Sabtu | ✅ Selesai |
| Kelola event | CRUD event + unggah proposal PDF (privat, maks. 10 MB) | Wesley | Minggu | ⏳ Belum |
| Analisis proposal dengan AI | Gemini membaca PDF dan menyusun kebutuhan vendor + persentase anggaran | Keane | Minggu | ⏳ Belum |
| Kebutuhan vendor & penawaran | CRUD kebutuhan, status pengadaan, catat & terima/tolak penawaran | Angga | Minggu | ⏳ Belum |
| Saran risiko & AI matching | Rekomendasi risiko dari Gemini, skor kecocokan penawaran 60% spesifikasi + 40% anggaran | Keane | Minggu–Senin | ⏳ Belum |
| Halaman detail event & kebutuhan | Tampilan detail event, daftar kebutuhan, perbandingan penawaran | Wesley & Keane | Senin | ⏳ Belum |
| Dashboard | Ringkasan event, kebutuhan kritis, peringatan risiko | Angga | Senin | ⏳ Belum |
| Test fitur & data demo | Feature test semua fitur, seeder akun demo | Semua | Selasa | ⏳ Belum |
| Deploy | CloudPanel + Supabase | Angga | Selasa | ⏳ Belum |


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


# 7. Jalankan aplikasi
composer run dev
```


Buka http://127.0.0.1:8000. `composer run dev` menjalankan server Laravel, Vite, log, dan queue listener sekaligus; hentikan dengan `Ctrl+C`.


### Isi `.env` untuk development


- `GEMINI_API_KEY`: minta ke Keane lewat chat pribadi. **Jangan pernah di-commit.** Tanpa key ini, semua fitur lain tetap jalan, hanya tombol AI yang akan menampilkan pesan error.
- `MAIL_MAILER=log` (bawaan): email verifikasi tidak benar-benar dikirim. Link verifikasi bisa dicari di `storage/logs/laravel.log`.
- `PROPOSAL_DISK=local` (bawaan): proposal disimpan di `storage/app/private/proposals`.


### Akun untuk mencoba


Daftar akun baru di `/register`, lalu buka link verifikasi yang tertulis di `storage/logs/laravel.log`. Seeder akun demo menyusul di hari Selasa.


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
