# Am-M — Product Requirements Document

**Nama kerja:** Am-M (Agent Marketplace)
**Nama publik (usulan):** Am-M
**Tagline:** Hire agent DeFi. Kunci tetap di kamu. Biarkan dia kerja di market.
**Hackathon:** [The Smart Money Era: Build the Era](https://www.bnbchain.org/en/hackathons/smart-money-era?tab=overview) (5 Agu – 9 Sep 2026)
**Status:** Draf untuk build
**Terakhir diubah:** 29 Agu 2026

Ini sumber kebenaran untuk apa yang kita ship. Aturan hackathon ada di [`Hackathon.md`](./Hackathon.md). Dokumen ini menerjemahkan aturan itu jadi produk yang benar-benar bisa menang.

---

## 1. Kenapa produk ini ada

BNB Chain sudah punya stack agent-nya:

| Lapisan | Standar / produk | Tugas |
| --- | --- | --- |
| Identitas | ERC-8004 + [8004scan](https://8004scan.io) | Siapa agent-nya, reputasi, feedback |
| Commerce | ERC-8183 + escrow $U | Hire, fund, deliver, settle / dispute |
| Pembayaran | x402 / B402 | Bayar per call |
| Runtime | [BNB Agent Studio](https://www.bnbchain.org/en/bnb-agent-studio) (`bag` CLI) | Scaffold, deploy, earn |
| Otoritas | [Altana](https://docs.altana.network) Keystore + session | Agent bertransaksi di dalam limit yang user set |

Yang **belum ada** adalah pintu depannya: tempat user biasa land, pilih pekerjaan, paham agent-nya, lalu hire dalam beberapa klik. 8004scan adalah explorer untuk 200k+ identitas. TermiX adalah agent yang hire agent. Keduanya bukan meja hire kanonikal untuk pekerjaan DeFi di BSC.

Hadiah main track bukan piala. Pemenang **diadopsi resmi sebagai marketplace BNB Agent Studio**. Juri bilang gamblang: ini bukan demo day. Apa yang kita ship di sini adalah yang user sungguhan sentuh berikutnya.

---

## 2. Strategi (cara kita menang)

**Satu produk, empat tembakan hadiah.** Jangan pecah jadi empat demo. Marketplace *itulah* submission untuk setiap track.

| Track | Hadiah | Yang benar-benar mereka nilai |
| --- | --- | --- |
| **Main** | $30k + adopsi resmi | Journey hire ujung ke ujung, data yang bikin orang berani hire, keempat kategori sama dalamnya |
| **Altana** | 50.000 XP | Tx onchain live di explorer Altana. Agent di wallet Altana. Session dengan allowlist + spend cap + expiry, terdaftar di Keystore. User bisa lihat dan revoke. Bonus: `hireErc8183Agent` + jual x402 |
| **TermiX** | $6k / $3k / $1k | Mereka hire sendiri dari marketplace kita. Agent harus mengalahkan DIY, dibuktikan di Agent Advantage Report |
| **PancakeSwap** | 1.000 CAKE | Manfaat nyata untuk trader atau LP PCS — bukan banner |

### Tesis kompetitif

Jangan **membangun direktori agent lagi**. Direktori 200k NFT ERC-8004 kalah di Data Quality dan Functionality.

Bangun **job desk** dengan empat meja first-class. Agent adalah pekerjanya di balik sebuah pekerjaan, diurutkan dengan data protokol live supaya user bisa hire tanpa baca docs.

### Yang kemungkinan diuji Phase 2 (masih disembunyikan panitia)

Asumsi: URL produksi, keandalan mainnet atau mendekati mainnet, state kosong/error, tidak ada jalan buntu, orang tanpa pengetahuan Agent Studio bisa menyelesaikan hire, dan “apakah kita benar-benar mau taruh ini di bnbchain.org”. Bangun untuk adopsi, bukan untuk walkthrough juri.

### Batasan keras dari brief

- Submission harus **berfungsi dan bisa diakses publik** selama penilaian.
- Agent di marketplace harus **live di BSC**.
- Submission satu kategori nilainya jelek. **Keempat kategori, kedalaman sama.**
- Laporan TermiX harus direncanakan **dari hari pertama** (3 task nyata, dua arah, minimal satu trading/saham/security).
- Hadiah Altana mensyaratkan **tx live terlihat di explorer mereka** dan alamat wallet di submission.

### Keputusan produk (29 Agu): agent harus eksekusi, bukan laporan

**Activate = grant session + bayar 8183 + agent buka/kelola posisi on-chain.** Bukan alert. Bukan “klik sendiri di MetaMask.”

Dana user hidup di smart account Altana (passkey). Agent buka posisi **baru** di situ. Tidak ada “pindah LP dari MetaMask.” MetaMask opsional hanya sebagai keran transfer ke `wallet.address`.

Guard **tidak** boleh alert-only sebagai produk utama. Kalau HF pecah, agent repay/supply di dalam cap, atau job gagal jujur (tidak ada yang dieksekusi karena cap/izin) — bukan “kami sudah email.”

### Keputusan terkunci dari referensi (29 Agu, malam)

Acuan: [`referensiprd.md`](./referensiprd.md) v0.8 dan [`referensitechspec.md`](./referensitechspec.md) v0.6 (hasil `bag` 0.0.12 + probe chain 24 Agu). Itu **bahan**, bukan dokumen yang ditimpa buta. Di bawah ini yang masuk Am-M, yang ditolak, dan yang digabung.

#### Ambil (tulis sebagai kebenaran produk)

1. **Empat kunci, jangan tertukar**

   | Komponen | Pemegang | Fungsi |
   | --- | --- | --- |
   | Wallet Altana **user** | User, **passkey** (Face ID) | Satu-satunya rekening kerja user. Modal + posisi DeFi. Bukan MetaMask. |
   | Session **user→agent** | Proses agent (VPS), terenkripsi di DB | Izin sempit atas wallet user. Satu per pasangan user–agent. |
   | Wallet Altana **agent** | Tim, keystore admin di mesin dev | ERC-8004, terima $U, gas. Tidak pernah pegang dana user. |
   | Session **agent** | Runtime (`ALTANA_SESSION`) | Yang di server. Bukan keystore admin. |

2. **FE tanpa extension.** Passkey = akun. Tidak ada Connect Wallet. MetaMask paling banter tombol opsional “kirim ke alamat ini” di langkah danai. Hapus pertanyaan terbuka “EOA sign createWallet”.

3. **Satu wallet user, banyak session.** Hire kedua = grant session baru, bukan passkey + fund lagi. Isolasi dana lewat cap/allowlist per session, bukan sekat wallet (wallet kedua boleh, bukan default).

4. **Posisi baru di dalam Altana, bukan pindah LP lama dari EOA.** Agent tidak bisa jadi owner NFT LP milik MetaMask. UI jujur: “kami buka posisi di rekening kerja kamu.” User yang sudah punya posisi Venus/PCS di EOA tidak dilindungi otomatis.

5. **User approve protokol lewat jalur admin sekali; agent yang buka posisi lewat session.** Tx pertama session = bukti Altana track. Layar hire wajib preview: pool, range, jumlah. `approve`/`transfer` **tidak** masuk allowlist.

6. **Allowlist function-level.** Rebalance: `mint`/`burn`/`increaseLiquidity`/`decreaseLiquidity`/`collect` di PCS V3 NFPM. Grid: swap di router (PCS **tidak** punya limit order on-chain). Yield/Guard: `mint`/`redeem`/`repayBorrow` di vToken Venus. Klaim produk: kerugian maksimal **bisa dihitung** (cap + expiry + allowlist), bukan “agent tidak bisa mencuri” — Altana tidak mengikat argumen (`to` di swap/collect). Dashboard verifikasi penerima.

7. **Varian, bukan 1 agent per desk.** Main track minta *informed call which to hire*; TermiX minta *compare*. Minimal 2 profil per kategori (konservatif vs agresif) dari 4 basis kode = 8 agent hireable. 8004scan boleh, **strip terpisah, tidak hireable** — kartu mati = dead end.

8. **Host agent di VPS, bukan AgentCore.** Scale-to-zero + OAuth Cognito mematikan loop jaga dan hire publik (TermiX/juri). `bag deploy` bukan syarat track. ERC-8004: `bag erc8004 register --endpoint <url publik>`. Loop tick di `unifiedMain.ts` (scaffold tidak punya scheduler). Nama `bag init` tanpa `-`/`_` (jadi `healthfactor`, bukan `health-factor`).

9. **Data tiga lapis, jujur — FE vs otak agent jangan dicampur.**

   | Lapis | Chain | Dipakai siapa | Label UI |
   | --- | --- | --- | --- |
   | Konteks pasar (APR Venus, TVL/volume/fee pool PCS) | **BSC mainnet (56)** | **FE katalog saja** — bantu keputusan hire | Live |
   | Posisi user, tick, HF, trigger, tx | **BSC testnet (97)** | **Agent** (baca + eksekusi) | Live (testnet) |
   | Rekam jejak N rebalance / win rate kita | Testnet | FE + TermiX | Live (testnet) |
   | Backtest historis | Data mainnet | FE | **Simulasi** |

   Agent **tidak** mengikuti harga/APR mainnet lalu `execute` di testnet. Trigger selalu state testnet. Mainnet di kartu = konteks, bukan input strategi. Agent harus nyala sebelum FE siap (rekam jejak tidak bisa dikejar di akhir).

10. **Yield v1 = satu protokol eksekusi: Venus.** Di testnet ticker `USDT` dipakai dua kontrak (Venus `0xA11c8D9D…` ≠ mock PCS `0x337610d2…`). Tidak ada jembatan. Agent yield **tidak** boleh janji “pindah Venus → PCS/Lista/Aave”. Kerjaan: `mint`/`redeem` antar vUSDT, vUSDC, vBNB menurut APR **testnet** Venus. Dua varian (ambang selisih APR konservatif vs agresif) tetap ada. APR Lista/Aave/PCS **mainnet** boleh di kartu sebagai konteks, dengan copy: “rute yang di-hire di testnet: Venus.” Rebalance/grid memakai pool WBNB/USDT(**Venus**) fee 100, bukan mock PCS; seed jika 0.29 WBNB terlalu tipis. Alamat lengkap: tech spec §1.1.

11. **Halaman `/account` (label UI: Akun) — satu hub, bukan modal di Hire.** Signup, danai, saldo, agent aktif, revoke, tarik hidup di sini. Altana tidak punya login hosted; Face ID di halaman ini = `createPasskeyWallet`.

   **Jelajah tetap bebas** (home + desk + detail). Header: **Akun**. Klik Hire tanpa akun → `/account?next=/hire/[id]` (bukan popup).

   Isi `/account`:

   | State | Yang ditampilkan |
   | --- | --- |
   | Belum akun | Satu CTA “Buat akun” → Face ID → alamat muncul |
   | Akun, belum dana | Alamat, salin, QR, faucet, polling “dana masuk” |
   | Siap | Saldo, protokol sudah di-approve, agent aktif (cap, expiry, revoke), P&L, tarik |

   Prompt biometrik tetap 3 di hire pertama (buat akun, approve, grant), tapi **buat akun + danai + tarik** tidak diselipkan di form hire. Hire page hanya: preview izin + grant + bayar $U. Hire berikutnya: 1 prompt. Kembali: `recoverFromPasskey` di `/account`, tanpa form login.

   Jangan namakan halaman “Wallet” / “Smart account” di nav. “Akun” saja.

12. **Dua fee, hanya $U yang dipungut.**

   | | **$U (ERC-8183)** | **Fee kinerja** |
   | --- | --- | --- |
   | Apa | Bayar jasa hire ke wallet agent | % profit posisi DeFi user (mis. 10%) |
   | Hackathon | **Pungut** (escrow, testnet faucet $U) | **Jangan pungut** — angka di dashboard saja |
   | Rumus tampilan | harga list + job id | `max(nilai_sekarang − setoran − gas, 0) × bps` |
   | Saat tarik | tidak relevan | User dapat **seluruh** posisi; tidak ada `transfer` ke kita |

   “Fee kinerja terakumulasi” = spreadsheet live (setoran, nilai berjalan, gas, fee *seolah* dibayar) supaya APY bersih bisa ditampilkan. Bukan potongan on-chain. Jangan taruh `transfer` di allowlist session. Pungut lewat admin saat tarik = bonus, bukan v1.

13. **Indexer: [Ponder](https://ponder.sh).** `apps/indexer` menunjuk BSC testnet (eksekusi, Keystore, job 8183, P&L per session) plus read-only mainnet untuk lapis konteks pasar. Type-safe EVM indexing, API dikonsumsi `apps/web`. Bukan route handler Next sebagai indexer utama. Deploy indexer + Postgres di VPS (Docker Compose); FE di Vercel.

#### Tolak / jangan copy mentah

- **Hire = session saja, ERC-8183 cuma bonus.** Untuk Am-M, session = **otoritas atas dana**. ERC-8183 tetap **in-scope** sebagai bayar jasa ($U) — scaffold sudah hidup, TermiX butuh hire yang kelihatan sebagai pekerjaan berbayar, bonus Altana menyebut `hireErc8183Agent`. Bukan “session tanpa pembayaran” dan bukan “8183 tanpa session.”
- **Buku demo dihapus.** Referensi tidak memakainya karena passkey + fund + agent buka posisi sudah membuat TermiX/juri bisa activate tanpa “pindah LP dari MetaMask.” Buku demo hanya cadangan jika spike passkey gagal di device juri.
- **Python dua lapis / `app/service` / port 8080.** Usang vs CLI 0.0.12. Jangan pakai docs.bnbchain.org deployment lama.
- **Pieverse gratis + Altana.** Tidak kompatibel (SIWE). LLM = [9router](https://github.com/decolua/9router) (endpoint OpenAI-compatible milik kita); usulan LLM dijepit kode varian, LLM tidak pernah `execute`.
- **Vault custom / fee on-chain wajib.** Out of scope; merusak non-custodial.
- **Satu proses Node untuk 4 kategori.** Empat proses, `AGENT_PORT` beda; scaffold selalu coba bind 9000/8088 (peringatan di agent 2–4 wajar).

#### Gabungan yang kita pakai (Activate)

```
Jelajah katalog (tanpa akun)
  → pilih varian
  → buat akun passkey
  → danai wallet.address
  → approve protokol (admin, execute pertama / Keystore)
  → review scope + tindakan pertama
  → grantSession (otoritas) + hire ERC-8183 (bayar $U)   ← keduanya
  → tick 1: agent buka posisi lewat session (tx Altana explorer)
  → loop tick sampai expiry / revoke
  → dashboard + revoke + tarik (admin)
```

Activate = session hidup **dan** tx strategi keluar, bukan PDF, bukan popup MetaMask.

---

## 3. Visi produk

Am-M adalah tempat yang kamu tuju saat punya modal nganggur atau risiko DeFi terbuka, dan kamu ingin agent menjalankan pekerjaan spesifik 24/7, tanpa menyerahkan kunci.

Empat pekerjaan, bobot produk sama:

| Desk | Pekerjaan user | Kerja agent |
| --- | --- | --- |
| **Rebalance** | LP-ku di luar range / aku tidak mau jaga tick | Kelola range LP PancakeSwap, reset posisi |
| **Grid** | Aku mau beli dip, jual rip di sebuah pair tanpa duduk di layar | Pasang dan kelola order grid otomatis |
| **Yield** | Token nganggur harus dapat APR terbaik yang tersedia | Di testnet: pindah antar vToken **Venus**. Kartu boleh tampilkan APR protokol lain (mainnet, konteks) |
| **Guard** | Jangan sampai dilikuidasi waktu aku tidur | Kalau HF pecah: repay/supply di dalam cap — tx, bukan notifikasi |

User tidak perlu tahu ERC-8004, ERC-8183, atau Agent Studio. Mereka pilih desk, bandingkan agent, set budget dan batas waktu, hire, lalu pantau job dan matikan session dalam satu klik.

---

## 4. Pengguna

### Primer — user DeFi (manusia)

Punya wallet, beberapa posisi di BNB Chain (LP, lending, stable nganggur), pengetahuan Agent Studio sedikit atau nol. Sukses = hire agent dan paham apa yang boleh dia lakukan.

### Sekunder — pembeli agent (TermiX / agent lain)

Hire lewat flow publik yang sama atau path A2A/ERC-8183 yang terdokumentasi. Juri TermiX akan melakukan ini sendiri. Sukses = tidak butuh buku petunjuk.

### Tersier — penjual agent (kita dulu, orang lain kemudian)

First-party: kita ship empat seller agent yang live supaya marketplace tidak kosong. Nanti: agent ERC-8004 mana pun di BSC yang menyatakan salah satu dari empat kategori bisa terdaftar. Di luar scope UI listing v1 selain keempat agent kita, tapi model data tidak boleh di-hard-code hanya untuk agent kita.

---

## 5. Metrik sukses (dipetakan ke penilaian)

Kita tidak mengarang KPI vanity. Kita instrument apa yang juri nilai.

### Main track

| Kriteria | Batas produk |
| --- | --- |
| **Functionality** | User dingin: land → pilih desk → buka agent → paham → **activate** (hire yang keluar tx, bukan laporan) → lihat job + hash. Nol jalan buntu. Copy tidak pernah bilang “lihat docs”. |
| **Data Quality** | Setiap kartu agent menampilkan lebih dari nama/jumlah. Cukup angka live untuk memilih A daripada B. Data basi dilabeli. Data hilang = empty state eksplisit, bukan nol palsu. |
| **Agent Diversity** | 4 desk × ≥2 varian, kedalaman IA sama, bisa dibanding. 8004scan tidak boleh jadi tombol hire mati. |

### Altana

Kualifikasi (semua harus benar, atau kita peserta bukan pemenang):

1. Setiap seller agent first-party punya **wallet Altana sendiri**.
2. Buyer grant **session** dengan call allowlist, spend cap, expiry.
3. Session **terdaftar di Keystore** (default `grantSession`, bukan `register: false`).
4. Minimal satu **tx onchain nyata lewat session key itu**, terlihat di explorer Altana (testnet dihitung, mainnet lebih kuat).
5. **Panel session** di dalam produk: permission, sisa cap, expiry, **Revoke**.

Bonus (kerjakan ini): hire seller dengan `hireErc8183Agent`; minimal satu face seller di x402/B402 jika jenis wallet mengizinkan. Catatan: Agent Studio **menolak jual B402 berbayar di wallet Altana**. Seller first-party memakai ERC-8183 sebagai rel berbayar. Passthrough x402 GRATIS opsional boleh; B402 berbayar adalah keputusan jenis wallet nanti, bukan blocker v1.

### TermiX

| Bobot | Batas |
| --- | --- |
| 30% nilai layanan | Agent mengembalikan kerja nyata dengan harga/kecepatan yang mengalahkan DIY |
| 30% keunggulan terbukti | Agent Advantage Report (lihat §12) |
| 20% kategori high-stakes + rekam jejak | Grid + rebalance membawa win rate, window, dan risiko yang diambil |
| 20% kualitas marketplace | Sama dengan Functionality main track |

### PancakeSwap

Minimal dua desk PCS (**Rebalance** + **Grid**) memberi manfaat terukur (in-range / fee / fill). Yield testnet tidak di-route ke PCS.

---

## 6. Scope

### Masuk — v1 (ship hackathon)

1. Marketplace publik di URL yang stabil (web app).
2. Empat desk × **minimal 2 varian** (konservatif/agresif), semua **live** di BSC testnet.
3. Discovery first-party + strip 8004scan **terpisah dan tidak hireable**.
4. Activate: passkey → danai → approve admin → `grantSession` + `hireErc8183Agent` → agent buka posisi lewat session → tick → dashboard / revoke / tarik.
5. UI kontrol session (lihat, sisa budget, revoke).
6. Artefak Agent Advantage Report dari run nyata (bukan angka karangan).
8. Indexer Ponder + Postgres (testnet eksekusi/P&L/Keystore; mainnet konteks FE).

### Keluar — v1

- Membangun explorer ERC-8004 umum (8004scan sudah itu).
- Wallet kustodian, treasury bersama, atau “kami yang sign untuk kamu”.
- Peluncuran token, poin, leaderboard sebagai produk.
- UI multi-chain (BSC saja).
- Portal onboarding seller / KYC.
- B402 berbayar di wallet seller Altana (batasan protokol).
- Aplikasi native mobile.
- Auto-settle job ERC-8183 (Studio / SDK menyerahkan approve-reject-dispute ke buyer).
- Pungut fee kinerja (tampilkan saja). Vault custom.
- Mengelola posisi DeFi yang sudah ada di EOA user (posisi dibuka baru di wallet Altana).

### Nanti (hanya jika v1 sudah kokoh)

- Listing seller pihak ketiga dari semantic search 8004scan, difilter ke empat desk.
- Hire agent-ke-agent (gaya TermiX) sebagai tipe buyer first-class.
- Chart PnL historis di luar strip rekam jejak v1.

---

## 7. Journey pengguna

### J1 — Hire dingin (golden path Functionality)

1. Land di `/`. Headline menyatakan empat pekerjaan. Tidak ada jargon protokol di layar pertama.
2. Klik sebuah desk (mis. Rebalance). Lihat daftar agent **hanya untuk desk itu**, masing-masing dengan metrik live desk-nya (bukan kartu generik).
3. Buka agent. Baca: apa yang dia **eksekusi**, allowlist, harga $U, reputasi, last tx, rekam jejak.
4. Activate. Belum punya akun → `/account?next=/hire/[id]` (Buat akun = Face ID di **halaman Akun**, bukan redirect ke altana.network).
   - Di `/account`: danai `wallet.address` (faucet/QR). MetaMask opsional hanya transfer masuk.
   - Kembali ke hire: approve protokol (admin) → review allowlist + tindakan pertama → `grantSession` → bayar `hireErc8183Agent`.
5. Tick pertama: agent buka posisi lewat session (tx di explorer Altana). Loop sampai expiry/revoke.
6. Dashboard: hash, P&L, sisa cap, status Keystore. Job 8183: FUNDED → SUBMITTED bila rel bayar dipakai.
7. Kapan saja: Revoke session (passkey) atau tarik dana (jalur admin).

Orang tanpa pengetahuan Agent Studio harus menyelesaikan J1 tanpa README.

### J2 — Bandingkan lalu hire (Data Quality)

Di daftar desk, user sort/filter menurut metrik yang penting untuk pekerjaan itu (APR, headroom health factor, % in-range, win rate grid, harga, reputasi). Dua agent berdampingan nice-to-have; kolom yang bisa di-sort wajib.

### J3 — Kill switch (Altana)

User buka **/account** (bagian agent aktif), lihat allowlist + cap + expiry, klik Revoke.

### J4 — Hire TermiX (tanpa chrome manusia)

Endpoint hire yang sama dengan J1, terdokumentasi cukup agar TermiX bisa menyelesaikan job dari situs publik. Deliverable bisa di-fetch (`getErc8183DeliverableUrl`) dan diverifikasi terhadap hash onchain.

---

## 8. Arsitektur informasi

```
/                       Home — empat desk, jelajah tanpa akun
/desks/*                List + filter + metrik live
/agents/[id]            Profil; CTA Hire
/account                Hub: buat akun, danai, saldo, agent aktif, revoke, tarik
/hire/[id]              Hanya preview izin + grant + bayar $U
                        (belum akun/dana → redirect /account?next=)
/jobs/[jobId]           Status job 8183 + deliverable
/report                 Agent Advantage Report (TermiX)
```

`/sessions` tidak dipakai; isinya tab/bagian di `/account`.

Aturan copy:

- Bahasa layar pertama: pekerjaan, bukan standar. Signup: “Buat akun” = passkey di app ini.
- Nama protokol (ERC-8004, 8183, Keystore) muncul di halaman agent/session sebagai **bukti**, dengan tautan explorer, bukan sebagai prasyarat.
- Setiap CTA yang bisa gagal punya pemulihan (faucet, retry, “agent offline — pilih yang lain”).

---

## 9. Kualitas data (lebih dari hitungan)

8004scan perlu dan **tidak cukup**. Dia memberi identitas dan reputasi. Dia tidak memberitahu apakah kamu harus hire rebalancer jam ini.

### Field bersama (setiap agent)

| Field | Sumber | Kenapa |
| --- | --- | --- |
| Nama, deskripsi, gambar, services (A2A/MCP) | Registrasi ERC-8004 / 8004scan | Identitas |
| Chain, tokenId, owner | 8004scan `GET /agents/{chainId}/{tokenId}` | Bisa diverifikasi |
| Reputasi + feedback terbaru | Feedback 8004scan | Trust |
| Harga list ($U) + SLA | Kartu agent / config seller | Keputusan hire |
| Terakhir terlihat / kesehatan endpoint | Probe A2A/MCP atau tx onchain terakhir | Hindari agent mati |
| Job selesai, dispute rate | Riwayat job ERC-8183 yang kita index | Rekam jejak |
| Wallet + session Keystore (jika Altana) | Explorer Altana + baca Keystore | Otoritas |

Pakai tier Pro hackathon: buat API key 8004scan, daftar lewat [Pro-Tier Upgrade Form](https://www.bnbchain.org/en/hackathons/smart-money-era?tab=resources). Key tetap di server. Browser tidak pernah memegang key 8004scan.

### Field live per desk (ini kemenangan Data Quality)

| Desk | Angka live yang dilihat user | Chain / protokol |
| --- | --- | --- |
| **Rebalance** | In-range vs out-of-range, tick sekarang vs range, estimasi fee 24 jam, umur rebalance terakhir, IL vs HODL (sederhana) | PancakeSwap v3 (v2 hanya jika data v3 terblokir — brief-nya v3: “LP ranges”) |
| **Grid** | Pair, batas grid, bid/ask yang terisi, PnL terealisasi di window, max drawdown, win rate | Spot PancakeSwap / fill bergaya limit yang kita eksekusi |
| **Yield** | APR vToken Venus testnet (eksekusi); APR Lista/Aave/PCS **mainnet** di kartu sebagai konteks berlabel | Venus only (eksekusi). Jangan campur USDT mock PCS |
| **Guard** | Health factor sekarang, harga likuidasi, buffer ke liq, hash aksi terakhir, estimasi waktu ke liq | Venus Comptroller + vToken |

Refresh: poll sekitar 15–60 dtk untuk halaman agent yang terbuka; halaman list 60–120 dtk. Tampilkan “per {waktu}”. Jangan mengarang angka hijau.

### Indexer — [Ponder](https://ponder.sh)

Satu app `apps/indexer` (Ponder + Postgres). `apps/web` hanya konsumsi API-nya, bukan mengindex sendiri.

Ponder testnet (97):

1. Keystore: `getKeys` + `isValidKey` per session (status, sisa waktu, cap).
2. Riwayat `execute` per session + verifikasi penerima (semua `to` == wallet user).
3. Snapshot posisi / P&L / fee kinerja **tertampil** (tidak dipungut).
4. Job ERC-8183 (jobId, status, deliverable URI).

Ponder/read mainnet (56), read-only:

5. APR Venus, TVL/volume/fee pool PCS, volatilitas pair — lapis konteks FE.

Juga sinkron 8004scan berkala (server-side API key). Jangan scrape UI Altana. Jangan dump 200k agent. Seed 8 agent hireable kita; strip 8004scan terpisah, tidak hireable.

---

## 10. Empat agent first-party (kedalaman sama)

Scaffold dengan BNB Agent Studio (`bag`). Masing-masing adalah **seller**: identitas ERC-8004, ERC-8183 `negotiate` / `notify_funded`, wallet Altana, live di BSC.

**Invariant:** signing adalah kode handler tetap, bukan tool LLM. LLM boleh baca state chain dan mengusulkan; eksekusi lewat kebijakan session Altana.

Setiap agent mendapat **permukaan produk yang sama**: kartu, metrik detail, template task hire, skema deliverable, monitor setelah hire. Internal berbeda, kedalaman sama.

### 10.1 Rebalance — `rebalancing`

- **Menjual:** “Jaga posisi PCS ini in-range di bawah cap C sampai waktu T.”
- **Skills:** PancakeSwap Liquidity (perluas ke **range v3** jika skill publik hanya v2 — brief mensyaratkan reset range, bukan cuma add/remove v2).
- **Deliverable:** hash tx, range lama → range baru, fee terkumpul, waktu in-range.
- **Bounty PancakeSwap:** manajemen likuiditas yang lebih pintar.
- **Allowlist session:** PCS v3 NPM, pool, router, $U, WBNB. Spend cap = max add-liquidity user + fee.

### 10.2 Grid — `gridtrading`

- **Menjual:** “Jalankan grid di PAIR antara LO dan HI, N level, sampai T atau cap C.”
- **Skills:** PancakeSwap Trading + Token Radar (kewarasan pair).
- **Deliverable:** fill, inventory, PnL terealisasi, win rate, drawdown, window.
- **TermiX:** ini task **trading** yang wajib.
- **Strip rekam jejak:** win rate, window, risiko yang diambil (max drawdown / notional). Wajib untuk 20% TermiX.

### 10.3 Yield — `yieldrouter`

- **Menjual:** “Parkir A di Venus; pindah vToken jika APR testnet selisih di atas ambang varian.”
- **Eksekusi:** Venus saja (`mint` / `redeem` / `redeemUnderlying` pada vUSDT, vUSDC, vBNB).
- **FE:** APR Lista/Aave/PCS mainnet boleh, label konteks. Bukan tombol rute yang tidak bisa di-tx.
- **Deliverable / dashboard:** vToken awal → vToken akhir, hash, APR tes vs terealisasi.
- **Blocker yang diterima:** USDT Venus ≠ USDT mock PCS; tidak ada yield lintas protokol di testnet.

### 10.4 Guard — `healthfactor`

- **Menjual:** “Kalau HF Venus < ambang, repay/supply di dalam cap C sampai T.”
- **Eksekusi:** Venus Comptroller + vToken. Aave bukan v1 testnet.
- **Deliverable:** timeline HF, **hash tx penyelamatan** (atau revert/cap habis yang jujur), HF baru.
- **Bukan produk:** hire yang cuma alert/laporan.
- **Session:** `repayBorrow` / `mint` saja; spend cap membatasi ukuran penyelamatan.

### Config seller (keempatnya)

- Network: `bsc-testnet` dulu, `bsc-mainnet` jika ada waktu dan wallet terdanai.
- Wallet: `altana` (wajib untuk track Altana).
- Rel: ERC-8183 berbayar. x402 GRATIS opsional.
- Face: A2A + X402 (default Studio). MCP opsional.
- Deploy: **VPS** (pm2/systemd + reverse proxy HTTPS), bukan AgentCore (tidur + OAuth). Daftar ERC-8004 ke URL publik. Jangan andalkan trial `bag deploy --provider bnb` (48 jam).
- Deliverable 8183: URL publik (disk VPS cukup untuk v1; IPFS hanya jika 8183 fetch butuh objek tahan-deploy).

### Template task hire (supaya J1 bukan prompt kosong)

Setiap desk: 2 varian (konservatif/agresif) dengan field form (jumlah, pair, ambang HF). Preview tindakan pertama wajib sebelum grant. Default = buka posisi di wallet **user**. Cadangan buku demo (wallet agent) hanya jika spike passkey gagal. Deliverable/dashboard wajib hash tx.

---

## 11. Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│  apps/web  (Next.js / Vercel)                           │
│  Passkey Altana · desks · hire · dashboard              │
└────────────┬────────────────────────────┬───────────────┘
             │ HTTPS                      │
             ▼                            ▼
┌────────────────────────┐    ┌───────────────────────────┐
│  apps/indexer (Ponder) │    │  Altana SDK (browser)     │
│  Postgres di VPS       │    │  createPasskeyWallet      │
│  testnet 97: Keystore, │    │  grantSession / revoke    │
│    eksekusi, P&L, 8183 │    │  hireErc8183Agent         │
│  mainnet 56: APR/TVL   │    └───────────────────────────┘
│    (read-only, FE)     │
│  8004scan proxy        │
└────────────┬───────────┘
             ▼
   BSC + Keystore + Venus + PCS V3 + $U

┌─────────────────────────────────────────────────────────┐
│  agents/*  (VPS, 4 proses)                              │
│  Tick + A2A · session user dari DB · ALTANA_SESSION     │
└─────────────────────────────────────────────────────────┘
```

### Tata letak repo (target)

```
apps/web                 UI marketplace (Next.js)
apps/indexer             Ponder + schema Keystore / eksekusi / P&L / pasar
packages/ui              UI bersama
agents/rebalancing       bag (nama tanpa tanda hubung)
agents/gridtrading
agents/yieldrouter
agents/healthfactor
docs/PRD.md              source of truth produk
docs/Hackathon.md
docs/referensiprd.md     bahan
docs/referensitechspec.md
docs/agent-advantage.md  laporan TermiX (diisi selama build)
```

`apps/web` sudah ada sebagai starter Turbo. Ganti home starter; jangan mulai app kedua.

### Aturan wallet / kunci

- User adalah admin. Agent tidak pernah melihat admin key.
- Session **user→agent** (bukan admin passkey) dikirim HTTPS ke VPS, disimpan terenkripsi, didekripsi hanya di memori tick. Itu model Altana (“hand session to the agent”), bukan custody admin key.
- `ALTANA_SESSION` = session wallet **agent**. Jangan tertukar dengan session user.
- API key 8004scan dan URL RPC hanya env server.

### Implementasi hire

Pakai helper buyer atomik Altana, bukan escrow lima langkah buatan sendiri:

```ts
const { jobId } = await hireErc8183Agent(session, {
  provider: sellerAddress,
  task: templatedTaskString,
  budget: parseUnits(budgetUi, 18),
}, { network: bscNetwork });
```

Lalu poll `getErc8183Job` dan `getErc8183DeliverableUrl`. Verifikasi keccak256 manifest terhadap `job.deliverable` sebelum merender konten.

---

## 12. Agent Advantage Report (TermiX, hari pertama)

Wajib untuk kelayakan. Bobot skor 30%. Rencanakan run di minggu 1, bukan malam sebelum submit.

### Format

Terbitkan di `/report` dan lampirkan markdown yang sama di submission.

Untuk **setiap** dari ≥3 task:

| Kolom | Isi |
| --- | --- |
| Task | Konkret, bisa diulang |
| Tanpa agent | Manusia DIY: langkah, waktu, biaya (gas + waktu), artefak output |
| Dengan agent | Di-hire di Am-M: waktu, $U dibayar, gas, artefak output |
| Kualitas | Berdampingan, dinilai dari kebenaran bukan prosa |
| Tautan | Hash tx, jobId, URL deliverable |

Minimal satu task adalah **trading** (grid). Set usulan:

1. **Trading:** Grid di pair PCS yang likuid untuk window tetap. Bandingkan dengan 3–5 swap manual. Laporkan win rate, window, drawdown.
2. **Yield:** Pindah vToken Venus (APR tes). Bandingkan dengan manusia di UI Venus. Jangan klaim Lista/Aave/PCS di sisi DIY vs agent kecuali keduanya Venus.
3. **Guard atau Rebalance:** Entah (a) hitung HF dan rekomendasi repay vs melakukan itu di UI Venus, atau (b) deteksi LP out-of-range dan reset vs PCS v3 manual.

Jangan palsukan sisi DIY. Rekam layar atau riwayat tx. Lampirkan output sungguhan.

---

## 13. UX / standar visual

Produk ini bersaing untuk jadi pintu resmi. Kualitas visual adalah bagian Functionality (gesekan, trust) dan kelayakan adopsi Phase 2.

- Satu sistem: tipografi, warna, identitas desk (empat desk harus terasa seperti satu produk dengan empat ruangan, bukan empat landing page).
- Data padat, bukan crypto-hero kosong. Tabel dan tick mengalahkan lottie.
- Tautan explorer di setiap fakta onchain (BscScan, 8004scan, explorer Altana).
- Desktop dulu (juri akan review di desktop). Usable di 1280px. Mobile bisa dibaca, bukan target desain.
- State akun: belum passkey, wallet counterfactual (belum execute), menunggu dana, session kedaluwarsa, agent tidak sehat. Bukan “connect MetaMask.”

---

## 14. Kebutuhan non-fungsional

| Area | Batas |
| --- | --- |
| URL publik | HTTPS, hidup sepanjang jendela penilaian |
| **Chain** | Eksekusi + hire: BSC **testnet 97**. Konteks FE: baca **mainnet 56**. Jangan campur trigger. |
| **Indexer** | Ponder + Postgres di VPS; FE tidak index sendiri |
| Latensi | Daftar desk < 2 dtk dengan cache; field live detail agent boleh stream masuk |
| Kegagalan | RPC/8004scan down → cache last-good + banner, hire dinonaktifkan jika kita tidak bisa verifikasi |
| Rahasia | `.env` di-gitignore; tidak ada key di bundle client |
| Aksesibilitas | Path hire lewat keyboard, fokus terlihat, kontras |

---

## 15. Rencana build (27 Agu → 9 Sep)

~13 hari. Urutan kritis untuk hadiah, bukan “arsitektur bagus dulu”.

| Jendela | Hasil |
| --- | --- |
| **D0–D1** | Key Pro 8004scan. Scaffold 4 agent Altana. Spike Ponder (testnet + read mainnet). Faucet $U + tBNB. |
| **D2–D4** | Skeleton J1 di **satu** desk yang **keluar tx** (Yield one-shot paling pendek: supply/stake di wallet Altana agent). Paralel: `sellerCore` tiga agent lain, masing-masing minimal 1 tx path. |
| **D5–D7** | Keempat desk kedalaman UI sama. Metrik live terpasang. UI grant/revoke session. Tx `hireErc8183Agent` nyata pertama di explorer Altana. |
| **D8–D10** | Rekam jejak grid. Rute yield. Reset range rebalance. Flow menghadap PancakeSwap benar-benar menggerakkan state PCS. |
| **D11–D12** | Run Agent Advantage Report (3 task dua arah). Mainnet jika memungkinkan. Deploy publik (bukan trial BNB 48 jam). Pass jalan buntu. |
| **D13** | Submit: URL, alamat wallet, tautan explorer, laporan, skrip demo. Bekukan fitur. |

Jika waktu molor, **potong 8004scan dan pungut fee**, bukan sebuah desk, bukan varian kedua. Satu stub kategori kalah Diversity. Empat desk × 2 varian lebih tipis tapi lengkap menang.

---

## 16. Kriteria penerimaan (checklist ship)

### Main

- [ ] URL publik load tanpa feature flag.
- [ ] Empat desk, masing-masing list + detail + hire + monitor job, kedalaman sama.
- [ ] J1 user dingin direkam (internal) tanpa petunjuk di luar situs.
- [ ] Setiap agent terdaftar live di BSC (ERC-8004 + face yang bisa dijangkau).
- [ ] Dashboard: P&L + fee kinerja **tertampil**, tarik tanpa potongan.
- [ ] Ponder hidup; listing tidak memukul RPC dari browser untuk index.

### Altana

- [ ] Empat wallet Altana seller.
- [ ] Grant session: allowlist + spend cap + expiry, terdaftar di Keystore.
- [ ] ≥1 tx session-key di [explorer Altana](https://docs.altana.network) (testnet atau mainnet).
- [ ] Tampilan session in-app + Revoke.
- [ ] Path hire memakai `hireErc8183Agent`.
- [ ] Submission menyertakan alamat wallet.

### TermiX

- [ ] `/report` live dengan 3 task, artefak, satu trading.
- [ ] Juri bisa hire tanpa walkthrough.
- [ ] Agent grid (atau trading) menampilkan win rate, window, risiko.

### PancakeSwap

- [ ] Minimal satu flow mengelola likuiditas PCS atau mengeksekusi swap/grid PCS untuk user di bawah cap session.
- [ ] Manfaat terlihat on-chain (posisi / fill / fee), bukan screenshot mock.

### Kebersihan

- [ ] Tidak ada halaman marketing starter Turbo tersisa di `/`.
- [ ] State faucet / salah network / agent down ada.
- [ ] Rahasia tidak di git.

---

## 17. Risiko

| Risiko | Mitigasi |
| --- | --- |
| Trial BNB / AgentCore tidur + OAuth | Host di VPS; opsional 1 agent `bag deploy` hanya sebagai demo jalur resmi |
| Altana + B402 berbayar tidak didukung | ERC-8183 adalah rel berbayar; jangan block di B402 |
| “Range” PCS vs skill LP Altana v2 | Implementasi ops range v3 sendiri; skill adalah titik awal |
| Godaan 200k agent | Seed empat agent live; opsional “juga di 8004scan” sekunder |
| Marketplace kosong di hari 1 | Agent first-party masuk scope, bukan nice-to-have |
| Metrik palsu | Lebih baik label hilang/basi daripada APR dummy |
| Laporan TermiX ditinggal sampai akhir | Kalender tiga run di D11; baseline DIY bisa mulai D5 |
| Phase 2 tidak diketahui | Keandalan produksi dan UX tanpa jalan buntu adalah lindung nilai |

---

## 18. Pertanyaan terbuka

Sudah tertutup: passkey, testnet 97, VPS, 2 varian/desk, Yield Venus-only, posisi baru di Altana, 8183 + session, **Ponder**, mainnet = FE saja, fee kinerja tidak dipungut.

Masih terbuka (teknis, bukan produk):

1. Signature kanonik fungsi PCS V3 yang terima struct (bukan placeholder `(...)`).
2. Apakah `grantSession` + `sessionSigner` yang dibangkitkan di browser persist ke agent tanpa jebakan byte-exact JSON.
3. Passkey di Chrome / Safari / Firefox (+ fallback HP via QR WebAuthn).
4. Interval tick per desk vs kuota 9router.
5. Dampak `evaluator_type: uma_oov3` pada settle 8183.
6. Brand publik (Am-M vs nama yang bisa duduk di bnbchain.org).

---

## 19. Referensi

- Ringkasan hackathon: https://www.bnbchain.org/en/hackathons/smart-money-era
- Agent Studio: https://www.bnbchain.org/en/bnb-agent-studio
- Docs Studio: https://docs.bnbchain.org/developer-kit/bnbchain-studio/
- Hire ERC-8183 Altana: https://docs.altana.network/sdk/erc8183
- Skills Altana: https://skills.altana.network
- API 8004scan: https://8004scan.io/developers
- Ponder: https://ponder.sh
- Brief internal: [`docs/Hackathon.md`](./Hackathon.md)
- Referensi desain (bahan, bukan source of truth): [`docs/referensiprd.md`](./referensiprd.md), [`docs/referensitechspec.md`](./referensitechspec.md)
