"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale, useNow, useFormatter } from "next-intl";
import { FaPlus } from "react-icons/fa";
import { MdDeleteOutline } from "react-icons/md";
import { db } from "../../lib/firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, where, getDocs, } from "firebase/firestore";
import { getAuth } from "firebase/auth";

interface Note {
    id?: string;
    title: string;
    content: string;
    date: string;
    project: string;
    members: number;
}

interface Project {
    id: string;
    name: string;
    collaborators: string[];
}

const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);  // ต่างกันกี่วินาที
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;

    // ถ้าเกิน 7 วันค่อยโชว์วันที่แบบปกติ
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

const formatFullDateTime = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // บวก 1 เพราะ getMonth() เริ่มที่ 0
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hour}:${minute}`;
};

export default function NoteTaking() {
    const t = useTranslations("note");
    const [notes, setNotes] = useState<Note[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [projectNames, setProjectNames] = useState<Record<string, string>>({});
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(null);
    const [titleError, setTitleError] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedNote, setEditedNote] = useState<Note | null>(null);
    const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);

    const auth = getAuth();
    const user = auth.currentUser;

    // โหลดข้อมูลแบบเรียลไทม์จาก Firestore
    useEffect(() => {
        if (!user?.email) return;

        const fetchProjectsAndNotes = async () => {
            const projectsRef = collection(db, "projects");
            const userProjectsQuery = query(
                projectsRef,
                where("collaborators", "array-contains", user.email)
            );
            const projectsSnapshot = await getDocs(userProjectsQuery);

            const projectList: Project[] = projectsSnapshot.docs.map((docSnap) => ({
                id: docSnap.id,
                name: docSnap.data().name || docSnap.id,
                collaborators: docSnap.data().collaborators || [],
            }));

            setProjects(projectList);

            const nameMap: Record<string, string> = {};
            projectList.forEach((proj) => {
                nameMap[proj.id] = proj.name;
            });
            setProjectNames(nameMap);

            const projectIds = projectList.map((p) => p.id);
            if (projectIds.length === 0) return;

            const notesRef = collection(db, "notes");
            const notesQuery = query(notesRef, where("project", "in", projectIds));

            const unsubscribe = onSnapshot(notesQuery, (snapshot) => {
                const updatedNotes = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Note[];
                setNotes(updatedNotes);
            });

            return () => unsubscribe();
        };

        fetchProjectsAndNotes();
    }, [user]);

    const openModal = (index: number) => {
        setSelectedNoteIndex(index);
        setEditedNote({ ...notes[index] });
        setIsModalOpen(true);
        setIsEditMode(false);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditedNote(null);
        setIsDeleteConfirmationOpen(false);
    };

    const createNewNote = () => {
        setEditedNote({
            title: "",
            content: "",
            date: new Date().toISOString(),
            project: "",
            members: 0,
        });
        setSelectedNoteIndex(null);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const handleEditChange = async (field: keyof Note, value: string) => {
        if (!editedNote) return;
        let updated = { ...editedNote, [field]: value };

        if (field === "project") {
            const project = projects.find((p) => p.id === value);
            updated.members = project?.collaborators.length || 0;
        }

        setEditedNote(updated);
    };

    // ✅ บันทึกข้อมูลลง Firestore
    const saveNote = async () => {
        if (!editedNote) return;

        // ถ้า title ว่าง ให้แสดง error
        if (!editedNote.title.trim()) {
            setTitleError(true);
            return;
        }

        setTitleError(false); // เคลียร์ error ถ้าใส่ title แล้ว

        const newNote: Note = {
            ...editedNote,
            date: new Date().toISOString(),
        };

        if (editedNote.id) {
            const docRef = doc(db, "notes", editedNote.id);
            await updateDoc(docRef, newNote as any);
        } else {
            await addDoc(collection(db, "notes"), {
                ...newNote,
                timestamp: serverTimestamp(),
            });
        }

        closeModal();
    };

    // ✅ ลบข้อมูลใน Firestore
    const deleteNote = async () => {
        if (selectedNoteIndex !== null) {
            const noteToDelete = notes[selectedNoteIndex];
            if (noteToDelete.id) {
                await deleteDoc(doc(db, "notes", noteToDelete.id));
            }
            closeModal();
        }
    };

    const filteredNotes = notes.filter(
        (note) =>
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.project.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">{t("note")}</h2>

            {/* Search Input */}
            <label className="input flex items-center space-x-2 border border-gray-300 rounded-md px-2 py-1 mb-4">
                <svg className="h-5 w-5 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.3-4.3"></path>
                    </g>
                </svg>
                <input
                    type="search"
                    className="grow outline-none"
                    placeholder={t("search")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </label>

            {/* Create Button */}
            <button
                onClick={createNewNote}
                className="mb-4 btn border-blue bg-white text-blue hover:bg-blue hover:text-white"
            >
                <div className="text-base"><FaPlus /></div>
                {t("create")}
            </button>

            {/* Note Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotes.length > 0 ? (
                    filteredNotes.map((note, index) => (
                        <div
                            key={index}
                            className="border p-4 rounded shadow cursor-pointer hover:bg-gray-100 flex flex-col"
                            onClick={() => openModal(index)}
                        >
                            <div className="flex justify-between text-sm">
                                <span className="font-semibold">{note.title}</span>
                                <span>{formatRelativeTime(new Date(note.date))}</span>
                            </div>
                            <p className="text-gray-700 text-sm mt-3 mb-4 line-clamp-3">{note.content}</p>
                            <div className="mt-auto text-sm text-gray-500 flex justify-between">
                                <span>👥 {note.members}</span>
                                <span>📁 {projectNames[note.project] || note.project}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center col-span-full text-gray-500">No notes found.</div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && editedNote && (
                <div
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50"
                    onClick={closeModal}
                >
                    <div
                        className="bg-white rounded-lg p-6 w-full max-w-lg relative shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={closeModal}
                                className="absolute top-2 right-3 text-gray-600 text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        {isEditMode || !editedNote.id ? (
                            <>
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        {t("title")} <span className="text-red">*</span>
                                    </label>
                                    <input
                                        className={`border w-full p-2 rounded ${titleError ? "border-red" : "border-gray-300"}`}
                                        value={editedNote.title}
                                        onChange={(e) => {
                                            handleEditChange("title", e.target.value);
                                            if (e.target.value.trim()) setTitleError(false); // แก้ error ถ้าเริ่มพิมพ์
                                        }}
                                        placeholder={t("title")}
                                    />
                                    {titleError && (
                                        <p className="text-red-500 text-sm mt-1">Title is required.</p>
                                    )}
                                </div>
                                <textarea
                                    className="border w-full h-32 p-2 rounded mb-3"
                                    value={editedNote.content}
                                    onChange={(e) => handleEditChange("content", e.target.value)}
                                    placeholder={t("content")}
                                />
                                <select
                                    className="border w-full p-2 rounded mb-3"
                                    value={editedNote.project}
                                    onChange={(e) => handleEditChange("project", e.target.value)}
                                >
                                    <option value="" disabled>
                                        {t("select")}
                                    </option>
                                    {projects.map((proj) => (
                                        <option key={proj.id} value={proj.id}>
                                            {proj.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="text-sm text-gray-600 mb-4">
                                    👥 {editedNote.members} {t("members")}
                                </div>
                                <div className="flex justify-between">
                                    <button
                                        className="bg-blue text-white px-4 py-2 rounded"
                                        onClick={saveNote}
                                    >
                                        {t("save")}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg font-semibold mb-2">{editedNote.title}</h3>
                                <p className="text-gray-700 mb-4">{editedNote.content}</p>
                                <p className="text-sm text-gray-500 mb-2">📁 {projectNames[editedNote.project] || editedNote.project}</p>
                                <p className="text-sm text-gray-500 mb-4">👥 {editedNote.members} {t("members")}</p>
                                <div className="text-sm text-gray-500 mb-2">📅 {formatFullDateTime(new Date(editedNote?.date))}</div>
                                <div className="flex justify-end space-x-2">
                                    <button
                                        className="text-blue border px-4 py-1 rounded"
                                        onClick={() => setIsEditMode(true)}
                                    >
                                        {t("edit")}
                                    </button>
                                    <button
                                        className="text-red border px-4 py-1 rounded"
                                        onClick={() => setIsDeleteConfirmationOpen(true)}
                                    >
                                        {t("delete")}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* confirmDelete */}
                        {isDeleteConfirmationOpen && (
                            <div className="mt-4 text-right">
                                <p className="text-sm mb-2 text-red-600">{t("confirm_delete")}</p>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => setIsDeleteConfirmationOpen(false)}
                                        className="bg-gray-200 text-gray-800 px-3 py-1 rounded"
                                    >
                                        {t("cancel")}
                                    </button>

                                    <button
                                        onClick={deleteNote}
                                        className="bg-red text-white px-3 py-1 rounded"
                                    >
                                        {t("yes")}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}