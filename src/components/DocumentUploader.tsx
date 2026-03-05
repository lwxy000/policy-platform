'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  fileKey: string;
  uploadTime: string;
  fileSize: number;
}

interface DocumentUploaderProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  documents: UploadedDocument[];
  onDocumentsChange: () => void;
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
  '采购基础知识',
  '审批流程',
  '供应商管理',
  '合同管理',
  '质量验收',
  '付款结算',
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
      // 自动填充标题
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
      setUploadStatus('idle');
    }
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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name.replace(/\.[^/.]+$/, ''));
      formData.append('category', category || '其他制度');

      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // 添加到文档库
        await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.document),
        });

        setUploadStatus('success');
        setFile(null);
        setTitle('');
        setCategory('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // 刷新文档列表
        onDocumentsChange();
        
        // 3秒后关闭对话框
        setTimeout(() => {
          onOpenChange(false);
          setUploadStatus('idle');
        }, 2000);
      } else {
        setErrorMessage(data.error || '上传失败');
        setUploadStatus('error');
      }
    } catch (error) {
      setErrorMessage('网络错误，请稍后重试');
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch('/api/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      onDocumentsChange();
    } catch (error) {
      console.error('Delete error:', error);
    }
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
            上传 Word、PDF、Excel、PPT 等格式的制度文档，AI 将自动解析并学习内容
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

            {/* 状态提示 */}
            {uploadStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">文档上传成功，AI已学习该制度内容</span>
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
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  上传并解析
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
