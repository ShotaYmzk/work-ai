import { NextRequest, NextResponse } from 'next/server'
import { SearchEngine } from '@/lib/search-engine'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Anthropic from '@anthropic-ai/sdk'
import path from 'path'

let searchEngine: SearchEngine | null = null
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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
    const { query, provider = 'gemini', getStatsOnly = false } = await request.json()

    // 検索エンジンを初期化
    const engine = await initializeSearchEngine()
    const searchStats = engine.getStats()

    // 統計情報のみを要求された場合
    if (getStatsOnly) {
      return NextResponse.json({
        success: true,
        searchStats
      })
    }

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: '検索クエリが必要です' },
        { status: 400 }
      )
    }
    
    // 検索実行（拡張版）
    const searchResults = engine.search(query, 5) // より多くの結果

    if (searchResults.length === 0) {
      return NextResponse.json({
        success: true,
        query,
        results: [],
        summary: '関連するドキュメントが見つかりませんでした。',
        searchStats
      })
    }

    // AI APIで検索結果を要約（強化版）
    let summary = ''
    try {
      const enhancedResults = searchResults.map((result, index) => ({
        title: result.document.title,
        snippet: result.snippet,
        relevantSections: result.relevantSections || [],
        matchedKeywords: result.matchedKeywords || [],
        score: result.score,
        type: result.document.type
      }))

      const summaryPrompt = `以下の検索結果を基に、ユーザーの質問「${query}」に対する**詳細で実用的な回答**を日本語で生成してください。

検索結果（関連度順）:
${enhancedResults.map((result, index) => {
  let resultText = `${index + 1}. 【${result.title}】（関連度: ${(result.score * 100).toFixed(1)}%）\n`
  resultText += `   タイプ: ${result.type}\n`
  if (result.matchedKeywords.length > 0) {
    resultText += `   マッチしたキーワード: ${result.matchedKeywords.join(', ')}\n`
  }
  resultText += `   内容: ${result.snippet}\n`
  if (result.relevantSections.length > 0) {
    resultText += `   関連セクション:\n${result.relevantSections.map(s => `   - ${s}`).join('\n')}\n`
  }
  return resultText
}).join('\n')}

要件:
- 検索結果の情報を最大限活用して包括的な回答を生成
- 具体的な情報、手順、数値を含める
- どの文書から引用したかを明記
- 実用的なアドバイスや次のステップを提案
- 見出しや箇条書きを使って構造化

回答:`

      if (provider === 'anthropic') {
        // Use Anthropic Claude
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: summaryPrompt,
            },
          ],
        })

        summary = response.content[0].type === 'text' ? response.content[0].text : ''
      } else {
        // Use Gemini (default)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
        const result = await model.generateContent(summaryPrompt)
        const response = await result.response
        summary = response.text()
      }
    } catch (error) {
      console.error('AI API error:', error)
      summary = '検索結果の要約生成中にエラーが発生しました。'
    }

    // 詳細な検索結果を返す
    const enhancedSearchResults = searchResults.map(result => ({
      id: result.document.id,
      title: result.document.title,
      snippet: result.snippet,
      score: result.score,
      type: result.document.type,
      matchedKeywords: result.matchedKeywords || [],
      relevantSections: result.relevantSections || [],
      summary: result.document.summary
    }))

    return NextResponse.json({
      success: true,
      query,
      results: enhancedSearchResults,
      summary,
      searchStats,
      totalResults: searchResults.length
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