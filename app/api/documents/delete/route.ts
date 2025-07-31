import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { join } from 'path'

export async function DELETE(request: NextRequest) {
  try {
    const { filename } = await request.json()
    
    if (!filename) {
      return NextResponse.json(
        { error: 'ファイル名が指定されていません' },
        { status: 400 }
      )
    }

    const documentsDir = join(process.cwd(), 'public', 'documents')
    const filePath = join(documentsDir, filename)

    try {
      await unlink(filePath)
      
      return NextResponse.json({
        success: true,
        message: 'ファイルが正常に削除されました'
      })

    } catch (error) {
      return NextResponse.json(
        { error: 'ファイルが見つからないか、削除できませんでした' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('ファイル削除エラー:', error)
    return NextResponse.json(
      { error: 'ファイルの削除に失敗しました' },
      { status: 500 }
    )
  }
} 