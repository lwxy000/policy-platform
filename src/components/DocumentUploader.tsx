'use client';

import { useState, useRef } from 'react';
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
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// 设置 PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

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
  const [parseProgress, setParseProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
      setUploadStatus('idle');
      setParseProgress('');
    }
  };

  // 解析 PDF 文件
  const parsePDF = async (file: File): Promise<string> => {
    setParseProgress('正在解析 PDF 文件...');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    const totalPages = pdf.numPages;
    
    for (let i = 1; i <= totalPages; i++) {
      setParseProgress(`正在解析 PDF 第 ${i}/${totalPages} 页...`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  };

  // 解析 Word 文件
  const parseWord = async (file: File): Promise<string> => {
    setParseProgress('正在解析 Word 文件...');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  };

  // 解析文本文件
  const parseTextFile = async (file: File): Promise<string> => {
    setParseProgress('正在读取文本文件...');
    return await file.text();
  };

  // 根据文件类型选择解析方法
  const readFileContent = async (file: File): Promise<string> => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const mimeType = file.type;

    // PDF 文件
    if (extension === 'pdf' || mimeType === 'application/pdf') {
      return await parsePDF(file);
    }

    // Word 文件
    if (
      extension === 'doc' || 
      extension === 'docx' ||
      mimeType === 'application/msword' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return await parseWord(file);
    }

    // 文本文件
    if (
      mimeType.startsWith('text/') ||
      extension === 'txt' ||
      extension === 'md'
    ) {
      return await parseTextFile(file);
    }

    // 其他文件类型，提示不支持
    return `[文件: ${file.name}]\n\n此文件格式暂不支持自动解析。支持的格式：\n- PDF 文档 (.pdf)\n- Word 文档 (.doc, .docx)\n- 文本文件 (.txt, .md)\n\n建议将内容复制后保存为上述格式再上传。`;
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
    setParseProgress('');

    try {
      // 读取并解析文件内容
      const content = await readFileContent(file);

      if (!content || content.trim().length === 0) {
        throw new Error('文件内容为空，无法解析');
      }

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

      setParseProgress('');
      setUploadStatus('success');
      setFile(null);
      setTitle('');
      setCategory('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // 1.5秒后关闭对话框
      setTimeout(() => {
        onOpenChange(false);
        setUploadStatus('idle');
      }, 1500);
    } catch (error: any) {
      console.error('Upload error:', error);
      setErrorMessage(error.message || '文件处理失败，请重试');
      setUploadStatus('error');
      setParseProgress('');
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
            支持 PDF、Word、TXT、Markdown 等格式，自动解析内容
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
                      setParseProgress('');
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

            {/* 解析进度 */}
            {parseProgress && (
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{parseProgress}</span>
              </div>
            )}

            {/* 支持的格式说明 */}
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-xs text-green-600 dark:text-green-400">
                ✅ 支持自动解析的格式：
              </p>
              <ul className="text-xs text-green-600 dark:text-green-400 mt-1 list-disc list-inside">
                <li>PDF 文档 (.pdf) - 自动提取文字内容</li>
                <li>Word 文档 (.doc, .docx) - 自动提取文字内容</li>
                <li>文本文件 (.txt, .md) - 直接读取内容</li>
              </ul>
            </div>

            {/* 状态提示 */}
            {uploadStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">文档上传成功！AI 已学习该文档内容</span>
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
