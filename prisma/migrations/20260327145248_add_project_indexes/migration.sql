-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "intervalRSS" INTEGER NOT NULL DEFAULT 30,
    "intervalAPI" INTEGER NOT NULL DEFAULT 30,
    "intervalScraping" INTEGER NOT NULL DEFAULT 180,
    "activeWorkana" BOOLEAN NOT NULL DEFAULT true,
    "activeFreelancer" BOOLEAN NOT NULL DEFAULT true,
    "active99Freelas" BOOLEAN NOT NULL DEFAULT true,
    "activeIndeed" BOOLEAN NOT NULL DEFAULT false,
    "activeSoyFreelancer" BOOLEAN NOT NULL DEFAULT false,
    "activeUpwork" BOOLEAN NOT NULL DEFAULT false,
    "followUpDays" INTEGER NOT NULL DEFAULT 3,
    "scoreAlertThreshold" INTEGER NOT NULL DEFAULT 70,
    "anthropicKey" TEXT,
    "freelancerToken" TEXT,
    "profileSkills" TEXT,
    "profileTitles" TEXT
);
INSERT INTO "new_Settings" ("active99Freelas", "activeFreelancer", "activeIndeed", "activeSoyFreelancer", "activeUpwork", "activeWorkana", "anthropicKey", "followUpDays", "freelancerToken", "id", "intervalAPI", "intervalRSS", "intervalScraping", "profileSkills", "profileTitles", "scoreAlertThreshold") SELECT "active99Freelas", "activeFreelancer", "activeIndeed", "activeSoyFreelancer", "activeUpwork", "activeWorkana", "anthropicKey", "followUpDays", "freelancerToken", "id", "intervalAPI", "intervalRSS", "intervalScraping", "profileSkills", "profileTitles", "scoreAlertThreshold" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Project_matchScore_idx" ON "Project"("matchScore");

-- CreateIndex
CREATE INDEX "Project_collectedAt_idx" ON "Project"("collectedAt");

-- CreateIndex
CREATE INDEX "Project_platform_idx" ON "Project"("platform");

-- CreateIndex
CREATE INDEX "Project_isFavorite_idx" ON "Project"("isFavorite");

-- CreateIndex
CREATE INDEX "Project_isDiscarded_idx" ON "Project"("isDiscarded");

-- CreateIndex
CREATE INDEX "Project_proposalStatus_idx" ON "Project"("proposalStatus");
