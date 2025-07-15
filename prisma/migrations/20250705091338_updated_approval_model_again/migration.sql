/*
  Warnings:

  - The primary key for the `approvals` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The required column `id` was added to the `approvals` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "approvals" DROP CONSTRAINT "approvals_approver_id_fkey";

-- AlterTable
ALTER TABLE "approvals" DROP CONSTRAINT "approvals_pkey",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "approver_id" DROP NOT NULL,
ADD CONSTRAINT "approvals_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
