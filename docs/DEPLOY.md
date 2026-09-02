# Deploy agent Am-M di VPS

Lokal (`bag dev`) sudah cukup untuk dogfood. Juri, TermiX, dan 8004scan **butuh HTTPS publik**. Urutannya: **VPS dulu, baru** `bag erc8004 register`. Jangan daftar dulu dengan `localhost`.

Ini **bukan** `bag deploy` / AgentCore. Empat seller = empat proses Node di satu VPS, dijalankan **pm2**, di belakang reverse proxy.

Cara jalan lokal: `[RUNNING.md](./RUNNING.md)`.

---

## 1. Yang tidak ikut ke VPS

| Ada di Mac                                | Di VPS                                                         |
| ----------------------------------------- | -------------------------------------------------------------- |
| Keystore admin `.studio/wallets/0x….json` | **Jangan disalin**                                             |
| `WALLET_PASSWORD`                         | **Jangan**                                                     |
| `bag wallet new`                          | **Jangan diulang** — keystore baru memutus session + identitas |
| `user-admin.json` (EOA tes)               | Jangan; production nanti passkey di `/account`                 |

Yang **wajib** di VPS:

- Kode repo (termasuk `packages/agent-strategy`)
- `agents/<nama>/.studio/wallets/altana-session.json` (session **agent**, mode `600`) — satu-satunya kunci signer di server
- Env runtime (lihat §5), **tanpa** password admin
- Opsional demo sebelum FE: `user-session.json` (session **user** tes), mode `600`

Kalau VPS bocor, penyerang dapat session berbatas (cap harian + expiry), bukan admin key. Cabut dari Mac: `bag wallet session revoke`.

---

## 2. Prasyarat server

- Ubuntu 24.04 (atau setara), **Node.js ≥ 22**, `pnpm`, `git`, **pm2** (`npm i -g pm2`)
- `bag --version` **0.0.13** di **Mac** (register 8004 dari laptop)
- Domain **ammlabs.fun**. Empat subdomain (A2A hidup di `/`, bukan path):

| Proses       | `AGENT_PORT` | URL publik                          | Wallet agent                                 |
| ------------ | ------------ | ----------------------------------- | -------------------------------------------- |
| healthfactor | 9001         | `https://healthfactor.ammlabs.fun/` | `0xDF977e03657B96C43663c28430274031266072b4` |
| rebalancing  | 9002         | `https://rebalancing.ammlabs.fun/`  | `0x7f3FA089a0D2F0c48d7EcacF843a03D69793C878` |
| gridtrading  | 9003         | `https://gridtrading.ammlabs.fun/`  | `0xB4E7De3592E237ceE295499f2D3d876A378698C6` |
| yieldrouter  | 9004         | `https://yieldrouter.ammlabs.fun/`  | `0x670F9ECAfd03215cE3094097d8172bC3B212Fc6c` |

Di DNS registrar, **empat record A** (atau CNAME ke host VPS) ke IP VPS:

```
healthfactor.ammlabs.fun    A    <IP_VPS>
rebalancing.ammlabs.fun     A    <IP_VPS>
gridtrading.ammlabs.fun     A    <IP_VPS>
yieldrouter.ammlabs.fun     A    <IP_VPS>
```

Apex `ammlabs.fun` boleh ditunda — itu untuk FE nanti, bukan keempat agent. Jangan pakai `ammlabs.fun/healthfactor`: scaffold tidak di-mount di path, `/.well-known/agent-card.json` akan salah host.

Opsional: satu wildcard `*.ammlabs.fun A <IP_VPS>` kalau mau 8 listing nanti tanpa nambah record satu-satu. Caddy tetap butuh blok `host { }` per nama.

Firewall: **80/443** ke dunia. Port 9001–9004, 9000, 8088 **hanya loopback**.

**9router** harus reachable dari VPS (bukan `127.0.0.1` di Mac). Tanpa itu tick DeFi tetap jalan; penjelasan LLM di deliverable 8183 jatuh ke JSON mentah.

---

## 3. Kode di server

```bash
sudo mkdir -p /opt/am-m
sudo chown "$USER":"$USER" /opt/am-m
git clone <repo> /opt/am-m
cd /opt/am-m

cd packages/agent-strategy && pnpm install && pnpm build && cd ../..

for a in healthfactor rebalancing gridtrading yieldrouter; do
  cd "/opt/am-m/agents/$a"
  pnpm install
  cd app/agent && pnpm build && cd /opt/am-m
done
```

