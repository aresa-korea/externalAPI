#!/bin/bash
# deploy.sh

# 원격 서버 정보 설정
REMOTE_HOST="110.10.34.34"
REMOTE_USER="externalapi"
REMOTE_DIR="/home/externalapi/external-api"

# 빌드된 파일을 원격 서버로 복사
scp -P 3323 -r ./dist ./package.json ./package-lock.json .env.prod ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}

# 원격 서버에서 압축 해제 명령어 실행 (옵션)
ssh -p 3323 ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_DIR} && npm install && pm2 restart external-api"

