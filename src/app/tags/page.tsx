import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Hash, MoreVertical, Search } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: { resources: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
          <p className="text-muted-foreground">
            Explore and manage tags across your resources.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search tags..." className="pl-9" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tags.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex h-[200px] flex-col items-center justify-center space-y-2">
              <p className="text-muted-foreground">No tags found.</p>
            </CardContent>
          </Card>
        ) : (
          tags.map((tag) => (
            <Card key={tag.id} className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                    <CardTitle className="text-base truncate">
                      {tag.name}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {tag._count.resources}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
