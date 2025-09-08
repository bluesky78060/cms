# Node.js 18 Alpine 이미지 사용 (빌드 단계)
FROM node:18-alpine as builder

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY frontend/package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 소스 코드 복사
COPY frontend/ ./

# 프로덕션 빌드
RUN npm run build

# Nginx 이미지 사용 (실행 단계)
FROM nginx:alpine

# 빌드된 파일을 nginx 웹 서버 디렉토리로 복사
COPY --from=builder /app/build /usr/share/nginx/html

# nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/nginx.conf

# 80 포트 노출
EXPOSE 80

# nginx 실행
CMD ["nginx", "-g", "daemon off;"]