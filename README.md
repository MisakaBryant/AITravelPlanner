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

## 二、拉取镜像

使用以下命令拉取前后端镜像：

```bash
docker pull <your-registry>/aitravelplanner-frontend:latest
docker pull <your-registry>/aitravelplanner-backend:latest
```

## 三、启动容器

启动前后端容器时请指定必要的环境变量

- 启动后端：
```powershell
docker run -d --name aitravel-backend -p 3001:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e SUPABASE_URL=supabase_URL \
  -e SUPABASE_KEY=supabase_KEY \
  -e OPENAI_API_KEY=openai_API_KEY \
  -e OPENAI_MODEL=gpt-4o-mini \
  -e COOKIE_SECRET=change_me \
  ghcr.io/<owner-lowercase>/aitravelplanner-backend:latest
```

- 启动前端：
```powershell
docker run -d --name aitravel-frontend -p 8080:80 \
  --link aitravel-backend:backend \
  -e AMAP_KEY=你的高德Web端Key \
  -e AMAP_JS_KEY=你的高德安全密钥 \
  -e API_BASE=/api \
  ghcr.io/<owner-lowercase>/aitravelplanner-frontend:latest
```

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
- 语音识别：浏览器 API。
- 地图服务：高德地图开放平台。
- 数据库与认证：Supabase（PostgreSQL + Auth）。
- 行程规划与预算：调用大语言模型 API（腾讯混元）。
- 云端同步：Supabase 实现。
- 部署与容器化：Docker；CI/CD 使用 GitHub Actions 自动构建并推送镜像到 GHCR（同步推送到阿里云）。
 

