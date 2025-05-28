"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { FaSearch, FaTimes, FaSave, FaClipboardList } from "react-icons/fa";
import { CgFlagAlt } from "react-icons/cg";
import { FaRegCalendar } from "react-icons/fa6";
import { db } from "../../lib/firebase"; // import Firebase
import { collection, onSnapshot, addDoc, query, where, serverTimestamp, deleteDoc, doc, updateDoc, or } from "firebase/firestore"; // ใช้ getDocs เพื่อดึงข้อมูลจาก Firestore
import { useUsers } from "../../context/UserContext";
import { getAuth } from "firebase/auth";
import ProfileImage from "@/app/components/ProfileImage";
import { useTranslations } from "next-intl";
import { useLocale } from 'next-intl';


type Task = {
  id: string;
  content: string;
  summary?: string;
  priority?: string;
  description?: string;
  dueDate?: string;
  assignee?: string;
  status?: string;
  reporter?: string;
};

type Column = {
  name: string;
  items: Task[];
};

type Columns = {
  [key: string]: Column;
};

const initialData: { columns: Columns } = {
  columns: {
    todo: {
      name: "To Do",
      items: [],
    },
    inprogress: {
      name: "In Progress",
      items: [],
    },
    done: {
      name: "Done",
      items: [],
    },

  },
};

