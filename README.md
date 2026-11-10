# dsh-email-plugin

邮箱插件（DeepSeek Harness / dsh）：把邮件接进 DSH 手机 App 的邮箱页。

装了这个插件，他那台电脑上就多了一份「给手机用的扩展」；手机连上电脑后，App 的扩展页里
会出现「邮箱」这一格，装上就能点开。

## 现在是什么状态

**界面做出来了，后端还没接。**

- ✅ 插件包结构、`dshMobileExtensions` / `dshMobileDataServices` 声明、随包的手机扩展都在，
  装上去手机就能看到、能安装、能打开。
- ✅ 打开是完整的邮箱界面（账号条 / 文件夹 / 列表 / 详情 / 附件），现在吃的是演示数据。
- ⬜ 真正连邮箱、取信、读信、发信 —— 后端接口与宿主取数还没接。

## 前端（`web/`）

界面是 React + [Appica UI](https://appica.dev/ui)（与 `dsh-mobile-plugin/React` 同一套库）。

```sh
cd web
pnpm install
pnpm dev      # http://127.0.0.1:5288，浏览器里看效果
pnpm build    # 产出 ../extensions/mail/index.html（单文件，直接进扩展包）
```

`pnpm dev` 只给「用浏览器打开看」用，不连任何宿主，数据来自 `web/src/demo-data.ts`。
改完要进扩展包的话得 `pnpm build` —— 产物是那个自包含的单文件 HTML，纯 dev 改动不会进包。

## 为什么先只做到这

这一版是拿邮箱当**样板**跑一遍「第三方作者怎么写一个带手机扩展的 dsh 插件」。
所以先把整条分发的路走通：插件在 npm 上 → 用户装进自己的 DSH → 手机从当前这台电脑
拉到扩展 → 装进手机 → 点开套在 App 的统一外壳里。

功能那一半卡在一个还没定的事上：手机上的扩展页是从本地 `file://` 加载的网页，它自己
够不到电脑上的任何服务，得靠宿主替它去取（dsh 里叫 `host.data`）。而「哪些服务可以被
代取」目前是移动端插件里一张写死的登记表，第三方插件没法把自己登记进去。这条通道没定
之前，写多少取信代码手机上都读不到一封邮件。

## 装

```sh
# 在装 dsh 的那台电脑上，装进你的 profile
dsh plugin add dsh-email-plugin
```

装完重启一次宿主（或者按你平时的重载方式），手机连上这台电脑，去 App 的「设置 → 扩展」
就能看到「邮箱」。

## 本地开发

改完扩展目录，想让手机立刻看到，不必发 npm：

```sh
node scripts/dev-install.mjs
```

它把这个包里的 `extensions/mail/` 拷到 `$DSH_HOME/extension-dev/mail/`。手机在扩展页的
「本地开发」那一段里就能看到它（得先在设置里打开开发者模式）。

扩展是纯网页（`file://` 加载），改完 `index.html` 在手机上重新打开那一页就行，不用重装。

## 包里有什么

```
index.js            宿主半身（现在只记一行日志）
cordis.patch.yml    挂载行
extensions/mail/    给手机的扩展包
  manifest.json     自述：名字、版本、能力、右栏入口
  index.html        入口页（占位）
  icon.png          右栏那一格用的图标
```

扩展的入口页固定叫 `index.html`，整包自包含、不许外链，页面跑在隔离的网页内核里。
写法上的约束见 [DeepSeek Harness 手机扩展作者须知](https://github.com/WNLUO/dsh-mobile)
的 `docs/extension-authoring.md`。

## 许可

MIT
