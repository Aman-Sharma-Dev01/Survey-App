import nodemailer from 'nodemailer';

// --- EMAIL CONFIGURATION (Zoho Mail) ---
const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465, // Use 465 for secure SMTP
    secure: true, 
    auth: {
        user: process.env.ZOHO_EMAIL_USER,
        pass: process.env.ZOHO_EMAIL_PASS,
    },
});

/**
 * Sends a welcome email upon successful user registration.
 * @param {string} toEmail - The recipient's email address.
 * @param {string} name - The user's name.
 */
export const sendRegistrationEmail = async (toEmail, name) => {
    const mailOptions = {
        from: `SurveyZen Support <${process.env.ZOHO_EMAIL_USER}>`,
        to: toEmail,
        subject: 'Welcome to SurveyZen! Your Account is Ready',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Welcome, ${name}!</h2>
                <p>Thank you for registering your creator account with SurveyZen. You can now log in and start building your first survey.</p>
                <p>We are excited to help you collect anonymous and insightful feedback.</p>
                <p>If you need any support, please contact us at ${process.env.ZOHO_EMAIL_USER}.</p>
                <p>Best regards,<br>The SurveyZen Team</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email] Registration email sent to ${toEmail}`);
    } catch (error) {
        console.error(`[Email Error] Failed to send registration email to ${toEmail}:`, error.message);
    }
};

/**
 * Sends a notification email when a new survey is created.
 * @param {string} toEmail - The creator's email address.
 * @param {string} surveyTitle - The title of the new survey.
 */
export const sendNewSurveyEmail = async (toEmail, surveyTitle) => {
    const mailOptions = {
        from: `SurveyZen Notifications <${process.env.ZOHO_EMAIL_USER}>`,
        to: toEmail,
        subject: `Survey Created: "${surveyTitle}"`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Success! Your Survey Has Been Drafted.</h2>
                <p>Your new survey, <strong>"${surveyTitle}"</strong>, has been successfully created in draft mode.</p>
                <p>Please log into your SurveyZen dashboard to review the questions and click 'Publish' to make it live and start collecting responses.</p>
                <p>Happy surveying!</p>
                <p>The SurveyZen Team</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email] Survey creation confirmation sent to ${toEmail}`);
    } catch (error) {
        console.error(`[Email Error] Failed to send survey creation email to ${toEmail}:`, error.message);
    }
};