export default function TaskOrganizer() {
  const [columns, setColumns] = useState<Columns>(initialData.columns);
  const [searchTerm, setSearchTerm] = useState("");
  const [newTaskTitles, setNewTaskTitles] = useState<{ [columnId: string]: string }>({});
  const [newTaskSummaries, setNewTaskSummaries] = useState<{ [columnId: string]: string }>({});
  const [addingTaskCol, setAddingTaskCol] = useState<string | null>(null);
  const [newTaskPriorities, setNewTaskPriorities] = useState<{ [columnId: string]: string }>({});
  const [newTaskdueDate, setNewTaskdueDate] = useState<{ [columnId: string]: string }>({});
  const [newTaskDescription, setNewTaskDescription] = useState<{ [columnId: string]: string }>({});
  const [newTaskAssignedUser, setNewTaskAssignedUser] = useState<{ [columnId: string]: string }>({});
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>("");
  const [editedSummary, setEditedSummary] = useState<string>("");
  const [editedDescription, setEditedDescription] = useState<string>("");
  const [editedPriority, setEditedPriority] = useState<string>("Medium");
  const [editedDueDate, setEditedDueDate] = useState<string>("");
  const [editedAssignee, setEditedAssignee] = useState<string>("");
  const [projects, setProjects] = useState<{ name: string, collaborators: string[] }[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [editingProject, setEditingProject] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [dueDate, setDueDate] = useState("");

  const [modalSummary, setModalSummary] = useState("");
  const [modalPriority, setModalPriority] = useState("Medium");
  const [modalStatus, setModalStatus] = useState("todo");
  const [modalAssignee, setModalAssignee] = useState("");
  const [modalDescription, setModalDescription] = useState("");


  const { users } = useUsers();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const t = useTranslations('task');
  const locale = useLocale();

  // Date formatting functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatHeaderDate = () => {
    const today = new Date();
    return today.toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  
  // ดึงข้อมูลโปรเจคจาก Firestore

  useEffect(() => {
    if (typeof window === "undefined") return;

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user?.email) return;

    const q = query(
      collection(db, "projects"),
      where("collaborators", "array-contains", user.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        collaborators: doc.data().collaborators || [],
      }));

      setProjects(updatedProjects);

      // เคลียร์ selectedProject ถ้าโปรเจคที่เลือกไม่อยู่ในรายการใหม่
      if (selectedProject && !updatedProjects.some(p => p.id === selectedProject)) {
        setSelectedProject(""); // เคลียร์ถ้า id ไม่มีในโปรเจคจริง
      }
    });

    return () => unsubscribe();
  }, []);



  // 3. เพิ่มฟังก์ชันสำหรับดึง assignees
  const getAssigneesForSelectedProject = () => {
    if (!selectedProject || !users) return [];

    const project = projects.find(p => p.name === selectedProject);
    if (!project) return [];

    return project.collaborators.map(email => {
      const user = users.find(u => u.email === email);
      if (user) {
        return {
          email,
          name: `${user.firstName} ${user.lastName}`
        };
      }
      return { email, name: email };
    });
  };

  useEffect(() => {
    if (addingTaskCol) {
      // Set default values when opening the form
      setNewTaskdueDate((prev) => ({
        ...prev,
        [addingTaskCol]: prev[addingTaskCol] || new Date().toISOString().split("T")[0]
      }));
      setNewTaskPriorities((prev) => ({
        ...prev,
        [addingTaskCol]: prev[addingTaskCol] || "Medium"
      }));
    }
  }, [addingTaskCol]);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;

    const sourceCol = columns[source.droppableId];
    const destCol = columns[destination.droppableId];
    const sourceItems = [...sourceCol.items];
    const destItems = [...destCol.items];
    const [movedItem] = sourceItems.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      // ย้ายภายในคอลัมน์เดิม
      sourceItems.splice(destination.index, 0, movedItem);
      setColumns({
        ...columns,
        [source.droppableId]: { ...sourceCol, items: sourceItems },
      });
    } else {
      // ย้ายข้ามคอลัมน์
      destItems.splice(destination.index, 0, movedItem);
      setColumns({
        ...columns,
        [source.droppableId]: { ...sourceCol, items: sourceItems },
        [destination.droppableId]: { ...destCol, items: destItems },
      });

      // ✅ อัปเดต Firestore ด้วยสถานะใหม่
      try {
        await updateDoc(doc(db, "tasks", movedItem.id), {
          status: destination.droppableId,
        });
        console.log("📦 อัปเดตสถานะใน Firestore แล้ว:", destination.droppableId);
      } catch (error) {
        console.error("❌ อัปเดต Firestore ไม่สำเร็จ:", error);
      }
    }

    // ปิด task ที่เปิดอยู่ (ถ้ามี)
    if (expandedTaskId === movedItem.id) {
      setExpandedTaskId(null);
    }
  };

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].name);
    }
  }, [projects]);

  const addTask = async (columnId: string) => {
    const title = newTaskTitles[columnId]?.trim();
    const summary = newTaskSummaries[columnId]?.trim();
    const priority = newTaskPriorities[columnId] || "Medium";
    const assignee = newTaskAssignedUser[columnId]?.trim();
    const dueDate = newTaskdueDate[columnId]?.trim();
    const description = newTaskDescription[columnId]?.trim();

    if (!title) return;

    if (selectedProject) {

      try {
        const taskRef = collection(db, "tasks");
        await addDoc(taskRef, {
          content: title,
          projectName: selectedProject,
          summary,
          priority,
          description: description || "",
          assignee: assignee || "",
          dueDate,
          createdAt: serverTimestamp(),
          status: columnId,
          reporter: currentUser?.email,
        });

        console.log("Task added to Firestore");
      } catch (error) {
        console.error("Error adding task to Firestore:", error);
      }
    }

    // Reset form
    setNewTaskTitles((prev) => ({ ...prev, [columnId]: "" }));
    setNewTaskSummaries((prev) => ({ ...prev, [columnId]: "" }));
    setNewTaskPriorities((prev) => ({ ...prev, [columnId]: "Medium" }));
    setNewTaskAssignedUser((prev) => ({ ...prev, [columnId]: "" }));
    setNewTaskdueDate((prev) => ({
      ...prev,
      [columnId]: new Date().toISOString().split("T")[0],
    }));
    setNewTaskDescription((prev) => ({ ...prev, [columnId]: "" }));
    // ✅ อย่าล้าง selectedProject
    setAddingTaskCol(null);
  };


  const filteredColumns = Object.entries(columns).reduce((acc, [colId, col]) => {
    acc[colId] = {
      ...col,
      items: col.items.filter((task) => {
        const matchesSearch = task.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPriority =
          priorityFilter === "all" || task.priority === priorityFilter;
        return matchesSearch && matchesPriority;
      }),
    };
    return acc;
  }, {} as Columns);

  const handleDeleteTask = async (taskId: string, columnId: string) => {
    // ลบออกจาก Firestore
    try {
      await deleteDoc(doc(db, "tasks", taskId));
      if (confirm("คุณแน่ใจว่าต้องการลบงานนี้?")) {
        await deleteDoc(doc(db, "tasks", taskId));
      }

      console.log("ลบ task สำเร็จ");

      // ลบจาก local state
      const updatedItems = columns[columnId].items.filter((task) => task.id !== taskId);
      setColumns({
        ...columns,
        [columnId]: {
          ...columns[columnId],
          items: updatedItems,
        },
      });

      if (expandedTaskId === taskId) setExpandedTaskId(null);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการลบ task:", error);
      alert("ไม่สามารถลบ task ได้");
    }
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
  };

  const handleSaveEdit = (taskId: string, columnId: string) => {
    const updatedItems = columns[columnId].items.map((task) =>
      task.id === taskId
        ? {
          ...task,
          content: editedContent,
          summary: editedSummary,
          description: editedDescription,
          priority: editedPriority,
          dueDate: editedDueDate,
          assignee: editedAssignee
        }
        : task
    );

    setColumns({
      ...columns,
      [columnId]: {
        ...columns[columnId],
        items: updatedItems,
      },
    });

    setEditingTaskId(null);
    setExpandedTaskId(null);
  };

  useEffect(() => {
    if (!currentUser?.email) return;

    const q = query(
      collection(db, "tasks"),
      or(
        where("assignee", "==", currentUser.email),
        where("reporter", "==", currentUser.email)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksFromFirestore: Task[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          content: data.content || "",
          summary: data.summary || "",
          description: data.description || "",
          priority: data.priority || "Medium",
          dueDate: data.dueDate || "",
          assignee: data.assignee || "",
          reporter: data.reporter || "",
          status: data.status || "todo",
        };
      });

      // แยก task ลงคอลัมน์ตาม status
      const newColumns: Columns = {
        todo: { name: "To Do", items: [] },
        inprogress: { name: "In Progress", items: [] },
        done: { name: "Done", items: [] },
      };

      tasksFromFirestore.forEach(task => {
        const status = task.status?.toLowerCase();
        if (status && newColumns[status]) {
          newColumns[status].items.push(task);
        }
      });

      setColumns(newColumns);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleCreateTaskFromModal = async () => {
    if (!selectedProject || !modalSummary.trim()) {
      alert("Please select project and enter summary");
      return;
    }

    try {
      await addDoc(collection(db, "tasks"), {
        content: selectedProject,
        summary: modalSummary,
        priority: modalPriority,
        status: modalStatus.toLowerCase(),
        assignee: modalAssignee,
        description: modalDescription,
        dueDate: dueDate,
        projectName: selectedProject,
        createdAt: serverTimestamp(),
        reporter: currentUser?.email,
      });

      console.log("✅ Task created!");
      setShowModal(false);

      // ล้าง input
      setModalSummary("");
      setModalPriority("Medium");
      setModalStatus("todo");
      setModalAssignee("");
      setModalDescription("");
      setDueDate("");
    } catch (err) {
      console.error("❌ Error creating task:", err);
      alert("Error creating task");
    }
  };


  const TaskDetailView = ({ task, columnId }: { task: Task, columnId: string }) => {
    const columnName = columns[columnId]?.name || "Unknown Column";  // Get the column name
    const { users } = useUsers();
    const user = users && users.length > 0 ? users[0] : null;
    const fullName = user ? `${user.firstName} ${user.lastName}` : "Loading...";
    const [assignee] = useState(task.assignee || "");
    const assigneeName = users.find(u => u.email === assignee);
    const displayAssigneeName = assigneeName ? `${assigneeName.firstName} ${assigneeName.lastName}` : assignee;
    const reporterEmail = task.reporter;
    const reporterUser = users.find(u => u.email === reporterEmail);
    const reporterName = reporterUser ? `${reporterUser.firstName} ${reporterUser.lastName}` : reporterEmail;


    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div
          className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded bg-white p-6 space-y-4 shadow-xl relative"  // เพิ่ม 'relative' ที่นี่
          onClick={(e) => e.stopPropagation()}
        >
          {/* ปุ่มปิด */}
          <button
            onClick={() => setExpandedTaskId(null)}
            className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 text-2xl font-light"
          >
            &times;
          </button>

          {/* Header */}
          <div className="flex items-center mb-4">
            <img src="/Task.png" alt="Logo" width={40} height={40} className="mr-2" />
            <h2 className="text-lg font-semibold text-left">{t('task')}</h2>
          </div>

          <hr className="border-t border-gray-200 dark:border-gray-600 my-2" />

          {/* Project */}
          <label className="block text-l font-bold text-black">{t('project')}</label>
          <input
            type="text"
            className="w-full border p-2 rounded bg-gray-100"
            value={task.content}
            disabled
          />

          {/* Summary */}
          <label className="block text-l font-bold text-black">{t('summary')}</label>
          <input
            type="text"
            className="w-full border p-2 rounded bg-gray-100"
            value={task.summary}
            disabled
          />

          {/* Priority */}
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-l font-bold text-black">{t('priority')}</label>
              <input
                type="text"
                className="w-full border p-2 rounded bg-gray-100"
                value={t(`${task.priority?.toLowerCase()}`)} 
                disabled
              />
            </div>
            {/* Status */}
            <div className="w-1/2">
              <label className="block text-l font-bold text-black">{t('status')}</label>
              <input
                type="text"
                className="w-full border p-2 rounded bg-gray-100"
                value={t(`${task.status}`)} 
                disabled
              />
            </div>
          </div>


          {/* Assignee */}
          <label className="block text-l font-bold text-black">{t('assignee')}</label>
          <input
            type="text"
            className="w-full border p-2 rounded bg-gray-100"
            value={displayAssigneeName}
            disabled
          />

          {/* Description */}
          <label className="block text-l font-bold text-black">{t('description')}</label>
          <textarea
            className="w-full border p-2 rounded bg-gray-100"
            value={task.description}
            disabled
          />

          {/*Assign by*/}
          <label className="block text-l font-bold text-black">{t('reporter')}</label>
          <input
            type="text"
            className="w-full border p-2 rounded bg-gray-100"
            value={reporterName}
            disabled
          />

          {/* Due Date */}
          <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('dueDate')}</h4>
            <p className="text-gray-600 dark:text-gray-400">
              {task.dueDate
                ? formatDate(task.dueDate)
                : t('noDueDate')}  
            </p>
          </div>

          {/* Edit / Delete buttons */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => handleDeleteTask(task.id, columnId)}
              className="button-delete"
            >
              {t('delete')}
            </button>

            <button
              onClick={() => startEditing(task)}
              className="button-edit"
            >
              {t('edit')}
            </button>

            <button
              type="button"
              onClick={() => setExpandedTaskId(null)}
              className="button-cancel"
            >
              {t('cancel')}
            </button>

          </div>
        </div>
      </div>
    );
  };


  const TaskEditView = ({ task, columnId }: { task: Task, columnId: string }) => {

    const { users } = useUsers();
    const currentUser = users && users.length > 0 ? users[0] : null;
    const currentUserName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Loading...";

    const [project, setProject] = useState(task.content || "");
    const [summary, setSummary] = useState(task.summary || "");
    const [description, setDescription] = useState(task.description || "");
    const [assignee, setAssignee] = useState(task.assignee || "");
    const [priority, setPriority] = useState(task.priority || "Medium");
    const [dueDate, setDueDate] = useState(task.dueDate || "");

    const reporterEmail = task.reporter;
    const reporterUser = users.find(u => u.email === reporterEmail);
    const reporterName = reporterUser ? `${reporterUser.firstName} ${reporterUser.lastName}` : reporterEmail;


    // ฟังก์ชันจัดการการเปลี่ยนแปลง project
    const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newProject = e.target.value;
      setProject(newProject);

      // รีเซ็ต assignee ถ้า assignee ปัจจุบันไม่อยู่ใน collaborators ของโปรเจคใหม่
      const selectedProject = projects.find(p => p.name === newProject);
      if (selectedProject && !selectedProject.collaborators.includes(assignee)) {
        setAssignee("");
      }
    };

    // ฟังก์ชันบันทึกการเปลี่ยนแปลง
    const handleSave = async () => {
      try {
        // สร้าง task ที่อัปเดต
        const updatedTask = {
          ...task,
          content: project,
          summary,
          description,
          assignee,
          priority,
          dueDate,
          updatedAt: new Date() // เพิ่มเวลาอัปเดต
        };

        // อัปเดตใน Firestore
        await updateDoc(doc(db, "tasks", task.id), updatedTask);

        // อัปเดต state ใน UI
        const updatedItems = columns[columnId].items.map(t =>
          t.id === task.id ? updatedTask : t
        );

        setColumns({
          ...columns,
          [columnId]: {
            ...columns[columnId],
            items: updatedItems,
          },
        });

        setEditingTaskId(null);
        setExpandedTaskId(null);

      } catch (error) {
        console.error("Error updating task:", error);
        // อาจจะเพิ่มการแจ้งเตือนผู้ใช้ที่นี่
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div
          className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold dark:text-white">{t('editTask')}</h3>
            <button
              onClick={() => setEditingTaskId(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
            >
              <FaTimes size={20} />
            </button>
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">{t('project')}</label>
            <select
              value={project}
              onChange={handleProjectChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
            >
              <option value="" disabled>{t('selectProject')}</option>
              {projects.map((project) => (
                <option key={project.name} value={project.name}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">{t('summary')}</label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">{t('description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">{t('priority')}</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
              >
                <option value="Low">{t('low')}</option>
                <option value="Medium">{t('medium')}</option>
                <option value="High">{t('high')}</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">{t('assignee')}</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
                disabled={!project}
              >

                {project && users &&
                  projects
                    .find(p => p.name === project)
                    ?.collaborators.map(email => {
                      const user = users.find(u => u.email === email);
                      const displayName = user
                        ? `${user.firstName} ${user.lastName}`
                        : email;

                      return (
                        <option key={email} value={email}>
                          {displayName}
                        </option>
                      );
                    })
                }
              </select>

            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dueDate')}</label>
              <input
                type="date"
                value={dueDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">{t('reporter')}</label>
              <input
                type="text"
                value={reporterName}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
                disabled
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => setEditingTaskId(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-black rounded hover:bg-blue-600"
            >
              <FaSave /> {t('saveChange')}
            </button>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div>
      <main>
        <header className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{t('title')}
</h2>
        </header>

        {/* Search Input */}
        <div className="mb-4 relative flex items-center">
          <FaSearch className="absolute left-3 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-[1000px] pl-[40px] p-2 rounded-md bg-[#f4f4f4]"
          />
        </div>

        {/* bar */}
        <div className="mb-4 relative flex items-center justify-between rounded-lg bg-white border border-gray-200 p-4 h-16 w-full">
          {/* แสดงเดือนและวันที่ */}
          <div className="flex flex-col items-start justify-center">
            <span className="text-2xl">{formatHeaderDate()}</span> {/* วันที่ตัวเล็ก */}
          </div>

          <button className="today-bar px-4 py-1 rounded-xl text-lg ml-4">
            {t('today')}
          </button>

          <div className="flex-grow flex ml-10 items-center gap-4"> {/* ทำให้ title และปุ่ม prior อยู่กลาง */}
            <div className="border-l-2 border-gray-300 h-10 mx-4" /> {/* เส้น | */}

            <span className="font-bold text-xl">{t('board')}</span>

            <div className="flex gap-2">
              <button className={`all-butt px-4 py-1 rounded-xl ${priorityFilter === "all" ? "active" : ""}`}
                onClick={() => setPriorityFilter("all")}>
                {t('all')}
              </button>

              <button className={`high-prior px-4 py-1 rounded-xl ${priorityFilter === "High" ? "active" : ""}`}
                onClick={() => setPriorityFilter("High")}>
                {t('high')}
              </button>
              <button className={`medium-prior px-4 py-1 rounded-xl ${priorityFilter === "Medium" ? "active" : ""}`}
                onClick={() => setPriorityFilter("Medium")}>
                {t('medium')}
              </button>

              <button className={`low-prior px-4 py-1 rounded-xl ${priorityFilter === "Low" ? "active" : ""}`}
                onClick={() => setPriorityFilter("Low")}>
                {t('low')}
              </button>
            </div>
          </div>

          <div className="ml-auto mr-4"> {/* ปุ่ม Create Task อยู่ทางขวา */}
            <button className="creat-task"
              onClick={() => setShowModal(true)}
            >
              {t('createTask+')}
            </button>
          </div>
        </div>

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div
              className="w-full max-w-md rounded bg-white p-6 shadow-xl relative"  // เพิ่ม 'relative' ที่นี่
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-h-[70vh] overflow-y-auto">
                {/* ปุ่มปิด */}
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 text-2xl font-light z-50"
                >
                  &times;
                </button>

                <div className="flex items-center mb-4">
                  <img src="/Task.png" alt="Logo" width={40} height={40} className="mr-2" />
                  <h2 className="text-lg font-semibold text-left">{t('createTask')}</h2>
                </div>

                <hr className="border-t border-gray-200 dark:border-gray-600 my-2 mb-4" />

                {/*project create*/}
                <label className="block text-lg font-bold text-black mb-4">
                  {t('project')}<span className="text-[#ff0000]">*</span>
                </label>

                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 mb-4"
                >
                  <option value="" disabled>
                    {t('selectProject')}
                  </option>
                  {projects.map((project) => (
                    <option key={project.name} value={project.name}>
                      {project.name}
                    </option>
                  ))}
                </select>

                {/*Summary*/}
                <div>
                  <label className="block text-l font-bold text-black">
                    {t('summary')}<span className="text-[#ff0000]">*</span></label>
                  <input
                    type="text"
                    value={modalSummary}
                    onChange={(e) => setModalSummary(e.target.value)}
                    className="w-full border p-2 rounded"
                    placeholder={t('addSummary')}
                  />
                </div>

                {/*priority & status*/}
                <div className="flex space-x-4 mb-4">
                  <div className="w-1/2">
                    <label className="block text-l font-bold text-black">{t('priority')}</label>
                    <select
                      value={modalPriority}
                      onChange={(e) => setModalPriority(e.target.value)}
                      className="w-full border p-2 rounded"
                    >
                      <option value="High">{t('high')}</option>
                      <option value="Medium">{t('medium')}</option>
                      <option value="Low">{t('low')}</option>
                    </select>
                  </div>

                  <div className="w-1/2">
                    <label className="block text-l font-bold text-black">{t('status')}</label>
                    <select
                      value={modalStatus}
                      onChange={(e) => setModalStatus(e.target.value)}
                      className="w-full border p-2 rounded"
                    >
                      <option value="todo">{t('todo')}</option>
                      <option value="inprogress">{t('inprogress')}</option>
                      <option value="done">{t('done')}</option>
                    </select>
                  </div>
                </div>

                {/* Assignee */}
                <span className="block text-lg font-bold text-black">{t('assignTo')}</span>
                <div className="mb-4 relative flex items-center">
                  <select
                    value={modalAssignee}
                    onChange={(e) => setModalAssignee(e.target.value)}
                    className="w-full p-2 rounded border border-gray-300"
                    disabled={!selectedProject}
                  >
                    <option value="" disabled hidden>
                      {t('selectMember')}
                    </option>
                    {getAssigneesForSelectedProject().map(({ email, name }) => (
                      <option key={email} value={email}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <label className="block text-lg font-bold text-black">{t('description')}</label>
                <textarea
                  className="w-full border p-2 rounded mb-4"
                  placeholder={t('addDescription')}
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                />


                {/* Date */}
                <label className="block text-lg font-bold text-black mb-4">{t('dueDate')}</label>
                <input
                  type="date"
                  value={dueDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded mb-4"
                />

                <button
                  type="submit"
                  className="button-create mb-4"
                  onClick={handleCreateTaskFromModal}
                >
                  {t('create')}
                </button>

                <button
                  className="button-cancel"
                  onClick={() => setShowModal(false)}
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Kanban Board */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex justify-center gap-6 overflow-x-auto p-4 w-full">
            {Object.entries(filteredColumns).map(([colId, col]) => (
              <Droppable key={colId} droppableId={colId} isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="relative min-w-[435px] max-w-[435px] bg-gray-100 dark:bg-gray-800 rounded-lg w-full p-4 flex flex-col shadow-md"
                  >
                    <h2 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full ${colId === "todo"
                            ? "bg-todo"
                            : colId === "inprogress"
                              ? "bg-inprogress"
                              : "bg-done"
                          }`}
                      />

                      {col.name}
                      <span className="bubble-count">
                        {col.items.length}
                      </span>

                    </h2>

                    {/* ปุ่ม + เพิ่ม Task */}
                    <button
                      onClick={() => {
                        setAddingTaskCol((prev) => {
                          const newValue = prev === colId ? null : colId;
                          if (newValue && !newTaskdueDate[colId]) {
                            setNewTaskdueDate((prev) => ({
                              ...prev,
                              [colId]: new Date().toISOString().split("T")[0],
                            }));
                          }
                          return newValue;
                        });
                      }}

                      className="absolute top-2 right-4 bg-blue-500 text-black rounded-full w-8 h-8 flex items-center justify-center text-lg"
                    >
                      +
                    </button>

                    {/* Form เพิ่ม Task */}
                    {addingTaskCol === colId && (
                      <div className="bg-white dark:bg-gray-700 rounded-xl p-3 mb-3 shadow-sm border border-gray-200 dark:border-gray-600">

                        {/* Project Dropdown */}
                        <select
                          value={selectedProject}
                          onChange={(e) => {
                            setSelectedProject(e.target.value);
                            setNewTaskTitles((prev) => ({
                              ...prev,
                              [colId]: e.target.value,
                            }));
                          }}
                          className="project-card w-full"
                        >
                          <option value="" disabled hidden className="select-project">
                            {t('selectProject')}
                          </option>
                          {projects.map((project) => (
                            <option key={project.name} value={project.name}>
                              {project.name}
                            </option>
                          ))}
                        </select>

                        {/* Summary Input */}
                        <div className="relative flex items-center pl-2 mb-4"> {/* เพิ่ม mb-4 เพื่อแยกบรรทัด */}
                          <FaClipboardList className="text-gray-500 text-l mr-2 icon" />
                          <input
                            placeholder={t('addSummary')}
                            value={newTaskSummaries[colId] || ""}
                            onChange={(e) =>
                              setNewTaskSummaries((prev) => ({
                                ...prev,
                                [colId]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                addTask(colId);
                              }
                              if (e.key === "Escape") setAddingTaskCol(null);
                            }}
                            className="summary-card w-full"
                          />
                        </div>

                        {/* Due Date */}
                        <div className=" mb-4 relative flex items-center pl-2">
                          <FaRegCalendar className="text-gray-500 text-l mr-2 icon" />
                          <input
                            type="date"
                            min={new Date().toISOString().split("T")[0]} // กันย้อนหลัง
                            value={
                              newTaskdueDate[colId] ??
                              new Date().toISOString().split("T")[0] // ใช้วันที่ปัจจุบัน ถ้ายังไม่มีใน state
                            }
                            onChange={(e) =>
                              setNewTaskdueDate((prev) => ({
                                ...prev,
                                [colId]: e.target.value,
                              }))
                            }
                            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          />
                        </div>

                        {/* Priority Select */}
                        <div className=" mb-4 relative flex items-center pl-1"> {/* เพิ่ม mb-4 ให้ช่อง Priority อยู่บรรทัดใหม่ */}
                          <CgFlagAlt className="text-gray-500 text-2xl mr-2 icon" />
                          <select
                            value={newTaskPriorities[colId] || "Medium"}
                            onChange={(e) =>
                              setNewTaskPriorities((prev) => ({
                                ...prev,
                                [colId]: e.target.value,
                              }))
                            }
                            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          >
                            <option value="Low">{t('low')}</option>
                            <option value="Medium">{t('medium')}</option>
                            <option value="High">{t('high')}</option>
                          </select>
                        </div>

                        {/* assignee */}
                        <span className="relative items-center pl-2 mb-4 border-gray-600">{t('assignTo')}</span>
                        <div className="mb-4 relative flex items-center pl-1">
                          <select
                            value={newTaskAssignedUser[colId] || ""}
                            onChange={(e) =>
                              setNewTaskAssignedUser((prev) => ({
                                ...prev,
                                [colId]: e.target.value,
                              }))
                            }
                            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            disabled={!selectedProject}
                          >
                            <option value="" disabled hidden>
                              {t('selectMember')}
                            </option>
                            {getAssigneesForSelectedProject().map(({ email, name }) => (
                              <option key={email} value={email}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>


                        {/* Description */}
                        <div className="relative items-center pl-2 mb-4 border-gray-600">
                          <div> {t('description')} </div>
                          <textarea
                            placeholder={t('addDescription')}
                            value={newTaskDescription[colId] || ""}
                            onChange={(e) =>
                              setNewTaskDescription((prev) => ({
                                ...prev,
                                [colId]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                addTask(colId);
                              }
                              if (e.key === "Escape") setAddingTaskCol(null);
                            }}
                            className="desc-card w-full"
                          />
                        </div>

                        {/* Buttons for Cancel and Add */}
                        <div className="mt-2 flex justify-end gap-2">
                          <button
                            onClick={() => setAddingTaskCol(null)}
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            {t('cancel')}
                          </button>
                          <button
                            onClick={() => addTask(colId)}
                            className="bg-blue-500 text-black px-3 py-1 rounded text-sm"
                          >
                            {t('add')}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tasks */}
                    {col.items.map((item, index) => {
                      // Find which column this task is in for the detail view
                      const taskColumnId = Object.entries(columns).find(([_, column]) =>
                        column.items.some(task => task.id === item.id)
                      )?.[0] || colId;

                      return (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white dark:bg-gray-700 rounded-xl p-3 mb-3 shadow-sm border border-gray-200 dark:border-gray-600 cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => setExpandedTaskId(expandedTaskId === item.id ? null : item.id)}
                            >
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {item.content}
                              </div>

                              {item.summary && (
                                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                  {item.summary}
                                </div>
                              )}

                              {/* Assignee pic */}
                              {/* แทนที่ส่วนแสดง Assignee ด้วยโค้ดนี้ */}
                              <div className="mt-2">
                                {item.assignee && (
                                  <div className="flex items-center gap-2 justify-between">
                                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                      {t('assignee')}
                                    </div>
                                    <ProfileImage email={item.assignee} />
                                  </div>
                                )}
                              </div>

                              {item.priority && (
                                <>
                                  <hr className="border-t border-gray-200 dark:border-gray-600 my-2" />
                                  <div className="flex items-center gap-2 mt-2 text-xs font-medium">
                                    <CgFlagAlt className="text-lg justify-start text-gray-600" />
                                    {item.dueDate && (
                                      <p className="text-sm text-gray-600">
                                        {formatDate(item.dueDate)}
                                      </p>
                                    )}
                                    <span
                                      className={`
                                      ml-auto px-2 py-0.5 rounded-full 
                                      ${item.priority === "High" && "high-prior"}
                                      ${item.priority === "Medium" && "medium-prior"}
                                      ${item.priority === "Low" && "low-prior"}
                                    `}
                                    >
                                      {t(`${item.priority?.toLowerCase()}`)}
                                    </span>
                                  </div>
                                </>
                              )}

                              {/* Task Detail Modal */}
                              {expandedTaskId === item.id && !editingTaskId && (
                                <TaskDetailView task={item} columnId={taskColumnId} />
                              )}

                              {/* Task Edit Modal */}
                              {editingTaskId === item.id && (
                                <TaskEditView task={item} columnId={taskColumnId} />
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}

                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </main>
    </div>
  );
}