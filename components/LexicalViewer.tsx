// components/LexicalViewer.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DecoratorNode, LexicalNode, NodeKey } from 'lexical';
import { CustomTextNode } from './CustomTextNode';

// ShikiCodeNode definition
export class ShikiCodeNode extends DecoratorNode<React.ReactNode> {
  __html: string;

  static getType(): string {
    return 'shiki-code';
  }

  static clone(node: ShikiCodeNode): ShikiCodeNode {
    return new ShikiCodeNode(node.__html, node.__key);
  }

  constructor(html: string, key?: NodeKey) {
    super(key);
    this.__html = html;
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.innerHTML = this.__html;
    return div;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): React.ReactNode {
    return <div dangerouslySetInnerHTML={{ __html: this.__html }} />;
  }

  static importJSON(serializedNode: any): ShikiCodeNode {
    return $createShikiCodeNode(serializedNode.html);
  }
}

export function $createShikiCodeNode(html: string): ShikiCodeNode {
  return new ShikiCodeNode(html);
}

export function $isShikiCodeNode(node: LexicalNode | null | undefined): node is ShikiCodeNode {
  return node instanceof ShikiCodeNode;
}

// Theme configuration
const theme = {
  paragraph: 'mb-4',
  heading: { h1: 'text-3xl font-bold mb-4', h2: 'text-2xl font-semibold mb-3' },
  text: { bold: 'font-bold', italic: 'italic' },
  list: { ul: 'list-disc pl-6', ol: 'list-decimal pl-6' },
};

function Page({ pageJson }: { pageJson: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const updateEditorState = () => {
      try {
        const state = editor.parseEditorState(pageJson);
        if (state.isEmpty()) {
          console.warn('Parsed editor state is empty. Skipping update.');
          return;
        }
        editor.setEditorState(state);
      } catch (error) {
        console.error('Error setting page state:', error);
      }
    };

    const rafId = requestAnimationFrame(updateEditorState);
    return () => cancelAnimationFrame(rafId);
  }, [editor, pageJson]);

  return (
    <RichTextPlugin
      contentEditable={<ContentEditable className="prose max-w-none p-2" />}
      placeholder={null}
      ErrorBoundary={LexicalErrorBoundary}
    />
  );
}

export default function LexicalViewer({ json }: { json: string }) {
  const [currentPage, setCurrentPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  let parsedState;
  try {
    parsedState = JSON.parse(json);
    if (parsedState.root.children.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>No content to display</CardContent>
        </Card>
      );
    }
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>Error loading content</CardContent>
      </Card>
    );
  }

  const nodesPerPage = 5;
  const totalNodes = parsedState.root.children.length;
  const pageCount = Math.ceil(totalNodes / nodesPerPage);

  const getVisiblePages = (current: number) => {
    const pagesBefore = 2;
    const pagesAfter = 2;
    let start = Math.max(0, current - pagesBefore);
    let end = Math.min(pageCount, current + pagesAfter + 1);

    const visibleCount = end - start;
    if (visibleCount < 5) {
      if (start === 0) end = Math.min(5, pageCount);
      else if (end === pageCount) start = Math.max(0, pageCount - 5);
    }
    return Array.from({ length: end - start }, (_, i) => start + i);
  };

  const initialVisiblePages = Array.from({ length: Math.min(3, pageCount) }, (_, i) => i);
  const [visiblePages, setVisiblePages] = useState<number[]>(initialVisiblePages);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageIndex = parseInt(entry.target.getAttribute('data-page') || '0', 10);
            setCurrentPage(pageIndex);
            setVisiblePages(getVisiblePages(pageIndex));
          }
        });
      },
      { root: containerRef.current, threshold: 0.2 }
    );
    observerRef.current = observer;

    pageRefs.current.forEach((ref) => ref && observer.observe(ref));

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [pageCount, visiblePages]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="max-h-[80vh] overflow-y-auto space-y-4">
          {visiblePages.map((idx) => {
            const start = idx * nodesPerPage;
            const end = start + nodesPerPage;
            const pageNodes = parsedState.root.children.slice(start, end);
            const pageJson = JSON.stringify({
              root: { ...parsedState.root, children: pageNodes },
            });

            if (pageNodes.length === 0) {
              return (
                <div
                  key={idx}
                  ref={(el) => (pageRefs.current[idx] = el)}
                  data-page={idx}
                  className="transition-opacity duration-300"
                >
                  <p>No content on this page</p>
                </div>
              );
            }

            return (
              <div
                key={idx}
                ref={(el) => (pageRefs.current[idx] = el)}
                data-page={idx}
                className="transition-opacity duration-300"
              >
                <LexicalComposer
                  initialConfig={{
                    namespace: `Page${idx}`,
                    theme,
                    nodes: [HeadingNode, ListNode, ListItemNode, ShikiCodeNode, CustomTextNode],
                    editable: false,
                    onError: console.error,
                  }}
                >
                  <Page pageJson={pageJson} />
                </LexicalComposer>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}