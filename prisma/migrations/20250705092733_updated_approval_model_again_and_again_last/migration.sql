-- AlterTable
ALTER TABLE "approvals" ADD COLUMN     "comments" TEXT,
ALTER COLUMN "is_approved" DROP NOT NULL,
ALTER COLUMN "is_approved" DROP DEFAULT;
