"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import type { Student, AttendanceRecord, AttendanceSettings } from "@/app/page"
import {
  AlertTriangle,
  Users,
  Search,
  Mail,
  Phone,
  Download,
  TrendingDown,
  UserX,
  Clock,
  ArrowLeft,
} from "lucide-react"

interface DefaultersProps {
  students: Student[]
  attendance: AttendanceRecord[]
  settings: AttendanceSettings
  onBack: () => void
}

interface DefaulterStudent extends Student {
  attendanceRate: number
  totalClasses: number
  presentCount: number
  absentCount: number
  lateCount: number
  lastAttendance?: string
  consecutiveAbsent: number
  riskLevel: "high" | "medium" | "low"
}

export function Defaulters({ students, attendance, settings, onBack }: DefaultersProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState("all")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedRiskLevel, setSelectedRiskLevel] = useState("all")

  const classes = [...new Set(students.map((s) => s.class))]
  const departments = [...new Set(students.map((s) => s.department))]

  // Calculate defaulter statistics
  const calculateDefaulterStats = (): DefaulterStudent[] => {
    return students.map((student) => {
      const studentAttendance = attendance.filter((record) => record.studentId === student.id)
      const totalClasses = studentAttendance.length
      const presentCount = studentAttendance.filter((r) => r.status === "Present").length
      const lateCount = studentAttendance.filter((r) => r.status === "Late").length
      const absentCount = studentAttendance.filter((r) => r.status === "Absent").length

      const attendanceRate = totalClasses > 0 ? Math.round(((presentCount + lateCount) / totalClasses) * 100) : 100

      // Calculate consecutive absent days
      const sortedAttendance = studentAttendance
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10) // Last 10 records

      let consecutiveAbsent = 0
      for (const record of sortedAttendance) {
        if (record.status === "Absent") {
          consecutiveAbsent++
        } else {
          break
        }
      }

      // Determine risk level
      let riskLevel: "high" | "medium" | "low" = "low"
      if (attendanceRate < 50 || consecutiveAbsent >= 5) {
        riskLevel = "high"
      } else if (attendanceRate < settings.defaulterThreshold || consecutiveAbsent >= 3) {
        riskLevel = "medium"
      }

      // Last attendance date
      const lastAttendanceRecord = studentAttendance
        .filter((r) => r.status !== "Absent")
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

      return {
        ...student,
        attendanceRate,
        totalClasses,
        presentCount,
        absentCount,
        lateCount,
        lastAttendance: lastAttendanceRecord?.date,
        consecutiveAbsent,
        riskLevel,
      }
    })
  }

  const defaulterStudents = calculateDefaulterStats()

  // Filter defaulters
  const filteredDefaulters = defaulterStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = selectedClass === "all" || student.class === selectedClass
    const matchesDepartment = selectedDepartment === "all" || student.department === selectedDepartment
    const matchesRiskLevel = selectedRiskLevel === "all" || student.riskLevel === selectedRiskLevel
    const isBelowThreshold = student.attendanceRate < settings.defaulterThreshold

    return matchesSearch && matchesClass && matchesDepartment && matchesRiskLevel && isBelowThreshold
  })

  // Sort by risk level and attendance rate
  const sortedDefaulters = filteredDefaulters.sort((a, b) => {
    const riskOrder = { high: 3, medium: 2, low: 1 }
    if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
      return riskOrder[b.riskLevel] - riskOrder[a.riskLevel]
    }
    return a.attendanceRate - b.attendanceRate
  })

  // Statistics
  const totalDefaulters = filteredDefaulters.length
  const highRiskCount = filteredDefaulters.filter((s) => s.riskLevel === "high").length
  const mediumRiskCount = filteredDefaulters.filter((s) => s.riskLevel === "medium").length

  // Critical cases (very low attendance or long absence)
  const criticalCases = filteredDefaulters.filter(
    (student) => student.attendanceRate < 40 || student.consecutiveAbsent >= 7,
  )

  const sendNotification = (studentIds: number[], type: "email" | "sms") => {
    const count = studentIds.length
    toast({
      title: `${type.toUpperCase()} Notifications Sent`,
      description: `Sent ${type} notifications to ${count} student${count > 1 ? "s" : ""} and their parents`,
    })
  }

  const exportDefaultersList = () => {
    const csvContent = [
      [
        "Name",
        "Roll Number",
        "Class",
        "Department",
        "Attendance Rate",
        "Risk Level",
        "Consecutive Absent",
        "Last Attendance",
      ].join(","),
      ...sortedDefaulters.map((student) =>
        [
          `"${student.name}"`,
          student.rollNumber,
          student.class,
          student.department,
          `${student.attendanceRate}%`,
          student.riskLevel,
          student.consecutiveAbsent,
          student.lastAttendance || "Never",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `defaulters_list_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-balance">Defaulter Management</h1>
          <p className="text-muted-foreground text-pretty">
            Identify and manage students with poor attendance records below {settings.defaulterThreshold}%.
          </p>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Defaulters</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalDefaulters}</div>
            <p className="text-xs text-muted-foreground">Below {settings.defaulterThreshold}% attendance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{highRiskCount}</div>
            <p className="text-xs text-muted-foreground">Immediate attention required</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Risk</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{mediumRiskCount}</div>
            <p className="text-xs text-muted-foreground">Monitor closely</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalCases.length}</div>
            <p className="text-xs text-muted-foreground">Urgent intervention needed</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {criticalCases.length > 0 && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                <strong>{criticalCases.length} critical cases</strong> require immediate attention. These students have
                extremely low attendance or prolonged absence.
              </span>
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  sendNotification(
                    criticalCases.map((s) => s.id),
                    "email",
                  )
                }
              >
                Send Alerts
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Defaulter Students
          </CardTitle>
          <CardDescription>Students with attendance below {settings.defaulterThreshold}%</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Name or roll number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Class</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Department</label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Risk Level</label>
                <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="low">Low Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button onClick={exportDefaultersList}>
                <Download className="h-4 w-4 mr-2" />
                Export List
              </Button>
              <Button
                onClick={() =>
                  sendNotification(
                    filteredDefaulters.map((s) => s.id),
                    "email",
                  )
                }
                disabled={filteredDefaulters.length === 0}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email All ({filteredDefaulters.length})
              </Button>
            </div>
          </div>

          {/* Defaulters Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Attendance Rate</TableHead>
                  <TableHead>Consecutive Absent</TableHead>
                  <TableHead>Last Attendance</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDefaulters.length > 0 ? (
                  sortedDefaulters.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-muted-foreground">{student.rollNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{student.class}</div>
                          <div className="text-sm text-muted-foreground">{student.department}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              student.attendanceRate >= 60
                                ? "secondary"
                                : student.attendanceRate >= 40
                                  ? "destructive"
                                  : "destructive"
                            }
                          >
                            {student.attendanceRate}%
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {student.presentCount + student.lateCount}/{student.totalClasses}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.consecutiveAbsent >= 5 ? "destructive" : "secondary"}>
                          {student.consecutiveAbsent} days
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {student.lastAttendance ? (
                          <span className="text-sm">{new Date(student.lastAttendance).toLocaleDateString()}</span>
                        ) : (
                          <Badge variant="destructive">Never</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            student.riskLevel === "high"
                              ? "destructive"
                              : student.riskLevel === "medium"
                                ? "secondary"
                                : "default"
                          }
                        >
                          {student.riskLevel.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => sendNotification([student.id], "email")}>
                            <Mail className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => sendNotification([student.id], "sms")}>
                            <Phone className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <div className="text-lg font-medium mb-2">No Defaulters Found</div>
                      <p className="text-sm">All students meet the attendance threshold</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
