import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, MoreHorizontal, FolderOpen } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

export default function KnowledgePage() {
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
            <h1 className="text-2xl font-bold">コレクション (660)</h1>
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
                <TableHead>アイテム数</TableHead>
                <TableHead>作成者</TableHead>
                <TableHead>更新日</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {knowledgeItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">
                        <FolderOpen className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.items > 0 ? (
                      <Badge variant="secondary">{item.items}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{item.author}</TableCell>
                  <TableCell>{item.lastUpdated}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>編集</DropdownMenuItem>
                        <DropdownMenuItem>複製</DropdownMenuItem>
                        <DropdownMenuItem>共有</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">削除</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </SidebarInset>
  )
}
