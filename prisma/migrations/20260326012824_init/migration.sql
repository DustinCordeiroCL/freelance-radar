-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "budget" TEXT,
    "category" TEXT,
    "tags" TEXT,
    "country" TEXT,
    "postedAt" DATETIME,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isDiscarded" BOOLEAN NOT NULL DEFAULT false,
    "matchScore" INTEGER,
    "scoreReason" TEXT,
    "proposalStatus" TEXT,
    "proposalValue" REAL,
    "proposalText" TEXT,
    "statusUpdatedAt" DATETIME,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "intervalRSS" INTEGER NOT NULL DEFAULT 30,
    "intervalAPI" INTEGER NOT NULL DEFAULT 30,
    "intervalScraping" INTEGER NOT NULL DEFAULT 180,
    "activeWorkana" BOOLEAN NOT NULL DEFAULT true,
    "activeFreelancer" BOOLEAN NOT NULL DEFAULT true,
    "active99Freelas" BOOLEAN NOT NULL DEFAULT true,
    "activeIndeed" BOOLEAN NOT NULL DEFAULT false,
    "followUpDays" INTEGER NOT NULL DEFAULT 3
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_platform_externalId_key" ON "Project"("platform", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationLog_projectId_key" ON "NotificationLog"("projectId");
