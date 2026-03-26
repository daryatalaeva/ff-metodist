-- CreateTable
CREATE TABLE "Generation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "featureType" TEXT NOT NULL,
    "subject" TEXT,
    "grade" INTEGER,
    "topic" TEXT,
    "examFormat" TEXT,
    "questionTypes" TEXT[],
    "questionCount" INTEGER,
    "textbookName" TEXT,
    "textbookFileUrl" TEXT,
    "extraInstructions" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "resultJson" JSONB,
    "resultText" TEXT,
    "feedback" TEXT,
    "wasCopied" BOOLEAN NOT NULL DEFAULT false,
    "wasDownloaded" BOOLEAN NOT NULL DEFAULT false,
    "wasRegenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Generation_pkey" PRIMARY KEY ("id")
);
