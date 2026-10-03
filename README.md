# 实时思维可视化：Cloudflare Workers + Durable Objects + Yjs

这个项目以“连接修正版”为基础，保留原来的页面、快捷键、图片、主题、导入/导出与房间分享功能，并修复多人协作时“前面的人一编辑，后加入的人节点被覆盖”的问题。

## 这版的关键修改

- 仍然使用当前 Worker 的 `/sync/<room>` WebSocket 路径。
- 保留 `y-websocket` 的 `wsconnected / wsconnecting / synced` 状态显示。
- 节点不再作为一个普通 JS 对象整体写入 Y.Map。
- 每个节点现在使用 `Y.Map` 保存字段，`childrenIds` 使用 `Y.Array`。
- 修改文字/颜色/图片/折叠状态时，不会顺手覆盖另一个人的最新 children 列表。
- `＋ 大主题` 永远在“中心主题”下创建一个新的一级主题。
- `＋ 子主题` 在当前选中节点下创建子主题。
- `＋ 同级` 在当前选中节点旁创建同级节点。
- 在线时等待首次远程同步后再初始化空房间，减少新人加入时初始化竞态。
- 兼容早期普通对象节点：旧节点在被编辑/新增关系时会逐步转换为共享类型。

## Cloudflare Workers Builds

GitHub 仓库根目录应该直接包含：

```text
package.json
wrangler.jsonc
public/
src/
```

Cloudflare Workers Builds 建议：

```text
Root directory: 留空（如果 package.json 在仓库根目录）
Build command: 留空
Deploy command: npx wrangler deploy
Production branch: main
```

项目里的 Worker 名称是 `mindmap`，请与 Cloudflare 中的 Worker 名称保持一致。

## 本地命令

```bash
npm install
npm run check
npm run deploy
```

## 多人测试

部署后打开：

```text
https://你的-worker.workers.dev/
```

页面会自动生成房间链接。点击“🔗 分享”，把相同链接发给朋友。

建议使用一个全新的 `room-...` 房间做并发测试，避免旧版本留下的数据结构影响结果。
