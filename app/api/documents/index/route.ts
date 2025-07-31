import { NextRequest, NextResponse } from 'next/server'
import { SearchEngine } from '@/lib/search-engine'
import path from 'path'

let searchEngine: SearchEngine | null = null

export async function POST(request: NextRequest) {
  try {
    // 検索エンジンを再作成して完全に再インデックス化
    searchEngine = new SearchEngine()
    const documentsDir = path.join(process.cwd(), 'public', 'documents')
    
    await searchEngine.indexDocuments(documentsDir)
    const stats = searchEngine.getStats()
    
    console.log('手動再インデックス化完了:', stats)
    
    return NextResponse.json({
      success: true,
      message: 'RAGシステムの再インデックス化が完了しました',
      stats
    })
  } catch (error) {
    console.error('再インデックス化エラー:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '再インデックス化中にエラーが発生しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!searchEngine || !searchEngine.isReady()) {
      return NextResponse.json({
        success: false,
        message: 'ドキュメントがまだインデックス化されていません'
      })
    }

    const documents = searchEngine.getDocuments()
    
    return NextResponse.json({
      success: true,
      documents: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        type: doc.type
      }))
    })
  } catch (error) {
    console.error('Error getting documents:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'ドキュメント一覧の取得中にエラーが発生しました' 
      },
      { status: 500 }
    )
  }
}

// 検索エンジンインスタンスを他のAPIからも使用できるようにエクスポート
export { searchEngine } 