Jangan `pnpm install` hanya di akar Turbo — folder `agents/` di luar workspace root.

---

## 4. Copy session dari Mac ke VPS

File yang boleh dicopy: `altana-session.json` **saja** (hasil `bag wallet session grant` di Mac). Bukan seluruh folder `.studio/`, bukan `0x….json`, bukan `.env.local` Mac (ada `WALLET_PASSWORD`).

Ganti dua variabel ini, lalu jalankan **semua perintah dari folder repo di Mac** (`Am-M/`):

```bash
HOST=user@IP_VPS          # contoh: ubuntu@203.0.113.10
DEST=/opt/am-m
```

### 4.1 Folder tujuan di VPS

```bash
ssh "$HOST" "mkdir -p $DEST/agents/{healthfactor,rebalancing,gridtrading,yieldrouter}/.studio/wallets"
```

Kalau SSH minta password / key: pakai user yang sama dengan yang menjalankan pm2.

### 4.2 Kirim empat session agent

`rsync` ada di Mac secara default. `--chmod=600` = hanya owner yang bisa baca (wajib).

```bash
for a in healthfactor rebalancing gridtrading yieldrouter; do
  rsync -av --chmod=600 \
    "agents/$a/.studio/wallets/altana-session.json" \
    "$HOST:$DEST/agents/$a/.studio/wallets/altana-session.json"
done
```

Tanpa rsync, `scp` setara:

```bash
for a in healthfactor rebalancing gridtrading yieldrouter; do
  scp "agents/$a/.studio/wallets/altana-session.json" \
    "$HOST:$DEST/agents/$a/.studio/wallets/altana-session.json"
done
ssh "$HOST" 'chmod 600 Am-M/agents/*/.studio/wallets/altana-session.json'
```

### 4.3 Cek di VPS (jangan sampai keystore admin ikut)

```bash
ssh "$HOST" 'ls -l Am-M/agents/*/.studio/wallets/'
```

Yang **boleh** kelihatan: `altana-session.json` mode `-rw-------` (600).

Yang **tidak boleh** kelihatan: `0xDF97….json`, `0x7f3F….json`, `user-admin.json`.

Kalau file 600 tidak kepakai (masih `644`), di VPS:

```bash
chmod 600 /opt/am-m/agents/*/.studio/wallets/altana-session.json
```

### 4.4 Opsional — session user tes (sebelum FE)

Hanya untuk demo tick, **satu file per desk** (jangan copy session Guard ke Grid):

```bash
# contoh Guard; ulangi desk lain dengan file-nya sendiri
rsync -av --chmod=600 \
  agents/healthfactor/.studio/user-session.json \
  "$HOST:$DEST/agents/healthfactor/.studio/user-session.json"
```

Lalu di `.env.local` VPS set `USER_SESSION_FILE=/opt/am-m/agents/healthfactor/.studio/user-session.json` (path **server**, bukan path Mac).

---

## 5. Env runtime di VPS

Satu file: `agents/<nama>/.studio/.env.local` (`chmod 600`). Bukan `.env`, bukan `app/agent/.env`.

`bag` di Mac hanya memuat path itu. Di VPS, proses Node **membaca `.env.local` sendiri** saat boot (cwd `app/agent` → `../../.studio/.env.local`). pm2 `env_file` **bukan** andalan: `pm2 restart --update-env` **tidak** membaca ulang file itu — dia hanya apply blok `env: {}` yang sudah di-cache.

`ecosystem.config.cjs` sudah set `PUBLIC_AGENT_URL` + `ERC8183_AGENT_URL` per desk (`https://<nama>.ammlabs.fun`). Kalau card masih `localhost`, hampir selalu karena process belum di-start ulang **dari file ecosystem baru**, bukan karena URL salah di nano.

Tulis **baru** di server; jangan scp `.env.local` Mac (ada `WALLET_PASSWORD`).

Contoh `/opt/am-m/agents/healthfactor/.studio/.env.local` (`chmod 600`):

```
# JANGAN taruh WALLET_PASSWORD di sini

NINEROUTER_API_KEY=
NINEROUTER_BASE_URL=https://<9router-yang-reachable>/v1
OPENAI_API_KEY=

AGENT_PORT=9001
AGENT_BIND_HOST=127.0.0.1
AGENT_VARIANT=conservative

PUBLIC_AGENT_URL=https://healthfactor.ammlabs.fun
ERC8183_AGENT_URL=https://healthfactor.ammlabs.fun/erc8183

BNB_TESTNET_RPC_URL=https://bsc-testnet-rpc.publicnode.com
TICK_INTERVAL_MS=120000

# Demo sebelum FE:
# USER_SESSION_FILE=/opt/am-m/agents/healthfactor/.studio/user-session.json
```

