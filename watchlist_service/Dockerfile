# =========================
# 1. Builder Stage
# =========================
FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip \
    && pip install --prefix=/install --no-cache-dir -r requirements.txt


# =========================
# 2. Runtime Stage
# =========================
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /install /usr/local

COPY . .

RUN useradd -m appuser || true
RUN chmod +x prestart.sh && chown appuser:appuser prestart.sh

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD curl -f http://localhost:8000/api/v1/health/ || exit 1

CMD ["sh", "-c", "./prestart.sh && gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --timeout 30 --keep-alive 5"]