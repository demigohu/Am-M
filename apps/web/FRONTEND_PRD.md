# Am-M — Frontend PRD

**Dibedah dari:** `docs/PRD.md`, fokus khusus ke `apps/web`.
**Status IA:** final — keputusan di bawah ini sudah dikunci, nggak ada lagi opsi A/B.
**Tujuan dokumen ini:** jawab tiga hal buat siapapun yang kerjain FE — halaman apa aja,
fitur/komponen apa di tiap halaman, dan urutan langkah user yang harus kepenuhi. PRD utama
tetap sumber kebenaran buat keputusan produk/protokol; dokumen ini narrow-down ke lapisan
yang kelihatan/disentuh user.

---

## 0. Keputusan IA (final)

| Keputusan                     | Hasil                                                                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home                          | Landing page murni — jelasin project-nya apa. Nggak nampilin data agent live.                                                                                                               |
| `/market`                     | Ada, terpisah dari Home. Fungsinya browse SEMUA agent lintas 4 desk.                                                                                                                        |
| `/desks/[slug]`               | Ada, terpisah dari `/market`. Fungsinya bandingin dalam SATU desk secara dalam.                                                                                                             |
| Navbar                        | **Satu** navbar konsisten di semua halaman. Nggak ada shell Site vs App terpisah lagi.                                                                                                      |
| Kata "Browse"                 | Dibuang. Nav pakai link langsung "Market", bukan dropdown.                                                                                                                                  |
| Marigold di nav               | Dibuang dari nav sepenuhnya. CTA utama muncul di dalam konten halaman, bukan nempel di nav.                                                                                                 |
| `/desks/[slug]` vs `/desks/*` | `[slug]` adalah dynamic route Next.js beneran (`/desks/rebalance`, `/desks/grid`, dst — masing-masing URL sendiri). `/desks/*` cuma notasi longgar, bukan format teknis — bukan opsi kedua. |

**Kenapa Market DAN Desk dua-duanya perlu ada, bukan salah satu:**
Beda kepadatan informasi, beda tujuan pakai.

- `/market` = scan cepat lintas 4 desk sekaligus. Karena nampilin 8 agent dari 4 jenis
  pekerjaan yang beda dalam satu tabel, kolom metriknya harus digeneralisir (satu kolom
  "metrik hidup" generik per baris) biar tetep kebaca.
- `/desks/[slug]` = begitu user udah fokus di satu pekerjaan, dia butuh SEMUA kolom metrik
  spesifik desk itu (utuh, bukan digeneralisir) plus sort wajib buat bandingin 2 varian
  dengan detail penuh. Ini nggak bisa dipaksa jadi state filter di dalam Market tanpa
  ngorbanin salah satu dari dua kebutuhan itu.

---

## 1. Navbar — satu spec buat semua halaman

```
[Logo → /]  ·····  Market   Report  ·····  [Account]
```

- Logo selalu balik ke Home (`/`), bukan ke Market.
- Dua link nav: **Market**, **Report** — plain text link, bukan dropdown, bukan "Browse".
- **Account** — chip/button, isinya alamat wallet terpotong + jumlah agent aktif kalau
  udah ada akun; kalau belum ada akun, cukup tombol "Account" polos.
- **Tidak ada tombol Marigold di nav ini, di halaman manapun.** Marigold cuma dipakai
  sebagai CTA utama di dalam konten halaman (contoh: tombol besar di hero Home yang
  ngarah ke `/market`, atau tombol Hire di baris listing).
- Footer: brand lockup (icon + wordmark, satu elemen aja, sama seperti nav) + link
  sekunder (Report, 8004scan, BscScan testnet).

Ini satu-satunya navbar yang perlu dibangun — nggak ada lagi versi kedua buat Home/Report.

---

## 2. Peta halaman (IA)

```
/                    Home — landing page, jelasin project, CTA masuk ke /market
/market              Browse semua agent lintas 4 desk, filter chip per desk
/desks/[slug]        Bandingin dalam 1 desk (rebalance|grid|yield|guard), full metrik + sort
/agents/[id]         Profil agent — bukti + CTA Hire
/account             Hub: buat akun, danai, saldo, agent aktif, revoke, tarik
/hire/[id]           Checkout — preview izin + grant + bayar $U
/jobs/[jobId]        Status job ERC-8183 + deliverable
/report              Agent Advantage Report (bukti buat TermiX)
```

