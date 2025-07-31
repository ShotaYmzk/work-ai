import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { SearchEngine } from '@/lib/search-engine'

// グローバルな検索エンジンインスタンス
let searchEngine: SearchEngine | null = null

async function getSearchEngine() {
  if (!searchEngine) {
    searchEngine = new SearchEngine()
    const documentsDir = join(process.cwd(), 'public', 'documents')
    await searchEngine.indexDocuments(documentsDir)
  }
  return searchEngine
}

export async function DELETE(request: NextRequest) {
  try {
    const { filename } = await request.json()
    
    if (!filename || typeof filename !== 'string') {
      return NextResponse.json(
        { error: 'ファイル名が必要です' },
        { status: 400 }
      )
    }

    // ファイルパスを構築
    const documentsDir = join(process.cwd(), 'public', 'documents')
    const filePath = join(documentsDir, filename)

    try {
      // ファイルを削除
      await unlink(filePath)
      console.log(`ファイルを削除しました: ${filename}`)
    } catch (error) {
      console.error(`ファイル削除エラー: ${filename}`, error)
      return NextResponse.json(
        { error: 'ファイルの削除に失敗しました' },
        { status: 404 }
      )
    }

    // 検索エンジンを再インデックス化（削除後）
    try {
      const engine = await getSearchEngine()
      await engine.indexDocuments(documentsDir)
      console.log(`検索エンジンを再インデックス化しました。削除されたファイル: ${filename}`)
    } catch (indexError) {
      console.error('検索エンジンの再インデックス化に失敗:', indexError)
      // インデックス化に失敗してもファイル削除は成功とする
    }

    return NextResponse.json({
      success: true,
      message: 'ファイルが削除され、RAGシステムから除外されました',
      filename: filename
    })

  } catch (error) {
    console.error('ファイル削除API エラー:', error)
    return NextResponse.json(
      { error: 'ファイルの削除中にエラーが発生しました' },
      { status: 500 }
    )
  }
} 