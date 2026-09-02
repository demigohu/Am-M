# Deploy agent Am-M di VPS

Lokal (`bag dev`) sudah cukup untuk dogfood. Juri, TermiX, dan 8004scan **butuh HTTPS publik**. Urutannya: **VPS dulu, baru `bag erc8004 register`**. Jangan daftar dulu dengan `localhost`.

Ini **bukan** `bag deploy` / AgentCore. AgentCore tidur (scale-to-zero) dan mengunci endpoint dengan OAuth Cognito. Empat seller dijalankan sebagai empat proses Node di satu VPS, di belakang reverse proxy.

Cara jalan lokal: [`RUNNING.md`](./RUNNING.md).

---

## 1. Yang tidak ikut ke VPS

| Ada di laptop (dev) | Di VPS |
|---|---|
| Keystore admin `.studio/wallets/0x….json` | **Jangan disalin** |
| `WALLET_PASSWORD` | **Jangan** |
| `bag wallet new` | **Jangan diulang** — keystore baru memutus session + identitas |
| `user-admin.json` (EOA tes) | Jangan; production nanti passkey di `/account` |

Yang **wajib** di VPS:

- Kode repo (termasuk `packages/agent-strategy`)
- `agents/<nama>/.studio/wallets/altana-session.json` (session **agent**, 0600) — ini satu-satunya kunci signer di server
- Env runtime (lihat §5), tanpa password admin
- Opsional untuk demo sebelum FE: `user-session.json` (session **user** tes), 0600

Kalau VPS bocor, penyerang dapat session berbatas (cap harian + expiry), bukan admin key. Cabut on-chain: `bag wallet session revoke` dari laptop.

---

## 2. Prasyarat server

- Ubuntu 24.04 (atau setara), **Node.js ≥ 22**, `pnpm`, `git`
- `bag --version` **0.0.13** di laptop (register 8004 dijalankan dari laptop, bukan wajib di VPS)
- Domain + DNS. Empat subdomain **atau** empat path di satu host:

| Proses | `AGENT_PORT` | Contoh URL publik | Wallet agent (sudah ada) |
|---|---|---|---|
| healthfactor | 9001 | `https://healthfactor.<domain>/` | `0xDF977e03657B96C43663c28430274031266072b4` |
| rebalancing | 9002 | `https://rebalancing.<domain>/` | `0x7f3FA089a0D2F0c48d7EcacF843a03D69793C878` |
| gridtrading | 9003 | `https://gridtrading.<domain>/` | `0xB4E7De3592E237ceE295499f2D3d876A378698C6` |
| yieldrouter | 9004 | `https://yieldrouter.<domain>/` | `0x670F9ECAfd03215cE3094097d8172bC3B212Fc6c` |

Firewall: **80/443** ke dunia. Port 9001–9004, 9000, 8088 **hanya loopback**.

**9router** harus bisa dihubungi dari VPS. Opsi: jalankan 9router di VPS, atau `NINEROUTER_BASE_URL` ke host yang reachable (bukan `127.0.0.1` laptop). Tanpa itu, tick DeFi tetap jalan; penjelasan LLM di deliverable 8183 jatuh ke JSON mentah (sudah didesain begitu).

---

## 3. Kode di server

```bash
sudo mkdir -p /opt/am-m
sudo chown "$USER":"$USER" /opt/am-m
git clone <repo> /opt/am-m
cd /opt/am-m

# library bersama (agent mengimpor dist/)
cd packages/agent-strategy && pnpm install && pnpm build && cd ../..

for a in healthfactor rebalancing gridtrading yieldrouter; do
  cd "/opt/am-m/agents/$a"
  pnpm install
  cd app/agent && pnpm build && cd ../../..
done
```

Jangan `pnpm install` hanya di akar Turbo — folder `agents/` di luar workspace root.

---

## 4. Salin session agent (dari laptop)

Di **laptop**, tiap proyek sudah punya `.studio/wallets/altana-session.json` hasil `bag wallet session grant`. Salin **hanya file itu**:

```bash
# contoh satu desk; ulangi 4 kali
rsync -av --chmod=600 \
  agents/healthfactor/.studio/wallets/altana-session.json \
  vps:/opt/am-m/agents/healthfactor/.studio/wallets/altana-session.json
```

Buat folder tujuan dulu (`mkdir -p …/.studio/wallets`). **Jangan** rsync seluruh `.studio/` (keystore admin ikut).

Cek di VPS: file mode `600`, owner user yang menjalankan Node.

---

## 5. Env runtime di VPS

`bag` memuat `agents/<nama>/.studio/.env.local`. Proses `node dist/unifiedMain.js` **tidak** otomatis memuat file itu — systemd/pm2 harus `EnvironmentFile=` ke path yang sama.

Contoh `agents/healthfactor/.studio/.env.local` di VPS (`chmod 600`):

```
# JANGAN taruh WALLET_PASSWORD di sini

NINEROUTER_API_KEY=
NINEROUTER_BASE_URL=https://<9router-yang-reachable>/v1
OPENAI_API_KEY=

AGENT_PORT=9001
AGENT_BIND_HOST=127.0.0.1
AGENT_VARIANT=conservative

PUBLIC_AGENT_URL=https://healthfactor.<domain>
ERC8183_AGENT_URL=https://healthfactor.<domain>/erc8183

# Path absolut di server (bukan path laptop)
# ALTANA_SESSION_FILE=/opt/am-m/agents/healthfactor/.studio/wallets/altana-session.json

BNB_TESTNET_RPC_URL=https://bsc-testnet-rpc.publicnode.com
TICK_INTERVAL_MS=120000

# Demo sebelum FE: session user tes. Production: grant dari /account.
# USER_SESSION_FILE=/opt/am-m/agents/healthfactor/.studio/user-session.json
```

