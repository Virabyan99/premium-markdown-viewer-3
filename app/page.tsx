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
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

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

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragCounter((prev) => {
      const newCount = prev + 1;
      if (newCount === 1) {
        setIsDragging(true);
      }
      return newCount;
    });
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragCounter((prev) => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDragging(false);
      }
      return newCount;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setDragCounter(0);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.md')) {
      alert('Please upload a .md file only.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setRawMarkdown(reader.result as string);
    reader.readAsText(file);
  };

  return (
    <main
      className={`min-h-screen flex flex-col items-center justify-center p-8`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
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