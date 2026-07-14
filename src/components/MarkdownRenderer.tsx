import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // Split content by code blocks: ```lang ... ```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-1 text-sm leading-relaxed break-words">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // It's a code block
          const lines = part.slice(3, -3).trim().split('\n');
          const firstLine = lines[0] || '';
          let language = 'text';
          let codeStartIndex = 0;

          // Check if first line is a language identifier
          if (firstLine && !firstLine.includes(' ') && firstLine.length < 15) {
            language = firstLine;
            codeStartIndex = 1;
          }

          const code = lines.slice(codeStartIndex).join('\n');

          return <CodeBlock key={index} code={code} language={language} />;
        } else {
          // It's a regular text block
          return <TextBlock key={index} text={part} />;
        }
      })}
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language: string; key?: React.Key }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-900 font-mono text-xs shadow-sm">
      <div className="flex items-center justify-between bg-slate-950/40 px-4 py-2 text-slate-400 border-b border-slate-800">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
          title="Nusxalash"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Nusxalandi!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Nusxa olish</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4 max-h-[400px]">
        <pre className="text-indigo-200 whitespace-pre leading-5"><code>{code}</code></pre>
      </div>
    </div>
  );
}

function TextBlock({ text }: { text: string; key?: React.Key }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = (key: number) => {
    if (currentList) {
      const listKey = `list-${key}`;
      const listComponent = currentList.type === 'ul' ? (
        <ul key={listKey} className="list-disc pl-5 my-2 space-y-1 text-zinc-700">
          {currentList.items.map((item, i) => (
            <li key={i}>{parseInlineStyles(item)}</li>
          ))}
        </ul>
      ) : (
        <ol key={listKey} className="list-decimal pl-5 my-2 space-y-1 text-zinc-700">
          {currentList.items.map((item, i) => (
            <li key={i}>{parseInlineStyles(item)}</li>
          ))}
        </ol>
      );
      elements.push(listComponent);
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Headers (e.g. ### Header)
    if (trimmed.startsWith('#')) {
      flushList(i);
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const content = match[2];
        const headingClass = 
          level === 1 ? 'text-xl font-bold text-zinc-900 mt-4 mb-2 border-b border-zinc-100 pb-1' :
          level === 2 ? 'text-lg font-bold text-zinc-900 mt-3 mb-2' :
          'text-base font-semibold text-zinc-900 mt-2.5 mb-1';
        
        elements.push(
          React.createElement(`h${Math.min(level + 1, 6)}`, { key: i, className: headingClass }, parseInlineStyles(content))
        );
        continue;
      }
    }

    // 2. Unordered lists (e.g. * Item or - Item)
    const ulMatch = line.match(/^(\s*)[*\-]\s+(.*)$/);
    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList(i);
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[2]);
      continue;
    }

    // 3. Ordered lists (e.g. 1. Item)
    const olMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList(i);
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[2]);
      continue;
    }

    // 4. Table support (e.g. | col 1 | col 2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList(i);
      const tableRows: string[][] = [];
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith('|') && lines[j].trim().endsWith('|')) {
        const rowContent = lines[j].trim().slice(1, -1).split('|').map(cell => cell.trim());
        const isSeparator = rowContent.every(cell => /^:?-+:?$/.test(cell));
        if (!isSeparator) {
          tableRows.push(rowContent);
        }
        j++;
      }
      i = j - 1; // Advance outer index
      
      if (tableRows.length > 0) {
        elements.push(
          <div key={`table-${i}`} className="my-3 overflow-x-auto rounded-lg border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-xs">
              <thead className="bg-zinc-50 text-zinc-700 font-semibold">
                <tr>
                  {tableRows[0].map((cell, idx) => (
                    <th key={idx} className="px-3 py-2 text-left border-r border-zinc-200 last:border-0">{parseInlineStyles(cell)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white text-zinc-600">
                {tableRows.slice(1).map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-zinc-50">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-1.5 border-r border-zinc-200 last:border-0">{parseInlineStyles(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // If it's a blank line, flush list and add small spacing
    if (trimmed === '') {
      flushList(i);
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    // Standard paragraph line
    flushList(i);
    elements.push(
      <p key={i} className="text-zinc-700 leading-relaxed mb-1">
        {parseInlineStyles(line)}
      </p>
    );
  }

  flushList(lines.length);

  return <div className="space-y-0.5">{elements}</div>;
}

function parseInlineStyles(text: string): React.ReactNode[] {
  if (!text) return [];

  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-zinc-950">{part.slice(2, -2)}</strong>;
    } else if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index} className="italic text-zinc-800">{part.slice(1, -1)}</em>;
    } else if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-900 font-mono text-[12.5px]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
