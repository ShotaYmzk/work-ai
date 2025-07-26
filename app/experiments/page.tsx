import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"

const experiments = [
  {
    id: "1",
    fileName: "Product Design Handbook",
    views: 231,
    assignee: "Dorothy Kang",
    reason: "Incomplete",
    status: "verify",
  },
  {
    id: "2",
    fileName: "Q2 Company Goals (copy)",
    views: 187,
    assignee: "James Simonsen",
    reason: "Duplicate",
    status: "verify",
  },
  {
    id: "3",
    fileName: "Onboarding revamp: project hub",
    views: 180,
    assignee: "You (reminder)",
    reason: "Incorrect",
    status: "verify",
  },
  {
    id: "4",
    fileName: "Employee benefits",
    views: 23,
    assignee: "You (reminder)",
    reason: "Popular document",
    status: "verify",
  },
]

export default function ExperimentsPage() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>検証</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-start gap-4">
          {/* Sidebar */}
          <div className="w-64 space-y-2">
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <div className="w-4 h-4 bg-primary rounded-sm" />
              <span className="font-medium">タスク</span>
            </div>
            <div className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg cursor-pointer">
              <div className="w-4 h-4 border rounded-sm" />
              <span>コンテンツ</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">タスク (4)</h1>
              <div className="flex items-center gap-2">
                <Select defaultValue="collections">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="collections">コレクションについて</SelectItem>
                    <SelectItem value="documents">ドキュメント</SelectItem>
                  </SelectContent>
                </Select>
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
                    <TableHead>閲覧数</TableHead>
                    <TableHead>担当</TableHead>
                    <TableHead>理由</TableHead>
                    <TableHead>アクション</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {experiments.map((experiment) => (
                    <TableRow key={experiment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">📄</div>
                          <span className="font-medium">{experiment.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{experiment.views}</Badge>
                      </TableCell>
                      <TableCell>{experiment.assignee}</TableCell>
                      <TableCell>{experiment.reason}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 bg-transparent"
                          >
                            Verify
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-600 bg-transparent">
                            Deprecate
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  )
}
