FROM python:3.12-slim

WORKDIR /app

# Flag dan proof file sesuai README
RUN echo "LEEXY{wow_ur_so_good_at_forging_hashes_567657}" > /flag.txt && \
    echo "PROOF{wow_u_did_it_u_finally_forged_the_hashes_404}" > /proof.txt

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

RUN rm -f /flag.txt /proof.txt && ln -s /tmp/flag.txt /flag.txt && ln -s /tmp/proof.txt /proof.txt
