# Am-M — Style Reference (CANONICAL)

> butcher paper bakery ledger. **Roboto Slab** is the display face (Champ substitute, locked).
> Ini SATU-SATUNYA sumber token yang boleh dipakai Cursor/kode. Jangan pernah timpa dengan
> file `DESIGN.md` hasil export otomatis dari Stitch — itu punya penamaan dan beberapa angka
> yang berbeda (lihat catatan di paling bawah file ini).

Tokens dasar di bawah ini berasal dari ekstrak "Apron" (referensi gaya awal). Bagian
**Overlay** adalah aturan khusus Am-M yang menang kalau ada konflik sama Apron.

**Theme:** light
**UI language:** English
**Display font:** Roboto Slab 500 / 800 — `--font-display`. Never load Champ. Never mix
Geist/Inter as headlines.

---

## Overlay — token final Am-M (ini yang menang kalau beda sama Apron)

**Warna:**

- Buttercream (canvas) `#fff6d2`
- Bone White (card surface) `#ffffff`
- Ink Black (teks/border/struktur) `#000000`
- Marigold (satu-satunya warna chromatic, primary CTA) `#ffd801`
- Oat (border sekunder/divider) `#cccbc7`
- Char (teks muted/metadata) `#666664`

**Semantic status:**

| Name         | Hex                          | Use                                 |
| ------------ | ---------------------------- | ----------------------------------- |
| Signal green | `#1f8a5f`                    | In range, healthy HF, +PnL          |
| Signal amber | `#b8790a`                    | Near threshold, stale, expiry < 24h |
| Signal red   | `#c23b30`                    | Out of range, breach, −PnL, offline |
| Dim fills    | 10% alpha dari warna di atas | Badge wells                         |

**Desk marks** (stamp/dot doang, bukan ilustrasi ikon):

- Rebalance `#4a63c4`
- Grid `#7c4ac4`
- Yield = Signal green `#1f8a5f`
- Guard = Signal red `#c23b30`

**Navbar** (final, satu spec buat semua halaman — bukan dua shell):

```
[Logo → /]  ·····  Market   Report  ·····  [Account]
```

Plain text link, bukan dropdown, bukan kata "Browse". TIDAK ADA tombol Marigold di nav
halaman manapun — Marigold cuma muncul sebagai CTA di dalam konten (hero, baris Hire,
tombol grant checkout).

**Brand lockup** (nav + footer): SATU elemen — peanut icon + wordmark "Am-M". Nggak ada
duplikasi/caption/tag tambahan. Nav ~28-32px, footer ~18-20px.

**Slab type scale:**

| Surface                                  | Size / weight                                  |
| ---------------------------------------- | ---------------------------------------------- |
| Home masthead                            | 54px / 800 (72px kalau muat 1 baris di 1280px) |
| `/report`                                | 54–72px / 800                                  |
| Market / Desk / Listing / Account titles | 38px / 800                                     |
| Section / desk in-page                   | 26px / 500                                     |
| Nav                                      | Logo image, height ~28–32px                    |

---

## Dari Apron (dasar) — yang dipertahankan

- Buttercream canvas, white cards, ink, oat, **satu** Marigold per surface
- Slab titles (26 / 38 di app; 54–72 di Home masthead dan `/report` saja)
- DM Sans body/UI, DM Mono + `tabular-nums` untuk angka/uang/health-factor
- Pills 9999px; cards 20px; inputs 16px
- Nggak ada card drop-shadow; `--shadow-md` cuma buat floating menu

### Shadows

| Name                             | Value                                   | Token         |
| -------------------------------- | --------------------------------------- | ------------- |
| md (floating menu/dropdown ONLY) | `rgba(70, 58, 0, 0.1) 0px 4px 12px 0px` | `--shadow-md` |

### Border Radius

| Element | Value  |
| ------- | ------ |
| tags    | 9999px |
| cards   | 20px   |
| inputs  | 16px   |
| buttons | 9999px |

### Layout

- Page max-width: 1200px
- Section gap: 80px (halaman storytelling seperti Home/Report) — lebih rapat di halaman
  data-heavy (Market/Desk/Account/dst) karena kontennya lebih padat, bukan aturan sistem
  terpisah, murni konsekuensi jumlah konten
- Card padding: 32px
- Element gap: 24px
- Base unit: 4px

### Typography — detail lengkap

**Roboto Slab** (display) — substitute untuk Champ:

- Weights: 500, 800
- Sizes: 26px, 38px, 54px, 72px
- Line height: 1.01–1.40
- Letter spacing: 0.01em

**DM Sans** (body/UI/label/tombol):

- Weights: 400, 500, 700
- Sizes: 10px, 16px, 20px

**DM Mono** (angka/hash/address/harga):

- Weight: 400
- Size: 18px (sesuaikan konteks tabel)
- Letter spacing: 0.01em

### Do's and Don'ts

**Do:**

- Marigold `#ffd801` eksklusif buat SATU primary CTA per screen
- Semua tombol pill 9999px radius
- Roboto Slab 800 di 38-72px buat semua display text, 500 di 26px buat sub-display
- Buttercream `#fff6d2` sebagai canvas, card putih `#ffffff` di atasnya — jangan pakai
  cool gray buat surface manapun
- Border hairline 1px `#000000`, 1.5px buat elemen interaktif — shadow cuma buat
  floating UI (menu/popover)

**Don't:**

- Jangan ada warna chromatic lain selain Marigold, kecuali status semantic (hijau/
  amber/merah) dan desk mark colors — itu bentuk kategorisasi, bukan dekorasi
- Jangan kasih shadow ke card/content block manapun
- Jangan pakai DM Sans di atas 24px buat display — itu wilayah Roboto Slab
- Jangan pakai pure white `#ffffff` buat page canvas — Buttercream itu base-nya, putih
  cuma buat card surface
- Jangan campur border-radius dalam satu kategori komponen — semua tombol pill, semua
  card 20px, semua input 16px
- Jangan tambah gradient di manapun

---

## ⚠️ Catatan penting: jangan ketuker sama DESIGN.md hasil export Stitch

Stitch (tools desain, bukan file ini) sempat generate `DESIGN.md`-nya sendiri secara
otomatis dari hasil screen yang dia bikin — namanya kebetulan sama ("DESIGN.md") tapi
isinya BEDA dan SALAH di beberapa tempat:

| Token             | Versi Stitch (SALAH, jangan pakai)                               | Versi canonical (file ini)                    |
| ----------------- | ---------------------------------------------------------------- | --------------------------------------------- |
| Background/canvas | `#fff9eb`                                                        | `#fff6d2`                                     |
| Ink/teks utama    | `#1f1c06`                                                        | `#000000`                                     |
| Sistem penamaan   | Material Design 3 (`surface`, `on-surface`, `primary-container`) | Named (Buttercream, Marigold, Ink, Oat, Char) |

Kalau nemu file `DESIGN.md` versi itu di project Stitch/hasil export, JANGAN dipakai
sebagai sumber token buat kode — rename jadi `stitch-export-reference.md` dan cuma
pakai buat referensi struktur/spacing kalau perlu, bukan buat warna.
