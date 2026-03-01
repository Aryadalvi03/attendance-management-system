"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import type { User, Student, AttendanceRecord, AttendanceSettings } from "@/app/page"
import {
  Camera,
  CameraOff,
  Users,
  UserCheck,
  Clock,
  AlertCircle,
  Play,
  Square,
  Zap,
  Target,
  Settings,
  Timer,
  Scan,
  Bell,
  CheckCircle2,
  Pause,
} from "lucide-react"
import { FaceRecognitionEngine } from "@/lib/face-recognition"

interface TakeAttendanceProps {
  user: User
  students: Student[]
  attendance: AttendanceRecord[]
  settings: AttendanceSettings
  onAttendanceChange: (attendance: AttendanceRecord[]) => void
}

interface DetectedFace {
  studentId: number
  confidence: number
  boundingBox: { x: number; y: number; width: number; height: number }
}

interface AutoAttendanceSession {
  id: string
  startTime: Date
  endTime?: Date
  class: string
  totalDetections: number
  markedStudents: Set<number>
  isActive: boolean
}

export function TakeAttendance({ user, students, attendance, settings, onAttendanceChange }: TakeAttendanceProps) {
  const { toast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [selectedClass, setSelectedClass] = useState("")
  const [recognitionEngine] = useState(() => new FaceRecognitionEngine())
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([])
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [recognitionStats, setRecognitionStats] = useState({
    totalScanned: 0,
    recognized: 0,
    marked: 0,
  })
  const [autoAttendanceMode, setAutoAttendanceMode] = useState(false)
  const [groupAttendanceMode, setGroupAttendanceMode] = useState(false)

  const [currentSession, setCurrentSession] = useState<AutoAttendanceSession | null>(null)
  const [realTimeScanning, setRealTimeScanning] = useState(false)
  const [scanInterval, setScanInterval] = useState(2000) // 2 seconds default
  const [autoMarkThreshold, setAutoMarkThreshold] = useState(90) // 90% confidence
  const [sessionDuration, setSessionDuration] = useState(30) // 30 minutes default
  const [recentNotifications, setRecentNotifications] = useState<
    Array<{
      id: string
      message: string
      type: "success" | "warning" | "info"
      timestamp: Date
    }>
  >([])
  const [pausedSession, setPausedSession] = useState(false)

  const classes = [...new Set(students.map((s) => s.class))]
  const today = new Date().toISOString().split("T")[0]
  const todayAttendance = attendance.filter((record) => record.date === today && record.class === selectedClass)

  useEffect(() => {
    return () => {
      stopCamera()
      endAutoAttendanceSession()
    }
  }, [])

  useEffect(() => {
    let scanTimer: NodeJS.Timeout

    if (realTimeScanning && currentSession?.isActive && !pausedSession) {
      scanTimer = setInterval(async () => {
        if (videoRef.current && canvasRef.current && isRecognizing) {
          await performRealTimeScan()
        }
      }, scanInterval)
    }

    return () => {
      if (scanTimer) clearInterval(scanTimer)
    }
  }, [realTimeScanning, currentSession, pausedSession, scanInterval, isRecognizing])

  useEffect(() => {
    let sessionTimer: NodeJS.Timeout

    if (currentSession?.isActive && sessionDuration > 0) {
      const remainingTime = sessionDuration * 60 * 1000 // Convert to milliseconds
      sessionTimer = setTimeout(() => {
        endAutoAttendanceSession()
        addNotification("Session ended automatically after " + sessionDuration + " minutes", "info")
      }, remainingTime)
    }

    return () => {
      if (sessionTimer) clearTimeout(sessionTimer)
    }
  }, [currentSession, sessionDuration])

  const addNotification = (message: string, type: "success" | "warning" | "info") => {
    const notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date(),
    }
    setRecentNotifications((prev) => [notification, ...prev.slice(0, 4)]) // Keep last 5 notifications

    // Auto remove after 5 seconds
    setTimeout(() => {
      setRecentNotifications((prev) => prev.filter((n) => n.id !== notification.id))
    }, 5000)
  }

  const performRealTimeScan = async () => {
    try {
      const detections = await recognitionEngine.detectFaces(videoRef.current!, canvasRef.current!)
      setDetectedFaces(detections)

      setRecognitionStats((prev) => ({
        ...prev,
        totalScanned: prev.totalScanned + detections.length,
        recognized: prev.recognized + detections.filter((d) => d.confidence >= autoMarkThreshold).length,
      }))

      // Auto-mark attendance for high-confidence detections
      for (const detection of detections) {
        if (detection.confidence >= autoMarkThreshold && currentSession) {
          const student = students.find((s) => s.id === detection.studentId)
          if (student && !currentSession.markedStudents.has(detection.studentId)) {
            await markAttendanceAuto(detection.studentId, detection.confidence)
            currentSession.markedStudents.add(detection.studentId)
            currentSession.totalDetections++
          }
        }
      }
    } catch (error) {
      console.error("Real-time scan error:", error)
    }
  }

  const startAutoAttendanceSession = () => {
    if (!selectedClass) {
      toast({
        title: "Select Class",
        description: "Please select a class before starting auto attendance",
        variant: "destructive",
      })
      return
    }

    const session: AutoAttendanceSession = {
      id: Date.now().toString(),
      startTime: new Date(),
      class: selectedClass,
      totalDetections: 0,
      markedStudents: new Set(),
      isActive: true,
    }

    setCurrentSession(session)
    setRealTimeScanning(true)
    setAutoAttendanceMode(true)
    setGroupAttendanceMode(false)
    startRecognition()

    addNotification(`Auto attendance session started for ${selectedClass}`, "success")

    toast({
      title: "Auto Attendance Started",
      description: `Session active for ${selectedClass}. Students will be marked automatically.`,
    })
  }

  const pauseAutoAttendanceSession = () => {
    setPausedSession(!pausedSession)
    addNotification(pausedSession ? "Session resumed" : "Session paused", "info")
  }

  const endAutoAttendanceSession = () => {
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        endTime: new Date(),
        isActive: false,
      }

      setCurrentSession(null)
      setRealTimeScanning(false)
      setAutoAttendanceMode(false)
      setPausedSession(false)
      setIsRecognizing(false)

      const duration = Math.round((updatedSession.endTime!.getTime() - updatedSession.startTime.getTime()) / 1000 / 60)
      addNotification(
        `Session ended. ${updatedSession.markedStudents.size} students marked in ${duration} minutes`,
        "success",
      )

      toast({
        title: "Session Completed",
        description: `Marked ${updatedSession.markedStudents.size} students in ${duration} minutes`,
      })
    }
  }

  const startCamera = async () => {
    try {
      setIsLoading(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsCameraActive(true)

        // Initialize face recognition
        await recognitionEngine.initialize()

        // Load student face data
        const studentsWithPhotos = students.filter((s) => s.photo)
        await recognitionEngine.loadStudentFaces(studentsWithPhotos)

        toast({
          title: "Camera Started",
          description: "Face recognition system is now active",
        })
      }
    } catch (error) {
      console.error("Camera error:", error)
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
    setIsRecognizing(false)
    setAutoAttendanceMode(false)
    setGroupAttendanceMode(false)
    setRealTimeScanning(false)
    setDetectedFaces([])
    endAutoAttendanceSession()
  }

  const startRecognition = async () => {
    if (!selectedClass) {
      toast({
        title: "Select Class",
        description: "Please select a class before starting recognition",
        variant: "destructive",
      })
      return
    }

    setIsRecognizing(true)
    if (!realTimeScanning) {
      recognizeLoop()
    }
  }

  const recognizeLoop = async () => {
    if (!isRecognizing || !videoRef.current || !canvasRef.current || realTimeScanning) return

    try {
      const detections = await recognitionEngine.detectFaces(videoRef.current, canvasRef.current)
      setDetectedFaces(detections)

      setRecognitionStats((prev) => ({
        ...prev,
        totalScanned: prev.totalScanned + detections.length,
        recognized: prev.recognized + detections.filter((d) => d.confidence >= settings.confidenceThreshold).length,
      }))

      // Auto-mark attendance if in auto mode
      if (autoAttendanceMode && !realTimeScanning) {
        for (const detection of detections) {
          if (detection.confidence >= settings.confidenceThreshold) {
            await markAttendance(detection.studentId, "Face Recognition")
          }
        }
      }

      // Continue recognition loop
      if (isRecognizing && !realTimeScanning) {
        setTimeout(recognizeLoop, 1000) // Recognize every second
      }
    } catch (error) {
      console.error("Recognition error:", error)
    }
  }

  const markAttendance = async (studentId: number, method: string) => {
    const student = students.find((s) => s.id === studentId)
    if (!student) return

    // Check if already marked today
    const existingRecord = attendance.find(
      (record) => record.studentId === studentId && record.date === today && record.class === selectedClass,
    )

    if (existingRecord) {
      toast({
        title: "Already Marked",
        description: `${student.name} is already marked ${existingRecord.status} for today`,
        variant: "destructive",
      })
      return
    }

    const currentTime = new Date()
    const timeString = currentTime.toTimeString().split(" ")[0]
    const isLate =
      currentTime.getHours() > 9 || (currentTime.getHours() === 9 && currentTime.getMinutes() > settings.lateThreshold)

    const newRecord: AttendanceRecord = {
      id: Date.now(),
      studentId,
      studentName: student.name,
      rollNumber: student.rollNumber,
      class: selectedClass,
      department: student.department,
      date: today,
      time: timeString,
      status: isLate ? "Late" : "Present",
      method: method as any,
      confidence: detectedFaces.find((f) => f.studentId === studentId)?.confidence.toFixed(1) + "%" || "N/A",
    }

    onAttendanceChange([...attendance, newRecord])
    setRecognitionStats((prev) => ({ ...prev, marked: prev.marked + 1 }))

    toast({
      title: "Attendance Marked",
      description: `${student.name} marked as ${newRecord.status}`,
    })
  }

  const markAttendanceAuto = async (studentId: number, confidence: number) => {
    const student = students.find((s) => s.id === studentId)
    if (!student) return

    // Check if already marked today
    const existingRecord = attendance.find(
      (record) => record.studentId === studentId && record.date === today && record.class === selectedClass,
    )

    if (existingRecord) return // Silently skip if already marked

    const currentTime = new Date()
    const timeString = currentTime.toTimeString().split(" ")[0]
    const isLate =
      currentTime.getHours() > 9 || (currentTime.getHours() === 9 && currentTime.getMinutes() > settings.lateThreshold)

    const newRecord: AttendanceRecord = {
      id: Date.now(),
      studentId,
      studentName: student.name,
      rollNumber: student.rollNumber,
      class: selectedClass,
      department: student.department,
      date: today,
      time: timeString,
      status: isLate ? "Late" : "Present",
      method: "Auto Recognition" as any,
      confidence: confidence.toFixed(1) + "%",
    }

    onAttendanceChange([...attendance, newRecord])
    setRecognitionStats((prev) => ({ ...prev, marked: prev.marked + 1 }))

    addNotification(`${student.name} marked ${newRecord.status} (${confidence.toFixed(1)}%)`, "success")
  }

  const startGroupAttendance = () => {
    setGroupAttendanceMode(true)
    setAutoAttendanceMode(false)
    setRealTimeScanning(false)
    startRecognition()

    toast({
      title: "Group Attendance Started",
      description: "Detecting multiple faces simultaneously",
    })
  }

  const startAutoAttendance = () => {
    setAutoAttendanceMode(true)
    setGroupAttendanceMode(false)
    setRealTimeScanning(false)
    startRecognition()

    toast({
      title: "Auto Attendance Started",
      description: "Automatically marking attendance for recognized faces",
    })
  }

  const captureGroupAttendance = async () => {
    if (detectedFaces.length === 0) {
      toast({
        title: "No Faces Detected",
        description: "Please ensure students are visible in the camera",
        variant: "destructive",
      })
      return
    }

    const validDetections = detectedFaces.filter((face) => face.confidence >= settings.confidenceThreshold)

    for (const detection of validDetections) {
      await markAttendance(detection.studentId, "Group Attendance")
    }

    toast({
      title: "Group Attendance Captured",
      description: `Marked attendance for ${validDetections.length} students`,
    })
  }

  const getSessionDuration = () => {
    if (!currentSession) return "00:00"
    const now = pausedSession ? currentSession.startTime : new Date()
    const duration = Math.floor((now.getTime() - currentSession.startTime.getTime()) / 1000)
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Take Attendance</h1>
        <p className="text-muted-foreground text-pretty">
          Use advanced face recognition with real-time scanning and auto attendance to mark student attendance
        </p>
      </div>

      {recentNotifications.length > 0 && (
        <div className="space-y-2">
          {recentNotifications.map((notification) => (
            <Alert
              key={notification.id}
              className={`border-l-4 ${
                notification.type === "success"
                  ? "border-l-green-500 bg-green-50 dark:bg-green-950"
                  : notification.type === "warning"
                    ? "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950"
                    : "border-l-blue-500 bg-blue-50 dark:bg-blue-950"
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                {notification.type === "warning" && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                {notification.type === "info" && <Bell className="h-4 w-4 text-blue-600" />}
                <AlertDescription className="flex-1">{notification.message}</AlertDescription>
                <span className="text-xs text-muted-foreground">{notification.timestamp.toLocaleTimeString()}</span>
              </div>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Face Recognition Camera
                {currentSession?.isActive && (
                  <Badge variant="default" className="ml-auto">
                    <Timer className="h-3 w-3 mr-1" />
                    {getSessionDuration()}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Advanced AI-powered face detection with real-time scanning capabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Class Selection */}
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Select Class</label>
                  <Select value={selectedClass} onValueChange={setSelectedClass} disabled={currentSession?.isActive}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {cls}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Camera View */}
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                {isCameraActive ? (
                  <>
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full"
                      style={{ pointerEvents: "none" }}
                    />

                    {/* Face Detection Overlays */}
                    {detectedFaces.map((face, index) => {
                      const student = students.find((s) => s.id === face.studentId)
                      const isValidConfidence =
                        face.confidence >= (realTimeScanning ? autoMarkThreshold : settings.confidenceThreshold)

                      return (
                        <div
                          key={index}
                          className={`absolute border-2 rounded-lg ${
                            isValidConfidence
                              ? "border-green-500 bg-green-500/10"
                              : "border-yellow-500 bg-yellow-500/10"
                          }`}
                          style={{
                            left: `${face.boundingBox.x}%`,
                            top: `${face.boundingBox.y}%`,
                            width: `${face.boundingBox.width}%`,
                            height: `${face.boundingBox.height}%`,
                          }}
                        >
                          <div className="absolute -top-8 left-0 bg-black/80 text-white px-2 py-1 rounded text-xs">
                            {student?.name || "Unknown"} ({face.confidence.toFixed(1)}%)
                          </div>
                        </div>
                      )
                    })}

                    {/* Status Indicators */}
                    <div className="absolute top-4 left-4 space-y-2">
                      {currentSession?.isActive && (
                        <div className="bg-black/80 text-white px-3 py-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-2 w-2 rounded-full ${pausedSession ? "bg-yellow-500" : "bg-red-500 animate-pulse"}`}
                            />
                            {pausedSession ? "Session Paused" : "Auto Session Active"}
                          </div>
                        </div>
                      )}

                      {realTimeScanning && (
                        <div className="bg-black/80 text-white px-3 py-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Scan className="h-3 w-3 animate-spin" />
                            Real-time Scanning
                          </div>
                        </div>
                      )}

                      {isRecognizing && !realTimeScanning && (
                        <div className="bg-black/80 text-white px-3 py-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                            {autoAttendanceMode
                              ? "Auto Attendance"
                              : groupAttendanceMode
                                ? "Group Detection"
                                : "Recognition Active"}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Camera className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium">Camera Not Active</p>
                    <p className="text-sm">Click "Start Camera" to begin face recognition</p>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex flex-wrap gap-2">
                {!isCameraActive ? (
                  <Button onClick={startCamera} disabled={isLoading} className="flex-1 sm:flex-none">
                    <Camera className="h-4 w-4 mr-2" />
                    {isLoading ? "Starting..." : "Start Camera"}
                  </Button>
                ) : (
                  <>
                    <Button onClick={stopCamera} variant="destructive" className="flex-1 sm:flex-none">
                      <CameraOff className="h-4 w-4 mr-2" />
                      Stop Camera
                    </Button>

                    {!currentSession?.isActive ? (
                      <>
                        {!isRecognizing ? (
                          <>
                            <Button
                              onClick={startAutoAttendanceSession}
                              disabled={!selectedClass}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            >
                              <Zap className="h-4 w-4 mr-2" />
                              Start Auto Session
                            </Button>
                            <Button onClick={startRecognition} disabled={!selectedClass} variant="secondary">
                              <Play className="h-4 w-4 mr-2" />
                              Manual Recognition
                            </Button>
                            <Button onClick={startGroupAttendance} disabled={!selectedClass} variant="secondary">
                              <Users className="h-4 w-4 mr-2" />
                              Group Attendance
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button onClick={() => setIsRecognizing(false)} variant="secondary">
                              <Square className="h-4 w-4 mr-2" />
                              Stop Recognition
                            </Button>

                            {groupAttendanceMode && detectedFaces.length > 0 && (
                              <Button onClick={captureGroupAttendance} variant="default">
                                <Target className="h-4 w-4 mr-2" />
                                Capture Group (
                                {detectedFaces.filter((f) => f.confidence >= settings.confidenceThreshold).length})
                              </Button>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <Button onClick={pauseAutoAttendanceSession} variant="secondary">
                          {pausedSession ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                          {pausedSession ? "Resume" : "Pause"} Session
                        </Button>
                        <Button onClick={endAutoAttendanceSession} variant="destructive">
                          <Square className="h-4 w-4 mr-2" />
                          End Session
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Recognition Stats */}
              {(isRecognizing || currentSession?.isActive) && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{recognitionStats.totalScanned}</div>
                    <div className="text-sm text-muted-foreground">Faces Scanned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{recognitionStats.recognized}</div>
                    <div className="text-sm text-muted-foreground">Recognized</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{recognitionStats.marked}</div>
                    <div className="text-sm text-muted-foreground">Marked Present</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Auto Attendance Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Scan Interval</label>
                <div className="space-y-2">
                  <Slider
                    value={[scanInterval]}
                    onValueChange={(value) => setScanInterval(value[0])}
                    min={1000}
                    max={10000}
                    step={500}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground text-center">{scanInterval / 1000}s between scans</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Auto Mark Threshold</label>
                <div className="space-y-2">
                  <Slider
                    value={[autoMarkThreshold]}
                    onValueChange={(value) => setAutoMarkThreshold(value[0])}
                    min={70}
                    max={99}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground text-center">
                    {autoMarkThreshold}% confidence required
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Session Duration</label>
                <div className="space-y-2">
                  <Slider
                    value={[sessionDuration]}
                    onValueChange={(value) => setSessionDuration(value[0])}
                    min={5}
                    max={120}
                    step={5}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground text-center">{sessionDuration} minutes max</div>
                </div>
              </div>

              {currentSession?.isActive && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Session Active</div>
                  <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    {currentSession.markedStudents.size} students marked
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    {currentSession.totalDetections} total detections
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recognition Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Recognition Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {detectedFaces.length > 0 ? (
                <div className="space-y-3">
                  {detectedFaces.map((face, index) => {
                    const student = students.find((s) => s.id === face.studentId)
                    const isValid =
                      face.confidence >= (realTimeScanning ? autoMarkThreshold : settings.confidenceThreshold)
                    const isMarked = currentSession?.markedStudents.has(face.studentId)

                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <div className="font-medium">{student?.name || "Unknown"}</div>
                          <div className="text-sm text-muted-foreground">{student?.rollNumber}</div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Badge variant={isValid ? "default" : "secondary"}>{face.confidence.toFixed(1)}%</Badge>
                            {isMarked && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {isMarked ? "Marked" : isValid ? "Valid" : "Low Confidence"}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No faces detected</p>
                  <p className="text-sm">Position students in front of camera</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Attendance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Attendance
                <Badge variant="secondary">{todayAttendance.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayAttendance.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {todayAttendance
                    .sort(
                      (a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime(),
                    )
                    .reverse()
                    .map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <div className="font-medium text-sm">{record.studentName}</div>
                          <div className="text-xs text-muted-foreground">{record.rollNumber}</div>
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
                          <div className="text-xs text-muted-foreground">{record.time}</div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No attendance marked yet</p>
                  <p className="text-sm">Start recognition to mark attendance</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1 text-sm">
                <div>Confidence Threshold: {settings.confidenceThreshold}%</div>
                <div>Late Threshold: {settings.lateThreshold} minutes</div>
                <div>Recognition Model: {settings.recognitionModel}</div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}
