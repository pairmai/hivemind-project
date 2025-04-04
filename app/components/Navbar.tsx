"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "next-intl";

const Navbar: React.FC<{ darkMode: boolean; setDarkMode: (value: boolean) => void }> = ({ darkMode, setDarkMode }) => {
    const t = useTranslations("navbar");
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const toggleNotification = () => {
        setIsNotificationOpen(!isNotificationOpen);
        setIsProfileOpen(false); // ปิด dropdown โปรไฟล์ถ้ามีการเปิดแจ้งเตือน
    };

    const toggleProfile = () => {
        setIsProfileOpen(!isProfileOpen);
        setIsNotificationOpen(false); // ปิด dropdown แจ้งเตือนถ้ามีการเปิดโปรไฟล์
    };

    return (
        <nav className={`fixed top-0 z-50 w-full border-b transition-all duration-300 
                         ${darkMode ? "bg-gray-900 border-gray-600 text-white" : "bg-white border-gray-200 text-black"}`}>
            <div className="navbar shadow-sm">
                <div className="flex-1">
                    <img src="/bee-hive.png" alt="Logo" className="w-8 h-8 ml-4 mr-4" />
                    <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap">
                        HIVEMIND
                    </span>
                </div>
                <div className="flex-none">
                    {/* Dropdown แจ้งเตือน */}
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle mr-4" onClick={toggleNotification}>
                            <div className="indicator">
                                <FontAwesomeIcon icon={faBell} className="text-xl w-6 h-6" />
                                <span className="badge badge-sm indicator-item bg-red text-white">6</span>
                            </div>
                        </div>

                        {/* แสดง dropdown แจ้งเตือนเมื่อเปิด */}
                        {isNotificationOpen && (
                            <div
                                tabIndex={0}
                                className={`card card-compact dropdown-content z-10 mt-3 w-52 shadow 
                                    ${darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-black border-gray-200"} border`}
                            >
                                <div className="card-body">
                                    <span className="text-lg font-bold">8 Items</span>
                                    <span className="text-info dark:text-gray-300">Subtotal: $999</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dropdown โปรไฟล์ */}
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar" onClick={toggleProfile}>
                            <div className="w-10 rounded-full">
                                <img
                                    alt="Profile"
                                    src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
                            </div>
                        </div>

                        {/* แสดง dropdown โปรไฟล์เมื่อเปิด */}
                        {isProfileOpen && (
                            <ul tabIndex={0} className={`menu menu-sm dropdown-content rounded-box z-10 mt-3 w-52 p-2 shadow-lg 
                                                        ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
                                <span className="text-lg font-bold text-center mb-3">Person 1</span>
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
                                    <a className="justify-between text-sm hover:bg-gray-100 rounded-md p-2">
                                    {t("logout")}
                                    </a>
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