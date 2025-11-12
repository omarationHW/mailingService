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

  async sendEmail(params: {
    campaignId: string;
    contactId: string;
    trackToken: string;
    to: string;
    from: { email: string; name: string };
    subject: string;
    html: string;
    variables?: Record<string, any>;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      let html = params.html;

      if (params.variables) {
        html = this.replaceVariables(html, params.variables);
      }

      html = this.injectClickTracking(html, params.trackToken);
      html = this.injectTrackingPixel(html, params.trackToken);

      const result = await resend.emails.send({
        from: `${params.from.name} <${params.from.email}>`,
        to: params.to,
        subject: params.subject,
        html,
      });

      await prisma.event.create({
        data: {
          type: EventType.EMAIL_SENT,
          campaignId: params.campaignId,
          contactId: params.contactId,
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
      console.error('Send email error:', error);

      await prisma.event.create({
        data: {
          type: EventType.EMAIL_FAILED,
          campaignId: params.campaignId,
          contactId: params.contactId,
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
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
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return { sent, failed };
  }
}

export default new EmailService();
