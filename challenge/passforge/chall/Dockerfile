FROM python:3.12-slim

WORKDIR /app

# Flag dan proof file sesuai README
RUN echo "LEEXY{passforge_placeholder_flag}" > /flag.txt && \
    echo "PROOF{passforge_placeholder_proof}" > /proof.txt

# State directory sesuai README: /opt/ad/state
RUN mkdir -p /opt/ad/state

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY service.py .
COPY workspace.py .

# Copy static frontend
COPY static/ ./static/

ENV PORT=8120
ENV AD_STATE_DIR=/opt/ad/state
EXPOSE 8120

CMD ["python", "service.py"]
