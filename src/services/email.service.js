
require("dotenv").config();

const nodemailer = require("nodemailer");


// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});


// Check email connection
transporter.verify((error, success) => {
  if (error) {
    console.error("Error connecting to email server:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});


// Generic function to send email
const sendEmail = async (to, subject, text, html) => {
  try {

    const info = await transporter.sendMail({
      from: `"Backend-Legend" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: html,
    });

    console.log("Email sent successfully:", info.messageId);

    return info;

  } catch (error) {

    console.error("Error sending email:", error);

    throw error;
  }
};


// Registration email
const sendRegistrationEmail = async (userEmail, name) => {

  const subject = "Welcome to Backend-Legend";

  const text = `
Hello ${name},

Thank you for registering with Backend-Legend.

Your account has been successfully created.

Regards,
Backend-Legend
`;

  const html = `
    <h2>Welcome to Backend-Legend!</h2>

    <p>Hello <strong>${name}</strong>,</p>

    <p>
      Thank you for registering with Backend-Legend.
    </p>

    <p>
      Your account has been successfully created.
    </p>

    <br>

    <p>
      Regards,<br>
      <strong>Backend-Legend</strong>
    </p>
  `;

  await sendEmail(
    userEmail,
    subject,
    text,
    html
  );
};


// Transaction email
const sendTransactionEmail = async (
  userEmail,
  name,
  amount,
  transactionId,
  type
) => {

  let subject;
  let text;
  let html;


  // =========================
  // SENDER
  // =========================

  if (type === "SENDER") {

    subject = "Transaction Successful";

    text = `
Hello ${name},

Your transaction was successful.

Amount: ₹${amount}

Transaction ID: ${transactionId}

Status: COMPLETED

₹${amount} has been successfully transferred from your account.

Regards,
Backend-Legend
`;

    html = `
      <h2>Transaction Successful</h2>

      <p>Hello <strong>${name}</strong>,</p>

      <p>
        Your transaction was successfully completed.
      </p>

      <hr>

      <p>
        <strong>Amount:</strong> ₹${amount}
      </p>

      <p>
        <strong>Transaction ID:</strong> ${transactionId}
      </p>

      <p>
        <strong>Status:</strong> COMPLETED
      </p>

      <p>
        ₹${amount} has been successfully transferred
        from your account.
      </p>

      <br>

      <p>
        Regards,<br>
        <strong>Backend-Legend</strong>
      </p>
    `;
  }


  // =========================
  // RECEIVER
  // =========================

  else if (type === "RECEIVER") {

    subject = "Money Received";

    text = `
Hello ${name},

You have received money in your account.

Amount: ₹${amount}

Transaction ID: ${transactionId}

Status: COMPLETED

₹${amount} has been successfully credited to your account.

Regards,
Backend-Legend
`;

    html = `
      <h2>Money Received</h2>

      <p>Hello <strong>${name}</strong>,</p>

      <p>
        You have received money in your account.
      </p>

      <hr>

      <p>
        <strong>Amount:</strong> ₹${amount}
      </p>

      <p>
        <strong>Transaction ID:</strong> ${transactionId}
      </p>

      <p>
        <strong>Status:</strong> COMPLETED
      </p>

      <p>
        ₹${amount} has been successfully credited
        to your account.
      </p>

      <br>

      <p>
        Regards,<br>
        <strong>Backend-Legend</strong>
      </p>
    `;
  }


  else {
    throw new Error("Invalid transaction email type");
  }


  await sendEmail(
    userEmail,
    subject,
    text,
    html
  );
};


// Export functions
module.exports = {
  sendEmail,
  sendRegistrationEmail,
  sendTransactionEmail,
};

