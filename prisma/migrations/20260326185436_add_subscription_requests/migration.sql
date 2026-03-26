-- CreateTable
CREATE TABLE "SubscriptionRequest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionRequest_pkey" PRIMARY KEY ("id")
);
