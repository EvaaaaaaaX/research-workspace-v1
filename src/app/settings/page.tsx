import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Database, Folder, Shield, HardDrive } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your workspace configuration and data.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Workspace Data</CardTitle>
            </div>
            <CardDescription>
              Information about your local data storage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 text-sm">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Database Location:</span>
              </div>
              <code className="bg-muted px-2 py-1 rounded text-xs">
                workspace-data/dev.db
              </code>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 text-sm">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">File Storage:</span>
              </div>
              <code className="bg-muted px-2 py-1 rounded text-xs">
                workspace-data/files/originals/
              </code>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Privacy & Security</CardTitle>
            </div>
            <CardDescription>
              Research Workspace V1 is local-first. Your data stays on your machine.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              All resources, notes, and metadata are stored in a local SQLite
              database. No data is uploaded to any cloud service in V1.
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Advanced</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export or reset your workspace data.
            </p>
            <div className="flex gap-4">
              <button className="text-sm font-medium text-primary hover:underline">
                Export Data (JSON)
              </button>
              <button className="text-sm font-medium text-destructive hover:underline">
                Reset Workspace
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
