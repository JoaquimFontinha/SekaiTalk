-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "poiId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameJp" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "backgroundImage" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "greetingMessage" TEXT NOT NULL,
    "isFriendable" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Character_poiId_key" ON "Character"("poiId");
