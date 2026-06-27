import { ResourceForm } from "@/components/resource-form";

export default function NewResourcePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Resource</h1>
        <p className="text-muted-foreground">
          Add a new file, URL, or note to your workspace.
        </p>
      </div>
      <ResourceForm />
    </div>
  );
}
