"use client"

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, Maximize, Lock, ZoomIn, ZoomOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState } from "react"

interface Employee {
  id: string
  name: string
  role: string
  department: string
  avatar?: string
  skills?: string[]
  reports?: Employee[]
}

const organizationData: Employee = {
  id: "1",
  name: "Toru Tano",
  role: "CEO",
  department: "Executive",
  avatar: "/placeholder.svg?height=40&width=40",
  skills: ["Leadership", "Strategy", "Vision"],
  reports: [
    {
      id: "2",
      name: "Ujwal Kumar",
      role: "CTO",
      department: "Technology",
      avatar: "/placeholder.svg?height=40&width=40",
      skills: ["Technology", "Engineering", "Innovation"],
      reports: [
        {
          id: "3",
          name: "Shion Kashihara",
          role: "Lead Engineer",
          department: "Engineering",
          avatar: "/placeholder.svg?height=40&width=40",
          skills: ["React", "Node.js", "TypeScript"],
        },
        {
          id: "4",
          name: "Emily White",
          role: "Product Manager",
          department: "Product",
          avatar: "/placeholder.svg?height=40&width=40",
          skills: ["Product Strategy", "Analytics", "UX"],
        },
      ],
    },
  ],
}

function EmployeeNode({ employee, level = 0 }: { employee: Employee; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="flex flex-col items-center">
      <Card className="w-64 mb-4 hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={employee.avatar || "/placeholder.svg"} />
              <AvatarFallback>
                {employee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{employee.name}</h3>
              <p className="text-xs text-muted-foreground">
                {employee.role} - {employee.department}
              </p>
            </div>
          </div>
          {employee.skills && (
            <div className="flex flex-wrap gap-1">
              {employee.skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {employee.reports && employee.reports.length > 0 && (
        <>
          <div className="w-px h-8 bg-border" />
          <div className="flex items-center gap-8">
            {employee.reports.map((report, index) => (
              <div key={report.id} className="flex flex-col items-center">
                {index > 0 && <div className="w-8 h-px bg-border absolute" style={{ marginTop: "-4px" }} />}
                <div className="w-px h-8 bg-border" />
                <EmployeeNode employee={report} level={level + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function OrganizationPage() {
  const [zoomLevel, setZoomLevel] = useState(100)

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Organization</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="ml-auto px-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col">
        {/* Controls */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Minus className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Maximize className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Lock className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-12 text-center">{zoomLevel}%</span>
            <Button variant="outline" size="icon" onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Organization Chart */}
        <div className="flex-1 overflow-auto p-8">
          <div
            className="flex justify-center min-h-full"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
          >
            <EmployeeNode employee={organizationData} />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 text-center">
          <p className="text-sm text-muted-foreground">React Flow</p>
        </div>
      </div>
    </SidebarInset>
  )
}
