import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Bell } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"

const recentActivities = [
  { name: "DRIVE", icon: "/images/google_drive.png", color: "bg-blue-100 text-blue-700" },
  { name: "MEET", icon: "/images/google_meet.png", color: "bg-green-100 text-green-700" },
  { name: "DOC", icon: "/images/doc.png", color: "bg-blue-100 text-blue-700" },
  { name: "CALENDAR", icon: "/images/google_calendar.png", color: "bg-red-100 text-red-700" },
  { name: "GMAIL", icon: "/images/google_mail.png", color: "bg-red-100 text-red-700" },
  { name: "ZOOM", icon: "/images/zoom.png", color: "bg-blue-100 text-blue-700" },
  { name: "ONEDRIVE", icon: "/images/onedrive.png", color: "bg-blue-100 text-blue-700" },
  { name: "NOTION", icon: "/images/notion.png", color: "bg-gray-100 text-gray-700" },
  { name: "SLACK", icon: "/images/slack.png", color: "bg-purple-100 text-purple-700" },
]

const notifications = [
  {
    title: "Q3 GTM イネーブルメントカレンダー",
    description: "定期会を考えて計画的に進めましょう...",
    author: "Jessie Makenzie",
    time: "2時間前",
    type: "calendar",
  },
]

const currentProjects = [
  { name: "Product Redesign", progress: 75, status: "In Progress", team: "Design Team" },
  { name: "API Integration", progress: 45, status: "In Progress", team: "Engineering" },
  { name: "User Research", progress: 90, status: "Review", team: "Research Team" },
]

export default function HomePage() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Home Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="ml-auto px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback>中</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold mb-2">👋 こんにちは！</h1>
          <p className="text-muted-foreground">何でも質問してください！</p>
        </div>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">📋 最近のアクティビティ</CardTitle>
            <CardDescription>最近開いたファイルやアクティビティに素早くアクセスできます。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-9 gap-4">
              {recentActivities.map((activity) => (
                <div key={activity.name} className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${activity.color}`}>
                    <Image
                      src={activity.icon}
                      alt={activity.name}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  </div>
                  <span className="text-xs font-medium text-center">{activity.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Notifications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">⚡ お知らせ</CardTitle>
              </div>
              <Button variant="ghost" size="sm">
                すべて表示
              </Button>
            </CardHeader>
            <CardContent>
              {notifications.map((notification, index) => (
                <div key={index} className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-1">{notification.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{notification.description}</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">JM</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{notification.author}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">📅 スケジュール</CardTitle>
              </div>
              <Button variant="ghost" size="sm">
                すべて表示
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="font-semibold">2025年 4月</h3>
                  <Button variant="ghost" size="icon">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  {["金", "土", "日", "月", "火", "水", "木"].map((day) => (
                    <div key={day} className="p-2 font-medium">
                      {day}
                    </div>
                  ))}
                  {["31", "01", "02", "03", "04"].map((date, index) => (
                    <div
                      key={date}
                      className={`p-2 rounded ${index === 2 ? "bg-primary text-primary-foreground" : ""}`}
                    >
                      {date}
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">会議</Badge>
                    <span className="text-sm">3</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">イベント</Badge>
                    <span className="text-sm">2</span>
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium">James Brown様との打ち合わせ</h4>
                  <p className="text-sm text-muted-foreground">8:00 - 8:45 AM (UTC)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">⚡ 現在のプロジェクト</CardTitle>
            </div>
            <Button variant="ghost" size="sm">
              すべて表示
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentProjects.map((project, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h3 className="font-medium">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">{project.team}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{project.progress}%</div>
                      <Badge variant={project.status === "Review" ? "secondary" : "default"}>{project.status}</Badge>
                    </div>
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  )
}
