import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    
    if (!filename) {
      return NextResponse.json(
        { error: 'ファイル名が必要です' },
        { status: 400 }
      )
    }

    // ファイルパスを構築
    const documentsDir = join(process.cwd(), 'public', 'documents')
    const filePath = join(documentsDir, filename)

    try {
      // ファイルを読み込み
      const content = await readFile(filePath, 'utf-8')
      
      return NextResponse.json({
        success: true,
        content,
        filename,
      })
    } catch (error) {
      console.error(`ファイル読み込みエラー: ${filename}`, error)
      return NextResponse.json(
        { error: 'ファイルが見つからないか、読み込みに失敗しました' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('ファイル内容取得API エラー:', error)
    return NextResponse.json(
      { error: 'ファイル内容の取得中にエラーが発生しました' },
      { status: 500 }
    )
  }
} 