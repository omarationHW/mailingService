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

  // Convert Markdown-style links [text](url) inside HTML to proper <a href> tags
  private convertMarkdownLinks(html: string): string {
    return html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>');
  }

  private injectTrackingPixel(html: string, trackToken: string): string {
    const pixelUrl = `${config.app.url}/api/track/open/${trackToken}`;
    const trackingPixel = `<img src="${pixelUrl}" alt="" width="1" height="1" style="border:0;margin:0;padding:0;" />`;

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

      let html = params.html;

      if (params.variables) {
        html = this.replaceVariables(html, params.variables);
      }

      html = this.convertMarkdownLinks(html);

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
    const batchSize = params.batchSize || 5;
    let sent = 0;
    let failed = 0;

    console.log(`Bulk send campaign ${params.campaignId}: ${params.contacts.length} contacts`);

    for (let i = 0; i < params.contacts.length; i += batchSize) {
      const batch = params.contacts.slice(i, i + batchSize);

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


      if (i + batchSize < params.contacts.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    console.log(`Bulk send done: ${sent} sent, ${failed} failed`);

    return { sent, failed };
  }
}

export default new EmailService();
