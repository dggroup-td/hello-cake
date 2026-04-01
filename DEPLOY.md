# Deploy Hello Cake trên CentOS 8 + Node.js 18

## Bước 1: SSH vào VPS
```bash
ssh root@IP_VPS
```

## Bước 2: Cài Node.js 18
```bash
# Cài Node.js 18 từ NodeSource
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
dnf install -y nodejs

# Kiểm tra
node --version   # v18.20.x
npm --version    # 10.x
```

## Bước 3: Cài build tools (cho better-sqlite3)
```bash
dnf groupinstall -y "Development Tools"
dnf install -y python3
```

## Bước 4: Cài PM2 (chạy app 24/7)
```bash
npm install -g pm2
```

## Bước 5: Clone code
```bash
cd /var/www
git clone https://github.com/dggroup-td/hello-cake.git
cd hello-cake
npm install --production
```

## Bước 6: Chạy thử
```bash
node server.js
# Thấy "Hello Cake — http://localhost:3457" → OK
# Ctrl+C dừng lại
```

## Bước 7: Chạy bằng PM2 (24/7, auto restart)
```bash
pm2 start server.js --name hellocake
pm2 save
pm2 startup
```

## Bước 8: Cài Nginx (reverse proxy)
```bash
dnf install -y nginx
systemctl enable nginx
systemctl start nginx
```

Tạo config:
```bash
cat > /etc/nginx/conf.d/hellocake.conf << 'EOF'
server {
    listen 80;
    server_name hellocake.vn www.hellocake.vn;

    location / {
        proxy_pass http://127.0.0.1:3457;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }
}
EOF

nginx -t && systemctl reload nginx
```

## Bước 9: Mở firewall
```bash
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

## Bước 10: Trỏ domain
Vào quản lý DNS domain → thêm:
- A record: @ → IP_VPS
- A record: www → IP_VPS

## Bước 11: Cài SSL (HTTPS miễn phí)
```bash
dnf install -y certbot python3-certbot-nginx
certbot --nginx -d hellocake.vn -d www.hellocake.vn
certbot renew --dry-run
```

## Lệnh quản lý
```bash
pm2 status              # Xem trạng thái
pm2 logs hellocake      # Xem log
pm2 restart hellocake   # Restart app
pm2 stop hellocake      # Dừng app

# Cập nhật code mới
cd /var/www/hello-cake
git pull origin main
npm install --production
pm2 restart hellocake
```

## Truy cập
- http://IP_VPS (trước khi có domain)
- https://hellocake.vn (sau khi trỏ domain + SSL)
- Admin: hellocake2026
