-- CreateTable
CREATE TABLE "ResourceContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceId" TEXT NOT NULL,
    "extractedText" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResourceContent_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResourceMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceId" TEXT NOT NULL,
    "abstract" TEXT,
    "keywords" TEXT,
    "journal" TEXT,
    "conference" TEXT,
    "publisher" TEXT,
    "publicationYear" INTEGER,
    "doi" TEXT,
    "isbn" TEXT,
    "arxivId" TEXT,
    "pmid" TEXT,
    "canonicalUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResourceMetadata_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ResourceContent_resourceId_key" ON "ResourceContent"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceMetadata_resourceId_key" ON "ResourceMetadata"("resourceId");
