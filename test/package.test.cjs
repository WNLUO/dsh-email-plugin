'use strict';

/**
 * 守卫：这个包**能被手机看见**的那几条判据。
 *
 * 这里没有功能可测，能测的都是「分发能不能成立」——而它一旦坏掉，症状是「装上了但手机
 * 里什么都没有」，从界面上完全看不出原因。所以逐条钉住：
 *
 *  一、`package.json` 里必须有 `dshMobileExtensions` 声明，且它指的那个目录真的在包里；
 *  二、目录里那份 `manifest.json` 得是宿主认的形状（入口页、版本、能力都是字符串）；
 *  三、入口页真的在、且固定叫 `index.html`；
 *  四、`files` 白名单必须把扩展目录带进 npm 包 —— 少一行，发出去的包里就没有它。
 *
 * 运行：node --test test/
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

/** 声明那一格指到哪儿（`true` 等于默认的 `extensions`）。 */
const declared = pkg.dshMobileExtensions === true ? 'extensions' : pkg.dshMobileExtensions;
const extRoot = path.join(ROOT, declared || 'extensions');
const extDir = path.join(extRoot, 'mail');

test('package.json 声明了 dshMobileExtensions，且指向包里真有的目录', () => {
  assert.equal(typeof declared, 'string', 'dshMobileExtensions 必须是字符串（或 true）');
  assert.ok(declared && !path.isAbsolute(declared), '声明必须是包内相对路径');
  assert.ok(fs.existsSync(extRoot), `声明指向的目录不存在：${declared}`);
});

test('扩展目录里有 manifest.json 与入口页 index.html', () => {
  assert.ok(fs.existsSync(path.join(extDir, 'manifest.json')), '缺 manifest.json');
  assert.ok(fs.existsSync(path.join(extDir, 'index.html')), '缺入口页 index.html');
});

test('manifest 的形状是手机认的那一套', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(extDir, 'manifest.json'), 'utf8'));
  assert.equal(typeof manifest.name, 'string', 'name 必须是字符串');
  assert.ok(manifest.name.trim().length > 0, 'name 不能为空');
  assert.equal(typeof manifest.version, 'string', 'version 必须是字符串');
  assert.equal(typeof manifest.apiVersion, 'string', 'apiVersion 必须是字符串');
  assert.ok(Array.isArray(manifest.capabilities), 'capabilities 必须是数组');
  for (const capability of manifest.capabilities) {
    assert.equal(typeof capability, 'string', 'capabilities 里每一项都得是字符串');
  }
});

test('右栏入口的名字不超过 10 个字（那一格只有 60 宽）', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(extDir, 'manifest.json'), 'utf8'));
  if (!manifest.entry) return;
  assert.equal(typeof manifest.entry.name, 'string');
  assert.ok([...manifest.entry.name].length <= 10, `入口名太长：${manifest.entry.name}`);
});

test('files 白名单把扩展目录带进 npm 包', () => {
  const files = pkg.files || [];
  assert.ok(
    files.some((entry) => entry === `${declared}/**` || entry === `${declared}/**/*` || entry === declared),
    `files 里没有 ${declared}/**，发出去的包里不会有扩展`,
  );
  assert.ok(files.includes('index.js'), 'files 里没有 index.js，宿主半身进不了包');
  assert.ok(files.includes('cordis.patch.yml'), 'files 里没有 cordis.patch.yml，插件装了也不会被挂载');
});

test('入口页不引外部资源（页面是不透明源，外链会被 CSP 挡掉）', () => {
  const html = fs.readFileSync(path.join(extDir, 'index.html'), 'utf8');
  assert.ok(!/src\s*=\s*["']https?:/i.test(html), '入口页里有外链 script/img');
  assert.ok(!/href\s*=\s*["']https?:/i.test(html), '入口页里有外链样式 / 链接');
});

test('入口页读外壳下发的深浅色（data-dsh-theme），不是自己另起一套', () => {
  // 这一页用 Appica UI 的整套 token 画（与插件面板同一套库），所以配色不落到 --dsh-theme-*
  // 那组变量上；它读的是外壳写的 `<html data-dsh-theme>`，再交给库的 ThemeProvider 强制那一档。
  // 判据就一条：产物里真的读了这个属性。
  const html = fs.readFileSync(path.join(extDir, 'index.html'), 'utf8');
  assert.ok(html.includes('data-dsh-theme'), '没有读外壳下发的深浅色');
});

test('入口页没有写死的深浅两套底色（配色交给主题系统）', () => {
  const css = fs.readFileSync(path.join(ROOT, 'web', 'src', 'index.css'), 'utf8');
  // 只有兜底那句允许出现颜色字面量；其余用 var(--…) 走主题 token。
  const stripped = css.replace(/var\([^)]*\)/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/background:\s*#(?!f{3,6}\b)/i.test(stripped), '样式里出现了写死的底色');
});

test('详情不画自己的返回顶栏（外壳已经有一颗，网页里再画就是两层）', () => {
  // 用户 2026-11-10 明确要求去掉详情顶部那条。这一页套在 App 外壳里，顶栏与返回键归外壳；
  // 「从详情回列表」用右滑手势，不再摆一颗按钮 —— 否则一屏里会有两个长得一样、作用不同的返回。
  const app = fs.readFileSync(path.join(ROOT, 'web', 'src', 'App.tsx'), 'utf8');
  assert.ok(!/← 返回/.test(app), '详情里又出现了「← 返回」那颗按钮');
  assert.ok(app.includes('onPointerDown') && app.includes('closeDetail'),
    '右滑返回的交互动效不见了');
});
