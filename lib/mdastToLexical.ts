// lib/mdastToLexical.ts
import { Root, RootContent } from 'mdast';

export function mdastToLexicalJson(mdast: Root): string {
  const root = {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [],
  };

  // Helper function to process inline nodes (text, strong, emphasis)
  const processInline = (children: RootContent[]): any[] => {
    return children.flatMap((child) => {
      if (child.type === 'text') {
        return [{
          type: 'text',
          text: child.value,
          format: 0,
          mode: 'normal',
          style: '',
          version: 1,
        }];
      } else if (child.type === 'strong') {
        return child.children.map((c) => ({
          type: 'text',
          text: c.value,
          format: 1, // bold
          mode: 'normal',
          style: '',
          version: 1,
        }));
      } else if (child.type === 'emphasis') {
        return child.children.map((c) => ({
          type: 'text',
          text: c.value,
          format: 2, // italic
          mode: 'normal',
          style: '',
          version: 1,
        }));
      }
      return []; // Ignore other inline types for now
    });
  };

  // Helper function to process lists recursively
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
          value: index + 1, // Lexical uses this for ordered lists
          checked: undefined, // For checklists; undefined since we don't use them
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
            // Recursively process nested lists
            const nestedList = processList(child, indentLevel + 1);
            listItem.children.push(nestedList);
          }
        });
        return listItem;
      }),
    };
  };

  mdast.children.forEach((node: RootContent) => {
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

      case 'code':
        const codeNode = {
          type: 'code',
          language: node.lang || 'plaintext',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: [
            {
              type: 'text',
              text: node.value,
              format: 0,
              mode: 'normal',
              style: '',
              version: 1,
            },
          ],
        };
        root.children.push(codeNode);
        break;

      case 'list':
        const listNode = processList(node, 0);
        root.children.push(listNode);
        break;

      // Add 'table' support here in the future if needed
    }
  });

  return JSON.stringify({ root });
}