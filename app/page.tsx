// page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import FileDrop from '@/components/FileDrop';
import LexicalViewer from '@/components/LexicalViewer';
import { parseMarkdownToAst } from '@/lib/parseMarkdownAst';
import { mdastToLexicalJson } from '@/lib/mdastToLexical';
import { Card, CardContent } from '@/components/ui/card';
import { useFileStore } from '@/lib/store';
import Sidebar from '@/components/Sidebar';

export default function HomePage() {
  const { files, selectedFileId, addFile, selectFile, clearSelectedFile } = useFileStore();
  const [lexicalJson, setLexicalJson] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const selectedFile = files.find((file) => file.id === selectedFileId);

  useEffect(() => {
    if (!selectedFile) {
      setLexicalJson(null);
      return;
    }
    setLexicalJson(null); // Clear previous content
    setLoading(true);
    setError(null);
    try {
      const ast = parseMarkdownToAst(selectedFile.content);
      const json = mdastToLexicalJson(ast);
      console.log('Generated JSON length:', json.length);
      setLexicalJson(json);
    } catch (err) {
      console.error('Error processing Markdown:', err);
      setError('Failed to process Markdown');
    } finally {
      setLoading(false);
    }
  }, [selectedFile]);

  const handleFileRead = async (content: string, filename: string) => {
    try {
      console.log('Processing new file:', filename);
      const id = await addFile({ filename, content, id: undefined });
      console.log('File added with ID:', id);
      selectFile(id);
      console.log('Selected file ID set to:', id);
    } catch (err) {
      console.error('Error adding file:', err);
      setError('Failed to add file');
    }
  };

  useEffect(() => {
    const mainElement = mainRef.current;
    if (!mainElement) return;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      const MAX_FILE_SIZE = 500_000; // 500 KB
      if (file) {
        if (file.size > MAX_FILE_SIZE) {
          alert('File is too large. Max allowed size is 500KB.');
          return;
        }
        if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
          clearSelectedFile(); // Clear the current selected file before processing the new one
          const reader = new FileReader();
          reader.onload = () => {
            handleFileRead(reader.result as string, file.name);
          };
          reader.readAsText(file, 'utf-8');
        } else {
          alert('Please drop a .md or .txt file only.');
        }
      }
    };

    mainElement.addEventListener('dragenter', handleDragEnter);
    mainElement.addEventListener('dragover', handleDragOver);
    mainElement.addEventListener('dragleave', handleDragLeave);
    mainElement.addEventListener('drop', handleDrop);

    return () => {
      mainElement.removeEventListener('dragenter', handleDragEnter);
      mainElement.removeEventListener('dragover', handleDragOver);
      mainElement.removeEventListener('dragleave', handleDragLeave);
      mainElement.removeEventListener('drop', handleDrop);
    };
  }, [handleFileRead, clearSelectedFile]);

  return (
    <main
      ref={mainRef}
      className={`min-h-screen flex justify-center ${isDragging ? 'bg-gray-200' : ''}`}
    >
      <Sidebar />
      <div className="w-full max-w-4xl space-y-6 p-8">
        {files.length === 0 && (
          <FileDrop onFileRead={(content, filename) => handleFileRead(content, filename)} />
        )}
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