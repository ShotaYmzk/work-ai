'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { X, Download, Share, Search, BookOpen, Send, Loader2, FileText, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Markdown } from '@/components/ui/markdown'

interface FileViewerProps {
  isOpen: boolean
  onClose: () => void
  filename: string
  originalName: string
}

export function FileViewer({ isOpen, onClose, filename, originalName }: FileViewerProps) {
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [ragQuery, setRagQuery] = useState('')
  const [ragResult, setRagResult] = useState<any>(null)
  const [isRagSearching, setIsRagSearching] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && filename) {
      fetchFileContent()
    }
  }, [isOpen, filename])

  const fetchFileContent = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/documents/content?filename=${encodeURIComponent(filename)}`)
      const result = await response.json()
      
      if (result.success) {
        setContent(result.content)
      } else {
        toast({
          title: "エラー",
          description: "ファイルの読み込みに失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "ファイルの読み込み中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRAGSearch = async () => {
    if (!ragQuery.trim()) return
    
    setIsRagSearching(true)
    try {
      // このファイルに特化したRAG検索
      const specificQuery = `${ragQuery} (特に「${originalName}」の内容について)`
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: specificQuery,
          provider: 'gemini',
          useRAG: true
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setRagResult({
          query: ragQuery,
          response: data.response,
          sources: data.sources || [],
          relatedDocuments: data.relatedDocuments || []
        })
      } else {
        throw new Error(data.error || 'RAG検索に失敗しました')
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "RAG検索中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsRagSearching(false)
    }
  }

  const suggestedQuestions = [
    `${originalName}の主な内容を要約してください`,
    `${originalName}から重要なポイントを抽出してください`,
    `${originalName}に記載されている手順や方法を教えてください`,
    `${originalName}で言及されている課題や問題点は何ですか？`
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {originalName}
            <Badge variant="secondary" className="ml-auto">
              {filename.split('.').pop()?.toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex gap-4 min-h-0">
          {/* ファイル内容表示 */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                ダウンロード
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                共有
              </Button>
            </div>
            
            <ScrollArea className="flex-1 border rounded-md p-4">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-sm font-mono">
                  {content}
                </div>
              )}
            </ScrollArea>
          </div>

          <Separator orientation="vertical" />

          {/* RAG検索パネル */}
          <div className="w-80 flex flex-col">
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  文書内容に質問
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {/* 質問入力 */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={ragQuery}
                      onChange={(e) => setRagQuery(e.target.value)}
                      placeholder="この文書について質問..."
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleRAGSearch()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleRAGSearch}
                      disabled={!ragQuery.trim() || isRagSearching}
                      size="sm"
                    >
                      {isRagSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* 提案質問 */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">質問例:</div>
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start h-auto p-2 text-xs"
                      onClick={() => setRagQuery(question)}
                    >
                      <Sparkles className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{question}</span>
                    </Button>
                  ))}
                </div>

                {/* RAG検索結果 */}
                {ragResult && (
                  <div className="border-t pt-4">
                    <ScrollArea className="max-h-64">
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium mb-2">質問: {ragResult.query}</div>
                          <Card className="bg-blue-50">
                            <CardContent className="p-3">
                              <Markdown content={ragResult.response} className="text-sm" />
                            </CardContent>
                          </Card>
                        </div>
                        
                        {ragResult.sources && ragResult.sources.length > 0 && (
                          <div>
                            <div className="text-sm font-medium mb-2">参照元:</div>
                            <div className="space-y-2">
                              {ragResult.sources.map((source: any, index: number) => (
                                <div key={index} className="p-2 border rounded bg-muted/50">
                                  <div className="text-xs font-medium">{source.title}</div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    関連度: {(source.score * 100).toFixed(1)}%
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 