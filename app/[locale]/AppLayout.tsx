"use client";

import { usePathname } from "next/navigation";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useState } from "react";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname();
    // console.log("Current Pathname:", pathname);
    const hidePaths = ["/login", "/signup", "/focus", "/forgot-password"];
    const shouldHideSidebar = hidePaths.some(path => pathname.includes(path));
    const shouldHideNavbar = hidePaths.some(path => pathname.includes(path));
    const [darkMode, setDarkMode] = useState(false);

    return (
        <div className="flex flex-col min-h-screen">
            {/* Navbar (ซ่อนได้) */}
            {!shouldHideNavbar && <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />}
            <div className="flex">
                {!shouldHideSidebar && <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />}
                <div className={`flex-1 ${!shouldHideSidebar ? "mt-16 ml-64 p-5" : ""}`}>
                    <LanguageSwitcher />
                    <main>{children}</main>
                </div>
            </div>
        </div>
    );
};

export default AppLayout;