'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  FileText,
  File,
  FileSpreadsheet,
  Presentation,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
} from 'lucide-react';

interface UploadedDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  originalFileName: string;
  fileType: string;
  uploadTime: string;
  fileSize: number;
}

interface DocumentUploaderProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  documents: UploadedDocument[];
  onDocumentsChange: (docs: UploadedDocument[]) => void;
}

const FILE_TYPE_ICONS: Record<string, any> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  ppt: Presentation,
  pptx: Presentation,
  txt: File,
  md: File,
};

const CATEGORIES = [
  '采购流程',
  '审批制度',
  '财务制度',
  '人事制度',
  '行政制度',
  '其他制度',
];

export function DocumentUploader({
  isOpen,
  onOpenChange,
  documents,
  onDocumentsChange,
}: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
      setUploadStatus('idle');
    }
  };

  // 读取文件内容
  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };

      // 对于文本文件直接读取
      if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else {
        // 对于其他文件（Word、PDF等），提示用户复制内容
        resolve(`[文件: ${file.name}]\n\n此文件格式需要手动复制内容。请打开原文件，复制文本内容后粘贴到下方。\n\n提示：对于 Word/PDF 文件，您可以：\n1. 打开原文件\n2. 全选并复制内容\n3. 删除此文档，重新上传时粘贴内容`);
      }
    });
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage('请选择要上传的文件');
      setUploadStatus('error');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');
    setErrorMessage('');

    try {
      // 读取文件内容
      const content = await readFileContent(file);

      const newDocument: UploadedDocument = {
        id: `doc-${Date.now()}`,
        title: title || file.name.replace(/\.[^/.]+$/, ''),
        category: category || '其他制度',
        content: content,
        originalFileName: file.name,
        fileType: file.type || file.name.split('.').pop() || '',
        uploadTime: new Date().toISOString(),
        fileSize: file.size,
      };

      // 添加到文档列表
      onDocumentsChange([...documents, newDocument]);

      setUploadStatus('success');
      setFile(null);
      setTitle('');
      setCategory('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // 2秒后关闭对话框
      setTimeout(() => {
        onOpenChange(false);
        setUploadStatus('idle');
      }, 1500);
    } catch (error) {
      setErrorMessage('文件处理失败，请重试');
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    onDocumentsChange(documents.filter(doc => doc.id !== id));
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const Icon = FILE_TYPE_ICONS[ext] || File;
    return Icon;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            上传制度文档
          </DialogTitle>
          <DialogDescription>
            上传制度文档，支持 Word、PDF、Excel、PPT、TXT 等格式
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 已上传文档列表 */}
          {documents.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">已上传的文档 ({documents.length})</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {documents.map((doc) => {
                  const FileIcon = getFileIcon(doc.originalFileName);
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileIcon className="h-4 w-4 text-slate-500 shrink-0" />
                        <span className="text-sm truncate">{doc.title}</span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {doc.category}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-400 hover:text-red-500"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 上传区域 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">选择文件</Label>
              <div className="flex gap-2">
                <Input
                  ref={fileInputRef}
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                {file && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {file && (
                <p className="text-xs text-slate-500">
                  已选择: {file.name} ({formatFileSize(file.size)})
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">文档标题</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入文档标题（可选，默认为文件名）"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">分类</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="选择文档分类" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 提示信息 */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                💡 提示：对于 Word、PDF 等文件，上传后请在文档列表中点击查看，手动复制内容进行编辑。建议直接上传 TXT 或 Markdown 格式的纯文本文件，AI 可以直接学习内容。
              </p>
            </div>

            {/* 状态提示 */}
            {uploadStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">文档上传成功！</span>
              </div>
            )}
            {uploadStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{errorMessage}</span>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleUpload} disabled={!file || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  上传文档
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
