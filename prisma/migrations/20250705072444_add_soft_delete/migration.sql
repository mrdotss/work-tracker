-- AlterTable
ALTER TABLE "check_items" ADD COLUMN     "created_at" TIMESTAMP(6),
ADD COLUMN     "deleted_at" TIMESTAMP(6),
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updated_at" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "units" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;
