# 捏爆压力 - 部署指南

## 项目说明

这是一个纯前端静态网页游戏，无需后端，无需构建，可直接部署到任何静态托管服务。

### 部署到 GitHub Pages

1. 创建GitHub仓库（例如 `crush-stress`）
2. 将本项目所有文件推送到仓库：
```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/crush-stress.git
git push -u origin main
```
3. 在GitHub仓库 Settings > Pages > Source 选择 main 分支，保存
4. 几分钟后访问 `https://YOUR_USERNAME.github.io/crush-stress/`

### 部署到 Vercel

1. 将代码推送到GitHub仓库
2. 访问 [vercel.com](https://vercel.com)，用GitHub登录
3. 点击 "Add New" > "Project"，选择你的仓库
4. Framework Preset 选择 "Other"
5. 点击 Deploy

### 部署到 Netlify（最简单）

1. 访问 [netlify.com](https://netlify.com)
2. 直接拖拽整个项目文件夹到 Netlify 页面
3. 部署完成，获得访问链接

### 部署到 Cloudflare Pages

1. 将代码推送到GitHub仓库
2. 在Cloudflare Dashboard中创建Pages项目
3. 连接GitHub仓库，选择项目
4. 构建配置留空（纯静态），点击部署

## 注意事项

1. **HTTPS要求**：由于项目使用摄像头，所有部署必须使用HTTPS（上述平台均自动提供）
2. **CDN依赖**：项目依赖CDN加载Three.js和MediaPipe库，确保服务器能访问以下CDN：
   - `cdn.jsdelivr.net`
   - `fonts.googleapis.com`
3. **摄像头权限**：部署后需要用户手动允许摄像头权限
4. **浏览器兼容性**：推荐Chrome/Edge 90+

## 本地测试

需要本地服务器才能使用摄像头，直接打开HTML文件不行。可以使用：

```bash
# 方法1：Python
python -m http.server 8080

# 方法2：Node.js (需全局安装)
npx serve

# 方法3：VS Code Live Server 插件
```

然后通过 `http://localhost:8080` 访问（部分浏览器localhost也支持摄像头）

## 项目文件结构

```
├── index.html
├── css/
│   └── style.css
└── js/
    ├── main.js
    ├── background.js
    ├── handTracker.js
    ├── propSystem.js
    ├── effectSystem.js
    └── collision.js
```

所有文件都需要上传，缺一不可。
