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
    subject: "Welcome to SurveyZen , Your Account is Ready",
    html: `
    <div style="font-family: Arial, sans-serif; background:#f7f7f7; padding: 40px;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

        <!-- Header / Logo -->
        <div style="text-align:center; padding:20px 0; background:#ffffff;">
          <img src="https://surveyzen.live/logo3.png" alt="SurveyZen Logo" style="width:150px; height:auto; display:block; margin:0 auto;" />
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
            <a href="https://surveyzen.live/#login" 
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
          <img src="https://surveyzen.live/logo1.png" alt="SurveyZen Logo" style="width:120px; height:auto; opacity:0.85;" />
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
    <div style="font-family: Arial, sans-serif; background:#f7f7f7; padding: 40px;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

        <!-- Header Logo -->
        <div style="text-align:center; padding:25px 0;">
          <img src="https://surveyzen.live/logo3.png" alt="SurveyZen Logo" style="width:150px; display:block; margin:0 auto;" />
        </div>

        <!-- Body -->
        <div style="padding: 30px 40px; color:#333;">
          <h2 style="margin-top:0; font-size:24px; font-weight:600; text-align:center; color:#222;">
            🎉 Your Survey Has Been Created
          </h2>

          <p style="font-size:16px; margin-bottom:16px;">
            Your new survey titled <strong>"${surveyTitle}"</strong> has been successfully created and is currently in <strong>draft</strong> mode.
          </p>

          <p style="font-size:16px; margin-bottom:16px;">
            You can now review the content, make updates, add questions, and publish it whenever you're ready.
          </p>

          <!-- CTA Button -->
          <div style="text-align:center; margin:32px 0;">
            <a href="https://surveyzen.live/#dashboard"
              style="background:#0ea5e9; color:#ffffff; text-decoration:none; padding:14px 28px; border-radius:6px; font-size:16px; display:inline-block; font-weight:600;">
              Go to Dashboard
            </a>
          </div>

          <p style="font-size:16px;">
            Happy surveying! 🚀
          </p>

          <p style="font-size:16px; margin-top:25px;">
            Warm regards,<br>
            <strong>Team SurveyZen</strong>
          </p>
        </div>

        <!-- Bottom Logo -->
        <div style="text-align:center; padding:20px 0;">
          <img src="https://surveyzen.live/logo1.png" alt="SurveyZen Logo" style="width:120px; opacity:0.85;" />
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



export const sendVerificationEmail = async (toEmail, name, token) => {
  const verifyUrl = `${process.env.PUBLIC_SITE_URL}/#verify/${token}`;

  return sendEmail({
    to: toEmail,
    subject: "Verify Your SurveyZen Account",
    html: `
    <div style="font-family: Arial, sans-serif; background:#f7f7f7; padding: 40px;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

        <!-- Logo Header -->
        <div style="text-align:center; padding:25px 0;">
          <img src="https://surveyzen.live/logo3.png" alt="SurveyZen Logo"
               style="width:150px; display:block; margin:0 auto;" />
        </div>

        <!-- Content -->
        <div style="padding: 30px 40px; color:#333;">
          <h2 style="margin:0 0 15px 0; font-size:24px; font-weight:600; text-align:center; color:#222;">
            Hi ${name}, Welcome to SurveyZen! 🎉
          </h2>

          <p style="font-size:16px; margin-bottom:16px;">
            Thank you for registering with SurveyZen. To complete your signup, please verify your account by clicking the button below.
          </p>

          <!-- CTA -->
          <div style="text-align:center; margin:32px 0;">
            <a href="${verifyUrl}"
              style="background:#4f46e5; color:#ffffff; text-decoration:none;
                     padding:14px 28px; border-radius:6px; font-size:16px; display:inline-block; font-weight:600;">
              Verify Account
            </a>
          </div>

          <p style="font-size:16px;">
            This verification link will expire in <strong>24 hours</strong> for your security.
          </p>

          <p style="font-size:16px; margin-top:25px;">
            If you did not create this account, please ignore this message.
          </p>

          <p style="font-size:16px; margin-top:25px;">
            Warm regards,<br>
            <strong>Team SurveyZen</strong>
          </p>
        </div>

        <!-- Bottom Logo -->
        <div style="text-align:center; padding:20px 0;">
          <img src="https://surveyzen.live/logo1.png" alt="SurveyZen Logo"
               style="width:120px; opacity:0.85;" />
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


export const sendResetPasswordEmail = async (toEmail, token) => {
  const resetUrl = `${process.env.PUBLIC_SITE_URL}/#reset-password/${token}`;

  return sendEmail({
    to: toEmail,
    subject: "Reset Your SurveyZen Password",
    html: `
    <div style="font-family: Arial, sans-serif; background:#f7f7f7; padding: 40px;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

        <!-- Logo Header -->
        <div style="text-align:center; padding:25px 0;">
          <img src="https://surveyzen.live/logo3.png" alt="SurveyZen Logo"
               style="width:150px; display:block; margin:0 auto;" />
        </div>

        <!-- Body -->
        <div style="padding: 30px 40px; color:#333;">
          <h2 style="margin-top:0; font-size:24px; font-weight:600; text-align:center; color:#222;">
            Password Reset Request
          </h2>

          <p style="font-size:16px; margin-bottom:16px;">
            We received a request to reset your SurveyZen account password. If you made this request, please click the button below to create a new password.
          </p>

          <!-- CTA Button -->
          <div style="text-align:center; margin:32px 0;">
            <a href="${resetUrl}"
              style="background:#e11d48; color:#ffffff; text-decoration:none;
                     padding:14px 28px; border-radius:6px; font-size:16px; display:inline-block; font-weight:600;">
              Reset Password
            </a>
          </div>

          <p style="font-size:16px;">
            ⚠ For security reasons, this link will expire in <strong>15 minutes</strong>.
          </p>

          <p style="font-size:16px; margin-top:25px;">
            If you did not request a password reset, please ignore this email. Your account will remain safe.
          </p>

          <p style="font-size:16px; margin-top:25px;">
            Warm regards,<br>
            <strong>Team SurveyZen</strong>
          </p>
        </div>

        <!-- Bottom Logo -->
        <div style="text-align:center; padding:20px 0;">
          <img src="https://surveyzen.live/logo1.png" alt="SurveyZen Logo"
               style="width:120px; opacity:0.85;" />
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
 * Sends contact form submission to admin/support email
 */
export const sendContactEmail = async ({ name, email, subject, message }) => {
  // Use CONTACT_EMAIL if set, otherwise fall back to BREVO_FROM_EMAIL
  // Note: The recipient email must be verified in Brevo or be the same as sender
  const adminEmail = process.env.CONTACT_EMAIL || process.env.BREVO_FROM_EMAIL;
  
  console.log(`Sending contact form email to: ${adminEmail}`);
  
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { email: process.env.BREVO_FROM_EMAIL },
        to: [{ email: adminEmail }],
        replyTo: { email: email, name: name },
        subject: `[Contact Form] ${subject} - from ${name}`,
        htmlContent: `
    <div style="font-family: Arial, sans-serif; background:#f7f7f7; padding: 40px;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

        <!-- Header -->
        <div style="background:#4f46e5; padding:25px; text-align:center;">
          <h1 style="color:#ffffff; margin:0; font-size:24px;">📬 New Contact Form Submission</h1>
        </div>

        <!-- Body -->
        <div style="padding: 30px 40px; color:#333;">
          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="padding:12px 0; border-bottom:1px solid #eee; font-weight:600; width:120px; color:#555;">Name:</td>
              <td style="padding:12px 0; border-bottom:1px solid #eee; color:#222;">${name}</td>
            </tr>
            <tr>
              <td style="padding:12px 0; border-bottom:1px solid #eee; font-weight:600; color:#555;">Email:</td>
              <td style="padding:12px 0; border-bottom:1px solid #eee;"><a href="mailto:${email}" style="color:#4f46e5;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding:12px 0; border-bottom:1px solid #eee; font-weight:600; color:#555;">Subject:</td>
              <td style="padding:12px 0; border-bottom:1px solid #eee; color:#222;">${subject}</td>
            </tr>
          </table>

          <div style="margin-top:25px;">
            <h3 style="color:#555; margin-bottom:10px; font-size:16px;">Message:</h3>
            <div style="background:#f9fafb; padding:20px; border-radius:8px; border:1px solid #e5e7eb; white-space:pre-wrap; line-height:1.6; color:#333;">${message}</div>
          </div>

          <div style="margin-top:30px; text-align:center;">
            <a href="mailto:${email}?subject=Re: ${subject}" 
              style="background:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:6px; font-size:14px; display:inline-block; font-weight:600;">
              Reply to ${name}
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#f2f2f2; text-align:center; padding:15px; font-size:13px; color:#666;">
          Received on ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
        </div>

      </div>
    </div>
    `
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Contact email sent successfully:", response.data);
    return { success: true };
  } catch (error) {
    console.error("Contact email error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Sends confirmation email to user after contact form submission
 */
export const sendContactConfirmationEmail = async (toEmail, name) => {
  return sendEmail({
    to: toEmail,
    subject: "We've Received Your Message - SurveyZen",
    html: `
    <div style="font-family: Arial, sans-serif; background:#f7f7f7; padding: 40px;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

        <!-- Header Logo -->
        <div style="text-align:center; padding:25px 0;">
          <img src="https://surveyzen.live/logo3.png" alt="SurveyZen Logo"
               style="width:150px; display:block; margin:0 auto;" />
        </div>

        <!-- Body -->
        <div style="padding: 30px 40px; color:#333;">
          <h2 style="margin-top:0; font-size:24px; font-weight:600; text-align:center; color:#222;">
            Thanks for Reaching Out, ${name}! ✉️
          </h2>

          <p style="font-size:16px; margin-bottom:16px;">
            We've received your message and appreciate you taking the time to contact us.
          </p>

          <p style="font-size:16px; margin-bottom:16px;">
            Our team typically responds within <strong>24-48 hours</strong> during business days. We'll get back to you as soon as possible at this email address.
          </p>

          <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:20px; margin:25px 0;">
            <p style="margin:0; font-size:15px; color:#0369a1;">
              💡 <strong>Quick Tip:</strong> While you wait, check out our <a href="https://surveyzen.live/#pricing" style="color:#0369a1;">pricing page</a> for the latest features and plans.
            </p>
          </div>

          <p style="font-size:16px; margin-top:25px;">
            Warm regards,<br>
            <strong>Team SurveyZen</strong>
          </p>
        </div>

        <!-- Bottom Logo -->
        <div style="text-align:center; padding:20px 0;">
          <img src="https://surveyzen.live/logo1.png" alt="SurveyZen Logo"
               style="width:120px; opacity:0.85;" />
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
 * Sends interview invitation email
 */
export const sendInterviewInvitation = async ({ toEmail, participantName, interviewTitle, scheduledAt, duration, hostName, hostEmail, interviewId }) => {
  const scheduleDate = new Date(scheduledAt);
  const formattedDate = scheduleDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = scheduleDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  return sendEmail({
    to: toEmail,
    subject: `📅 Interview Invitation: ${interviewTitle} - SurveyZen`,
    html: `
    <div style="font-family: Arial, sans-serif; background:#f7f7f7; padding: 40px;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

        <div style="text-align:center; padding:20px 0; background:#ffffff;">
          <img src="https://surveyzen.live/logo3.png" alt="SurveyZen Logo" style="width:150px; height:auto; display:block; margin:0 auto;" />
        </div>

        <div style="padding: 30px 40px; color:#333333;">
          <h2 style="margin-top:0; font-size:24px; font-weight:600; text-align:center; color:#222;">
            You're Invited to an Interview! 🎯
          </h2>

          <p style="font-size:16px; margin-bottom:16px;">
            Hi ${participantName},
          </p>

          <p style="font-size:16px; margin-bottom:16px;">
            <strong>${hostName}</strong> has invited you to an interview on SurveyZen.
          </p>

          <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:8px; padding:20px; margin:25px 0;">
            <h3 style="margin:0 0 15px 0; color:#166534; font-size:18px;">📋 Interview Details</h3>
            <p style="margin:5px 0; font-size:15px;"><strong>Title:</strong> ${interviewTitle}</p>
            <p style="margin:5px 0; font-size:15px;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin:5px 0; font-size:15px;"><strong>Time:</strong> ${formattedTime}</p>
            <p style="margin:5px 0; font-size:15px;"><strong>Duration:</strong> ${duration} minutes</p>
            <p style="margin:5px 0; font-size:15px;"><strong>Host:</strong> ${hostName} (${hostEmail})</p>
          </div>

          <div style="text-align:center; margin:32px 0;">
            <a href="https://surveyzen.live/#interview-dashboard" 
              style="background:#10b981; color:#ffffff; text-decoration:none; padding:14px 28px; border-radius:6px; font-size:16px; display:inline-block; font-weight:600;">
              View Interview in Dashboard
            </a>
          </div>

          <p style="font-size:14px; color:#666; margin-top:20px; text-align:center;">
            ⚠️ You can join the interview 15 minutes before the scheduled time.<br>
            Make sure to log in with this email address: <strong>${toEmail}</strong>
          </p>

          <p style="font-size:16px; margin-top:32px;">
            Best of luck! 🍀<br>
            <strong>Team SurveyZen</strong>
          </p>
        </div>

        <div style="text-align:center; padding:20px 0;">
          <img src="https://surveyzen.live/logo1.png" alt="SurveyZen Logo" style="width:120px; height:auto; opacity:0.85;" />
        </div>

        <div style="background:#f2f2f2; text-align:center; padding:15px; font-size:13px; color:#666;">
          © ${new Date().getFullYear()} SurveyZen. All rights reserved.
        </div>

      </div>
    </div>
    `
  });
};

/**
 * Sends interview reminder email
 */
export const sendInterviewReminder = async ({ toEmail, participantName, interviewTitle, scheduledAt, minutesBefore, hostName }) => {
  const scheduleDate = new Date(scheduledAt);
  const formattedDate = scheduleDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = scheduleDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  const reminderText = minutesBefore >= 60 
    ? `${Math.floor(minutesBefore / 60)} hour${minutesBefore >= 120 ? 's' : ''}` 
    : `${minutesBefore} minutes`;

  return sendEmail({
    to: toEmail,
    subject: `⏰ Reminder: Interview "${interviewTitle}" starts in ${reminderText} - SurveyZen`,
    html: `
    <div style="font-family: Arial, sans-serif; background:#f7f7f7; padding: 40px;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

        <div style="text-align:center; padding:20px 0; background:#ffffff;">
          <img src="https://surveyzen.live/logo3.png" alt="SurveyZen Logo" style="width:150px; height:auto; display:block; margin:0 auto;" />
        </div>

        <div style="padding: 30px 40px; color:#333333;">
          <h2 style="margin-top:0; font-size:24px; font-weight:600; text-align:center; color:#222;">
            ⏰ Interview Reminder
          </h2>

          <p style="font-size:16px; margin-bottom:16px;">
            Hi ${participantName},
          </p>

          <p style="font-size:16px; margin-bottom:16px;">
            This is a friendly reminder that your interview <strong>"${interviewTitle}"</strong> with ${hostName} starts in <strong>${reminderText}</strong>.
          </p>

          <div style="background:#fef3c7; border:1px solid #fcd34d; border-radius:8px; padding:20px; margin:25px 0;">
            <p style="margin:5px 0; font-size:15px;"><strong>📅 Date:</strong> ${formattedDate}</p>
            <p style="margin:5px 0; font-size:15px;"><strong>🕐 Time:</strong> ${formattedTime}</p>
          </div>

          <div style="text-align:center; margin:32px 0;">
            <a href="https://surveyzen.live/#interview-dashboard" 
              style="background:#f59e0b; color:#ffffff; text-decoration:none; padding:14px 28px; border-radius:6px; font-size:16px; display:inline-block; font-weight:600;">
              Go to Interview Dashboard
            </a>
          </div>

          <p style="font-size:14px; color:#666; margin-top:20px; text-align:center;">
            Make sure your camera and microphone are working properly before joining.
          </p>

          <p style="font-size:16px; margin-top:32px;">
            Good luck! 🍀<br>
            <strong>Team SurveyZen</strong>
          </p>
        </div>

        <div style="text-align:center; padding:20px 0;">
          <img src="https://surveyzen.live/logo1.png" alt="SurveyZen Logo" style="width:120px; height:auto; opacity:0.85;" />
        </div>

        <div style="background:#f2f2f2; text-align:center; padding:15px; font-size:13px; color:#666;">
          © ${new Date().getFullYear()} SurveyZen. All rights reserved.
        </div>

      </div>
    </div>
    `
  });
};
