/**
 * 邮箱页本体：账号条 / 文件夹条 / 列表 / 一封的详情。
 *
 * 这一版是「先把界面拿出来看」，数据全来自 `demo-data.ts`。结构上刻意与真接口对齐：
 * 一个 `useMailbox` 返回 `{ accounts, folders, messages, ... }`，页面只读它 —— 等插件接口
 * 写好，把 `useMailbox` 内部换成 `window.__dshHostFetch('dsh-email', '/api/dsh-email/…')`
 * 就行，页面这一层一个字不用改。
 *
 * 手机是主要形态：整页一列，列表与详情同屏切换（详情盖在列表上，返回回到列表）。
 */
import { Avatar, AvatarFallback } from '@appica/ui-react/avatar';
import { Badge } from '@appica/ui-react/badge';
import { Button } from '@appica/ui-react/button';
import { ScrollArea } from '@appica/ui-react/scroll-area';
import { useEffect, useMemo, useState } from 'react';

import { DEMO_ACCOUNTS, DEMO_FOLDERS, DEMO_MESSAGES } from './demo-data.ts';
import type { MailFolderKind, MailMessage } from './types.ts';

/** 时间显示：今天只给时:分，其余给月/日。 */
function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const sameDay = date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
  if (sameDay) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

/** 文件大小：给到 KB / MB 就够，邮件附件不用更细。 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** 取名字首字当头像（无图时）。 */
function initialOf(name: string): string {
  const trimmed = name.trim();
  return trimmed ? [...trimmed][0] : '?';
}

export function App() {
  const [accountName, setAccountName] = useState(DEMO_ACCOUNTS.find((a) => a.isDefault)?.name ?? DEMO_ACCOUNTS[0]?.name ?? '');
  const [folder, setFolder] = useState<MailFolderKind>('inbox');
  const [openUid, setOpenUid] = useState<string | null>(null);
  const [messages, setMessages] = useState<MailMessage[]>(DEMO_MESSAGES);

  const accounts = DEMO_ACCOUNTS;
  const folders = DEMO_FOLDERS;

  const visible = useMemo(
    () => messages.filter((m) => (folder === 'unread' ? m.unread : m.folder === folder)),
    [messages, folder],
  );

  const opened = useMemo(
    () => (openUid ? messages.find((m) => m.uid === openUid) ?? null : null),
    [messages, openUid],
  );

  // 打开一封就把它标成已读（真接口接上后这一步走 mark 动作）。
  useEffect(() => {
    if (!openUid) return;
    setMessages((list) => list.map((m) => (m.uid === openUid ? { ...m, unread: false } : m)));
  }, [openUid]);

  const unreadOf = (kind: MailFolderKind) => messages.filter((m) => (kind === 'unread' ? m.unread : m.folder === kind && m.unread)).length;

  return (
    <div className="relative flex h-full flex-col bg-background text-foreground">
      {/* 账号条：只有一个账号时不占地方。 */}
      {accounts.length > 1 ? (
        <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-border px-3 py-2">
          {accounts.map((account) => (
            <button
              key={account.name}
              type="button"
              onClick={() => { setAccountName(account.name); setOpenUid(null); }}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                account.name === accountName
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {account.address}
            </button>
          ))}
        </div>
      ) : null}

      {/* 文件夹条：横向滑，收件箱 / 未读 / 已发送 / 垃圾 / 已删。 */}
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-border px-2 py-2">
        {folders.map((entry) => {
          const count = unreadOf(entry.kind);
          const active = entry.kind === folder;
          return (
            <button
              key={entry.kind}
              type="button"
              onClick={() => { setFolder(entry.kind); setOpenUid(null); }}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition ${
                active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
              }`}
            >
              <span>{entry.label}</span>
              {count > 0 ? (
                <Badge variant={active ? 'secondary' : 'soft'} size="xs">{count}</Badge>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* 列表 */}
      <ScrollArea className="min-h-0 flex-1" scrollbarVisibility="auto">
        {visible.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-sm font-medium">这里没有邮件</p>
            <p className="text-xs text-muted-foreground">换个文件夹看看，或者等新邮件进来。</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((message) => (
              <li key={message.uid}>
                <button
                  type="button"
                  onClick={() => setOpenUid(message.uid)}
                  className="mail-row flex w-full items-start gap-3 px-4 py-3 text-left"
                >
                  <Avatar size="sm" className="mt-0.5 shrink-0">
                    <AvatarFallback>{initialOf(message.from)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-sm ${message.unread ? 'font-semibold' : 'font-normal'}`}>
                        {message.from}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatWhen(message.date)}</span>
                    </div>
                    <div className={`truncate text-sm ${message.unread ? 'font-medium text-foreground' : 'text-foreground/90'}`}>
                      {message.starred ? <span className="mr-1 text-amber-500">★</span> : null}
                      {message.subject}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{message.preview}</div>
                  </div>
                  {message.unread ? <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>

      {/* 详情：盖在列表上，返回回到列表。 */}
      {opened ? (
        <div className="absolute inset-0 flex flex-col bg-background">
          <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
            <Button variant="ghost" size="sm" onClick={() => setOpenUid(null)}>← 返回</Button>
          </div>
          <ScrollArea className="min-h-0 flex-1" scrollbarVisibility="auto">
            <article className="px-4 py-4">
              <h1 className="text-lg font-semibold leading-snug">{opened.subject}</h1>
              <div className="mt-3 flex items-start gap-3">
                <Avatar size="md" className="shrink-0">
                  <AvatarFallback>{initialOf(opened.from)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">{opened.from}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatWhen(opened.date)}</span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{opened.fromAddress}</div>
                </div>
              </div>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {opened.body}
              </div>
              {opened.attachments.length > 0 ? (
                <div className="mt-5">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">
                    附件（{opened.attachments.length}）
                  </div>
                  <ul className="flex flex-col gap-2">
                    {opened.attachments.map((file) => (
                      <li key={file.filename}>
                        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2">
                          <span className="truncate text-sm">{file.filename}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{formatSize(file.size)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          </ScrollArea>
        </div>
      ) : null}
    </div>
  );
}
