import { prisma } from "./src/lib/prisma";
import { ResourceImportPipeline, PipelineContext } from "./src/lib/import-pipeline";
import * as fs from "fs";
import * as path from "path";

// Cleanup helper to keep DB and storage clean after tests
async function cleanupResource(resourceId: string) {
  try {
    // Cascade delete is active in schema.prisma, so deleting resource clears ResourceTag, FileAsset, Note, etc.
    const fileAsset = await prisma.fileAsset.findUnique({ where: { resourceId } });
    if (fileAsset) {
      const storagePath = path.join(process.cwd(), fileAsset.relativePath);
      if (fs.existsSync(storagePath)) {
        fs.unlinkSync(storagePath);
      }
    }
    
    await prisma.resource.delete({
      where: { id: resourceId }
    });
  } catch (err) {
    console.error("Cleanup error for resource ID:", resourceId, err);
  }
}

async function runPipelineTest() {
  console.log("==================================================");
  console.log("Starting Pipeline Integration Test");
  console.log("==================================================");

  const createdResourceIds: string[] = [];

  try {
    // ----------------------------------------------------
    // Scenario 1: Note Import (Academic content)
    // ----------------------------------------------------
    console.log("\n[Scenario 1] Importing Academic Note...");
    const noteContext: PipelineContext = {
      type: "NOTE",
      title: "Attention Is All You Need",
      content: `
      Abstract:
      The dominant sequence transduction models are based on complex recurrent or convolutional neural networks.
      We connect the encoder and decoder through an attention mechanism.
      Recurrent neural networks preclude parallelization.
      We present the Transformer, relying entirely on self-attention.
      `
    };

    const notePipeline = new ResourceImportPipeline(noteContext);
    const savedNote = await notePipeline.execute();
    createdResourceIds.push(savedNote.id);

    // Verify DB relations and automatically generated tags
    const dbNoteResource = await prisma.resource.findUnique({
      where: { id: savedNote.id },
      include: {
        tags: {
          include: { tag: true }
        }
      }
    });

    console.log("Successfully Imported Note into DB!");
    console.log("Generated Tags stored in DB:");
    console.table(dbNoteResource?.tags.map(rt => ({
      TagName: rt.tag.name,
      SourceType: rt.tag.sourceType,
      RelationSource: rt.source
    })));

    // ----------------------------------------------------
    // Scenario 2: Markdown File Import
    // ----------------------------------------------------
    console.log("\n[Scenario 2] Importing Markdown File...");
    const mdContent = `
    # Drone Navigation System
    This document outlines how real-time obstacle avoidance algorithms work.
    We deploy reinforcement learning inside drones to navigate obstacles.
    `;
    const mdBuffer = Buffer.from(mdContent, "utf-8");

    const mdContext: PipelineContext = {
      type: "FILE",
      title: "Drone Navigation Specification",
      file: {
        name: "drone-navigation.md",
        type: "text/markdown",
        size: mdBuffer.length,
        buffer: mdBuffer
      }
    };

    const mdPipeline = new ResourceImportPipeline(mdContext);
    const savedMd = await mdPipeline.execute();
    createdResourceIds.push(savedMd.id);

    const dbMdResource = await prisma.resource.findUnique({
      where: { id: savedMd.id },
      include: {
        tags: {
          include: { tag: true }
        }
      }
    });

    console.log("Successfully Imported Markdown File into DB!");
    console.log("Generated Tags stored in DB:");
    console.table(dbMdResource?.tags.map(rt => ({
      TagName: rt.tag.name,
      SourceType: rt.tag.sourceType,
      RelationSource: rt.source
    })));

    // ----------------------------------------------------
    // Scenario 3: Verify DOCX Text Extract -> Tag Pipeline compatibility
    // ----------------------------------------------------
    // Since generating a binary DOCX programmatically requires extra libraries,
    // we directly test pipeline's Tag stage with extracted DOCX content simulation.
    console.log("\n[Scenario 3] Simulating DOCX Pipeline Tag Generation...");
    const docxContext: PipelineContext = {
      type: "FILE",
      title: "Corporate Meeting Notes",
      file: {
        name: "notes.docx",
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size: 100,
        buffer: Buffer.alloc(0) // Empty buffer as we mock text
      }
    };

    const docxPipeline = new ResourceImportPipeline(docxContext);
    // Directly mock the extracted text state that Stage 2 produces
    (docxPipeline as any).ctx.extractedText = `
    This is an internal project report about our next-generation cloud server architectures.
    We review cloud databases, multi-region database replication, and system performance benchmarks.
    `;

    // Manually run tag generation stage
    await (docxPipeline as any).generateTags();
    console.log("Successfully Simulated DOCX tag generation pipeline!");
    console.log("Generated Tags:", (docxPipeline as any).ctx.tags);

  } catch (error) {
    console.error("Pipeline Integration Test Failed:", error);
  } finally {
    console.log("\n==================================================");
    console.log("Cleaning up database and files...");
    for (const id of createdResourceIds) {
      await cleanupResource(id);
    }
    console.log("Cleanup finished.");
    console.log("==================================================");
  }
}

runPipelineTest();
