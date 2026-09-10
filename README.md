# 音迹 · DJ 音标日课

24 天、48 个 DJ 音标：书写、朗读、记忆。进度保存在浏览器本地，服务器不需要数据库。

## 下载源码（不要走 Grok 预览）

预览窗口无法下载 zip。请用 GitHub：

**[点击下载 yinji-main.zip](https://github.com/jaydensho2008/yinji/archive/refs/heads/main.zip)**

或打开仓库后点绿色 **Code → Download ZIP**：  
https://github.com/jaydensho2008/yinji

---

## 部署到 Hostinger（推荐：接 GitHub）

这是 **Node.js** 应用，不要丢进 `public_html` 当 WordPress / 静态站。

1. 登录 [hPanel](https://hpanel.hostinger.com/)
2. **Websites → Add Website → Node.js web app**
3. 选 **Import from GitHub**（或 Git），授权后选仓库 `jaydensho2008/yinji`、分支 `main`
4. 填写：

| 项 | 值 |
|---|---|
| Node.js | **22** |
| 框架 | Other / Nitro |
| Build script | `build:node` |
| Output directory | `.output` |
| Entry file | `.output/server/index.mjs` |
| 环境变量 | `VITE_AUTH_ENABLED` = `false` |

5. Deploy，等构建完成。先用 Hostinger 临时域名确认能打开。

若这个域名已经建过 WordPress / 空站，先删掉再部署 Node 应用。

### 若只能上传 zip

1. 下载上面的 `yinji-main.zip`（不要解压后再零散拖进文件管理器）
2. Node.js web app → **Upload your files** → 选这个 zip
3. 其余设置同上

**不要**在文件管理器里点开 zip 预览。Hostinger 文件管理器打不开 zip，会显示「加载文件时发生错误」。应使用 Web Apps 的上传/部署，或先解压再上传文件夹。

---

## 把域名 huanxuanhealthcare.tech 从 Manus 改到 Hostinger

域名现在还指着 Manus（`cname.manus.space`），不改 DNS 会一直 503。

1. Hostinger 网站页 → **Connect domain** → 填 `huanxuanhealthcare.tech`，记下 **A 记录 IP**
2. 打开 Cloudflare → 该域名 → **DNS**
3. **删除** 指向 `cname.manus.space` 的 CNAME（`@` 和 `www`）
4. 添加：
   - `A` `@` → Hostinger 给的 IP，代理选 **DNS only（灰云）**
   - `A` 或 `CNAME` `www` → 同一 IP 或 `@`，同样灰云
5. 删掉旧的 AAAA（若有）
6. 保存。解析通常几分钟到几小时
7. 证书由 Hostinger 自动签发。若之后开 Cloudflare 橙云，SSL/TLS 选 **Full (strict)**

---

## 本地开发

需要 Node 22：

```bash
npm ci
npm run dev
```

生产构建（Hostinger / VPS 用这个，不要用 `npm run build`）：

```bash
npm run build:node
node .output/server/index.mjs
```
