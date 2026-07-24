FROM python:3.10-slim

WORKDIR /app

# Install dependencies and Playwright's chromium
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN playwright install --with-deps chromium

COPY . .

EXPOSE 8000

# Start the vulnerable Flask app
CMD ["python3", "app.py"]
