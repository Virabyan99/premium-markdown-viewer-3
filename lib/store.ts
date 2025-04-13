import { createJSONStorage, persist } from 'zustand/middleware'
import { create } from 'zustand'
import { db, MarkdownFile } from './db'

interface FileStore {
  files: MarkdownFile[]
  selectedFileId: number | null
  addFile: (file: MarkdownFile) => Promise<number> // Updated to return ID
  selectFile: (id: number) => void
  loadFiles: () => Promise<void>
  deleteFile: (id: number) => Promise<void>
}

export const useFileStore = create<FileStore>()(
  persist(
    (set, get) => ({
      files: [],
      selectedFileId: null,
      // In lib/store.ts
      addFile: async (file: MarkdownFile) => {
        if (!file.filename || typeof file.filename !== 'string') {
          throw new Error('Filename must be a non-empty string');
        }
        const newFile = { filename: file.filename, content: file.content }; // Create a fresh object
        const id = await db.files.add(newFile);
        set((state) => ({
          files: [...state.files, { ...newFile, id }],
        }));
        return id;
      },
      selectFile: (id: number) => set({ selectedFileId: id }),
      loadFiles: async () => {
        const files = await db.files.toArray()
        set({ files })
        if (files.length > 0 && get().selectedFileId === null) {
          set({ selectedFileId: files[0].id })
        }
      },
      deleteFile: async (id: number) => {
        await db.files.delete(id)
        set((state) => ({
          files: state.files.filter((file) => file.id !== id),
          selectedFileId:
            state.selectedFileId === id ? null : state.selectedFileId,
        }))
      },
    }),
    {
      name: 'file-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
