import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * 邮箱扩展页的构建 / 开发配置。
 *
 * 构建产物必须落成**一个自包含的 HTML 文件**（`../extensions/mail/index.html`）：扩展页从
 * 手机本地 `file://` 加载，没有任何静态资源目录可以指望，脚本、样式都得内联进那一个文件。
 * `assetsInlineLimit` 拉到最大 + `cssCodeSplit: false`，再由 `scripts/inline.mjs` 把
 * 外链的 js / css 塞进去。
 *
 * 开发服务器（`pnpm dev`）只给「用浏览器打开看效果」用，不连任何宿主：这一版还没有后端，
 * 数据是页面里的一份演示数据。所以这里不配 `/api` 代理 —— 配了反而会在演示时糊里糊涂
 * 打到不该打的地方。
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../extensions/mail',
    emptyOutDir: false,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
  },
  server: {
    host: '127.0.0.1',
    port: 5288,
    strictPort: true,
  },
})
