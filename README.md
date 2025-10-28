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

## 四、CI/CD
- 推荐使用 GitHub Actions 自动构建并推送 Docker 镜像到阿里云镜像仓库。
- 可参考官方文档或在 `.github/workflows/` 下自定义 workflow。

## 五、API Key 配置说明
- 请勿将 key 写入代码，统一放在 `config/.env` 或前端 `.env` 文件。
- 如需助教批改，建议提供阿里云百炼平台可用 key 并注明有效期。

---
如需详细开发文档、API Key 获取方式、CI/CD 配置等，可参考本项目后续补充内容。

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
- 部署与容器化：Docker，支持一键部署，CI/CD 使用 GitHub Actions 自动打包并推送至阿里云镜像仓库。

## 四、部署与运行
1. **环境准备**：需配置 API Key（语音识别、地图、AI），建议通过 `.env` 或 `config.json` 文件管理，切勿写入代码。
2. **本地运行**：
	- 前端：`npm install && npm run dev`
	- 后端：`npm install && npm run start`
3. **Docker 部署**：
	- 构建镜像：`docker build -t aitravelplanner .`
	- 运行容器：`docker run -p 80:80 --env-file .env aitravelplanner`
4. **云端部署**：通过 GitHub Actions 自动构建并推送至阿里云镜像仓库。

## 五、API Key 配置说明
- 请将所有 API Key 配置在 `.env` 或 `config.json` 文件中，并在 README 中注明 key 的获取方式和有效期。
- 若使用阿里云百炼平台，请在 README 中提供助教可用的 key，并保证 3 个月内有效。

## 六、GitHub 提交规范
- 每个功能模块开发完成后，进行一次规范化 commit。
- commit message 示例：
  - feat: 完成智能行程规划功能
  - fix: 修复语音识别接口异常
  - docs: 更新 README 部署说明
- 保留详细的开发过程提交记录。

## 七、PDF 提交要求
- 提交 PDF 文件，包含 GitHub 仓库地址和完整 README 文档。

---
> 如需详细开发文档、API Key 获取方式、Dockerfile 示例、CI/CD 配置等，可参考本项目后续补充内容。
