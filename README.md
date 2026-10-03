# 思维导图喵 · Cloudflare 实时协作版

这个版本**基于“连接修正版”继续修改**，保留原来的界面与功能，只修复多人协作时“一个人编辑会把另一个人新增内容覆盖掉”的问题。

## 本次关键修复

之前 `yNodes` 使用的是：

```text
nodeId -> 普通 JavaScript 对象
```

修改一个字段时，会重新 `set()` 整个对象，因此并发编辑可能把另一个客户端刚更新的 `childrenIds` 覆盖掉。

现在改成：

```text
nodeId -> Y.Map
           ├─ text
           ├─ color
           ├─ img
           ├─ collapsed
           └─ childrenIds -> Y.Array
```

这样修改文字/颜色/图片等字段不会覆盖其他人的节点关系；新增同级或子主题时，父节点的 `childrenIds` 使用 CRDT `Y.Array` 追加/插入。

## 兼容旧房间

如果房间里还保存着旧版的“普通对象节点”，页面会自动转换成新的 `Y.Map` 结构。为了避免旧版本和新版本客户端同时编辑同一个房间，建议部署完成后让所有用户刷新到同一个版本。

## Cloudflare Workers Builds

仓库根目录直接包含：

```text
package.json
wrangler.jsonc
public/index.html
src/index.ts
```

Workers Builds：

- Root directory：留空
- Build command：留空
- Deploy command：`npx wrangler deploy`
- Production branch：`main`

Worker 名称是 `mindmap`，与 `wrangler.jsonc` 保持一致。
