# 🎨 Nunjucks Template Preview

一个强大的在线 Nunjucks 模板预览工具，支持实时编辑、变量设置和多种渲染模式。

## ✨ 功能特性

- 🖥️ **实时预览**: 在左侧编辑模板，右侧实时查看渲染结果
- 🔧 **JSON 变量编辑**: 使用 JSON 格式统一管理所有模板变量
- 🎯 **语法高亮**: 使用 CodeMirror 提供舒适的编辑体验，支持 HTML 混合模式
- 📱 **响应式设计**: 完美适配桌面和移动设备
- ⚡ **零配置部署**: 一键部署到 Vercel
- 🛠️ **内置过滤器**: 包含日期格式化、货币格式化、文本高亮等实用过滤器
- 🎨 **多渲染模式**: 支持纯文本和 Markdown 两种预览模式
- 📋 **一键复制**: 快速复制模板代码或渲染结果
- 🚫 **智能错误处理**: 友好的错误提示和实时状态指示
- 🔍 **带行号预览**: 文本模式下提供带行号的代码预览

## 🚀 一键部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fzhanxin-xu%2Fnjk-render-online)

点击上面的按钮即可一键部署到 Vercel！

## 🔧 本地开发

### 环境要求

- Node.js 16+
- npm 或 yarn

### 安装步骤

1. 克隆项目

```bash
git clone https://github.com/zhanxin-xu/njk-render-online.git
cd njk-render-online
```

1. 安装依赖

```bash
npm install
```

1. 启动开发服务器

```bash
npm run dev
```

1. 打开浏览器访问 `http://localhost:3000`

## 📖 使用说明

### 基本用法

1. **编写模板**: 在左侧上方编辑器中输入 Nunjucks 模板代码
2. **设置变量**: 在左侧下方的 JSON 编辑器中设置模板变量
3. **选择渲染模式**: 在右侧预览区选择文本或 Markdown 渲染模式
4. **查看预览**: 右侧会实时显示渲染后的结果
5. **复制内容**: 使用复制按钮快速复制模板代码或渲染结果

### 操作技巧

- **自动变量检测**: 系统会自动检测模板中的变量并在 JSON 编辑器中提供默认值
- **JSON 语法检查**: 实时检查 JSON 语法，无效 JSON 会显示错误提示
- **实时渲染**: 编辑模板或变量时会自动触发重新渲染（300ms 防抖）
- **错误处理**: 模板语法错误会在预览区显示详细错误信息

### 示例模板

```html
<h1>Hello {{ name | default('World') }}!</h1>

{% if showList %}
<ul>
{% for item in items %}
  <li>{{ item.title }} - {{ item.description }}</li>
{% endfor %}
</ul>
{% endif %}

<p>Current time: {{ currentTime }}</p>
<p>Formatted date: {{ currentTime | formatDate('long') }}</p>
<p>Price: {{ 99.99 | currency('USD') }}</p>
```

### JSON 变量设置

使用 JSON 格式设置模板变量，支持复杂数据结构：

```json
{
  "name": "John Doe",
  "showList": true,
  "items": [
    {"title": "Item 1", "description": "First item"},
    {"title": "Item 2", "description": "Second item"}
  ],
  "currentTime": "2024-01-01T12:00:00Z"
}
```

### 内置过滤器

- `formatDate(format)`: 格式化日期
  - `'short'`: 短日期格式 (如: 1/1/2024)
  - `'long'`: 长日期格式 (如: Monday, January 1, 2024)
- `currency(code)`: 货币格式化，默认为 USD (如: $99.99)
- `highlight(query)`: 高亮文本中的关键词，用 `<mark>` 标签包围

### 渲染模式

- **文本模式**: 显示原始渲染结果，支持行号显示
- **Markdown 模式**: 将渲染结果作为 Markdown 格式化显示，支持标题、链接、代码块等

## 🏗️ 项目结构

```text
njk-rander/
├── public/
│   ├── index.html      # 主页面
│   ├── favicon.svg     # 网站图标
│   └── js/
│       └── app.js      # 前端应用逻辑
├── api/
│   └── render.js       # Vercel API 端点
├── package.json        # 项目配置和依赖
├── vercel.json         # Vercel 部署配置
└── README.md          # 项目说明
```

## 🔧 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **编辑器**: CodeMirror 5.65.2 (支持 HTML 混合模式和 Monokai 主题)
- **模板引擎**: Nunjucks 3.2.4
- **后端**: Vercel Serverless Functions (Node.js)
- **部署**: Vercel (支持函数超时配置)
- **依赖管理**: npm

## 🎨 界面特性

- **现代化设计**: 采用简洁现代的界面设计，支持深色编辑器主题
- **响应式布局**: 完美适配桌面和移动设备，移动端自动调整布局
- **语法高亮**: 支持 HTML/CSS/JavaScript 语法高亮
- **实时状态指示**: 显示渲染状态（就绪、渲染中、错误）
- **智能错误提示**: JSON 语法错误提示和模板渲染错误处理
- **iframe 预览**: 安全的 iframe 渲染环境，支持完整的 HTML 预览
- **复制功能**: 一键复制模板代码和渲染结果
- **JSON 错误可视化**: 实时 JSON 语法检查和错误高亮

## 🚀 部署选项

### Vercel (推荐)

1. Fork 这个项目到你的 GitHub
2. 在 Vercel 中导入项目
3. 点击部署即可

**部署配置特性**:

- 自动路由配置：静态文件和 API 路由
- Serverless 函数：`api/render.js` 配置 10 秒超时
- 自动 CORS 处理：支持跨域请求

### 其他平台

- **Netlify**: 支持，需要配置 Serverless Functions
- **Railway**: 支持，需要 Node.js 环境
- **Heroku**: 支持，需要添加 `start` 脚本

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Nunjucks](https://mozilla.github.io/nunjucks/) - Mozilla 的强大模板引擎
- [CodeMirror](https://codemirror.net/) - 优秀的代码编辑器
- [Vercel](https://vercel.com/) - 出色的部署平台
