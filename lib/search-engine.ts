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
      
      console.log(`インデックス化開始: ${files.length}個のファイル`)
      
      for (const file of files) {
        const filePath = path.join(documentsDir, file)
        const stats = await fs.stat(filePath)
        
        if (stats.isFile()) {
          const content = await this.readFile(filePath)
          if (content) {
            console.log(`処理中: ${file} (${content.length}文字)`)
            
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
            
            // 重要な情報が含まれているかチェック
            if (content.toLowerCase().includes('田野') || content.toLowerCase().includes('代表取締役')) {
              console.log(`重要情報検出: ${file} に田野または代表取締役が含まれています`)
              console.log('該当部分のサンプル:', content.substring(
                Math.max(0, content.toLowerCase().indexOf('田野') - 50),
                content.toLowerCase().indexOf('田野') + 100
              ))
            }
            
            this.documents.push(document)
            this.tfidf.addDocument(content)
            
            // キーワードインデックスを構築
            if (document.keywords) {
              console.log(`${file}のキーワード:`, document.keywords.slice(0, 10))
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
      console.log(`インデックス化完了: ${this.documents.length}個の文書`)
      
      // 各文書の詳細をログ出力
      this.documents.forEach(doc => {
        console.log(`文書: ${doc.title} (${doc.content.length}文字, セクション: ${doc.sections?.length || 0}個)`)
      })
      
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
    // 文書を段落や見出しで分割（強化版）
    const sections: string[] = []
    
    // Markdownの見出しで分割
    if (content.includes('#')) {
      // # から ### までの見出しで分割
      const parts = content.split(/^(#{1,3})\s+(.+)$/gm)
      let currentSection = ''
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        if (part && part.match(/^#{1,3}$/)) {
          // 見出しレベル
          if (currentSection.trim()) {
            sections.push(currentSection.trim())
          }
          // 次の部分が見出しテキスト
          currentSection = parts[i + 1] ? `${parts[i + 1]}\n` : ''
          i++ // 見出しテキスト部分をスキップ
        } else if (part && part.trim().length > 0) {
          currentSection += part
        }
      }
      
      if (currentSection.trim()) {
        sections.push(currentSection.trim())
      }
    }
    
    // 段落で分割（空行区切り）
    const paragraphs = content.split(/\n\s*\n/)
    sections.push(...paragraphs.filter(p => p.trim().length > 30)) // 短すぎる段落は除外
    
    // 重複を削除
    const uniqueSections = [...new Set(sections)]
    
    console.log(`文書セクション数: ${uniqueSections.length}`)
    
    return uniqueSections
  }

  private extractKeywords(content: string): string[] {
    const keywords: string[] = []
    
    // 日本語キーワード抽出（強化版）
    const text = content.toLowerCase()
    
    // より柔軟な単語パターンを抽出
    const patterns = [
      /[ぁ-んァ-ン一-龯]{2,}/g, // 2文字以上のひらがな・カタカナ・漢字
      /[a-zA-Z]{2,}/g, // 2文字以上の英単語
      /[0-9]+[年月日]/g, // 数字+年月日
      /[0-9]+[億万千]/g, // 数字+単位
    ]
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern) || []
      keywords.push(...matches)
    })
    
    // 追加でスペースや句読点で分割
    const splitWords = text.split(/[\s\u3000、。，．,.\n\r\t]+/)
    keywords.push(...splitWords.filter(word => word.length >= 2))
    
    // 重複を削除し、頻度の高いものを優先
    const keywordCounts = keywords.reduce((acc, keyword) => {
      if (keyword.trim().length >= 2) {
        const trimmed = keyword.trim()
        acc[trimmed] = (acc[trimmed] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 30) // キーワード数を30個に増加
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
    
    console.log(`検索クエリ: "${query}"`)
    console.log('抽出されたキーワード:', queryKeywords)
    
    // 各ドキュメントとの類似度を計算
    this.documents.forEach((doc, index) => {
      let score = 0
      const matchedKeywords: string[] = []
      const relevantSections: string[] = []
      
      const docContentLower = doc.content.toLowerCase()
      const docTitleLower = doc.title.toLowerCase()
      
      console.log(`\n=== 文書: ${doc.title} ===`)
      
      // 1. 完全一致検索（最高優先度）
      if (docContentLower.includes(queryLower)) {
        score += 2.0
        console.log(`✓ 完全一致 (+2.0): "${queryLower}"`)
      }
      
      // 2. タイトルマッチング（高優先度）
      if (docTitleLower.includes(queryLower)) {
        score += 1.5
        console.log(`✓ タイトル一致 (+1.5): "${queryLower}"`)
      }
      
      // 3. 個別キーワードマッチング（強化版）
      const queryWords = queryLower.split(/[\s\u3000、。，．,.\n\r\t|]+/).filter(w => w.length > 0)
      console.log('分割されたクエリワード:', queryWords)
      
      for (const word of queryWords) {
        if (word.length > 1) {
          // 完全一致
          if (docContentLower.includes(word)) {
            score += 0.8
            matchedKeywords.push(word)
            console.log(`✓ 単語一致 (+0.8): "${word}"`)
            
            // 出現回数も考慮
            const occurrences = (docContentLower.match(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
            if (occurrences > 1) {
              score += Math.min(occurrences * 0.1, 0.5)
              console.log(`✓ 複数出現 (+${Math.min(occurrences * 0.1, 0.5)}): "${word}" x${occurrences}`)
            }
          }
          
          // タイトル内の単語一致
          if (docTitleLower.includes(word)) {
            score += 0.5
            console.log(`✓ タイトル内単語 (+0.5): "${word}"`)
          }
        }
      }
      
      // 4. 特別な検索パターン（人名・役職）
      const specialTerms = {
        '代表': ['代表取締役', '代表', 'ceo', '社長', '創業'],
        '取締役': ['代表取締役', '取締役', 'director'],
        'cto': ['cto', '技術責任者', '最高技術責任者'],
        'ceo': ['ceo', '代表取締役', '社長'],
        '田野': ['田野', 'tano', 'toru', '田野 徹', '田野徹'],
        'ujwal': ['ujwal', 'kumar', 'ujwal kumar'],
        '加藤': ['加藤', 'kato', '加藤 誠', '加藤誠'],
        '中村': ['中村', 'nakamura', '中村昭彦'],
        'アドバイザー': ['アドバイザー', 'advisor', '顧問'],
        '顧問': ['顧問', 'アドバイザー', 'advisor', '技術顧問'],
        '社長': ['社長', 'ceo', '代表取締役', '代表'],
        '創業': ['創業', 'founder', '20歳で創業', '立ち上げ']
      }
      
      for (const [key, variants] of Object.entries(specialTerms)) {
        if (queryLower.includes(key)) {
          console.log(`特別検索パターン検出: "${key}"`)
          for (const variant of variants) {
            if (docContentLower.includes(variant)) {
              score += 1.5  // スコアを上げる
              console.log(`✓ 特別用語一致 (+1.5): ${key} -> ${variant}`)
              matchedKeywords.push(variant)
              
              // 完全一致の場合はさらにボーナス
              if (variant === key) {
                score += 0.5
                console.log(`✓ 完全一致ボーナス (+0.5): ${variant}`)
              }
            }
          }
        }
      }
      
      // 追加の特別処理：「誰」という質問への対応
      if (queryLower.includes('誰') || queryLower.includes('だれ')) {
        console.log('人物検索クエリ検出')
        // 人名パターンを検索
        const namePatterns = ['田野', 'ujwal', '加藤', '中村']
        for (const name of namePatterns) {
          if (docContentLower.includes(name)) {
            score += 0.8
            console.log(`✓ 人名検出 (+0.8): ${name}`)
            matchedKeywords.push(name)
          }
        }
      }
      
      // 5. セクションマッチング
      if (doc.sections) {
        for (const section of doc.sections) {
          const sectionLower = section.toLowerCase()
          let sectionMatched = false
          
          if (sectionLower.includes(queryLower)) {
            score += 0.6
            relevantSections.push(section.substring(0, 400))
            sectionMatched = true
            console.log(`✓ セクション完全一致 (+0.6)`)
          } else {
            // セクション内での個別単語マッチング
            let sectionScore = 0
            for (const word of queryWords) {
              if (word.length > 1 && sectionLower.includes(word)) {
                sectionScore += 0.2
              }
            }
            if (sectionScore > 0.4) {
              score += sectionScore
              if (relevantSections.length < 3) {
                relevantSections.push(section.substring(0, 400))
              }
              sectionMatched = true
              console.log(`✓ セクション部分一致 (+${sectionScore})`)
            }
          }
        }
      }
      
      // 6. 基本的なTF-IDF類似度
      const basicSimilarity = this.calculateCosineSimilarity(query, index)
      score += basicSimilarity * 0.3
      console.log(`✓ TF-IDF類似度 (+${(basicSimilarity * 0.3).toFixed(3)})`)
      
      console.log(`文書 "${doc.title}" の最終スコア: ${score.toFixed(3)}`)
      
      // 閾値を大幅に下げる（0.01まで下げる）
      if (score > 0.01) {
        results.push({
          document: doc,
          score,
          snippet: this.extractSnippet(doc.content, query, 400),
          relevantSections: relevantSections.slice(0, 3),
          matchedKeywords: [...new Set(matchedKeywords)] // 重複削除
        })
        console.log(`✓ 結果に追加: "${doc.title}" (スコア: ${score.toFixed(3)})`)
      } else {
        console.log(`✗ 閾値未満で除外: "${doc.title}" (スコア: ${score.toFixed(3)})`)
      }
    })
    
    console.log(`\n検索結果数: ${results.length}`)
    
    // スコア順でソートして上位結果を返す
    const sortedResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
    
    console.log('最終結果:', sortedResults.map(r => ({ 
      title: r.document.title, 
      score: r.score.toFixed(3),
      keywords: r.matchedKeywords
    })))
    
    return sortedResults
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

  private extractSnippet(content: string, query: string, maxLength: number = 400): string {
    const queryTerms = query.toLowerCase().split(/[\s\u3000、。，．,.\n\r\t]+/).filter(term => term.length > 0)
    const contentLower = content.toLowerCase()
    
    // クエリの単語が最初に出現する位置を見つける
    let bestPosition = 0
    let bestScore = 0
    let bestContext = ''
    
    for (const term of queryTerms) {
      if (term.length > 1) {
        let position = contentLower.indexOf(term)
        while (position !== -1) {
          // 単語の周辺でスコアを計算
          let score = 1
          const contextStart = Math.max(0, position - maxLength / 2)
          const contextEnd = Math.min(contentLower.length, position + maxLength / 2)
          const contextText = contentLower.substring(contextStart, contextEnd)
          
          // 他のクエリ単語が近くにあるかチェック
          for (const otherTerm of queryTerms) {
            if (otherTerm !== term && otherTerm.length > 1) {
              if (contextText.includes(otherTerm)) {
                score += 2
              }
            }
          }
          
          if (score > bestScore) {
            bestScore = score
            bestPosition = position
            bestContext = content.substring(contextStart, contextEnd)
          }
          
          // 次の出現位置を探す
          position = contentLower.indexOf(term, position + 1)
        }
      }
    }
    
    // 最適なコンテキストが見つからない場合は、文書の最初の部分を使用
    if (bestScore === 0) {
      bestContext = content.substring(0, maxLength)
    }
    
    // スニペットを整形
    let snippet = bestContext
    
    // 改行を適切に処理
    snippet = snippet.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim()
    
    // 長すぎる場合は切り詰める
    if (snippet.length > maxLength) {
      snippet = snippet.substring(0, maxLength)
      
      // 文の境界で切る
      const lastPeriod = snippet.lastIndexOf('。')
      const lastSpace = snippet.lastIndexOf(' ')
      const cutPoint = Math.max(lastPeriod, lastSpace)
      
      if (cutPoint > maxLength * 0.7) {
        snippet = snippet.substring(0, cutPoint)
      }
      
      snippet += '...'
    }
    
    // 先頭や末尾の調整
    if (bestPosition > 0) {
      snippet = '...' + snippet
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