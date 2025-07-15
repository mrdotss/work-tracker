/*
  Warnings:

  - You are about to alter the column `code` on the `check_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(50)`.
  - You are about to alter the column `label` on the `check_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(255)`.
  - You are about to alter the column `name` on the `units` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(255)`.
  - You are about to alter the column `type` on the `units` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(50)`.
  - You are about to alter the column `first_name` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(50)`.
  - You are about to alter the column `last_name` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(50)`.
  - You are about to alter the column `username` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(50)`.
  - You are about to alter the column `password` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(255)`.
  - You are about to alter the column `phone_number` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(15)`.
  - A unique constraint covering the columns `[workcheck_id]` on the table `approvals` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "check_items" ALTER COLUMN "code" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "label" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "units" ALTER COLUMN "name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "type" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(6);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "first_name" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "last_name" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "username" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "password" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "phone_number" SET DATA TYPE VARCHAR(15),
ALTER COLUMN "last_login" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(6);

-- AlterTable
ALTER TABLE "workcheck_item_images" ALTER COLUMN "uploaded_at" SET DATA TYPE TIMESTAMP(6);

-- AlterTable
ALTER TABLE "workchecks" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(6);

-- CreateIndex
CREATE UNIQUE INDEX "approvals_workcheck_id_key" ON "approvals"("workcheck_id");
