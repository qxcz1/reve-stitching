interface ContactData {
    name: string;
    email: string;
    company?: string;
    subject: string;
    message: string;
  }
  
  interface ChatData {
    sessionId: string;
    visitorName?: string;
    visitorEmail?: string;
  }
  
  export async function notifyNewContact(data: ContactData) {
    const { Resend } = await import('resend');
    const resend = new Resend(import.meta.env.RESEND_API_KEY);
  
    // Email
    try {
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'hamzali.revesystems@gmail.com',
        subject: `🔔 New Contact: ${data.subject}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          ${data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : ''}
          <p><strong>Subject:</strong> ${data.subject}</p>
          <p><strong>Message:</strong><br>${data.message.replace(/\n/g, '<br>')}</p>
          <a href="https://revestitching.com/admin">View in Admin Panel</a>
        `,
      });
    } catch (e) {
      console.error('Email failed:', e);
    }
  
    // Discord
    const webhookUrl = import.meta.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: '🔔 New Contact Form',
              color: 0x3B82F6,
              fields: [
                { name: 'Name', value: data.name, inline: true },
                { name: 'Email', value: data.email, inline: true },
                { name: 'Subject', value: data.subject },
                { name: 'Message', value: data.message.substring(0, 200) },
              ],
              timestamp: new Date().toISOString(),
            }],
          }),
        });
      } catch (e) {
        console.error('Discord failed:', e);
      }
    }
  }
  
  export async function notifyNewChat(data: ChatData) {
    const { Resend } = await import('resend');
    const resend = new Resend(import.meta.env.RESEND_API_KEY);
  
    // Email
    try {
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'hamzali.revesystems@gmail.com',
        subject: '💬 New Live Chat Request',
        html: `
          <h2>Someone Requested Live Chat</h2>
          <p><strong>Name:</strong> ${data.visitorName || 'Anonymous'}</p>
          <p><strong>Email:</strong> ${data.visitorEmail || 'Not provided'}</p>
          <a href="https://revestitching.com/admin/chat/${data.sessionId}">Open Chat</a>
        `,
      });
    } catch (e) {
      console.error('Email failed:', e);
    }
  
    // Discord
    const webhookUrl = import.meta.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: '💬 New Live Chat',
              color: 0x10B981,
              fields: [
                { name: 'Name', value: data.visitorName || 'Anonymous', inline: true },
                { name: 'Email', value: data.visitorEmail || 'Not provided', inline: true },
              ],
              timestamp: new Date().toISOString(),
            }],
          }),
        });
      } catch (e) {
        console.error('Discord failed:', e);
      }
    }
  }