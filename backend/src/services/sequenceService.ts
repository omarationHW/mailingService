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

    console.log(`\n⚡ Processing ${pendingExecutions.length} pending sequence executions...`);

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
        console.log(`⏭️  Skipped execution ${execution.id} - enrollment not active`);
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
        console.log(`⏭️  Skipped execution ${execution.id} - sequence not active`);
        continue;
      }

      try {
        console.log(`\n📨 Sending sequence email for execution ${execution.id}`);
        console.log(`   Sequence: ${execution.step.sequence.name}`);
        console.log(`   Step: ${execution.step.name}`);
        console.log(`   Contact: ${execution.enrollment.contact.email}`);

        // Prepare variables for email
        const variables = {
          nombre: execution.enrollment.contact.name || execution.enrollment.contact.email,
          email: execution.enrollment.contact.email,
          empresa: execution.enrollment.contact.company || '',
          ...(execution.enrollment.contact.customFields as Record<string, any> || {}),
        };

        // Send the email
        const result = await emailService.sendEmail({
          campaignId: execution.step.sequenceId, // Use sequence ID as campaign ID for tracking
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
          console.log(`✅ Successfully sent sequence email for execution ${execution.id}`);

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
            console.log(`🎉 Enrollment ${execution.enrollmentId} completed!`);
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
          console.log(`❌ Failed to send sequence email for execution ${execution.id}: ${result.error}`);
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

    console.log(`\n⚡ Sequence processing completed!`);
    console.log(`   Processed: ${pendingExecutions.length}`);
    console.log(`   Sent: ${sent}`);
    console.log(`   Failed: ${failed}\n`);

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
    console.log(`\n🤖 Starting sequence worker (interval: ${intervalMs / 1000}s)...\n`);

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
