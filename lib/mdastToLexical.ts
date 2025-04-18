// lib/mdastToLexical.ts
import { Root, RootContent } from 'mdast';
import { franc } from 'franc';
import sanitizeHtml from 'sanitize-html';
import { highlightCode } from './highlightCode';

export async function mdastToLexicalJson(mdast: Root): Promise<string> {
  const root = {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [],
  };

  const processInline = (children: RootContent[]): any[] => {
    return children.flatMap((child) => {
      if (child.type === 'text') {
        const text = child.value;
        const lang = franc(text);
        let fontClass = '';

        if (lang === 'kor') fontClass = 'font-kr';
        else if (lang === 'jpn') fontClass = 'font-jp';
        else if (lang === 'zho') fontClass = 'font-sc';
        else fontClass = 'font-sans';

        return [
          {
            type: 'custom-text',
            text: text,
            className: fontClass,
            format: 0,
            mode: 'normal',
            style: '',
            version: 1,
          },
        ];
      } else if (child.type === 'strong') {
        const text = child.children.map((c: any) => c.value).join('');
        const lang = franc(text);
        let fontClass = '';

        if (lang === 'kor') fontClass = 'font-kr';
        else if (lang === 'jpn') fontClass = 'font-jp';
        else if (lang === 'zho') fontClass = 'font-sc';
        else fontClass = 'font-sans';

        return child.children.map((c: any) => ({
          type: 'custom-text',
          text: c.value,
          className: fontClass,
          format: 1, // bold
          mode: 'normal',
          style: '',
          version: 1,
        }));
      } else if (child.type === 'emphasis') {
        const text = child.children.map((c: any) => c.value).join('');
        const lang = franc(text);
        let fontClass = '';

        if (lang === 'kor') fontClass = 'font-kr';
        else if (lang === 'jpn') fontClass = 'font-jp';
        else if (lang === 'zho') fontClass = 'font-sc';
        else fontClass = 'font-sans';

        return child.children.map((c: any) => ({
          type: 'custom-text',
          text: c.value,
          className: fontClass,
          format: 2, // italic
          mode: 'normal',
          style: '',
          version: 1,
        }));
      }
      return [];
    });
  };

  const processList = (listNode: any, indentLevel: number): any => {
    const listType = listNode.ordered ? 'number' : 'bullet';
    return {
      type: 'list',
      listType: listType,
      start: 1,
      tag: listType === 'number' ? 'ol' : 'ul',
      format: '',
      indent: indentLevel,
      version: 1,
      direction: 'ltr',
      children: listNode.children.map((item: any, index: number) => {
        const listItem = {
          type: 'listitem',
          value: index + 1,
          checked: undefined,
          format: '',
          indent: indentLevel,
          version: 1,
          direction: 'ltr',
          children: [],
        };
        item.children.forEach((child: any) => {
          if (child.type === 'paragraph') {
            const paragraph = {
              type: 'paragraph',
              format: '',
              indent: indentLevel,
              version: 1,
              direction: 'ltr',
              children: processInline(child.children),
            };
            listItem.children.push(paragraph);
          } else if (child.type === 'list') {
            const nestedList = processList(child, indentLevel + 1);
            listItem.children.push(nestedList);
          }
        });
        return listItem;
      }),
    };
  };

  for (const node of mdast.children) {
    switch (node.type) {
      case 'paragraph':
        const paragraph = {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: processInline(node.children),
        };
        root.children.push(paragraph);
        break;

      case 'heading':
        const heading = {
          type: 'heading',
          tag: `h${node.depth}`,
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: processInline(node.children),
        };
        root.children.push(heading);
        break;

      case 'link':
        const href = node.url;
        if (href.startsWith('javascript:')) continue; // Skip malicious links
        const linkNode = {
          type: 'link',
          url: href,
          children: processInline(node.children),
          rel: 'noopener noreferrer',
          version: 1,
        };
        root.children.push(linkNode);
        break;

      case 'code':
        const lang = node.lang || 'text';
        const code = node.value;
        let html = '';
        try {
          html = await highlightCode(code, lang); // Await the async call
          html = sanitizeHtml(html, {
            allowedTags: ['pre', 'code', 'span'],
            allowedAttributes: {
              code: ['class'],
              span: ['class'],
            },
          });
        } catch (err) {
          console.error('Error highlighting code:', err);
          html = `<pre><code>${code}</code></pre>`;
        }
        const shikiNode = {
          type: 'shiki-code',
          html: html,
          version: 1,
        };
        root.children.push(shikiNode);
        break;

      case 'list':
        const listNode = processList(node, 0);
        root.children.push(listNode);
        break;
    }
  }

  return JSON.stringify({ root });
}