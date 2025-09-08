# 🚀 GitHub 설정 가이드

## ✅ 준비된 GitHub 설정 파일들

현재 프로젝트가 GitHub에서 사용할 수 있도록 모든 필수 파일들이 준비되어 있습니다:

- **`.gitignore`** - 불필요한 파일들 제외 설정
- **`.gitattributes`** - 파일 속성 및 LFS 설정
- **`.github/workflows/docker-build.yml`** - GitHub Actions CI/CD 파이프라인
- **`README.md`** - GitHub 저장소 메인 페이지 (한국어)
- **Docker 관련 파일들** - 배포를 위한 컨테이너 설정

## 🚀 GitHub 저장소 생성 및 업로드 방법

### 1단계: GitHub에서 새 저장소 생성
1. https://github.com/new 접속
2. 저장소 이름: `construction-management-system`
3. Public 또는 Private 선택
4. **README, .gitignore 추가 체크 해제** (이미 프로젝트에 있음)
5. "Create repository" 클릭

### 2단계: 로컬에서 Git 초기화 및 업로드
프로젝트 폴더에서 다음 명령어들을 순서대로 실행하세요:

```bash
# Git 저장소 초기화
git init

# 모든 파일 추가
git add .

# 첫 번째 커밋 생성
git commit -m "Initial commit: 건설 청구서 관리 시스템"

# 기본 브랜치를 main으로 설정
git branch -M main

# 원격 저장소 연결 (YOUR_USERNAME을 실제 GitHub 사용자명으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/construction-management-system.git

# 코드 업로드
git push -u origin main
```

### 3단계: GitHub Secrets 설정 (선택사항)
Docker Hub 자동 배포를 원하는 경우:

1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. 다음 secrets 추가:
   - `DOCKER_USERNAME`: Docker Hub 사용자명
   - `DOCKER_PASSWORD`: Docker Hub 액세스 토큰

## 🎯 GitHub 활용 기능

### 자동 빌드/테스트
- 코드 푸시시 자동으로 Docker 이미지 빌드
- 테스트 실행 및 결과 확인
- 빌드 상태 배지가 README에 표시됨

### 이슈 관리
- 버그 신고 및 기능 요청 관리
- 작업 진행 상황 추적

### 릴리스 관리
- 버전별 릴리스 노트 작성
- 배포용 압축 파일 첨부

### 협업 기능
- Pull Request를 통한 코드 리뷰
- 브랜치별 개발 진행

## 📝 추가 팁

### 정기적인 커밋
```bash
git add .
git commit -m "기능 설명"
git push
```

### 브랜치 활용
```bash
# 새 기능 개발용 브랜치
git checkout -b feature/새기능

# 개발 완료 후 메인 브랜치로 병합
git checkout main
git merge feature/새기능
```

### 태그를 통한 버전 관리
```bash
git tag v1.0.0
git push --tags
```

## 🆘 문제 해결

### 업로드 실패시
```bash
# 강제 푸시 (주의: 기존 데이터 손실 가능)
git push -f origin main
```

### 대용량 파일 문제
- Git LFS 설정이 `.gitattributes`에 이미 포함됨
- 필요시 추가 파일 형식을 LFS에 추가 가능

이제 GitHub에서 코드 관리, 이슈 추적, 자동 빌드/배포가 모두 가능합니다! 🎉