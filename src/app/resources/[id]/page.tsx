import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  StickyNote,
  Tag as TagIcon,
  User,
  Globe,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TagManager } from "@/components/tag-manager";
import { DeleteResourceButton } from "@/components/delete-resource-button";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resource = await prisma.resource.findUnique({
    where: { id, deletedAt: null },
    include: {
      fileAsset: true,
      urlMetadata: true,
      note: true,
      content: true,
      metadataStructured: true,
      tags: { include: { tag: true } },
      collections: { include: { collection: true } },
    },
  });

  if (!resource) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/resources">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{resource.title}</h1>
      </div>

      {/* Detail View */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {resource.metadataStructured && (
                <div className="mb-6 grid grid-cols-2 gap-4 text-sm border-b pb-6">
                  {resource.metadataStructured.journal && (
                    <div>
                      <span className="text-muted-foreground">Journal:</span>
                      <p className="font-medium">{resource.metadataStructured.journal}</p>
                    </div>
                  )}
                  {resource.metadataStructured.publisher && (
                    <div>
                      <span className="text-muted-foreground">Publisher:</span>
                      <p className="font-medium">{resource.metadataStructured.publisher}</p>
                    </div>
                  )}
                  {resource.metadataStructured.publicationYear && (
                    <div>
                      <span className="text-muted-foreground">Year:</span>
                      <p className="font-medium">{resource.metadataStructured.publicationYear}</p>
                    </div>
                  )}
                  {resource.metadataStructured.doi && (
                    <div>
                      <span className="text-muted-foreground">DOI:</span>
                      <p className="font-medium break-all">{resource.metadataStructured.doi}</p>
                    </div>
                  )}
                  {resource.metadataStructured.arxivId && (
                    <div>
                      <span className="text-muted-foreground">ArXiv:</span>
                      <p className="font-medium">{resource.metadataStructured.arxivId}</p>
                    </div>
                  )}
                </div>
              )}

              {resource.type === "NOTE" && resource.note ? (
                <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                  {resource.note.body}
                </div>
              ) : resource.type === "FILE" && resource.fileAsset ? (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">
                    {resource.fileAsset.originalFileName}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {(resource.fileAsset.fileSize / 1024 / 1024).toFixed(2)} MB •{" "}
                    {resource.fileAsset.extension.toUpperCase()}
                  </p>
                  <Button variant="outline">Download File</Button>
                </div>
              ) : resource.type === "URL" && resource.url ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Globe className="h-4 w-4" />
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline break-all"
                    >
                      {resource.url}
                    </a>
                    <ExternalLink className="h-4 w-4" />
                  </div>
                  {resource.description && (
                    <p className="text-muted-foreground">{resource.description}</p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No preview available.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {resource.description || "No description provided."}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Authors:</span>
                <span className="text-muted-foreground">
                  {resource.authors || "Unknown"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Source:</span>
                <span className="text-muted-foreground">
                  {resource.source || "Unknown"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Created:</span>
                <span className="text-muted-foreground">
                  {resource.createdAt.toLocaleDateString()}
                </span>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <TagIcon className="h-4 w-4" />
                  Tags
                </div>
                <TagManager resourceId={resource.id} tags={resource.tags} />
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Layers className="h-4 w-4" />
                  Collections
                </div>
                <div className="flex flex-wrap gap-2">
                  {resource.collections.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      Not in any collection.
                    </span>
                  ) : (
                    resource.collections.map((rc) => (
                      <Badge key={rc.collection.id} variant="outline">
                        {rc.collection.name}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button variant="default" className="w-full" asChild>
              <Link href={`/resources/${resource.id}/edit`}>
                Edit Resource
              </Link>
            </Button>
            <DeleteResourceButton resourceId={resource.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
