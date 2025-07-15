/*
  Warnings:

  - You are about to drop the column `action` on the `workcheck_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "workcheck_items" DROP COLUMN "action",
ADD COLUMN     "actions" TEXT[] DEFAULT ARRAY[]::TEXT[];
