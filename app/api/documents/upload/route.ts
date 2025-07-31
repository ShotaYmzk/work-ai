import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      )
    }

    // サポートされるファイル形式をチェック
    const supportedTypes = ['.txt', '.md', '.pdf']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!supportedTypes.includes(fileExtension)) {
      return NextResponse.json(
        { error: `サポートされていないファイル形式です。対応形式: ${supportedTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // ファイルの内容をバッファとして取得
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // public/documentsディレクトリに保存
    const documentsDir = join(process.cwd(), 'public', 'documents')
    
    // ディレクトリが存在しない場合は作成
    try {
      await mkdir(documentsDir, { recursive: true })
    } catch (error) {
      // ディレクトリが既に存在する場合は無視
    }

    // ファイル名を安全にする（スペースをアンダースコアに変換、タイムスタンプ追加）
    const timestamp = Date.now()
    const safeFileName = `${timestamp}_${file.name.replace(/\s+/g, '_')}`
    const filePath = join(documentsDir, safeFileName)

    // ファイルを保存
    await writeFile(filePath, buffer)

    // 検索エンジンを再インデックス化
    try {
      const engine = await getSearchEngine()
      await engine.indexDocuments(documentsDir)
      console.log(`検索エンジンを再インデックス化しました。新しいファイル: ${safeFileName}`)
    } catch (indexError) {
      console.error('検索エンジンの再インデックス化に失敗:', indexError)
      // インデックス化に失敗してもファイルアップロードは成功とする
    }

    return NextResponse.json({
      success: true,
      filename: safeFileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
      indexed: true, // インデックス化が完了したことを示す
      message: 'ファイルがアップロードされ、RAGシステムに統合されました'
    })

  } catch (error) {
    console.error('ファイルアップロードエラー:', error)
    return NextResponse.json(
      { error: 'ファイルのアップロードに失敗しました' },
      { status: 500 }
    )
  }
} 