# 思维导图喵 - Cloudflare 实时协作版（无“大主题”按钮）

此版本以“连接修正版”为基础，移除“＋ 大主题”功能，恢复原来的：
- ＋ 子主题
- ＋ 同级
- 删除
- 图片、颜色、主题、导入导出
- Cloudflare Worker + Durable Objects + Yjs 实时协作
- `provider.wsconnected` 连接状态显示

Cloudflare Workers Builds：
- Root directory：留空（仓库根目录直接包含 package.json）
- Build command：留空
- Deploy command：`npx wrangler deploy`
- Worker 名称必须与 `wrangler.jsonc` 的 `name` 一致，目前为 `mindmap`

> 本版本只回滚“大主题”功能，不改变“连接修正版”的其余页面逻辑。
