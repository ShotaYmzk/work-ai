"use client"

import { useState, useCallback } from 'react'
import { SearchResultItem } from '@/components/search-results'

export interface DocumentSearchResult {
  query: string
  results: SearchResultItem[]
  summary: string
  success: boolean
}

export interface UseDocumentSearchReturn {
  searchResults: DocumentSearchResult | null
  isSearching: boolean
  error: string | null
  searchDocuments: (query: string, provider?: 'gemini' | 'anthropic') => Promise<void>
  clearResults: () => void
  initializeIndex: () => Promise<boolean>
}

export function useDocumentSearch(): UseDocumentSearchReturn {
  const [searchResults, setSearchResults] = useState<DocumentSearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initializeIndex = useCallback(async (): Promise<boolean> => {
    try {
      setError(null)
      const response = await fetch('/api/documents/index', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'インデックス化に失敗しました')
      }

      return data.success
    } catch (err) {
      console.error('Index initialization error:', err)
      setError(err instanceof Error ? err.message : 'インデックス化でエラーが発生しました')
      return false
    }
  }, [])

  const searchDocuments = useCallback(async (query: string, provider: 'gemini' | 'anthropic' = 'gemini') => {
    if (!query.trim()) {
      setError('検索クエリを入力してください')
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const response = await fetch('/api/documents/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, provider }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '検索に失敗しました')
      }

      setSearchResults({
        query: data.query,
        results: data.results || [],
        summary: data.summary || '',
        success: data.success
      })
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : '検索でエラーが発生しました')
      setSearchResults(null)
    } finally {
      setIsSearching(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setSearchResults(null)
    setError(null)
  }, [])

  return {
    searchResults,
    isSearching,
    error,
    searchDocuments,
    clearResults,
    initializeIndex
  }
} 