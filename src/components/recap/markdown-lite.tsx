import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Renders the constrained Markdown the summariser emits (headings, bullet and
 * numbered lists, bold, paragraphs) as React elements. Text only — never HTML.
 */
export function MarkdownLite({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  const blocks = React.useMemo(() => parseBlocks(source), [source]);
  return (
    <div className={cn("space-y-3 text-sm leading-relaxed", className)}>
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "h2":
            return (
              <h3 key={i} className="font-heading pt-1 text-base font-medium">
                {inline(block.text)}
              </h3>
            );
          case "h3":
            return (
              <h4 key={i} className="pt-0.5 text-sm font-medium">
                {inline(block.text)}
              </h4>
            );
          case "ul":
            return (
              <ul key={i} className="ml-4 list-disc space-y-1">
                {block.items.map((item, j) => (
                  <li key={j}>{inline(item)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="ml-4 list-decimal space-y-1">
                {block.items.map((item, j) => (
                  <li key={j}>{inline(item)}</li>
                ))}
              </ol>
            );
          case "p":
            return <p key={i}>{inline(block.text)}</p>;
        }
      })}
    </div>
  );
}

type Block =
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "p"; text: string };

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length) {
      blocks.push({ kind: "p", text: paragraph.join(" ") });
      paragraph = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flush();
      continue;
    }
    if (/^#{1,2}\s+/.test(line)) {
      flush();
      blocks.push({ kind: "h2", text: line.replace(/^#{1,2}\s+/, "") });
      continue;
    }
    if (/^#{3,6}\s+/.test(line)) {
      flush();
      blocks.push({ kind: "h3", text: line.replace(/^#{3,6}\s+/, "") });
      continue;
    }
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    if (bullet) {
      flush();
      const last = blocks[blocks.length - 1];
      if (last?.kind === "ul") last.items.push(bullet[1]);
      else blocks.push({ kind: "ul", items: [bullet[1]] });
      continue;
    }
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (numbered) {
      flush();
      const last = blocks[blocks.length - 1];
      if (last?.kind === "ol") last.items.push(numbered[1]);
      else blocks.push({ kind: "ol", items: [numbered[1]] });
      continue;
    }
    paragraph.push(line.trim());
  }
  flush();
  return blocks;
}

/** **bold** and `code` only. Everything else is literal text. */
function inline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text))) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      out.push(
        <strong key={key++} className="text-foreground font-medium">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      out.push(
        <code
          key={key++}
          className="bg-muted rounded px-1 py-0.5 font-mono text-[0.85em]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
