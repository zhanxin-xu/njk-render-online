# 🎨 Nunjucks Template Preview

一个在线预览 Nunjucks 模板的工具，支持实时编辑和变量设置。

## ✨ 功能特性

- 🖥️ **实时预览**: 在左侧编辑模板，右侧实时查看渲染结果
- 🔧 **智能变量检测**: 自动识别模板中的变量并生成输入表单
- 🎯 **语法高亮**: 使用 CodeMirror 提供舒适的编辑体验
- 📱 **响应式设计**: 支持桌面和移动设备
- ⚡ **零配置部署**: 一键部署到 Vercel
- 🛠️ **内置过滤器**: 包含日期格式化、货币格式化等实用过滤器

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
git clone <repository-url>
cd njk-render
```

2. 安装依赖

```bash
npm install
```

3. 启动开发服务器

```bash
npm run dev
```

4. 打开浏览器访问 `http://localhost:3000`

## 📖 使用说明

### 基本用法

1. **编写模板**: 在左侧编辑器中输入 Nunjucks 模板代码
2. **设置变量**: 系统会自动检测模板中的变量，在下方变量区域设置值
3. **查看预览**: 右侧会实时显示渲染后的结果

### 示例模板

```html
<h1>Hello {{ name | default('World') }}!</h1>

{% if showGreeting %}
<p>Welcome to our website!</p>
{% endif %}

{% if items %}
<ul>
{% for item in items %}
  <li>{{ item.title }} - {{ item.description }}</li>
{% endfor %}
</ul>
{% endif %}

<p>Current time: {{ currentTime | formatDate('long') }}</p>
```

### 内置过滤器

- `formatDate(format)`: 格式化日期
  - `'short'`: 短日期格式
  - `'long'`: 长日期格式
- `currency(code)`: 货币格式化，默认为 USD
- `highlight(query)`: 高亮文本中的关键词

### 变量类型支持

系统支持多种变量类型：

- **字符串**: 普通文本输入
- **数字**: 数值输入
- **布尔值**: `true` 或 `false`
- **数组/对象**: JSON 格式输入，支持复杂数据结构
- **日期时间**: 自动识别时间相关变量

## 🏗️ 项目结构

```text
njk-render/
├── index.html          # 主页面
├── js/
│   └── app.js          # 前端应用逻辑
├── api/
│   └── render.js       # Vercel API 端点
├── package.json        # 项目配置
├── vercel.json         # Vercel 部署配置
└── README.md          # 项目说明
```

## 🔧 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **编辑器**: CodeMirror
- **模板引擎**: Nunjucks
- **后端**: Vercel Serverless Functions
- **部署**: Vercel

## 🎨 界面特性

- **现代化设计**: 采用简洁现代的界面设计
- **响应式布局**: 适配桌面和移动设备
- **语法高亮**: 支持 HTML/CSS/JavaScript 语法高亮
- **状态指示**: 实时显示渲染状态
- **错误提示**: 友好的错误信息显示

## 🚀 部署选项

### Vercel (推荐)

1. Fork 这个项目到你的 GitHub
2. 在 Vercel 中导入项目
3. 点击部署即可

### 其他平台

- **Netlify**: 支持，需要配置 Functions
- **Railway**: 支持
- **Heroku**: 支持

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Nunjucks](https://mozilla.github.io/nunjucks/) - Mozilla 的强大模板引擎
- [CodeMirror](https://codemirror.net/) - 优秀的代码编辑器
- [Vercel](https://vercel.com/) - 出色的部署平台
