import { NextRequest, NextResponse } from 'next/server'
import { SearchEngine } from '@/lib/search-engine'
import path from 'path'

let searchEngine: SearchEngine | null = null

export async function POST(request: NextRequest) {
  try {
    if (!searchEngine) {
      searchEngine = new SearchEngine()
    }

    // public/documents ディレクトリをインデックス化
    const documentsDir = path.join(process.cwd(), 'public', 'documents')
    
    await searchEngine.indexDocuments(documentsDir)
    
    const documents = searchEngine.getDocuments()
    
    return NextResponse.json({
      success: true,
      message: `${documents.length}個のドキュメントをインデックス化しました`,
      documents: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        type: doc.type
      }))
    })
  } catch (error) {
    console.error('Indexing error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'ドキュメントのインデックス化中にエラーが発生しました',
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