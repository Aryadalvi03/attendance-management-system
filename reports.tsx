"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Student, AttendanceRecord } from "@/app/page"
import { FileText, TrendingUp, Users, Download, BarChart3, PiIcon as PieIcon, Activity, ArrowLeft } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
} from "recharts"

interface ReportsProps {
  students: Student[]
  attendance: AttendanceRecord[]
  onBack: () => void
}

export function Reports({ students, attendance, onBack }: ReportsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [selectedClass, setSelectedClass] = useState("all")
  const [selectedDepartment, setSelectedDepartment] = useState("all")

  const classes = [...new Set(students.map((s) => s.class))]
  const departments = [...new Set(students.map((s) => s.department))]

  // Calculate date range based on period
  const getDateRange = () => {
    const today = new Date()
    const startDate = new Date()

    switch (selectedPeriod) {
      case "week":
        startDate.setDate(today.getDate() - 7)
        break
      case "month":
        startDate.setMonth(today.getMonth() - 1)
        break
      case "semester":
        startDate.setMonth(today.getMonth() - 6)
        break
      case "year":
        startDate.setFullYear(today.getFullYear() - 1)
        break
      default:
        startDate.setMonth(today.getMonth() - 1)
    }

    return { start: startDate.toISOString().split("T")[0], end: today.toISOString().split("T")[0] }
  }

  const { start: startDate, end: endDate } = getDateRange()

  // Filter data based on selections
  const filteredStudents = students.filter((student) => {
    const matchesClass = selectedClass === "all" || student.class === selectedClass
    const matchesDepartment = selectedDepartment === "all" || student.department === selectedDepartment
    return matchesClass && matchesDepartment
  })

  const filteredAttendance = attendance.filter((record) => {
    const matchesDate = record.date >= startDate && record.date <= endDate
    const matchesClass = selectedClass === "all" || record.class === selectedClass
    const matchesDepartment = selectedDepartment === "all" || record.department === selectedDepartment
    return matchesDate && matchesClass && matchesDepartment
  })

  // Calculate overall statistics
  const totalStudents = filteredStudents.length
  const totalRecords = filteredAttendance.length
  const presentRecords = filteredAttendance.filter((r) => r.status === "Present").length
  const lateRecords = filteredAttendance.filter((r) => r.status === "Late").length
  const absentRecords = filteredAttendance.filter((r) => r.status === "Absent").length

  const overallAttendanceRate = totalRecords > 0 ? Math.round(((presentRecords + lateRecords) / totalRecords) * 100) : 0
  const punctualityRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0

  // Daily attendance trend
  const dailyTrend = (() => {
    const dailyData = new Map<string, { date: string; present: number; late: number; absent: number; total: number }>()

    filteredAttendance.forEach((record) => {
      const date = record.date
      if (!dailyData.has(date)) {
        dailyData.set(date, { date, present: 0, late: 0, absent: 0, total: 0 })
      }
      const day = dailyData.get(date)!
      day.total++
      if (record.status === "Present") day.present++
      else if (record.status === "Late") day.late++
      else day.absent++
    })

    return Array.from(dailyData.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14) // Last 14 days
      .map((day) => ({
        ...day,
        attendanceRate: day.total > 0 ? Math.round(((day.present + day.late) / day.total) * 100) : 0,
        formattedDate: new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      }))
  })()

  // Status distribution for pie chart
  const statusDistribution = [
    { name: "Present", value: presentRecords, color: "#10b981" },
    { name: "Late", value: lateRecords, color: "#f59e0b" },
    { name: "Absent", value: absentRecords, color: "#ef4444" },
  ]

  const exportReport = () => {
    const reportData = {
      period: selectedPeriod,
      dateRange: `${startDate} to ${endDate}`,
      filters: { class: selectedClass, department: selectedDepartment },
      summary: {
        totalStudents,
        totalRecords,
        overallAttendanceRate,
        punctualityRate,
      },
      dailyTrend,
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance_report_${selectedPeriod}_${new Date().toISOString().split("T")[0]}.json`
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
          <h1 className="text-3xl font-bold text-balance">Attendance Reports & Analytics</h1>
          <p className="text-muted-foreground text-pretty">
            Comprehensive attendance analytics with insights and trends across all departments and classes.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Time Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="semester">Last Semester</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
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

            <div className="flex items-end">
              <Button onClick={exportReport} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Across {classes.length} classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallAttendanceRate}%</div>
            <Progress value={overallAttendanceRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Punctuality Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{punctualityRate}%</div>
            <Progress value={punctualityRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}</div>
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Attendance Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Daily Attendance Trend
                </CardTitle>
                <CardDescription>Attendance rate over the last 14 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedDate" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="attendanceRate" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieIcon className="h-5 w-5" />
                  Status Distribution
                </CardTitle>
                <CardDescription>Breakdown of attendance status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
              <CardDescription>Overall attendance statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Present Records</span>
                  <Badge variant="default">{presentRecords}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Late Records</span>
                  <Badge variant="secondary">{lateRecords}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Absent Records</span>
                  <Badge variant="destructive">{absentRecords}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
