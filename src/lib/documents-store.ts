// 全局文档存储（内存存储，演示用）
// 生产环境建议使用数据库（如 Supabase）

interface UploadedDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  originalFileName: string;
  fileType: string;
  fileKey: string;
  uploadTime: string;
  fileSize: number;
}

// 使用 global 来保持数据在热重载时不丢失
declare global {
  var documentsStore: UploadedDocument[] | undefined;
}

// 初始化全局存储
if (!global.documentsStore) {
  global.documentsStore = [];
}

export const documentsStore = {
  getAll: (): UploadedDocument[] => {
    return global.documentsStore || [];
  },

  add: (doc: UploadedDocument): void => {
    if (global.documentsStore) {
      global.documentsStore.push(doc);
    }
  },

  remove: (id: string): boolean => {
    if (global.documentsStore) {
      const index = global.documentsStore.findIndex(d => d.id === id);
      if (index !== -1) {
        global.documentsStore.splice(index, 1);
        return true;
      }
    }
    return false;
  },

  clear: (): void => {
    global.documentsStore = [];
  },
};

export type { UploadedDocument };
