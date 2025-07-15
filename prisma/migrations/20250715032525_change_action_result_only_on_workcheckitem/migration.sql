/*
  Warnings:

  - You are about to drop the column `result` on the `workcheck_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "workcheck_items" DROP COLUMN "result",
ALTER COLUMN "action" SET DATA TYPE CHAR(10);
