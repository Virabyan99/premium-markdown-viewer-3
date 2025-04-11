'use client';

import { useState, useEffect } from 'react';
import FileDrop from '@/components/FileDrop';
import LexicalViewer from '@/components/LexicalViewer';
import { parseMarkdownToAst } from '@/lib/parseMarkdownAst';
import { mdastToLexicalJson } from '@/lib/mdastToLexical';
import { Card, CardContent } from '@/components/ui/card';
import type { Root } from 'mdast';

export default function HomePage() {
  const [rawMarkdown, setRawMarkdown] = useState<string | null>(null);
  const [lexicalJson, setLexicalJson] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rawMarkdown) return;
    setLoading(true);
    setError(null);
    setLexicalJson(null);
    try {
      const ast = parseMarkdownToAst(rawMarkdown);
      console.log('Parsed AST:', ast);
      const json = mdastToLexicalJson(ast);
      console.log('Lexical JSON:', json);
      setLexicalJson(json);
      setLoading(false);
    } catch (err) {
      console.error('Error processing Markdown:', err);
      setError('Failed to process Markdown');
      setLoading(false);
    }
  }, [rawMarkdown]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl space-y-6">
        {!lexicalJson && <FileDrop onFileRead={setRawMarkdown} />}
        {loading && (
          <Card>
            <CardContent className="pt-6 text-gray-500">Loading...</CardContent>
          </Card>
        )}
        {error && (
          <Card className="border-red-300">
            <CardContent className="pt-6 text-red-500">{error}</CardContent>
          </Card>
        )}
        {lexicalJson && !loading && !error && <LexicalViewer json={lexicalJson} />}
      </div>
    </main>
  );
}