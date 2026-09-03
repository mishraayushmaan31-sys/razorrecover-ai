-- CreateEnum
CREATE TYPE "AppMode" AS ENUM ('DEMO', 'TEST', 'PRODUCTION');
CREATE TYPE "RoleType" AS ENUM ('OWNER', 'FINANCE_MANAGER', 'OPERATIONS_MANAGER', 'DEVELOPER', 'VIEWER', 'MERCHANT_OWNER', 'MERCHANT_ADMIN', 'MERCHANT_OPERATOR', 'MERCHANT_SUPPORT', 'FINANCE_ANALYST', 'AUDITOR', 'SYSTEM_ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'INACTIVE', 'SUSPENDED');
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "TransactionType" AS ENUM ('PAYMENT', 'REFUND', 'REVERSAL', 'ADJUSTMENT', 'CHARGEBACK');
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'REVERSED', 'DISPUTED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');
CREATE TYPE "OrderStatus" AS ENUM ('CREATED', 'CONFIRMED', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('INITIATED', 'PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REJECTED', 'EXPIRED');
CREATE TYPE "RecoveryOpportunityStatus" AS ENUM ('IDENTIFIED', 'EVALUATING', 'APPROVED', 'REJECTED', 'RECOVERED', 'CLOSED');
CREATE TYPE "RecoveryStrategyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "RecoveryActionStatus" AS ENUM ('RECOMMENDED', 'POLICY_BLOCKED', 'RISK_BLOCKED', 'NEEDS_APPROVAL', 'APPROVED', 'EXECUTING', 'COMPLETED', 'CANCELLED', 'QUEUED', 'IN_PROGRESS', 'SUCCEEDED', 'FAILED', 'REQUIRES_REVIEW', 'BLOCKED');
CREATE TYPE "ExperimentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "VariantStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED');
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RiskSource" AS ENUM ('PAYMENT_GATEWAY', 'AI_MODEL', 'MANUAL_REVIEW', 'POLICY_ENGINE');
CREATE TYPE "AIRecommendationType" AS ENUM ('RISK_SUMMARY', 'RECOVERY_STRATEGY', 'PAYMENT_RETRY', 'NEXT_BEST_ACTION');
CREATE TYPE "RecommendationStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'REJECTED', 'EXPIRED');
CREATE TYPE "PolicyScope" AS ENUM ('MERCHANT', 'GLOBAL');
CREATE TYPE "PolicyType" AS ENUM ('RISK_THRESHOLD', 'RECOVERY_ACTION', 'APPROVAL_REQUIREMENT', 'APPROVAL_EXEMPTION');
CREATE TYPE "PolicyDecision" AS ENUM ('ALLOW', 'DENY', 'REQUIRE_REVIEW', 'BLOCK');
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED');
CREATE TYPE "HumanReviewAction" AS ENUM ('APPROVE', 'REJECT', 'MODIFY', 'ASSIGN', 'ESCALATE');
CREATE TYPE "AuditAction" AS ENUM ('SIGNUP', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGED', 'ACCOUNT_LOCKED', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'EXECUTE', 'SYNC', 'REVIEW');
CREATE TYPE "LedgerEntryType" AS ENUM ('REVENUE_RECOVERED', 'REFUND', 'REVERSAL', 'COMMISSION', 'FEE_ADJUSTMENT', 'TAX');
CREATE TYPE "LedgerDirection" AS ENUM ('CREDIT', 'DEBIT');
CREATE TYPE "NotificationType" AS ENUM ('RISK_ALERT', 'APPROVAL_REQUIRED', 'RECOVERY_SUCCESS', 'PAYMENT_FAILURE', 'SYSTEM');
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'READ');

-- CreateTable Merchant
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "mode" "AppMode" NOT NULL DEFAULT 'DEMO',
    "status" TEXT NOT NULL DEFAULT 'active',
    "aiKillSwitchActive" BOOLEAN NOT NULL DEFAULT false,
    "aiKillSwitchActivatedAt" TIMESTAMP(3),
    "aiKillSwitchActivatedBy" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "metadata" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Merchant_slug_key" ON "Merchant"("slug");
CREATE INDEX "Merchant_slug_mode_idx" ON "Merchant"("slug", "mode");
CREATE INDEX "Merchant_status_createdAt_idx" ON "Merchant"("status", "createdAt");

-- CreateTable Role
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT,
    "name" TEXT NOT NULL,
    "type" "RoleType" NOT NULL,
    "description" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Role_merchantId_name_key" ON "Role"("merchantId", "name");
CREATE INDEX "Role_merchantId_type_idx" ON "Role"("merchantId", "type");

-- CreateTable User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "avatarUrl" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "metadata" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_merchantId_email_key" ON "User"("merchantId", "email");
CREATE INDEX "User_merchantId_status_idx" ON "User"("merchantId", "status");
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateTable Customer
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "riskScore" DECIMAL(5,2),
    "metadata" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Customer_merchantId_externalId_key" ON "Customer"("merchantId", "externalId");
CREATE INDEX "Customer_merchantId_status_idx" ON "Customer"("merchantId", "status");
CREATE INDEX "Customer_merchantId_email_idx" ON "Customer"("merchantId", "email");

-- CreateTable Transaction
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT,
    "externalId" TEXT,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "description" TEXT,
    "idempotencyKey" TEXT,
    "metadata" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Transaction_merchantId_idempotencyKey_key" ON "Transaction"("merchantId", "idempotencyKey");
CREATE INDEX "Transaction_merchantId_status_createdAt_idx" ON "Transaction"("merchantId", "status", "createdAt");
CREATE INDEX "Transaction_merchantId_customerId_createdAt_idx" ON "Transaction"("merchantId", "customerId", "createdAt");

-- CreateTable Payment
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "customerId" TEXT,
    "orderId" TEXT,
    "transactionId" TEXT,
    "paymentMethod" TEXT,
    "provider" TEXT,
    "providerPaymentId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "riskScore" DECIMAL(5,2),
    "gatewayData" JSONB,
    "idempotencyKey" TEXT,
    "metadata" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Payment_merchantId_idempotencyKey_key" ON "Payment"("merchantId", "idempotencyKey");
CREATE UNIQUE INDEX "Payment_merchantId_provider_providerPaymentId_key" ON "Payment"("merchantId", "provider", "providerPaymentId");
CREATE INDEX "Payment_merchantId_status_createdAt_idx" ON "Payment"("merchantId", "status", "createdAt");
CREATE INDEX "Payment_provider_providerPaymentId_idx" ON "Payment"("provider", "providerPaymentId");

-- CreateTable Order
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'CREATED',
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "items" JSONB,
    "idempotencyKey" TEXT,
    "metadata" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Order_merchantId_orderNumber_key" ON "Order"("merchantId", "orderNumber");
CREATE INDEX "Order_merchantId_status_createdAt_idx" ON "Order"("merchantId", "status", "createdAt");

-- CreateTable PaymentAttempt
CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "orderId" TEXT,
    "paymentId" TEXT,
    "attemptNumber" INTEGER NOT NULL,
    "status" "PaymentAttemptStatus" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "provider" TEXT NOT NULL,
    "providerAttemptId" TEXT,
    "gatewayResponseCode" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "metadata" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentAttempt_merchantId_idempotencyKey_key" ON "PaymentAttempt"("merchantId", "idempotencyKey");
CREATE UNIQUE INDEX "PaymentAttempt_merchantId_orderId_attemptNumber_key" ON "PaymentAttempt"("merchantId", "orderId", "attemptNumber");
CREATE INDEX "PaymentAttempt_merchantId_status_createdAt_idx" ON "PaymentAttempt"("merchantId", "status", "createdAt");

-- CreateTable RecoveryOpportunity
CREATE TABLE "RecoveryOpportunity" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "transactionId" TEXT,
    "paymentId" TEXT,
    "orderId" TEXT,
    "incidentId" TEXT,
    "status" "RecoveryOpportunityStatus" NOT NULL DEFAULT 'IDENTIFIED',
    "estimatedAmount" DECIMAL(18,2),
    "recommendedAmount" DECIMAL(18,2),
    "reason" TEXT,
    "riskScore" DECIMAL(5,2),
    "aiScore" DECIMAL(5,2),
    "idempotencyKey" TEXT,
    "metadata" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecoveryOpportunity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecoveryOpportunity_merchantId_idempotencyKey_key" ON "RecoveryOpportunity"("merchantId", "idempotencyKey");
CREATE INDEX "RecoveryOpportunity_merchantId_status_createdAt_idx" ON "RecoveryOpportunity"("merchantId", "status", "createdAt");

-- CreateTable RecoveryStrategy
CREATE TABLE "RecoveryStrategy" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "status" "RecoveryStrategyStatus" NOT NULL DEFAULT 'DRAFT',
    "rationale" TEXT,
    "estimatedRecovery" DECIMAL(18,2),
    "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecoveryStrategy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecoveryStrategy_merchantId_opportunityId_name_key" ON "RecoveryStrategy"("merchantId", "opportunityId", "name");
CREATE INDEX "RecoveryStrategy_merchantId_status_createdAt_idx" ON "RecoveryStrategy"("merchantId", "status", "createdAt");

-- CreateTable RecoveryAction
CREATE TABLE "RecoveryAction" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "strategyId" TEXT,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "status" "RecoveryActionStatus" NOT NULL DEFAULT 'QUEUED',
    "requestedAmount" DECIMAL(18,2),
    "executedAmount" DECIMAL(18,2),
    "idempotencyKey" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecoveryAction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecoveryAction_merchantId_idempotencyKey_key" ON "RecoveryAction"("merchantId", "idempotencyKey");
CREATE INDEX "RecoveryAction_merchantId_status_createdAt_idx" ON "RecoveryAction"("merchantId", "status", "createdAt");

-- CreateTable RecoveryExperiment
CREATE TABLE "RecoveryExperiment" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ExperimentStatus" NOT NULL DEFAULT 'DRAFT',
    "metadata" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecoveryExperiment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecoveryExperiment_merchantId_name_key" ON "RecoveryExperiment"("merchantId", "name");
CREATE INDEX "RecoveryExperiment_merchantId_status_createdAt_idx" ON "RecoveryExperiment"("merchantId", "status", "createdAt");

-- CreateTable ExperimentVariant
CREATE TABLE "ExperimentVariant" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "allocation" DECIMAL(5,2) NOT NULL,
    "status" "VariantStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "metadata" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperimentVariant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExperimentVariant_experimentId_name_key" ON "ExperimentVariant"("experimentId", "name");
CREATE INDEX "ExperimentVariant_experimentId_status_idx" ON "ExperimentVariant"("experimentId", "status");

-- CreateTable Incident
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "customerId" TEXT,
    "transactionId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "RiskLevel" NOT NULL,
    "source" TEXT,
    "metadata" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Incident_merchantId_status_createdAt_idx" ON "Incident"("merchantId", "status", "createdAt");

-- CreateTable RiskAssessment
CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "customerId" TEXT,
    "paymentId" TEXT,
    "transactionId" TEXT,
    "score" DECIMAL(5,2) NOT NULL,
    "level" "RiskLevel" NOT NULL,
    "source" "RiskSource" NOT NULL,
    "summary" TEXT NOT NULL,
    "details" JSONB,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RiskAssessment_merchantId_level_createdAt_idx" ON "RiskAssessment"("merchantId", "level", "createdAt");
CREATE INDEX "RiskAssessment_merchantId_paymentId_createdAt_idx" ON "RiskAssessment"("merchantId", "paymentId", "createdAt");

-- CreateTable AIRecommendation
CREATE TABLE "AIRecommendation" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "createdByUserId" TEXT,
    "type" "AIRecommendationType" NOT NULL,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'PROPOSED',
    "confidence" DECIMAL(5,2) NOT NULL,
    "summary" TEXT NOT NULL,
    "details" JSONB,
    "modelName" TEXT,
    "promptHash" TEXT,
    "responseHash" TEXT,
    "metadata" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIRecommendation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AIRecommendation_merchantId_status_createdAt_idx" ON "AIRecommendation"("merchantId", "status", "createdAt");

-- CreateTable Policy
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PolicyType" NOT NULL,
    "scope" "PolicyScope" NOT NULL DEFAULT 'MERCHANT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "rules" JSONB NOT NULL,
    "summary" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Policy_merchantId_name_version_key" ON "Policy"("merchantId", "name", "version");
CREATE INDEX "Policy_merchantId_isActive_type_idx" ON "Policy"("merchantId", "isActive", "type");

-- CreateTable PolicyEvaluation
CREATE TABLE "PolicyEvaluation" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "decision" "PolicyDecision" NOT NULL,
    "rationale" TEXT NOT NULL,
    "score" DECIMAL(5,2),
    "evaluatedBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PolicyEvaluation_merchantId_policyId_createdAt_idx" ON "PolicyEvaluation"("merchantId", "policyId", "createdAt");
CREATE INDEX "PolicyEvaluation_resourceType_resourceId_idx" ON "PolicyEvaluation"("resourceType", "resourceId");

-- CreateTable HumanReview
CREATE TABLE "HumanReview" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "reviewerUserId" TEXT NOT NULL,
    "assignedToUserId" TEXT,
    "action" "HumanReviewAction",
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "decision" TEXT,
    "reason" TEXT,
    "modifiedProposal" JSONB,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HumanReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HumanReview_merchantId_status_createdAt_idx" ON "HumanReview"("merchantId", "status", "createdAt");
CREATE INDEX "HumanReview_resourceType_resourceId_idx" ON "HumanReview"("resourceType", "resourceId");

CREATE TABLE "ExplainabilityLedger" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "transactionId" TEXT,
    "customerId" TEXT,
    "agent" TEXT,
    "decision" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "confidence" DECIMAL(5,2) NOT NULL,
    "risk" JSONB NOT NULL,
    "policy" JSONB NOT NULL,
    "approval" JSONB NOT NULL,
    "result" TEXT NOT NULL,
    "revenueRescued" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExplainabilityLedger_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ExplainabilityLedger_merchantId_actionId_createdAt_idx" ON "ExplainabilityLedger"("merchantId", "actionId", "createdAt");
CREATE INDEX "ExplainabilityLedger_merchantId_reviewId_createdAt_idx" ON "ExplainabilityLedger"("merchantId", "reviewId", "createdAt");
CREATE INDEX "ExplainabilityLedger_merchantId_createdAt_idx" ON "ExplainabilityLedger"("merchantId", "createdAt");
CREATE INDEX "ExplainabilityLedger_merchantId_decision_createdAt_idx" ON "ExplainabilityLedger"("merchantId", "decision", "createdAt");

-- CreateTable AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "userId" TEXT,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_merchantId_resourceType_resourceId_idx" ON "AuditLog"("merchantId", "resourceType", "resourceId");
CREATE INDEX "AuditLog_merchantId_action_createdAt_idx" ON "AuditLog"("merchantId", "action", "createdAt");

-- CreateTable WebhookEvent
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "signatureValid" BOOLEAN NOT NULL DEFAULT false,
    "processingStatus" TEXT NOT NULL DEFAULT 'received',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "lastError" TEXT,
    "processedAt" TIMESTAMP(3),
    "deadLetteredAt" TIMESTAMP(3),
    "dedupeKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "idempotencyKey" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WebhookEvent_merchantId_dedupeKey_key" ON "WebhookEvent"("merchantId", "dedupeKey");
CREATE INDEX "WebhookEvent_merchantId_source_eventType_createdAt_idx" ON "WebhookEvent"("merchantId", "source", "eventType", "createdAt");

-- CreateTable RevenueLedger
CREATE TABLE "RevenueLedger" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "transactionId" TEXT,
    "paymentId" TEXT,
    "opportunityId" TEXT,
    "entryType" "LedgerEntryType" NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "description" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueLedger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RevenueLedger_merchantId_createdAt_idx" ON "RevenueLedger"("merchantId", "createdAt");
CREATE INDEX "RevenueLedger_referenceId_idx" ON "RevenueLedger"("referenceId");
CREATE UNIQUE INDEX "RevenueLedger_merchantId_referenceId_key" ON "RevenueLedger"("merchantId", "referenceId");

-- CreateTable MerchantMemory
CREATE TABLE "MerchantMemory" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantMemory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MerchantMemory_merchantId_key_key" ON "MerchantMemory"("merchantId", "key");
CREATE INDEX "MerchantMemory_merchantId_tags_idx" ON "MerchantMemory"("merchantId", "tags");

-- CreateTable Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_merchantId_status_createdAt_idx" ON "Notification"("merchantId", "status", "createdAt");

-- Foreign Keys
ALTER TABLE "Role" ADD CONSTRAINT "Role_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecoveryOpportunity" ADD CONSTRAINT "RecoveryOpportunity_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecoveryOpportunity" ADD CONSTRAINT "RecoveryOpportunity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecoveryOpportunity" ADD CONSTRAINT "RecoveryOpportunity_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecoveryOpportunity" ADD CONSTRAINT "RecoveryOpportunity_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecoveryOpportunity" ADD CONSTRAINT "RecoveryOpportunity_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecoveryOpportunity" ADD CONSTRAINT "RecoveryOpportunity_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecoveryStrategy" ADD CONSTRAINT "RecoveryStrategy_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecoveryStrategy" ADD CONSTRAINT "RecoveryStrategy_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "RecoveryOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecoveryAction" ADD CONSTRAINT "RecoveryAction_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecoveryAction" ADD CONSTRAINT "RecoveryAction_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "RecoveryOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecoveryAction" ADD CONSTRAINT "RecoveryAction_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "RecoveryStrategy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecoveryAction" ADD CONSTRAINT "RecoveryAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecoveryExperiment" ADD CONSTRAINT "RecoveryExperiment_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecoveryExperiment" ADD CONSTRAINT "RecoveryExperiment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExperimentVariant" ADD CONSTRAINT "ExperimentVariant_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExperimentVariant" ADD CONSTRAINT "ExperimentVariant_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "RecoveryExperiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIRecommendation" ADD CONSTRAINT "AIRecommendation_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIRecommendation" ADD CONSTRAINT "AIRecommendation_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "RecoveryOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIRecommendation" ADD CONSTRAINT "AIRecommendation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PolicyEvaluation" ADD CONSTRAINT "PolicyEvaluation_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PolicyEvaluation" ADD CONSTRAINT "PolicyEvaluation_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HumanReview" ADD CONSTRAINT "HumanReview_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HumanReview" ADD CONSTRAINT "HumanReview_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HumanReview" ADD CONSTRAINT "HumanReview_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExplainabilityLedger" ADD CONSTRAINT "ExplainabilityLedger_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExplainabilityLedger" ADD CONSTRAINT "ExplainabilityLedger_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "RecoveryAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExplainabilityLedger" ADD CONSTRAINT "ExplainabilityLedger_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "HumanReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExplainabilityLedger" ADD CONSTRAINT "ExplainabilityLedger_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExplainabilityLedger" ADD CONSTRAINT "ExplainabilityLedger_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RevenueLedger" ADD CONSTRAINT "RevenueLedger_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RevenueLedger" ADD CONSTRAINT "RevenueLedger_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RevenueLedger" ADD CONSTRAINT "RevenueLedger_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RevenueLedger" ADD CONSTRAINT "RevenueLedger_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "RecoveryOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MerchantMemory" ADD CONSTRAINT "MerchantMemory_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
