/**
 * 邮箱页本体：账号条 / 文件夹条 / 列表 / 一封的详情。
 *
 * 两条刻意的做法：
 *
 *  1. **详情没有自己的顶栏**。这一页套在 App 的统一外壳里，外壳已经画了顶栏与返回键；
 *     网页里再画一条就是两层。可是「从详情回列表」与「退出整个邮件页」不是一件事 ——
 *     所以详情用**右滑返回**（邮件客户端的通行手势），滑过阈值或甩一下就回列表，滑不够
 *     弹回原位。这也是这一页主要的交互动效。
 *  2. **数据形状与将来的真接口对齐**：页面只读 `useMailbox()` 给的东西。这一版它返回
 *     演示数据，接后端时只换那一个函数，页面这一层不用改。
 *
 * 动效只碰 `transform` / `opacity`（不碰宽高），列表进场是错开的淡入 + 轻微上移，
 * 详情是整块从右侧滑入 + 底下列表压暗一档。
 */
import { Avatar, AvatarFallback } from '@appica/ui-react/avatar';
import { Badge } from '@appica/ui-react/badge';
import { ScrollArea } from '@appica/ui-react/scroll-area';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

/** 详情里给到「年-月-日 时:分」。 */
function formatFull(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

/**
 * 头像底色：按名字算一个稳定的色相。
 *
 * 不取主题色 —— 一屏十几行全是一个蓝圆就分不出谁是谁。只取色相、饱和度与明度写死，
 * 深浅两档主题下都不会脏。
 */
function hueOf(name: string): number {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.codePointAt(0)!) % 360;
  return hash;
}

/** 一封按「今天 / 本周 / 更早」分组：分组标题是列表唯一的分隔，不再画一堆线。 */
function dayBucketOf(iso: string): 0 | 1 | 2 {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 2;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const time = date.getTime();
  if (time >= startOfToday) return 0;
  if (time >= startOfToday - 6 * 24 * 60 * 60 * 1000) return 1;
  return 2;
}

const BUCKET_TITLES = ['今天', '最近一周', '更早'] as const;

/** 滑动返回的判定：滑过这么多像素、或者甩得够快，就回列表。 */
const SWIPE_CLOSE_PX = 92;
const SWIPE_VELOCITY = 0.45; // px / ms

interface DragState {
  startX: number;
  startY: number;
  startAt: number;
  /** 一旦判定是横滑就锁住，避免手指上下滚正文时页面跟着位移。 */
  axis: 'none' | 'x' | 'y';
}

