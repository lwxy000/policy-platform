# 企业制度查询平台

上传制度文档，AI 智能问答，帮助员工快速了解公司制度和流程。

## 功能特性

- 📤 **文档上传**：支持 Word、PDF、Excel、PPT 等格式
- 🤖 **智能问答**：AI 基于上传的文档回答问题
- 🔍 **快速搜索**：搜索已上传的制度文档
- 📱 **响应式设计**：支持手机、平板、电脑访问

## 技术栈

- Next.js 16 + React 19
- TypeScript
- Tailwind CSS
- shadcn/ui 组件库

## 部署到 Vercel

### 方法一：通过 Vercel 网站部署

1. 访问 https://vercel.com 并登录
2. 点击 "Add New" → "Project"
3. 选择 "Import Git Repository" 或直接上传项目文件夹
4. 点击 "Deploy" 即可自动部署

### 方法二：通过 Vercel CLI 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start
```

## 环境变量（可选）

如果需要使用 AI 问答功能，确保 Vercel 项目设置中已配置相关环境变量（通常自动配置）。

## 使用说明

1. 打开网页后，点击右上角 "上传制度" 按钮
2. 选择 Word、PDF 等格式的制度文档
3. 填写标题和分类，点击上传
4. 上传完成后，点击右下角聊天按钮向 AI 提问
