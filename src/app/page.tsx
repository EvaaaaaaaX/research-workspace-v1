import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { FileText, Layers, Hash, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const stats = await prisma.$transaction([
    prisma.resource.count({ where: { deletedAt: null } }),
    prisma.resource.count({ where: { deletedAt: null, type: "FILE" } }),
    prisma.resource.count({ where: { deletedAt: null, type: "URL" } }),
    prisma.resource.count({ where: { deletedAt: null, type: "NOTE" } }),
    prisma.collection.count(),
    prisma.tag.count(),
  ]);

  const [
    totalResources,
    fileCount,
    urlCount,
    noteCount,
    collectionCount,
    tagCount,
  ] = stats;

  const recentResources = await prisma.resource.findMany({
    where: { deletedAt: null },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      tags: { include: { tag: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your Research Workspace.
          </p>
        </div>
        <Button asChild>
          <Link href="/resources/new">
            <Plus className="mr-2 h-4 w-4" />
            New Resource
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResources}</div>
            <p className="text-xs text-muted-foreground">
              {fileCount} Files, {urlCount} URLs, {noteCount} Notes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collectionCount}</div>
            <p className="text-xs text-muted-foreground">Active projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tags</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tagCount}</div>
            <p className="text-xs text-muted-foreground">Unique descriptors</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentResources.length === 0 ? (
                <p className="text-sm text-muted-foreground">No resources yet.</p>
              ) : (
                recentResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between space-x-4 rounded-md border p-4"
                  >
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {resource.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {resource.type} • {resource.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/resources/${resource.id}`}>View</Link>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/resources/new?type=FILE">Upload File</Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/resources/new?type=URL">Add URL</Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/resources/new?type=NOTE">Create Note</Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/collections/new">New Collection</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
