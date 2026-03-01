"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Header } from "@/components/layout/header"
import { User, Calendar, TrendingUp, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import type { User as UserType, Student, AttendanceRecord } from "@/app/page"

interface StudentDashboardProps {
  user: UserType
  students: Student[]
  attendance: AttendanceRecord[]
  onLogout: () => void
}

export function StudentDashboard({ user, students, attendance, onLogout }: StudentDashboardProps) {
  // Find current student data
  const currentStudent = students.find((s) => s.name === user.name)

  // Calculate attendance statistics for current student
  const studentAttendance = attendance.filter((a) => a.studentName === user.name)
  const totalClasses = studentAttendance.length
  const presentClasses = studentAttendance.filter((a) => a.status === "Present").length
  const lateClasses = studentAttendance.filter((a) => a.status === "Late").length
  const absentClasses = studentAttendance.filter((a) => a.status === "Absent").length

  const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0
  const isDefaulter = attendancePercentage < 75

  // Get recent attendance (last 10 records)
  const recentAttendance = studentAttendance
    .sort((a, b) => new Date(b.date + " " + b.time).getTime() - new Date(a.date + " " + a.time).getTime())
    .slice(0, 10)

  // Calculate monthly attendance
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlyAttendance = studentAttendance.filter((a) => {
    const attendanceDate = new Date(a.date)
    return attendanceDate.getMonth() === currentMonth && attendanceDate.getFullYear() === currentYear
  })
  const monthlyPercentage =
    monthlyAttendance.length > 0
      ? Math.round((monthlyAttendance.filter((a) => a.status === "Present").length / monthlyAttendance.length) * 100)
      : 0

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogout={onLogout} title="Student Portal" />

      <main className="container mx-auto p-6 space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Welcome, {user.name}</h1>
            <p className="text-muted-foreground text-pretty">Track your attendance and academic progress</p>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{user.department}</span>
          </div>
        </div>

        {/* Attendance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendancePercentage}%</div>
              <Progress value={attendancePercentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {presentClasses} of {totalClasses} classes attended
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthlyPercentage}%</div>
              <p className="text-xs text-muted-foreground">
                {monthlyAttendance.filter((a) => a.status === "Present").length} of {monthlyAttendance.length} classes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present Days</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{presentClasses}</div>
              <p className="text-xs text-muted-foreground">Classes attended</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent Days</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{absentClasses}</div>
              <p className="text-xs text-muted-foreground">Classes missed</p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Status Alert */}
        {isDefaulter && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <CardTitle className="text-red-800 dark:text-red-200">Attendance Warning</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 dark:text-red-300">
                Your attendance is below 75% ({attendancePercentage}%). You need to improve your attendance to meet the
                minimum requirement.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Recent Attendance History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance History</CardTitle>
            <CardDescription>Your last 10 attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAttendance.length > 0 ? (
              <div className="space-y-3">
                {recentAttendance.map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{record.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{record.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{record.class}</span>
                      <Badge
                        variant={
                          record.status === "Present"
                            ? "default"
                            : record.status === "Late"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {record.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No attendance records found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Information */}
        {currentStudent && (
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
              <CardDescription>Your academic details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Roll Number</label>
                  <p className="font-medium">{currentStudent.rollNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Class</label>
                  <p className="font-medium">{currentStudent.class}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Department</label>
                  <p className="font-medium">{currentStudent.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Registration Date</label>
                  <p className="font-medium">{currentStudent.registrationDate}</p>
                </div>
                {currentStudent.email && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="font-medium">{currentStudent.email}</p>
                  </div>
                )}
                {currentStudent.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="font-medium">{currentStudent.phone}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
