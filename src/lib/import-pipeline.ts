import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { extractTagsFromText, generateSemanticAutoTags } from "@/lib/tag-service";
import {
  extractTextFromFile,
  extractContentFromUrl,
  extractMetadataFromText,
  generateSummary,
  getContentPreview,
} from "@/lib/content-extractor";

// Storage path definition
const STORAGE_PATH = path.join(process.cwd(), "originals");

export interface PipelineContext {
  type: "FILE" | "URL" | "NOTE";
  title?: string;
  description?: string;
  authors?: string;
  source?: string;
  url?: string;
  content?: string;
  file?: {
    name: string;
    type: string;
    size: number;
    buffer: Buffer;
  };
  tagsInput?: string[];
  
  // Running outputs
  resourceId?: string;
  extractedText?: string;
  preview?: string;
  summary?: string;
  tags?: string[];
  metadata?: any;
  
  // Embedding slot fields
  embeddingStatus?: string;
  embeddingVersion?: string;
  embeddedAt?: Date;
}

export class ResourceImportPipeline {
  private ctx: PipelineContext;

  constructor(ctx: PipelineContext) {
    this.ctx = { ...ctx };
  }

  /**
   * Only analyze and extract metadata/tags (dry-run, for API validation)
   */
  static async analyze(ctx: PipelineContext): Promise<any> {
    const pipeline = new ResourceImportPipeline(ctx);
    
    // 1. Text extraction
    await pipeline.extractText();
    
    // 2. Generate preview & summary
    await pipeline.generateMetadata();
    
    // 3. Generate tags
    await pipeline.generateTags();

    return {
      title: pipeline.ctx.title || "",
      description: pipeline.ctx.summary || "",
      contentPreview: pipeline.ctx.preview || "",
      tags: pipeline.ctx.tags || [],
      authors: pipeline.ctx.authors || "",
      source: pipeline.ctx.source || "",
    };
  }

  /**
   * Execute the full pipeline: create, extract, process and persist to database/disk
   */
  async execute(): Promise<any> {
    // Stage 1: Resource Creation
    await this.createBaseResource();

    // Stage 2: Text Extraction
    await this.extractText();

    // Stage 3: Metadata Generation (Preview & Summary)
    await this.generateMetadata();

    // Stage 4: Tag Generation
    await this.generateTags();

    // Stage 5: Persistence
    return await this.persist();
  }

  /**
   * Stage 1: Create base resource in DB to obtain resourceId
   */
  private async createBaseResource() {
    const { type, title, description, authors, source, url, content } = this.ctx;
    
    const resource = await prisma.resource.create({
      data: {
        type,
        title: title || (this.ctx.file ? this.ctx.file.name : ""),
        description,
        authors,
        source,
        url,
        ...(type === "NOTE" ? { 
          metadata: "{}",
          fullText: content || "",
        } : {}),
      },
    });

    this.ctx.resourceId = resource.id;
  }

  /**
   * Stage 2: Extract clean text from sources
   */
  private async extractText() {
    const { type, url, content, file } = this.ctx;

    if (type === "FILE" && file) {
      const extension = path.extname(file.name);
      this.ctx.extractedText = await extractTextFromFile(file.buffer, extension);
      
      // Extract structured metadata from text (e.g. DOI)
      this.ctx.metadata = extractMetadataFromText(this.ctx.extractedText);
    } else if (type === "URL" && url) {
      const urlData = await extractContentFromUrl(url);
      if (urlData) {
        this.ctx.extractedText = urlData.content || "";
        this.ctx.metadata = {
          fetchedTitle: urlData.title,
          fetchedDescription: urlData.description,
          siteName: urlData.siteName,
          canonicalUrl: urlData.canonicalUrl,
          abstract: urlData.description,
          journal: urlData.journal,
          publisher: urlData.publisher,
          publicationYear: urlData.publicationYear,
          doi: urlData.doi,
        };
        
        // Auto-fill metadata if missing
        if (!this.ctx.title) {
          this.ctx.title = urlData.title;
        }
        if (!this.ctx.authors && urlData.authors) {
          this.ctx.authors = urlData.authors;
        }
        if (!this.ctx.source && urlData.siteName) {
          this.ctx.source = urlData.siteName;
        }
      }
    } else if (type === "NOTE") {
      this.ctx.extractedText = content || "";
    }
  }

  /**
   * Stage 3: Generate Preview and Extractive Summary
   */
  private async generateMetadata() {
    const text = this.ctx.extractedText || "";
    
    if (!this.ctx.preview) {
      this.ctx.preview = getContentPreview(text, 300);
    }

    if (!this.ctx.summary) {
      this.ctx.summary = this.ctx.description || generateSummary(text);
    }
  }

