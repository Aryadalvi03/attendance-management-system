"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { User, Student, AttendanceRecord } from "@/app/page"
import { Users, UserCheck, Clock, TrendingUp, Calendar, BookOpen } from "lucide-react"

interface FacultyOverviewProps {
  user: User
  students: Student[]
  attendance: AttendanceRecord[]
}

export function FacultyOverview({ user, students, attendance }: FacultyOverviewProps) {
  const today = new Date().toISOString().split("T")[0]
  const thisWeek = new Date()
  thisWeek.setDate(thisWeek.getDate() - 7)
  const weekStart = thisWeek.toISOString().split("T")[0]

  // Get classes taught by this faculty (based on department)
  const myClasses = [...new Set(students.filter((s) => s.department === user.department).map((s) => s.class))]
  const myStudents = students.filter((s) => s.department === user.department)

  // Today's attendance for my classes
  const todayAttendance = attendance.filter((record) => {
    return record.date === today && myClasses.includes(record.class)
  })

  // This week's attendance
  const weekAttendance = attendance.filter((record) => {
    return record.date >= weekStart && myClasses.includes(record.class)
  })

  // Calculate stats
  const totalStudents = myStudents.length
  const presentToday = todayAttendance.filter((r) => r.status === "Present").length
  const lateToday = todayAttendance.filter((r) => r.status === "Late").length
  const attendanceRate = totalStudents > 0 ? Math.round(((presentToday + lateToday) / totalStudents) * 100) : 0

  // Recent activity
  const recentAttendance = attendance
    .filter((record) => myClasses.includes(record.class))
    .sort((a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime())
    .slice(0, 10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Faculty Dashboard</h1>
        <p className="text-muted-foreground text-pretty">
          Welcome back, {user.name}. Here's your attendance overview for {user.department} department.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Across {myClasses.length} classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{presentToday}</div>
            <p className="text-xs text-muted-foreground">+{lateToday} late arrivals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
            <Progress value={attendanceRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myClasses.length}</div>
            <p className="text-xs text-muted-foreground">{user.department}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Classes
            </CardTitle>
            <CardDescription>Attendance status for your classes today</CardDescription>
          </CardHeader>
          <CardContent>
            {myClasses.length > 0 ? (
              <div className="space-y-4">
                {myClasses.map((className) => {
                  const classAttendance = todayAttendance.filter((r) => r.class === className)
                  const classStudents = myStudents.filter((s) => s.class === className)
                  const present = classAttendance.filter((r) => r.status === "Present").length
                  const late = classAttendance.filter((r) => r.status === "Late").length
                  const total = classStudents.length
                  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0

                  return (
                    <div key={className} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{className}</h3>
                        <p className="text-sm text-muted-foreground">
                          {present} present, {late} late, {total - present - late} absent
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={rate >= 80 ? "default" : rate >= 60 ? "secondary" : "destructive"}>
                          {rate}%
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {present + late}/{total}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No classes assigned</p>
                <p className="text-sm">Contact admin to assign classes</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest attendance records from your classes</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAttendance.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentAttendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{record.studentName}</div>
                      <div className="text-xs text-muted-foreground">
                        {record.class} • {new Date(record.date).toLocaleDateString()} {record.time}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          record.status === "Present"
                            ? "default"
                            : record.status === "Late"
                              ? "secondary"
                              : "destructive"
                        }
                        className="text-xs"
                      >
                        {record.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">{record.method}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Start taking attendance to see activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
