import { NextRequest } from 'next/server';

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
    // 检查 API Key 配置 - 支持 DeepSeek 或 OpenAI
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
    const apiBaseUrl = process.env.DEEPSEEK_API_KEY 
      ? 'https://api.deepseek.com/v1'
      : process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
    
    if (!apiKey) {
      console.error('API Key not configured');
      return new Response(JSON.stringify({ 
        error: 'API Key 未配置',
        message: '请在 Vercel 环境变量中配置 DEEPSEEK_API_KEY 或 OPENAI_API_KEY。\n\n推荐使用 DeepSeek（国内可直接访问）：\n1. 访问 https://platform.deepseek.com\n2. 注册/登录账号\n3. 创建 API Key\n4. 在 Vercel 添加环境变量 DEEPSEEK_API_KEY'
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
      { role: 'system', content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // 调用 OpenAI 兼容 API
    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_API_KEY ? 'deepseek-chat' : (process.env.OPENAI_MODEL || 'gpt-3.5-turbo'),
        messages: fullMessages,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', response.status, errorText);
      
      let errorMessage = `API 调用失败 (${response.status})`;
      if (response.status === 401) {
        errorMessage = 'API Key 无效，请检查配置';
      } else if (response.status === 403) {
        errorMessage = 'API 访问受限，建议使用 DeepSeek API（国内可直接访问）';
      } else if (response.status === 429) {
        errorMessage = 'API 请求频率超限，请稍后重试';
      }
      
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 流式转发响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`));
                  }
                } catch {
                  // 忽略解析错误
                }
              }
            }
          }
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
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
