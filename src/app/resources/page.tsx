import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResourceDeleteButton } from "@/components/resource-delete-button";

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type: resourceType } = await searchParams;
  const query = q || "";
  const type = resourceType || "";

  const resources = await prisma.resource.findMany({
    where: {
      deletedAt: null,
      AND: [
        query ? {
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
          ],
        } : {},
        type ? { type } : {},
      ],
    },
    include: {
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
          <p className="text-muted-foreground">
            Manage and explore your research materials.
          </p>
        </div>
        <Button asChild>
          <Link href="/resources/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Resource
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            className="pl-9"
            defaultValue={query}
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      <div className="grid gap-4">
        {resources.length === 0 ? (
          <Card>
            <CardContent className="flex h-[200px] flex-col items-center justify-center space-y-2">
              <p className="text-muted-foreground">No resources found.</p>
              <Button variant="link" asChild>
                <Link href="/resources/new">Create your first resource</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          resources.map((resource) => (
            <Card key={resource.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="flex-1">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{resource.type}</Badge>
                        <CardTitle className="text-xl">
                          <Link
                            href={`/resources/${resource.id}`}
                            className="hover:underline"
                          >
                            {resource.title}
                          </Link>
                        </CardTitle>
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {resource.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {resource.tags.map((rt) => (
                        <Badge key={rt.tag.id} variant="outline">
                          #{rt.tag.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </div>
                <div className="flex items-center gap-2 border-t p-4 sm:border-l sm:border-t-0">
                  <Button variant="ghost" size="sm" asChild className="flex-1">
                    <Link href={`/resources/${resource.id}`}>Details</Link>
                  </Button>
                  <ResourceDeleteButton resourceId={resource.id} />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
