-- AlterTable
ALTER TABLE "public"."Announcement" ALTER COLUMN "content" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Post" ALTER COLUMN "content" DROP NOT NULL;
