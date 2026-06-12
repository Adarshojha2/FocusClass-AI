const nodemailer = require('nodemailer');
const User = require('../models/user');

exports.sendFeedback = async (req, res) => {
  try {
    const senderId = req.user;
    const { subject, message } = req.body || {};

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required.' });
    }

    const principalEmail = process.env.PRINCIPAL_EMAIL;
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!principalEmail || !smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      return res.status(500).json({ message: 'Email not configured on server. Set PRINCIPAL_EMAIL and SMTP_* env vars.' });
    }

    const sender = senderId ? await User.findById(senderId).lean() : null;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const fromLabel = sender ? `${sender.name} <${sender.email}>` : smtpUser;

    const mailOptions = {
      from: fromLabel,
      to: principalEmail,
      subject: `[FocusClass Feedback] ${subject}`,
      text: `From: ${sender ? `${sender.name} <${sender.email}> (role: ${sender.role || 'unknown'})` : 'Unknown user'}\n\n${message}`,
      html: `<p><strong>From:</strong> ${sender ? `${sender.name} &lt;${sender.email}&gt; (role: ${sender.role || 'unknown'})` : 'Unknown user'}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g,'<br/>')}</p>`,
    };

    await transporter.sendMail(mailOptions);
    return res.json({ message: 'Feedback sent' });
  } catch (err) {
    console.error('Feedback send failed', err);
    return res.status(500).json({ message: 'Failed to send feedback.' });
  }
};
