import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, html, template_variables = {} } = req.body;

    // Validate required fields
    if (!to || !subject || !html) {
      return res.status(400).json({ 
        error: 'Missing required fields: to, subject, html' 
      });
    }

    // Replace template variables in subject and html
    let processedSubject = subject;
    let processedHtml = html;

    Object.entries(template_variables).forEach(([key, value]) => {
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
      return res.status(500).json({ 
        error: 'Failed to send email',
        details: error.message 
      });
    }

    // Log successful send
    console.log('Email sent successfully:', {
      id: data.id,
      to: to,
      subject: processedSubject
    });

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      email_id: data.id,
      to: to,
      subject: processedSubject
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
