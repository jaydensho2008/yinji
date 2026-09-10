# 从 Manus 迁到 Hostinger

音迹是 Node 应用，不要当 WordPress / 静态站传到 `public_html`。用 hPanel 的 **Node.js web app（Web Apps）**。

## 一、先在 Hostinger 上架应用

1. 登录 [hPanel](https://hpanel.hostinger.com/)
2. **Websites** → **Add Website** → **Node.js web app**
3. 选 **Upload your files**，上传 `yinji-hostinger.zip`（不要带 `node_modules`）
4. 部署设置请改成：

| 项 | 填 |
|---|---|
| Node.js | **22** |
| 框架 | **Other** 或 **Nitro** |
| Build script | `build:node` |
| Output directory | `.output` |
| Entry file | `.output/server/index.mjs` |
| 环境变量 | `VITE_AUTH_ENABLED` = `false` |

5. 点 **Deploy**，等构建完成。先用 Hostinger 给的临时域名确认能打开。

若这个域名已经在 Hostinger 建过网站（WordPress 空站也算），先删掉那个网站，再部署 Node 应用。

## 二、接上 huanxuanhealthcare.tech

1. 打开刚部署好的网站 → **Connect domain**
2. 填 `huanxuanhealthcare.tech`
3. 记下页面上的 **A 记录 IP**（或 Hostinger 要求的 CNAME）

## 三、改 DNS（把 Manus 拿掉）

域名现在走 Cloudflare，并 CNAME 到 `cname.manus.space`。不改 DNS，网站会一直是 Manus 的 503。

**推荐：继续用 Cloudflare 管 DNS**（只改记录，不改 nameserver）

1. 打开 Cloudflare → 该域名 → **DNS**
2. **删除** 指向 `cname.manus.space` 的 CNAME（`@` 和 `www` 都要看一眼）
3. 按 Hostinger 页面添加：
   - `A` `@` → Hostinger 给的 IP，代理先选 **DNS only（灰云）**
   - `A` 或 `CNAME` `www` → 同一 IP 或 `@`，同样灰云
4. 删掉旧的 AAAA（若有）
5. 保存。解析通常几分钟到几小时

**或者：把 nameserver 改成 Hostinger**

在域名注册商处把 NS 改成 hPanel **Connect domain** 里显示的那一组（常见是 `ns1.dns-parking.com` / `ns2.dns-parking.com`）。  
若域名是在 **Cloudflare Registrar** 买的，**不能**改 nameserver，只能用上面的 A 记录方案。

## 四、证书

域名连上后，Hostinger 会自动上 SSL。Cloudflare 若之后开橙云，SSL/TLS 选 **Full (strict)**。

## 五、不要做的事

- 不要把文件丢进 `public_html` 当静态站
- 不要保留 Manus 的 CNAME
- 不要用 `npm run build`（那是 Vercel 用的）；Hostinger 必须跑 `build:node`
