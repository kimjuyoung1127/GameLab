# GameLab FastAPI 백엔드 — Railway 배포용
FROM python:3.12-slim

# ffmpeg(MP3/M4A 변환, ffprobe 메타데이터) + libsndfile1(soundfile 라이브러리)
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg libsndfile1 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 앱 코드 + 분석 설정 복사
COPY app/ ./app/
COPY config/ ./config/

# 업로드 디렉토리 생성 (Railway에서는 ephemeral)
RUN mkdir -p ./uploads

# Railway가 PORT를 동적 주입; 기본값 8000
ENV PORT=8000
EXPOSE ${PORT}

# shell form으로 $PORT 변수 치환
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
