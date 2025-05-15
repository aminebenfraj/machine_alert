const nodemailer = require("nodemailer");
const User = require("../models/UserModel");

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === "465", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to get all users with LOGISTICA role
const getLogisticaUsers = async () => {
  try {
    const users = await User.find({
      roles: { $in: ["LOGISTICA"] },
    });
    return users;
  } catch (error) {
    console.error("Error fetching LOGISTICA users:", error);
    return [];
  }
};

// Function to send email notification about a new call
const sendCallCreationEmail = async (call, machineName) => {
  try {
    // Get all users with LOGISTICA role
    const logisticaUsers = await getLogisticaUsers();
    
    if (logisticaUsers.length === 0) {
      console.log("No LOGISTICA users found to send email to");
      return;
    }
    
    // Extract emails
    const emails = logisticaUsers.map(user => user.email);
    
    // Format date and time
    const formattedDate = new Date(call.callTime).toLocaleDateString();
    const formattedTime = new Date(call.callTime).toLocaleTimeString();
    
    // Email content
    const mailOptions = {
      from: `"Machine Alert System" <${process.env.EMAIL_USER}>`,
      to: emails.join(", "),
      subject: `🚨 New Call Created for Machine ${machineName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #d32f2f; margin-bottom: 20px;">New Call Alert</h2>
          <p>A new call has been created with the following details:</p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Machine</th>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>${machineName}</strong></td>
            </tr>
            <tr>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Date</th>
              <td style="padding: 10px; border: 1px solid #ddd;">${formattedDate}</td>
            </tr>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Time</th>
              <td style="padding: 10px; border: 1px solid #ddd;">${formattedTime}</td>
            </tr>
            <tr>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Duration</th>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>${call.duration} minutes</strong></td>
            </tr>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Created By</th>
              <td style="padding: 10px; border: 1px solid #ddd;">${call.createdBy}</td>
            </tr>
            <tr>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Status</th>
              <td style="padding: 10px; border: 1px solid #ddd;">${call.status}</td>
            </tr>
          </table>
          <p style="color: #d32f2f; font-weight: bold;">Please attend to this call as soon as possible.</p>
          <p style="font-size: 12px; color: #757575; margin-top: 30px;">This is an automated message from the Machine Alert System. Please do not reply to this email.</p>
        </div>
      `,
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email notification sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending call creation email:", error);
    throw error;
  }
};

module.exports = {
  sendCallCreationEmail,
};
