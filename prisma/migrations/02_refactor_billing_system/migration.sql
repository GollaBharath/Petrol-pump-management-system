-- Drop cash advance transactions table
DROP TABLE IF EXISTS "cash_advance_transactions";

-- Drop bills table (will be replaced with customer balance system)
DROP TABLE IF EXISTS "bills";

-- Remove cash_advance column from orders and add new columns
ALTER TABLE "orders" DROP COLUMN IF EXISTS "cash_advance";
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "quantity_delivered" DOUBLE PRECISION;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "price_per_liter" DOUBLE PRECISION;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "total_amount" DOUBLE PRECISION;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMP(3);

-- Update OrderStatus enum - Remove BILLED and PAID, add COMPLETED
DO $$ BEGIN
    CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'DELIVERED', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Convert existing rows: BILLED/PAID → COMPLETED, then swap the enum type
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new"
    USING (
        CASE "status"::text
            WHEN 'BILLED'    THEN 'COMPLETED'
            WHEN 'PAID'      THEN 'COMPLETED'
            ELSE "status"::text
        END
    )::"OrderStatus_new";

DO $$ BEGIN
    ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";

DROP TYPE IF EXISTS "OrderStatus_old";

ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Add index for vehicle_number
CREATE INDEX IF NOT EXISTS "orders_vehicle_number_idx" ON "orders"("vehicle_number");

-- Create PaymentMethod enum
DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHEQUE', 'UPI', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create customer_profiles table
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

-- Create unique index on user_id
CREATE UNIQUE INDEX IF NOT EXISTS "customer_profiles_user_id_key" ON "customer_profiles"("user_id");

-- Create index on user_id
CREATE INDEX IF NOT EXISTS "customer_profiles_user_id_idx" ON "customer_profiles"("user_id");

-- Add foreign key constraint
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create payments table
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

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS "payments_customer_profile_id_idx" ON "payments"("customer_profile_id");
CREATE INDEX IF NOT EXISTS "payments_payment_date_idx" ON "payments"("payment_date");
CREATE INDEX IF NOT EXISTS "payments_created_at_idx" ON "payments"("created_at");

-- Add foreign key constraint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_profile_id_fkey" 
FOREIGN KEY ("customer_profile_id") REFERENCES "customer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create customer profiles for existing customers
INSERT INTO "customer_profiles" ("id", "user_id", "created_at", "updated_at")
SELECT 
    gen_random_uuid()::text,
    "id",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users"
WHERE "role" = 'CUSTOMER'
ON CONFLICT ("user_id") DO NOTHING;

-- Update customer profiles with order statistics and balances
UPDATE "customer_profiles" cp
SET 
    "total_orders" = COALESCE(order_stats."order_count", 0),
    "total_purchases" = COALESCE(order_stats."total_purchases", 0),
    "current_balance" = -COALESCE(order_stats."total_purchases", 0),
    "updated_at" = CURRENT_TIMESTAMP
FROM (
    SELECT 
        "customer_id",
        COUNT(*) as "order_count",
        SUM(COALESCE("total_amount", 0)) as "total_purchases"
    FROM "orders"
    WHERE "status" IN ('DELIVERED', 'COMPLETED')
    GROUP BY "customer_id"
) as order_stats
WHERE cp."user_id" = order_stats."customer_id";
