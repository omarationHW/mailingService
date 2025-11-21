-- CreateEnum
CREATE TYPE "SequenceStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SequenceTriggerType" AS ENUM ('MANUAL', 'CONTACT_CREATED', 'LIST_ADDED', 'TAG_ADDED', 'EMAIL_OPENED', 'LINK_CLICKED');

-- CreateEnum
CREATE TYPE "SequenceStepStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "sequences" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "SequenceStatus" NOT NULL DEFAULT 'ACTIVE',
    "trigger_type" "SequenceTriggerType" NOT NULL,
    "trigger_value" TEXT,
    "from_email" TEXT NOT NULL,
    "from_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sequence_steps" (
    "id" TEXT NOT NULL,
    "sequence_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html_content" TEXT NOT NULL,
    "delay_days" INTEGER NOT NULL DEFAULT 0,
    "delay_hours" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sequence_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sequence_enrollments" (
    "id" TEXT NOT NULL,
    "sequence_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "status" "SequenceStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "paused_at" TIMESTAMP(3),

    CONSTRAINT "sequence_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sequence_step_executions" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "step_id" TEXT NOT NULL,
    "status" "SequenceStepStatus" NOT NULL DEFAULT 'PENDING',
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "track_token" TEXT NOT NULL,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sequence_step_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sequence_steps_sequence_id_idx" ON "sequence_steps"("sequence_id");

-- CreateIndex
CREATE UNIQUE INDEX "sequence_steps_sequence_id_step_order_key" ON "sequence_steps"("sequence_id", "step_order");

-- CreateIndex
CREATE INDEX "sequence_enrollments_sequence_id_idx" ON "sequence_enrollments"("sequence_id");

-- CreateIndex
CREATE INDEX "sequence_enrollments_contact_id_idx" ON "sequence_enrollments"("contact_id");

-- CreateIndex
CREATE INDEX "sequence_enrollments_status_idx" ON "sequence_enrollments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sequence_enrollments_sequence_id_contact_id_key" ON "sequence_enrollments"("sequence_id", "contact_id");

-- CreateIndex
CREATE INDEX "sequence_step_executions_enrollment_id_idx" ON "sequence_step_executions"("enrollment_id");

-- CreateIndex
CREATE INDEX "sequence_step_executions_step_id_idx" ON "sequence_step_executions"("step_id");

-- CreateIndex
CREATE INDEX "sequence_step_executions_status_idx" ON "sequence_step_executions"("status");

-- CreateIndex
CREATE INDEX "sequence_step_executions_scheduled_for_idx" ON "sequence_step_executions"("scheduled_for");

-- CreateIndex
CREATE UNIQUE INDEX "sequence_step_executions_track_token_key" ON "sequence_step_executions"("track_token");

-- CreateIndex
CREATE UNIQUE INDEX "sequence_step_executions_enrollment_id_step_id_key" ON "sequence_step_executions"("enrollment_id", "step_id");

-- AddForeignKey
ALTER TABLE "sequence_steps" ADD CONSTRAINT "sequence_steps_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "sequences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "sequences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sequence_step_executions" ADD CONSTRAINT "sequence_step_executions_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "sequence_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sequence_step_executions" ADD CONSTRAINT "sequence_step_executions_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "sequence_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
