import { GoogleGenerativeAI } from '@google/generative-ai'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getGlobalSearchEngine } from '@/lib/search-engine-manager'

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message, provider = 'gemini', useRAG: initialUseRAG = true } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'メッセージが必要です' },
        { status: 400 }
      )
    }

    let text = ''
    let sources: any[] = []
    let useRAG = initialUseRAG
    let relatedDocuments: any[] = []
    let searchStats: any = null

    if (useRAG) {
      // RAGモード：全文書を直接プロンプトに含める（デモ用）
      try {
        const engine = await getGlobalSearchEngine()
        const allDocuments = engine.getDocuments()
        searchStats = engine.getStats()
        
        console.log(`全文書参照モード: ${allDocuments.length}個の文書`)
        console.log('利用可能な文書:', allDocuments.map(doc => doc.title))
        
        if (allDocuments.length > 0) {
          // 関連文書を検索エンジンで特定（表示用）
          const searchResults = engine.search(message, 3) // 上位3件の関連文書
          
          // 表示用の参考文書は関連性の高いもののみ
          sources = searchResults.map(result => ({
            title: result.document.title,
            content: result.snippet,
            score: result.score,
            type: result.document.type,
            keywords: result.matchedKeywords || []
          }))

          // プロンプトには全文書を含める（回答精度向上のため）
          const ragPrompt = `あなたは株式会社Selectの専門的なAIアシスタントです。以下に会社の全ての文書内容を提供しますので、この情報を基にユーザーの質問に正確で詳細な回答を提供してください。

=== 会社の全文書 ===
${allDocuments.map((doc, index) => 
  `【文書${index + 1}: ${doc.title}】\n${doc.content}\n`
).join('\n---\n')}
=== 全文書ここまで ===

ユーザーの質問: "${message}"

回答要件：
1. **正確性**: 上記の文書内容のみを根拠として回答してください
2. **具体性**: 人名、数値、具体的な情報を含めて詳細に回答してください
3. **引用明確化**: どの文書から情報を引用したかを明記してください
4. **完全性**: 質問に関連する全ての情報を漏れなく提供してください
5. **構造化**: 見出しや箇条書きを使って読みやすく整理してください
6. **関連性重視**: 特に以下の関連度の高い文書を重点的に参照してください：
${searchResults.map((result, index) => 
  `   - ${result.document.title} (関連度: ${(result.score * 100).toFixed(1)}%)`
).join('\n')}

**重要**: 文書に記載がない内容については「文書には記載されていません」と明確に伝えてください。推測や一般的な知識は使わず、提供された文書の内容のみを根拠に回答してください。

回答:`

          if (provider === 'anthropic') {
            const response = await anthropic.messages.create({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 2000,
              messages: [
                {
                  role: 'user',
                  content: ragPrompt,
                },
              ],
            })
            text = response.content[0].type === 'text' ? response.content[0].text : ''
          } else {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
            const result = await model.generateContent(ragPrompt)
            const response = await result.response
            text = response.text()
          }

          console.log('全文書参照での回答生成完了')
          console.log('表示用参考文書:', sources.map(s => s.title))

        } else {
          // 文書が見つからない場合
          const noDocumentsPrompt = `申し訳ございませんが、現在参照できる会社文書がありません。

ユーザーの質問: "${message}"

会社の文書がナレッジベースにアップロードされていないため、この質問にお答えできません。ナレッジページから関連する文書をアップロードしてください。`

          text = noDocumentsPrompt
        }
      } catch (searchError) {
        console.error('RAG処理エラー:', searchError)
        // フォールバック：通常のチャットとして処理
        useRAG = false
      }
    }
    
    if (!useRAG) {
      // 通常のチャットモード
      if (provider === 'anthropic') {
        const response = await anthropic.messages.create({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: message,
            },
          ],
        })
        text = response.content[0].type === 'text' ? response.content[0].text : ''
      } else {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
        const result = await model.generateContent(message)
        const response = await result.response
        text = response.text()
      }
    }

    return NextResponse.json({
      response: text,
      sources: sources,
      relatedDocuments: relatedDocuments,
      searchStats: searchStats,
      success: true,
      usedRAG: useRAG
    })
  } catch (error) {
    console.error('AI API error:', error)
    return NextResponse.json(
      { error: 'AI応答の生成中にエラーが発生しました' },
      { status: 500 }
    )
  }
} 