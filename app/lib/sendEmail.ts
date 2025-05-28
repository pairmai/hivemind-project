import emailjs from '@emailjs/browser';

export const sendEmail = async (params: {
    name: string; email: string ,projectId: String, inviteEmail: String
}) => {

  try {
    const result = await emailjs.send(
      'service_vjnahkb',
      'template_chseniw',
      params,
      'YCsCzRLGryUgLPht_' 
    );
    console.log("✅ Email sent:", result.text);
  } catch (error) {
    console.error("❌ Failed to send email:", error);
  }
};