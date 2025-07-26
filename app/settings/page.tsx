"use client"

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { useState } from "react"

const initialIntegrations = [
  {
    id: "google-drive",
    name: "Google Drive",
    description: "ファイルやドキュメントを同期します。",
    icon: "/images/google_drive.png",
    connected: true,
  },
  {
    id: "onedrive",
    name: "OneDrive",
    description: "Microsoftのファイルにアクセスします。",
    icon: "/images/onedrive.png",
    connected: true,
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "ミーティングの録画や議事録を連携します。",
    icon: "/images/zoom.png",
    connected: true,
  },
  {
    id: "slack",
    name: "Slack",
    description: "チームのコミュニケーションを連携します。",
    icon: "/images/slack.png",
    connected: false,
  },
  {
    id: "notion",
    name: "Notion",
    description: "ドキュメントやデータベースを連携します。",
    icon: "/images/notion.png",
    connected: true,
  },
]

export default function SettingsPage() {
  const [integrations, setIntegrations] = useState(initialIntegrations)

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => 
      prev.map(integration => 
        integration.id === id 
          ? { ...integration, connected: !integration.connected }
          : integration
      )
    )
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
                <BreadcrumbPage>設定</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>プロフィール</CardTitle>
            <CardDescription>サイト上でのあなたの表示情報です。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src="/placeholder.svg?height=80&width=80" />
                <AvatarFallback className="text-lg">中</AvatarFallback>
              </Avatar>
              <Button variant="outline">新しい写真をアップロード</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">名前</Label>
                <Input id="name" defaultValue="中島 賢太" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">役職</Label>
                <Input id="role" defaultValue="CEO" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">部署</Label>
                <Input id="department" defaultValue="Executive" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input id="email" type="email" defaultValue="kenta.nakajima@example.com" />
              </div>
            </div>

            <div className="flex justify-end">
              <Button>プロフィールを更新</Button>
            </div>
          </CardContent>
        </Card>

        {/* Integrations Section */}
        <Card>
          <CardHeader>
            <CardTitle>統合</CardTitle>
            <CardDescription>アカウントを他のサービスと連携します。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {integrations.map((integration) => (
              <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Image
                      src={integration.icon}
                      alt={integration.name}
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">{integration.name}</h3>
                    <p className="text-sm text-muted-foreground">{integration.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {integration.connected ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                      ● Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-500 border-gray-300">
                      ○ Not Connected
                    </Badge>
                  )}
                  <Button 
                    variant={integration.connected ? "destructive" : "default"} 
                    size="sm"
                    onClick={() => toggleIntegration(integration.id)}
                  >
                    {integration.connected ? "連携解除" : "連携"}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle>通知設定</CardTitle>
            <CardDescription>受け取りたい通知の種類を選択してください。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">プロジェクト更新</h3>
                <p className="text-sm text-muted-foreground">プロジェクトの進捗や変更について通知を受け取る</p>
              </div>
              <Button variant="outline" size="sm">
                有効
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">メンション</h3>
                <p className="text-sm text-muted-foreground">コメントやドキュメントでメンションされた時</p>
              </div>
              <Button variant="outline" size="sm">
                有効
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">週次レポート</h3>
                <p className="text-sm text-muted-foreground">週次の活動サマリーを受け取る</p>
              </div>
              <Button variant="outline" size="sm">
                無効
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle>セキュリティ</CardTitle>
            <CardDescription>アカウントのセキュリティ設定を管理します。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">二要素認証</h3>
                <p className="text-sm text-muted-foreground">アカウントのセキュリティを強化します</p>
              </div>
              <Button variant="outline" size="sm">
                設定
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">パスワード変更</h3>
                <p className="text-sm text-muted-foreground">定期的なパスワード変更を推奨します</p>
              </div>
              <Button variant="outline" size="sm">
                変更
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">ログイン履歴</h3>
                <p className="text-sm text-muted-foreground">最近のログイン活動を確認</p>
              </div>
              <Button variant="outline" size="sm">
                表示
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  )
}
