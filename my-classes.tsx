"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import type { User, Student, AttendanceRecord } from "@/app/page"
import { Users, Search, BookOpen } from "lucide-react"

interface MyClassesProps {
  user: User
  students: Student[]
  attendance: AttendanceRecord[]
}

export function MyClasses({ user, students, attendance }: MyClassesProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState("all")
  const [selectedPeriod, setSelectedPeriod] = useState("week")

  // Get classes taught by this faculty
  const myClasses = [...new Set(students.filter((s) => s.department === user.department).map((s) => s.class))]
  const myStudents = students.filter((s) => s.department === user.department)

  // Filter students based on search and class
  const filteredStudents = myStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = selectedClass === "all" || student.class === selectedClass

    return matchesSearch && matchesClass
  })

  // Calculate date range based on period
  const getDateRange = () => {
    const today = new Date()
    const startDate = new Date()

    switch (selectedPeriod) {
      case "today":
        return { start: today.toISOString().split("T")[0], end: today.toISOString().split("T")[0] }
      case "week":
        startDate.setDate(today.getDate() - 7)
        return { start: startDate.toISOString().split("T")[0], end: today.toISOString().split("T")[0] }
      case "month":
        startDate.setMonth(today.getMonth() - 1)
        return { start: startDate.toISOString().split("T")[0], end: today.toISOString().split("T")[0] }
      default:
        return { start: startDate.toISOString().split("T")[0], end: today.toISOString().split("T")[0] }
    }
  }

  const { start: startDate, end: endDate } = getDateRange()

  // Calculate attendance stats for each student
  const getStudentStats = (student: Student) => {
    const studentAttendance = attendance.filter(
      (record) =>
        record.studentId === student.id &&
        record.date >= startDate &&
        record.date <= endDate &&
        myClasses.includes(record.class),
    )

    const totalClasses = studentAttendance.length
    const presentCount = studentAttendance.filter((r) => r.status === "Present").length
    const lateCount = studentAttendance.filter((r) => r.status === "Late").length
    const absentCount = totalClasses - presentCount - lateCount

    const attendanceRate = totalClasses > 0 ? Math.round(((presentCount + lateCount) / totalClasses) * 100) : 0

    return {
      totalClasses,
      presentCount,
      lateCount,
      absentCount,
      attendanceRate,
    }
  }

  // Class overview stats
  const getClassStats = (className: string) => {
    const classStudents = myStudents.filter((s) => s.class === className)
    const classAttendance = attendance.filter(
      (record) => record.class === className && record.date >= startDate && record.date <= endDate,
    )

    const totalSessions = Math.max(
      1,
      new Set(classAttendance.map((r) => r.date)).size || 1, // At least 1 to avoid division by zero
    )
    const avgAttendance =
      classStudents.length > 0
        ? Math.round(
            (classAttendance.filter((r) => r.status !== "Absent").length / (classStudents.length * totalSessions)) *
              100,
          )
        : 0

    return {
      totalStudents: classStudents.length,
      totalSessions,
      avgAttendance,
      presentToday: classAttendance.filter(
        (r) => r.date === new Date().toISOString().split("T")[0] && r.status === "Present",
      ).length,
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">My Classes</h1>
        <p className="text-muted-foreground text-pretty">
          Manage and monitor attendance for your {myClasses.length} classes in {user.department} department.
        </p>
      </div>

      {/* Class Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myClasses.map((className) => {
          const stats = getClassStats(className)
          return (
            <Card key={className} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {className}
                  </span>
                  <Badge variant="secondary">{stats.totalStudents}</Badge>
                </CardTitle>
                <CardDescription>{user.department} Department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average Attendance</span>
                    <span className="font-semibold">{stats.avgAttendance}%</span>
                  </div>
                  <Progress value={stats.avgAttendance} />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total Sessions</div>
                      <div className="font-medium">{stats.totalSessions}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Present Today</div>
                      <div className="font-medium text-green-600">{stats.presentToday}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student Attendance Overview
          </CardTitle>
          <CardDescription>Monitor individual student attendance across your classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students by name or roll number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {myClasses.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Student List */}
          <div className="space-y-4">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => {
                const stats = getStudentStats(student)
                return (
                  <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">{student.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{student.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {student.rollNumber} • {student.class}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Attendance Rate</div>
                        <Badge
                          variant={
                            stats.attendanceRate >= 80
                              ? "default"
                              : stats.attendanceRate >= 60
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {stats.attendanceRate}%
                        </Badge>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Present</div>
                        <div className="font-medium text-green-600">{stats.presentCount}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Late</div>
                        <div className="font-medium text-yellow-600">{stats.lateCount}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Absent</div>
                        <div className="font-medium text-red-600">{stats.absentCount}</div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Students Found</h3>
                <p className="text-sm">
                  {searchTerm || selectedClass !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "No students assigned to your classes"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
