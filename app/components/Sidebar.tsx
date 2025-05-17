"use client";

import React, { useEffect,useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { RxDashboard } from "react-icons/rx";
import { FaRegCalendarCheck } from "react-icons/fa6";
import { TbNotes } from "react-icons/tb";
import { GoTasklist } from "react-icons/go";
import { GiHamburgerMenu } from "react-icons/gi";
import Link from "next/link";
import { BsRocketTakeoff } from "react-icons/bs";
import { FaAngleRight } from "react-icons/fa6";
import { FaAngleDown } from "react-icons/fa6";
import { db } from "../lib/firebase"; //import firebase from lib
import { collection, addDoc } from "firebase/firestore";

export default function Sidebar({ darkMode }: { darkMode: boolean }) {
    const t = useTranslations("sidebar");
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [selectedProject, setSelectedProject] = useState("");
    const [projects, setProjects] = useState<string[]>([]); // เก็บรายชื่อโปรเจกต์
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
    
            // เพิ่มชื่อใหม่เข้า dropdown ทันที
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
            ? `${darkMode ? 'bg-blue text-white border-2 border-blue' : 'bg-white text-blue border-2 border-dark-900'}` 
            : `${darkMode ? 'text-white hover:bg-gray-700' : 'text-dark-800 hover:bg-dark-100'}`;
    };     

    return (
        <>

            {/* Hamburger Button for Mobile */}
            <button
                className="fixed top-5 left-5 z-50 p-2 text-2xl rounded-md sm:hidden bg-dark-100 dark:bg-gray-800"
                onClick={() => setIsOpen(!isOpen)}
            >
                <GiHamburgerMenu />
            </button>

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform border-r 
                ${darkMode ? "bg-gray-900 border-gray-700" : "bg-dark-900 border-gray-200"} sm:translate-x-0`}>
                <div className="h-full px-3 pb-4 overflow-y-auto">
                    <ul className="space-y-2 font-medium">
                        <span className={`text-sm ${darkMode ? "text-gray-400" : "text-dark-100"} ms-2`}>MAIN MENU</span>
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

                    {/* Divider */}
                    <ul className="pt-4 mt-4 space-y-2 font-medium border-t border-gray-200 dark:border-gray-700">
                        <span className={`text-sm ${darkMode ? "text-gray-400" : "text-dark-200"} ms-2`}>BUILD & CREATE</span>
                    

                    {/* Project Dropdown Toggle + List รวมกัน */}
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

                        {/* ไอคอนตอน dropdown เปิดอยู่ */}
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
                            e.stopPropagation(); // ไม่ให้ปิด dropdown ตอนกด "+"
                            setIsModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-1 py-0.5 px-1.5 rounded-lg border border-transparent text-dark-800 hover:bg-dark-100 hover:border-[#5d5d5d] transition-all duration-200"
                        >
                        <span className="text-base">+</span>
                        </div>
                    </button>

                    {/* Dropdown List (toggle visibility) */}
                    {isProjectDropdownOpen && projects.length > 0 && (
                        
                        <ul className={`absolute z-10 mt-1 w-full bg-gray-100`}>
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

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                    <div className={`bg-white p-6 rounded-lg shadow-lg w-full max-w-md`}>
                        <div className="flex items-center gap-3 mb-[20px]">
                        <BsRocketTakeoff className="text-2xl text-[#292a2e]" />
                            <span className="text-2xl font-bold text-[#292a2e]">Let’s build this</span>
                        </div>
                        <h2 className="text-base mb-4 text-[#292a2e] leading-tight">Tell us what your project’s about — add project details to get started.</h2>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            await handleAddProject(); 
                            setIsModalOpen(false); // Close modal
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
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded dark:bg-gray-600 dark:hover:bg-gray-500 text-dark-800 dark:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!projectName.trim()}
                                    className= {`px-4 py-2 bg-blue text-white rounded hover:bg-blue-700 ${
                                        projectName.trim()
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


// "use client";

// import React, { useState } from "react";
// import { usePathname } from "next/navigation";
// import { useTranslations } from "next-intl";
// import { RxDashboard } from "react-icons/rx";
// import { FaRegCalendarCheck } from "react-icons/fa6";
// import { TbNotes } from "react-icons/tb";
// import { FiSettings } from "react-icons/fi";
// import { GoTasklist } from "react-icons/go";
// import { GiHamburgerMenu } from "react-icons/gi";
// import Link from "next/link";

// export default function Sidebar({ darkMode, setDarkMode }: { darkMode: boolean; setDarkMode: (value: boolean) => void }) {
//     const t = useTranslations("sidebar");
//     const pathname = usePathname();
//     const [isOpen, setIsOpen] = useState(false);

//     const isActive = (path: string) => {
//         const normalizedPath = pathname.replace(/^\/[a-z]{2}\//, "/");
//         return normalizedPath.startsWith(path)
//             ? `${darkMode ? 'bg-blue text-white border-2 border-blue' : 'bg-white text-blue border-2 border-dark-900'}`
//             : `${darkMode ? 'text-white hover:bg-gray-700' : 'text-dark-800 hover:bg-dark-100'}`;
//     };

//     return (
//         <>
//             {/* Hamburger Button for Mobile */}
//             <button
//                 className="fixed top-5 left-5 z-50 p-2 text-2xl rounded-md sm:hidden bg-dark-100 dark:bg-gray-800"
//                 onClick={() => setIsOpen(!isOpen)}
//             >
//                 <GiHamburgerMenu />
//             </button>

//             {/* Sidebar */}
//             <aside className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform border-r 
//             ${darkMode ? "bg-gray-900 border-gray-700" : "bg-dark-900 border-gray-200"} sm:translate-x-0`}>
//                 <div className="h-full px-3 pb-4 overflow-y-auto">
//                     <ul className="space-y-2 font-medium">
//                         <span className={`text-sm ${darkMode ? "text-gray-400" : "text-dark-100"} ms-2`}>MAIN MENU</span>
//                         <li>
//                             <Link href="/dashboard" className={`flex items-center p-2 rounded-lg group ${isActive("/dashboard")}`}>
//                                 <div className="text-2xl"><RxDashboard /></div>
//                                 <span className="ms-3">{t("dashboard")}</span>
//                             </Link>
//                         </li>
//                         <li>
//                             <Link href="/task-organizer" className={`flex items-center p-2 rounded-lg group ${isActive("/task-organizer")}`}>
//                                 <div className="text-2xl"><GoTasklist /></div>
//                                 <span className="ms-3">{t("taskorganizer")}</span>
//                             </Link>
//                         </li>
//                         <li>
//                             <Link href="/mycalendar" className={`flex items-center p-2 rounded-lg group ${isActive("/mycalendar")}`}>
//                                 <div className="text-2xl"><FaRegCalendarCheck /></div>
//                                 <span className="ms-3">{t("calendar")}</span>
//                             </Link>
//                         </li>
//                         <li>
//                             <Link href="/note-taking" className={`flex items-center p-2 rounded-lg group ${isActive("/note-taking")}`}>
//                                 <div className="text-2xl"><TbNotes /></div>
//                                 <span className="ms-3">{t("note")}</span>
//                             </Link>
//                         </li>
//                         <ul className="pt-4 mt-4 space-y-2 font-medium border-t border-gray-200 dark:border-gray-700"></ul>
//                         <span className={`text-sm ${darkMode ? "text-gray-400" : "text-dark-200"} ms-2`}>OTHERS</span>
//                         <li>
//                             <button
//                                 onClick={() => setDarkMode(!darkMode)}
//                                 className={`flex items-center gap-3 px-3 py-2 w-full rounded-md transition-all duration-300 ${darkMode ? "hover:bg-gray-700" : "hover:bg-dark-100"}`}
//                             >
//                                 <div className={`relative w-10 h-6 rounded-full p-1 transition-all duration-300 ${darkMode ? "bg-gray-500" : "bg-gray-300"}`}>
//                                     <div
//                                         className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-all duration-300 ${darkMode ? "translate-x-4" : "translate-x-0"}`}
//                                     />
//                                 </div>
//                                 <span className={`text-dark-800 ${darkMode ? "text-white" : ""}`}>
//                                     {darkMode ? t("dark") : t("light")}
//                                 </span>
//                             </button>
//                         </li>
//                         <li>
//                             <Link href="#" className={`flex items-center p-2 rounded-lg group ${isActive("#")}`}>
//                                 <div className="text-2xl"><FiSettings /></div>
//                                 <span className={`ms-3 ${darkMode ? "text-white" : ""}`}>{t("settings")}</span>
//                             </Link>
//                         </li>
//                     </ul>
//                 </div>
//             </aside>
//         </>
//     );
// }