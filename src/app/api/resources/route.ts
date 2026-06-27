import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ResourceImportPipeline, PipelineContext } from "@/lib/import-pipeline";
import { generateTagsForResource } from "@/lib/tag-service";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isAnalyze = searchParams.get("analyze") === "true";

    const formData = await req.formData();
    const type = formData.get("type") as "FILE" | "URL" | "NOTE";
    const title = formData.get("title") as string || "";
    const description = formData.get("description") as string || "";
    const authors = formData.get("authors") as string || "";
    const source = formData.get("source") as string || "";
    const url = formData.get("url") as string || "";
    const content = formData.get("content") as string || "";
    const contentPreviewInput = formData.get("contentPreview") as string || "";
    const tagsStr = formData.get("tags") as string || "";

    // Parse tags
    let tagsInput: string[] = [];
    if (tagsStr) {
      try {
        tagsInput = JSON.parse(tagsStr);
      } catch {
        tagsInput = tagsStr.split(",").map(t => t.trim()).filter(Boolean);
      }
    }

    // Set up file context if provided
    let fileCtx: PipelineContext["file"] = undefined;
    if (type === "FILE") {
      const file = formData.get("file") as File;
      if (file) {
        const bytes = await file.arrayBuffer();
        fileCtx = {
          name: file.name,
          type: file.type,
          size: file.size,
          buffer: Buffer.from(bytes),
        };
      }
    }

    const context: PipelineContext = {
      type,
      title,
      description,
      authors,
      source,
      url,
      content,
      file: fileCtx,
      tagsInput,
      preview: contentPreviewInput,
    };

    if (isAnalyze) {
      const analysisResult = await ResourceImportPipeline.analyze(context);
      return NextResponse.json(analysisResult);
    }

    // Run unified import pipeline
    const pipeline = new ResourceImportPipeline(context);
    const savedResource = await pipeline.execute();

    return NextResponse.json(savedResource);
  } catch (error) {
    console.error("Error importing resource via pipeline:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Resource ID required" }, { status: 400 });
    }

    const data = await req.json();
    const { title, description, authors, source, url, content } = data;

    // Update basic resource fields
    await prisma.resource.update({
      where: { id },
      data: {
        title,
        description,
        authors,
        source,
        url,
        ...(data.type === "NOTE" ? { metadata: "{}" } : {}),
      },
    });

    // Update Note content if type is NOTE
    if (data.type === "NOTE" && content !== undefined) {
      await prisma.note.upsert({
        where: { resourceId: id },
        update: {
          body: content,
          wordCount: content ? content.split(/\s+/).length : 0,
        },
        create: {
          resourceId: id,
          body: content,
          wordCount: content ? content.split(/\s+/).length : 0,
        },
      });

      await prisma.resource.update({
        where: { id },
        data: {
          fullText: content,
          metadata: "{}",
        },
      });

      await prisma.resourceContent.upsert({
        where: { resourceId: id },
        update: { extractedText: content },
        create: {
          resourceId: id,
          extractedText: content,
        },
      });
    }

    // Re-generate tags after update
    await generateTagsForResource(id, true);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating resource:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Resource ID required" }, { status: 400 });
    }

    // Soft delete
    await prisma.resource.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting resource:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "";

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

    return NextResponse.json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
