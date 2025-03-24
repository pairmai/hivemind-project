"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";

export default function NoteTaking() {
    const [darkMode, setDarkMode] = useState(false);

    return (
        <div className={darkMode ? "dark" : ""}>
            <main>
                {/* Header */}
                <header className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Note Taking</h2>
                </header>
            </main>
        </div>
    );
}