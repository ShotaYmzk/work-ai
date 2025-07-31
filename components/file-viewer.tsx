'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { X, Download, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface FileViewerProps {
  isOpen: boolean
  onClose: () => void
  filename: string
  originalName: string
}

export function FileViewer({ isOpen, onClose, filename, originalName }: FileViewerProps) {
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const fetchFileContent = async () => {
    if (!filename || !isOpen) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/documents/content?filename=${encodeURIComponent(filename)}`)
      const result = await response.json()

      if (response.ok) {
        setContent(result.content)
      } else {
        toast({
          title: "エラー",
          description: result.error || "ファイル内容の取得に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "ファイル内容の取得中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // モーダルが開かれたときにファイル内容を取得
  useEffect(() => {
    if (isOpen) {
      fetchFileContent()
    }
  }, [isOpen, filename])

  const handleDownload = () => {
    if (!content) return
    
    const element = document.createElement('a')
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' })
    element.href = URL.createObjectURL(file)
    element.download = originalName
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    URL.revokeObjectURL(element.href)
  }

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  const isMarkdown = getFileExtension(filename) === 'md'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] w-[95vw] sm:w-[90vw] p-0 gap-0 overflow-hidden">
        <DialogHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 p-4 sm:p-6 pb-4 border-b">
          <div className="flex items-center gap-2 flex-1 min-w-0 w-full sm:w-auto">
            <FileText className="h-5 w-5 flex-shrink-0" />
            <DialogTitle className="text-base sm:text-lg font-semibold truncate">{originalName}</DialogTitle>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto sm:ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isLoading || !content}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              ダウンロード
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 p-4 sm:p-6 pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">読み込み中...</div>
            </div>
          ) : (
            <ScrollArea className="h-[calc(85vh-140px)] sm:h-[calc(85vh-120px)] w-full">
              <div className="pr-2 sm:pr-4">
                {isMarkdown ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm bg-muted/50 p-3 sm:p-4 rounded-md border overflow-x-auto">
                      {content}
                    </pre>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm bg-muted/50 p-3 sm:p-4 rounded-md border leading-relaxed overflow-x-auto">
                    {content}
                  </pre>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 