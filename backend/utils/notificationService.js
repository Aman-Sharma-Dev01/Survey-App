// import nodemailer from 'nodemailer';
// import dotenv from 'dotenv';
// dotenv.config();

// // --- BREVO SMTP CONFIGURATION ---
// const transporter = nodemailer.createTransport({
//     host: process.env.BREVO_SMTP_HOST,
//     port: process.env.BREVO_SMTP_PORT,
//     secure: false, // Port 587 = false
//     auth: {
//         user: process.env.BREVO_SMTP_USER,
//         pass: process.env.BREVO_SMTP_PASS,
//     },
// });

// /**
//  * Sends a welcome email after registration.
//  */
// export const sendRegistrationEmail = async (toEmail, name) => {
//     const mailOptions = {
//         from: `SurveyZen Support <${process.env.BREVO_FROM_EMAIL}>`,
//         to: toEmail,
//         subject: 'Welcome to SurveyZen! Your Account is Ready',
//         html: `
//             <div style="font-family: Arial, sans-serif; line-height: 1.6;">
//                 <h2>Welcome, ${name}!</h2>
//                 <p>Thank you for registering your creator account with SurveyZen.</p>
//                 <p>You can now log in and start building your first survey.</p>
//                 <p>We’re excited to help you collect valuable feedback.</p>
//                 <p>Best regards,<br>The SurveyZen Team</p>
//             </div>
//         `,
//     };

//     try {
//         await transporter.sendMail(mailOptions);
//         console.log(`[Email] Registration email sent to ${toEmail}`);
//     } catch (error) {
//         console.error(`[Email Error] Failed to send registration email:`, error.message);
//     }
// };

// /**
//  * Sends email when a new survey is created.
//  */
// export const sendNewSurveyEmail = async (toEmail, surveyTitle) => {
//     const mailOptions = {
//         from: `SurveyZen Notifications <${process.env.BREVO_FROM_EMAIL}>`,
//         to: toEmail,
//         subject: `Survey Created: "${surveyTitle}"`,
//         html: `
//             <div style="font-family: Arial, sans-serif; line-height: 1.6;">
//                 <h2>Your Survey Has Been Created</h2>
//                 <p>Your new survey <strong>"${surveyTitle}"</strong> is now in draft mode.</p>
//                 <p>You can review the questions and publish it anytime.</p>
//                 <p>Happy surveying!</p>
//                 <p>The SurveyZen Team</p>
//             </div>
//         `,
//     };

//     try {
//         await transporter.sendMail(mailOptions);
//         console.log(`[Email] Survey creation notification sent to ${toEmail}`);
//     } catch (error) {
//         console.error(`[Email Error] Failed to send survey email:`, error.message);
//     }
// };
