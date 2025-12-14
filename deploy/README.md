# Deploying dominocum74.top

These notes assume a fresh Ubuntu 22.04 VPS (185.211.4.129) with sudo access and the domain `dominocum74.top` pointing to it.

## 1. Server bootstrap (run once)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx rsync ufw
sudo ufw allow 'Nginx Full'
sudo systemctl enable --now nginx
```

Add a deploy user with limited sudo if desired:
```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo mkdir -p /home/deploy/.ssh && sudo chown -R deploy:deploy /home/deploy/.ssh
# copy your public key into /home/deploy/.ssh/authorized_keys
```

Create the app directories:
```bash
sudo mkdir -p /var/www/dominocum74/current
sudo chown -R deploy:deploy /var/www/dominocum74
```

## 2. Nginx configuration

Copy `deploy/nginx/dominocum74.conf` to `/etc/nginx/sites-available/dominocum74.conf` then enable it:
```bash
sudo cp dominocum74.conf /etc/nginx/sites-available/dominocum74.conf
sudo ln -s /etc/nginx/sites-available/dominocum74.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 3. HTTPS with Certbot

Install Certbot from Snap and request the certificate:
```bash
sudo snap install core && sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d dominocum74.top -d www.dominocum74.top
```

Set up automatic renewals (Certbot already installs a systemd timer). You can test with `sudo certbot renew --dry-run`.

## 4. Frontend deployment workflow

From your development machine:

1. Ensure `DEPLOY_USER`, `DEPLOY_HOST`, and `DEPLOY_PATH` environment variables are set if you need values different from the defaults in `scripts/deploy.sh`.
2. Run the script:
   ```bash
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh
   ```

The script performs `npm ci`, `npm run build`, syncs `dist/` to `/var/www/dominocum74/current`, ensures the shared symlink, and reloads nginx. Set these Vite variables before building:

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Public Fastify backend URL (`https://api.dominocum74.top`). |
| `VITE_API_KEY` | API key forwarded in the `x-api-key` header. |
| `VITE_UPLOADS_PUBLIC_BASE_URL` | Host/base used to render archivos de anécdotas (por defecto reutiliza `VITE_API_BASE_URL`). |

## 5. Backend API deployment

### 5.1 Environment variables

The container needs the following values (see `server/.env.example`):

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | E.g. `postgresql://user:pass@185.211.4.129:5432/dominocum74`. |
| `API_KEY` | Same key used by the frontend. |
| `DEFAULT_TZ` | Timezone for snapshots (`America/Merida`). |
| `PGSSL` | Set to `1` if PostgreSQL enforces TLS (default `0`). |
| `PG_POOL_MAX` | Connection pool size (default 10). |
| `API_PORT` | Published port (default 4000). |
| `UPLOAD_MAX_BYTES` | Upload limit in bytes (default `52428800`, ~50 MB). |
| `UPLOADS_PUBLIC_BASE_URL` | Absolute origin for files served from `/uploads` (ej. `https://api.dominocum74.top`). |

Store them in `/var/www/dominocum74/current/.env.api` or any file referenced by systemd.

### 5.2 docker compose

```bash
cd /var/www/dominocum74/current
docker compose -f docker-compose.api.yml --env-file .env.api up -d --build
```

El compose publica `${API_PORT:-4000}` y añade la IP de PostgreSQL mediante `extra_hosts`. Ajusta la red o añade proxies según tus necesidades.

### 5.3 systemd

1. Copy `deploy/domino74-api.service` to `/etc/systemd/system/domino74-api.service`.
2. Create a drop-in with the environment file:

   ```bash
   sudo mkdir -p /etc/systemd/system/domino74-api.service.d
   cat <<'EOF' | sudo tee /etc/systemd/system/domino74-api.service.d/override.conf
   [Service]
   EnvironmentFile=/var/www/dominocum74/current/.env.api
   EOF
   ```

3. Reload and enable:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now domino74-api.service
   ```

The unit runs `docker compose -f docker-compose.api.yml up -d --build` on start and `down` on stop. Restart it (`sudo systemctl restart domino74-api`) after pulling new code.

### 5.4 Verification

1. Tail logs: `docker compose -f docker-compose.api.yml logs -f domino74-api`.
2. Health check: `curl -H "x-api-key: $API_KEY" https://api.dominocum74.top/health`.
3. From the deployed frontend, create/update a game night to ensure mutations succeed. Si necesitas subir video/audio mayor a 50 MB ajusta `UPLOAD_MAX_BYTES` y `client_max_body_size` en `deploy/nginx/dominocum74.conf` antes de probar.

## 6. Updating code

Repeat steps 4 and 5 whenever you need to publish new builds. Certificates renew automatically; remember to keep your server patched (`sudo apt update && sudo apt upgrade`).
