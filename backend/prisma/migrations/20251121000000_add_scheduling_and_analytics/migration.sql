-- CreateEnum
CREATE TYPE "SchedulingType" AS ENUM ('RELATIVE_DELAY', 'ABSOLUTE_DATE');

-- AlterTable sequence_steps
ALTER TABLE "sequence_steps"
  ADD COLUMN "scheduling_type" "SchedulingType" NOT NULL DEFAULT 'RELATIVE_DELAY',
  ADD COLUMN "absolute_schedule_date" TIMESTAMP(3);

-- AlterTable events
ALTER TABLE "events"
  ADD COLUMN "sequence_id" TEXT,
  ADD COLUMN "sequence_step_execution_id" TEXT;

-- CreateIndex
CREATE INDEX "events_sequence_id_idx" ON "events"("sequence_id");

-- CreateIndex
CREATE INDEX "events_sequence_step_execution_id_idx" ON "events"("sequence_step_execution_id");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_sequence_id_fkey"
  FOREIGN KEY ("sequence_id") REFERENCES "sequences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_sequence_step_execution_id_fkey"
  FOREIGN KEY ("sequence_step_execution_id") REFERENCES "sequence_step_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
