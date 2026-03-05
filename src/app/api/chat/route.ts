import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { documentsStore } from '@/lib/documents-store';

// 构建制度知识库上下文
function buildKnowledgeContext(): string {
  const uploadedDocs = documentsStore.getAll();
  
  if (uploadedDocs.length === 0) {
    return '';
  }

  let context = '# 企业制度知识库\n\n';
  context += '以下是企业上传的制度文档内容：\n\n';
  
  uploadedDocs.forEach(doc => {
    context += `## ${doc.title}\n`;
    context += `分类: ${doc.category}\n`;
    context += `上传时间: ${doc.uploadTime}\n\n`;
    context += `${doc.content}\n\n`;
    context += '---\n\n';
  });

  return context;
}

const SYSTEM_PROMPT = `你是企业制度智能助手，帮助员工解答关于公司各项流程、制度规定等问题。

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
5. 使用友好的语气，适当使用表情符号增加亲和力

## 当前知识库内容
${buildKnowledgeContext() || '（暂无制度文档，请先上传制度文档）'}

请根据以上知识库内容，为员工提供准确的制度咨询服务。如果知识库为空，请提示用户先上传制度文档。`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: '无效的请求参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 检查是否有文档
    const uploadedDocs = documentsStore.getAll();
    const hasDocuments = uploadedDocs.length > 0;

    // 提取并转发请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 如果没有文档，使用特殊提示
    let systemPrompt = SYSTEM_PROMPT;
    if (!hasDocuments) {
      systemPrompt = `你是企业制度智能助手。

当前系统中暂无制度文档，请友好地告知用户：
1. 系统暂未上传任何制度文档
2. 请点击页面右上角的"上传制度"按钮上传Word、PDF等格式的制度文档
3. 上传后AI将自动学习文档内容，即可进行智能问答

请用友好的语气引导用户上传文档，可以使用表情符号增加亲和力。`;
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
              // SSE 格式: data: {text}\n\n
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }

          // 发送结束标记
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: '生成回复时出现错误' })}\n\n`)
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
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: '服务器内部错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
