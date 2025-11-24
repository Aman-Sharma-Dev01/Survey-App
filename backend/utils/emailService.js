import axios from "axios";
import dotenv from "dotenv";
import logo from "../public/image.png";
import logoName from "../public/image1.png";
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
    subject: "Welcome to SurveyZen , Your Account is Ready",
    html: `
    <div style="font-family: Arial, sans-serif; background:#f7f7f7; padding: 40px;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

        <!-- Header / Logo -->
        <div style="text-align:center; padding:20px 0; background:#ffffff;">
          <img src="${logo}" alt="SurveyZen Logo" style="width:150px; height:auto; display:block; margin:0 auto;" />
        </div>

        <!-- Body -->
        <div style="padding: 30px 40px; color:#333333;">
          <h2 style="margin-top:0; font-size:24px; font-weight:600; text-align:center; color:#222;">Welcome to SurveyZen, ${name}! 🎉</h2>

          <p style="font-size:16px; margin-bottom:16px;">
            Thank you for joining SurveyZen — we’re excited to have you on board!
          </p>

          <p style="font-size:16px; margin-bottom:16px;">
            Your account has been successfully activated. You can now start creating interactive surveys, analyzing responses, and exploring powerful features built to help you make informed decisions.
          </p>

          <!-- CTA Button -->
          <div style="text-align:center; margin:32px 0;">
            <a href="https://surveyzen.live/login" 
              style="background:#0ea5e9; color:#ffffff; text-decoration:none; padding:14px 28px; border-radius:6px; font-size:16px; display:inline-block; font-weight:600;">
              Login to your account
            </a>
          </div>

          <p style="font-size:16px; margin-bottom:16px;">
            Need help or have questions? Our support team is always here to assist you. Contact us anytime at:
            <a href="mailto:contact@surveyzen.live" style="color:#0ea5e9;">contact@surveyzen.live</a>
          </p>

          <p style="font-size:16px; margin-top:32px;">
            Warm Regards,<br>
            <strong>Team SurveyZen</strong>
          </p>
        </div>

        <!-- Bottom Logo -->
        <div style="text-align:center; padding:20px 0;">
          <img src="${logoName}" alt="SurveyZen Logo" style="width:120px; height:auto; opacity:0.85;" />
        </div>

        <!-- Footer -->
        <div style="background:#f2f2f2; text-align:center; padding:15px; font-size:13px; color:#666;">
          © ${new Date().getFullYear()} SurveyZen. All rights reserved.
        </div>

      </div>
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

