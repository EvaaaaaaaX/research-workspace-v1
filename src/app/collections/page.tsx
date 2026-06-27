import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus, Layers, MoreVertical } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default async function CollectionsPage() {
  const collections = await prisma.collection.findMany({
    include: {
      _count: {
        select: {
          resources: {
            where: {
              resource: { deletedAt: null },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
          <p className="text-muted-foreground">
            Organize your research into projects or topics.
          </p>
        </div>
        <Button asChild>
          <Link href="/collections/new">
            <Plus className="mr-2 h-4 w-4" />
            New Collection
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {collections.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex h-[200px] flex-col items-center justify-center space-y-2">
              <p className="text-muted-foreground">No collections yet.</p>
              <Button variant="link" asChild>
                <Link href="/collections/new">Create your first collection</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          collections.map((collection) => (
            <Card key={collection.id} className="group relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">
                      <Link
                        href={`/collections/${collection.id}`}
                        className="hover:underline"
                      >
                        {collection.name}
                      </Link>
                    </CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="line-clamp-2">
                  {collection.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {collection._count.resources} resources
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
