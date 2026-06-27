FROM python:3.12-slim

WORKDIR /app

RUN echo "LEEXY{7bcb6131d0c9f5e4e7e52f50073eeefd}" > /flag.txt

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

ENV PORT=5002
EXPOSE 5002

CMD ["python", "app.py"]
