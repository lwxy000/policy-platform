import { NextRequest } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

// 构建制度知识库上下文
function buildKnowledgeContext(documents: any[]): string {
  if (!documents || documents.length === 0) {
    return '';
  }

  let context = '# 企业制度知识库\n\n';
  context += '以下是企业上传的制度文档内容：\n\n';
  
  documents.forEach(doc => {
    context += `## ${doc.title}\n`;
    context += `分类: ${doc.category}\n`;
    context += `上传时间: ${doc.uploadTime}\n\n`;
    context += `${doc.content}\n\n`;
    context += '---\n\n';
  });

  return context;
}

export async function POST(request: NextRequest) {
  try {
    // 检查 API Key 配置
    const apiKey = process.env.DOUBAO_API_KEY;
    
    if (!apiKey) {
      console.error('DOUBAO_API_KEY not configured');
      return new Response(JSON.stringify({ 
        error: 'API Key 未配置',
        message: '请在 Vercel 环境变量中配置 DOUBAO_API_KEY。\n\n获取方式：\n1. 访问 https://console.volcengine.com/ark\n2. 注册/登录火山引擎\n3. 开通豆包大模型服务\n4. 创建 API Key 并复制\n5. 在 Vercel 项目设置 → Environment Variables 中添加 DOUBAO_API_KEY'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { messages, documents } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: '无效的请求参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 检查是否有文档
    const hasDocuments = documents && documents.length > 0;

    // 使用用户配置的 API Key 初始化客户端
    const config = new Config({ apiKey });
    const client = new LLMClient(config);

    // 构建系统提示
    let systemPrompt: string;
    
    if (!hasDocuments) {
      systemPrompt = `你是企业制度智能助手。

当前系统中暂无制度文档，请友好地告知用户：
1. 系统暂未上传任何制度文档
2. 请点击页面右上角的"上传制度"按钮上传制度文档
3. 上传后AI将自动学习文档内容，即可进行智能问答

请用友好的语气引导用户上传文档。`;
    } else {
      const knowledgeContext = buildKnowledgeContext(documents);
      systemPrompt = `你是企业制度智能助手，帮助员工解答关于公司各项流程、制度规定等问题。

## 你的职责
1. 准确回答员工关于公司制度的问题
2. 解释制度的具体规定和操作流程
3. 指导员工如何办理相关事项
4. 提供所需的文档清单和办理步骤

## 回答原则
1. 基于提供的制度知识库回答，不要编造信息
2. 回答要准确、简洁、实用
3. 如果知识库中没有相关信息，友好地告知用户需要联系相关负责人
4. 提供具体的操作步骤和所需材料
5. 使用友好的语气

## 当前知识库内容
${knowledgeContext}

请根据以上知识库内容，为员工提供准确的制度咨询服务。`;
    }

    // 构建完整的消息列表
    const fullMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const llmStream = client.stream(fullMessages, {
            model: 'doubao-seed-1-6-251015',
            temperature: 0.7,
          });

          for await (const chunk of llmStream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error: any) {
          console.error('Stream error:', error);
          const errorMessage = error?.message || '生成回复时出现错误';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ 
      error: '服务器内部错误',
      message: error?.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
