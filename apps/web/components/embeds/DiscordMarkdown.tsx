import { Fragment, type ReactNode } from "react";

// Subconjunto del Markdown de Discord para las vistas previas: negrita,
// cursiva, subrayado, tachado, código en línea y spoiler.
const RULES: { re: RegExp; render: (inner: ReactNode, key: number) => ReactNode; raw?: boolean }[] = [
  { re: /^`([^`]+)`/, raw: true, render: (c, k) => <code key={k} className="rounded bg-[#1e1f22] px-1 font-mono text-[0.85em]">{c}</code> },
  { re: /^\*\*([\s\S]+?)\*\*(?!\*)/, render: (c, k) => <strong key={k} className="font-semibold">{c}</strong> },
  { re: /^__([\s\S]+?)__(?!_)/, render: (c, k) => <u key={k}>{c}</u> },
  { re: /^\*([^*\s](?:[\s\S]*?[^*\s])?)\*(?!\*)/, render: (c, k) => <em key={k}>{c}</em> },
  { re: /^_([^_\s](?:[\s\S]*?[^_\s])?)_(?!_)/, render: (c, k) => <em key={k}>{c}</em> },
  { re: /^~~([\s\S]+?)~~/, render: (c, k) => <s key={k}>{c}</s> },
  { re: /^\|\|([\s\S]+?)\|\|/, render: (c, k) => <span key={k} className="rounded bg-[#1e1f22] px-0.5">{c}</span> },
];

function parse(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let plain = "";
  let i = 0;
  while (i < text.length) {
    const rest = text.slice(i);
    const rule = "*_~`|".includes(text[i]!) ? RULES.find((r) => r.re.test(rest)) : undefined;
    if (!rule) {
      plain += text[i];
      i += 1;
      continue;
    }
    const match = rule.re.exec(rest)!;
    if (plain) out.push(plain);
    plain = "";
    out.push(rule.render(rule.raw ? match[1] : parse(match[1]!), out.length));
    i += match[0].length;
  }
  if (plain) out.push(plain);
  return out;
}

export function DiscordMarkdown({ text }: { text: string }) {
  return <Fragment>{parse(text)}</Fragment>;
}
