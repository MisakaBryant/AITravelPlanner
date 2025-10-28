# 部署与运行

## 一、环境准备

### 1. 数据库初始化（Supabase）
本项目使用 Supabase 作为数据库，请按以下步骤初始化：

1. 登录 [Supabase 控制台](https://supabase.com/dashboard)
2. 选择你的项目，点击左侧菜单 "SQL Editor"
3. 新建查询（New Query），复制 `backend/db/init.sql` 的全部内容并粘贴
4. 点击 "Run" 执行 SQL，自动创建 users、plans、records 三张表
5. **禁用 RLS（开发/测试环境）**：在 SQL Editor 执行以下语句
   ```sql
   ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.plans DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.records DISABLE ROW LEVEL SECURITY;
   ```
6. 在 Supabase Dashboard → Settings → API 中获取 `service_role key`

### 2. 配置环境变量（前后端均在运行时提供）
- 后端环境变量（运行时注入，见 docker-compose.yml → services.backend.environment）：
  ```env
  PORT=3001
  SUPABASE_URL=你的Supabase项目URL
  SUPABASE_KEY=你的Supabase service_role key
  OPENAI_API_KEY=你的大模型API Key
  OPENAI_MODEL=gpt-4o-mini # 或你所使用的模型
  OPENAI_BASE_URL=https://api.openai.com/v1 # 如使用第三方网关可自定义
  COOKIE_SECRET=用于签名token的随机字符串
  NODE_ENV=production
  ```
- 前端环境变量（运行时注入，容器启动时生成 `/env.js`，见 docker-compose.yml → services.frontend.environment）：
  ```env
  AMAP_KEY=你的高德Web端Key（公开型，前端可见）
  AMAP_JS_KEY=你的高德安全密钥 securityJsCode（公开型，前端可见）
  API_BASE=/api  # 可选，前端调用后端的反向代理路径
  ```
  说明：前端容器启动时会将 `frontend/public/env.template.js` 渲染为 `/usr/share/nginx/html/env.js`，`index.html` 动态读取该文件并用其中的 Key 载入高德 JS SDK。因此你可以在不重建镜像的情况下切换前端 Key。

## 二、本地开发
- 后端：
	```powershell
	cd backend
	npm install
	npm run dev
	```
- 前端：
	```powershell
	cd frontend
	npm install
	npm run dev
	```

## 三、Docker Compose 一键部署

项目已内置前后端 Dockerfile 与 Nginx 反向代理配置，支持“前后端都在运行时注入 Key”。无需在镜像构建时提供 Key。

1) 在项目根目录创建 `.env` 文件，示例：
```env
# Backend (runtime)
SUPABASE_URL=...
SUPABASE_KEY=...
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
COOKIE_SECRET=...

# Frontend (runtime)
AMAP_KEY=...
AMAP_JS_KEY=...
API_BASE=/api
```

2) 构建并启动：
```powershell
docker compose up -d --build
```

3) 访问：
- 前端：http://localhost:8080
- 后端健康检查：http://localhost:3001/api/health

说明：前端容器内置 Nginx，已将 `/api/*` 反向代理到后端容器 `backend:3001`，前端代码中的 `fetch('/api/...')` 可直接工作且保持 Cookie 透传，无需额外 CORS 配置。

## 四、CI/CD：使用 GitHub Actions 构建并推送镜像（GHCR）

仓库已包含工作流：`.github/workflows/docker-images.yml`，在 push 到 main 或手动触发时，会分别构建并推送前后端镜像到 GitHub Container Registry（GHCR）。

- 镜像名称（默认）：
  - 前端：`ghcr.io/<owner-lowercase>/aitravelplanner-frontend:latest`
  - 后端：`ghcr.io/<owner-lowercase>/aitravelplanner-backend:latest`
  - 同时推送 `sha-<GIT_SHA>` 标签用于可追溯发布

- 先决条件：
  1) 仓库 Settings → Actions → General，将“Workflow permissions”设为“Read and write permissions”；
  2) GHCR 仓库名需全小写。工作流已自动将 `${{ github.repository_owner }}` 转小写用于镜像 tag；
  3) 可选：将生成的 Package（GHCR 镜像）设为 Public 以便公开拉取；
  3) 如需推送到 Docker Hub，改用 `docker/login-action` 登录 Docker Hub，并配置仓库 Secrets：`DOCKERHUB_USERNAME`、`DOCKERHUB_TOKEN`，然后调整 workflow 中的 registry 与 tags。

