# ── Stage 1: Python backend ────────────────────────────────────
FROM python:3.11-slim AS backend

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

# ── Stage 2: Final image (nginx + Python) ─────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install nginx and supervisor
RUN apt-get update && apt-get install -y nginx supervisor && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy Python app and deps from build stage
COPY --from=backend /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend /app/app.py .

# Copy frontend files to nginx
COPY online_library.html /var/www/html/index.html
COPY online_library.css  /var/www/html/online_library.css
COPY online_library.js   /var/www/html/online_library.js
COPY online_library.png  /var/www/html/online_library.png

# Nginx config — serve frontend on :80, proxy /books to Flask :5000
RUN echo 'server { \n\
    listen 80; \n\
    root /var/www/html; \n\
    index index.html; \n\
    \n\
    location / { \n\
        try_files $uri $uri/ =404; \n\
    } \n\
}' > /etc/nginx/sites-available/default

# Supervisor config — run nginx + flask together
RUN echo '[supervisord]\n\
nodaemon=true\n\
\n\
[program:nginx]\n\
command=/usr/sbin/nginx -g "daemon off;"\n\
autorestart=true\n\
\n\
[program:flask]\n\
command=python /app/app.py\n\
autorestart=true\n\
stdout_logfile=/var/log/flask.log\n\
stderr_logfile=/var/log/flask_err.log\n\
' > /etc/supervisor/conf.d/supervisord.conf

# Expose both ports
EXPOSE 80 5000

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]