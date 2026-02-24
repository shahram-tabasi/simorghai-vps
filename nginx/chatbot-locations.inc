# =======================================================================
# Chatbot Location Blocks
# =======================================================================

# React Frontend
location / {
    proxy_pass http://frontend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_cache_valid 200 7d;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

# Authentication API
location /api/auth/ {
    limit_req zone=api_limit burst=30 nodelay;
    rewrite ^/api/auth/(.*) /auth/$1 break;
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

# Backend API
location /api/ {
    limit_req zone=api_limit burst=30 nodelay;
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_buffering off;
    proxy_cache off;
    add_header X-Accel-Buffering "no" always;
    proxy_connect_timeout 300s;
    proxy_send_timeout 600s;
    proxy_read_timeout 600s;
    client_max_body_size 100M;
}

# STT API
location /api/stt/ {
    limit_req zone=upload_limit burst=10 nodelay;
    rewrite ^/api/stt/(.*) /$1 break;
    proxy_pass http://stt_service;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    client_max_body_size 50M;
    client_body_timeout 120s;
    proxy_connect_timeout 30s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;
}

# STT WebSocket
location /api/stt/ws/ {
    rewrite ^/api/stt/ws/(.*) /ws/$1 break;
    proxy_pass http://stt_service;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_connect_timeout 60s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
}

# TTS API
location /api/tts/ {
    limit_req zone=api_limit burst=10 nodelay;
    rewrite ^/api/tts/(.*) /$1 break;
    proxy_pass http://tts_service;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_connect_timeout 30s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

# Health checks
location /health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
}

location /api/health {
    access_log off;
    proxy_pass http://backend/health;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_connect_timeout 5s;
    proxy_send_timeout 5s;
    proxy_read_timeout 5s;
}
