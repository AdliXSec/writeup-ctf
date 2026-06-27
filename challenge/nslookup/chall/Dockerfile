FROM python:3.12-slim

WORKDIR /app

# Install dnsutils untuk nslookup
RUN apt-get update && apt-get install -y --no-install-recommends dnsutils && \
    rm -rf /var/lib/apt/lists/*

RUN echo "LEEXY{54fb3ec7adecdcb1930ef0528366b98e}" > /flag.txt

# Buat direktori uploads (exfiltration path)
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

ENV PORT=5001
EXPOSE 5001

CMD ["python", "app.py"]
