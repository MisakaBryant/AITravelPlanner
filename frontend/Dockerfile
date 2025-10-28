# Frontend Dockerfile: Vite build + Nginx serve
# --- Builder stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# Pass Vite envs at build time (AMap keys). They must start with VITE_ to be injected.
ARG VITE_AMAP_KEY
ARG VITE_AMAP_JS_KEY
ENV VITE_AMAP_KEY=${VITE_AMAP_KEY}
ENV VITE_AMAP_JS_KEY=${VITE_AMAP_JS_KEY}

# Install deps
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source and build
COPY . .
RUN npm run build

# --- Runtime stage ---
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Replace default nginx config with our SPA + API proxy config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist/ ./

# Install tools for runtime env injection and add entrypoint
RUN apk add --no-cache bash gettext
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Nginx will listen on 80 by default
EXPOSE 80

ENV API_BASE=/api

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
