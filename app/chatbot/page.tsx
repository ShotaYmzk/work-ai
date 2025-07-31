"use client"

import { useState } from "react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, HelpCircle, Loader2, Sparkles, Search, Bot, Zap, BookOpen, FileText } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Markdown } from "@/components/ui/markdown"


import { Badge } from "@/components/ui/badge"

interface Message {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
  sources?: Array<{
    title: string
    content: string
    score: number
    keywords?: string[]
    type?: string
  }>
  relatedDocuments?: Array<{
    title: string
    id: string
    summary: string
    type: string
  }>
  searchStats?: {
    totalDocuments: number
    totalKeywords: number
    documentTypes: Record<string, number>
  }
  usedRAG?: boolean
}

const suggestedQuestions = [
  "開発状況についてまとめているドキュメントはどこですか？",
  "必要な採用要件について教えてください。",
  "プロジェクトの概要を説明してください。",
  "技術的な質問があります。",
]

const ragQuestions = [
  "株式会社Selectの代表取締役は誰ですか？",
  "CTOは誰ですか？詳しく教えてください",
  "会社の技術顧問について教えてください",
  "アドバイザーは誰ですか？",
  "会社の主要メンバーを全員教えてください",
  "会社の事業内容と製品について詳しく説明してください",
  "会社の所在地と規模を教えてください",
  "競合他社との違いや優位性は何ですか？",
]

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: `👋 **AIアシスタントへようこそ！**

🔍 **RAGモード**: 全文書を参照した正確な回答（推奨）
⚡ **AIモード**: 汎用的なAI対話  
📋 **検索モード**: 文書検索のみ

RAGモードでは全ての会社文書を参照して、完璧な回答をお届けします！`,
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchMode, setSearchMode] = useState<'ai' | 'rag'>('rag')
  const [provider, setProvider] = useState<'gemini' | 'anthropic'>('gemini')
  const { toast } = useToast()

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const messageContent = inputValue
    setInputValue("")

    {
      // AI チャットモード（RAGまたは通常）
      setIsLoading(true)
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            message: messageContent,
            provider: provider,
            useRAG: searchMode === 'rag'
          }),
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
          sources: data.sources || [],
          relatedDocuments: data.relatedDocuments || [],
          searchStats: data.searchStats,
          usedRAG: data.usedRAG
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

  const getCurrentSuggestions = () => {
    switch (searchMode) {
      case 'rag': return ragQuestions
      default: return suggestedQuestions
    }
  }

  const getModeIcon = () => {
    switch (searchMode) {
      case 'rag': return <BookOpen className="h-4 w-4 mr-1" />
      case 'documents': return <Search className="h-4 w-4 mr-1" />
      default: return <Sparkles className="h-4 w-4 mr-1" />
    }
  }

  const getModeLabel = () => {
    switch (searchMode) {
      case 'rag': return 'RAG'
      case 'documents': return '検索'
      default: return 'AI'
    }
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
                <BreadcrumbPage>Chatbot</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="ml-auto px-4">
          <div className="flex items-center gap-2">
            <Button
              variant={searchMode === 'rag' ? 'default' : 'ghost'}
              onClick={() => setSearchMode('rag')}
              size="sm"
            >
              <BookOpen className="h-4 w-4 mr-1" />
              RAG
            </Button>
            <Button
              variant={searchMode === 'ai' ? 'default' : 'ghost'}
              onClick={() => setSearchMode('ai')}
              size="sm"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              AI
            </Button>
            {(searchMode === 'ai' || searchMode === 'rag') && (
              <>
                <Button
                  variant={provider === 'gemini' ? 'default' : 'ghost'}
                  onClick={() => setProvider('gemini')}
                  size="sm"
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Gemini
                </Button>
                <Button
                  variant={provider === 'anthropic' ? 'default' : 'ghost'}
                  onClick={() => setProvider('anthropic')}
                  size="sm"
                >
                  <Bot className="h-4 w-4 mr-1" />
                  Claude
                </Button>
              </>
            )}
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
              <div key={message.id}>
                <div
                  className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.sender === "bot" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {searchMode === 'rag' ? '📚' : (searchMode === 'ai' ? (provider === 'anthropic' ? '🤖' : '⚡') : '🔍')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <Card
                    className={`max-w-[70%] ${
                      message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <CardContent className="p-3">
                      {message.sender === "bot" ? (
                        <>
                          {message.usedRAG && (
                            <div className="mb-2">
                              <Badge variant="secondary" className="text-xs">
                                <BookOpen className="h-3 w-3 mr-1" />
                                ナレッジベース参照
                              </Badge>
                            </div>
                          )}
                          <Markdown content={message.content} className="text-sm" />
                        </>
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
                
                {/* 参照元文書の表示 */}
                {message.sources && message.sources.length > 0 && (
                  <div className="ml-11 mt-2">
                    <Card className="bg-background border-l-4 border-l-blue-500">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          参照文書 ({Math.min(message.sources.length, 3)}件)
                          {message.searchStats && (
                            <Badge variant="outline" className="text-xs">
                              {message.searchStats.totalDocuments}個の文書から検索
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {message.sources.slice(0, 3).map((source, index) => (
                            <div key={index} className="text-sm border rounded p-3 bg-muted/30">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="font-medium text-blue-600">{source.title}</div>
                                {source.type && (
                                  <Badge variant="secondary" className="text-xs">
                                    {source.type}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  関連度: {(source.score * 100).toFixed(1)}%
                                </Badge>
                              </div>
                              {source.keywords && source.keywords.length > 0 && (
                                <div className="mb-2 flex flex-wrap gap-1">
                                  {source.keywords.slice(0, 5).map((keyword, kidx) => (
                                    <Badge key={kidx} variant="secondary" className="text-xs">
                                      {keyword}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <div className="text-muted-foreground text-xs line-clamp-3">
                                {source.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* 関連文書の提案は削除 */}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {searchMode === 'rag' ? '📚' : (searchMode === 'ai' ? (provider === 'anthropic' ? '🤖' : '⚡') : '🔍')}
                  </AvatarFallback>
                </Avatar>
                <Card className="bg-muted">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <p className="text-sm">
                        {searchMode === 'rag' 
                          ? `文書を参照して回答中... (${provider === 'anthropic' ? 'Claude' : 'Gemini'})`
                          : `考え中... (${provider === 'anthropic' ? 'Claude' : 'Gemini'})`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}



            {/* Suggested Questions */}
            {messages.length === 1 && !isLoading && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center mb-3">
                  {searchMode === 'rag'
                    ? '🚀 RAG（文書参照AI）をお試しください。文書から正確な情報を抽出して詳細回答します：'
                    : '以下の質問例をクリックするか、自由に質問してください：'
                  }
                </p>
                
                {/* 特別なデモ用カード */}
                {searchMode === 'rag' && (
                  <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">💡 RAGの特徴</span>
                      </div>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• 9個の会社文書から関連情報を自動検索</li>
                        <li>• NotebookLMスタイルの詳細で実用的な回答</li>
                        <li>• 参照元文書を明示して情報の信頼性を確保</li>
                        <li>• 次のアクションや関連資料を自動提案</li>
                      </ul>
                    </CardContent>
                  </Card>
                )}
                
                <div className="grid gap-2">
                  {getCurrentSuggestions().map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full text-left justify-start h-auto p-3 whitespace-normal bg-transparent hover:bg-muted"
                      onClick={() => handleSuggestedQuestion(question)}
                    >
                      <div className="flex items-center gap-2">
                        {getModeIcon()}
                        <span className="text-sm">{question}</span>
                      </div>
                    </Button>
                  ))}
                </div>
                
                {searchMode === 'rag' && (
                  <div className="text-center mt-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      💻 開発関連、📋 制度・規定、🚀 製品情報、📈 戦略など、あらゆる質問に対応
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {messages.length === 1 ? "9" : "9"} 個の文書がインデックス済み
                    </Badge>
                  </div>
                )}
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
                placeholder={
                  searchMode === 'rag'
                    ? "文書を参照してお答えします..."
                    : "何でも質問してください！"
                }
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!inputValue.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Enterで送信、Shift+Enterで改行 | 現在のモード: <strong>{getModeLabel()}</strong>
              {searchMode === 'rag' && " - 会社文書を参照して回答"}
            </p>
          </div>
        </div>
      </div>
    </SidebarInset>
  )
}
