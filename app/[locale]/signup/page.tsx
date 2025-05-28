"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FcGoogle } from "react-icons/fc";
import { useTranslations } from "next-intl";
import { auth } from "../../lib/firebase";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { db } from "../../lib/firebase";
import { doc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";

export default function SignupPage() {
    const router = useRouter();
    const t = useTranslations("signup");

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const searchParams = useSearchParams();
    const projectId = searchParams.get("projectId");
    const invitedEmail = searchParams.get("email");

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                firstName,
                lastName,
                email
            });

            if (projectId && invitedEmail === email) {
                const projectRef = doc(db, "projects", projectId);
                await updateDoc(projectRef, {
                    collaborators: arrayUnion(email)
                });
            }

            router.push(projectId ? "/task-organizer" : "/focus");
        } catch (error: any) {
            console.error(error.message);
            if (error.code === "auth/email-already-in-use") {
                setError("Email is already in use");
            } else {
                setError("An error occurred while creating your account");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setGoogleLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            await setDoc(doc(db, "users", user.uid), {
                firstName: user.displayName?.split(" ")[0] || "User",
                lastName: user.displayName?.split(" ")[1] || "",
                email: user.email
            });

            if (projectId && invitedEmail === user.email) {
                const projectRef = doc(db, "projects", projectId);
                await updateDoc(projectRef, {
                    collaborators: arrayUnion(user.email)
                });
            }

            router.push(projectId ? "/task-organizer" : "/focus");
        } catch (error: any) {
            console.error("Google Signup Error:", error);
            setError(error.message || "Failed to sign up with Google");
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-sm bg-white p-4 rounded-xl shadow-lg">
                
                {googleLoading && (
                    <div className="fixed inset-0 bg-white bg-opacity-60 flex items-center justify-center z-50">
                        <div className="loading loading-spinner text-dark-500"></div>
                        <p className="ml-2 text-dark-500">Signing you up...</p>
                    </div>
                )}

                <img src="/bee-hive.png" alt="Logo" width={64} height={64} className="mx-auto" />
                <h2 className="text-xl font-bold text-center text-gray-800 mt-4">{t("signUp")}</h2>
                <form className="mt-6" onSubmit={handleSignup}>
                    <div>
                        <input
                            name="firstName"
                            className="w-full p-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                            placeholder={t("firstName")}
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mt-2">
                        <input
                            name="lastName"
                            className="w-full p-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                            placeholder={t("lastName")}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mt-2">
                        <input
                            type="email"
                            className="w-full p-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                            placeholder={t("email")}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative mt-2">
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

                    <div className=" mt-2">
                        <input
                            type="password"
                            className="w-full p-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-400 text-sm"
                            placeholder={t("confirmPassword")}
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); }}
                            required
                        />
                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-5 bg-dark-500 text-white p-2 rounded-lg hover:bg-gray-700 text-base flex items-center justify-center"
                    >
                        {loading ? (
                            <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                            t("createacc")
                        )}
                    </button>
                </form>

                <p className="mt-4 text-center text-dark-500 text-sm">
                    {t("alreadyacc")}
                    <a href="/login" className="text-dark-500 underline ml-2">{t("logIn")}</a>
                </p>

                <div className="relative flex items-center my-4">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="px-3 text-gray-500 text-sm">{t("or")}</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <div className="mt-4 flex justify-center">
                    <button
                        onClick={handleGoogleSignup}
                        disabled={googleLoading}
                        className="w-full flex items-center justify-center gap-2 border border-dark-100 p-2 rounded-lg hover:bg-gray-100"
                    >
                        {googleLoading ? (
                            <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                            <>
                                <FcGoogle className="text-xl" />
                                <span className="text-sm">Sign Up with Google</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
