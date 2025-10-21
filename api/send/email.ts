import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

type TemplateVariables = Record<string, string>;

type SendEmailRequest = {
  method?: string;
  body: {
    to?: string | string[];
    subject?: string;
    html?: string;
    template_variables?: TemplateVariables;
  };
};

type SendEmailResponse = {
  status: (code: number) => SendEmailResponse;
  json: (payload: Record<string, unknown>) => void;
};

export default async function handler(req: SendEmailRequest, res: SendEmailResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const {
      to,
      subject,
      html,
      template_variables: templateVariables = {},
    } = req.body ?? {};

    // Validate required fields
    if (!to || !subject || !html) {
      res.status(400).json({ 
        error: 'Missing required fields: to, subject, html' 
      });
      return;
    }

    // Replace template variables in subject and html
    let processedSubject = subject;
    let processedHtml = html;

    Object.entries(templateVariables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), value);
      processedHtml = processedHtml.replace(new RegExp(placeholder, 'g'), value);
    });

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'notifications@resend.dev',
      to: Array.isArray(to) ? to : [to],
      subject: processedSubject,
      html: processedHtml,
    });

    if (error) {
      console.error('Resend API error:', error);
      res.status(500).json({ 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      return;
    }

    // Log successful send
    console.log('Email sent successfully:', {
      id: data?.id,
      to: to,
      subject: processedSubject
    });

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      email_id: data?.id ?? null,
      to: to,
      subject: processedSubject
    });

  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
