"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "next-intl";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [inviteEmail, setInviteEmail] = useState<string | null>(null);

    // Check for invite email and localStorage when page loads
    useEffect(() => {
        const inviteEmailParam = searchParams.get("email");
        if (inviteEmailParam) {
            setInviteEmail(inviteEmailParam);
            setEmail(inviteEmailParam);
        }

        const savedEmail = localStorage.getItem("email");
        const savedPassword = localStorage.getItem("password");
        const savedRememberMe = localStorage.getItem("rememberMe") === "true";
        
        if (savedEmail && savedRememberMe && !inviteEmailParam) {
            setEmail(savedEmail);
            setPassword(savedPassword || "");
            setRememberMe(savedRememberMe);
        }
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await signInWithEmailAndPassword(auth, email, password);

            // หลังล็อกอินสำเร็จแล้ว เช็คว่าเรามี projectId ไหม (จาก searchParams)
            const projectId = searchParams.get("projectId");
            if (projectId) {
                const projectRef = doc(db, "projects", projectId);
                const projectSnap = await getDoc(projectRef);

                if (projectSnap.exists()) {
                    const projectData = projectSnap.data();
                    const collaborators = projectData.collaborators || [];
                    const invitedEmails = projectData.invitedEmails || [];

                    // เพิ่ม user เข้า collaborators (ถ้ายังไม่มี)
                    if (!collaborators.includes(email)) {
                        await updateDoc(projectRef, {
                            collaborators: arrayUnion(email),
                        });
                    }

                    // ถ้า user เป็น collaborator แล้ว และยังอยู่ใน invitedEmails ให้ลบออก
                    if (collaborators.includes(email) && invitedEmails.includes(email)) {
                        await updateDoc(projectRef, {
                            invitedEmails: arrayRemove(email),
                        });
                    }
                }
            }

            if (rememberMe) {
                localStorage.setItem("email", email);
                localStorage.setItem("password", password);
                localStorage.setItem("rememberMe", "true");
            } else {
                localStorage.removeItem("email");
                localStorage.removeItem("password");
                localStorage.removeItem("rememberMe");
            }

            // Redirect ไปหน้า invite ถ้ามี inviteEmail
            if (inviteEmail) {
                router.push(`/invite?email=${inviteEmail}&projectId=${projectId}`);
            } else {
                router.push("/dashboard");
            }
        } catch (error) {
            setErrorMessage("Invalid email or password");
            console.error(error);
        }
    };


    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
                <img src="/bee-hive.png" alt="Logo" width={72} height={72} className="mx-auto" />
                <h2 className="text-2xl font-bold text-center text-gray-800 mt-4">{t("welcome")}</h2>
                {inviteEmail && (
                    <p className="text-sm text-center text-blue-600 mt-2">
                        You've been invited to collaborate. Please login with {inviteEmail}
                    </p>
                )}
                <form className="mt-6" onSubmit={handleLogin}>
                    <div>
                        <input
                            type="email"
                            className="w-full p-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                            placeholder={t("email")}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative mt-4">
                        <input
                            type={showPassword ? "text" : "password"}
                            className="w-full p-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                            placeholder={t("password")}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-3 flex items-center text-dark-300 text-sm">
                            <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
                        </button>
                    </div>

                    {errorMessage && (
                        <p className="text-red text-sm mt-2">{errorMessage}</p>
                    )}

                    <div className="flex relative items-center mt-5">
                        <input
                            type="checkbox"
                            id="rememberMe"
                            className="w-3 h-3 accent-blue cursor-pointer"
                            checked={rememberMe}
                            onChange={() => setRememberMe(!rememberMe)}
                        />
                        <label htmlFor="rememberMe" className="ml-2 text-sm text-dark-400 cursor-pointer">
                            {t("remember")}
                            <a href="/forgot-password" className="absolute inset-y-0 right-3 text-dark-400 underline">{t("forgotPassword")}</a>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="w-full mt-5 bg-dark-500 text-white p-2 rounded-lg hover:bg-grey-700 text-base">
                        {t("logIn")}
                    </button>
                </form>

                <p className="mt-5 text-center text-dark-500 text-sm">
                    {t("donthaveacc")}
                    <a href={`/signup${inviteEmail ? `?email=${inviteEmail}&projectId=${searchParams.get("projectId")}` : ''}`} 
                       className="text-dark-500 underline ml-2">
                        {t("signUp")}
                    </a>
                </p>
            </div>
        </div>
    );
}
