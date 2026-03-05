'use client';

import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChatAssistant } from '@/components/ChatAssistant';
import { DocumentUploader } from '@/components/DocumentUploader';
import { 
  Search, 
  FileText, 
  ChevronRight,
  FileQuestion,
  MessageCircle,
  Upload,
  Settings,
} from 'lucide-react';

// 图标映射
const iconMap: Record<string, any> = {
  FileText,
  Upload,
  MessageCircle,
};

// 从 localStorage 加载文档
const loadDocuments = () => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('policy-documents');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

// 保存文档到 localStorage
const saveDocuments = (docs: any[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('policy-documents', JSON.stringify(docs));
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);

  // 客户端初始化
  useEffect(() => {
    setIsClient(true);
    setUploadedDocuments(loadDocuments());
  }, []);

  // 保存文档
  const handleDocumentsChange = (docs: any[]) => {
    setUploadedDocuments(docs);
    saveDocuments(docs);
  };

  // 搜索上传的文档
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return uploadedDocuments;
    return uploadedDocuments.filter(doc =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, uploadedDocuments]);

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md dark:bg-slate-900/80">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                <FileQuestion className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">企业制度查询平台</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">上传制度文档，智能问答</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="hidden sm:flex">
                {uploadedDocuments.length} 项制度
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsUploadOpen(true)}
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">上传制度</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 搜索区域 */}
        <div className="mb-8">
          <div className="mx-auto max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="搜索制度文档..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pl-12 pr-4 text-base shadow-lg"
              />
            </div>
            {searchQuery && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                找到 {filteredDocuments.length} 个相关结果
              </p>
            )}
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="space-y-6">
          {/* 文档列表 */}
          {uploadedDocuments.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
                  <Upload className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    暂无制度文档
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-4 max-w-md">
                    请点击右上角的"上传制度"按钮，上传制度文档
                  </p>
                  <Button onClick={() => setIsUploadOpen(true)} className="gap-2">
                    <Upload className="h-4 w-4" />
                    上传制度文档
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  已上传的制度文档
                </h2>
                <Button variant="outline" size="sm" onClick={() => setIsUploadOpen(true)} className="gap-2">
                  <Upload className="h-4 w-4" />
                  继续上传
                </Button>
              </div>
              <div className="grid gap-3">
                {filteredDocuments.map((doc) => {
                  const FileIcon = FileText;
                  return (
                    <Card key={doc.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                          <FileIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                              {doc.title}
                            </h3>
                            <Badge variant="outline" className="shrink-0">
                              {doc.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {doc.originalFileName} · {new Date(doc.uploadTime).toLocaleDateString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* 使用提示 */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-0">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white shrink-0">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                    智能问答助手
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    上传制度文档后，AI将自动学习文档内容。点击右下角的聊天按钮，即可向AI询问关于制度的问题。
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setIsChatOpen(true)} className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    开始问答
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* 底部 */}
      <footer className="border-t bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
            <p>企业制度查询平台 · 内部使用</p>
            <div className="flex gap-4">
              <span>数据保存在本地浏览器</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 智能问答助手 */}
      <ChatAssistant 
        isOpen={isChatOpen} 
        onToggle={() => setIsChatOpen(!isChatOpen)} 
        documents={uploadedDocuments}
      />

      {/* 文档上传对话框 */}
      <DocumentUploader
        isOpen={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        documents={uploadedDocuments}
        onDocumentsChange={handleDocumentsChange}
      />
    </div>
  );
}
