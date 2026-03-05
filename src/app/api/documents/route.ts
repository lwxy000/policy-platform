import { NextRequest, NextResponse } from 'next/server';
import { documentsStore } from '@/lib/documents-store';

export async function GET() {
  const documents = documentsStore.getAll();
  return NextResponse.json({
    documents,
    total: documents.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const document = await request.json();
    
    documentsStore.add(document);
    
    return NextResponse.json({
      success: true,
      message: '文档已添加到知识库',
      total: documentsStore.getAll().length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: '添加文档失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    documentsStore.remove(id);
    
    return NextResponse.json({
      success: true,
      message: '文档已删除',
      total: documentsStore.getAll().length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: '删除文档失败' },
      { status: 500 }
    );
  }
}
