import type { MailAccount, MailFolder, MailMessage } from './types.ts';

/**
 * 演示数据：够把列表、未读、星标、详情、附件、空态这几条路都点一遍。
 *
 * 这一份**只在开发服务器里活着**（`pnpm dev` 手里直接用）。正式产物里没有它 —— 构建时
 * 页面走的是真实取数那条路（等后端接上）。它存在的唯一理由是「先把界面拿出来看」。
 */

export const DEMO_ACCOUNTS: MailAccount[] = [
  { name: 'work', address: 'me@corp.com', isDefault: true },
  { name: 'personal', address: 'hello@example.com', isDefault: false },
];

export const DEMO_FOLDERS: MailFolder[] = [
  { kind: 'inbox', label: '收件箱', unread: 3 },
  { kind: 'unread', label: '未读', unread: 3 },
  { kind: 'sent', label: '已发送', unread: 0 },
  { kind: 'junk', label: '垃圾邮件', unread: 0 },
  { kind: 'trash', label: '已删除', unread: 0 },
];

export const DEMO_MESSAGES: MailMessage[] = [
  {
    uid: '1001',
    folder: 'inbox',
    from: '林蔚',
    fromAddress: 'linwei@corp.com',
    subject: 'Q4 预算评审的时间定了',
    preview: '下周三下午两点，会议室 A。材料我已经放共享盘，麻烦会前过一眼，重点看下市场那一块的增幅。',
    date: '2026-11-10T09:42:00+08:00',
    unread: true,
    starred: true,
    body: `我这边跟财务确认过了，Q4 预算评审定在下周三（11 月 18 日）下午两点，会议室 A。

材料已经放到共享盘的「2026Q4/预算」目录下，麻烦会前过一眼。重点看两块：

1. 市场投放那块同比增幅写得偏乐观，财务大概率会问依据；
2. 研发的人力成本分摊方式变了，和上一版对不上，我标了黄。

有问题的直接回这封邮件，我汇总一下再发给财务。`,
    attachments: [
      { filename: '2026Q4-预算草案.xlsx', size: 48213 },
      { filename: '分摊说明.pdf', size: 128004 },
    ],
  },
  {
    uid: '1002',
    folder: 'inbox',
    from: 'GitHub',
    fromAddress: 'noreply@github.com',
    subject: '[dsh-mobile] Release v0.5.35 published',
    preview: 'A new release has been published for repository WNLUO/dsh-mobile-plugin.',
    date: '2026-11-10T08:15:00+08:00',
    unread: true,
    starred: false,
    body: `A new release has been published for repository WNLUO/dsh-mobile-plugin.

Tag: v0.5.35
Release notes: 修复邮箱页在夜间模式下的一处配色问题；移动 API 新增邮箱三条路由。

View it on GitHub: https://github.com/WNLUO/dsh-mobile-plugin/releases`,
    attachments: [],
  },
  {
    uid: '1003',
    folder: 'inbox',
    from: '周颖',
    fromAddress: 'zhouying@corp.com',
    subject: '关于下周的客户拜访',
    preview: '客户那边把时间提前到周一上午了，你看方不方便？我把行程单附上。',
    date: '2026-11-09T18:03:00+08:00',
    unread: true,
    starred: false,
    body: `客户那边把时间提前到周一上午十点了，比原计划早一天。

你那边方不方便？如果不行我再跟他们协调。行程单在附件里，酒店和车都还没定，等你确认了我一起安排。`,
    attachments: [{ filename: '行程单.pdf', size: 88210 }],
  },
  {
    uid: '1004',
    folder: 'inbox',
    from: '陈默',
    fromAddress: 'chenmo@corp.com',
    subject: '上次说的那个方案，我改了一版',
    preview: '按你上次的意见把接口那部分重写了，整体短了三分之一。你有空看看？',
    date: '2026-11-09T14:27:00+08:00',
    unread: false,
    starred: true,
    body: `按你上次的意见把接口那部分重写了 —— 原来的三层封装去掉一层，参数校验挪到入口。

整体短了三分之一，读起来清楚不少。你有空看看，没问题我就推到主分支。`,
    attachments: [],
  },
  {
    uid: '1005',
    folder: 'inbox',
    from: '系统通知',
    fromAddress: 'notice@example.com',
    subject: '你的订阅将在 7 天后到期',
    preview: '为避免服务中断，请及时续订。',
    date: '2026-11-08T10:00:00+08:00',
    unread: false,
    starred: false,
    body: `你的订阅将在 7 天后到期。为避免服务中断，请及时续订。

如已续订请忽略此邮件。`,
    attachments: [],
  },
  {
    uid: '2001',
    folder: 'sent',
    from: '我',
    fromAddress: 'me@corp.com',
    subject: 'Re: Q4 预算评审的时间定了',
    preview: '收到，会前我会把市场那块的依据补齐，另外分摊方式我再对一版。',
    date: '2026-11-10T10:05:00+08:00',
    unread: false,
    starred: false,
    body: `收到，会前我会把市场那块的依据补齐。

分摊方式我再对一版，明天发你。`,
    attachments: [],
  },
];
