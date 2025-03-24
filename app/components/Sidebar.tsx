"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from "next-intl";
import { RxDashboard } from "react-icons/rx";
import { FaRegCalendarCheck } from "react-icons/fa6";
import { TbNotes } from "react-icons/tb";
import { FiSettings } from "react-icons/fi";
import { GoTasklist } from "react-icons/go";
import Link from 'next/link';

export default function Sidebar({ darkMode, setDarkMode }: { darkMode: boolean; setDarkMode: (value: boolean) => void }) {
    const t = useTranslations("sidebar");
    const pathname = usePathname();
    // console.log(`Current Pathname: ${pathname}`);

    const isActive = (path: string) => {
        const normalizedPath = pathname.replace(/^\/[a-z]{2}\//, "/");

        return normalizedPath.startsWith(path)
            ? 'bg-white text-blue border-2 border-dark-900'
            : 'text-dark-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700';
    };

    return (
        <aside className="fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform -translate-x-full bg-dark-600 border-r border-gray-200 sm:translate-x-0">
            <div className="h-full px-3 pb-4 overflow-y-auto">
                <ul className="space-y-2 font-medium">
                    <span className=" text-dark-200 ms-2 text-sm">MAIN MENU</span>
                    <li>
                        <Link href="/dashboard" className={`flex items-center p-2 rounded-lg group ${isActive('/dashboard')}`}>
                            <div className="text-2xl"><RxDashboard /></div>
                            <span className="ms-3">{t("dashboard")}</span>
                        </Link>
                    </li>
                    <li>
                        <Link href="/task-organizer" className={`flex items-center p-2 rounded-lg group ${isActive('/task-organizer')}`}>
                            <div className="text-2xl" ><GoTasklist /></div>
                            <span className="ms-3">{t("taskorganizer")}</span>
                        </Link>
                    </li>
                    <li>
                        <Link href="/mycalendar" className={`flex items-center p-2 rounded-lg group ${isActive('/mycalendar')}`}>
                            <div className="text-2xl" ><FaRegCalendarCheck /></div>
                            <span className="ms-3">{t("calendar")}</span>
                        </Link>
                    </li>
                    <li>
                        <Link href="/note-taking" className={`flex items-center p-2 rounded-lg group ${isActive('/note-taking')}`}>
                            <div className="text-2xl" ><TbNotes /></div>
                            <span className="ms-3">{t("note")}</span>
                        </Link>
                    </li>
                    <ul className="pt-4 mt-4 space-y-2 font-medium border-t border-gray-200 dark:border-gray-700"></ul>
                    <span className=" text-dark-200 ms-2 text-sm">OTHERS</span>
                    <li>
                        {/* ปุ่ม Toggle Dark Mode */}
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="flex items-center gap-3 px-3 py-2 w-full rounded-md transition-all duration-300 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white"
                        >
                            {/* Toggle Switch */}
                            <div className="relative w-10 h-6 bg-gray-300 dark:bg-white rounded-full p-1 transition-all duration-300">
                                <div
                                    className={`w-4 h-4 bg-white dark:bg-gray-700 rounded-full shadow-md transform transition-all duration-300 ${darkMode ? 'translate-x-4' : 'translate-x-0'}`}
                                />
                            </div>
                            <span className={`text-dark-800 ${darkMode ? 'dark:text-white' : ''}`}>
                                {darkMode ? t("dark") : t("light")}
                            </span>
                        </button>
                    </li>
                    <li>
                        <Link href="#" className={`flex items-center p-2 rounded-lg group ${isActive('#')}`}>
                            <div className="text-2xl" ><FiSettings /></div>
                            <span className="ms-3">{t("settings")}</span>
                        </Link>
                    </li>
                </ul>
            </div>
        </aside>
    );
}