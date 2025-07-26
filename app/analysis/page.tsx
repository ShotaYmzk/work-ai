"use client"

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Users, CheckCircle, Search } from "lucide-react"

const lineChartData = [
  { month: "1月", pageViews: 4000, uniqueUsers: 2400 },
  { month: "2月", pageViews: 3000, uniqueUsers: 1398 },
  { month: "3月", pageViews: 10000, uniqueUsers: 9800 },
  { month: "4月", pageViews: 3500, uniqueUsers: 3908 },
  { month: "5月", pageViews: 4500, uniqueUsers: 4800 },
  { month: "6月", pageViews: 3500, uniqueUsers: 3800 },
  { month: "7月", pageViews: 3500, uniqueUsers: 4300 },
]

const pieChartData = [
  { name: "検証済み", value: 400, color: "#3b82f6" },
  { name: "未検証", value: 120, color: "#f59e0b" },
  { name: "非推奨", value: 30, color: "#ef4444" },
]

const chartConfig = {
  pageViews: {
    label: "ページビュー",
    color: "#8b5cf6",
  },
  uniqueUsers: {
    label: "ユニークユーザー",
    color: "#10b981",
  },
}

export default function AnalysisPage() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>分析ダッシュボード</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総アイテム数</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">660</div>
              <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">月間アクティブユーザー</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">235</div>
              <p className="text-xs text-muted-foreground">+180.1% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">検証率</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">72.5%</div>
              <p className="text-xs text-muted-foreground">+19% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">検索クエリ数</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+1,234</div>
              <p className="text-xs text-muted-foreground">+35% from last month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>ナレッジ閲覧数推移</CardTitle>
              <CardDescription>過去6ヶ月間の閲覧数の推移です。</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="pageViews"
                      stroke={chartConfig.pageViews.color}
                      strokeWidth={2}
                      dot={{ fill: chartConfig.pageViews.color }}
                    />
                    <Line
                      type="monotone"
                      dataKey="uniqueUsers"
                      stroke={chartConfig.uniqueUsers.color}
                      strokeWidth={2}
                      dot={{ fill: chartConfig.uniqueUsers.color }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>検証済みコンテンツ</CardTitle>
              <CardDescription>コンテンツ全体の検証状況の割合です。</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="flex justify-center gap-4 mt-4">
                {pieChartData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm">{entry.name}</span>
                    <span className="text-sm font-medium">{entry.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Section */}
        <Card>
          <CardHeader>
            <CardTitle>コレクション別アイテム数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>詳細な分析データを表示するエリア</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  )
}
