-- CreateTable
CREATE TABLE "cash_advance_transactions" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "description" TEXT,
    "reconciliation_bill_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_advance_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cash_advance_transactions_order_id_idx" ON "cash_advance_transactions"("order_id");

-- CreateIndex
CREATE INDEX "cash_advance_transactions_employee_id_idx" ON "cash_advance_transactions"("employee_id");

-- CreateIndex
CREATE INDEX "cash_advance_transactions_transaction_type_idx" ON "cash_advance_transactions"("transaction_type");

-- CreateIndex
CREATE INDEX "cash_advance_transactions_created_at_idx" ON "cash_advance_transactions"("created_at");

-- AddForeignKey
ALTER TABLE "cash_advance_transactions" ADD CONSTRAINT "cash_advance_transactions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