- 构建时 lockfile（package-lock.json）说明：
  - 本仓库未提交 package-lock.json。工作流会在构建前为 `frontend/` 与 `backend/` 生成 lockfile（npm install --package-lock-only），随后 Dockerfile 若检测到 lockfile 即执行 `npm ci`；若未检测到则回退到 `npm install`。这既保证可复现性，也允许本地/私有环境直接构建。

- 手动触发：在 GitHub → Actions → Build and Publish Docker Images → Run workflow。

- 拉取与使用：
  ```powershell
  docker pull ghcr.io/<owner-lowercase>/aitravelplanner-frontend:latest
  docker pull ghcr.io/<owner-lowercase>/aitravelplanner-backend:latest
  ```

- 使用镜像运行（替换 docker-compose.yml 中的 build 为 image）：
  ```yaml
  services:
    backend:
  image: ghcr.io/<owner-lowercase>/aitravelplanner-backend:latest
      environment:
        - NODE_ENV=production
        - PORT=3001
        - SUPABASE_URL=${SUPABASE_URL}
        - SUPABASE_KEY=${SUPABASE_KEY}
        - OPENAI_API_KEY=${OPENAI_API_KEY}
        - OPENAI_MODEL=${OPENAI_MODEL}
        - OPENAI_BASE_URL=${OPENAI_BASE_URL}
        - COOKIE_SECRET=${COOKIE_SECRET}
      ports:
        - "3001:3001"
      restart: unless-stopped

    frontend:
  image: ghcr.io/<owner-lowercase>/aitravelplanner-frontend:latest
      environment:
        - AMAP_KEY=${AMAP_KEY}
        - AMAP_JS_KEY=${AMAP_JS_KEY}
        - API_BASE=/api
      depends_on:
        - backend
      ports:
        - "8080:80"
      restart: unless-stopped
  ```

### 推送到阿里云容器镜像服务（ACR）

工作流已内置“可选的 ACR 推送步骤”。如需启用：

1) 在仓库 Settings → Secrets and variables → Actions → New repository secret，新增以下 Secrets：
  - `ACR_REGISTRY`：你的 ACR 登录地址，例如 `registry.cn-hangzhou.aliyuncs.com`
  - `ACR_NAMESPACE`：你的 ACR 命名空间，例如 `myspace`（建议全小写）
  - `ACR_USERNAME`：你的 ACR 登录用户名（阿里云账号名或创建的访问凭证）
  - `ACR_PASSWORD`：你的 ACR 登录密码或访问凭证 Token

2) 重新触发工作流后，将额外推送以下镜像：
  - 前端：`${ACR_REGISTRY}/${ACR_NAMESPACE}/aitravelplanner-frontend:latest` 与 `:sha-<GIT_SHA>`
  - 后端：`${ACR_REGISTRY}/${ACR_NAMESPACE}/aitravelplanner-backend:latest` 与 `:sha-<GIT_SHA>`

3) 拉取示例：
```powershell
docker pull registry.cn-hangzhou.aliyuncs.com/<namespace>/aitravelplanner-frontend:latest
docker pull registry.cn-hangzhou.aliyuncs.com/<namespace>/aitravelplanner-backend:latest
```

注意：ACR 仓库名通常需要小写（namespace 与 repo 建议均小写）。如需改为仅推送 ACR，可删除 GHCR 登录与 push 步骤或将其置为条件执行。

# AITravelPlanner 项目说明

## 一、项目简介
AITravelPlanner 是一个基于 AI 的智能旅行规划 Web 应用，旨在简化旅行规划流程。用户通过语音或文字输入需求，系统自动生成个性化旅行路线、预算建议，并支持实时辅助和多设备同步。

## 二、核心功能
1. **智能行程规划**：支持语音和文字输入，自动生成包含交通、住宿、景点、餐饮等详细信息的个性化旅行路线。
2. **费用预算与管理**：AI 自动分析预算，记录并管理旅行开销，支持语音录入。
3. **用户管理与数据存储**：注册/登录系统，支持多份旅行计划管理，云端同步行程、偏好和费用数据。

## 三、技术栈选型
- 前端：React + Vite + TypeScript，UI 框架采用 Ant Design，地图组件集成高德地图 JS API。
- 后端：Node.js + Express，RESTful API 服务。
- 语音识别：科大讯飞 Web API（如需阿里云百炼平台可切换）。
- 地图服务：高德地图开放平台（可选百度地图）。
- 数据库与认证：Supabase（PostgreSQL + Auth），可选 Firebase。
- 行程规划与预算：调用大语言模型 API（如阿里云百炼、OpenAI、智谱等）。
- 云端同步：Supabase 或 Firebase 实现。
- 部署与容器化：Docker；CI/CD 使用 GitHub Actions 自动构建并推送镜像到 GHCR（可改为 Docker Hub）。
 

