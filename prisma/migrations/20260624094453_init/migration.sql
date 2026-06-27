-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT,
    "source" TEXT,
    "url" TEXT,
    "description" TEXT,
    "contentPreview" TEXT,
    "metadata" TEXT,
    "userEditedFields" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceId" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "storedFileName" TEXT NOT NULL,
    "relativePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "checksum" TEXT,
    "extractedTextPath" TEXT,
    "extractionStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "extractionError" TEXT,
    CONSTRAINT "FileAsset_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UrlMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "siteName" TEXT,
    "fetchedTitle" TEXT,
    "fetchedDescription" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fetchStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "fetchErrorType" TEXT,
    CONSTRAINT "UrlMetadata_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "bodyFormat" TEXT NOT NULL DEFAULT 'MARKDOWN',
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Note_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "CollectionResource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "collectionId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CollectionResource_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollectionResource_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "color" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'AUTO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "ResourceTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "confidence" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedByUserAt" DATETIME,
    CONSTRAINT "ResourceTag_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ResourceTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TagGenerationRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tagName" TEXT NOT NULL,
    "normalizedTagName" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "matchFields" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "FileAsset_resourceId_key" ON "FileAsset"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "UrlMetadata_resourceId_key" ON "UrlMetadata"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Note_resourceId_key" ON "Note"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_name_key" ON "Collection"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionResource_collectionId_resourceId_key" ON "CollectionResource"("collectionId", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_normalizedName_key" ON "Tag"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceTag_resourceId_tagId_key" ON "ResourceTag"("resourceId", "tagId");
