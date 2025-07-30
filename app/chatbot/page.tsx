"use client"

import { useState } from "react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Send, HelpCircle, Loader2, Sparkles, Search } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Markdown } from "@/components/ui/markdown"
import { SearchResults } from "@/components/search-results"
import { useDocumentSearch } from "@/hooks/use-document-search"

interface Message {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
}

const suggestedQuestions = [
  "開発状況についてまとめているドキュメントはどこですか？",
  "必要な採用要件について教えてください。",
  "プロジェクトの概要を説明してください。",
  "技術的な質問があります。",
]

const documentSearchQuestions = [
  "製品仕様書を検索",
  "開発ガイドの内容",
  "リモートワーク規定",
  "会議の議事録",
]

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "👋 こんにちは！AIへの質問やドキュメント検索をお気軽にご利用ください。",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchMode, setSearchMode] = useState<'ai' | 'documents'>('ai')
  const { toast } = useToast()
  const { 
    searchResults, 
    isSearching: isDocumentSearching, 
    error: documentSearchError,
    searchDocuments, 
    clearResults 
  } = useDocumentSearch()

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || isDocumentSearching) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const messageContent = inputValue
    setInputValue("")
    clearResults() // 前回の検索結果をクリア

    if (searchMode === 'documents') {
      // ドキュメント検索モード
      try {
        await searchDocuments(messageContent)
        
        // 検索結果をチャットメッセージとして追加
        const searchMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `📋 ドキュメント検索結果: "${messageContent}"`,
          sender: "bot",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, searchMessage])
      } catch (error) {
        console.error('Document search error:', error)
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: "ドキュメント検索中にエラーが発生しました。",
          sender: "bot",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorResponse])
      }
    } else {
      // AI チャットモード
      setIsLoading(true)
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: messageContent }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'API呼び出しに失敗しました')
        }

        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          sender: "bot",
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, botResponse])
      } catch (error) {
        console.error('Chat error:', error)
        toast({
          title: "エラーが発生しました",
          description: error instanceof Error ? error.message : "不明なエラーが発生しました",
          variant: "destructive",
        })
        
        // エラー時のフォールバック応答
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: "申し訳ございません。現在サービスに接続できません。しばらくしてからもう一度お試しください。",
          sender: "bot",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorResponse])
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question)
  }

  const currentSuggestions = searchMode === 'documents' ? documentSearchQuestions : suggestedQuestions

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Chatbot</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="ml-auto px-4">
          <div className="flex items-center gap-2">
            <Button
              variant={searchMode === 'ai' ? 'default' : 'ghost'}
              onClick={() => setSearchMode('ai')}
              size="sm"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              AI
            </Button>
            <Button
              variant={searchMode === 'documents' ? 'default' : 'ghost'}
              onClick={() => setSearchMode('documents')}
              size="sm"
            >
              <Search className="h-4 w-4 mr-1" />
              検索
            </Button>
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.sender === "bot" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>🤖</AvatarFallback>
                  </Avatar>
                )}
                <Card
                  className={`max-w-[70%] ${
                    message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <CardContent className="p-3">
                    {message.sender === "bot" ? (
                      <Markdown content={message.content} className="text-sm" />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                    <p className="text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString('ja-JP', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </CardContent>
                </Card>
                {message.sender === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>👤</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {(isLoading || isDocumentSearching) && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>🤖</AvatarFallback>
                </Avatar>
                <Card className="bg-muted">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <p className="text-sm">
                        {isDocumentSearching ? '検索中...' : '考え中...'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Document Search Results */}
            {searchResults && (
              <div className="mt-4">
                <SearchResults
                  query={searchResults.query}
                  results={searchResults.results}
                  summary={searchResults.summary}
                  className="max-w-none"
                />
              </div>
            )}

            {/* Suggested Questions */}
            {messages.length === 1 && !isLoading && !isDocumentSearching && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center mb-3">
                  {searchMode === 'documents' 
                    ? 'ドキュメント検索の例をクリックするか、自由に検索してください：'
                    : '以下の質問例をクリックするか、自由に質問してください：'
                  }
                </p>
                {currentSuggestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full text-left justify-start h-auto p-3 whitespace-normal bg-transparent hover:bg-muted"
                    onClick={() => handleSuggestedQuestion(question)}
                  >
                    <div className="flex items-center gap-2">
                      {searchMode === 'documents' ? (
                        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span>{question}</span>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={searchMode === 'documents' ? "ドキュメントを検索..." : "何でも質問してください！"}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                className="flex-1"
                disabled={isLoading || isDocumentSearching}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!inputValue.trim() || isLoading || isDocumentSearching}
              >
                {(isLoading || isDocumentSearching) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  searchMode === 'documents' ? (
                    <Search className="h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Enterで送信、Shift+Enterで改行
            </p>
          </div>
        </div>
      </div>
    </SidebarInset>
  )
}
