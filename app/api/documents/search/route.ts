import { NextRequest, NextResponse } from 'next/server'
import { SearchEngine } from '@/lib/search-engine'
import { GoogleGenerativeAI } from '@google/generative-ai'
import path from 'path'

let searchEngine: SearchEngine | null = null
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyCr1mI5VNZDcofTRW7hlEIGjKDPtE8ew6o')

async function initializeSearchEngine() {
  if (!searchEngine) {
    searchEngine = new SearchEngine()
    const documentsDir = path.join(process.cwd(), 'public', 'documents')
    await searchEngine.indexDocuments(documentsDir)
  }
  return searchEngine
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: '検索クエリが必要です' },
        { status: 400 }
      )
    }

    // 検索エンジンを初期化
    const engine = await initializeSearchEngine()
    
    // 検索実行
    const searchResults = engine.search(query, 3) // 上位3件

    if (searchResults.length === 0) {
      return NextResponse.json({
        success: true,
        query,
        results: [],
        summary: '関連するドキュメントが見つかりませんでした。'
      })
    }

    // Gemini APIで検索結果を要約
    let summary = ''
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      
      const summaryPrompt = `以下の検索結果を基に、ユーザーの質問「${query}」に対する回答を日本語で簡潔にまとめてください。

検索結果:
${searchResults.map((result, index) => 
  `${index + 1}. ${result.document.title}\n${result.snippet}\n`
).join('\n')}

回答:`

      const result = await model.generateContent(summaryPrompt)
      const response = await result.response
      summary = response.text()
    } catch (error) {
      console.error('Gemini API error:', error)
      summary = '検索結果の要約生成中にエラーが発生しました。'
    }

    return NextResponse.json({
      success: true,
      query,
      results: searchResults.map(result => ({
        id: result.document.id,
        title: result.document.title,
        snippet: result.snippet,
        score: result.score,
        type: result.document.type
      })),
      summary
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '検索中にエラーが発生しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 