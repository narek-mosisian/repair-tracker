-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "customer" VARCHAR(120) NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'OPEN',
    "receivedAt" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATE,
    "completedAt" DATE,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Order_status_dueDate_idx" ON "Order"("status", "dueDate");
