-- AlterTable
ALTER TABLE "approvals" ADD COLUMN     "is_approved" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "approved_at" SET DATA TYPE TIMESTAMP(6);
