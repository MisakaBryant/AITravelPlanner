
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
