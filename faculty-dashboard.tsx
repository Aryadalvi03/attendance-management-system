"use client"

import { useState } from "react"
import type { User, Student, AttendanceRecord, AttendanceSettings } from "@/app/page"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { FacultyOverview } from "@/components/faculty/faculty-overview"
import { TakeAttendance } from "@/components/faculty/take-attendance"
import { MyClasses } from "@/components/faculty/my-classes"
import { AttendanceHistory } from "@/components/faculty/attendance-history"

interface FacultyDashboardProps {
  user: User
  students: Student[]
  attendance: AttendanceRecord[]
  settings: AttendanceSettings
  onAttendanceChange: (attendance: AttendanceRecord[]) => void
  onLogout: () => void
}

type FacultyPage = "overview" | "take-attendance" | "my-classes" | "history"

export function FacultyDashboard({
  user,
  students,
  attendance,
  settings,
  onAttendanceChange,
  onLogout,
}: FacultyDashboardProps) {
  const [currentPage, setCurrentPage] = useState<FacultyPage>("overview")

  const renderPage = () => {
    switch (currentPage) {
      case "overview":
        return <FacultyOverview user={user} students={students} attendance={attendance} />
      case "take-attendance":
        return (
          <TakeAttendance
            user={user}
            students={students}
            attendance={attendance}
            settings={settings}
            onAttendanceChange={onAttendanceChange}
          />
        )
      case "my-classes":
        return <MyClasses user={user} students={students} attendance={attendance} />
      case "history":
        return <AttendanceHistory user={user} students={students} attendance={attendance} />
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        user={user}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onLogout={onLogout}
        isAdmin={false}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">{renderPage()}</main>
      </div>
    </div>
  )
}
