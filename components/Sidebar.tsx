'use client';

import { useEffect } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFileStore } from '@/lib/store';
import { ChevronRight, X } from 'lucide-react';

export default function Sidebar() {
  const { files, selectedFileId, selectFile, loadFiles, deleteFile } = useFileStore();

  useEffect(() => {
    loadFiles(); // Load files from Dexie on component mount
  }, [loadFiles]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed left-4 top-6 transform -translate-y-1/2"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetTitle className="m-2">Uploaded Files</SheetTitle>
        <ScrollArea className="h-[calc(100%-2rem)]">
          {files.length === 0 ? (
            <p className="text-gray-500 p-2">No files uploaded yet.</p>
          ) : (
            <div className="space-y-2 p-2">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between">
                  <Button
                    variant={selectedFileId === file.id ? 'default' : 'ghost'}
                    className="flex-1 justify-start overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]"
                    onClick={() => selectFile(file.id!)}
                  >
                    {file.filename}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteFile(file.id!)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}