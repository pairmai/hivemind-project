"use client";

import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { MdDeleteOutline } from "react-icons/md";
import { useTranslations } from "next-intl";

interface Note {
    title: string;
    content: string;
    date: string;
    project: string;
    members: number;
}

const projectMembers: Record<string, number> = {
    "ABCD Project": 5,
    "EFGH Project": 7,
    "IJKL Project": 6,
    "MNOP Project": 4,
    "QRST Project": 9,
};

const formatRelativeTime = (date: Date) => {
    if (isNaN(date.getTime())) {
        return "Invalid Date";  // หากไม่ใช่วันที่ที่ถูกต้อง
    }

    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // ต่างกันกี่วินาที

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;

    // ถ้าเกิน 7 วันค่อยโชว์วันที่แบบปกติ
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function NoteTaking() {
    const t = useTranslations("note");
    const [notes, setNotes] = useState<Note[]>([
        {
            title: "Lorem ipsum",
            content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ipsum massa, venenatis blandit placerat quis, blandit sed lacus. Vivamus eu odio convallis, imperdiet elit sit amet, commodo dui. Quisque feugiat, tellus quis laoreet pharetra, velit neque pellentesque nibh, eu mattis nisl nulla ac nunc. In a orci et turpis auctor aliquet. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris euismod vulputate ipsum vel tempor. Integer bibendum orci vel mauris aliquam sollicitudin",
            date: "Dec 25",
            project: "ABCD Project",
            members: 5,
        },
        {
            title: "Lorem ipsum",
            content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
            date: "Dec 10",
            project: "EFGH Project",
            members: 7,
        },
        {
            title: "Lorem ipsum",
            content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ipsum massa, venenatis blandit placerat quis, blandit sed lacus. Vivamus eu odio convallis, imperdiet elit sit amet, commodo dui.",
            date: "Dec 1",
            project: "IJKL Project",
            members: 6,
        },
        {
            title: "Lorem ipsum",
            content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
            date: "Nov 30",
            project: "MNOP Project",
            members: 4,
        },
        {
            title: "Lorem ipsum",
            content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ipsum massa, venenatis blandit placerat quis, blandit sed lacus...",
            date: "Oct 22",
            project: "QRST Project",
            members: 9,
        },
    ]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedNote, setEditedNote] = useState<Note | null>(null);
    const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);

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

    const handleEditChange = (field: keyof Note, value: string) => {
        if (!editedNote) return;
        const updated = { ...editedNote, [field]: value };
        if (field === "project") {
            updated.members = projectMembers[value] || 0;
        }
        setEditedNote(updated);
    };

    const saveNote = () => {
        if (editedNote) {
            const newNote: Note = {
                ...editedNote,
                date: new Date().toISOString(),
            };
            let updatedNotes;
            if (selectedNoteIndex !== null) {
                updatedNotes = [...notes];
                updatedNotes[selectedNoteIndex] = newNote;
            } else {
                updatedNotes = [newNote, ...notes];
            }
            setNotes(
                updatedNotes.sort((a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
            );
            closeModal();
        }
    };

    const deleteNote = () => {
        if (selectedNoteIndex !== null) {
            const newNotes = [...notes];
            newNotes.splice(selectedNoteIndex, 1);
            setNotes(newNotes);
            closeModal();
            setIsDeleteConfirmationOpen(false);
        }
    };

    const openDeleteConfirmation = () => {
        setIsDeleteConfirmationOpen(true);
    };

    const closeDeleteConfirm = () => {
        setIsDeleteConfirmationOpen(false);
    };

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.project.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Note Taking</h2>

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
                    placeholder="Search Note"
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
                Create Note
            </button>

            {/* Note Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotes.length > 0 ? (
                    filteredNotes.map((note, index) => (
                        <div
                            key={index}
                            className="border p-4 rounded shadow cursor-pointer hover:bg-gray-100 flex flex-col"
                            onClick={() => openModal(notes.indexOf(note))}
                        >
                            <div className="flex justify-between text-sm">
                                <span className="font-semibold">{note.title}</span>
                                <span>{formatRelativeTime(new Date(note.date))}</span>
                            </div>
                            <p className="text-gray-700 text-sm mt-3 mb-4 line-clamp-3">{note.content}</p>
                            <div className="mt-auto text-sm text-gray-500 flex justify-between">
                                <span>👥 {note.members}</span>
                                <span>📁 {note.project}</span>
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

                        {isEditMode ? (
                            <>
                                <input
                                    className="border w-full mb-3 p-2 rounded"
                                    value={editedNote.title}
                                    onChange={(e) => handleEditChange("title", e.target.value)}
                                    placeholder="Note title"
                                />
                                <textarea
                                    className="border w-full h-32 p-2 rounded mb-3"
                                    value={editedNote.content}
                                    onChange={(e) => handleEditChange("content", e.target.value)}
                                    placeholder="Note content"
                                />
                                <select
                                    className="border w-full p-2 rounded mb-3"
                                    value={editedNote.project}
                                    onChange={(e) => handleEditChange("project", e.target.value)}
                                >
                                    <option value="" disabled>Select Project</option>
                                    {Object.keys(projectMembers).map((proj) => (
                                        <option key={proj} value={proj}>
                                            {proj}
                                        </option>
                                    ))}
                                </select>
                                <div className="text-sm text-gray-600 mb-4">
                                    👥 {editedNote.members} members
                                </div>
                                <div className="flex justify-between">
                                    <button
                                        className="bg-blue text-white px-4 py-2 rounded hover:bg-blue"
                                        onClick={saveNote}
                                    >
                                        Save
                                    </button>
                                    <button
                                        className="bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-400"
                                        onClick={closeModal}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold mb-2">{editedNote.title}</h3>
                                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{editedNote.content}</p>
                                <div className="text-sm text-gray-500 mb-2">
                                    📁 {editedNote.project} | 👥 {editedNote.members}
                                </div>
                                <div className="text-sm text-gray-400 mb-4">📅  {formatRelativeTime(new Date(editedNote?.date))}</div>
                                <div className="flex justify-between">
                                    <button
                                        className="btn rounded-md shadow-md bg-white text-blue px-4 py-2 hover:bg-blue hover:text-white"
                                        onClick={() => setIsEditMode(true)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="btn rounded-full shadow-lg text-red bg-white hover:bg-red hover:text-white"
                                        onClick={openDeleteConfirmation}
                                    >
                                        <div className="text-2xl"><MdDeleteOutline /></div>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteConfirmationOpen && (
                <div
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50"
                    onClick={closeModal}
                >
                    <div
                        className="bg-white rounded-lg p-6 w-full max-w-sm relative shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold mb-4">Are you sure you want to delete this note?</h3>
                        <div className="flex justify-between">
                            <button
                                onClick={deleteNote}
                                className="btn rounded-md shadow-md text-red bg-white px-4 py-2 hover:bg-red hover:text-white"
                            >
                                Yes
                            </button>
                            <button
                                onClick={closeDeleteConfirm}
                                className="btn rounded-md shadow-md text-blue bg-white px-4 py-2 hover:bg-blue hover:text-white"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}