/**
 * 邮箱扩展页的入口。
 *
 * 扩展页在手机上是套在 App 统一外壳（顶栏 + 圆角卡）里的**一整块正文**，所以这一页只负责
 * 把卡片里那块填满，不画自己的顶栏、不画返回键 —— 那些归外壳。
 *
 * 主题：首屏的主题类必须在 React 之前挂上，不能等 `ThemeProvider` 里那个 SSR `<script>`
 * （浏览器不执行 innerHTML 写进去的内联脚本）。做法与插件面板一致：用库自己的生成器造一个
 * **真会跑**的脚本，赶在渲染前挂上。
 *
 * 数据：这一版还没有后端，列表与详情全部来自 `demo-data.ts`。接上接口时只换 `useMailbox`
 * 里那个取数函数，`types.ts` 的形状与页面都不用动。
 */
import { ThemeProvider, getThemeScript } from '@appica/ui-react/providers/theme-provider';
import { ToastProvider, Toaster } from '@appica/ui-react/toast';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import { App } from './App.tsx';

/** 这一页自己的主题键：与插件面板、与 DSH 网页版主界面都不共用。 */
const THEME_KEY = 'dsh-email-plugin-theme';

/**
 * 外壳下发的深浅色（`<html data-dsh-theme="light|dark">`）。
 *
 * 在 App 里打开时这一项一定有 —— 外壳按用户当前档位写上去。在浏览器里单独看（`pnpm dev`）
 * 时没有，返回空串，页面就走自己的存储 / 系统外观。**有它就以它为准**：用户在 App 里是夜间，
 * 这一页不能还是白的。
 */
const shellTheme = document.documentElement.getAttribute('data-dsh-theme') ?? '';

const bootTheme = document.createElement('script');
bootTheme.textContent = getThemeScript({
  storageKey: THEME_KEY,
  ...(shellTheme === 'light' || shellTheme === 'dark' ? { forcedTheme: shellTheme } : {}),
});
document.head.appendChild(bootTheme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <ThemeProvider
        storageKey={THEME_KEY}
        {...(shellTheme === 'light' || shellTheme === 'dark' ? { forcedTheme: shellTheme } : {})}
      >
        <App />
        <Toaster position="top-right" />
      </ThemeProvider>
    </ToastProvider>
  </StrictMode>,
);
