type MailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
};

export async function sendMail(opts: MailOptions) {
  const fromEmail = opts.from || process.env.SENDGRID_FROM || process.env.SMTP_FROM || `no-reply@${process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, '') || 'local'}`;
  const fromName = process.env.SENDGRID_FROM_NAME || 'OSIS SMK Informatika FI';

  // Prefer SendGrid if configured
  if (process.env.SENDGRID_API_KEY) {
    try {
      const sg = (await import('@sendgrid/mail')) as any;
      sg.setApiKey(process.env.SENDGRID_API_KEY);
      const msg = {
        to: opts.to,
        from: {
          email: fromEmail,
          name: fromName
        },
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
        // Anti-spam headers
        trackingSettings: {
          clickTracking: { enable: false },
          openTracking: { enable: false }
        },
        mailSettings: {
          bypassListManagement: { enable: false },
          footer: { enable: false },
          sandboxMode: { enable: false }
        }
      };
      const res = await sg.send(msg);
      console.log('[mailer] Sent via SendGrid', { to: opts.to, subject: opts.subject });
      return res;
    } catch (err) {
      console.error('[mailer] SendGrid error:', err);
      console.error('[mailer] SendGrid response:', (err as any)?.response?.body);
      // fallthrough to other options
    }
  }

  // Fallback to SMTP transport via nodemailer
  if (process.env.SMTP_HOST) {
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
        secure: process.env.SMTP_SECURE === '1' || process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
      });

      const info = await transporter.sendMail({
        from: `${fromName} <${fromEmail}>`,
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
      });
      console.log('[mailer] Sent via SMTP', { to: opts.to, subject: opts.subject, messageId: info.messageId });
      return info;
    } catch (err) {
      console.error('[mailer] SMTP error', (err as Error).message);
    }
  }

  // Last fallback: just log
  console.log('[mailer] No mailer configured. Logging message instead:', {
    from: fromEmail,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
  });
  return null;
}

export async function sendResetEmail(to: string, resetLink: string, logoUrl?: string) {
  try {
    const { buildResetEmail } = await import('@/lib/emailTemplates');
    const tpl = buildResetEmail({ resetLink, logoUrl });
    return sendMail({ to, subject: tpl.subject, text: tpl.text, html: tpl.html });
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.warn('[mailer] buildResetEmail failed, falling back:', errorMsg);
    const subject = 'Reset kata sandi Anda';
    const text = `Kami menerima permintaan untuk mereset kata sandi Anda. Gunakan tautan berikut untuk membuat kata sandi baru:\n\n${resetLink}\n\nJika Anda tidak meminta ini, abaikan pesan ini.`;
    const html = `<p>Kami menerima permintaan untuk mereset kata sandi Anda. Klik tautan di bawah untuk membuat kata sandi baru:</p><p><a href="${resetLink}">Reset kata sandi</a></p><p>Jika Anda tidak meminta ini, abaikan pesan ini.</p>`;
    return sendMail({ to, subject, text, html });
  }
}
