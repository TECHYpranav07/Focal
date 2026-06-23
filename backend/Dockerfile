FROM python:3.10-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive
ENV DEEPFACE_HOME=/root
ENV MALLOC_ARENA_MAX=2

WORKDIR /app

# Install system dependencies required for OpenCV, TensorFlow, and Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install python requirements
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Pre-download DeepFace model weights during build to prevent runtime download overhead and OOM crashes
RUN apt-get update && apt-get install -y --no-install-recommends wget ca-certificates && \
    mkdir -p /root/.deepface/weights && \
    wget -q https://github.com/serengil/deepface_models/releases/download/v1.0/arcface_weights.h5 -O /root/.deepface/weights/arcface_weights.h5 && \
    wget -q https://github.com/serengil/deepface_models/releases/download/v1.0/retinaface.h5 -O /root/.deepface/weights/retinaface.h5 && \
    wget -q https://github.com/opencv/opencv_3rdparty/raw/dnn_samples_face_detector_20170830/res10_300x300_ssd_iter_140000.caffemodel -O /root/.deepface/weights/res10_300x300_ssd_iter_140000.caffemodel && \
    wget -q https://github.com/opencv/opencv/raw/3.4.0/samples/dnn/face_detector/deploy.prototxt -O /root/.deepface/weights/deploy.prototxt && \
    wget -q https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx -O /root/.deepface/weights/face_detection_yunet_2023mar.onnx && \
    apt-get purge -y wget ca-certificates && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

# Copy backend source code
COPY . /app/

# Expose backend API port
EXPOSE 8000

# Run FastAPI backend app via run.py
CMD ["python", "run.py"]
