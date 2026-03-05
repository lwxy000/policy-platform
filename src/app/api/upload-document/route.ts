import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { FetchClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;
    const title = formData.get('title') as string;

    if (!file) {
      return NextResponse.json({ error: '请选择要上传的文件' }, { status: 400 });
    }

    // 支持的文件类型
    const supportedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/markdown',
    ];

    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const supportedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'md'];

    if (!supportedTypes.includes(file.type) && !supportedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: '不支持的文件格式，请上传 PDF、Word、Excel、PPT 或文本文件' },
        { status: 400 }
      );
    }

    // 读取文件内容
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 上传到对象存储
    const fileName = `documents/${Date.now()}_${file.name}`;
    const fileKey = await storage.uploadFile({
      fileContent: fileBuffer,
      fileName: fileName,
      contentType: file.type || 'application/octet-stream',
    });

    // 生成签名URL
    const signedUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 3600, // 1小时有效
    });

    // 使用 FetchClient 解析文档内容
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const fetchClient = new FetchClient(config, customHeaders);

    const fetchResponse = await fetchClient.fetch(signedUrl);

    // 提取文本内容
    let textContent = '';
    if (fetchResponse.content) {
      const textItems = fetchResponse.content.filter((item: any) => item.type === 'text');
      textContent = textItems.map((item: any) => item.text).join('\n');
    }

    // 构建文档信息
    const documentInfo = {
      id: `doc-${Date.now()}`,
      title: title || file.name.replace(/\.[^/.]+$/, ''),
      category: category || '未分类',
      content: textContent,
      originalFileName: file.name,
      fileType: file.type || fileExtension,
      fileKey: fileKey,
      uploadTime: new Date().toISOString(),
      fileSize: file.size,
    };

    return NextResponse.json({
      success: true,
      document: documentInfo,
      message: '文档上传并解析成功',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: '文件上传失败，请稍后重试' },
      { status: 500 }
    );
  }
}
