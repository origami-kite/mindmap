# 思维导图喵 · Cloudflare 实时协作版

这个项目把原来的单文件思维导图页面改成了：

- Cloudflare Workers：托管网页 + WebSocket 入口
- Durable Objects：每个 room 一个协作实例
- y-durableobjects：Yjs WebSocket 协作与持久化
- Yjs / y-websocket：浏览器端 CRDT 实时同步
- IndexedDB：本地离线缓存

## GitHub → Cloudflare Workers Builds（推荐）

本项目不需要 GitHub Actions。直接把仓库连接到 Cloudflare Workers Builds 即可。

在 Cloudflare Dashboard：

1. Workers & Pages → 选择你的 Worker。
2. Settings → Builds → Connect Git。
3. Git repository 选择这个 GitHub 仓库。
4. Production branch 选择 `main`。
5. **Root directory 留空**（仓库根目录就是项目根目录）。
6. **Build command 留空**。如果你已经填了 `npm run build`，本项目现在也能执行成功，但不需要这个步骤。
7. Deploy command 填：

```text
npx wrangler deploy
```

8. 保存后重新触发一次 Build。

Cloudflare Workers Builds 当前是“可选 Build command → Deploy command”的流程；Deploy command 默认就是 `npx wrangler deploy`。Worker 使用的 Wrangler 版本由 `package.json` 决定。项目里的 Wrangler 已固定到 4.68.0。见：
https://developers.cloudflare.com/workers/ci-cd/builds/configuration/

## 非常重要：Worker 名称

`wrangler.jsonc` 里的：

```jsonc
"name": "mindmap-collab"
```

需要与你连接 Git 仓库的 Cloudflare Worker 名称保持一致。如果你现有 Worker 不是 `mindmap-collab`，请二选一：

- 在 Cloudflare Dashboard 把 Worker 名称改为 `mindmap-collab`；或
- 修改 `wrangler.jsonc` 中的 `name` 为你现有 Worker 的名称。

Cloudflare 官方把 Worker 名称不一致列为 Workers Builds 的常见失败原因。

## 项目结构

```text
mindmap-collab/
├─ public/
│  └─ index.html
├─ src/
│  └─ index.ts
├─ .nvmrc
├─ package.json
├─ tsconfig.json
├─ wrangler.jsonc
└─ README.md
```

## 本地部署

需要 Node.js 22：

```bash
npm install
npm run deploy
```

## 本地开发

```bash
npm run dev
```

## 协作方式

打开网站后会自动生成一个唯一房间。点击“🔗 分享”即可复制房间链接。

例如：

```text
https://your-worker.example.workers.dev/?room=room-abc123
```

两个人打开同一个 `?room=` 链接，就会进入同一个 Durable Object 房间并实时同步。

## 数据存储

Durable Object 使用 SQLite-backed storage。Cloudflare 当前推荐新建 Durable Object 使用 SQLite 存储。

## 如果 Build 仍然失败

进入：

`Workers & Pages → 你的 Worker → Deployment → View Build History → 点失败的那一次`

把日志中从第一条 `ERROR` 开始的 20～40 行贴出来。最常见的是：

- Worker 名称不一致
- Root directory 指到了错误目录
- Cloudflare 连接到了错误的 GitHub 仓库/分支
- Build command 填了不合适的命令
- 旧的 Build cache 导致依赖异常

Build cache 可以在 `Settings → Build → Build cache` 清空后重试。
