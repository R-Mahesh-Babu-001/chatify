import { resendClient, sender } from "../lib/resend.js";
import { createWelcomeEmailTemplate, createOtpEmailTemplate } from "../emails/emailTemplates.js";

export const sendWelcomeEmail = async (email, name, clientURL) => {
  if (!resendClient || !sender.email) {
    console.log("Skipping welcome email: Resend is not configured");
    return;
  }

  const { data, error } = await resendClient.emails.send({
    from: `${sender.name} <${sender.email}>`,
    to: email,
    subject: "Welcome to Chatify!",
    html: createWelcomeEmailTemplate(name, clientURL),
  });

  if (error) {
    console.error("Error sending welcome email:", error);
    throw new Error("Failed to send welcome email");
  }

  console.log("Welcome Email sent successfully", data);
};

export const sendOtpEmail = async (email, otp) => {
  if (!resendClient || !sender.email) {
    throw new Error("Resend is not configured");
  }

  const { data, error } = await resendClient.emails.send({
    from: `${sender.name} <${sender.email}>`,
    to: email,
    subject: "Your Chatify OTP Code",
    html: createOtpEmailTemplate(otp),
  });

  if (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send OTP email");
  }

  console.log("OTP Email sent successfully", data);
};
