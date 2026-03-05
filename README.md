# 企业制度查询平台

上传制度文档，AI 智能问答，帮助员工快速了解公司制度和流程。

## 部署到 Vercel

### 第一步：部署项目

1. Fork 或 Clone 本仓库
2. 访问 https://vercel.com 并登录
3. 点击 "Add New Project"
4. Import 本仓库
5. 点击 Deploy 完成部署

### 第二步：配置 AI 功能（必须）

部署完成后，AI 问答功能需要配置 API Key 才能使用：

#### 1. 获取豆包 API Key

1. 访问 [火山引擎控制台](https://console.volcengine.com/ark)
2. 注册/登录火山引擎账号
3. 开通「豆包大模型」服务（有免费额度）
4. 点击左侧「API Key 管理」→「创建 API Key」
5. 复制生成的 API Key

#### 2. 在 Vercel 中配置环境变量

1. 打开你的 Vercel 项目
2. 点击 **Settings** → **Environment Variables**
3. 添加新的环境变量：
   - **Name**: `DOUBAO_API_KEY`
   - **Value**: 粘贴你刚才复制的 API Key
4. 点击 **Save**

#### 3. 重新部署

配置完成后，需要重新部署才能生效：
1. 点击 **Deployments** 标签
2. 找到最新的部署记录，点击右侧的三个点 **...**
3. 选择 **Redeploy**

## 本地开发

```bash
# 安装依赖
pnpm install

# 创建 .env.local 文件并配置 API Key
echo "DOUBAO_API_KEY=你的API_Key" > .env.local

# 启动开发服务器
pnpm dev
```

## 功能

- 📤 上传 Word/PDF/TXT/Markdown 制度文档（自动解析内容）
- 🤖 AI 智能问答（基于上传的文档内容）
- 🔍 文档搜索和分类
- 📱 响应式设计，支持手机访问

## 支持的文档格式

| 格式 | 支持情况 |
|------|---------|
| PDF | ✅ 自动提取文字 |
| Word (.doc/.docx) | ✅ 自动提取文字 |
| TXT | ✅ 直接读取 |
| Markdown | ✅ 直接读取 |

## 常见问题

### Q: AI 不回答问题怎么办？

请检查：
1. 是否已在 Vercel 环境变量中配置 `DOUBAO_API_KEY`
2. 配置后是否已重新部署项目
3. API Key 是否有效（可以在火山引擎控制台查看）

### Q: 上传 PDF/Word 后内容为空？

部分 PDF 可能是扫描件（图片形式），无法直接提取文字。建议：
- 使用可复制的 PDF 文档
- 或将内容复制后保存为 TXT 文件上传
