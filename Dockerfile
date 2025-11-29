FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100 \
    AIOHTTP_NO_EXTENSIONS=1 \
    DOCKER=true \
    GIT_PYTHON_REFRESH=quiet

# Установка системных зависимостей (ffmpeg, git, компиляторы)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    ffmpeg \
    gcc \
    git \
    libavcodec-dev \
    libavdevice-dev \
    libavformat-dev \
    libavutil-dev \
    libcairo2 \
    libmagic1 \
    libswscale-dev \
    openssl \
    openssh-server \
    python3-dev \
    # Node.js нужен для некоторых модулей
    && curl -sL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    # Чистка кэша apt для уменьшения веса образа
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Рабочая директория
WORKDIR /data/Heroku

# 1. Сначала копируем requirements, чтобы кэшировать установку зависимостей
COPY requirements.txt .
RUN pip install --no-warn-script-location --no-cache-dir -U -r requirements.txt

# 2. Копируем остальной код (из текущей папки в контейнер)
COPY . .

EXPOSE 8080

# Запуск
CMD ["python3", "-m", "heroku", "--root"]