`/sessions` bukan rute — kontrol session hidup sebagai bagian dari `/account`.

---

## 3. Prinsip yang ngatur semua keputusan FE

1. **Layar pertama = pekerjaan, bukan nama protokol.** Jangan sebut "ERC-8004" atau
   "session key" sebelum user ngerti ini soal "jaga LP-ku di range" dsb.
2. **Data padat, jujur.** Tabel dan angka live, bukan hero kosong. "Belum diukur" >
   angka karangan atau nol palsu.
3. **Setiap fakta on-chain punya tautan explorer.** BscScan, 8004scan, explorer Altana.
4. **Setiap CTA yang bisa gagal, ada jalan pulihnya.** Faucet, retry, "agent offline —
   pilih yang lain" — nggak ada dead end.
5. **`/account` itu hub, bukan modal.** Nggak ada "Connect MetaMask" sebagai pola utama.
6. **`/hire/[id]` cuma checkout.** Preview izin + tindakan pertama + grant. Kalau belum
   ada akun/dana, redirect ke `/account?next=/hire/[id]` — bukan popup.
7. **Desktop dulu (1280px), mobile harus bisa dibaca** — bukan target desain utama, tapi
   juga bukan boleh rusak.

---

## 4. Halaman per halaman — fitur & fungsi

### 4.1 `/` — Home

**Tujuan:** orang dingin (nol pengetahuan Agent Studio) paham dalam beberapa detik apa
produk ini dan terdorong masuk ke `/market`.

**Fitur/komponen:**

- Headline yang nyatain apa itu Am-M dan 4 pekerjaan (Rebalance/Grid/Yield/Guard) dalam
  bahasa manusia, bukan istilah protokol.
- Satu CTA utama (Marigold): masuk ke `/market`.
- Boleh ada "job index" ringkas (4 stamp/kartu desk) sebagai preview, tapi ini cuma
  pointer visual — bukan tabel data live, dan klik di situ boleh langsung ke
  `/desks/[slug]` terkait kalau user udah tau mau desk yang mana.
- Trust strip ringan (link ke explorer, ERC-8004, dst) — bukti kredibilitas, bukan
  fungsi interaktif.
- **Tidak ada CTA "Hire" di halaman ini** — itu levelnya ada di agent, bukan di Home.

**Data yang ditampilkan:** statis/marketing-level saja — nggak butuh live data.

**State:** nggak ada loading/error state signifikan, halaman ini nggak gantung API luar.

### 4.2 `/market` — Browse / discovery

**Tujuan:** user bisa liat semua agent yang hireable, lintas 4 desk, dan cepat nemuin
mana yang relevan sama kebutuhannya (entry point utama setelah Home).

**Fitur/komponen:**

- Filter chip per desk (Rebalance / Grid / Yield / Guard) — klik chip nge-filter list
  di halaman yang sama, bukan pindah halaman.
- Tabel/list inventory — target 8 baris (4 desk × 2 varian): desk mark, nama agent +
  tag varian, **satu** metrik live generik (representatif desk itu), harga $U, status
  dot, reputasi, tombol Hire (atau "Not listed" kalau belum hireable).
- Timestamp "as of {waktu}" di bawah tabel.
- Panel/strip 8004scan terpisah, ditandain jelas "belum bisa di-hire" — bukan
  disatuin sama listing yang hireable.
- Klik baris → masuk `/agents/[id]`.

**State:**

- Loading: skeleton per baris.
- Kosong (semua agent offline/belum diindeks): empty state jujur.
- Data basi: label "per {waktu}" eksplisit.

### 4.3 `/desks/[slug]` — Desk compare

**Tujuan:** user yang udah fokus ke satu pekerjaan bisa bandingin varian di desk itu
secara mendalam (J2 — Data Quality).

**Fitur/komponen:**

