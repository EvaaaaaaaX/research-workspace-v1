import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EditResourceForm } from "@/components/edit-resource-form";

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resource = await prisma.resource.findUnique({
    where: { id, deletedAt: null },
    include: {
      note: true,
    },
  });

  if (!resource) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/resources/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Resource</h1>
          <p className="text-muted-foreground">
            Update the details for your resource.
          </p>
        </div>
      </div>

      <EditResourceForm resource={resource} />
    </div>
  );
}
