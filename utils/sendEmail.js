const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create a transporter (the service that will send the email, e.g., Gmail)
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 2. Define the email options
  const mailOptions = {
    from: 'SAKEC News <your-email@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: // You can also send HTML content
  };

  // 3. Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
