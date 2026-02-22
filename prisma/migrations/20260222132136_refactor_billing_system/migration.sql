/*
  Warnings:

  - The values [BILLED,PAID] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `cash_advance` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `bills` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cash_advance_transactions` table. If the table is not empty, all the data it contains will be lost.

*/

-- CreateEnum (idempotent)
DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHEQUE', 'UPI', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterEnum (idempotent - only run if OrderStatus still has BILLED/PAID values)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'OrderStatus' AND e.enumlabel IN ('BILLED', 'PAID')
  ) THEN
    CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'DELIVERED', 'COMPLETED');
    ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new"
      USING (
        CASE "status"::text
          WHEN 'BILLED' THEN 'COMPLETED'
          WHEN 'PAID'   THEN 'COMPLETED'
          ELSE "status"::text
        END
      )::"OrderStatus_new";
    ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
    ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
    DROP TYPE "OrderStatus_old";
    ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';
  END IF;
END $$;

-- DropForeignKey (idempotent)
DO $$ BEGIN
  ALTER TABLE "bills" DROP CONSTRAINT "bills_order_id_fkey";
EXCEPTION
  WHEN undefined_table THEN null;
  WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "cash_advance_transactions" DROP CONSTRAINT "cash_advance_transactions_employee_id_fkey";
EXCEPTION
  WHEN undefined_table THEN null;
  WHEN undefined_object THEN null;
END $$;

-- AlterTable (idempotent)
ALTER TABLE "orders" DROP COLUMN IF EXISTS "cash_advance";
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cash"               INT NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "completed_at"        TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "price_per_liter"     DOUBLE PRECISION;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "quantity_delivered"  DOUBLE PRECISION;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "total_amount"        DOUBLE PRECISION;

-- DropTable (idempotent)
DROP TABLE IF EXISTS "bills";
DROP TABLE IF EXISTS "cash_advance_transactions";

-- DropEnum (idempotent)
DROP TYPE IF EXISTS "BillStatus";

-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "customer_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "total_purchases" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_payments" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL,
    "customer_profile_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payment_method" "PaymentMethod",
    "payment_method_note" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS "customer_profiles_user_id_key" ON "customer_profiles"("user_id");
CREATE INDEX IF NOT EXISTS "customer_profiles_user_id_idx" ON "customer_profiles"("user_id");
CREATE INDEX IF NOT EXISTS "payments_customer_profile_id_idx" ON "payments"("customer_profile_id");
CREATE INDEX IF NOT EXISTS "payments_payment_date_idx" ON "payments"("payment_date");
CREATE INDEX IF NOT EXISTS "payments_created_at_idx" ON "payments"("created_at");
CREATE INDEX IF NOT EXISTS "orders_vehicle_number_idx" ON "orders"("vehicle_number");

-- AddForeignKey (idempotent)
DO $$ BEGIN
  ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_profile_id_fkey"
    FOREIGN KEY ("customer_profile_id") REFERENCES "customer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
