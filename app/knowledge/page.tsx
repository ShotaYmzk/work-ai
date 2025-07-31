'use client'

import { useState, useEffect } from 'react'
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Plus, MoreHorizontal, FolderOpen, File, BarChart3, BookOpen, Zap, RefreshCw } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileUpload } from "@/components/file-upload"
import { FileViewer } from "@/components/file-viewer"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FileItem {
  name: string
  originalName: string
  size: number
  createdAt: Date
  updatedAt: Date
  type: string
}

interface RAGStats {
  totalDocuments: number
  totalKeywords: number
  isIndexed: boolean
  documentTypes: Record<string, number>
}

export default function KnowledgePage() {
  const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [ragStats, setRagStats] = useState<RAGStats | null>(null)
  const [isReindexing, setIsReindexing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const { toast } = useToast()

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/documents/list')
      const result = await response.json()
      
      if (result.success) {
        setUploadedFiles(result.files)
      }
    } catch (error) {
      console.error('ファイル一覧の取得に失敗:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRAGStats = async () => {
    try {
      const response = await fetch('/api/documents/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: 'test', // ダミークエリ
          getStatsOnly: true 
        }),
      })
      const result = await response.json()
      
      if (result.searchStats) {
        setRagStats(result.searchStats)
      }
    } catch (error) {
      console.error('RAG統計の取得に失敗:', error)
    }
  }

  useEffect(() => {
    fetchFiles()
    fetchRAGStats()
  }, [])

  const handleUploadSuccess = () => {
    fetchFiles()
    fetchRAGStats() // アップロード後にRAG統計を更新
    toast({
      title: "成功",
      description: "ファイルがアップロードされ、RAGシステムに統合されました",
    })
  }

  const handleReindex = async () => {
    setIsReindexing(true)
    try {
      // RAGシステムの再インデックス化
      const response = await fetch('/api/documents/index', {
        method: 'POST',
      })
      
      if (response.ok) {
        await fetchRAGStats()
        toast({
          title: "成功",
          description: "RAGシステムが再インデックス化されました",
        })
      } else {
        throw new Error('再インデックス化に失敗しました')
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "再インデックス化中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsReindexing(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const response = await fetch('/api/documents/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: searchQuery,
          provider: 'gemini'
        }),
      })
      
      const result = await response.json()
      if (result.success) {
        setSearchResults(result.results || [])
        if (result.results?.length === 0) {
          toast({
            title: "検索結果",
            description: "該当する文書が見つかりませんでした",
          })
        }
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "検索中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP')
  }

  const handleDeleteFile = async (filename: string) => {
    try {
      const response = await fetch('/api/documents/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "成功",
          description: "ファイルが削除され、RAGシステムから除外されました",
        })
        fetchFiles()
        fetchRAGStats() // 削除後にRAG統計を更新
      } else {
        toast({
          title: "エラー",
          description: result.error || "ファイルの削除に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "ファイルの削除中にエラーが発生しました",
        variant: "destructive",
      })
    }
  }

  const handleFileClick = (file: FileItem) => {
    setSelectedFile(file)
    setIsViewerOpen(true)
  }

  const handleViewerClose = () => {
    setIsViewerOpen(false)
    setSelectedFile(null)
  }

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>ナレッジ</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* RAG統計情報カード */}
        {ragStats && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                RAGシステム統計
                <Badge variant="secondary" className="ml-auto">
                  {ragStats.isIndexed ? 'インデックス済み' : '未インデックス'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{ragStats.totalDocuments}</div>
                  <div className="text-sm text-blue-800">文書数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{ragStats.totalKeywords}</div>
                  <div className="text-sm text-green-800">キーワード</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.keys(ragStats.documentTypes).length}
                  </div>
                  <div className="text-sm text-purple-800">ファイル形式</div>
                </div>
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleReindex}
                    disabled={isReindexing}
                    className="w-full"
                  >
                    {isReindexing ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Zap className="h-4 w-4 mr-1" />
                    )}
                    再構築
                  </Button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ragStats.documentTypes).map(([type, count]) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type}: {count}個
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ナレッジ検索 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              ナレッジ検索
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="文書を検索..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                {isSearching ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">検索結果 ({searchResults.length}件)</h4>
                <ScrollArea className="max-h-96">
                  <div className="space-y-2">
                    {searchResults.map((result, index) => (
                      <div key={index} className="border rounded p-3 bg-muted/50">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-medium">{result.title}</div>
                          <Badge variant="secondary" className="text-xs">
                            関連度: {(result.score * 100).toFixed(1)}%
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {result.type}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {result.snippet}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">ファイル管理</h1>
            <p className="text-muted-foreground">
              アップロードされたファイルは自動的にRAGシステムに統合されます
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FileUpload onUploadSuccess={handleUploadSuccess} />
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              コレクションを追加
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ファイル名</TableHead>
                <TableHead>サイズ</TableHead>
                <TableHead>作成日</TableHead>
                <TableHead>更新日</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    読み込み中...
                  </TableCell>
                </TableRow>
              ) : uploadedFiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    アップロードされたファイルがありません
                  </TableCell>
                </TableRow>
              ) : (
                uploadedFiles.map((file) => (
                  <TableRow key={file.name}>
                    <TableCell>
                      <div 
                        className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                        onClick={() => handleFileClick(file)}
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          <File className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{file.originalName}</div>
                          <div className="text-sm text-muted-foreground">{file.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(file.createdAt)}</TableCell>
                    <TableCell>{formatDate(file.updatedAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>ダウンロード</DropdownMenuItem>
                          <DropdownMenuItem>共有</DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteFile(file.name)}
                          >
                            削除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedFile && (
        <FileViewer
          isOpen={isViewerOpen}
          onClose={handleViewerClose}
          filename={selectedFile.name}
          originalName={selectedFile.originalName}
        />
      )}
    </SidebarInset>
  )
}
