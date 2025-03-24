"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FcGoogle } from "react-icons/fc";
import { useTranslations } from "next-intl";


export default function LoginPage() {
    const router = useRouter();
    const t = useTranslations("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (email === "newuser@example.com") {
            router.push("/focus");
        } else {
            router.push("/dashboard");
        }
    };

    const handleGoogleLogin = () => {
        console.log("Google Login Clicked");
        // TODO: เชื่อม Google OAuth
    };


    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
                <img src="/bee-hive.png" alt="Logo" width={72} height={72} className="mx-auto" />
                <h2 className="text-2xl font-bold text-center text-gray-800 mt-4">Welcome Back!</h2>
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
                        className="w-full mt-5 bg-dark-500 text-white p-2 rounded-lg hover:bg-black text-base">
                        {t("logIn")}
                    </button>
                </form>

                <p className="mt-5 text-center text-black text-sm">
                    {t("donthaveacc")}
                    <a href="/signup" className="text-black underline ml-2">{t("signUp")}</a>
                </p>

                <div className="relative flex items-center my-4">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="px-3 text-gray-500 text-sm">{t("or")}</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <div className="mt-4 flex justify-center">
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-2 border border-dark-100 p-2 rounded-lg hover:bg-gray-100"
                    >
                        <FcGoogle className="text-xl" />
                        <span className="text-sm">Continue with Google</span>
                    </button>
                </div>
            </div>
        </div>
    );
}