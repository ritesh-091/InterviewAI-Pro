const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return null;
};

/**
 * Sends a transactional email using Resend REST API if configured
 */
const sendViaResend = async (to, subject, html) => {
  if (!process.env.RESEND_API_KEY) return false;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
        to: [to],
        subject,
        html
      })
    });

    if (res.ok) {
      console.log(`Email dispatched successfully to ${to} via Resend Gateway API.`);
      return true;
    } else {
      const errText = await res.text();
      console.error('Resend Gateway API failed:', errText);
    }
  } catch (error) {
    console.error('Error dispatching mail via Resend API:', error);
  }
  return false;
};

/**
 * Sends a transactional email using Nodemailer SMTP if configured
 */
const sendViaSMTP = async (to, subject, html) => {
  const transporter = createTransporter();
  if (!transporter) return false;

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@interviewaipro.com',
      to,
      subject,
      html
    });
    console.log(`Email dispatched successfully to ${to} via SMTP Transport.`);
    return true;
  } catch (error) {
    console.error('Error dispatching mail via SMTP:', error);
  }
  return false;
};

const sendVerificationEmail = async (email, token) => {
  const verificationLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  
  const subject = 'Verify Your Email - InterviewAI Pro';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0d9488; text-align: center;">Welcome to InterviewAI Pro!</h2>
      <p>Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
      </div>
      <p style="font-size: 12px; color: #64748b;">If the button above does not work, copy and paste this link in your browser:</p>
      <p style="font-size: 12px; color: #0d9488; word-break: break-all;">${verificationLink}</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">This code expires in 24 hours. If you did not register, please ignore this email.</p>
    </div>
  `;

  // Attempt Resend -> SMTP -> Console Log Fallbacks
  const sentResend = await sendViaResend(email, subject, html);
  if (sentResend) return;

  const sentSMTP = await sendViaSMTP(email, subject, html);
  if (sentSMTP) return;

  // Simulator Console Log Fallback
  console.log('\n---------------- MOCK EMAIL SERVICE (FALLBACK) ----------------');
  console.log(`To: ${email}`);
  console.log(`Subject: ${subject}`);
  console.log(`Verification Link: ${verificationLink}`);
  console.log('-----------------------------------------------------\n');
};

const sendPasswordResetEmail = async (email, token) => {
  const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  
  const subject = 'Reset Your Password - InterviewAI Pro';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0d9488; text-align: center;">Reset Your Password</h2>
      <p>We received a request to reset your password. Click the button below to specify a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="font-size: 12px; color: #64748b;">If the button above does not work, copy and paste this link in your browser:</p>
      <p style="font-size: 12px; color: #0d9488; word-break: break-all;">${resetLink}</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">This link expires in 1 hour. If you did not request this, please ignore this email.</p>
    </div>
  `;

  // Attempt Resend -> SMTP -> Console Log Fallbacks
  const sentResend = await sendViaResend(email, subject, html);
  if (sentResend) return;

  const sentSMTP = await sendViaSMTP(email, subject, html);
  if (sentSMTP) return;

  // Simulator Console Log Fallback
  console.log('\n---------------- MOCK EMAIL SERVICE (FALLBACK) ----------------');
  console.log(`To: ${email}`);
  console.log(`Subject: ${subject}`);
  console.log(`Reset Link: ${resetLink}`);
  console.log('-----------------------------------------------------\n');
};

const sendInterviewInvitation = async (email, inviteLink, companyName) => {
  const subject = `Interview Invitation from ${companyName} - InterviewAI Pro`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0d9488; text-align: center;">Interview Invitation</h2>
      <p>You have been invited by <strong>${companyName}</strong> to complete an AI-evaluated mock interview round on InterviewAI Pro.</p>
      <p>Click the button below to start your interview simulator session:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteLink}" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Start Interview Round</a>
      </div>
      <p style="font-size: 12px; color: #64748b;">If the button above does not work, copy and paste this link in your browser:</p>
      <p style="font-size: 12px; color: #0d9488; word-break: break-all;">${inviteLink}</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">Powered by InterviewAI Pro. Recruiting systems reinvented.</p>
    </div>
  `;

  // Attempt Resend -> SMTP -> Console Log Fallbacks
  const sentResend = await sendViaResend(email, subject, html);
  if (sentResend) return;

  const sentSMTP = await sendViaSMTP(email, subject, html);
  if (sentSMTP) return;

  // Simulator Console Log Fallback
  console.log('\n---------------- MOCK EMAIL SERVICE (FALLBACK) ----------------');
  console.log(`To: ${email}`);
  console.log(`Subject: ${subject}`);
  console.log(`Invitation Link: ${inviteLink}`);
  console.log('-----------------------------------------------------\n');
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendInterviewInvitation
};