- Header desk: nama, deskripsi pekerjaan, protokol eksekusi + link.
- List agent **khusus desk ini** (2 varian: konservatif/agresif).
- **Sort wajib** berdasar metrik yang relevan ke desk itu (APR, headroom health factor,
  % in-range, win rate, harga $U, reputasi) — bukan nice-to-have.
- Filter varian.
- Kolom metrik live **penuh**, spesifik desk (lihat tabel §5).
- Klik baris → masuk `/agents/[id]`.

Reachable dari: chip filter di `/market` (bisa "lihat semua di desk ini →"), dari
`/agents/[id]` (breadcrumb balik ke desk-nya), atau langsung dari Home kalau user udah
tau desk yang dia mau.

**State:** sama kayak `/market` — skeleton loading per baris, label data basi, empty
state jujur kalau semua agent di desk itu lagi nggak hireable.

### 4.4 `/agents/[id]` — Profil agent

**Tujuan:** user berani hire karena tau persis apa yang agent ini bakal lakuin.

**Fitur/komponen:**

- Apa yang agent **eksekusi** (bahasa manusia, bukan cuma daftar fungsi kontrak).
- Allowlist — daftar fungsi kontrak yang session ini akan diizinkan panggil.
- Harga $U + SLA.
- Reputasi + feedback terbaru (dari 8004scan).
- Last tx / kesehatan endpoint.
- Rekam jejak (job selesai, dispute rate).
- Field live spesifik desk (§5).
- CTA **Hire** → kalau belum ada akun/dana, trigger redirect ke
  `/account?next=/hire/[id]` (bukan popup, bukan modal in-page).

**State:**

- Agent offline: CTA Hire disabled + pesan jelas + saran "pilih agent lain di desk ini".
- Data 8004scan gagal fetch: fallback ke cache last-good + banner.

### 4.5 `/account` — Hub akun

**Tujuan:** satu tempat buat semua hal yang berhubungan sama identitas dan dana user.
Pengganti "Connect Wallet" — halaman penuh, bukan modal kecil.

**Tiga state, satu route:**

| State                | Yang ditampilin                                                                                                                                       | CTA utama                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **Belum akun**       | Penjelasan singkat + satu CTA                                                                                                                         | "Buat akun" → `createPasskeyWallet` (Face ID) |
| **Akun, belum dana** | Alamat wallet, salin, QR code, link faucet, polling "menunggu dana masuk"                                                                             | Salin alamat / buka faucet                    |
| **Siap**             | Saldo, protokol yang udah di-approve, **agent aktif** (allowlist ringkas, sisa cap, expiry, tombol Revoke per agent), P&L (ditampilkan), tombol Tarik | Revoke / Tarik                                |

**Fitur penting:**

- Datang dari `?next=/hire/[id]` → begitu state yang dibutuhin selesai, otomatis balik
  ke halaman hire itu.
- Expiry session yang deket abis: penanda visual beda dari status normal.
- Recovery akun ada di sini juga, bukan form login terpisah.

**State:** polling dana gagal terus → kasih tau, jangan spinner selamanya. Revoke gagal
→ tampilin error, jangan pura-pura berhasil sebelum confirmed on-chain.

### 4.6 `/hire/[id]` — Checkout

**Tujuan:** satu-satunya fungsi adalah bikin user grant session + bayar $U dengan
paham persis apa yang mereka izinin. Bukan tempat buat akun atau danai.

**Fitur/komponen:**

- Preview izin: allowlist, spend cap, expiry — read-only.
- Preview tindakan pertama — WAJIB kelihatan sebelum tombol grant bisa ditekan.
- Harga $U.
- Status approve protokol (kalau pertama kali).
- Satu CTA utama: grant session + bayar, digabung jadi satu aksi user-facing.

**Gate wajib:** belum ada akun/dana cukup → redirect ke `/account?next=/hire/[id]`,
bukan nampilin form kosong.

**State:** grant gagal → pesan jelas + retry. Harga/status berubah saat user di
halaman ini → refresh state, jangan biarin bayar buat sesuatu yang udah nggak valid.

### 4.7 `/jobs/[jobId]` — Status job

**Fitur/komponen:**

