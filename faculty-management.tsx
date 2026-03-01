"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import type { Faculty } from "@/app/page"
import { Plus, Search, Edit, Trash2, GraduationCap, Download, UserPlus, BookOpen } from "lucide-react"

interface FacultyManagementProps {
  faculty: Faculty[]
  onFacultyChange: (faculty: Faculty[]) => void
}

export function FacultyManagement({ faculty, onFacultyChange }: FacultyManagementProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null)
  const [newFaculty, setNewFaculty] = useState({
    name: "",
    facultyId: "",
    department: "",
    email: "",
    subjects: [] as string[],
  })
  const [newSubject, setNewSubject] = useState("")

  const departments = [...new Set(faculty.map((f) => f.department))]
  const allSubjects = [...new Set(faculty.flatMap((f) => f.subjects))]

  // Filter faculty
  const filteredFaculty = faculty.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.facultyId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = selectedDepartment === "all" || member.department === selectedDepartment
    return matchesSearch && matchesDepartment
  })

  const handleAddFaculty = () => {
    if (!newFaculty.name || !newFaculty.facultyId || !newFaculty.department) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Check if faculty ID already exists
    if (faculty.some((f) => f.facultyId === newFaculty.facultyId)) {
      toast({
        title: "Error",
        description: "Faculty ID already exists",
        variant: "destructive",
      })
      return
    }

    const facultyMember: Faculty = {
      id: Math.max(...faculty.map((f) => f.id), 0) + 1,
      name: newFaculty.name,
      facultyId: newFaculty.facultyId,
      department: newFaculty.department,
      email: newFaculty.email,
      subjects: newFaculty.subjects,
      addedDate: new Date().toISOString().split("T")[0],
    }

    onFacultyChange([...faculty, facultyMember])
    setNewFaculty({ name: "", facultyId: "", department: "", email: "", subjects: [] })
    setIsAddDialogOpen(false)
    toast({
      title: "Success",
      description: "Faculty member added successfully",
    })
  }

  const handleEditFaculty = () => {
    if (!editingFaculty) return

    if (!editingFaculty.name || !editingFaculty.facultyId || !editingFaculty.department) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Check if faculty ID already exists (excluding current faculty)
    if (faculty.some((f) => f.facultyId === editingFaculty.facultyId && f.id !== editingFaculty.id)) {
      toast({
        title: "Error",
        description: "Faculty ID already exists",
        variant: "destructive",
      })
      return
    }

    const updatedFaculty = faculty.map((f) => (f.id === editingFaculty.id ? editingFaculty : f))
    onFacultyChange(updatedFaculty)
    setEditingFaculty(null)
    setIsEditDialogOpen(false)
    toast({
      title: "Success",
      description: "Faculty member updated successfully",
    })
  }

  const handleDeleteFaculty = (facultyId: number) => {
    const updatedFaculty = faculty.filter((f) => f.id !== facultyId)
    onFacultyChange(updatedFaculty)
    toast({
      title: "Success",
      description: "Faculty member deleted successfully",
    })
  }

  const addSubjectToNew = () => {
    if (newSubject.trim() && !newFaculty.subjects.includes(newSubject.trim())) {
      setNewFaculty({ ...newFaculty, subjects: [...newFaculty.subjects, newSubject.trim()] })
      setNewSubject("")
    }
  }

  const removeSubjectFromNew = (subject: string) => {
    setNewFaculty({ ...newFaculty, subjects: newFaculty.subjects.filter((s) => s !== subject) })
  }

  const addSubjectToEdit = () => {
    if (editingFaculty && newSubject.trim() && !editingFaculty.subjects.includes(newSubject.trim())) {
      setEditingFaculty({ ...editingFaculty, subjects: [...editingFaculty.subjects, newSubject.trim()] })
      setNewSubject("")
    }
  }

  const removeSubjectFromEdit = (subject: string) => {
    if (editingFaculty) {
      setEditingFaculty({ ...editingFaculty, subjects: editingFaculty.subjects.filter((s) => s !== subject) })
    }
  }

  const exportFaculty = () => {
    const csvContent = [
      ["Name", "Faculty ID", "Department", "Email", "Subjects", "Added Date"].join(","),
      ...filteredFaculty.map((member) =>
        [
          `"${member.name}"`,
          member.facultyId,
          member.department,
          member.email || "",
          `"${member.subjects.join(", ")}"`,
          member.addedDate,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `faculty_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedDepartment("all")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Faculty Management</h1>
          <p className="text-muted-foreground text-pretty">Manage faculty members and their information</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Faculty
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Faculty Member</DialogTitle>
              <DialogDescription>Enter the faculty member's information below</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newFaculty.name}
                    onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
                    placeholder="Faculty name"
                  />
                </div>
                <div>
                  <Label htmlFor="facultyId">Faculty ID *</Label>
                  <Input
                    id="facultyId"
                    value={newFaculty.facultyId}
                    onChange={(e) => setNewFaculty({ ...newFaculty, facultyId: e.target.value })}
                    placeholder="Faculty ID"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    value={newFaculty.department}
                    onChange={(e) => setNewFaculty({ ...newFaculty, department: e.target.value })}
                    placeholder="Department"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newFaculty.email}
                    onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })}
                    placeholder="Email address"
                  />
                </div>
              </div>
              <div>
                <Label>Subjects</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Add subject"
                    onKeyPress={(e) => e.key === "Enter" && addSubjectToNew()}
                  />
                  <Button type="button" onClick={addSubjectToNew}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newFaculty.subjects.map((subject) => (
                    <Badge
                      key={subject}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeSubjectFromNew(subject)}
                    >
                      {subject} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddFaculty}>Add Faculty</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{faculty.length}</div>
            <p className="text-xs text-muted-foreground">Active faculty members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground">With faculty members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allSubjects.length}</div>
            <p className="text-xs text-muted-foreground">Total subjects taught</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Faculty Records</CardTitle>
          <CardDescription>Search and filter faculty records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Name or faculty ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="department-filter">Department</Label>
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

              <div className="flex items-end gap-2 col-span-2">
                <Button variant="outline" onClick={clearFilters}>
                  Clear
                </Button>
                <Button variant="outline" onClick={exportFaculty}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Faculty Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Faculty ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Added Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFaculty.length > 0 ? (
                    filteredFaculty.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            {member.email && <div className="text-sm text-muted-foreground">{member.email}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.facultyId}</Badge>
                        </TableCell>
                        <TableCell>{member.department}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {member.subjects.slice(0, 2).map((subject) => (
                              <Badge key={subject} variant="secondary" className="text-xs">
                                {subject}
                              </Badge>
                            ))}
                            {member.subjects.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{member.subjects.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(member.addedDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingFaculty(member)
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteFaculty(member.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <div className="text-lg font-medium mb-2">No Faculty Found</div>
                        <p className="text-sm">Try adjusting your search filters or add a new faculty member</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Faculty Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Faculty Member</DialogTitle>
            <DialogDescription>Update the faculty member's information</DialogDescription>
          </DialogHeader>
          {editingFaculty && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={editingFaculty.name}
                    onChange={(e) => setEditingFaculty({ ...editingFaculty, name: e.target.value })}
                    placeholder="Faculty name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-facultyId">Faculty ID *</Label>
                  <Input
                    id="edit-facultyId"
                    value={editingFaculty.facultyId}
                    onChange={(e) => setEditingFaculty({ ...editingFaculty, facultyId: e.target.value })}
                    placeholder="Faculty ID"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-department">Department *</Label>
                  <Input
                    id="edit-department"
                    value={editingFaculty.department}
                    onChange={(e) => setEditingFaculty({ ...editingFaculty, department: e.target.value })}
                    placeholder="Department"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingFaculty.email || ""}
                    onChange={(e) => setEditingFaculty({ ...editingFaculty, email: e.target.value })}
                    placeholder="Email address"
                  />
                </div>
              </div>
              <div>
                <Label>Subjects</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Add subject"
                    onKeyPress={(e) => e.key === "Enter" && addSubjectToEdit()}
                  />
                  <Button type="button" onClick={addSubjectToEdit}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editingFaculty.subjects.map((subject) => (
                    <Badge
                      key={subject}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeSubjectFromEdit(subject)}
                    >
                      {subject} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditFaculty}>Update Faculty</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
