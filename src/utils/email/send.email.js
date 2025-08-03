import nodemailer from "nodemailer";

export async function sendEmail({
  from = process.env.EMAIL_USER,
  to = "",
  cc = "",
  bcc = "",
  text = "",
  html = "",
  subject = "saraha app",
  attachments = [],
} = {}) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: `"Saraha app" <${from}> `,
    to,
    cc,
    bcc,
    text,
    html,
    subject,
    attachments,
  });

  console.log("Message sent:", info.messageId);
}
