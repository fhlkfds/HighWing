import { isObj } from "./values";
// A bot's threads (ADR 0205). A thread is another conversation with a bot besides its Bot Chat: a hidden session in the
// bot's profile titled `Bot Thread: <topic>`. The profile and that title are its whole identity. Nothing about a thread
// is kept on this computer, no parent link is read, and no session id outlives a read, so a thread stays under its bot
// through a compaction of the Bot Chat, a compaction of the thread, a reinstall, and a second computer.

/** The prefix every thread's title starts with. With `BOT_CHAT_TITLE`, the only two titles this app reserves. Never translated: Hermes stores it. */
export const THREAD_PREFIX = "Bot Thread: ";
/** The longest topic. Hermes takes a title of 100 characters; this leaves room for the prefix and a ` (99)`. */
export const TOPIC_MAX = 80;
/** How many characters of a message "Thread from here" offers as the topic. */
const TOPIC_FROM_MESSAGE = 48;

/** A title `threadTopic` accepts. Only `threadTitle`, `freeTitle` and `isThreadTitle` make one. */
export type ThreadTitle = string & { readonly __thread: unique symbol };

/** Hermes's name for a copy it makes of a titled session ("Bot Thread: VLAN plan #2"). */
const NUMBERED_COPY = / #\d+$/;

/**
 * The topic of a thread title, or undefined when the title isn't one. The one recogniser: the chat kind, the list and
 * search filters and the shelf parser all read it. A numbered copy isn't a thread: Hermes names the chat it makes on
 * Edit, Regenerate or Branch in a thread that way, and it is an ordinary visible chat, as "Bot Chat #2" is (ADR 0066).
 */
export function threadTopic(title: unknown): string | undefined {
  if (typeof title !== "string" || !title.startsWith(THREAD_PREFIX)) return undefined;
  const topic = title.slice(THREAD_PREFIX.length).trim();
  return topic && !NUMBERED_COPY.test(topic) ? topic : undefined;
}

export const isThreadTitle = (title: unknown): title is ThreadTitle => threadTopic(title) !== undefined;

/** A topic as a title holds it: one line, single spaces, at most TOPIC_MAX characters, and no ending Hermes reads as a numbered copy. */
function tidyTopic(topic: string): string {
  let t = topic.replace(/\s+/g, " ").trim().slice(0, TOPIC_MAX).trim();
  while (NUMBERED_COPY.test(t)) t = t.replace(/ #(\d+)$/, " $1");
  return t;
}

/** The title of the thread on `topic`. Throws for a topic with nothing in it. */
export function threadTitle(topic: string): ThreadTitle {
  const tidy = tidyTopic(topic);
  if (!tidy) throw new Error("A thread needs a topic.");
  return `${THREAD_PREFIX}${tidy}` as ThreadTitle;
}

/** `title`, or the first of `title (2)`, `title (3)`… that `taken` lacks. Titles compare without case, as Hermes's do. */
export function freeTitle(title: ThreadTitle, taken: readonly string[]): ThreadTitle {
  const held = new Set(taken.map((t) => t.toLowerCase()));
  if (!held.has(title.toLowerCase())) return title;
  for (let n = 2; ; n++) {
    const next = `${title} (${n})`;
    if (!held.has(next.toLowerCase())) return next as ThreadTitle;
  }
}

/** The topic "Thread from here" offers: the message's first line with words in it, cut short. "" for a message without any. */
export function topicFrom(messageText: string): string {
  const line = messageText.split("\n").find((l) => /[\p{L}\p{N}]/u.test(l)) ?? "";
  return tidyTopic(line.replace(/^[#>*\-\s]+/, "").slice(0, TOPIC_FROM_MESSAGE));
}

/** One thread as Hermes lists it. Times are Unix ms. No field is kept between reads. */
export type BotThread = {
  profile: string;
  title: ThreadTitle;
  topic: string;
  /** The first session of its lineage, which stays the same when Hermes compacts the thread into a new session. */
  rootId: string;
  /** The session that held the thread at this read. Only a hint: opening looks the title up again. */
  openId: string;
  preview: string;
  /** When Hermes last saw activity in it, or when it started for a Hermes whose listing doesn't say. */
  lastActive: number;
  messageCount: number;
};

/**
 * A bot's threads, in Hermes's order: last active first. `at`: when they were read. `capped`: the answer filled the
 * window asked for, so older threads may be missing. `error`: why the last read failed; `threads` is then the read
 * before it.
 */
export type ThreadShelf = { threads: BotThread[]; at: number; capped: boolean; error?: string };

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/**
 * The threads in a `session.list {include_hidden}` answer, in its order. A row that isn't a thread is dropped, and so
 * is a second row with a title already seen. Throws for an answer that isn't a list of sessions.
 */
export function shelfOf(result: unknown, profile: string, limit: number, at: number): ThreadShelf {
  const rows = isObj(result) && Array.isArray(result.sessions) ? (result.sessions as unknown[]) : undefined;
  if (!rows) throw new Error("Hermes answered the list of threads in a way this app doesn't read.");
  const threads = new Map<string, BotThread>();
  for (const r of rows) {
    if (!isObj(r)) continue;
    const row = threadOf(r, profile);
    if (row && !threads.has(row.title.toLowerCase())) threads.set(row.title.toLowerCase(), row);
  }
  return { threads: [...threads.values()], at, capped: rows.length >= limit };
}

/** One listed row as a thread, or undefined for a row that isn't one or names no session. */
export function threadOf(r: Record<string, unknown>, profile: string): BotThread | undefined {
  const id = text(r.id);
  const topic = threadTopic(r.title);
  if (!id || topic === undefined) return undefined;
  return {
    profile,
    title: r.title as ThreadTitle,
    topic,
    rootId: text(r._lineage_root_id) || id,
    openId: text(r.resolved_id) || id,
    preview: text(r.preview).replace(/\s+/g, " "),
    lastActive: num(r.last_active || r.started_at) * 1000,
    messageCount: num(typeof r.live_message_count === "number" ? r.live_message_count : r.message_count),
  };
}
