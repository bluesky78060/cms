# 배포 가이드

## 프로덕션 배포

### 환경 설정

#### 1. PostgreSQL 데이터베이스 설정

```bash
# PostgreSQL 설치 (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# 데이터베이스 생성
sudo -u postgres createdb construction_db
sudo -u postgres createuser -P construction_user
```

#### 2. 환경변수 설정

`.env` 파일:
```env
DATABASE_URL=postgresql://construction_user:password@localhost/construction_db
SECRET_KEY=your-production-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOWED_ORIGINS=https://yourdomain.com
```

#### 3. 백엔드 배포 (예: Ubuntu + Nginx + Gunicorn)

```bash
# 의존성 설치
pip install -r requirements.txt
pip install gunicorn

# Gunicorn 설정 파일 생성
cat > gunicorn.conf.py << EOF
bind = "127.0.0.1:8000"
workers = 4
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 30
keepalive = 2
EOF

# Systemd 서비스 생성
sudo tee /etc/systemd/system/construction-api.service << EOF
[Unit]
Description=Construction Management API
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/construction-management-system/backend
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/gunicorn app.main:app -c gunicorn.conf.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 서비스 시작
sudo systemctl daemon-reload
sudo systemctl start construction-api
sudo systemctl enable construction-api
```

#### 4. Nginx 설정

```nginx
# /etc/nginx/sites-available/construction-management
server {
    listen 80;
    server_name your-domain.com;

    # API 프록시
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # React 정적 파일
    location / {
        root /path/to/construction-management-system/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # PDF 다운로드 최적화
    location ~* \.(pdf)$ {
        expires 1h;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 5. 프론트엔드 빌드 및 배포

```bash
cd frontend

# 프로덕션 빌드
npm run build

# 빌드된 파일을 웹서버 디렉토리로 복사
sudo cp -r build/* /var/www/html/
```

### Docker를 이용한 배포

#### Dockerfile (백엔드)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Dockerfile (프론트엔드)

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: construction_db
      POSTGRES_USER: construction_user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://construction_user:password@db:5432/construction_db
    depends_on:
      - db
    ports:
      - "8000:8000"

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 성능 최적화

#### 1. 데이터베이스 인덱스

```sql
-- 자주 조회되는 컬럼에 인덱스 생성
CREATE INDEX idx_work_logs_project_date ON work_logs(project_id, work_date);
CREATE INDEX idx_work_items_work_id ON work_items(work_id);
CREATE INDEX idx_invoices_project_period ON invoices(project_id, period_from, period_to);
```

#### 2. Redis 캐싱 (선택사항)

```python
# requirements.txt에 추가
redis==4.5.4
```

```python
# app/cache.py
import redis
from typing import Optional
import json

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def cache_cost_summary(project_id: int, period_from: str, period_to: str, data: dict):
    key = f"cost_summary:{project_id}:{period_from}:{period_to}"
    redis_client.setex(key, 3600, json.dumps(data))  # 1시간 캐시

def get_cached_cost_summary(project_id: int, period_from: str, period_to: str) -> Optional[dict]:
    key = f"cost_summary:{project_id}:{period_from}:{period_to}"
    cached = redis_client.get(key)
    return json.loads(cached) if cached else None
```

### 보안 설정

#### 1. HTTPS 설정 (Let's Encrypt)

```bash
# Certbot 설치
sudo apt install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d your-domain.com

# 자동 갱신 설정
sudo crontab -e
# 추가: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### 2. 방화벽 설정

```bash
# UFW 방화벽 설정
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

#### 3. API 보안 헤더

```python
# app/main.py에 추가
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

app.add_middleware(TrustedHostMiddleware, allowed_hosts=["yourdomain.com", "*.yourdomain.com"])
app.add_middleware(HTTPSRedirectMiddleware)
```

### 모니터링 및 로깅

#### 1. 로그 설정

```python
# app/logging_config.py
import logging
from logging.handlers import RotatingFileHandler

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            RotatingFileHandler('app.log', maxBytes=10000000, backupCount=5),
            logging.StreamHandler()
        ]
    )
```

#### 2. 헬스체크 엔드포인트

```python
# app/main.py에 추가
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }
```

### 백업 전략

#### 1. 데이터베이스 백업

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump construction_db > $BACKUP_DIR/construction_db_$DATE.sql
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete  # 7일 이상된 백업 삭제
```

#### 2. 파일 백업 (첨부파일, PDF 등)

```bash
#!/bin/bash
# 파일 백업
tar -czf /backups/files_$(date +%Y%m%d).tar.gz /path/to/upload/directory
```

### 장애 대응

#### 1. 서비스 재시작

```bash
# API 서버 재시작
sudo systemctl restart construction-api

# Nginx 재시작  
sudo systemctl restart nginx

# PostgreSQL 재시작
sudo systemctl restart postgresql
```

#### 2. 로그 확인

```bash
# API 서버 로그
sudo journalctl -u construction-api -f

# Nginx 로그
sudo tail -f /var/log/nginx/error.log

# PostgreSQL 로그
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

이 가이드를 참고하여 안정적이고 확장 가능한 프로덕션 환경을 구축할 수 있습니다.