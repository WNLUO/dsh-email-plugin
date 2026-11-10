#!/usr/bin/env node
/**
 * 把本包里那份扩展拷到 `$DSH_HOME/extension-dev/mail/`，让手机边改边看。
 *
 * 手机那条调试路的入口是电脑上的一个固定目录（见移动端插件的 `extension-dev.js`）：
 * 一个子目录一个包、目录名即 slug。所以这里只做「清掉旧的、拷一份新的」，不做任何打包。
 *
 * 用法：
 *   node scripts/dev-install.mjs
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'extensions', 'mail');
const SLUG = 'mail';

/** `$DSH_HOME`：与宿主自己那套一致，默认 `~/.dsh`。 */
function dshHome() {
  const explicit = process.env.DSH_HOME;
  if (explicit && explicit.trim()) return path.resolve(explicit.trim());
  return path.join(os.homedir(), '.dsh');
}

const target = path.join(dshHome(), 'extension-dev', SLUG);

if (!fs.existsSync(path.join(SOURCE, 'index.html'))) {
  console.error(`找不到入口页：${path.join(SOURCE, 'index.html')}`);
  process.exit(1);
}

// 先删再拷：上一次多出来的文件（改名、删掉的资源）留着就会跟着一起下发。
fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });
fs.cpSync(SOURCE, target, { recursive: true });

console.log(`已拷到 ${target}`);
console.log('手机上：设置 → 扩展 → 本地开发（要先打开开发者模式），重新打开那一页。');
