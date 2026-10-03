# 🧠 思维导图喵 — Cloudflare 实时协作版

这是一个单页思维导图应用，使用 **Yjs + WebSocket + Cloudflare Durable Objects** 实现多人实时编辑。

## 这次修复了什么

之前的版本把整条节点记录作为普通 JavaScript 对象存进一个 Y.Map：

```text
node = {
  text,
  color,
  img,
  collapsed,
  childrenIds
}
```

当 A 修改 `text` 时，代码会把 A 当前看到的整条旧对象重新 `set()` 回去。如果 B 在这期间修改了 `childrenIds`，A 的旧 `childrenIds` 就会把 B 刚添加的节点关系覆盖掉。

现在 V2 数据模型改成：

```text
mindmap_nodes
└─ node-id → Y.Map
             ├─ text
             ├─ color
             ├─ img
             ├─ collapsed
             ├─ parentId
             └─ order
```

每个字段独立存储，并通过 `observeDeep()` 监听，因此 A 修改文字不会再顺手覆盖 B 新增节点的父子关系或排序字段。

## 房间与持久化

- 每个 `?room=` 对应一个 Durable Object 实例。
- Durable Object 首次进入空房间时创建默认思维导图。
- 浏览器端不使用 IndexedDB 来初始化房间。
- 旧版 `nodes` 数据会在首次同步后自动迁移到 V2。
- Durable Object 负责保存共享 Y.Doc 状态。

## GitHub + Cloudflare Workers Builds

仓库根目录需要直接包含：

```text
package.json
wrangler.jsonc
public/
src/
```

Cloudflare：

- Production branch: `main`
- Root directory: 留空
- Build command: 留空
- Deploy command: `npx wrangler deploy`

Worker 名称需要与 `wrangler.jsonc` 的 `name` 一致；当前项目使用 `mindmap`。

## 本地

```bash
npm install
npm run check
npm run deploy
```

## 测试实时协作

1. 打开网站，使用首页自动生成一个新的 `room-...` 链接。
2. 浏览器 A 打开该链接。
3. 浏览器 B 打开**完全相同**的链接。
4. A 添加节点，B 应立即看到。
5. B 添加一个子节点。
6. A 再修改其他节点的文字、颜色或折叠状态。
7. B 刚添加的节点不能因为 A 的修改而消失。

建议不要继续使用以前测试版本产生的旧 room 做验收，因为旧版本可能已经把错误数据结构写入房间；用新 room 最容易判断当前版本。

## 注意

图片目前仍以压缩后的 JPEG Data URL 写入 Yjs。少量图片没有问题，但大量高清图片会明显增加同步数据量；后续如需要可以把图片改成 Cloudflare R2 存储、Yjs 只保存 URL。
