"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

const Navbar: React.FC = () => {
    const t = useTranslations("navbar");
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [userName, setUserName] = useState("");
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserName(`${data.firstName} ${data.lastName}`);
                }
            } else {
                setUserName(""); // ออกจากระบบแล้วล้างชื่อ
            }
        });

        return () => unsubscribe();
    }, []);

    const toggleProfile = () => {
        setIsProfileOpen(!isProfileOpen);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <nav className="fixed top-0 z-50 w-full border-b bg-white border-gray-200 text-black transition-all duration-300">
            <div className="navbar shadow-sm">
                <div className="flex-1">
                    <img src="/bee-hive.png" alt="Logo" className="w-8 h-8 ml-4 mr-4" />
                    <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap">
                        HIVEMIND
                    </span>
                </div>
                <div className="flex-none">
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar" onClick={toggleProfile}>
                            <div className="w-10 rounded-full">
                                <img
                                    alt="Profile"
                                    src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
                            </div>
                        </div>

                        {isProfileOpen && (
                            <ul tabIndex={0} className="menu menu-sm dropdown-content rounded-box z-10 mt-3 w-52 p-2 shadow-lg bg-white text-black">
                                <span className="text-base font-bold text-center mb-3">{userName || "Person"}</span> {/* ✅ แสดงชื่อ */}
                                <div className="flex flex-wrap gap-2 mb-2 justify-center">
                                    <span className="text-xs bg-black text-white px-4 py-1 rounded-full">
                                        IT
                                    </span>
                                    <span className="text-xs bg-black text-white px-4 py-1 rounded-full">
                                        Frontend
                                    </span>
                                </div>
                                <li>
                                    <a className="justify-between text-sm hover:bg-gray-100 rounded-md p-2">
                                        {t("profile")}
                                    </a>
                                </li>
                                <li>
                                    <button
                                        onClick={handleLogout}
                                        className="justify-between text-sm hover:bg-gray-100 rounded-md p-2 w-full text-left"
                                    >
                                        {t("logout")}
                                    </button>
                                </li>
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;