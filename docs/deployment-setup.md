# Deployment Setup

This document covers the one-time configuration needed for the GitHub Actions workflow at [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) to deploy Rolebook to the AWS Lightsail server on every push to `main`.

The server is at `3.133.79.69`, runs Ubuntu, hosts nginx (frontend + reverse proxy), and runs the Go backend as a systemd service.

---

## 1. GitHub repository secrets

Set these three secrets at **Settings → Secrets and variables → Actions → New repository secret**.

| Secret name | Value | How to get it |
|---|---|---|
| `LIGHTSAIL_HOST` | `3.133.79.69` | The Lightsail public IPv4 from the AWS console (or replace with your domain once DNS is configured). |
| `LIGHTSAIL_USER` | `ubuntu` | Default SSH user on Lightsail Ubuntu images. Change only if you've created a different deploy user. |
| `LIGHTSAIL_SSH_KEY` | full contents of your `.pem` file | The private key you downloaded from Lightsail when creating the instance. Paste the entire file including the `-----BEGIN ... PRIVATE KEY-----` and `-----END ... PRIVATE KEY-----` lines. |

**To paste the PEM:** open the file in a text editor (not a hex dump), copy everything, paste into the secret value. GitHub will preserve the newlines.

After saving, verify by triggering the workflow manually (Actions tab → "Deploy to Lightsail" → "Run workflow"). The "Set up SSH" step will fail loudly if the key is malformed.

---

## 2. Server-side directory layout

SSH into the server once and create the deploy directories:

```bash
ssh -i ~/path/to/your.pem ubuntu@3.133.79.69

sudo mkdir -p /var/www/rolebook/frontend
sudo mkdir -p /var/www/rolebook/backend
sudo chown -R ubuntu:ubuntu /var/www/rolebook
```

The workflow rsyncs files into these paths as the `ubuntu` user, so they need to be owned by `ubuntu`.

---

## 3. systemd service

Create `/etc/systemd/system/rolebook-backend.service` with the following contents:

```ini
[Unit]
Description=Rolebook backend (Go)
After=network.target

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/var/www/rolebook/backend
ExecStart=/var/www/rolebook/backend/rolebook-server
Restart=on-failure
RestartSec=3

# When the backend needs database credentials and other config later, store them
# in /etc/rolebook/backend.env (chmod 600, owned by root:ubuntu) and uncomment:
# EnvironmentFile=/etc/rolebook/backend.env

[Install]
WantedBy=multi-user.target
```

Then enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable rolebook-backend
sudo systemctl start rolebook-backend
sudo systemctl status rolebook-backend   # should show "active (running)"
```

The service starts at boot and restarts automatically if the process exits with a non-zero status.

### Allow the deploy user to restart the service without a password

The workflow's last step runs `sudo systemctl restart rolebook-backend`. To allow that without a password prompt, create `/etc/sudoers.d/rolebook-deploy`:

```bash
sudo visudo -f /etc/sudoers.d/rolebook-deploy
```

Add:

```
ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl restart rolebook-backend
```

Save and exit. `visudo` validates the syntax before saving — don't edit the file directly.

---

## 4. nginx configuration

Install nginx if it isn't installed already:

```bash
sudo apt update
sudo apt install -y nginx
```

Create `/etc/nginx/sites-available/rolebook`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name 3.133.79.69;   # replace with your domain when DNS is set up

    root /var/www/rolebook/frontend;
    index index.html;

    # Backend API — proxy to the Go service on port 8080
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA fallback — unknown paths return index.html so React Router can handle them.
    # Harmless for the Module 4 static page; required from Module 6 onward.
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site, disable the default, and reload nginx:

```bash
sudo ln -s /etc/nginx/sites-available/rolebook /etc/nginx/sites-enabled/rolebook
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t          # syntax check
sudo systemctl reload nginx
```

### Lightsail firewall

In the AWS Lightsail console, on the instance's **Networking** tab, make sure the firewall allows:

- TCP **22** (SSH) — for deployment
- TCP **80** (HTTP)
- TCP **443** (HTTPS) — needed when you add a domain + Let's Encrypt later

Port 8080 should **not** be open to the public — nginx proxies to it on `127.0.0.1`.

---

## 5. First-deployment verification checklist

After the workflow's first successful run:

- [ ] **GitHub Actions:** "Deploy to Lightsail" run is green end to end.
- [ ] **systemd:** `sudo systemctl status rolebook-backend` shows `active (running)` and the most recent restart timestamp matches the deploy time.
- [ ] **Backend health (local on server):** `curl http://127.0.0.1:8080/api/health` returns `{"status":"ok","service":"rolebook"}`.
- [ ] **Backend health (through nginx):** `curl http://3.133.79.69/api/health` returns the same JSON.
- [ ] **Frontend (through nginx):** `curl -I http://3.133.79.69/` returns `200 OK` and `Content-Type: text/html`.
- [ ] **Frontend in a browser:** visiting `http://3.133.79.69/` loads the Hello World page with the green "deployment pipeline working ✓" callout.
- [ ] **Logs are clean:** `journalctl -u rolebook-backend -n 50` shows the listening message and no errors.

If any check fails, the failure log is the first place to look:

- Workflow failure → GitHub Actions run log (shows which step broke)
- systemd failure → `journalctl -u rolebook-backend -n 200`
- nginx failure → `sudo nginx -t` and `sudo journalctl -u nginx -n 100`

---

## 6. What changes per module

- **Module 4 (now):** This setup, plus a static `index.html` and a Hello World Go server. Workflow deploys both on every push to `main`.
- **Module 5:** Backend gains MySQL config — install MySQL on the server, create the database, store credentials in `/etc/rolebook/backend.env`, and uncomment the `EnvironmentFile=` line in the systemd unit.
- **Module 6:** Frontend becomes a Vite-built React app. Workflow needs an extra step before the frontend rsync: `cd frontend && npm ci && npm run build`, then rsync `frontend/dist/` (not `frontend/`) to the server.
- **Module 7:** Add a domain + Let's Encrypt with `certbot --nginx`, update `server_name` in the nginx config, and add the HTTPS server block (certbot can do this automatically).
