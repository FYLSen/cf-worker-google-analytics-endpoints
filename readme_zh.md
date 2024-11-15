# GA4 代理 Worker

本项目是一个 Cloudflare Worker 脚本，用于作为 Google Analytics 4 (GA4) 数据收集的代理，并提供修改分析脚本行为的附加功能。脚本集成并修改了 [Minimal Analytics](https://github.com/jahilldev/minimal-analytics) 项目的轻量级分析脚本，以适应自定义需求。

## 功能

1. **GA4 数据代理**：
   - 将数据代理到 GA4 数据收集端点，并确保使用配置的 `MEASUREMENT_ID`。

2. **自定义分析脚本**：
   - 从 [Minimal Analytics](https://github.com/jahilldev/minimal-analytics) 项目获取分析脚本。
   - 修改脚本，将默认 GA4 端点替换为 Worker 的代理端点。
   - 添加备选逻辑以改进数据发送机制。

3. **CORS 支持**：
   - 处理跨域请求，包括预检 OPTIONS 请求。

4. **灵活数据处理**：
   - 支持 GET 和 POST 请求收集数据。
   - 提供多种备选方法发送分析数据。

5. **像素图响应**：
   - 对成功的 GET 请求返回透明的 1x1 图片，模拟传统的像素跟踪。

## 对原始脚本的修改

本项目集成了 [Jack Hill](https://github.com/jahilldev) 开发的 Minimal Analytics 项目，该项目使用 MIT 协议发布。修改内容包括：
- 将默认的 Google Analytics 端点替换为自定义代理端点。
- 添加备选逻辑以支持多种数据发送方式。

## 安装

1. **配置 Cloudflare Workers**：
   - 使用 Cloudflare 的仪表板或 Wrangler CLI 部署提供的脚本。

2. **环境变量**：
   - 在 Worker 环境中配置以下变量：
     - `MEASUREMENT_ID`：你的 Google Analytics 4 测量 ID。

## 使用

### 1. 代理分析数据
- 使用 GA4 所需的查询参数向 Worker URL 发送 GET 或 POST 请求，Worker 会将数据转发到 GA4 端点。

### 2. 提供修改后的分析脚本
- 在 Worker URL 后添加 `?fallback=true` 查询参数以获取修改后的分析脚本。

### 示例请求

#### 代理数据收集
```bash
curl -X POST https://<worker-url> \
  -H "Content-Type: application/json" \
  -d '{"tid":"G-XXXXXXX", "cid":"123456", "t":"event", "en":"test_event"}'
```

#### 获取修改后的脚本
```bash
curl https://<worker-url>?fallback=true
```

## 许可协议

本项目使用 [MIT 协议](LICENSE)发布。  
集成并修改了 [Jack Hill](https://github.com/jahilldev) 开发的 Minimal Analytics 项目，其同样使用 [MIT 协议](LICENSE)发布。