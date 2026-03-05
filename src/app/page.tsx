'use client';

import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChatAssistant } from '@/components/ChatAssistant';
import { DocumentUploader } from '@/components/DocumentUploader';
import { 
  Search, 
  FileText, 
  UserCheck, 
  Calculator, 
  Users, 
  FileSignature, 
  ShoppingCart, 
  PackageCheck, 
  CreditCard,
  BookOpen,
  ClipboardList,
  CheckCircle,
  DollarSign,
  PlusCircle,
  Download,
  ChevronRight,
  Clock,
  Building2,
  FileQuestion,
  MessageCircle,
  Upload,
  Settings,
} from 'lucide-react';
import { procurementProcesses, policyCategories, quickLinks } from '@/lib/data';

// 图标映射
const iconMap: Record<string, any> = {
  FileText,
  UserCheck,
  Calculator,
  Users,
  FileSignature,
  ShoppingCart,
  PackageCheck,
  CreditCard,
  BookOpen,
  ClipboardList,
  CheckCircle,
  DollarSign,
  PlusCircle,
  Download,
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);

  // 获取已上传文档
  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      const data = await response.json();
      setUploadedDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  // 初始化加载文档
  useEffect(() => {
    fetchDocuments();
  }, []);

  // 搜索过滤
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return policyCategories;

    return policyCategories.map(category => ({
      ...category,
      documents: category.documents.filter(
        doc =>
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.content.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    })).filter(category => category.documents.length > 0);
  }, [searchQuery]);

  // 统计数据
  const totalDocuments = policyCategories.reduce((sum, cat) => sum + cat.documents.length, 0);
  const totalProcesses = procurementProcesses.length;

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
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">采购流程与制度查询</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">企业采购一站式服务平台</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="hidden sm:flex">
                {totalDocuments + uploadedDocuments.length} 项制度
              </Badge>
              <Badge variant="outline" className="hidden sm:flex">
                {totalProcesses} 个流程节点
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
                placeholder="搜索流程、制度、文档..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pl-12 pr-4 text-base shadow-lg"
              />
            </div>
            {searchQuery && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                找到 {filteredCategories.reduce((sum, cat) => sum + cat.documents.length, 0)} 个相关结果
              </p>
            )}
          </div>
        </div>

        {/* 快速入口 */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {quickLinks.map((link, index) => {
            const IconComponent = iconMap[link.icon] || FileText;
            return (
              <Card 
                key={index} 
                className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
                    <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{link.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{link.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 主内容区域 */}
        <Tabs defaultValue="process" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="process">采购流程</TabsTrigger>
            <TabsTrigger value="policy">制度文档</TabsTrigger>
          </TabsList>

          {/* 采购流程 */}
          <TabsContent value="process" className="space-y-6">
            <div className="grid gap-4">
              {procurementProcesses.map((process, index) => {
                const IconComponent = iconMap[process.icon] || FileText;
                return (
                  <Card key={process.id} className="overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      {/* 步骤编号 */}
                      <div className="flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 p-6 sm:w-32">
                        <div className="text-center">
                          <div className="mb-2 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-white/20 backdrop-blur">
                            <IconComponent className="h-8 w-8 text-white" />
                          </div>
                          <div className="text-2xl font-bold text-white">步骤 {process.id}</div>
                        </div>
                      </div>

                      {/* 内容区域 */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                              {process.title}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                              {process.description}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-400">负责部门：</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {process.department}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-400">预计时间：</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {process.timeline}
                            </span>
                          </div>
                        </div>

                        {/* 相关文档 */}
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">所需文档：</p>
                          <div className="flex flex-wrap gap-2">
                            {process.documents.map((doc, docIndex) => (
                              <Badge key={docIndex} variant="outline" className="text-xs">
                                {doc}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 流程箭头 */}
                    {index < procurementProcesses.length - 1 && (
                      <div className="flex justify-center py-2 bg-slate-50 dark:bg-slate-800/50">
                        <div className="h-8 w-0.5 bg-gradient-to-b from-blue-500 to-blue-300" />
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* 制度文档 */}
          <TabsContent value="policy" className="space-y-6">
            {filteredCategories.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">未找到相关制度文档</p>
              </Card>
            ) : (
              <Accordion type="multiple" className="space-y-4">
                {filteredCategories.map((category) => {
                  const IconComponent = iconMap[category.icon] || FileText;
                  return (
                    <AccordionItem 
                      key={category.id} 
                      value={category.id}
                      className="border rounded-lg bg-white dark:bg-slate-900"
                    >
                      <AccordionTrigger className="px-6 hover:no-underline">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                            <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {category.title}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {category.documents.length} 项文档
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6">
                        <div className="space-y-3">
                          {category.documents.map((doc) => (
                            <Card 
                              key={doc.id} 
                              className="cursor-pointer hover:shadow-md transition-shadow"
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <CardTitle className="text-base">{doc.title}</CardTitle>
                                    <CardDescription className="mt-1">
                                      {doc.description}
                                    </CardDescription>
                                  </div>
                                  <Badge variant="secondary" className="text-xs shrink-0">
                                    {doc.updateTime}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                  <pre className="whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                                    {doc.content.trim().substring(0, 200)}...
                                  </pre>
                                </div>
                                <Button variant="ghost" size="sm" className="mt-2">
                                  查看完整内容
                                  <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* 底部 */}
      <footer className="border-t bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
            <p>© 2024 企业采购服务平台 · 内部使用</p>
            <div className="flex gap-4">
              <span>如有疑问可咨询智能助手</span>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsChatOpen(true)}
              >
                <MessageCircle className="h-4 w-4" />
                智能问答
              </Button>
            </div>
          </div>
        </div>
      </footer>

      {/* 智能问答助手 */}
      <ChatAssistant isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />

      {/* 文档上传对话框 */}
      <DocumentUploader
        isOpen={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        documents={uploadedDocuments}
        onDocumentsChange={fetchDocuments}
      />
    </div>
  );
}
