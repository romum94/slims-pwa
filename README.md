# SLiMS Mobile PWA — Skeleton

Skeleton PWA (React + Vite) untuk aplikasi member & staff. Belum ada fitur konten (baca koleksi, scan ISBN, dll) — baru fondasi: pilih perpustakaan, login (member/staff), dan shell dashboard kosong.

## Yang sudah ada
- Pilih perpustakaan dari `GET /api/mobile/tenants` (dashboard API)
- Login member & staff ke `mobile-api/auth/member_login.php` / `staff_login.php` milik tenant yang dipilih
- Auto-refresh access token lewat `mobile-api/auth/refresh.php` saat dapat 401
- Simpan sesi di `localStorage` (bertahan walau app ditutup)
- PWA installable: `manifest.webmanifest` + service worker (auto-generated oleh `vite-plugin-pwa`), ikon masih placeholder (lihat bagian "Yang belum")

## Yang BELUM ada (sengaja, di luar scope skeleton ini)
- Semua fitur konten member (baca koleksi, kartu anggota, berita, chatbot) dan staff (scan ISBN, kirim notifikasi)
- Ikon PWA asli — sekarang masih placeholder kotak biru polos, generate ulang `public/icons/*.png` dengan logo asli sebelum rilis
- Branding dinamis per tenant (warna/logo dari Theme Configuration SLiMS) — saat ini warna masih statis (`#1e3a5f`)

## Setup development lokal

**Prasyarat**: Node.js 20+, npm. Jalankan di mesin yang ADA akses internet (bukan di sandbox Claude ini — jaringan di sana diblokir ke registry npm).

```bash
npm install
cp .env.example .env
# edit .env, isi VITE_DASHBOARD_API_BASE sesuai environment (sandbox/production)
npm run dev
```

Buka `http://localhost:5173`. Karena PWA/mobile-api berjalan di domain `*.coolify-vm.orb.local`, pastikan browser dev kamu bisa resolve domain itu (biasanya sudah bisa kalau kamu di VPN/network yang sama dengan VM, seperti saat testing endpoint sebelumnya).

## Build untuk production

```bash
cp .env.example .env.production
# edit .env.production, VITE_DASHBOARD_API_BASE = domain dashboard production
npm run build
```

Hasil build ada di folder `dist/` — kumpulan file static (HTML/JS/CSS + manifest + service worker), siap disajikan web server apa pun.

## Deploy ke Coolify sebagai service baru

Dockerfile sudah disiapkan (multi-stage: build dengan Node, sajikan dengan nginx). Cara paling simpel, konsisten dengan cara kamu deploy service lain di Coolify:

1. Push folder ini ke repo git baru (atau tambah sebagai folder baru di repo yang sudah ada).
2. Di Coolify, buat **New Resource → Application**, pilih source dari repo itu, build pack **Dockerfile** (bukan Nixpacks).
3. **PENTING**: isi environment variable `VITE_DASHBOARD_API_BASE` di Coolify (Build time ON, bukan Runtime — Vite "membakar" env var ke file JS saat build, bukan dibaca saat container jalan). Tanpa ini, Dockerfile butuh file `.env.production` sudah ada sebelum `npm run build` — cara paling mudah: commit `.env.production` ke repo (isinya bukan secret, cuma domain), ATAU edit `Dockerfile` untuk terima build arg.
4. Deploy. Coolify akan build image (stage 1: `npm install && npm run build`, stage 2: copy `dist/` ke nginx) dan jalankan container nginx di port 80.
5. Set domain/subdomain untuk service ini di Coolify (misalnya `app.coolify-vm.orb.local` untuk testing, atau domain asli nanti).

## Struktur folder
```
src/
├── api/client.js          -- semua panggilan fetch ke dashboard API & mobile-api
├── context/AuthContext.jsx -- state sesi (tenant, token, user), login/logout
├── pages/
│   ├── TenantSelect.jsx   -- halaman pilih perpustakaan
│   ├── Login.jsx          -- halaman login (tab member/staff)
│   └── Dashboard.jsx      -- shell kosong setelah login
├── App.jsx                -- routing + route guard (/dashboard butuh login)
└── main.jsx               -- entry point
```

## Catatan arsitektur penting
- **Dua host berbeda dipanggil**: dashboard API (daftar tenant) dan base_url tenant (login + fitur). Jangan gabungkan jadi satu `API_BASE` — lihat komentar di `src/api/client.js`.
- **Multi-tenant routing berbasis Host header** (sama seperti backend SLiMS) — `base_url` yang didapat dari endpoint daftar tenant HARUS dipakai apa adanya untuk semua request ke tenant itu, jangan di-hardcode domain lain.
- Begitu `TENANT_BASE_DOMAIN`/`TENANT_BASE_URL_SCHEME` di backend Dashboard diganti ke domain asli (lihat `sync-deploy-strategy.md` project), `base_url` yang dikembalikan endpoint otomatis ikut berubah — PWA ini TIDAK perlu diubah sama sekali untuk itu.
