"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FcGoogle } from "react-icons/fc";
import { useTranslations } from "next-intl"; 

export default function SignupPage() {

    const router = useRouter();
    const t = useTranslations("signup");
    // const { language, toggleLanguage } = useLanguage();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        router.push("/focus");
    };

    const handleGoogleSignup = () => {
        console.log("Google Signup Clicked");
        // TODO: เชื่อม Google OAuth
    };

    // const toggleLanguage = () => {
    //     const newLanguage = language === "en" ? "th" : "en";
    //     setLanguage(newLanguage);
    //     i18n.changeLanguage(newLanguage); // เปลี่ยนภาษา
    // };


    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">

            {/* <button
                onClick={toggleLanguage}
                className="absolute top-4 left-4 flex items-center p-2 bg-white rounded-full shadow-md hover:bg-gray-200 text-sm"
            >
                <FontAwesomeIcon icon={faGlobe} className="mr-2 " />
                <span>{language === "en" ? "English" : "ไทย"}</span>
            </button> */}

            <div className="w-full max-w-sm bg-white p-4 rounded-xl shadow-lg">
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
                        className="w-full mt-5 bg-dark-500 text-white p-2 rounded-lg hover:bg-dark-600 text-base">
                        {t("createacc")}
                    </button>
                </form>

                <p className="mt-4 text-center text-dark-600 text-sm">
                    {t("alreadyacc")}
                    <a href="/login" className="text-dark-600 underline ml-2">{t("logIn")}</a>
                </p>

                <div className="relative flex items-center my-4">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="px-3 text-gray-500 text-sm">{t("or")}</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <div className="mt-4 flex justify-center">
                    <button
                        onClick={handleGoogleSignup}
                        className="w-full flex items-center justify-center gap-2 border border-dark-100 p-2 rounded-lg hover:bg-gray-100"
                    >
                        <FcGoogle className="text-xl" />
                        <span className="text-sm">Sign Up with Google</span>
                    </button>
                </div>
            </div>
        </div>
    );
}