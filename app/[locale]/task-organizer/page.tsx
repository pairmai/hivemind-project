"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { FaSearch, FaTimes, FaSave, FaClipboardList } from "react-icons/fa";
import { CgFlagAlt } from "react-icons/cg";
import { FaRegCalendar } from "react-icons/fa6";
import { db } from "../../lib/firebase"; // import Firebase
import { collection, getDocs } from "firebase/firestore"; // ใช้ getDocs เพื่อดึงข้อมูลจาก Firestore


type Task = {
  id: string;
  content: string;
  summary?: string;
  priority?: string; 
  description?: string;
  dueDate?: string;
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
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>("");
  const [editedSummary, setEditedSummary] = useState<string>("");
  const [editedDescription, setEditedDescription] = useState<string>("");
  const [editedPriority, setEditedPriority] = useState<string>("Medium");
  const [editedDueDate, setEditedDueDate] = useState<string>("");
  const [projects, setProjects] = useState<string[]>([]); // เพื่อเก็บชื่อโปรเจค
  const [selectedProject, setSelectedProject] = useState<string | null>(null); // เก็บโปรเจคที่ถูกเลือก

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "projects"));
        const projectNames: string[] = [];
        querySnapshot.forEach((doc) => {
          projectNames.push(doc.data().name); // ดึงชื่อโปรเจคจาก Firestore
        });
        setProjects(projectNames);
      } catch (error) {
        console.error("Error fetching projects: ", error);
      }
    };

    fetchProjects();
  }, []); // ดึงโปรเจคเมื่อ component โหลด

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
    };

    const updatedCol = {
      ...columns[columnId],
      items: [...columns[columnId].items, {...newTask, priority, dueDate, description}],
    };

    setColumns({
      ...columns,
      [columnId]: updatedCol,
    });

    setNewTaskTitles((prev) => ({ ...prev, [columnId]: "" }));
    setNewTaskSummaries((prev) => ({ ...prev, [columnId]: "" }));
    setNewTaskPriorities((prev) => ({ ...prev, [columnId]: "Medium" }));
    setNewTaskdueDate((prev) => ({ ...prev, [columnId]: ""}));
    setNewTaskDescription((prev) => ({ ...prev, [columnId]: ""}));
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
    setEditedContent(task.content);
    setEditedSummary(task.summary || "");
    setEditedDescription(task.description || "");
    setEditedPriority(task.priority || "Medium");
    setEditedDueDate(task.dueDate || new Date().toISOString().split("T")[0]);
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
            dueDate: editedDueDate
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

          {/* Description */}
          <label className="block text-l font-bold text-black">Description</label>
          <textarea
            className="w-full border p-2 rounded bg-gray-100"
            value={task.description}
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
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div 
          className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold dark:text-white">Edit Task</h3>
            <button 
              onClick={cancelEditing}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
            >
              <FaTimes size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input
                type="text"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
              />
            </div>
            
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Summary</label>
              <input
                type="text"
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
              />
            </div>
            
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                <select
                  value={editedPriority}
                  onChange={(e) => setEditedPriority(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={editedDueDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setEditedDueDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={cancelEditing}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSaveEdit(task.id, columnId)}
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
                <button className="creat-task">
                  + Create Task
                </button>
              </div>
            </div>

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
                        {/* Project Input */}
                        <input
                          autoFocus
                          type="text"
                          placeholder="Project..."
                          value={newTaskTitles[colId] || ""}
                          onChange={(e) =>
                            setNewTaskTitles((prev) => ({
                              ...prev,
                              [colId]: e.target.value,
                            }))
                          }
                          className="project-card w-full"  
                        />

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