Ulangi untuk 9002 / 9003 / 9004 dan URL desk masing-masing.

`PUBLIC_AGENT_URL` mengisi `url` di `/.well-known/agent-card.json` (HTTPS, tanpa port). `ERC8183_AGENT_URL` harus **publik** — kalau masih `http://127.0.0.1:900x/erc8183`, `submit` 8183 menulis URL yang tidak bisa di-fetch juri.

`AGENT_BIND_HOST=127.0.0.1` wajib. Default scaffold `0.0.0.0` menembus proxy.

---

## 6. Reverse proxy (Caddy)

Ganti `<domain>`. Caddy mengurus TLS.

```
healthfactor.<domain> {
	reverse_proxy 127.0.0.1:9001
}
rebalancing.<domain> {
	reverse_proxy 127.0.0.1:9002
}
gridtrading.<domain> {
	reverse_proxy 127.0.0.1:9003
}
yieldrouter.<domain> {
	reverse_proxy 127.0.0.1:9004
}
```

Nginx setara: `proxy_pass http://127.0.0.1:9001;` + `proxy_http_version 1.1;` + header `Host` / `X-Forwarded-Proto`. CORS belum perlu sampai FE di Vercel memanggil VPS.

Warning `secondary contract port 9000/8088 unavailable` pada agent 2–4 **boleh diabaikan**.

---

## 7. Proses: systemd

Satu unit per agent. Contoh Guard:

`/etc/systemd/system/am-m-healthfactor.service`

```
[Unit]
Description=Am-M healthfactor seller
After=network.target

[Service]
Type=simple
User=amm
WorkingDirectory=/opt/am-m/agents/healthfactor/app/agent
EnvironmentFile=/opt/am-m/agents/healthfactor/.studio/.env.local
ExecStart=/usr/bin/node dist/unifiedMain.js
Restart=always
RestartSec=5
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now am-m-healthfactor am-m-rebalancing am-m-gridtrading am-m-yieldrouter
```

pm2 boleh, pola sama: `cwd` = `app/agent`, `script` = `dist/unifiedMain.js`, `env_file` = `.studio/.env.local`.

Build ulang setelah `git pull`:

```bash
cd /opt/am-m/packages/agent-strategy && pnpm build
cd /opt/am-m/agents/<nama>/app/agent && pnpm build
sudo systemctl restart am-m-<nama>
```

---

## 8. Cek sebelum listing

Dari laptop / HP (bukan SSH localhost):

```bash
curl -sS https://healthfactor.<domain>/.well-known/agent-card.json
curl -sS https://healthfactor.<domain>/strategy
# ulangi rebalancing / gridtrading / yieldrouter
```

Card harus `url` HTTPS publik, skills `negotiate` + `notify_funded`, **tanpa** OAuth (`OAUTH_TOKEN_URL` jangan di-set).

`/strategy` idle tanpa `USER_SESSION_FILE` itu wajar. Hire 8183 tetap butuh session user di proses itu kalau `runHiredJob` menjalankan tick.

---

## 9. Listing ERC-8004 (setelah HTTPS hidup)

Dari **laptop**, di folder agent, password admin tetap di mesin ini:

```bash
cd agents/healthfactor
bag erc8004 register --endpoint https://healthfactor.<domain>/
bag erc8004 show

cd ../rebalancing
bag erc8004 register --endpoint https://rebalancing.<domain>/

cd ../gridtrading
bag erc8004 register --endpoint https://gridtrading.<domain>/

cd ../yieldrouter
bag erc8004 register --endpoint https://yieldrouter.<domain>/
```

Ini yang membuat **4 listing** on-chain. Varian agresif (jadi 8) = proyek `bag` + wallet + session + proses + subdomain **baru**, bukan `AGENT_VARIANT` di proses yang sama.

Kalau endpoint salah, register ulang dengan URL yang benar (jangan biarkan `localhost` tertanam).

---

## 10. Hire publik vs settle

Alur sama seperti lokal: A2A `negotiate` ke URL HTTPS → `bag erc8183 buy` → `notify_funded` **segera** (deadline submit ~30 menit; job Grid 838 expired karena notify keesokan hari).

`bag erc8183 settle <id> --action approve` **bukan** approve ERC-20. Itu melepaskan escrow $U ke seller setelah jendela sengketa ~24 jam. Dipaksa lebih awal → revert `0x17be5b7b`.

Storage `kind = local` di VPS **boleh** (disk persisten). IPFS hanya perlu jika fetch deliverable harus tahan ganti mesin.

---

## 11. Yang belum termasuk dokumen ini

- Delapan identitas (varian agresif)
- Frontend Vercel + passkey `/account` (ganti `USER_SESSION_FILE` tes)
- Indexer Ponder + Postgres
- Laporan TermiX

Urutan setelah 4 URL publik hijau: register 8004 (§9), baru FE.
