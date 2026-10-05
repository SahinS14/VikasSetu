FROM python:3.11-slim

# Install system dependencies needed for OpenCV and InsightFace
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency definition and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download buffalo_sc (MobileFaceNet + det_500m = ~14.5MB weights, ~108MB RAM at runtime)
RUN python -c "from insightface.app import FaceAnalysis; FaceAnalysis(name='buffalo_sc', allowed_modules=['detection', 'recognition'], providers=['CPUExecutionProvider']).prepare(ctx_id=-1, det_size=(320, 320))"

# Invalidate cache for service code to ensure fresh build on Render
ARG CACHEBUST=20260912_v6
COPY service.py .
COPY demo.py .
COPY enrolled.pkl .

ENV PORT=8000
ENV PYTHONUNBUFFERED=1
ENV WEB_CONCURRENCY=1
ENV OMP_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
EXPOSE 8000

CMD ["python", "service.py"]
