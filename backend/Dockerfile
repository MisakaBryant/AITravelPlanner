# Backend Dockerfile: Node.js Express API
FROM node:20-alpine
WORKDIR /app

# Install deps first for better layer caching
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Environment variables are provided at runtime via docker-compose or docker run
# Example required envs:
# - PORT=3001
# - SUPABASE_URL=...
# - SUPABASE_KEY=...
# - OPENAI_API_KEY=...
# - OPENAI_MODEL=gpt-4o-mini (or your model)
# - OPENAI_BASE_URL=https://api.openai.com/v1 (optional if using default)
# - COOKIE_SECRET=your-secret
# - NODE_ENV=production

EXPOSE 3001
CMD ["node", "index.js"]
