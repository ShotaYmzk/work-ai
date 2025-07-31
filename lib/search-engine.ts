import { TfIdf } from 'natural'
import { Matrix } from 'ml-matrix'
import fs from 'fs/promises'
import path from 'path'

export interface Document {
  id: string
  title: string
  content: string
  filePath: string
  type: 'txt' | 'md' | 'pdf'
  sections?: string[] // 文書を段落に分割
  keywords?: string[] // 抽出されたキーワード
  summary?: string // 文書の要約
}

export interface SearchResult {
  document: Document
  score: number
  snippet: string
  relevantSections?: string[] // 関連する段落
  matchedKeywords?: string[] // マッチしたキーワード
}

export class SearchEngine {
  private tfidf: TfIdf
  private documents: Document[] = []
  private isIndexed = false
  private keywordIndex: Map<string, Set<string>> = new Map() // キーワードから文書IDへのマップ

  constructor() {
    this.tfidf = new TfIdf()
  }

  async indexDocuments(documentsDir: string): Promise<void> {
    try {
      const files = await fs.readdir(documentsDir)
      this.documents = []
      this.tfidf = new TfIdf() // リセット
      this.keywordIndex.clear()
      
      for (const file of files) {
        const filePath = path.join(documentsDir, file)
        const stats = await fs.stat(filePath)
        
        if (stats.isFile()) {
          const content = await this.readFile(filePath)
          if (content) {
            const document: Document = {
              id: file,
              title: this.extractTitle(file, content),
              content,
              filePath,
              type: this.getFileType(file),
              sections: this.extractSections(content),
              keywords: this.extractKeywords(content),
              summary: this.generateSummary(content)
            }
            
            this.documents.push(document)
            this.tfidf.addDocument(content)
            
            // キーワードインデックスを構築
            if (document.keywords) {
              for (const keyword of document.keywords) {
                if (!this.keywordIndex.has(keyword)) {
                  this.keywordIndex.set(keyword, new Set())
                }
                this.keywordIndex.get(keyword)!.add(document.id)
              }
            }
          }
        }
      }
      
      this.isIndexed = true
      console.log(`Indexed ${this.documents.length} documents with enhanced features`)
    } catch (error) {
      console.error('Error indexing documents:', error)
      throw error
    }
  }

