# Research Workspace V1 - MVP

这是一个本地优先的研究资料工作台 MVP。

## 目录内容

- `Research_Workspace_MVP_Demo.html`: 单文件 HTML 演示版，可直接双击打开查看 UI。
- `src/`: Next.js 源代码。
- `prisma/`: 数据库模型和迁移文件。
- `workspace-data/`: 本地数据存储目录（包含 SQLite 数据库和上传的文件）。

## 如何在本地运行完整版

1. **环境准备**: 确保已安装 Node.js (v18+)。
2. **安装依赖**:
   ```bash
   npm install
   ```
3. **初始化数据库**:
   ```bash
   npx prisma migrate dev
   ```
4. **启动应用**:
   ```bash
   npm run dev
   ```
5. **访问地址**: 打开浏览器访问 `http://localhost:3000`

## 核心功能

- **资源管理**: 支持上传本地文件 (PDF/Docx/TXT/MD)、添加网页链接、创建 Markdown 笔记。
- **自动标签**: 系统会根据标题和描述自动生成标签（如 AI, Research, Education 等）。
- **集合管理**: 可以创建不同的 Collection 来组织研究项目。
- **全局检索**: 毫秒级搜索所有资源标题和描述。

## 技术栈

- **Frontend**: Next.js (App Router), Tailwind CSS, Lucide Icons, Shadcn/UI
- **Backend**: Prisma ORM, SQLite (Local-first)
- **State**: React Hook Form, Zod
