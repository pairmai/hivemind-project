"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { RxDashboard } from "react-icons/rx";
import { FaRegCalendarCheck } from "react-icons/fa6";
import { TbNotes } from "react-icons/tb";
import { GoTasklist } from "react-icons/go";
import { GiHamburgerMenu } from "react-icons/gi";
import Link from "next/link";
import { BsRocketTakeoff } from "react-icons/bs";
import { FaAngleRight, FaAngleDown } from "react-icons/fa6";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function Sidebar() {
    const t = useTranslations("sidebar");
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [selectedProject, setSelectedProject] = useState("");
    const [projects, setProjects] = useState<string[]>([]);
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

    const handleAddProject = async () => {
        const trimmedName = projectName.trim();
        if (!trimmedName) {
            console.log("❌ No project name provided");
            return;
        }

        try {
            console.log("✅ Adding project:", trimmedName);
            await addDoc(collection(db, "projects"), {
                name: trimmedName,
                createdAt: new Date(),
            });

            setProjects((prev) => [...prev, trimmedName]);
            setSelectedProject(trimmedName);

            console.log("🎉 Project added successfully!");
            setProjectName("");
            setIsModalOpen(false);
            setIsProjectDropdownOpen(true);
        } catch (err) {
            console.error("🔥 Error adding project:", err);
        }
    };

    const isActive = (path: string) => {
        const normalizedPath = pathname.replace(/^\/[a-z]{2}\//, "/");
        return normalizedPath.startsWith(path)
            ? 'bg-white text-blue border-2 border-dark-900'
            : 'text-dark-800 hover:bg-dark-100';
    };

    return (
        <>
            <button
                className="fixed top-5 left-5 z-50 p-2 text-2xl rounded-md sm:hidden bg-dark-100"
                onClick={() => setIsOpen(!isOpen)}
            >
                <GiHamburgerMenu />
            </button>

            <aside className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform border-r bg-dark-900 border-gray-200 sm:translate-x-0`}>
                <div className="h-full px-3 pb-4 overflow-y-auto">
                    <ul className="space-y-2 font-medium">
                        <span className="text-sm text-dark-200 ms-2">MAIN MENU</span>
                        <li>
                            <Link href="/dashboard" className={`flex items-center p-2 rounded-lg group ${isActive("/dashboard")}`}>
                                <div className="text-2xl"><RxDashboard /></div>
                                <span className="ms-3">{t("dashboard")}</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/task-organizer" className={`flex items-center p-2 rounded-lg group ${isActive("/task-organizer")}`}>
                                <div className="text-2xl"><GoTasklist /></div>
                                <span className="ms-3">{t("taskorganizer")}</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/mycalendar" className={`flex items-center p-2 rounded-lg group ${isActive("/mycalendar")}`}>
                                <div className="text-2xl"><FaRegCalendarCheck /></div>
                                <span className="ms-3">{t("calendar")}</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/note-taking" className={`flex items-center p-2 rounded-lg group ${isActive("/note-taking")}`}>
                                <div className="text-2xl"><TbNotes /></div>
                                <span className="ms-3">{t("note")}</span>
                            </Link>
                        </li>
                    </ul>

                    <ul className="pt-4 mt-4 space-y-2 font-medium border-t border-gray-200">
                        <span className="text-sm text-dark-200 ms-2">BUILD & CREATE</span>
                        <li className="relative">
                            <button
                                onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                                className="flex items-center justify-between gap-3 p-2 rounded-lg text-[#4a4a4a] hover:bg-dark-100 w-full group"
                            >
                                <div className="flex items-center gap-3">
                                    {!isProjectDropdownOpen && (
                                        <>
                                            <BsRocketTakeoff className="text-2xl text-[#4a4a4a] group-hover:hidden" />
                                            <FaAngleRight className="text-xl text-[#4a4a4a] hidden group-hover:block" />
                                        </>
                                    )}

                                    {isProjectDropdownOpen && (
                                        <>
                                            <BsRocketTakeoff className="text-2xl text-[#4a4a4a] group-hover:hidden" />
                                            <FaAngleDown className="text-xl text-[#4a4a4a] hidden group-hover:block" />
                                        </>
                                    )}
                                    <span>Project</span>
                                </div>

                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsModalOpen(true);
                                    }}
                                    className="flex items-center justify-center gap-1 py-0.5 px-1.5 rounded-lg border border-transparent text-dark-800 hover:bg-dark-100 hover:border-[#5d5d5d] transition-all duration-200"
                                >
                                    <span className="text-base">+</span>
                                </div>
                            </button>

                            {isProjectDropdownOpen && projects.length > 0 && (
                                <ul className="absolute z-10 mt-1 w-full bg-gray-100">
                                    <li className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase cursor-default">
                                        Recent
                                    </li>
                                    {projects.map((project, idx) => (
                                        <li
                                            key={idx}
                                            onClick={() => {
                                                setSelectedProject(project);
                                                setIsProjectDropdownOpen(false);
                                            }}
                                            className="px-4 py-1.5 hover:bg-gray-200 cursor-pointer"
                                        >
                                            {project}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    </ul>
                </div>
            </aside>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <div className="flex items-center gap-3 mb-[20px]">
                            <BsRocketTakeoff className="text-2xl text-[#292a2e]" />
                            <span className="text-2xl font-bold text-[#292a2e]">Let’s build this</span>
                        </div>
                        <h2 className="text-base mb-4 text-[#292a2e] leading-tight">Tell us what your project’s about — add project details to get started.</h2>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            await handleAddProject();
                            setIsModalOpen(false);
                        }}>
                            <label htmlFor="project-name" className="text-base font-bold text-[#505258] mb-2">
                                Name
                            </label>
                            <input
                                id="project-name"
                                type="text"
                                placeholder="Project name"
                                className="w-full p-2 mb-4 border border-gray-300 rounded"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                required
                            />

                            <div className="mb-4">
                                <label htmlFor="project-description" className="text-base font-bold text-[#505258] mb-2">
                                    Note
                                </label>
                                <input
                                    id="project-description"
                                    type="text"
                                    placeholder="A brief description of your project"
                                    className="w-full p-2 mb-4 border border-gray-300 rounded"
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-dark-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!projectName.trim()}
                                    className={`px-4 py-2 text-white rounded ${projectName.trim()
                                        ? "bg-blue-600 hover:bg-blue-700"
                                        : "bg-gray-300 cursor-not-allowed"
                                        }`}
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}