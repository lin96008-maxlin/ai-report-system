# 腾讯云 Pages 部署指南

## 项目准备

✅ 项目已构建完成，生成的静态文件位于 `dist` 目录：
- `index.html` - 主页面文件
- `assets/` - 静态资源目录
  - `index-DAqmUL9R.js` - 主要JavaScript文件 (1.19MB)
  - `index-DqI-QcJq.css` - 样式文件 (18.9KB)
- `folder-icon.svg` - 图标文件

✅ 已创建腾讯云Pages配置文件 `cloudbase.json`

## 部署步骤

### 方法一：通过腾讯云控制台部署

1. **登录腾讯云控制台**
   - 访问 [腾讯云控制台](https://console.cloud.tencent.com/)
   - 登录您的腾讯云账号

2. **进入静态网站托管**
   - 搜索并进入「静态网站托管」服务
   - 或直接访问：https://console.cloud.tencent.com/tcb/hosting

3. **创建环境（如果没有）**
   - 点击「新建」创建云开发环境
   - 选择计费方式（按量付费或包年包月）
   - 记录环境ID，用于更新 `cloudbase.json` 配置

4. **上传文件**
   - 进入静态网站托管管理页面
   - 点击「上传文件」
   - 将 `dist` 目录下的所有文件上传到根目录

5. **配置域名**
   - 在「设置」中配置自定义域名（可选）
   - 或使用腾讯云提供的默认域名

### 方法二：使用CloudBase CLI部署

1. **安装CloudBase CLI**
   ```bash
   npm install -g @cloudbase/cli
   ```

2. **登录腾讯云**
   ```bash
   cloudbase login
   ```

3. **更新配置文件**
   - 编辑 `cloudbase.json` 文件
   - 将 `your-env-id` 替换为您的实际环境ID

4. **部署项目**
   ```bash
   cloudbase deploy
   ```

### 方法三：手动上传dist文件

1. **压缩dist目录**
   - 将 `dist` 目录下的所有文件打包成zip文件

2. **上传到腾讯云**
   - 在静态网站托管控制台选择批量上传
   - 上传zip文件并解压到根目录

## 配置说明

### cloudbase.json 配置文件
```json
{
  "envId": "your-env-id",  // 替换为您的环境ID
  "framework": {
    "name": "vite",
    "plugins": {
      "client": {
        "use": "@cloudbase/framework-plugin-website",
        "inputs": {
          "buildCommand": "npm run build",
          "outputPath": "dist",
          "cloudPath": "/"
        }
      }
    }
  }
}
```

## 注意事项

1. **环境ID获取**：在腾讯云控制台的云开发环境列表中可以找到
2. **文件大小**：确保单个文件不超过100MB
3. **域名配置**：如需自定义域名，需要进行域名备案
4. **HTTPS**：腾讯云Pages默认支持HTTPS
5. **缓存**：静态资源会被CDN缓存，更新后可能需要等待缓存刷新

## 费用说明

- 静态网站托管按存储空间和流量计费
- 新用户通常有免费额度
- 具体费用请参考腾讯云官方定价

## 部署后验证

1. 访问分配的域名
2. 检查页面是否正常加载
3. 测试各项功能是否正常
4. 检查控制台是否有错误信息

## 常见问题

1. **404错误**：检查文件路径是否正确
2. **资源加载失败**：检查静态资源路径配置
3. **部署失败**：检查环境ID和权限配置

---

部署完成后，您的智能报表维度管理系统将可以通过腾讯云Pages提供的域名访问。