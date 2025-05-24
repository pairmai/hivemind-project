"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { FaSearch, FaTimes, FaSave, FaClipboardList } from "react-icons/fa";
import { CgFlagAlt } from "react-icons/cg";
import { FaRegCalendar } from "react-icons/fa6";
import { db } from "../../lib/firebase"; // import Firebase
import { collection, onSnapshot, addDoc, query, where } from "firebase/firestore"; // ใช้ getDocs เพื่อดึงข้อมูลจาก Firestore
import { useUsers } from "../../context/UserContext"; 
import { getAuth } from "firebase/auth";


type Task = {
  id: string;
  content: string;
  summary?: string;
  priority?: string; 
  description?: string;
  dueDate?: string;
  assignee?: string;
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
    addGroup: { 
      name: "+ Add group", 
      items: [],
    },
  },
};


export default function TaskOrganizer() {
  const [darkMode, setDarkMode] = useState(false);
  const [columns, setColumns] = useState<Columns>(initialData.columns);
  const [searchTerm, setSearchTerm] = useState("");
  const [newTaskTitles, setNewTaskTitles] = useState<{ [columnId: string]: string }>({});
  const [newTaskSummaries, setNewTaskSummaries] = useState<{ [columnId: string]: string }>({});
  const [addingTaskCol, setAddingTaskCol] = useState<string | null>(null);
  const [newTaskPriorities, setNewTaskPriorities] = useState<{ [columnId: string]: string }>({});
  const [newTaskdueDate, setNewTaskdueDate] = useState<{ [columnId: string]: string }>({});
  const [newTaskDescription, setNewTaskDescription] = useState<{ [columnId: string]: string}>({});
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
  const [projects, setProjects] = useState<{name: string, collaborators: string[]}[]>([]);
  const [selectedProject, setSelectedProject] = useState(""); 
  const [editingProject, setEditingProject] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [dueDate, setDueDate] = useState("");

  const { users } = useUsers(); 
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
    // ดึงข้อมูลโปรเจคจาก Firestore

  useEffect(() => {
  if (typeof window === "undefined") return; // ต้องรันบน client เท่านั้น
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user?.email) return;

  const q = query(
    collection(db, "projects"),
    where("collaborators", "array-contains", user.email)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const updatedProjects = snapshot.docs.map(doc => ({
      name: doc.data().name,
      collaborators: doc.data().collaborators || [],
    }));
    setProjects(updatedProjects);
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


  const ProfileImage = ({ email = "" }: { email?: string }) => {
    const getInitialsFromEmail = (email: string): string => {
      const localPart = email.split("@")[0];
      const parts = localPart.split(/[._]/);
      return parts.map(part => part[0]?.toUpperCase()).slice(0, 2).join('');
    };

    // ชุดสีสันที่น่าสนใจ
    const colors = [
      '#2C87F2','#DF34BA', '#D500F9','#00E676','#FFD600','#DF34BA'
    ];

    // สุ่มสีจากอีเมล (ทำให้สีคงที่สำหรับอีเมลเดียวกัน)
    const emailHash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const color = colors[emailHash % colors.length];

    const initials = getInitialsFromEmail(email || "");

    return (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: color,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: 14,
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
        }}
      >
        {initials || "?"}
      </div>
    );
  }
  
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

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;

    const sourceCol = columns[source.droppableId];
    const destCol = columns[destination.droppableId];
    const sourceItems = [...sourceCol.items];
    const destItems = [...destCol.items];
    const [movedItem] = sourceItems.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      sourceItems.splice(destination.index, 0, movedItem);
      setColumns({
        ...columns,
        [source.droppableId]: { ...sourceCol, items: sourceItems },
      });
    } else {
      destItems.splice(destination.index, 0, movedItem);
      setColumns({
        ...columns,
        [source.droppableId]: { ...sourceCol, items: sourceItems },
        [destination.droppableId]: { ...destCol, items: destItems },
      });
    }
    
    // Close expanded task if it was moved
    if (expandedTaskId === movedItem.id) {
      setExpandedTaskId(null);
    }
  };


  const addTask = (columnId: string) => {
    const title = newTaskTitles[columnId]?.trim();
    const summary = newTaskSummaries[columnId]?.trim();
    const priority = newTaskPriorities[columnId] || "Medium";
    const assignee = newTaskAssignedUser[columnId]?.trim();
    const dueDate = newTaskdueDate[columnId]?.trim();
    const description = newTaskDescription[columnId]?.trim();

    if (!title) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      content: title,
      summary,
      priority,
      dueDate,
      description,
      assignee,
    };

    const updatedCol = {
      ...columns[columnId],
      items: [...columns[columnId].items, newTask],
    };

    setColumns({
      ...columns,
      [columnId]: updatedCol,
    });

    // Reset all form states
    setNewTaskTitles((prev) => ({ ...prev, [columnId]: "" }));
    setNewTaskSummaries((prev) => ({ ...prev, [columnId]: "" }));
    setNewTaskPriorities((prev) => ({ ...prev, [columnId]: "Medium" }));
    setNewTaskAssignedUser((prev) => ({ ...prev, [columnId]: "" }));
    setNewTaskdueDate((prev) => ({ 
      ...prev, 
      [columnId]: new Date().toISOString().split("T")[0] // Reset to today's date
    }));
    setNewTaskDescription((prev) => ({ ...prev, [columnId]: "" }));
    setSelectedProject(""); // Reset project selection
    setAddingTaskCol(null);
  };

  const filteredColumns = Object.entries(columns).reduce((acc, [colId, col]) => {
    acc[colId] = {
      ...col,
      items: col.items.filter((task) =>{
        const matchesSearch = task.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPriority =
          priorityFilter === "all" || task.priority === priorityFilter;
        return matchesSearch && matchesPriority;
      }),
    };
    return acc;
  }, {} as Columns);

  const handleDeleteTask = (taskId: string, columnId: string) => {
    const updatedItems = columns[columnId].items.filter((task) => task.id !== taskId);
    setColumns({
      ...columns,
      [columnId]: {
        ...columns[columnId],
        items: updatedItems,
      },
    });
    if (expandedTaskId === taskId) setExpandedTaskId(null);
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


  const TaskDetailView = ({ task, columnId }: { task: Task, columnId: string }) => {
    const columnName = columns[columnId]?.name || "Unknown Column";  // Get the column name
    const { users } = useUsers();
    const user = users && users.length > 0 ? users[0] : null;
    const fullName = user ? `${user.firstName} ${user.lastName}` : "Loading...";
    const [assignee] = useState(task.assignee || "");
    const assigneeName = users.find(u => u.email === assignee);
    const displayAssigneeName = assigneeName ? `${assigneeName.firstName} ${assigneeName.lastName}` : assignee;


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
            <h2 className="text-lg font-semibold text-left">Task</h2>
          </div>

          <hr className="border-t border-gray-200 dark:border-gray-600 my-2" /> 

          {/* Project */}
          <label className="block text-l font-bold text-black">Project</label>
          <input
            type="text"
            className="w-full border p-2 rounded bg-gray-100"
            value={task.content}
            disabled
          />
  
          {/* Summary */}
          <label className="block text-l font-bold text-black">Summary</label>
          <input
            type="text"
            className="w-full border p-2 rounded bg-gray-100"
            value={task.summary}
            disabled
          />
  
          {/* Priority */}
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-l font-bold text-black">Priority</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded bg-gray-100"
                  value={task.priority}
                  disabled
                />
              </div>
          {/* Status */}
            <div className="w-1/2">
              <label className="block text-l font-bold text-black">Status</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded bg-gray-100"
                  value={columnName}
                  disabled
                />
            </div>
          </div>
          

          {/* Assignee */}
        <label className="block text-l font-bold text-black">Assignee</label>
          <input
            type="text"
            className="w-full border p-2 rounded bg-gray-100"
            value={displayAssigneeName}
            disabled
          />

          {/* Description */}
          <label className="block text-l font-bold text-black">Description</label>
          <textarea
            className="w-full border p-2 rounded bg-gray-100"
            value={task.description}
            disabled
          />

          {/*Assign by*/}
          <label className="block text-l font-bold text-black">Reporter</label>
          <input
            type="text"
            className="w-full border p-2 rounded bg-gray-100"
            value={fullName}
            disabled
          />
  
          {/* Due Date */}
          <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Due Date</h4>
            <p className="text-gray-600 dark:text-gray-400">
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString("en-GB", {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })
                : "No due date"}
            </p>
          </div>
  
          {/* Edit / Delete buttons */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => handleDeleteTask(task.id, columnId)}
              className="button-delete"
            >
              Delete
            </button>
  
            <button
              onClick={() => startEditing(task)}
              className="button-edit"
            >
              Edit
            </button>
  
            <button
              type="button"
              onClick={() => setExpandedTaskId(null)}
              className="button-cancel"
            >
              Cancel
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
    const handleSave = () => {
      const updatedTask = {
        ...task,
        content: project,
        summary,
        description,
        assignee,
        priority,
        dueDate
      };
      
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
    };
  
   return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold dark:text-white">Edit Task</h3>
          <button 
            onClick={() => setEditingTaskId(null)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        <div>
          <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Project</label>
          <select
            value={project}
            onChange={handleProjectChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
          >
            <option value="" disabled>Select project</option>
            {projects.map((project) => (
              <option key={project.name} value={project.name}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
          
        <div>
          <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Summary</label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
          />
        </div>
        
        <div>
          <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
            rows={4}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Assignee</label>
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
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
              />
          </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Reporter</label>
              <input
                type="text"
                value={currentUserName}
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
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-black rounded hover:bg-blue-600"
          >
            <FaSave /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};


  return (
    <div className={darkMode ? "dark" : ""}>
      <main>
        <header className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Task Organizer</h2>
        </header>

        {/* Search Input */}
        <div className="mb-4 relative flex items-center">
          <FaSearch className="absolute left-3 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Looking for something? Start typing..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-[600px] pl-[40px] p-2 rounded-md bg-[#f4f4f4] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* bar */}
        <div className="mb-4 relative flex items-center justify-between rounded-lg bg-white border border-gray-200 p-4 h-16 w-full">
             {/* แสดงเดือนและวันที่ */}
            <div className="flex flex-col items-start justify-center">
                <span className="text-2xl">{`${new Date().toLocaleString('en-US', { weekday: 'long' })}, ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}</span> {/* วันที่ตัวเล็ก */}
            </div>
  
            <button className="today-bar px-4 py-1 rounded-xl text-lg ml-4">
                TODAY
            </button>

          <div className="flex-grow flex ml-10 items-center gap-4"> {/* ทำให้ title และปุ่ม prior อยู่กลาง */}
          <div className="border-l-2 border-gray-300 h-10 mx-4" /> {/* เส้น | */}

            <span className="font-bold text-xl">Board -</span>

            <div className="flex gap-2">
              <button className={`all-butt px-4 py-1 rounded-xl ${priorityFilter === "all" ? "active" : ""}`}
              onClick={() => setPriorityFilter("all")}>
                ALL
              </button>

              <button className={`high-prior px-4 py-1 rounded-xl ${priorityFilter === "High" ? "active" : ""}`}
                onClick={() => setPriorityFilter("High")}>
                High
              </button>

              <button className={`medium-prior px-4 py-1 rounded-xl ${priorityFilter === "Medium" ? "active" : ""}`}
              onClick={() => setPriorityFilter("Medium")}>
                Medium
              </button>

              <button className={`low-prior px-4 py-1 rounded-xl ${priorityFilter === "Low" ? "active" : ""}`}
              onClick={() => setPriorityFilter("Low")}>
                Low
              </button>
            </div>
          </div>

              <div className="ml-auto mr-4"> {/* ปุ่ม Create Task อยู่ทางขวา */}
                <button className="creat-task"
                onClick={() => setShowModal(true)}
                >
                  + Create Task
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
                    <h2 className="text-lg font-semibold text-left"> Create Task</h2>
                  </div>

                  <hr className="border-t border-gray-200 dark:border-gray-600 my-2 mb-4" />

                  {/*project create*/}
                  <label className="block text-lg font-bold text-black mb-4">
                    Project<span className="text-[#ff0000]">*</span>
                  </label>

                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 mb-4"
                  >
                    <option value="" disabled>
                      Select project
                    </option>
                    {projects.map((project) => (
                      <option key={project.name} value={project.name}>
                        {project.name}
                      </option>
                    ))}
                  </select>

                  {/*Summary*/}
                  <label className="block text-lg font-bold text-black mb-4">
                    Summary<span className="text-[#ff0000]">*</span>
                  </label>
                  <input
                    placeholder="Add summary"
                //    value={newTaskSummaries[colId] || ""}
                    onChange={(e) =>
                     setNewTaskSummaries((prev) => ({
                      ...prev,
                //      [colId]: e.target.value,
                      }))
                    }
                      onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                //          addTask(colId);
                          }
                      if (e.key === "Escape") setAddingTaskCol(null);
                         }}
                          className="summary-card w-full  border p-2 rounded mb-4"  
                     />

                  {/*priority & status*/}
                  <div className="flex space-x-4 mb-4">
                    <div className="w-1/2">
                      <label className="block text-l font-bold text-black">Priority</label>
                      <select
                        className="w-full border p-2 rounded"
                     //   value={newEvent.priority}
                     //   onChange={(e) =>
                     //     setNewEvent({ ...newEvent, priority: e.target.value as "High" | "Medium" | "Low" })
                     //  }
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>

                    <div className="w-1/2">
                      <label className="block text-l font-bold text-black">Status</label>
                      <select
                        className="w-full border p-2 rounded"
                     //   value={newEvent.status}
                      // onChange={(e) =>
                      //   setNewEvent({ ...newEvent, status: e.target.value as "To Do" | "In Progress" | "Done" })
                      // }
                      >
                        <option value="To Do">TO DO</option>
                        <option value="In Progress">DOING</option>
                        <option value="Done">DONE</option>
                      </select>
                    </div>
                  </div>

                  {/* Assignee */}
                  <span className="block text-lg font-bold text-black">Assign to:</span>
                        <div className="mb-4 relative flex items-center">
                          <select
                       //     value={newTaskAssignedUser[colId] || ""}
                            onChange={(e) => 
                              setNewTaskAssignedUser((prev) => ({
                                ...prev,
                       //         [colId]: e.target.value,
                              }))
                            }
                            className="w-full p-2 rounded border border-gray-300"
                            disabled={!selectedProject}
                          >
                            <option value="" disabled hidden>
                              Select member
                            </option>
                            {getAssigneesForSelectedProject().map(({ email, name }) => (
                              <option key={email} value={email}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>

                  {/* Description */}
                  <label className="block text-lg font-bold text-black">Description</label>
                    <textarea
                      className="w-full border p-2 rounded mb-4"
                      placeholder="Description"
                  //  value={newEvent.description}
                  //  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    />

                  {/* Date */}
                  <label className="block text-lg font-bold text-black mb-4">Date</label>
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
                //  disabled={newEvent.project.trim() === "" || newEvent.summary.trim() === ""}
                  >
                    Create
                  </button>

                  <button
                    className="button-cancel"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
          </div>
            )}

    
        {/* Kanban Board */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto p-4 w-full">
            {Object.entries(filteredColumns).map(([colId, col]) => (
              <Droppable key={colId} droppableId={colId} isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="relative bg-gray-100 dark:bg-gray-800 rounded-lg w-full p-4 flex flex-col shadow-md"
                  >
                    <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          colId === "todo"
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
                    <div className="bg-white dark:bg-gray-700 rounded-md p-3 mb-3 shadow-sm border border-gray-200 dark:border-gray-600">

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
                            select project
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
                            placeholder="Add summary"
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
                          <FaRegCalendar className="text-gray-500 text-l mr-2 icon"/>
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
                          <CgFlagAlt className="text-gray-500 text-2xl mr-2 icon"/>
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
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        </div>

                        {/* assignee */}
                        <span className="relative items-center pl-2 mb-4 border-gray-600">Assign to:</span>
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
                              Select member
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
                          <div> Description </div>
                          <textarea
                            placeholder=" Add more context..."
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
                            Cancel
                          </button>
                          <button
                            onClick={() => addTask(colId)}
                            className="bg-blue-500 text-black px-3 py-1 rounded text-sm"
                          >
                            Add
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
                            className="bg-white dark:bg-gray-700 rounded-md p-3 mb-3 shadow-sm border border-gray-200 dark:border-gray-600 cursor-pointer hover:shadow-md transition-shadow"
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
                                    Assignee:
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
                                      {new Date(item.dueDate).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })}
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
                                    {item.priority}
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