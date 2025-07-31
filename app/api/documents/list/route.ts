import { NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const documentsDir = join(process.cwd(), 'public', 'documents')
    
    try {
      const files = await readdir(documentsDir)
      const fileStats = await Promise.all(
        files.map(async (filename) => {
          const filePath = join(documentsDir, filename)
          const stats = await stat(filePath)
          
          return {
            name: filename,
            originalName: filename.replace(/_/g, ' '),
            size: stats.size,
            createdAt: stats.birthtime,
            updatedAt: stats.mtime,
            type: 'file'
          }
        })
      )

      return NextResponse.json({
        success: true,
        files: fileStats
      })

    } catch (error) {
      // ディレクトリが存在しない場合は空の配列を返す
      return NextResponse.json({
        success: true,
        files: []
      })
    }

  } catch (error) {
    console.error('ファイル一覧取得エラー:', error)
    return NextResponse.json(
      { error: 'ファイル一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
} 