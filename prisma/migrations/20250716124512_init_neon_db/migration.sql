-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STAFF', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "last_name" VARCHAR(50) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(15),
    "roles" "Role" NOT NULL DEFAULT 'STAFF',
    "user_image" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(6),
    "created_at" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255),
    "type" VARCHAR(50),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_items" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "label" VARCHAR(255),
    "sort_order" SMALLINT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "check_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workchecks" (
    "id" UUID NOT NULL,
    "checker_id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "hours_meter" INTEGER,
    "is_submitted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "workchecks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workcheck_items" (
    "id" UUID NOT NULL,
    "workcheck_id" UUID,
    "item_id" UUID,
    "actions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "note" TEXT,

    CONSTRAINT "workcheck_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workcheck_item_images" (
    "id" UUID NOT NULL,
    "item_id" UUID,
    "file_name" TEXT,
    "uploaded_at" TIMESTAMP(6),

    CONSTRAINT "workcheck_item_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" UUID NOT NULL,
    "workcheck_id" UUID NOT NULL,
    "approver_id" UUID,
    "is_approved" BOOLEAN,
    "comments" TEXT,
    "approved_at" TIMESTAMP(6),

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "idx_users_created_at" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "units_name_idx" ON "units"("name");

-- CreateIndex
CREATE UNIQUE INDEX "check_items_code_key" ON "check_items"("code");

-- CreateIndex
CREATE INDEX "check_items_sort_order_idx" ON "check_items"("sort_order");

-- CreateIndex
CREATE INDEX "idx_wc_unit_date" ON "workchecks"("unit_id", "created_at");

-- CreateIndex
CREATE INDEX "workchecks_checker_id_idx" ON "workchecks"("checker_id");

-- CreateIndex
CREATE INDEX "workchecks_is_deleted_idx" ON "workchecks"("is_deleted");

-- CreateIndex
CREATE INDEX "workcheck_items_workcheck_id_idx" ON "workcheck_items"("workcheck_id");

-- CreateIndex
CREATE INDEX "workcheck_items_item_id_idx" ON "workcheck_items"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "workcheck_items_workcheck_id_item_id_key" ON "workcheck_items"("workcheck_id", "item_id");

-- CreateIndex
CREATE INDEX "workcheck_item_images_item_id_idx" ON "workcheck_item_images"("item_id");

-- CreateIndex
CREATE INDEX "idx_approvals_date" ON "approvals"("approved_at");

-- CreateIndex
CREATE UNIQUE INDEX "approvals_workcheck_id_key" ON "approvals"("workcheck_id");

-- AddForeignKey
ALTER TABLE "workchecks" ADD CONSTRAINT "workchecks_checker_id_fkey" FOREIGN KEY ("checker_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workchecks" ADD CONSTRAINT "workchecks_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workcheck_items" ADD CONSTRAINT "workcheck_items_workcheck_id_fkey" FOREIGN KEY ("workcheck_id") REFERENCES "workchecks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workcheck_items" ADD CONSTRAINT "workcheck_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "check_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workcheck_item_images" ADD CONSTRAINT "workcheck_item_images_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "workcheck_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_workcheck_id_fkey" FOREIGN KEY ("workcheck_id") REFERENCES "workchecks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
