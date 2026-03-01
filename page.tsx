"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { FacultyDashboard } from "@/components/dashboard/faculty-dashboard"
import { StudentDashboard } from "@/components/dashboard/student-dashboard"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Reports } from "@/components/reports"
import { Defaulters } from "@/components/defaulters"

export type UserRole = "admin" | "faculty" | "student"

export interface User {
  username: string
  role: UserRole
  name: string
  department?: string
}

export interface Student {
  id: number
  name: string
  rollNumber: string
  department: string
  class: string
  email?: string
  phone?: string
  photo?: string
  registrationDate: string
  attendanceCount: number
}

export interface Faculty {
  id: number
  name: string
  facultyId: string
  department: string
  email?: string
  subjects: string[]
  addedDate: string
}

export interface AttendanceRecord {
  id: number
  studentId: number
  studentName: string
  rollNumber: string
  class: string
  department: string
  date: string
  time: string
  status: "Present" | "Absent" | "Late"
  method: "Face Recognition" | "Manual" | "Group Attendance" | "Auto Attendance"
  confidence?: string
  facultyId?: number
}

export interface AttendanceSettings {
  confidenceThreshold: number
  lateThreshold: number
  recognitionModel: string
  autoMarkEnabled: boolean
  notificationsEnabled: boolean
  defaulterThreshold: number
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [settings, setSettings] = useState<AttendanceSettings>({
    confidenceThreshold: 85,
    lateThreshold: 15,
    recognitionModel: "Advanced",
    autoMarkEnabled: true,
    notificationsEnabled: true,
    defaulterThreshold: 75,
  })
  const [currentPage, setCurrentPage] = useState<string>("dashboard")

  useEffect(() => {
    const savedStudents = localStorage.getItem("rtas_students")
    const savedFaculty = localStorage.getItem("rtas_faculty")
    const savedAttendance = localStorage.getItem("rtas_attendance")
    const savedSettings = localStorage.getItem("rtas_settings")

    if (savedStudents) setStudents(JSON.parse(savedStudents))
    if (savedFaculty) setFaculty(JSON.parse(savedFaculty))
    if (savedAttendance) setAttendance(JSON.parse(savedAttendance))
    if (savedSettings) setSettings(JSON.parse(savedSettings))
  }, [])

  useEffect(() => {
    localStorage.setItem("rtas_students", JSON.stringify(students))
  }, [students])

  useEffect(() => {
    localStorage.setItem("rtas_faculty", JSON.stringify(faculty))
  }, [faculty])

  useEffect(() => {
    localStorage.setItem("rtas_attendance", JSON.stringify(attendance))
  }, [attendance])

  useEffect(() => {
    localStorage.setItem("rtas_settings", JSON.stringify(settings))
  }, [settings])

  const handleLogin = (userData: User) => {
    setUser(userData)
  }

  const handleLogout = () => {
    setUser(null)
  }

  if (!user) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <LoginForm onLogin={handleLogin} />
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="min-h-screen bg-background">
        {currentPage === "dashboard" &&
          (user.role === "admin" ? (
            <AdminDashboard
              user={user}
              students={students}
              faculty={faculty}
              attendance={attendance}
              settings={settings}
              onStudentsChange={setStudents}
              onFacultyChange={setFaculty}
              onAttendanceChange={setAttendance}
              onSettingsChange={setSettings}
              onLogout={handleLogout}
              onPageChange={setCurrentPage}
            />
          ) : user.role === "faculty" ? (
            <FacultyDashboard
              user={user}
              students={students}
              attendance={attendance}
              settings={settings}
              onAttendanceChange={setAttendance}
              onLogout={handleLogout}
              onPageChange={setCurrentPage}
            />
          ) : (
            <StudentDashboard user={user} students={students} attendance={attendance} onLogout={handleLogout} />
          ))}
        {currentPage === "reports" && (
          <div className="min-h-screen">
            <Reports students={students} attendance={attendance} onBack={() => setCurrentPage("dashboard")} />
          </div>
        )}
        {currentPage === "defaulters" && (
          <div className="min-h-screen">
            <Defaulters students={students} attendance={attendance} onBack={() => setCurrentPage("dashboard")} />
          </div>
        )}
      </div>
      <Toaster />
    </ThemeProvider>
  )
}
