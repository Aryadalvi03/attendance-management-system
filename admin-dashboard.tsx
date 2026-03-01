"use client"

import { useState } from "react"
import type { User, Student, Faculty, AttendanceRecord, AttendanceSettings } from "@/app/page"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { AdminOverview } from "@/components/admin/admin-overview"
import { StudentManagement } from "@/components/admin/student-management"
import { FacultyManagement } from "@/components/admin/faculty-management"
import { AttendanceReports } from "@/components/admin/attendance-reports"
import { SettingsPage as SystemSettings } from "@/components/admin/settings"
import { Defaulters as DefaulterManagement } from "@/components/defaulters"

interface AdminDashboardProps {
  user: User
  students: Student[]
  faculty: Faculty[]
  attendance: AttendanceRecord[]
  settings: AttendanceSettings
  onStudentsChange: (students: Student[]) => void
  onFacultyChange: (faculty: Faculty[]) => void
  onAttendanceChange: (attendance: AttendanceRecord[]) => void
  onSettingsChange: (settings: AttendanceSettings) => void
  onLogout: () => void
}

type AdminPage = "overview" | "students" | "faculty" | "reports" | "defaulters" | "settings"

export function AdminDashboard({
  user,
  students,
  faculty,
  attendance,
  settings,
  onStudentsChange,
  onFacultyChange,
  onAttendanceChange,
  onSettingsChange,
  onLogout,
}: AdminDashboardProps) {
  const [currentPage, setCurrentPage] = useState<AdminPage>("overview")

  const renderPage = () => {
    switch (currentPage) {
      case "overview":
        return <AdminOverview students={students} faculty={faculty} attendance={attendance} settings={settings} />
      case "students":
        return <StudentManagement students={students} onStudentsChange={onStudentsChange} />
      case "faculty":
        return <FacultyManagement faculty={faculty} onFacultyChange={onFacultyChange} />
      case "reports":
        return <AttendanceReports students={students} attendance={attendance} />
      case "defaulters":
        return <DefaulterManagement students={students} attendance={attendance} settings={settings} />
      case "settings":
        return <SystemSettings settings={settings} onSettingsChange={onSettingsChange} />
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} currentPage={currentPage} onPageChange={setCurrentPage} onLogout={onLogout} isAdmin={true} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">{renderPage()}</main>
      </div>
    </div>
  )
}
