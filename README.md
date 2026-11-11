# Venditores

Aplikasi web untuk panitia acara yang membantu mengatur pengadaan vendor dari awal sampai acara selesai. Panitia mengunggah proposal PDF, Google Gemini menyusun daftar kebutuhan vendor beserta anggarannya, lalu panitia mencari vendor, membandingkan penawaran, dan memantau risiko dari dashboard.

Project tugas akhir mata kuliah Cloud Computing, Universitas Ciputra.

Website: https://venditores.fsd.my.id

## Tim

Wesley Goeinawan, 0706012410011, branch `wes`: struktur data, CRUD event, halaman event

Angga Dhammika Jaya, 0706012410017, branch `ang`: fondasi dan konfigurasi, navigasi, kebutuhan vendor dan penawaran, dashboard, deploy

Keane Juan Suryanto, 0706012410004, branch `kin`: integrasi Gemini, analisis proposal, AI matching, pencarian vendor online

## Fitur

Akun: daftar, login, reset password, verifikasi email lewat Purelymail.

Event: buat, ubah, hapus event beserta proposal PDF (maks. 10 MB, disimpan privat).

Analisis proposal: Gemini menulis ringkasan, skala acara, perkiraan peserta, dan kategori vendor beserta persentase anggaran. `BudgetAllocator` mengubahnya menjadi Rupiah sehingga total selalu sama dengan anggaran event.

Kebutuhan vendor: tambah, ubah, hapus, tandai vital. Status pengadaan berjalan Not started, Finding vendors, Comparing offers, Vendor chosen, Paid. Semua berubah otomatis saat bekerja dengan penawaran, kecuali Paid yang diatur manual. Tombol "What do the statuses mean?" di aplikasi menjelaskan tiap status.

Cari vendor online: tombol "Find vendors online" memakai Gemini dengan Google Search untuk mencari vendor sesuai kategori dan lokasi event, lalu "Add as quote" menjadikannya penawaran. Penawaran juga bisa diisi manual.

Penawaran: catat, pilih dengan tombol Choose, atau tolak.

AI matching: Gemini menilai kecocokan spesifikasi, PHP menilai anggaran. Skor akhir 60% spesifikasi dan 40% anggaran.

Risiko: Urgent kalau sisa 30 hari atau kurang, Warning 60 hari atau kurang, selain itu Low. Dihitung di PHP tanpa AI.

Dashboard: jumlah event, kebutuhan, penawaran, total anggaran, status pipeline, kebutuhan kritis, dan peringatan risiko.

Batas AI per pengguna per menit: analisis proposal 5x, matching 10x, pencarian vendor 10x.

## Teknologi

Laravel 13 (PHP 8.3 atau lebih baru, CI memakai PHP 8.5), Inertia 2, React 19, TypeScript, Tailwind CSS 4, shadcn/ui

Google Gemini API, model `gemini-3.5-flash` (bisa diganti lewat `GEMINI_MODEL`)

SQLite untuk development, Supabase Postgres dan Storage untuk production

Pest 4 untuk testing, GitHub Actions untuk CI/CD

## Menjalankan project

Yang harus terpasang: PHP 8.3 atau lebih baru (ekstensi `pdo_sqlite`, `sqlite3`, `mbstring`, `openssl`, `fileinfo`, `curl`), Composer 2, Node.js 22, Git.

```bash
git clone https://github.com/WesleyGoey/Venditores.git
cd Venditores
git switch kin                   # atau wes / ang

composer install
npm install

cp .env.example .env
php artisan key:generate

touch database/database.sqlite
php artisan migrate
php artisan db:seed              # opsional, data demo

composer run dev
```

Buka http://127.0.0.1:8000.

Isi `.env`:

`GEMINI_API_KEY`: minta ke Keane lewat chat pribadi, jangan di-commit. Tanpa key, hanya fitur AI yang tidak jalan.

`MAIL_MAILER=log`: email tidak dikirim, link verifikasi ada di `storage/logs/laravel.log`.

Akun demo setelah `db:seed`: `test@example.com` dengan password `password`. Seeder ini hanya untuk lokal.

Setelah `git pull`, jalankan `composer install`, `npm install`, dan `php artisan migrate`.

## Testing

```bash
php artisan test
```

Panggilan Gemini di-mock, jadi tidak memakai kuota.

## CI/CD

Workflow `.github/workflows/deploy.yaml` berjalan setiap push ke `main`:

1. Test: install dependency, build asset, jalankan `php artisan test`.
2. Deploy, hanya jika test lolos: build `vendor` dan `public/build`, kirim ke server lewat SCP, lalu lewat SSH jalankan `git pull`, `migrate --force`, dan `config:cache`.

Secret GitHub yang dibutuhkan (Settings, Secrets and variables, Actions):

`SSH_HOST`: alamat server

`SSH_USERNAME`: user SSH situs di CloudPanel

`SSH_PASSWORD`: password user tersebut

`DEPLOY_PATH`: folder project di server, contoh `/home/<user-situs>/htdocs/venditores.fsd.my.id`

Di server, `.env` production harus sudah terisi (APP_KEY, database Supabase, GEMINI_API_KEY, MAIL_*, disk proposal). Jangan jalankan `db:seed` di server.

## Struktur folder

`app/Enums`: status event, pengadaan, penawaran, risiko

`app/Http/Controllers`: controller tiap fitur

`app/Services`: BudgetAllocator, MatchScoreCalculator, RiskMonitor

`app/Services/Gemini`: GeminiClient, ProposalAnalyzer, QuoteMatcher, VendorFinder

`routes/features`: route per fitur

`resources/js`: halaman React (pages), komponen (components), helper dan metadata status (lib)

`tests`: test Pest
