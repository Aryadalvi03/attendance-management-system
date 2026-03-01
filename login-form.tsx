"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { UserRole } from "@/app/page"
import { GraduationCap, Users, Shield, UserIcon } from "lucide-react"

interface LoginFormProps {
  onLogin: (user: any) => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole | "">("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const validCredentials = [
      {
        username: "admin",
        password: "admin123",
        role: "admin" as UserRole,
        name: "System Administrator",
        department: "Administration",
      },
      {
        username: "faculty",
        password: "faculty123",
        role: "faculty" as UserRole,
        name: "Faculty Member",
        department: "Computer Science",
      },
      {
        username: "john.doe",
        password: "faculty123",
        role: "faculty" as UserRole,
        name: "Dr. John Doe",
        department: "Mathematics",
      },
      {
        username: "jane.smith",
        password: "faculty123",
        role: "faculty" as UserRole,
        name: "Prof. Jane Smith",
        department: "Physics",
      },
      {
        username: "student1",
        password: "student123",
        role: "student" as UserRole,
        name: "Alice Johnson",
        department: "Computer Science",
      },
      {
        username: "student2",
        password: "student123",
        role: "student" as UserRole,
        name: "Bob Smith",
        department: "Mathematics",
      },
      {
        username: "student3",
        password: "student123",
        role: "student" as UserRole,
        name: "Carol Davis",
        department: "Physics",
      },
    ]

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const user = validCredentials.find(
      (cred) => cred.username === username && cred.password === password && cred.role === role,
    )

    if (user) {
      onLogin({
        username: user.username,
        role: user.role,
        name: user.name,
        department: user.department,
      })
    } else {
      setError("Invalid credentials. Please check your username, password, and role.")
    }

    setIsLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-balance">Real-Time Attendance System</CardTitle>
          <CardDescription className="text-pretty">
            Advanced face recognition attendance management for educational institutions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Administrator
                    </div>
                  </SelectItem>
                  <SelectItem value="faculty">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Faculty Member
                    </div>
                  </SelectItem>
                  <SelectItem value="student">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      Student
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Demo Credentials:</h4>
            <div className="text-sm space-y-1">
              <p>
                <strong>Admin:</strong> admin / admin123
              </p>
              <p>
                <strong>Faculty:</strong> faculty / faculty123
              </p>
              <p>
                <strong>Student:</strong> student1 / student123
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
