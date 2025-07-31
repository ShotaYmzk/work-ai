import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    
    if (!filename) {
      return NextResponse.json(
        { error: 'ファイル名が指定されていません' },
        { status: 400 }
      )
    }

    const documentsDir = join(process.cwd(), 'public', 'documents')
    const filePath = join(documentsDir, filename)

    try {
      const content = await readFile(filePath, 'utf-8')
      
      return NextResponse.json({
        success: true,
        filename,
        content
      })

    } catch (error) {
      return NextResponse.json(
        { error: 'ファイルが見つからないか、読み込めませんでした' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('ファイル内容取得エラー:', error)
    return NextResponse.json(
      { error: 'ファイル内容の取得に失敗しました' },
      { status: 500 }
    )
  }
} 