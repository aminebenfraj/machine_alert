const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // Use TLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Send an email notification
 * @param {string} recipient - Recipient's email
 * @param {string} subject - Email subject
 * @param {string} html - Email body in HTML format
 */
const sendEmail = async (recipient, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Admin" <${process.env.EMAIL_USER}>`,
            to: recipient,
            subject: subject,
            html: html
        });

        console.log("📧 Email sent: ", info.messageId);
    } catch (error) {
        console.error("❌ Error sending email: ", error);
    }
};

module.exports = sendEmail;
