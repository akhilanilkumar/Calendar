# Deploying Schedulify to AWS EC2

This guide provides instructions to deploy your Dockerized Schedulify app (Frontend + Express API + SQLite) to an AWS EC2 instance.

---

## Quick Automated Deployment (AWS CLI)

If you have configured AWS CLI on your machine (`aws configure`), you can run the interactive setup script:

```bash
./deploy/deploy-ec2.sh
```

This script automatically:
1. Creates a Security Group (`schedulify-sg`) with open ports `22`, `80`, `443`, and `3001`.
2. Creates an AWS Key Pair (`schedulify-key.pem`).
3. Launches a `t3.micro` EC2 instance with Docker and Docker Compose pre-installed.
4. Provides commands to sync your code and start the container stack.

---

## Manual EC2 Deployment Guide

### Step 1: Launch an EC2 Instance (AWS Console)
1. Open the [AWS EC2 Console](https://console.aws.amazon.com/ec2/).
2. Click **Launch Instance**.
3. **Name**: `Schedulify-Server`
4. **AMI**: Amazon Linux 2023 AMI or Ubuntu 24.04 LTS.
5. **Instance Type**: `t3.micro` or `t2.micro` (Free Tier eligible).
6. **Key Pair**: Select an existing `.pem` key or create a new one.
7. **Network Settings / Security Group**:
   - Allow **SSH** (port 22)
   - Allow **HTTP** (port 80)
   - Allow **HTTPS** (port 443)
   - Allow **Custom TCP** (port 3001)
8. Click **Launch Instance**.

---

### Step 2: Connect to EC2 and Install Docker
Connect to your EC2 instance via SSH:

```bash
ssh -i /path/to/key.pem ec2-user@<YOUR-EC2-PUBLIC-IP>
```

Install Docker & Docker Compose on the instance:

```bash
# On Amazon Linux 2023:
sudo dnf update -y
sudo dnf install -y docker git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose Plugin
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
```

*(Note: Log out and log back in for group permissions to take effect)*

---

### Step 3: Deploy Application with Docker Compose

From your local machine, copy the application code to your EC2 instance:

```bash
rsync -avz -e "ssh -i /path/to/key.pem" \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude 'server/*.db*' \
  ./ ec2-user@<YOUR-EC2-PUBLIC-IP>:~/app/
```

SSH into EC2 and launch the production container:

```bash
ssh -i /path/to/key.pem ec2-user@<YOUR-EC2-PUBLIC-IP>
cd ~/app
sudo docker compose -f deploy/docker-compose.prod.yml up -d --build
```

Your app is now live at: **`http://<YOUR-EC2-PUBLIC-IP>/`**

---

## Setting Up Custom Domain & Free SSL (Certbot)

If you own a custom domain (e.g., `schedulify.yourdomain.com` pointing to your EC2 IP address):

1. SSH into your EC2 instance:
   ```bash
   sudo dnf install -y certbot python3-certbot-nginx nginx
   ```
2. Copy `deploy/nginx.conf` to `/etc/nginx/conf.d/schedulify.conf`
3. Run Certbot to generate a free Let's Encrypt SSL certificate:
   ```bash
   sudo certbot --nginx -d schedulify.yourdomain.com
   ```
4. Certbot will automatically enable HTTPS and redirect HTTP traffic to `https://schedulify.yourdomain.com`.

---

## Data Persistence & Backups

All database records (users, schedule, reservations, emails) are stored inside the persistent Docker volume `schedulify_sqlite_data` at `/app/data/schedulify.db` inside the container.

To backup your database from EC2:
```bash
sudo docker cp schedulify_app_prod:/app/data/schedulify.db ~/schedulify_backup_$(date +%F).db
```
