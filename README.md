# Venditores

Aplikasi web untuk panitia acara yang membantu mengatur pengadaan vendor dari awal sampai acara selesai. Panitia mengunggah proposal PDF, Google Gemini menyusun daftar kebutuhan vendor beserta anggarannya, lalu panitia mencari vendor, membandingkan penawaran, dan memantau risiko dari dashboard.

Project tugas akhir mata kuliah Cloud Computing, Universitas Ciputra.

Website: https://venditores.fsd.my.id

## Tim

Wesley Goeinawan, 0706012410011, branch `wes`

Angga Dhammika Jaya, 0706012410017, branch `ang`

Keane Juan Suryanto, 0706012410004, branch `kin`

## Fitur

Akun: daftar, login, reset password, dan verifikasi email.

Event: buat, ubah, dan hapus event beserta proposal PDF (maks. 10 MB, disimpan privat).

Analisis proposal: Gemini membaca proposal lalu menulis ringkasan, skala acara, perkiraan peserta, dan kategori vendor beserta persentase anggaran. Persentase itu diubah menjadi Rupiah sehingga total alokasi selalu sama dengan anggaran event.

Kebutuhan vendor: tambah, ubah, hapus, dan tandai sebagai vital. Status pengadaan berjalan Not started, Finding vendors, Comparing offers, Vendor chosen, lalu Paid. Status berubah otomatis saat panitia bekerja dengan penawaran, kecuali Paid yang diatur manual. Tombol "What do the statuses mean?" menjelaskan arti tiap status.

Cari vendor online: tombol "Find vendors online" memakai Gemini dengan Google Search untuk mencari vendor sesuai kategori dan lokasi event, lengkap dengan harga perkiraan, kontak, website, dan sumbernya. Hasilnya bisa dijadikan penawaran lewat "Add as quote".

Penawaran: catat manual atau dari hasil pencarian online, pilih dengan tombol Choose, atau tolak. Status penawaran: Under review, Chosen, Declined.

AI matching: Gemini menilai kecocokan penawaran dengan spesifikasi, lalu sistem menilai kecocokan harga dengan anggaran. Skor akhir adalah 60% spesifikasi dan 40% anggaran.

Risiko: dihitung dari sisa hari menuju acara tanpa AI. Urgent jika 30 hari atau kurang, Warning jika 60 hari atau kurang, selain itu Low.

Dashboard: jumlah event, kebutuhan vendor, penawaran, total anggaran, status pipeline, kebutuhan kritis, dan peringatan risiko.

Batas pemakaian AI per pengguna per menit: analisis proposal 5 kali, matching 10 kali, pencarian vendor 10 kali.

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

`GEMINI_API_KEY`: tanpa key, hanya fitur AI yang tidak jalan.

`MAIL_MAILER=log`: email tidak dikirim, link verifikasi ada di `storage/logs/laravel.log`.

Akun demo setelah `db:seed`: `test@example.com` dengan password `password`. Seeder ini hanya untuk lokal.

Setelah `git pull`, jalankan `composer install`, `npm install`, dan `php artisan migrate`.