  private async readFile(filePath: string): Promise<string | null> {
    try {
      const ext = path.extname(filePath).toLowerCase()
      
      switch (ext) {
        case '.txt':
        case '.md':
          return await fs.readFile(filePath, 'utf-8')
        case '.pdf':
          // PDF読み込みは今回はスキップ（デモなので）
          return null
        default:
          return null
      }
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error)
      return null
    }
  }

  private extractTitle(filename: string, content: string): string {
    // Markdownの場合、最初の# から抽出
    const markdownTitle = content.match(/^#\s+(.+)$/m)
    if (markdownTitle) {
      return markdownTitle[1].trim()
    }
    
    // テキストファイルの場合、最初の行をタイトルとして扱う
    const firstLine = content.split('\n')[0].trim()
    if (firstLine && firstLine.length < 100) {
      return firstLine
    }
    
    // ファイル名から拡張子を除いて返す
    return path.basename(filename, path.extname(filename))
  }

  private getFileType(filename: string): 'txt' | 'md' | 'pdf' {
    const ext = path.extname(filename).toLowerCase()
    switch (ext) {
      case '.md':
        return 'md'
      case '.pdf':
        return 'pdf'
      default:
        return 'txt'
    }
  }

  private extractSections(content: string): string[] {
    // 文書を段落や見出しで分割
    const sections: string[] = []
    
    // Markdownの見出しで分割
    if (content.includes('#')) {
      const parts = content.split(/^#+\s+/m)
      sections.push(...parts.filter(part => part.trim().length > 0))
    } else {
      // 段落で分割（空行区切り）
      const paragraphs = content.split(/\n\s*\n/)
      sections.push(...paragraphs.filter(p => p.trim().length > 50)) // 短すぎる段落は除外
    }
    
    return sections
  }

  private extractKeywords(content: string): string[] {
    const keywords: string[] = []
    
    // 日本語キーワード抽出（簡易版）
    const text = content.toLowerCase()
    
    // よく使われる重要な単語パターンを抽出
    const patterns = [
      /[ぁ-んァ-ン一-龯]{3,}/g, // 3文字以上のひらがな・カタカナ・漢字
      /[a-zA-Z]{4,}/g, // 4文字以上の英単語
    ]
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern) || []
      keywords.push(...matches)
    })
    
    // 重複を削除し、頻度の高いものを優先
    const keywordCounts = keywords.reduce((acc, keyword) => {
      acc[keyword] = (acc[keyword] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20) // 上位20個のキーワード
      .map(([keyword]) => keyword)
  }

  private generateSummary(content: string): string {
    // 文書の最初の200文字を要約として使用（簡易版）
    const cleaned = content.replace(/#+\s+/g, '').trim()
    return cleaned.length > 200 ? cleaned.substring(0, 200) + '...' : cleaned
  }

  search(query: string, limit: number = 5): SearchResult[] {
    if (!this.isIndexed) {
      throw new Error('Documents not indexed yet')
    }

    const results: SearchResult[] = []
    const queryLower = query.toLowerCase()
    const queryKeywords = this.extractKeywords(query)
    
    // 各ドキュメントとの類似度を計算
    this.documents.forEach((doc, index) => {
      let score = 0
      const matchedKeywords: string[] = []
      const relevantSections: string[] = []
      
      // 1. 基本的な文字列マッチング
      const basicSimilarity = this.calculateCosineSimilarity(query, index)
      score += basicSimilarity * 0.4
      
      // 2. キーワードマッチング
      if (doc.keywords) {
        for (const keyword of queryKeywords) {
          if (doc.keywords.includes(keyword)) {
            score += 0.3
            matchedKeywords.push(keyword)
          }
        }
      }
      
      // 3. タイトルマッチング
      if (doc.title.toLowerCase().includes(queryLower)) {
        score += 0.5
      }
      
      // 4. セクションマッチング
      if (doc.sections) {
        for (const section of doc.sections) {
          if (section.toLowerCase().includes(queryLower)) {
            score += 0.2
            relevantSections.push(section.substring(0, 200))
          }
        }
      }
      
      // 5. 完全一致ボーナス
      if (doc.content.toLowerCase().includes(queryLower)) {
        score += 0.3
      }
      
      if (score > 0.1) { // 閾値を下げてより多くの結果を含める
        results.push({
          document: doc,
          score,
          snippet: this.extractSnippet(doc.content, query, 300),
          relevantSections: relevantSections.slice(0, 3),
          matchedKeywords
        })
      }
    })
    
    // スコア順でソートして上位結果を返す
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  private calculateCosineSimilarity(query: string, docIndex: number): number {
    // 日本語対応の類似度計算
    const queryTerms = this.tokenizeJapanese(query.toLowerCase())
    const docContent = this.documents[docIndex].content.toLowerCase()
    
    if (queryTerms.length === 0) return 0
    
    let commonTerms = 0
    let totalScore = 0
    
    for (const term of queryTerms) {
      if (term.length > 1) {
        // 完全一致の重みを高くする
        if (docContent.includes(term)) {
          commonTerms++
          totalScore += 2
        }
        
        // 部分一致も考慮
        const partialMatches = docContent.split(term).length - 1
        if (partialMatches > 0) {
          totalScore += partialMatches * 0.5
        }
      }
    }
    
    // 類似度スコアを正規化
    const similarity = commonTerms > 0 ? totalScore / queryTerms.length : 0
    return Math.min(similarity, 1.0) // 最大1.0に制限
  }

  private tokenizeJapanese(text: string): string[] {
    // 日本語のトークン化（簡易版）
    const tokens: string[] = []
    
    // ひらがな、カタカナ、漢字、英数字を分離
    const segments = text.split(/([あ-んア-ン一-龯a-zA-Z0-9]+)/)
    
    for (const segment of segments) {
      if (segment.trim()) {
        // 2文字以上のセグメントをトークンとして追加
        if (segment.length >= 2) {
          tokens.push(segment)
        }
        
        // 長いセグメントは部分文字列も追加
        if (segment.length > 4) {
          for (let i = 0; i <= segment.length - 2; i++) {
            const subToken = segment.substring(i, i + 2)
            if (!tokens.includes(subToken)) {
              tokens.push(subToken)
            }
          }
        }
      }
    }
    
    return tokens
  }

  private extractSnippet(content: string, query: string, maxLength: number = 300): string {
    const queryTerms = query.toLowerCase().split(/\s+/)
    const contentLower = content.toLowerCase()
    
    // クエリの単語が最初に出現する位置を見つける
    let bestPosition = 0
    let bestScore = 0
    
    for (const term of queryTerms) {
      if (term.length > 1) {
        const position = contentLower.indexOf(term)
        if (position !== -1) {
          // 単語の周辺でスコアを計算
          let score = 1
          for (const otherTerm of queryTerms) {
            if (otherTerm !== term && otherTerm.length > 1) {
              const nearbyText = contentLower.substring(
                Math.max(0, position - 100),
                Math.min(contentLower.length, position + 100)
              )
              if (nearbyText.includes(otherTerm)) {
                score++
              }
            }
          }
          
          if (score > bestScore) {
            bestScore = score
            bestPosition = position
          }
        }
      }
    }
    
    // スニペットを抽出
    const start = Math.max(0, bestPosition - maxLength / 2)
    const end = Math.min(content.length, start + maxLength)
    let snippet = content.substring(start, end)
    
    // 文の境界で切る
    if (start > 0) {
      const sentenceStart = snippet.indexOf('。')
      if (sentenceStart !== -1 && sentenceStart < 50) {
        snippet = snippet.substring(sentenceStart + 1)
      }
      snippet = '...' + snippet
    }
    
    if (end < content.length) {
      const sentenceEnd = snippet.lastIndexOf('。')
      if (sentenceEnd !== -1 && sentenceEnd > snippet.length - 50) {
        snippet = snippet.substring(0, sentenceEnd + 1)
      }
      snippet = snippet + '...'
    }
    
    return snippet.trim()
  }

  // 新しいメソッド：特定の文書から詳細情報を取得
  getDocumentDetails(documentId: string): Document | null {
    return this.documents.find(doc => doc.id === documentId) || null
  }

  // 新しいメソッド：関連文書を提案
  getSimilarDocuments(documentId: string, limit: number = 3): Document[] {
    const targetDoc = this.getDocumentDetails(documentId)
    if (!targetDoc) return []

    const similarities: { doc: Document, score: number }[] = []
    
    this.documents.forEach(doc => {
      if (doc.id !== documentId) {
        let score = 0
        
        // キーワードの重複度を計算
        if (targetDoc.keywords && doc.keywords) {
          const commonKeywords = targetDoc.keywords.filter(k => doc.keywords!.includes(k))
          score += commonKeywords.length * 0.1
        }
        
        // タイトルの類似度
        if (targetDoc.title && doc.title) {
          const titleSimilarity = this.calculateTextSimilarity(targetDoc.title, doc.title)
          score += titleSimilarity * 0.3
        }
        
        if (score > 0) {
          similarities.push({ doc, score })
        }
      }
    })
    
    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.doc)
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const tokens1 = new Set(this.tokenizeJapanese(text1.toLowerCase()))
    const tokens2 = new Set(this.tokenizeJapanese(text2.toLowerCase()))
    
    const intersection = new Set([...tokens1].filter(token => tokens2.has(token)))
    const union = new Set([...tokens1, ...tokens2])
    
    return union.size > 0 ? intersection.size / union.size : 0
  }

  getDocuments(): Document[] {
    return this.documents
  }

  isReady(): boolean {
    return this.isIndexed
  }

  // 統計情報を取得
  getStats() {
    return {
      totalDocuments: this.documents.length,
      totalKeywords: this.keywordIndex.size,
      isIndexed: this.isIndexed,
      documentTypes: this.documents.reduce((acc, doc) => {
        acc[doc.type] = (acc[doc.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }
} 