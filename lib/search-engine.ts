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
}

export interface SearchResult {
  document: Document
  score: number
  snippet: string
}

export class SearchEngine {
  private tfidf: TfIdf
  private documents: Document[] = []
  private isIndexed = false

  constructor() {
    this.tfidf = new TfIdf()
  }

  async indexDocuments(documentsDir: string): Promise<void> {
    try {
      const files = await fs.readdir(documentsDir)
      this.documents = []
      
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
              type: this.getFileType(file)
            }
            
            this.documents.push(document)
            this.tfidf.addDocument(content)
          }
        }
      }
      
      this.isIndexed = true
      console.log(`Indexed ${this.documents.length} documents`)
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

  search(query: string, limit: number = 5): SearchResult[] {
    if (!this.isIndexed) {
      throw new Error('Documents not indexed yet')
    }

    // クエリをTF-IDFベクトルに変換
    const queryDoc = new TfIdf()
    queryDoc.addDocument(query)
    
    const results: SearchResult[] = []
    
    // 各ドキュメントとの類似度を計算
    this.documents.forEach((doc, index) => {
      const similarity = this.calculateCosineSimilarity(query, index)
      
      if (similarity > 0) {
        results.push({
          document: doc,
          score: similarity,
          snippet: this.extractSnippet(doc.content, query)
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

  private extractSnippet(content: string, query: string, maxLength: number = 200): string {
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

  getDocuments(): Document[] {
    return this.documents
  }

  isReady(): boolean {
    return this.isIndexed
  }
} 