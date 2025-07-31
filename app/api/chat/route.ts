import { GoogleGenerativeAI } from '@google/generative-ai'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { SearchEngine } from '@/lib/search-engine'
import path from 'path'

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

let searchEngine: SearchEngine | null = null

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
      // RAGモード：関連文書を検索して回答生成
      try {
        const engine = await initializeSearchEngine()
        const searchResults = engine.search(message, 5) // より多くの結果を検索
        searchStats = engine.getStats()
        
        if (searchResults.length > 0) {
          // 検索結果を整理
          const contextDocs = searchResults.map((result, index) => ({
            title: result.document.title,
            content: result.snippet,
            fullSections: result.relevantSections || [],
            keywords: result.matchedKeywords || [],
            score: result.score,
            documentId: result.document.id,
            type: result.document.type
          }))
          
          sources = contextDocs

          // 関連文書を提案（最も関連性の高い文書から）
          if (searchResults.length > 0) {
            const topDoc = searchResults[0].document
            const similarDocs = engine.getSimilarDocuments(topDoc.id, 3)
            relatedDocuments = similarDocs.map(doc => ({
              title: doc.title,
              id: doc.id,
              summary: doc.summary,
              type: doc.type
            }))
          }

          // 強化されたRAG用のプロンプトを構築
          const ragPrompt = `あなたは会社の専門的なAIアシスタントです。以下の会社文書の詳細な情報を参考にして、ユーザーの質問に対して**完璧で実用的な回答**を提供してください。

=== 参考文書（関連度順） ===
${contextDocs.map((doc, index) => {
  let docInfo = `【文書${index + 1}: ${doc.title}】（関連度: ${(doc.score * 100).toFixed(1)}%）\n`
  docInfo += `タイプ: ${doc.type}\n`
  if (doc.keywords.length > 0) {
    docInfo += `マッチしたキーワード: ${doc.keywords.join(', ')}\n`
  }
  docInfo += `内容:\n${doc.content}\n`
  
  if (doc.fullSections.length > 0) {
    docInfo += `関連セクション:\n${doc.fullSections.map(section => `- ${section}`).join('\n')}\n`
  }
  
  return docInfo
}).join('\n---\n')}
=== 参考文書ここまで ===

ユーザーの質問: "${message}"

回答要件：
1. **完璧性**: 参考文書の情報を最大限活用し、包括的で正確な回答を提供
2. **具体性**: 抽象的でなく具体的な情報、数値、手順を含める
3. **引用の明確化**: どの文書のどの部分から情報を引用したかを明記
4. **実用性**: 実際に行動に移せる具体的なアドバイスや手順を含める
5. **関連情報**: 質問に関連する追加情報や注意点も提供
6. **構造化**: 見出しや箇条書きを使って読みやすく整理

NotebookLMスタイルの**詳細で価値の高い回答**を生成してください。文書に記載がない内容については明確に「文書には記載されていません」と伝えてください。

回答:`

          if (provider === 'anthropic') {
            const response = await anthropic.messages.create({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 1500, // より長い回答を可能にする
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

          // 関連文書の提案を回答に追加
          if (relatedDocuments.length > 0) {
            text += `\n\n---\n\n## 📚 関連して役立つ文書\n\n`
            relatedDocuments.forEach((doc, index) => {
              text += `${index + 1}. **${doc.title}** (${doc.type})\n   ${doc.summary}\n\n`
            })
            text += `これらの文書も参考になる可能性があります。詳細はナレッジページでご確認ください。`
          }

        } else {
          // 関連文書が見つからない場合
          const noContextPrompt = `ユーザーの質問: "${message}"

申し訳ございませんが、この質問に関連する会社文書が見つかりませんでした（検索対象: ${searchStats?.totalDocuments || 0}個の文書）。

しかし、一般的な知識として以下のような回答をさせていただきます。より具体的な情報については、関連する文書をナレッジページにアップロードしていただくか、質問を具体化していただけると助かります。

回答（一般的な情報として）:`

          if (provider === 'anthropic') {
            const response = await anthropic.messages.create({
              model: 'claude-3-5-haiku-20241022',
              max_tokens: 1000,
              messages: [
                {
                  role: 'user',
                  content: noContextPrompt,
                },
              ],
            })
            text = response.content[0].type === 'text' ? response.content[0].text : ''
          } else {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
            const result = await model.generateContent(noContextPrompt)
            const response = await result.response
            text = response.text()
          }
        }
      } catch (searchError) {
        console.error('RAG search error:', searchError)
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