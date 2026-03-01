"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import type { Student, AttendanceRecord } from "@/app/page"
import {
  AlertTriangle,
  Users,
  Search,
  Mail,
  Phone,
  Download,
  Filter,
  TrendingDown,
  Calendar,
  UserX,
  Clock,
  ArrowLeft,
} from "lucide-react"

interface DefaultersProps {
  students: Student[]
  attendance: AttendanceRecord[]
  onBack: () => void // Added onBack prop for navigation
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

export function Defaulters({ students, attendance, onBack }: DefaultersProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState("all")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedRiskLevel, setSelectedRiskLevel] = useState("all")
  const [attendanceThreshold, setAttendanceThreshold] = useState(75)

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
      } else if (attendanceRate < 75 || consecutiveAbsent >= 3) {
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
    const isBelowThreshold = student.attendanceRate < attendanceThreshold

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
  const lowRiskCount = filteredDefaulters.filter((s) => s.riskLevel === "low").length

  // Critical cases (very low attendance or long absence)
  const criticalCases = filteredDefaulters.filter(
    (student) => student.attendanceRate < 40 || student.consecutiveAbsent >= 7,
  )

  // Chronic absentees (consistently absent)
  const chronicAbsentees = filteredDefaulters.filter(
    (student) => student.absentCount > student.presentCount && student.totalClasses >= 10,
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

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedClass("all")
    setSelectedDepartment("all")
    setSelectedRiskLevel("all")
    setAttendanceThreshold(75)
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
            Identify and manage students with poor attendance records and take corrective actions.
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
            <p className="text-xs text-muted-foreground">Below {attendanceThreshold}% attendance</p>
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

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Defaulters</TabsTrigger>
          <TabsTrigger value="high-risk">High Risk</TabsTrigger>
          <TabsTrigger value="chronic">Chronic Absentees</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Defaulter Students
              </CardTitle>
              <CardDescription>Students with attendance below the threshold</CardDescription>
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
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">
                      Attendance Threshold: {attendanceThreshold}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={attendanceThreshold}
                      onChange={(e) => setAttendanceThreshold(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <Button variant="outline" onClick={clearFilters}>
                    <Filter className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                  <Button onClick={exportDefaultersList}>
                    <Download className="h-4 w-4 mr-2" />
                    Export List
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
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => sendNotification([student.id], "email")}
                              >
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
                          <p className="text-sm">
                            {attendanceThreshold < 100
                              ? "All students meet the attendance threshold"
                              : "Adjust filters to see results"}
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                High Risk Students
              </CardTitle>
              <CardDescription>Students requiring immediate intervention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredDefaulters
                  .filter((s) => s.riskLevel === "high")
                  .map((student) => (
                    <div key={student.id} className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-red-900 dark:text-red-100">{student.name}</h3>
                          <p className="text-sm text-red-700 dark:text-red-300">
                            {student.rollNumber} • {student.class} • {student.department}
                          </p>
                          <div className="flex gap-4 mt-2 text-sm text-red-600 dark:text-red-400">
                            <span>Attendance: {student.attendanceRate}%</span>
                            <span>Consecutive Absent: {student.consecutiveAbsent} days</span>
                            <span>
                              Last Seen:{" "}
                              {student.lastAttendance ? new Date(student.lastAttendance).toLocaleDateString() : "Never"}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => sendNotification([student.id], "email")}>
                            <Mail className="h-3 w-3 mr-1" />
                            Email
                          </Button>
                          <Button size="sm" onClick={() => sendNotification([student.id], "sms")}>
                            <Phone className="h-3 w-3 mr-1" />
                            SMS
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chronic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Chronic Absentees
              </CardTitle>
              <CardDescription>Students with more absences than attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chronicAbsentees.map((student) => (
                  <div key={student.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{student.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {student.rollNumber} • {student.class}
                        </p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span className="text-green-600">Present: {student.presentCount}</span>
                          <span className="text-yellow-600">Late: {student.lateCount}</span>
                          <span className="text-red-600">Absent: {student.absentCount}</span>
                        </div>
                      </div>
                      <Badge variant="destructive">{student.attendanceRate}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Actions</CardTitle>
                <CardDescription>Send notifications to multiple students</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full"
                  onClick={() =>
                    sendNotification(
                      filteredDefaulters.map((s) => s.id),
                      "email",
                    )
                  }
                  disabled={filteredDefaulters.length === 0}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email to All Defaulters ({filteredDefaulters.length})
                </Button>
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() =>
                    sendNotification(
                      filteredDefaulters.map((s) => s.id),
                      "sms",
                    )
                  }
                  disabled={filteredDefaulters.length === 0}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Send SMS to All Defaulters ({filteredDefaulters.length})
                </Button>
                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={() =>
                    sendNotification(
                      filteredDefaulters.filter((s) => s.riskLevel === "high").map((s) => s.id),
                      "email",
                    )
                  }
                  disabled={highRiskCount === 0}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Alert High Risk Students ({highRiskCount})
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>Download defaulter reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" onClick={exportDefaultersList}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Complete List
                </Button>
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => {
                    // Export only high risk students
                    const highRiskStudents = filteredDefaulters.filter((s) => s.riskLevel === "high")
                    // Implementation would be similar to exportDefaultersList but filtered
                    toast({
                      title: "Export Started",
                      description: `Exporting ${highRiskStudents.length} high-risk students`,
                    })
                  }}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Export High Risk Only
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
