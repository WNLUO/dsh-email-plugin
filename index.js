/**
 * 邮箱插件的宿主半身。
 *
 * 现在只做一件事：**存在**。有它，用户在电脑上装了这个插件之后，profile 的
 * `node_modules` 里就有这个包、`package.json` 里就有 `dshMobileExtensions` 那一格，
 * 移动端插件扫插件目录时就能把它带的手机扩展列进清单 —— 手机扩展页看到、装上、点开，
 * 整条「第三方插件自带扩展」的路就通了。
 *
 * 真正的邮件功能（连 IMAP、给手机取信）还没做。那一半要等「第三方插件怎么把自己的数据
 * 服务登记给宿主代取」这条通道定下来 —— 见仓库 README 的「还没做的」。在那之前这里不注册
 * 任何路由、不碰任何凭据，装上不会有任何副作用。
 *
 * 装载失败只记日志、不抛出：入口模块导入失败会让整个 DSH 起不来，而少一个邮箱插件只是
 * 少一个功能。以「插件多半还能用」换「绝不拖垮宿主」。
 *
 * @module index.js
 */

export const name = 'dsh-email-plugin'

/**
 * 一个服务都不等。
 *
 * 宿主半身目前不注册任何接口，也就不需要 `webServer` 之类的注入。等真接上邮件接口时，
 * 那时候要哪个服务再在这里加 —— 提前声明一个用不上的注入，只会多一种「整行 pending」
 * 的可能。
 */
export const inject = []

/**
 * 挂载时记一行日志，让「插件到底装上了没有」在宿主日志里有一句话可说。
 *
 * 不做别的事，也**不要**在这里顺手创建目录或文件：这个函数的副作用应当是「什么都不发生」。
 */
export function apply(ctx) {
  const log = (level, message) => {
    const fn = ctx?.logger?.[level]
    if (typeof fn === 'function') fn.call(ctx.logger, message)
  }
  log('info', '[dsh-email] 邮箱插件已装载（功能还没做，只提供手机端扩展）')
}
