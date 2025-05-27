"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import ProfileImage from "../components/ProfileImage";

const Navbar: React.FC = () => {
    const t = useTranslations("navbar");
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [userName, setUserName] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const router = useRouter();
    const [isEditingName, setIsEditingName] = useState(false);
    const [newFirstName, setNewFirstName] = useState("");
    const [newLastName, setNewLastName] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserEmail(user.email || "");

                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserName(`${data.firstName} ${data.lastName}`);
                }
            } else {
                setUserName(""); //ออกจากระบบแล้วล้าง
                setUserEmail("");
            }
        });

        return () => unsubscribe();
    }, []);

    const toggleProfile = () => {
        setIsProfileOpen(!isProfileOpen);
    };

    const handleEditName = () => {
    setIsEditingName(true);
    const [first = "", last = ""] = userName.split(" ");
    setNewFirstName(first);
    setNewLastName(last);
    };

    const handleSaveName = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                firstName: newFirstName,
                lastName: newLastName,
            });
            setUserName(`${newFirstName} ${newLastName}`);
            setIsEditingName(false);
        } catch (error) {
            console.error("Error updating name:", error);
        }
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
                        <div
                            tabIndex={0}
                            role="button"
                            className="btn btn-ghost btn-circle avatar"
                            onClick={toggleProfile}
                        >
                            {/* ✅ แสดงตัวอักษรย่อแทนรูปโปร */}
                            <ProfileImage email={userEmail} />
                        </div>

                        {isProfileOpen && (
                            <ul tabIndex={0} className="menu menu-sm dropdown-content rounded-box z-10 mt-3 w-52 p-2 shadow-lg bg-white text-black">
                                <div className="text-center mb-3">
                                {isEditingName ? (
                                    <>
                                    <input
                                        className="input input-bordered w-full mb-1 text-sm"
                                        value={newFirstName}
                                        onChange={(e) => setNewFirstName(e.target.value)}
                                        placeholder="First name"
                                    />
                                    <input
                                        className="input input-bordered w-full mb-2 text-sm"
                                        value={newLastName}
                                        onChange={(e) => setNewLastName(e.target.value)}
                                        placeholder="Last name"
                                    />
                                    <button className="btn btn-sm btn-primary w-full mb-1" onClick={handleSaveName}>
                                        {t('save')}
                                    </button>
                                    <button className="btn btn-sm w-full" onClick={() => setIsEditingName(false)}>
                                        {t('cancel')}
                                    </button>
                                    </>
                                ) : (
                                    <>
                                    <span className="text-base font-bold">{userName || "Person"}</span>
                                    <button className="btn btn-sm mt-2 w-full" onClick={handleEditName}>
                                        {t('edit_name')}
                                    </button>
                                    </>
                                )}
                                </div>
                                
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