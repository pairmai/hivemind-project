"use client";

import React, { useEffect, useState } from "react";
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
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { MoreVertical } from "lucide-react";
import { getAuth } from "firebase/auth";


export default function Sidebar() {
    const t = useTranslations("sidebar");
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [selectedProject, setSelectedProject] = useState("");
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const [inviteEmail, setInviteEmail] = useState("");
    const [invitedEmails, setInvitedEmails] = useState<string[]>([]);


    const handleAddProject = async () => {
        const trimmedName = projectName.trim();
        if (!trimmedName || !currentUser) {
            console.log("❌ No project name provided");
            return;
        }

        try {
            const docRef = await addDoc(collection(db, "projects"), {
                name: trimmedName,
                createdAt: new Date(),
                invitedEmails,
                ownerId: currentUser.uid, // ใส่ UID คนสร้างโปรเจกต์
                collaborators: [],        // เตรียมไว้สำหรับแชร์ในอนาคต
            });
            console.log("✅ Adding project:", trimmedName);
            console.log("✅ Project added by:", currentUser.uid);

            // เพิ่มชื่อใหม่เข้า dropdown ทันที
            setProjects((prev) => [
                ...prev,
                { id: docRef.id, name: trimmedName },
            ]);
            setSelectedProject(trimmedName);
            setProjectName("");
            setInvitedEmails([]);
            setIsModalOpen(false);
            setIsProjectDropdownOpen(true);
        } catch (err) {
            console.error("🔥 Error adding project:", err);
        }
    };
    const isActive = (path: string) => {
        const normalizedPath = pathname.replace(/^\/[a-z]{2}\//, "/");
        return normalizedPath.startsWith(path)
            ? `'bg-blue text-white border-2 border-blue' : 'bg-white text-blue border-2 border-dark-900'`
            : `'text-white hover:bg-gray-700' : 'text-dark-800 hover:bg-dark-100'`;
    };

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const snapshot = await getDocs(collection(db, "projects"));
                const projectsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name
                }));
                setProjects(projectsData);
            } catch (error) {
                console.error("Error loading projects:", error);
            }
        };

        fetchProjects();
    }, []);


    const handleDeleteProject = async (projectToDeleteId: string) => {
        const confirmDelete = window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบโปรเจคนี้? การลบจะไม่สามารถกู้คืนได้");
        if (!confirmDelete) return;

        try {
            await deleteDoc(doc(db, "projects", projectToDeleteId));
            setProjects(prev => prev.filter(p => p.id !== projectToDeleteId));
        } catch (error) {
            console.error("Error deleting project:", error);
        }
    };


    return (
        <>
            <button
                className="fixed top-5 left-5 z-50 p-2 text-2xl rounded-md sm:hidden bg-dark-100"
                onClick={() => setIsOpen(!isOpen)}
            >
                <GiHamburgerMenu />
            </button>

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform border-r 
                "bg-gray-900 border-gray-700" : "bg-dark-900 border-gray-200"} sm:translate-x-0`}>
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

                    {/* Divider */}
                    <ul className="pt-4 mt-4 space-y-2 font-medium border-t border-gray-200 dark:border-gray-700">
                        <span className={`text-sm ms-2`}>BUILD & CREATE</span>


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
                                            key={project.id}
                                            onMouseEnter={() => setHoveredId(idx)}
                                            onMouseLeave={() => {
                                                setHoveredId(null);
                                                setOpenMenuId(null);
                                            }}
                                            className="relative px-4 py-1.5 hover:bg-gray-200 cursor-pointer flex items-center justify-between"
                                        >
                                            <span onClick={() => {
                                                setSelectedProject(project.name);
                                                setIsProjectDropdownOpen(false);
                                            }}>
                                                {project.name}
                                            </span>

                                            {hoveredId === idx && (
                                                <button
                                                    className="text-gray-500 hover:text-black ml-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(openMenuId === idx ? null : idx);
                                                    }}
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                            )}

                                            {openMenuId === idx && (
                                                <div className="absolute right-2 top-8 bg-white shadow rounded-2xl z-20">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteProject(project.id);
                                                        }}
                                                        className="delete-project"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
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
                            <span className="text-2xl font-bold text-[#292a2e]">Let's build this</span>
                        </div>
                        <h2 className="text-base mb-4 text-[#292a2e] leading-tight">Tell us what your project's about — add project details to get started.</h2>

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

                            <div className="mb-4">
                                <label htmlFor="invite-emails" className="text-base font-bold text-[#505258] mb-2">
                                    Invite Members (Email)
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        id="invite-emails"
                                        type="email"
                                        placeholder="Enter email to invite"
                                        className="w-full p-2 border border-gray-300 rounded"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="px-3 bg-blue text-white rounded"
                                        onClick={() => {
                                            if (inviteEmail.trim()) {
                                                setInvitedEmails((prev) => [...prev, inviteEmail.trim()]);
                                                setInviteEmail("");
                                            }
                                        }}
                                    >
                                        +
                                    </button>
                                </div>

                                {invitedEmails.length > 0 && (
                                    <ul className="text-sm text-gray-700">
                                        {invitedEmails.map((email, idx) => (
                                            <li key={idx} className="flex items-center justify-between border-b py-1">
                                                <span>{email}</span>
                                                <button
                                                    type="button"
                                                    className="text-red-500 hover:text-red-700 text-xs"
                                                    onClick={() =>
                                                        setInvitedEmails((prev) => prev.filter((_, i) => i !== idx))
                                                    }
                                                >
                                                    Remove
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
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
                                    className={`px-4 py-2 bg-blue text-white rounded hover:bg-blue-700 ${projectName.trim()
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