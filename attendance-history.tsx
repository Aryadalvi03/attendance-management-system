"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { User, Student, AttendanceRecord } from "@/app/page"
import { History, Download, Filter, Calendar, Search } from "lucide-react"

interface AttendanceHistoryProps {
  user: User
  students: Student[]
  attendance: AttendanceRecord[]
}

export function AttendanceHistory({ user, students, attendance }: AttendanceHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Get classes taught by this faculty
  const myClasses = [...new Set(students.filter((s) => s.department === user.department).map((s) => s.class))]

  // Filter attendance records
  const filteredAttendance = attendance.filter((record) => {
    // Only show records from my classes
    if (!myClasses.includes(record.class)) return false

    // Search filter
    const matchesSearch =
      record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())

    // Class filter
    const matchesClass = selectedClass === "all" || record.class === selectedClass

    // Status filter
    const matchesStatus = selectedStatus === "all" || record.status === selectedStatus

    // Date filters
    const matchesDateFrom = !dateFrom || record.date >= dateFrom
    const matchesDateTo = !dateTo || record.date <= dateTo

    return matchesSearch && matchesClass && matchesStatus && matchesDateFrom && matchesDateTo
  })

  // Sort by date and time (newest first)
  const sortedAttendance = filteredAttendance.sort(
    (a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime(),
  )

  const exportToCSV = () => {
    const headers = ["Date", "Time", "Student Name", "Roll Number", "Class", "Status", "Method"]
    const csvContent = [
      headers.join(","),
      ...sortedAttendance.map((record) =>
        [
          record.date,
          record.time,
          `"${record.studentName}"`,
          record.rollNumber,
          record.class,
          record.status,
          record.method,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance_history_${user.department}_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedClass("all")
    setSelectedStatus("all")
    setDateFrom("")
    setDateTo("")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Attendance History</h1>
        <p className="text-muted-foreground text-pretty">
          View and export attendance records for your classes in {user.department} department.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Attendance Records
          </CardTitle>
          <CardDescription>Filter and search through attendance history for your classes</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Student name or roll number..."
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
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Present">Present</SelectItem>
                    <SelectItem value="Late">Late</SelectItem>
                    <SelectItem value="Absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">From Date</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">To Date</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>

              <div className="flex items-end gap-2">
                <Button variant="outline" onClick={clearFilters} className="flex-1 bg-transparent">
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
                <Button onClick={exportToCSV} disabled={sortedAttendance.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {sortedAttendance.length} records
              {filteredAttendance.length !== attendance.length && ` (filtered from ${attendance.length} total)`}
            </p>
            <div className="flex gap-2">
              <Badge variant="outline">Present: {sortedAttendance.filter((r) => r.status === "Present").length}</Badge>
              <Badge variant="outline">Late: {sortedAttendance.filter((r) => r.status === "Late").length}</Badge>
              <Badge variant="outline">Absent: {sortedAttendance.filter((r) => r.status === "Absent").length}</Badge>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAttendance.length > 0 ? (
                  sortedAttendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>{record.time}</TableCell>
                      <TableCell className="font-medium">{record.studentName}</TableCell>
                      <TableCell>{record.rollNumber}</TableCell>
                      <TableCell>{record.class}</TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{record.method}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <div className="text-lg font-medium mb-2">No Records Found</div>
                      <p className="text-sm">
                        {searchTerm || selectedClass !== "all" || selectedStatus !== "all" || dateFrom || dateTo
                          ? "Try adjusting your search criteria or filters"
                          : "No attendance records available for your classes"}
                      </p>
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
