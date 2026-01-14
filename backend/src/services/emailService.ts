import { Resend } from 'resend';
import { config } from '../config/env';
import prisma from '../config/database';
import { EventType } from '@prisma/client';

const resend = new Resend(config.resend.apiKey);

export class EmailService {
  private replaceVariables(html: string, variables: Record<string, any>): string {
    let result = html;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, value || '');
    }
    return result;
  }

  private injectTrackingPixel(html: string, trackToken: string): string {
    const pixelUrl = `${config.app.url}/api/track/open/${trackToken}`;
    const trackingPixel = `<img src="${pixelUrl}" alt="" width="1" height="1" style="display:block;width:1px;height:1px;border:0;opacity:0;" />`;

    if (html.includes('</body>')) {
      return html.replace('</body>', `${trackingPixel}</body>`);
    }

    return html + trackingPixel;
  }

  private injectClickTracking(html: string, trackToken: string): string {
    const urlRegex = /href=["']([^"']+)["']/g;

    return html.replace(urlRegex, (match, url) => {
      if (
        url.startsWith('#') ||
        url.startsWith('mailto:') ||
        url.startsWith('tel:') ||
        url.includes('/track/')
      ) {
        return match;
      }

      const trackingUrl = `${config.app.url}/api/track/click/${trackToken}?url=${encodeURIComponent(url)}`;
      return `href="${trackingUrl}"`;
    });
  }

  private ensureUtf8Encoding(html: string): string {
    // Si el HTML ya tiene un <head>, inyectar el meta charset al principio
    if (html.includes('<head>')) {
      const metaCharset = '<meta charset="UTF-8">';
      if (!html.includes('charset')) {
        html = html.replace('<head>', `<head>${metaCharset}`);
      }
    } else if (html.includes('<html>')) {
      // Si tiene <html> pero no <head>, agregar <head> con charset
      const headWithCharset = '<head><meta charset="UTF-8"></head>';
      html = html.replace('<html>', `<html>${headWithCharset}`);
    } else {
      // Si no tiene estructura HTML, envolverlo en HTML completo con charset
      html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
${html}
</body>
</html>`;
    }
    return html;
  }

  async sendEmail(params: {
    campaignId?: string;
    contactId: string;
    trackToken: string;
    to: string;
    from: { email: string; name: string };
    subject: string;
    html: string;
    variables?: Record<string, any>;
    sequenceId?: string;
    sequenceStepExecutionId?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log(`📧 Sending email to ${params.to}...`);

      let html = params.html;

      if (params.variables) {
        html = this.replaceVariables(html, params.variables);
      }

      // Asegurar que el HTML tenga encoding UTF-8
      html = this.ensureUtf8Encoding(html);

      html = this.injectClickTracking(html, params.trackToken);
      html = this.injectTrackingPixel(html, params.trackToken);

      const result = await resend.emails.send({
        from: `${params.from.name} <${params.from.email}>`,
        to: params.to,
        subject: params.subject,
        html,
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
        },
      });

      console.log(`✅ Email sent successfully to ${params.to} - Message ID: ${result.data?.id}`);

      await prisma.event.create({
        data: {
          type: EventType.EMAIL_SENT,
          campaignId: params.campaignId,
          contactId: params.contactId,
          sequenceId: params.sequenceId,
          sequenceStepExecutionId: params.sequenceStepExecutionId,
          metadata: {
            messageId: result.data?.id,
          },
        },
      });

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error) {
      console.error('❌ Send email error:', error);
      console.error('Failed to send to:', params.to);
      console.error('Error details:', error instanceof Error ? error.message : error);

      await prisma.event.create({
        data: {
          type: EventType.EMAIL_FAILED,
          campaignId: params.campaignId,
          contactId: params.contactId,
          sequenceId: params.sequenceId,
          sequenceStepExecutionId: params.sequenceStepExecutionId,
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
            to: params.to,
          },
        },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  async sendBulkEmails(params: {
    campaignId: string;
    from: { email: string; name: string };
    subject: string;
    html: string;
    contacts: Array<{
      id: string;
      email: string;
      trackToken: string;
      variables?: Record<string, any>;
    }>;
    batchSize?: number;
  }): Promise<{ sent: number; failed: number }> {
    const batchSize = params.batchSize || 10;
    let sent = 0;
    let failed = 0;

    console.log(`\n🚀 Starting bulk email send for campaign ${params.campaignId}`);
    console.log(`📊 Total contacts: ${params.contacts.length}`);
    console.log(`📦 Batch size: ${batchSize}`);
    console.log(`📧 From: ${params.from.name} <${params.from.email}>`);
    console.log(`📝 Subject: ${params.subject}\n`);

    for (let i = 0; i < params.contacts.length; i += batchSize) {
      const batch = params.contacts.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(params.contacts.length / batchSize);

      console.log(`\n📤 Processing batch ${batchNum}/${totalBatches} (${batch.length} emails)...`);

      const results = await Promise.allSettled(
        batch.map((contact) =>
          this.sendEmail({
            campaignId: params.campaignId,
            contactId: contact.id,
            trackToken: contact.trackToken,
            to: contact.email,
            from: params.from,
            subject: params.subject,
            html: params.html,
            variables: contact.variables,
          })
        )
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.success) {
          sent++;
        } else {
          failed++;
        }
      }

      console.log(`✅ Batch ${batchNum} completed: ${sent} sent, ${failed} failed`);

      if (i + batchSize < params.contacts.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`\n🏁 Bulk send completed!`);
    console.log(`✅ Successfully sent: ${sent}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Success rate: ${((sent / params.contacts.length) * 100).toFixed(2)}%\n`);

    return { sent, failed };
  }
}

export default new EmailService();
