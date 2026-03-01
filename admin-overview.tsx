"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Student, Faculty, AttendanceRecord, AttendanceSettings } from "@/app/page"
import { Users, GraduationCap, TrendingUp, AlertTriangle, Calendar, Clock, UserCheck, UserX } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

interface AdminOverviewProps {
  students: Student[]
  faculty: Faculty[]
  attendance: AttendanceRecord[]
  settings: AttendanceSettings
}

export function AdminOverview({ students, faculty, attendance, settings }: AdminOverviewProps) {
  // Calculate statistics
  const totalStudents = students.length
  const totalFaculty = faculty.length
  const totalAttendanceRecords = attendance.length

  // Today's attendance
  const today = new Date().toISOString().split("T")[0]
  const todayAttendance = attendance.filter((record) => record.date === today)
  const todayPresent = todayAttendance.filter((r) => r.status === "Present").length
  const todayLate = todayAttendance.filter((r) => r.status === "Late").length
  const todayAbsent = todayAttendance.filter((r) => r.status === "Absent").length

  // Overall attendance rate
  const presentRecords = attendance.filter((r) => r.status === "Present").length
  const lateRecords = attendance.filter((r) => r.status === "Late").length
  const overallAttendanceRate =
    totalAttendanceRecords > 0 ? Math.round(((presentRecords + lateRecords) / totalAttendanceRecords) * 100) : 0

  // Defaulters (students below threshold)
  const defaulterCount = students.filter((student) => {
    const studentAttendance = attendance.filter((record) => record.studentId === student.id)
    const studentPresent = studentAttendance.filter((r) => r.status === "Present").length
    const studentLate = studentAttendance.filter((r) => r.status === "Late").length
    const studentTotal = studentAttendance.length
    const studentRate = studentTotal > 0 ? ((studentPresent + studentLate) / studentTotal) * 100 : 100
    return studentRate < settings.defaulterThreshold
  }).length

  // Recent attendance trend (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toISOString().split("T")[0]
  }).reverse()

  const attendanceTrend = last7Days.map((date) => {
    const dayAttendance = attendance.filter((record) => record.date === date)
    const dayPresent = dayAttendance.filter((r) => r.status === "Present").length
    const dayLate = dayAttendance.filter((r) => r.status === "Late").length
    const dayTotal = dayAttendance.length
    const dayRate = dayTotal > 0 ? Math.round(((dayPresent + dayLate) / dayTotal) * 100) : 0

    return {
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      rate: dayRate,
      present: dayPresent,
      late: dayLate,
      absent: dayAttendance.filter((r) => r.status === "Absent").length,
    }
  })

  // Department-wise statistics
  const departments = [...new Set(students.map((s) => s.department))]
  const departmentStats = departments.map((dept) => {
    const deptStudents = students.filter((s) => s.department === dept).length
    const deptAttendance = attendance.filter((r) => r.department === dept)
    const deptPresent = deptAttendance.filter((r) => r.status === "Present").length
    const deptLate = deptAttendance.filter((r) => r.status === "Late").length
    const deptTotal = deptAttendance.length
    const deptRate = deptTotal > 0 ? Math.round(((deptPresent + deptLate) / deptTotal) * 100) : 0

    return {
      department: dept,
      students: deptStudents,
      rate: deptRate,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Admin Dashboard</h1>
        <p className="text-muted-foreground text-pretty">Overview of attendance system performance and key metrics</p>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Across {departments.length} departments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faculty Members</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFaculty}</div>
            <p className="text-xs text-muted-foreground">Active faculty members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallAttendanceRate}%</div>
            <Progress value={overallAttendanceRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Defaulters</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{defaulterCount}</div>
            <p className="text-xs text-muted-foreground">Below {settings.defaulterThreshold}% threshold</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Attendance
          </CardTitle>
          <CardDescription>Real-time attendance status for {new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <UserCheck className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{todayPresent}</div>
                <div className="text-sm text-muted-foreground">Present</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{todayLate}</div>
                <div className="text-sm text-muted-foreground">Late</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <UserX className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">{todayAbsent}</div>
                <div className="text-sm text-muted-foreground">Absent</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>7-Day Attendance Trend</CardTitle>
            <CardDescription>Daily attendance rates over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} name="Attendance Rate (%)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
            <CardDescription>Attendance rates by department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="rate" fill="#0891b2" name="Attendance Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Department Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Department Summary</CardTitle>
          <CardDescription>Quick overview of each department's performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departmentStats.map((dept) => (
              <div key={dept.department} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{dept.department}</div>
                  <div className="text-sm text-muted-foreground">{dept.students} students</div>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={dept.rate} className="w-24" />
                  <Badge variant={dept.rate >= 80 ? "default" : dept.rate >= 60 ? "secondary" : "destructive"}>
                    {dept.rate}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Current system configuration and settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="text-sm font-medium">Recognition Model</div>
              <div className="text-lg">{settings.recognitionModel}</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-sm font-medium">Confidence Threshold</div>
              <div className="text-lg">{settings.confidenceThreshold}%</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-sm font-medium">Auto Mark</div>
              <Badge variant={settings.autoMarkEnabled ? "default" : "secondary"}>
                {settings.autoMarkEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-sm font-medium">Late Threshold</div>
              <div className="text-lg">{settings.lateThreshold} minutes</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-sm font-medium">Notifications</div>
              <Badge variant={settings.notificationsEnabled ? "default" : "secondary"}>
                {settings.notificationsEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-sm font-medium">Total Records</div>
              <div className="text-lg">{totalAttendanceRecords}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
