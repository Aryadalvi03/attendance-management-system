"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import type { AttendanceSettings } from "@/app/page"
import { Save, RotateCcw, Shield, Bell, Camera, Users, Database } from "lucide-react"

interface SettingsPageProps {
  settings: AttendanceSettings
  onSettingsChange: (settings: AttendanceSettings) => void
}

export function SettingsPage({ settings, onSettingsChange }: SettingsPageProps) {
  const { toast } = useToast()
  const [localSettings, setLocalSettings] = useState<AttendanceSettings>(settings)
  const [hasChanges, setHasChanges] = useState(false)

  const updateSetting = <K extends keyof AttendanceSettings>(key: K, value: AttendanceSettings[K]) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const saveSettings = () => {
    onSettingsChange(localSettings)
    setHasChanges(false)
    toast({
      title: "Settings Saved",
      description: "All settings have been updated successfully",
    })
  }

  const resetToDefaults = () => {
    const defaultSettings: AttendanceSettings = {
      confidenceThreshold: 85,
      lateThreshold: 15,
      recognitionModel: "Advanced",
      autoMarkEnabled: true,
      notificationsEnabled: true,
      defaulterThreshold: 75,
    }
    setLocalSettings(defaultSettings)
    setHasChanges(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">System Settings</h1>
          <p className="text-muted-foreground text-pretty">Configure attendance system parameters and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={saveSettings} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="recognition" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recognition">Face Recognition</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Rules</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="recognition" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Face Recognition Settings
              </CardTitle>
              <CardDescription>Configure face detection and recognition parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Confidence Threshold: {localSettings.confidenceThreshold}%</Label>
                <Slider
                  value={[localSettings.confidenceThreshold]}
                  onValueChange={(value) => updateSetting("confidenceThreshold", value[0])}
                  min={50}
                  max={99}
                  step={1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Minimum confidence required for face recognition. Higher values reduce false positives.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recognition-model">Recognition Model</Label>
                <Select
                  value={localSettings.recognitionModel}
                  onValueChange={(value) => updateSetting("recognitionModel", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Basic">Basic (Fast, Lower Accuracy)</SelectItem>
                    <SelectItem value="Standard">Standard (Balanced)</SelectItem>
                    <SelectItem value="Advanced">Advanced (Slow, Higher Accuracy)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose the recognition model based on your accuracy and performance requirements.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Mark Attendance</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically mark attendance when face is recognized with sufficient confidence
                  </p>
                </div>
                <Switch
                  checked={localSettings.autoMarkEnabled}
                  onCheckedChange={(checked) => updateSetting("autoMarkEnabled", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Attendance Rules
              </CardTitle>
              <CardDescription>Configure attendance marking and defaulter identification rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Late Threshold: {localSettings.lateThreshold} minutes</Label>
                <Slider
                  value={[localSettings.lateThreshold]}
                  onValueChange={(value) => updateSetting("lateThreshold", value[0])}
                  min={0}
                  max={60}
                  step={5}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Students arriving after this time will be marked as late instead of present.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Defaulter Threshold: {localSettings.defaulterThreshold}%</Label>
                <Slider
                  value={[localSettings.defaulterThreshold]}
                  onValueChange={(value) => updateSetting("defaulterThreshold", value[0])}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Students with attendance below this percentage will be flagged as defaulters.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>Configure system notifications and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email and SMS notifications for attendance alerts and defaulter warnings
                  </p>
                </div>
                <Switch
                  checked={localSettings.notificationsEnabled}
                  onCheckedChange={(checked) => updateSetting("notificationsEnabled", checked)}
                />
              </div>

              {localSettings.notificationsEnabled && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium">Notification Preferences</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-template">Email Template</Label>
                      <Select defaultValue="standard">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard Template</SelectItem>
                          <SelectItem value="detailed">Detailed Template</SelectItem>
                          <SelectItem value="minimal">Minimal Template</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sms-template">SMS Template</Label>
                      <Select defaultValue="short">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Short Message</SelectItem>
                          <SelectItem value="detailed">Detailed Message</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input id="session-timeout" type="number" defaultValue="30" min="5" max="480" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                  <Input id="max-login-attempts" type="number" defaultValue="3" min="1" max="10" />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Two-Factor Authentication</Label>
                  <Switch defaultChecked={false} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="data-retention">Data Retention (months)</Label>
                  <Input id="data-retention" type="number" defaultValue="12" min="1" max="60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup-frequency">Backup Frequency</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" className="w-full bg-transparent">
                  <Database className="h-4 w-4 mr-2" />
                  Export All Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {hasChanges && (
        <div className="fixed bottom-4 right-4 p-4 bg-background border rounded-lg shadow-lg">
          <p className="text-sm text-muted-foreground mb-2">You have unsaved changes</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={saveSettings}>
              Save Changes
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setLocalSettings(settings)
                setHasChanges(false)
              }}
            >
              Discard
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
