"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FileText, File, BookOpen, Sparkles, Search, X } from "lucide-react"
import { Markdown } from "@/components/ui/markdown"

export interface SearchResultItem {
  id: string
  title: string
  snippet: string
  score: number
  type: 'txt' | 'md' | 'pdf'
}

export interface SearchResultsProps {
  query: string
  results: SearchResultItem[]
  summary: string
  onClose?: () => void
  className?: string
}

const getFileIcon = (type: string) => {
  switch (type) {
    case 'md':
      return <BookOpen className="h-4 w-4" />
    case 'pdf':
      return <File className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

const getFileTypeLabel = (type: string) => {
  switch (type) {
    case 'md':
      return 'Markdown'
    case 'pdf':
      return 'PDF'
    case 'txt':
      return 'テキスト'
    default:
      return 'ファイル'
  }
}

const formatScore = (score: number) => {
  // スコアを0-1の範囲に正規化してから100倍し、最大100%に制限
  const normalizedScore = Math.min(score, 1.0)
  return Math.round(normalizedScore * 100)
}

export function SearchResults({ 
  query, 
  results, 
  summary, 
  onClose, 
  className = "" 
}: SearchResultsProps) {
  if (results.length === 0 && !summary) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* AI要約 */}
      {summary && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI要約
              </CardTitle>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <CardDescription>
              「{query}」の検索結果を基にした要約
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Markdown content={summary} />
          </CardContent>
        </Card>
      )}

      {/* 検索結果一覧 */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              関連ドキュメント ({results.length}件)
            </CardTitle>
            <CardDescription>
              「{query}」に関連するドキュメントが見つかりました
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result, index) => (
              <div key={result.id}>
                {index > 0 && <Separator className="mb-4" />}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {getFileIcon(result.type)}
                      <h4 className="font-medium text-sm truncate">
                        {result.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="secondary" className="text-xs">
                        {getFileTypeLabel(result.type)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {formatScore(result.score)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {result.snippet}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 検索結果なしの場合 */}
      {results.length === 0 && summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              検索結果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              「{query}」に一致するドキュメントは見つかりませんでした。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 