/**
 * 邮箱页的数据形状。
 *
 * 这一版还没有后端：数据来自同目录 `demo-data.ts` 里的一份演示数据。等插件的 HTTP 接口
 * 写好后，把 `useMailbox` 里那个取数函数换成走 `window.__dshHostFetch('dsh-email', '/api/dsh-email/…')`
 * 即可 —— 形状不变，页面不用改。
 */

export type MailFolderKind = 'inbox' | 'unread' | 'sent' | 'junk' | 'trash';

export interface MailAccount {
  name: string;
  address: string;
  isDefault: boolean;
}

export interface MailFolder {
  kind: MailFolderKind;
  label: string;
  unread: number;
}

export interface MailAttachment {
  filename: string;
  size: number;
}

export interface MailMessage {
  uid: string;
  folder: MailFolderKind;
  from: string;
  fromAddress: string;
  subject: string;
  preview: string;
  /** 可解析的时间串（ISO）。 */
  date: string;
  unread: boolean;
  starred: boolean;
  body: string;
  attachments: MailAttachment[];
}