export function App() {
  const [accountName, setAccountName] = useState(
    DEMO_ACCOUNTS.find((a) => a.isDefault)?.name ?? DEMO_ACCOUNTS[0]?.name ?? '',
  );
  const [folder, setFolder] = useState<MailFolderKind>('inbox');
  const [openUid, setOpenUid] = useState<string | null>(null);
  const [messages, setMessages] = useState<MailMessage[]>(DEMO_MESSAGES);

  const [entered, setEntered] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<DragState | null>(null);

  const accounts = DEMO_ACCOUNTS;
  const folders = DEMO_FOLDERS;

  const visible = useMemo(() => {
    const rows = messages.filter((m) => (folder === 'unread' ? m.unread : m.folder === folder));
    return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [messages, folder]);

  const opened = useMemo(
    () => (openUid ? messages.find((m) => m.uid === openUid) ?? null : null),
    [messages, openUid],
  );

  // 打开一封就把它标成已读（真接口接上后这一步走 mark 动作）。
  useEffect(() => {
    if (!openUid) return;
    setMessages((list) => list.map((m) => (m.uid === openUid ? { ...m, unread: false } : m)));
  }, [openUid]);

  // 详情：挂上去之后下一帧再进场，否则首帧就在终点、动画整段被跳过。
  useEffect(() => {
    if (!opened) {
      setEntered(false);
      setDragX(0);
      return;
    }
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [opened]);

  const closeDetail = useCallback(() => {
    setEntered(false);
    // 等滑出去那一段跑完再卸载，否则内容会当场消失、看着像闪一下。
    window.setTimeout(() => setOpenUid(null), 220);
  }, []);

  const unreadOf = (kind: MailFolderKind) => messages.filter(
    (m) => (kind === 'unread' ? m.unread : m.folder === kind && m.unread),
  ).length;

  /** 详情上的横向拖动：只用来右滑返回。 */
  const onPointerDown = (event: React.PointerEvent) => {
    dragRef.current = { startX: event.clientX, startY: event.clientY, startAt: performance.now(), axis: 'none' };
    setDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (drag.axis === 'none') {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      // 判定一次方向就锁住：竖着划是滚正文，横着划才是返回。
      drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (drag.axis !== 'x') return;
    // 只许往右拖：往左拖没有对应动作，跟手位移会像卡住。
    setDragX(Math.max(0, dx));
  };

  const onPointerUp = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    dragRef.current = null;
    setDragging(false);
    if (!drag || drag.axis !== 'x') return;

    const dx = Math.max(0, event.clientX - drag.startX);
    const elapsed = Math.max(1, performance.now() - drag.startAt);
    const velocity = dx / elapsed;

    if (dx > SWIPE_CLOSE_PX || velocity > SWIPE_VELOCITY) {
      closeDetail();
      return;
    }
    // 没到阈值：弹回原位（由 transition 负责）。
    setDragX(0);
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background text-foreground">
      {/* 账号条：只有一个账号时不占地方。 */}
      {accounts.length > 1 ? (
        <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-border px-3 py-2">
          {accounts.map((account) => {
            const active = account.name === accountName;
            return (
              <button
                key={account.name}
                type="button"
                onClick={() => { setAccountName(account.name); setOpenUid(null); }}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                {account.address}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* 文件夹条：横向滑，收件箱 / 未读 / 已发送 / 垃圾 / 已删。 */}
      <div className="flex shrink-0 gap-0.5 overflow-x-auto border-b border-border px-2 py-1.5">
        {folders.map((entry) => {
          const count = unreadOf(entry.kind);
          const active = entry.kind === folder;
          return (
            <button
              key={entry.kind}
              type="button"
              onClick={() => { setFolder(entry.kind); setOpenUid(null); }}
              className={`relative flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors duration-200 ${
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'
              }`}
            >
              {/* 选中态用一块滑动的底，不是换一套字色：切文件夹时目光才跟得住。 */}
              {active ? (
                <span className="absolute inset-0 -z-10 rounded-md bg-accent transition-all duration-200" />
              ) : null}
              <span className="font-medium">{entry.label}</span>
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
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card">
              <MailGlyph />
            </div>
            <p className="text-sm font-medium">这里没有邮件</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              换个文件夹看看，或者等新邮件进来。
            </p>
          </div>
        ) : (
          <ul className="pb-6">
            {visible.map((message, index) => {
              const bucket = dayBucketOf(message.date);
              const showBucket = index === 0 || dayBucketOf(visible[index - 1].date) !== bucket;
              return (
                <li key={message.uid}>
                  {showBucket ? (
                    <div className="sticky top-0 z-10 bg-background/85 px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
                      {BUCKET_TITLES[bucket]}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setOpenUid(message.uid)}
                    style={{ animationDelay: `${Math.min(index, 12) * 28}ms` }}
                    className="mail-row group flex w-full items-start gap-3 px-4 py-3 text-left"
                  >
                    <Avatar size="sm" className="mt-0.5 shrink-0">
                      <AvatarFallback
                        style={{
                          background: `hsl(${hueOf(message.from)} 42% 42%)`,
                          color: '#fff',
                          fontWeight: message.unread ? 600 : 500,
                        }}
                      >
                        {initialOf(message.from)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-sm ${message.unread ? 'font-semibold' : 'font-normal text-foreground/90'}`}>
                          {message.from}
                        </span>
                        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                          {formatWhen(message.date)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        {message.starred ? <StarGlyph /> : null}
                        <span className={`truncate text-sm ${message.unread ? 'font-medium' : 'text-foreground/80'}`}>
                          {message.subject}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-xs leading-relaxed text-muted-foreground">
                        {message.preview}
                      </div>
                    </div>

                    {message.unread ? (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>

      {/* 详情：整块从右侧滑进来，右滑返回。下面那层跟着压暗一档。 */}
      {opened ? (
        <>
          <div
            aria-hidden
            onClick={closeDetail}
            className="absolute inset-0 z-20 bg-black/25 transition-opacity duration-200"
            style={{
              opacity: entered ? Math.max(0, 1 - dragX / 320) : 0,
              pointerEvents: dragX > 8 ? 'none' : 'auto',
            }}
          />

          <div
            className="absolute inset-0 z-30 flex flex-col bg-background will-change-transform"
            style={{
              transform: `translateX(${entered ? dragX : 420}px)`,
              transition: dragging ? 'none' : 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)',
              boxShadow: '-12px 0 32px rgba(0, 0, 0, 0.18)',
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <ScrollArea className="min-h-0 flex-1" scrollbarVisibility="auto">
              <article className="px-4 pb-10 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-lg font-semibold leading-snug">{opened.subject}</h1>
                  {opened.starred ? <StarGlyph className="mt-1 shrink-0" /> : null}
                </div>

                <div className="mt-4 flex items-start gap-3">
                  <Avatar size="md" className="shrink-0">
                    <AvatarFallback
                      style={{ background: `hsl(${hueOf(opened.from)} 42% 42%)`, color: '#fff', fontWeight: 600 }}
                    >
                      {initialOf(opened.from)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{opened.from}</div>
                    <div className="truncate text-xs text-muted-foreground">{opened.fromAddress}</div>
                  </div>
                  <div className="shrink-0 text-right text-[11px] leading-relaxed text-muted-foreground">
                    {formatFull(opened.date)}
                  </div>
                </div>

                <div className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {opened.body}
                </div>

                {opened.attachments.length > 0 ? (
                  <div className="mt-6">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      附件 · {opened.attachments.length}
                    </div>
                    <ul className="flex flex-col gap-2">
                      {opened.attachments.map((file) => (
                        <li key={file.filename}>
                          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 transition-colors hover:border-primary/40">
                            <FileGlyph />
                            <span className="min-w-0 flex-1 truncate text-sm">{file.filename}</span>
                            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                              {formatSize(file.size)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <p className="mt-8 text-center text-[11px] text-muted-foreground">向右滑动返回列表</p>
              </article>
            </ScrollArea>
          </div>
        </>
      ) : null}
    </div>
  );
}

/** 空态那个信封。 */
function MailGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className="text-muted-foreground">
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 8L12 13L19.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 星标。 */
function StarGlyph({ className = '' }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden className={`text-amber-500 ${className}`}>
      <path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.2-5.9 3.2 1.2-6.5L2.5 9.5l6.6-.9z" />
    </svg>
  );
}

/** 附件那行前面的纸夹。 */
function FileGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-muted-foreground">
      <path d="M14 3.5H8A2.5 2.5 0 005.5 6v12A2.5 2.5 0 008 20.5h8a2.5 2.5 0 002.5-2.5V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M14 3.5V8h4.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
