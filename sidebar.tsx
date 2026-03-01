"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { User } from "@/app/page"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  AlertTriangle,
  Settings,
  Camera,
  History,
  BookOpen,
  LogOut,
  Shield,
  UserCheck,
} from "lucide-react"

interface SidebarProps {
  user: User
  currentPage: string
  onPageChange: (page: string) => void
  onLogout: () => void
  isAdmin: boolean
}

export function Sidebar({ user, currentPage, onPageChange, onLogout, isAdmin }: SidebarProps) {
  const adminMenuItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "students", label: "Students", icon: Users },
    { id: "faculty", label: "Faculty", icon: GraduationCap },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "defaulters", label: "Defaulters", icon: AlertTriangle },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  const facultyMenuItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "take-attendance", label: "Take Attendance", icon: Camera },
    { id: "my-classes", label: "My Classes", icon: BookOpen },
    { id: "history", label: "History", icon: History },
  ]

  const menuItems = isAdmin ? adminMenuItems : facultyMenuItems

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-sidebar-foreground">RTAS</span>
          <span className="text-xs text-sidebar-foreground/60">Attendance System</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
              {isAdmin ? <Shield className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">{user.name}</span>
              <span className="text-xs text-sidebar-foreground/60 capitalize">{user.role}</span>
            </div>
          </div>
        </div>

        <Separator className="mx-4" />

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2 py-4">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  currentPage === item.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                )}
                onClick={() => onPageChange(item.id)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4">
          <Separator className="mb-4" />
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-10 text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
