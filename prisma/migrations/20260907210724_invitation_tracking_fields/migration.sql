-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "tableNo" TEXT,
ADD COLUMN     "viewedAt" TIMESTAMP(3);