  /**
   * Stage 4: Generate Keywords/Tags
   */
  private async generateTags() {
    if (this.ctx.tagsInput && this.ctx.tagsInput.length > 0) {
      this.ctx.tags = this.ctx.tagsInput;
      return;
    }

    const textForTags = this.ctx.extractedText || "";
    const titleForTags = this.ctx.title || (this.ctx.file ? this.ctx.file.name : "");
    const abstractForTags = this.ctx.metadata?.abstract || this.ctx.description || "";

    this.ctx.tags = await generateSemanticAutoTags(
      titleForTags,
      textForTags
    );
  }

  /**
   * Stage 5: Save assets to disk/db and finalize DB records
   */
  private async persist() {
    const resourceId = this.ctx.resourceId!;
    const { type, file, url, content, extractedText, preview, summary, tags, metadata } = this.ctx;

    // 1. Save specific source tables
    if (type === "FILE" && file) {
      const fileId = uuidv4();
      const extension = path.extname(file.name);
      const storedFileName = `${fileId}${extension}`;
      
      await mkdir(STORAGE_PATH, { recursive: true });
      const relativePath = path.join("originals", storedFileName);
      const absolutePath = path.join(STORAGE_PATH, storedFileName);

      await writeFile(absolutePath, file.buffer);

      await prisma.fileAsset.create({
        data: {
          resourceId,
          originalFileName: file.name,
          storedFileName,
          relativePath,
          mimeType: file.type,
          extension: extension.replace(".", ""),
          fileSize: file.size,
          extractionStatus: extractedText ? "SUCCESS" : "FAILED",
        },
      });

      if (metadata && Object.keys(metadata).length > 0) {
        await prisma.resourceMetadata.create({
          data: {
            resourceId,
            ...metadata,
          },
        });
      }
    } else if (type === "URL" && url) {
      if (extractedText) {
        await prisma.urlMetadata.create({
          data: {
            resourceId,
            originalUrl: url,
            normalizedUrl: url,
            fetchedTitle: metadata?.fetchedTitle || "",
            fetchedDescription: metadata?.fetchedDescription || "",
            siteName: metadata?.siteName || "",
            canonicalUrl: metadata?.canonicalUrl || "",
            fetchStatus: "SUCCESS",
          },
        });

        await prisma.resourceMetadata.create({
          data: {
            resourceId,
            abstract: metadata?.abstract,
            journal: metadata?.journal,
            publisher: metadata?.publisher,
            publicationYear: metadata?.publicationYear,
            doi: metadata?.doi,
            canonicalUrl: metadata?.canonicalUrl,
          },
        });
      } else {
        await prisma.urlMetadata.create({
          data: {
            resourceId,
            originalUrl: url,
            normalizedUrl: url,
            fetchStatus: "FAILED",
          },
        });
      }
    } else if (type === "NOTE") {
      await prisma.note.create({
        data: {
          resourceId,
          body: content || "",
          wordCount: content ? content.split(/\s+/).length : 0,
        },
      });
    }

    // 2. Save resource text content
    if (extractedText) {
      await prisma.resourceContent.create({
        data: {
          resourceId,
          extractedText,
        },
      });
    }

    // 3. Update Resource fields with final values
    const updateData: any = {
      contentPreview: preview || undefined,
      description: summary || undefined,
      title: this.ctx.title || undefined,
      // Embedding slot: default to NOT_GENERATED (future hook for vector generation)
      embeddingStatus: this.ctx.embeddingStatus || "NOT_GENERATED",
      embeddingVersion: this.ctx.embeddingVersion,
      embeddedAt: this.ctx.embeddedAt,
    };
    if (this.ctx.authors) updateData.authors = this.ctx.authors;
    if (this.ctx.source) updateData.source = this.ctx.source;

    const finalResource = await prisma.resource.update({
      where: { id: resourceId },
      data: updateData,
    });

    // 4. Save and relate tags
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        const tag = await prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: {
            name: tagName,
            normalizedName: tagName.toLowerCase(),
            sourceType: "MANUAL",
          },
        });

        await prisma.resourceTag.upsert({
          where: {
            resourceId_tagId: {
              resourceId,
              tagId: tag.id,
            },
          },
          update: {},
          create: {
            resourceId,
            tagId: tag.id,
            source: "MANUAL",
            confidence: 1.0,
          },
        });
      }
    }

    return finalResource;
  }
}
