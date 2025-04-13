import Dexie from 'dexie';

export interface MarkdownFile {
  id?: number; // Auto-incremented by Dexie
  filename: string;
  content: string;
}

export class MarkdownDB extends Dexie {
  files: Dexie.Table<MarkdownFile, number>;

  constructor() {
    super('MarkdownDB');
    this.version(1).stores({
      files: '++id, filename', // '++id' is the primary key, filename is indexed
    });
    this.files = this.table('files');
  }
}

export const db = new MarkdownDB();