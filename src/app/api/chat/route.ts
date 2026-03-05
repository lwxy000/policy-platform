import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { procurementProcesses, policyCategories } from '@/lib/data';

// 构建制度知识库上下文
function buildKnowledgeContext(): string {
  let context = '# 企业采购制度知识库\n\n';
  
  // 添加采购流程
  context += '## 采购流程\n\n';
  procurementProcesses.forEach(process => {
    context += `### 步骤${process.id}: ${process.title}\n`;
    context += `- 描述: ${process.description}\n`;
    context += `- 负责部门: ${process.department}\n`;
    context += `- 预计时间: ${process.timeline}\n`;
    context += `- 所需文档: ${process.documents.join('、')}\n\n`;
  });

  // 添加制度文档
  context += '## 制度文档\n\n';
  policyCategories.forEach(category => {
    context += `### ${category.title}\n\n`;
    category.documents.forEach(doc => {
      context += `#### ${doc.title}\n`;
      context += `${doc.description}\n\n`;
      context += `${doc.content}\n\n`;
    });
  });

  return context;
}

const SYSTEM_PROMPT = `你是企业采购流程与制度的智能助手，帮助员工解答关于采购流程、制度规定、审批流程等问题。

## 你的职责
1. 准确回答员工关于采购流程的问题
2. 解释采购制度的具体规定
3. 指导员工如何办理采购相关事项
4. 提供所需的文档清单和办理步骤

## 回答原则
1. 基于提供的制度知识库回答，不要编造信息
2. 回答要准确、简洁、实用
3. 如果问题超出制度范围，友好地告知用户
4. 提供具体的操作步骤和所需材料
5. 使用友好的语气，适当使用表情符号增加亲和力

## 知识库内容
${buildKnowledgeContext()}

请根据以上知识库内容，为员工提供准确的采购制度咨询服务。`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: '无效的请求参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 提取并转发请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建完整的消息列表
    const fullMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
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
