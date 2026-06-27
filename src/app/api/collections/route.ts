import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, description } = await req.json();

    const collection = await prisma.collection.create({
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(collection);
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const collections = await prisma.collection.findMany({
      include: {
        _count: {
          select: { resources: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(collections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
