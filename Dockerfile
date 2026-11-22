FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends espeak-ng && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt ./
RUN python -m pip install --no-cache-dir -r requirements.txt
COPY server.py download_models.py ./
COPY index.html app.js style.css vad.js ./web/
ENV HOST=0.0.0.0 MODELS=/models MODEL_THREADS=1 PYTHONUNBUFFERED=1
RUN python download_models.py
EXPOSE 8080
CMD ["python", "server.py"]
