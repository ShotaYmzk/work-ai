import { SearchEngine } from './search-engine'
import path from 'path'

// グローバルな検索エンジンインスタンス管理
let globalSearchEngine: SearchEngine | null = null
let lastIndexTime = 0

export async function getGlobalSearchEngine(): Promise<SearchEngine> {
  const documentsDir = path.join(process.cwd(), 'public', 'documents')
  
  // 強制的に再インデックス化するか、初回の場合
  if (!globalSearchEngine) {
    console.log('新しい検索エンジンインスタンスを作成中...')
    globalSearchEngine = new SearchEngine()
    await globalSearchEngine.indexDocuments(documentsDir)
    lastIndexTime = Date.now()
    console.log('検索エンジンの初期化完了')
  }
  
  return globalSearchEngine
}

export async function forceReindexSearchEngine(): Promise<SearchEngine> {
  console.log('検索エンジンの強制再インデックス化を実行中...')
  const documentsDir = path.join(process.cwd(), 'public', 'documents')
  
  // 新しいインスタンスを作成
  globalSearchEngine = new SearchEngine()
  await globalSearchEngine.indexDocuments(documentsDir)
  lastIndexTime = Date.now()
  
  const stats = globalSearchEngine.getStats()
  console.log('強制再インデックス化完了:', stats)
  
  return globalSearchEngine
}

export function getLastIndexTime(): number {
  return lastIndexTime
} 