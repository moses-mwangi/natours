const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: "45fb3940ab7dd4",
      pass: "********1889",
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: "moses <mungai@gmail.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
