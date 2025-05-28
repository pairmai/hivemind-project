"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (email: string) => {
    console.log("🔑 RESEND_API_KEY:", process.env.RESEND_API_KEY); 
    console.log("ส่งเมลไปที่:", email);

    try{
    await resend.emails.send({
        to: email,
        from: "onboarding@resend.dev",
        subject: "You’ve been invited to a project!",
        html: `<p>Hello, you’ve been invited to join a project on Hivemind.</p>`,
    });
    console.log("ส่งเมลสำเร็จ");
    } catch (error) {
        console.error("ส่งเมลล้มเหลว:", error);
    }
}