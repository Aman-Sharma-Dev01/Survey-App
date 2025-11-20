import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

/**
 * Generic function to send an email using Brevo API
 */
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { email: process.env.BREVO_FROM_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: html
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Brevo Email Sent:", response.data);
  } catch (error) {
    console.error(
      "Brevo Email Error:",
      error.response?.data || error.message
    );
  }
};

/**
 * Sends a welcome/registration email
 */
export const sendRegistrationEmail = async (toEmail, name) => {
  return sendEmail({
    to: toEmail,
    subject: "Welcome to SurveyZen! Your Account is Ready",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Welcome, ${name}!</h2>
        <p>Thank you for registering your creator account with SurveyZen.</p>
        <p>You can now log in and start building your first survey.</p>
        <p>We’re excited to help you collect valuable feedback.</p>
        <p>Best regards,<br>The SurveyZen Team</p>
      </div>
    `
  });
};

/**
 * Sends an email when a new survey is created
 */
export const sendNewSurveyEmail = async (toEmail, surveyTitle) => {
  return sendEmail({
    to: toEmail,
    subject: `Survey Created: "${surveyTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Your Survey Has Been Created</h2>
        <p>Your new survey <strong>"${surveyTitle}"</strong> is now in draft mode.</p>
        <p>You can review and publish it anytime.</p>
        <p>Happy surveying!</p>
        <p>The SurveyZen Team</p>
      </div>
    `
  });
};


export const sendVerificationEmail = async (toEmail, name, token) => {
  const verifyUrl = `${process.env.PUBLIC_SITE_URL}/#verify/${token}`;

  return sendEmail({
    to: toEmail,
    subject: "Verify your SurveyZen Account",
    html: `
      <h2>Hello ${name},</h2>
      <p>Please verify your account by clicking the link below:</p>
      <a href="${verifyUrl}" style="padding:10px 20px; background:#4f46e5; color:white; text-decoration:none; border-radius:5px;">
        Verify Account
      </a>
      <p>This link expires in <b>24 hours</b>.</p>
    `
  });
};

export const sendResetPasswordEmail = async (toEmail, token) => {
  const resetUrl = `${process.env.PUBLIC_SITE_URL}/#reset-password/${token}`;

  return sendEmail({
    to: toEmail,
    subject: "Reset Your SurveyZen Password",
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the button below to set a new password:</p>
      <a href="${resetUrl}" style="padding:10px 20px; background:#e11d48; color:white; border-radius:5px; text-decoration:none;">
        Reset Password
      </a>
      <p>This link expires in <b>15 minutes</b>.</p>
    `
  });
};

