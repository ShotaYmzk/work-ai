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
import { Search, Plus, MoreHorizontal, FolderOpen, File } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileUpload } from "@/components/file-upload"
import { FileViewer } from "@/components/file-viewer"
import { useToast } from "@/hooks/use-toast"

const knowledgeItems = [
  {
    id: "1",
    name: "マニュアル",
    description: "マニュアル",
    items: 17,
    author: "田野 徹",
    lastUpdated: "2日前",
    type: "folder",
  },
  {
    id: "2",
    name: "サポート",
    description: "サポート",
    items: 23,
    author: "田野 徹",
    lastUpdated: "2日前",
    type: "folder",
  },
  {
    id: "3",
    name: "提案資料",
    description: "提案について",
    items: 39,
    author: "田野 徹",
    lastUpdated: "3日前",
    type: "folder",
  },
  {
    id: "4",
    name: "エンジニアリング",
    description: "開発について",
    items: 7,
    author: "田野 徹",
    lastUpdated: "3日前",
    type: "folder",
  },
  {
    id: "5",
    name: "採用",
    description: "採用について",
    items: 0,
    author: "田野 徹",
    lastUpdated: "3日前",
    type: "folder",
  },
  {
    id: "6",
    name: "テスト",
    description: "テスト",
    items: 2,
    author: "田野 徹",
    lastUpdated: "3日前",
    type: "folder",
  },
]

interface FileItem {
  name: string
  originalName: string
  size: number
  createdAt: Date
  updatedAt: Date
  type: string
}

export default function KnowledgePage() {
  const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
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

  useEffect(() => {
    fetchFiles()
  }, [])

  const handleUploadSuccess = () => {
    fetchFiles() // アップロード後にファイル一覧を再取得
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
          description: "ファイルが正常に削除されました",
        })
        fetchFiles() // ファイル一覧を再取得
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">コレクション</h1>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="collections">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="collections">コレクションについて</SelectItem>
                <SelectItem value="documents">ドキュメント</SelectItem>
                <SelectItem value="templates">テンプレート</SelectItem>
              </SelectContent>
            </Select>
            <FileUpload onUploadSuccess={handleUploadSuccess} />
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              コレクションを追加
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Select defaultValue="author">
            <SelectTrigger className="w-32">
              <SelectValue placeholder="作成者" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="author">作成者</SelectItem>
              <SelectItem value="all">すべて</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="department">
            <SelectTrigger className="w-32">
              <SelectValue placeholder="部門" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="department">部門</SelectItem>
              <SelectItem value="all">すべて</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="作者を検索" className="pl-10" />
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
