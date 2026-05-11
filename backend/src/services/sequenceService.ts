import prisma from '../config/database';
import emailService from './emailService';
import { SequenceStepStatus } from '@prisma/client';

export class SequenceService {
  /**
   * Process pending sequence step executions
   * This should be called periodically (e.g., every minute)
   */
  async processPendingExecutions(): Promise<{
    processed: number;
    sent: number;
    failed: number;
  }> {
    const now = new Date();

    // Find all pending executions that are due
    const pendingExecutions = await prisma.sequenceStepExecution.findMany({
      where: {
        status: SequenceStepStatus.PENDING,
        scheduledFor: {
          lte: now,
        },
      },
      include: {
        step: {
          include: {
            sequence: true,
          },
        },
        enrollment: {
          include: {
            contact: true,
            sequence: true,
          },
        },
      },
      take: 100, // Process max 100 at a time
    });

    if (pendingExecutions.length === 0) return { processed: 0, sent: 0, failed: 0 };
    console.log(`⚡ Processing ${pendingExecutions.length} pending sequence executions...`);

    let sent = 0;
    let failed = 0;

    for (const execution of pendingExecutions) {
      // Skip if enrollment is not active
      if (execution.enrollment.status !== 'ACTIVE') {
        await prisma.sequenceStepExecution.update({
          where: { id: execution.id },
          data: {
            status: SequenceStepStatus.SKIPPED,
          },
        });
        continue;
      }

      // Skip if sequence is not active
      if (execution.enrollment.sequence.status !== 'ACTIVE') {
        await prisma.sequenceStepExecution.update({
          where: { id: execution.id },
          data: {
            status: SequenceStepStatus.SKIPPED,
          },
        });
        continue;
      }

      try {

        // Prepare variables for email
        const variables = {
          nombre: execution.enrollment.contact.name || execution.enrollment.contact.email,
          name: execution.enrollment.contact.name || execution.enrollment.contact.email,
          empresa: execution.enrollment.contact.company || '',
          company: execution.enrollment.contact.company || '',
          email: execution.enrollment.contact.email,
          ...(execution.enrollment.contact.customFields as Record<string, any> || {}),
        };

        // Send the email
        const result = await emailService.sendEmail({
          // Note: campaignId is omitted for sequence emails (no campaign association)
          contactId: execution.enrollment.contactId,
          trackToken: execution.trackToken,
          to: execution.enrollment.contact.email,
          from: {
            email: execution.step.sequence.fromEmail,
            name: execution.step.sequence.fromName,
          },
          subject: execution.step.subject,
          html: execution.step.htmlContent,
          variables,
          sequenceId: execution.step.sequenceId,
          sequenceStepExecutionId: execution.id,
        });

        if (result.success) {
          // Update execution status to SENT
          await prisma.sequenceStepExecution.update({
            where: { id: execution.id },
            data: {
              status: SequenceStepStatus.SENT,
              sentAt: new Date(),
            },
          });

          sent++;

          // Check if this was the last step and mark enrollment as completed
          const allExecutions = await prisma.sequenceStepExecution.findMany({
            where: {
              enrollmentId: execution.enrollmentId,
            },
          });

          const allSent = allExecutions.every(
            (exec) => exec.status === SequenceStepStatus.SENT || exec.status === SequenceStepStatus.SKIPPED
          );

          if (allSent) {
            await prisma.sequenceEnrollment.update({
              where: { id: execution.enrollmentId },
              data: {
                completedAt: new Date(),
              },
            });
            console.log(`Enrollment ${execution.enrollmentId} completed`);
          }
        } else {
          // Update execution status to FAILED
          await prisma.sequenceStepExecution.update({
            where: { id: execution.id },
            data: {
              status: SequenceStepStatus.FAILED,
              error: result.error,
            },
          });

          failed++;
          console.error(`Failed sequence execution ${execution.id}: ${result.error}`);
        }
      } catch (error) {
        console.error(`❌ Error processing execution ${execution.id}:`, error);

        await prisma.sequenceStepExecution.update({
          where: { id: execution.id },
          data: {
            status: SequenceStepStatus.FAILED,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        failed++;
      }
    }

    console.log(`Sequence worker: ${sent} sent, ${failed} failed (of ${pendingExecutions.length})`);

    return {
      processed: pendingExecutions.length,
      sent,
      failed,
    };
  }

  /**
   * Start the sequence processor worker
   * Runs every minute to check for pending executions
   */
  startWorker(intervalMs: number = 60000): NodeJS.Timeout {
    console.log(`Sequence worker started (interval: ${intervalMs / 1000}s)`);

    // Run immediately on start
    this.processPendingExecutions().catch(console.error);

    // Then run on interval
    const interval = setInterval(() => {
      this.processPendingExecutions().catch(console.error);
    }, intervalMs);

    return interval;
  }
}

export default new SequenceService();
