import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
interface Params {
  params: {
    id: string;
  };
}
export async function GET(
  request: NextRequest,
  { params }: { params: Params }) {
  try {
    const { id } = await params;
    const conversation = await prisma.conversation.findUnique({
      where: { id},
      include: {
        messages: {
          include: {
            citations: {
              include: {
                document: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const formattedMessages = conversation.messages.map(message => ({
      id: message.id,
      content: message.content,
      role: message.role,
      createdAt: message.createdAt.toISOString(),
      citations: message.citations.map(citation => ({
        id: citation.id,
        content: citation.content,
        filename: citation.document.originalName,
        pageNumber: citation.pageNumber,
      }))
    }))

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        messages: formattedMessages
      }
    })
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }) {
  try {
    const { id } = await params;
    await prisma.conversation.delete({
      where: { id}
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting conversation:', error)
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}