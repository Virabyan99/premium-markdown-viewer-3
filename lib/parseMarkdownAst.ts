// lib/parseMarkdownAst.ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type { Root } from 'mdast';

export function parseMarkdownToAst(content: string): Root {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .parse(content) as Root;
}