"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
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
import { db } from "../lib/firebase";
import { collection, setDoc, updateDoc, deleteDoc, doc, serverTimestamp, onSnapshot, arrayUnion, getDocs, addDoc } from "firebase/firestore";
import { MoreVertical } from "lucide-react";
import { getAuth } from "firebase/auth";
import { query, where } from "firebase/firestore";
import { sendEmail } from '../lib/sendEmail';


export default function Sidebar() {
    const t = useTranslations("sidebar");
    const pathname = usePathname();
    const searchParams = useSearchParams();
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
    const [projectNote, setProjectNote] = useState("");

    // Check if user came from invite link
    useEffect(() => {
        const projectId = searchParams.get("projectId");
        if (projectId) {
            // Open the project dropdown automatically
            setIsProjectDropdownOpen(true);
        }
    }, [searchParams]);

    const handleAddProject = async () => {
        const trimmedName = projectName.trim();
        const trimmedNote = projectNote?.trim();

        if (!trimmedName || !currentUser) {
            console.log("❌ No project name provided");
            return;
        }

        try {
            // 🔍 Step 0: ตรวจสอบชื่อซ้ำ
            const nameCheckQuery = query(
                collection(db, "projects"),
                where("name", "==", trimmedName),
                where("ownerId", "==", currentUser.uid) // กรองเฉพาะของเจ้าของนี้
            );

            const nameCheckSnapshot = await getDocs(nameCheckQuery);

            if (!nameCheckSnapshot.empty) {
                alert("❌ มีโปรเจกต์ชื่อนี้อยู่แล้ว กรุณาตั้งชื่อใหม่");
                return;
            }

            // ✅ Step 1: ไม่มีชื่อซ้ำ → สร้างโปรเจกต์ได้
            const projectRef = doc(collection(db, "projects"));
            const projectId = projectRef.id;

            await setDoc(projectRef, {
                id: projectId,
                name: trimmedName,
                createdAt: serverTimestamp(),
                invitedEmails,
                ownerId: currentUser.uid,
                collaborators: [currentUser.email],
            });

            // ถ้ามีโน้ตให้เพิ่มเข้าไปใน collection "notes"
            if (trimmedNote) {
                await addDoc(collection(db, "notes"), {
                    title: `Note for ${trimmedName}`,
                    content: trimmedNote,
                    date: new Date().toISOString(),
                    project: projectId,
                    members: 1,
                    timestamp: serverTimestamp(),
                });
            }

            // ส่งอีเมลเชิญ
            for (const email of invitedEmails) {
                await sendEmail({
                    name: trimmedName,
                    email: email,
                    projectId,
                    inviteEmail: email,
                });
            }

            // เคลียร์ค่า state
            setSelectedProject(projectId);
            setProjectName("");
            setProjectNote("");
            setInvitedEmails([]);
            setIsModalOpen(false);
            setIsProjectDropdownOpen(true);

            console.log("✅ Project and note added successfully!");
        } catch (err) {
            console.error("🔥 Error adding project:", err);
        }
    };

    const handleSendInvites = async (projectName: string, projectId: string, invitedEmails: string[]) => {
        for (const email of invitedEmails) {
            try {
                await sendEmail({
                    name: projectName,
                    email: email,
                    projectId,
                    inviteEmail: email,
                });
            } catch (err) {
                console.error(`🔥 Error sending email to ${email}:`, err);
            }
        }
    };


    const isActive = (path: string) => {
        const normalizedPath = pathname.replace(/^\/[a-z]{2}\//, "/");
        return normalizedPath.startsWith(path)
            ? 'bg-white text-blue border-2 border-dark-900'
            : 'text-dark-800 hover:bg-dark-100';
    };

    useEffect(() => {
        if (!currentUser?.email) return;

        setLoadingProjects(true);
        const q = query(
            collection(db, "projects"),
            where("collaborators", "array-contains", currentUser.email)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const projectsData = snapshot.docs.map(doc => ({
                id: doc.id, // ใช้ ID จริงจาก document
                name: doc.data().name // เก็บชื่อโปรเจค
            }));
            setProjects(projectsData);
            setLoadingProjects(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleDeleteProject = async (projectToDeleteId: string, projectName: string) => {
        const confirmDelete = window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบโปรเจคนี้? การลบจะไม่สามารถกู้คืนได้");
        if (!confirmDelete) return;

        try {
            // Step 1: ลบ tasks ที่มี projectName ตรงกัน
            const tasksQuery = query(
                collection(db, "tasks"),
                where("projectName", "==", projectName)
            );

            const snapshot = await getDocs(tasksQuery);
            const deletePromises = snapshot.docs.map(taskDoc =>
                deleteDoc(doc(db, "tasks", taskDoc.id))
            );
            await Promise.all(deletePromises);
            console.log(`ลบ tasks ของโปรเจค "${projectName}" แล้ว`);

            // Step 2: ลบโปรเจค
            await deleteDoc(doc(db, "projects", projectToDeleteId));
            setProjects(prev => prev.filter(p => p.id !== projectToDeleteId));
            console.log(`ลบโปรเจค "${projectName}" แล้ว`);

        } catch (error) {
            console.error("เกิดข้อผิดพลาด:", error);
        }
    };


    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    // เพิ่มฟังก์ชันสำหรับเปิด Modal Invite
    const handleOpenInviteModal = (projectId: string) => {
        setSelectedProjectId(projectId);
        setIsInviteModalOpen(true);
    };


    const [loadingProjects, setLoadingProjects] = useState(false);

    useEffect(() => {
        if (!currentUser?.email) return;

        setLoadingProjects(true);
        const q = query(
            collection(db, "projects"),
            where("collaborators", "array-contains", currentUser.email)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const projectsData = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name
            }));
            setProjects(projectsData);
            setLoadingProjects(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

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
            <aside className="fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform border-r bg-dark-900 border-gray-200 sm:translate-x-0">
                <div className="h-full px-3 pb-4 overflow-y-auto">
                    <ul className="space-y-2 font-medium">
                        <span className="text-sm text-dark-100 ms-2">MAIN MENU</span>
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
                        <span className="text-sm text-dark-200 ms-2">BUILD & CREATE</span>


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
                                    <span>{t('project')}</span>

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
                                                <div className="absolute right-2 top-8 bg-white shadow-lg rounded-md z-20 border border-gray-200 w-48">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenInviteModal(project.id);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                                    >
                                                        Invite Members
                                                    </button>
                                                    <div className="border-t border-gray-200"></div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteProject(project.id, project.name);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
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

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Invite Members (Email)</h2>

                        <div className="flex gap-2 mb-4">
                            <input
                                type="email"
                                placeholder="e.g. user@example.com"
                                className="flex-1 p-2 border border-gray-300 rounded"
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
                            <div className="mb-4">
                                <ul className="space-y-1">
                                    {invitedEmails.map((email, idx) => (
                                        <li key={idx} className="flex justify-between items-center text-xs">
                                            <span>{email}</span>
                                            <button
                                                onClick={() => setInvitedEmails(prev => prev.filter((_, i) => i !== idx))}
                                                className="text-red-500 hover:text-red-700 text-xs"
                                            >
                                                Remove
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={async () => {
                                    if (!selectedProjectId || invitedEmails.length === 0) return;

                                    try {
                                        // 1. หาชื่อโปรเจคจาก selectedProjectId
                                        const project = projects.find(p => p.id === selectedProjectId);
                                        if (!project) return;

                                        // 2. อัปเดต Firestore ก่อน
                                        await updateDoc(doc(db, "projects", selectedProjectId), {
                                            invitedEmails: arrayUnion(...invitedEmails)
                                        });

                                        // 3. ส่งอีเมล invite
                                        await handleSendInvites(
                                            project.name, // ชื่อโปรเจค
                                            selectedProjectId, // ID โปรเจค
                                            invitedEmails // รายการอีเมล
                                        );

                                        // 4. ปิด Modal & Reset State
                                        setIsInviteModalOpen(false);
                                        setInvitedEmails([]);
                                        alert("Invites sent successfully!");
                                    } catch (error) {
                                        console.error("Failed to send invites:", error);
                                        alert("Failed to send invites. Please try again.");
                                    }
                                }}
                                className="px-4 py-2 bg-blue text-white rounded hover:bg-blue-700"
                            >
                                Send Invites
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                    <div className={`bg-white p-6 rounded-lg shadow-lg w-full max-w-md`}>
                        <div className="flex items-center gap-3 mb-[20px]">
                            <BsRocketTakeoff className="text-2xl text-[#292a2e]" />
                            <span className="text-2xl font-bold text-[#292a2e]">{t('title')}</span>
                        </div>
                        <h2 className="text-base mb-4 text-[#292a2e] leading-tight">{t('title-xs')}</h2>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            await handleAddProject();
                            setIsModalOpen(false);
                        }}>
                            <label htmlFor="project-name" className="text-base font-bold text-[#505258] mb-2">
                                {t('name')}
                            </label>
                            <input
                                id="project-name"
                                type="text"
                                placeholder={t('projectName')}
                                className="w-full p-2 mb-4 border border-gray-300 rounded"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                required
                            />

                            <div className="mb-4">
                                <label htmlFor="project-description" className="text-base font-bold text-[#505258] mb-2">
                                    {t('note')}
                                </label>
                                <input
                                    id="project-description"
                                    type="text"
                                    placeholder={t('breifNote')}
                                    className="w-full p-2 mb-4 border border-gray-300 rounded"
                                    value={projectNote}
                                    onChange={(e) => setProjectNote(e.target.value)}
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="invite-emails" className="text-base font-bold text-[#505258] mb-2">
                                    {t('invite')}
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        id="invite-emails"
                                        type="email"
                                        placeholder="e.g. user@example.com"
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
                                    {t('cancel')}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddProject}
                                    disabled={!projectName.trim()}
                                    className={`px-4 py-2 bg-blue text-white rounded hover:bg-blue-700 ${projectName.trim()
                                        ? "bg-blue hover:bg-blue"
                                        : "bg-gray-300 cursor-not-allowed"
                                        }`}
                                >
                                    {t('create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}