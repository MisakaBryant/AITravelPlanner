# Dockerfile for AITravelPlanner (multi-stage)

# 后端构建
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend .

# 前端构建
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend .
RUN npm run build

# 生产镜像
FROM node:20-alpine
WORKDIR /app
COPY --from=backend-build /app/backend ./backend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
COPY config ./config
ENV NODE_ENV=production
EXPOSE 3001

# 启动后端服务，前端静态文件建议用 nginx 或 serve 另行部署
CMD ["node", "backend/index.js"]