Ulangi untuk 9002 / 9003 / 9004 dan URL desk masing-masing.

`PUBLIC_AGENT_URL` = `url` di agent card (HTTPS, tanpa port). `ERC8183_AGENT_URL` harus **publik** — kalau masih `http://127.0.0.1:900x/erc8183`, juri tidak bisa fetch deliverable.

`AGENT_BIND_HOST=127.0.0.1` wajib. Default scaffold `0.0.0.0` menembus proxy.

`studio.toml` sudah menunjuk `session_file = "../../.studio/wallets/altana-session.json"` relatif ke `app/agent` — selama cwd pm2 = `app/agent`, file hasil copy di §4 ketemu tanpa `ALTANA_SESSION_FILE`.

---

## 6. Reverse proxy (nginx + Let's Encrypt)

Publik hanya bicara ke **nginx di 80/443**. Empat proses Node tetap di `127.0.0.1:9001–9004`. Nginx **bukan** pengganti pm2 — dia cuma TLS + teruskan request.

DNS §2 harus sudah A-record ke IP VPS sebelum `certbot` (kalau tidak, Gagal meraih ACME).

### 6.1 Empat file site

Satu file per subdomain, pola sama seperti biasanya.

`/etc/nginx/sites-available/healthfactor.ammlabs.fun`

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name healthfactor.ammlabs.fun;

    location / {
        proxy_pass http://127.0.0.1:9001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}
```

Tiga file lain: ganti `server_name` + `proxy_pass`:

| File | `server_name` | `proxy_pass` |
|---|---|---|
| `healthfactor.ammlabs.fun` | `healthfactor.ammlabs.fun` | `http://127.0.0.1:9001` |
| `rebalancing.ammlabs.fun` | `rebalancing.ammlabs.fun` | `http://127.0.0.1:9002` |
| `gridtrading.ammlabs.fun` | `gridtrading.ammlabs.fun` | `http://127.0.0.1:9003` |
| `yieldrouter.ammlabs.fun` | `yieldrouter.ammlabs.fun` | `http://127.0.0.1:9004` |

Aktifkan + tes (pm2 agent boleh belum nyala; nginx tetap `ok` asalkan sintaks benar):

```bash
sudo ln -s /etc/nginx/sites-available/healthfactor.ammlabs.fun /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/rebalancing.ammlabs.fun /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/gridtrading.ammlabs.fun /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/yieldrouter.ammlabs.fun /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 6.2 SSL (certbot), sama seperti site biasa

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx \
  -d healthfactor.ammlabs.fun \
  -d rebalancing.ammlabs.fun \
  -d gridtrading.ammlabs.fun \
  -d yieldrouter.ammlabs.fun
```

Certbot menambal file site: `listen 443 ssl` + redirect 80 → 443. Renew otomatis via timer systemd. Tidak ada yang khusus dibanding nginx + WordPress/Next — bedanya cuma `proxy_pass` ke port Node, bukan PHP-FPM.

### 6.3 Warning `9000` / `8088` — bukan error nginx, bukan deploy gagal

Scaffold **selalu** coba bind tiga port: `AGENT_PORT` (utama, fatal kalau gagal), lalu **9000** dan **8088** (sisa kontrak AgentCore/Foundry, best-effort).

Di satu VPS, agent **pertama** yang nyala (biasanya healthfactor) yang dapat 9000 dan 8088. Tiga agent berikutnya log:

```
secondary contract port 9000 unavailable: listen EADDRINUSE
secondary contract port 8088 unavailable: listen EADDRINUSE
```

Itu **wajar**. Yang dipakai nginx dan ERC-8004 adalah port unik 9001–9004. 9000/8088 tidak di-proxy dan tidak didaftarkan. Jangan buka 9000/8088 di firewall.

Yang **tidak** wajar: proses tidak log `serving on 127.0.0.1:9002` (dst.) — berarti `AGENT_PORT` bentrok atau env pm2 salah.

---

## 7. Proses: pm2

File `ecosystem.config.cjs` ada di **akar repo** (folder yang sama dengan `agents/`). `root` = `__dirname`, jadi clone boleh `/root/Am-M` atau `/opt/am-m` — jangan hardcode path dobel.

Wajib ada `dist/unifiedMain.js` dulu:

```bash
cd ~/Am-M    # atau path clone kamu
cd packages/agent-strategy && pnpm install && pnpm build && cd ../..
for a in healthfactor rebalancing gridtrading yieldrouter; do
  (cd "agents/$a" && pnpm install)
  (cd "agents/$a/app/agent" && pnpm build)
  test -f "agents/$a/app/agent/dist/unifiedMain.js" || echo "MISSING dist $a"
done
```

Kalau pm2 sudah sempat start dengan path salah (`/root/Am-M/Am-M/...`):

```bash
pm2 delete all
cd ~/Am-M
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
# jalankan perintah `sudo env PATH=...` yang dicetak pm2 startup
```

`env_file` butuh **pm2 ≥ 5.3** dan tetap flaky. Cek: `pm2 --version`. Andalan: Node load `.env.local` + `env: {}` di ecosystem.

**Jangan** `pm2 restart all --update-env` setelah edit `.env.local` — itu tidak re-read file. Cukup `pm2 restart all` **setelah** `pnpm build` yang memuat `loadStudioEnv`. Setelah ganti `ecosystem.config.cjs` (URL publik, port):

```bash
pm2 delete all
cd ~/Am-M   # atau /opt/am-m
pm2 start ecosystem.config.cjs
pm2 save
```

Cek env benar-benar masuk process:

```bash
pm2 env 0 | grep -E 'PUBLIC_AGENT|ERC8183_AGENT|AGENT_PORT'
pm2 logs healthfactor --lines 30 --nostream | grep seller-agent
```

Log boot harus ada `public=https://healthfactor.ammlabs.fun`. Kalau `public=(unset)` → dist lama, rebuild.

Perintah harian:

```bash
pm2 status
pm2 logs healthfactor
pm2 restart all
```

Setelah `git pull` di VPS:

```bash
cd ~/Am-M   # atau /opt/am-m
(cd packages/agent-strategy && pnpm build)
for a in healthfactor rebalancing gridtrading yieldrouter; do
  (cd "agents/$a/app/agent" && pnpm build)
done
pm2 delete all
pm2 start ecosystem.config.cjs
pm2 save
```

---

## 8. Cek sebelum listing

Dari Mac / HP (bukan `curl` localhost di SSH):

```bash
curl -sS https://healthfactor.ammlabs.fun/.well-known/agent-card.json
curl -sS https://healthfactor.ammlabs.fun/strategy
# ulangi rebalancing / gridtrading / yieldrouter
```

Card: `url` HTTPS publik, skills `negotiate` + `notify_funded`, **tanpa** OAuth (`OAUTH_TOKEN_URL` jangan di-set).

`/strategy` idle tanpa `USER_SESSION_FILE` itu wajar.

---

## 9. Listing ERC-8004 (setelah HTTPS hidup)

Dari **Mac**, di folder agent (`WALLET_PASSWORD` tetap di mesin ini):

```bash
cd agents/healthfactor
bag erc8004 register --endpoint https://healthfactor.ammlabs.fun/
bag erc8004 show

cd ../rebalancing
bag erc8004 register --endpoint https://rebalancing.ammlabs.fun/

cd ../gridtrading
bag erc8004 register --endpoint https://gridtrading.ammlabs.fun/

cd ../yieldrouter
bag erc8004 register --endpoint https://yieldrouter.ammlabs.fun/
```

Ini **4 listing** on-chain. Varian agresif (jadi 8) = proyek + wallet + session + proses + subdomain **baru**.

---

## 10. Hire publik vs settle

A2A `negotiate` ke URL HTTPS → `bag erc8183 buy` → `notify_funded` **segera** (deadline ~30 menit).

`bag erc8183 settle <id> --action approve` melepaskan escrow $U setelah jendela sengketa ~24 jam — bukan approve ERC-20. Dipaksa lebih awal → revert `0x17be5b7b`.

Storage `kind = local` di VPS **boleh**. IPFS hanya jika deliverable harus tahan ganti mesin.

---

## 11. Yang belum termasuk dokumen ini

- Delapan identitas (varian agresif)
- Frontend Vercel + passkey `/account`
- Indexer Ponder + Postgres
- Laporan TermiX

Urutan setelah 4 URL publik hijau: register 8004 (§9), baru FE.
