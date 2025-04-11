// components/LexicalViewer.tsx
'use client';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import { HeadingNode } from '@lexical/rich-text';
import { CodeNode } from '@lexical/code';
import { ListNode, ListItemNode } from '@lexical/list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const theme = {
  paragraph: 'mb-4',
  heading: { h1: 'text-3xl font-bold mb-4', h2: 'text-2xl font-semibold mb-3' },
  text: { bold: 'font-bold', italic: 'italic' },
  code: 'bg-gray-800 text-white p-2 rounded block font-mono text-sm',
  list: {
    ul: 'list-disc pl-6',
    ol: 'list-decimal pl-6',
  },
};

function EditorStateLoader({ json }: { json: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (json) {
      try {
        // Log the raw JSON for debugging
        console.log('Raw Lexical JSON:', json);

        // Parse the JSON string to an object for sanitization
        let parsedJson = JSON.parse(json);

        // Recursively sanitize indent values in the node tree
        const sanitizeIndent = (node: any) => {
          if (node.indent !== undefined) {
            node.indent = Number.isInteger(node.indent) && node.indent >= 0 ? node.indent : 0;
          }
          if (node.children && Array.isArray(node.children)) {
            node.children.forEach(sanitizeIndent);
          }
        };

        // Apply sanitization to the root node
        if (parsedJson.root) {
          sanitizeIndent(parsedJson.root);
        }

        // Convert back to string for Lexical
        const sanitizedJson = JSON.stringify(parsedJson);

        // Parse and set the editor state
        const state = editor.parseEditorState(sanitizedJson);
        console.log('Parsed Editor State:', state);
        if (state && !state.isEmpty()) {
          editor.setEditorState(state);
        } else {
          editor.update(() => {
            const root = $getRoot();
            if (root.getFirstChild() === null) {
              const paragraph = $createParagraphNode();
              paragraph.append($createTextNode('No content available'));
              root.append(paragraph);
            }
          });
        }
      } catch (error) {
        console.error('Failed to parse editor state:', error);
        editor.update(() => {
          const root = $getRoot();
          if (root.getFirstChild() === null) {
            const paragraph = $createParagraphNode();
            paragraph.append($createTextNode('Error loading content'));
            root.append(paragraph);
          }
        });
      }
    } else {
      editor.update(() => {
        const root = $getRoot();
        if (root.getFirstChild() === null) {
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode('Upload a file to see content'));
          root.append(paragraph);
        }
      });
    }
  }, [editor, json]);

  return null;
}

export default function LexicalViewer({ json }: { json: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <LexicalComposer
          initialConfig={{
            namespace: 'MDViewer',
            theme,
            editable: false,
            onError: console.error,
            nodes: [HeadingNode, CodeNode, ListNode, ListItemNode],
          }}
        >
          <EditorStateLoader json={json} />
          <RichTextPlugin
            contentEditable={<ContentEditable className="prose max-w-none" />}
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </LexicalComposer>
      </CardContent>
    </Card>
  );
}