- Status job: FUNDED → SUBMITTED (dst sesuai lifecycle 8183).
- Link deliverable + indikator verifikasi hash terhadap manifest on-chain.
- Tx hash dengan link explorer.

**State:** belum diindeks → "belum diindeks" + link balik ke `/account`. Job gagal →
tampilin jujur, bukan dipaksa "berhasil".

### 4.8 `/report` — Agent Advantage Report

**Fitur/komponen:**

- Minimal 3 task, berdampingan: Tanpa agent (DIY) vs Dengan agent (Am-M) — waktu,
  biaya/harga, artefak output.
- Tautan hash tx, jobId, URL deliverable per task.
- Minimal satu task wajib trading (grid).

**State:** task belum ada data → "belum diukur" per kolom, jangan kosongin baris atau
isi placeholder angka.

---

## 5. Field data live per desk (dipakai di `/desks/[slug]` dan `/agents/[id]`)

| Desk          | Field live wajib tampil                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Rebalance** | In-range vs out-of-range, tick sekarang vs range, estimasi fee 24 jam, umur rebalance terakhir, IL vs HODL (sederhana) |
| **Grid**      | Pair, batas grid, bid/ask terisi, PnL terealisasi (window), max drawdown, win rate                                     |
| **Yield**     | APR vToken Venus testnet (dieksekusi); APR Lista/Aave/PCS mainnet SEBAGAI KONTEKS berlabel jelas                       |
| **Guard**     | Health factor sekarang, harga likuidasi, buffer ke liq, hash aksi terakhir, estimasi waktu ke liq                      |

Field bersama tiap agent: nama/deskripsi/gambar, chain+tokenId+owner, reputasi+feedback,
harga $U+SLA, last-seen/kesehatan endpoint, job selesai+dispute rate, wallet+session
Keystore.

Refresh: ~15-60 detik di halaman agent yang lagi dibuka, ~60-120 detik di halaman list.
Selalu tampilin "per {waktu}".

---

## 6. User flow — versi FE-only

### J1 — Hire dingin (golden path)

```
/  (baca apa itu Am-M, klik CTA masuk market)
  → /market  (scan lintas desk, filter chip kalau mau)
    → /desks/[slug]  (opsional — kalau mau bandingin dalam satu desk lebih dalam)
      → /agents/[id]  (baca apa yang dieksekusi, allowlist, harga, reputasi)
        → klik Hire
          ├─ belum ada akun/dana → /account?next=/hire/[id]
          │     → buat akun (passkey) → danai wallet.address → otomatis balik
          └─ udah ada akun+dana → langsung ke /hire/[id]
                → approve protokol (kalau pertama kali)
                → review allowlist + tindakan pertama
                → grant session + bayar $U (satu aksi gabungan)
                  → /jobs/[jobId]  (status FUNDED→SUBMITTED, tx hash)
```

Kriteria sukses: orang tanpa pengetahuan Agent Studio bisa nyelesain ini tanpa keluar
dari situs.

### J2 — Bandingkan lalu hire

Terjadi di `/desks/[slug]`: user sort berdasar metrik yang penting buat pekerjaan itu
sebelum masuk ke agent manapun.

### J3 — Kill switch

```
/account (state Siap)
  → lihat daftar agent aktif → klik Revoke → konfirmasi (passkey)
  → status agent itu jadi revoked, cap-nya nggak bisa dipakai lagi
```

### J4 — Hire tanpa manusia (TermiX / agent lain)

Jalur yang sama persis kayak J1 (`/market` atau `/desks/[slug]` → `/agents/[id]` →
`/hire/[id]`), harus cukup terdokumentasi/predictable dari luar supaya agent pembeli
bisa nyelesain job tanpa walkthrough.

---

## 7. Yang FE TIDAK perlu urus

- Signing/eksekusi di sisi agent (`ALTANA_SESSION`, tick loop) — sepenuhnya di
  `agents/*`, FE cuma baca hasilnya lewat indexer.
- Index-ing langsung ke RPC dari browser — semua data live dari API `apps/indexer`
  (Ponder), bukan FE manggil RPC sendiri.
- Auto-settle job — keputusan buyer, bukan otomatisasi FE.
- Custody/vault custom — nggak ada di scope produk.
