"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import ProfileImage from "../components/ProfileImage";

const Navbar: React.FC = () => {
    const t = useTranslations('navbar');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [userName, setUserName] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [userId, setUserId] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                setUserEmail(user.email || "");

                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setFirstName(data.firstName);
                    setLastName(data.lastName);
                    setUserName(`${data.firstName} ${data.lastName}`);
                }
            } else {
                setUserName("");
                setUserEmail("");
                setUserId("");
            }
        });

        return () => unsubscribe();
    }, []);

    const toggleProfile = () => {
        setIsProfileOpen(!isProfileOpen);
    };

    const openProfileModal = () => {
        setIsProfileModalOpen(true);
        setIsProfileOpen(false);
    };

    const closeProfileModal = () => {
        setIsProfileModalOpen(false);
    };

    const handleNameUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateDoc(doc(db, "users", userId), {
                firstName,
                lastName
            });
            setUserName(`${firstName} ${lastName}`);
            closeProfileModal();
        } catch (error) {
            console.error("Error updating profile:", error);
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
        <>
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
                                <ProfileImage email={userEmail} />
                            </div>

                            {isProfileOpen && (
                                <ul tabIndex={0} className="menu menu-sm dropdown-content rounded-box z-10 mt-3 w-52 p-2 shadow-lg bg-white text-black">
                                    <span className="text-base font-bold text-center mb-3">{userName || "Person"}</span>
                                    
                                    <li>
                                        <button
                                            onClick={openProfileModal}
                                            className="justify-between text-sm hover:bg-gray-100 rounded-md p-2 w-full text-left"
                                        >
                                            {t("profile")}
                                        </button>
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

            {/* Profile Modal */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">{t('editProfile')}</h3>
                            <button onClick={closeProfileModal} className="text-gray-500 hover:text-gray-700">
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleNameUpdate}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('firstName')}
                                    </label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('lastName')}
                                    </label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                     {t('email')}
                                    </label>
                                    <input
                                        type="email"
                                        value={userEmail}
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={closeProfileModal}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {t('saveChange')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;