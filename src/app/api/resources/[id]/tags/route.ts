import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTagsForResource } from "@/lib/tag-service";

/**
 * Handle manual tag management (POST to add, DELETE to remove)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { tagName, action } = await req.json();

    if (action === "REGENERATE") {
      await generateTagsForResource(id, true);
      return NextResponse.json({ message: "Tags regenerated" });
    }

    if (!tagName) {
      return NextResponse.json({ error: "Tag name required" }, { status: 400 });
    }

    // 1. Find or create tag
    const tag = await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: {
        name: tagName,
        normalizedName: tagName.toLowerCase(),
        sourceType: "MANUAL",
      },
    });

    // 2. Link to resource as MANUAL
    await prisma.resourceTag.upsert({
      where: {
        resourceId_tagId: {
          resourceId: id,
          tagId: tag.id,
        },
      },
      update: {
        source: "MANUAL",
        removedByUserAt: null,
      },
      create: {
        resourceId: id,
        tagId: tag.id,
        source: "MANUAL",
      },
    });

    return NextResponse.json({ message: "Tag added" });
  } catch (error) {
    console.error("Error managing tags:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { tagId } = await req.json();

    if (!tagId) {
      return NextResponse.json({ error: "Tag ID required" }, { status: 400 });
    }

    // Just delete the relation
    await prisma.resourceTag.delete({
      where: {
        resourceId_tagId: {
          resourceId: id,
          tagId,
        },
      },
    });

    return NextResponse.json({ message: "Tag removed" });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
