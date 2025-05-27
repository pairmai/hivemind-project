"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useTranslations } from "next-intl";

export default function ForgotPasswordPage() {
    const t = useTranslations("forgotPassword");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage("Password reset email sent. Please check your inbox.");
            setError("");
        } catch (err) {
            setError("Failed to send reset email. Please check the email.");
            setMessage("");
            console.error(err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-center text-gray-800">{t('forgotPass')}</h2>
                <form className="mt-6" onSubmit={handleReset}>
                    <input
                        type="email"
                        className="w-full p-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                        placeholder={t('email')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    {message && <p className="text-green-600 text-sm mt-2">{message}</p>}
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    <button
                        type="submit"
                        className="w-full mt-5 bg-dark-500 text-white p-2 rounded-lg hover:bg-grey-700 text-base">
                        {t('reset')}
                    </button>
                </form>
            </div>
        </div>
    );
}
