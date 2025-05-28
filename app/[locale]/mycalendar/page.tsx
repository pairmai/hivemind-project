"use client";

import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Dialog } from "@headlessui/react";
import { EventSourceInput } from "@fullcalendar/core";
import { db } from "../../lib/firebase";
import { collection, onSnapshot, addDoc, query, where, serverTimestamp, deleteDoc, doc, updateDoc, or } from "firebase/firestore"; // ใช้ getDocs เพื่อดึงข้อมูลจาก Firestore
import { getAuth } from "firebase/auth";
import { useUsers } from "../../context/UserContext";
import { useTranslations } from "next-intl";
import { useLocale } from 'next-intl';
import thLocale from '@fullcalendar/core/locales/th';
import enLocale from '@fullcalendar/core/locales/en-gb';


interface Event {
  id: string;
  project: string;
  start: string | Date;
  allDay: boolean;
  priority?: "High" | "Medium" | "Low";
  status?: "todo" | "inprogress" | "done";
  summary: string;
  description?: string;
  dueDate?: string;
  assignee?: string;
  reporter?: string;
}

export default function CalendarPage() {
  const t = useTranslations('my_calendar');
  const currentLocale = useLocale();
  const [events, setEvents] = useState<Event[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string; collaborators: string[] }[]>([]);
  
  const auth = getAuth();
  const { users } = useUsers();
  const currentUser = auth.currentUser;

  const [newEvent, setNewEvent] = useState<Event>({
    project: "",
    start: "",
    allDay: true,
    id: "",
    priority: "Medium",
    status: "todo",
    summary: "",
    description: "",
    dueDate: "",
    assignee: "",
    reporter: currentUser?.email || "",
  });

  // ดึงข้อมูลโปรเจคจาก Firestore
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!currentUser?.email) return;

    const q = query(
      collection(db, "projects"),
      where("collaborators", "array-contains", currentUser.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        collaborators: doc.data().collaborators || [],
      }));

      setProjects(updatedProjects);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // ตั้งค่าโปรเจคแรกเป็นค่าเริ่มต้นเมื่อโหลดข้อมูลเสร็จ
  useEffect(() => {
    if (projects.length > 0 && !newEvent.project) {
      setNewEvent(prev => ({
        ...prev,
        project: projects[0].name
      }));
    }
  }, [projects]);

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
    const tasksFromFirestore = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        project: data.projectName || data.content || "",
        start: data.dueDate || data.createdAt?.toDate() || new Date(),
        allDay: true,
        priority: data.priority || "Medium",
        status: data.status || "todo",
        summary: data.summary || "",
        description: data.description || "",
        dueDate: data.dueDate || "",
        assignee: data.assignee || "",
        reporter: data.reporter || "",
      } as Event;
    });

    setEvents(tasksFromFirestore);
  });

  return () => unsubscribe();
}, [currentUser]);

  const getAssigneesForSelectedProject = () => {
    if (!newEvent.project || !users) return [];
    
    const project = projects.find(p => p.name === newEvent.project);
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

  const handleDateClick = (arg: { date: Date; dateStr: string; allDay: boolean }) => {
    setIsEditing(false);
    setNewEvent({
      project: projects.length > 0 ? projects[0].name : "",
      start: arg.dateStr,
      allDay: arg.allDay,
      id: new Date().getTime().toString(),
      priority: "Medium",
      status: "todo",
      summary: "",
      description: "",
      dueDate: arg.dateStr,
      assignee: "",
      reporter: currentUser?.email || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newEvent.project.trim() === "" || newEvent.summary.trim() === "") {
      alert("Project และ Summary เป็นฟิลด์ที่จำเป็นต้องกรอก");
      return;
    }

    try {
      const eventData = {
        projectName: newEvent.project,
        content: newEvent.project,
        summary: newEvent.summary,
        priority: newEvent.priority,
        status: newEvent.status?.toLowerCase() || "todo",
        assignee: newEvent.assignee,
        description: newEvent.description,
        dueDate: newEvent.dueDate || newEvent.start,
        createdAt: serverTimestamp(),
        reporter: currentUser?.email,
      };

      if (isEditing && selectedEvent) {
        await updateDoc(doc(db, "tasks", selectedEvent.id), eventData);
      } else {
        await addDoc(collection(db, "tasks"), eventData);
      }

      setShowModal(false);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving task:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกงาน");
    }
  };

  const handleEventClick = ({ event }: any) => {
    const found = events.find((e) => e.id === event.id);
    if (found) {
      setSelectedEvent(found);
      setShowViewModal(true);
    }
  };

  const handleEditTask = () => {
    if (selectedEvent) {
      setNewEvent(selectedEvent);
      setIsEditing(true);
      setShowViewModal(false);
      setShowModal(true);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedEvent) return;

    try {
      await deleteDoc(doc(db, "tasks", selectedEvent.id));
      setEvents(events.filter((e) => e.id !== selectedEvent.id));
      setSelectedEvent(null);
      setShowDeleteConfirm(false);
      setShowViewModal(false);
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("เกิดข้อผิดพลาดในการลบงาน");
    }
  };

  const getPriorityColor = (priority?: "High" | "Medium" | "Low") => {
    if (!priority) return "bg-gray-200";
    switch (priority) {
      case "High":
        return "high-event";
      case "Medium":
        return "medium-event"; 
      case "Low":
        return "low-event"; 
    }
  };

  const handleEventDrop = (info: any) => {
    const newStart = info.event.start;
    if (!newStart) return;
  
    const year = newStart.getFullYear();
    const month = (newStart.getMonth() + 1).toString().padStart(2, '0');
    const day = newStart.getDate().toString().padStart(2, '0');
  
    const localDateOnly = `${year}-${month}-${day}`;
  
    const updatedEvents = events.map((event) =>
      event.id === info.event.id
        ? {
            ...event,
            start: newStart,
            dueDate: localDateOnly,
          }
        : event
    );
    setEvents(updatedEvents);
  };
  
  const handleUpcomingCardClick = (event: Event) => {
    setSelectedEvent(event);
    setShowViewModal(true);
  };  

  return (
    <div className="grid grid-cols-12 gap-4 h-screen">
      <main className="col-span-12 md:col-span-9 p-6 overflow-auto mt-0 ml-[-20px]">
        <h1 className="my-calendar-title">{t('mycalendar')}</h1>
        <div className="h-full">
          <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              locales={[thLocale, enLocale]}
              locale={currentLocale === 'th' ? 'th' : 'en-gb'}
              initialView="dayGridMonth"
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              editable={true}
              eventDrop={handleEventDrop}
              events={events.map((e) => ({
                id: e.id,
                title: e.summary,
                start: e.dueDate || e.start,
                allDay: true,
                extendedProps: {
                  project: e.project,
                  priority: e.priority,
                  status: e.status,
                  description: e.description,
                  assignee: e.assignee,
                },
                className: getPriorityColor(e.priority),
            })) as EventSourceInput}
            headerToolbar={{
              right: "prev,next today",
              center: "title",
              left: "dayGridMonth,dayGridWeek,dayGridDay",
            }}
            buttonText={{
            today: t('today'),
            month: t('month'),
            week: t('week'), 
            day: t('day')
          }}
            height="800px"
            dayMaxEventRows={4}
            dayMaxEvents={true}
          />
        </div>
      </main>

      <aside className="upcoming-board col-span-12 md:col-span-3">
        <h2 className="text-xl font-semibold mb-4">{t('upcoming')}</h2> 
        <ul className="space-y-4">
          {events.length > 0 ? (
            events
              .sort((a, b) => {
                if (a.dueDate && b.dueDate) {
                  return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                }
                return new Date(a.start).getTime() - new Date(b.start).getTime();
              })
              .map((event, index) => {
                const PriorityColor = getPriorityColor(event.priority);
                return (
                  <li
                    key={event.id + '-' + index}
                    className={`p-4 rounded shadow border-l-4 ${PriorityColor}`}
                    onClick={() => handleUpcomingCardClick(event)}
                  >
                    <p className="font-bold text-base">{event.project}</p>
                    <p className="text-sm text-gray-700">{event.summary}</p>
                    <p className="text-xs text-gray-500">
                      {event.dueDate
                        ? new Date(event.dueDate).toLocaleDateString()
                        : new Date(event.start).toLocaleDateString()}
                    </p>
                    <p className="text-xs italic">
                      {event.status === "todo" && t('todo')}
                      {event.status === "inprogress" && t('inprogress')}
                      {event.status === "done" && t('done')}
                    </p>
                  </li>
                );
              })
          ) : (
            <p className="text-gray-400 italic">{t('no_tasks_yet')}</p>
          )}
        </ul>
      </aside>

      {/* Modal สร้าง/แก้ไข Task */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded bg-white p-6 space-y-4 shadow-xl relative">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-1 right-3 text-gray-400 hover:text-gray-600 text-2xl font-light"
              aria-label="Close"
            >
              &times;
            </button>

            <div className="flex items-center mb-4">
              <img src="/Task.png" alt="Logo" width={40} height={40} className="mr-2" />
              <Dialog.Title className="text-lg font-semibold text-left">
                {isEditing ? t('edit_task') : t('create_task')}
              </Dialog.Title>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border-t border-gray-300 my-4" />

              <label className="block text-lg font-bold text-black">
                {t('project')}<span className="text-[#ff0000]">*</span>
              </label>
              <select
                className="w-full border p-2 rounded"
                value={newEvent.project}
                onChange={(e) => setNewEvent({ ...newEvent, project: e.target.value })}
                required
              >
                <option value="" disabled>Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.name}>
                    {project.name}
                  </option>
                ))}
              </select>

              <label className="block text-lg font-bold text-black">
                {t('summary')}<span className="text-[#ff0000]">*</span>
              </label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder={t('summary')}
                value={newEvent.summary}
                onChange={(e) => setNewEvent({ ...newEvent, summary: e.target.value })}
              />

              <div className="flex space-x-4">
                <div className="w-1/2">
                  <label className="block text-l font-bold text-black">{t('priority')}</label>
                  <select
                    className="w-full border p-2 rounded"
                    value={newEvent.priority}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, priority: e.target.value as "High" | "Medium" | "Low" })
                    }
                  >
                    <option value="High">{t('high')}</option>
                    <option value="Medium">{t('medium')}</option>
                    <option value="Low">{t('low')}</option>
                  </select>
                </div>

                <div className="w-1/2">
                  <label className="block text-l font-bold text-black">{t('status')}</label>
                  <select
                    className="w-full border p-2 rounded"
                    value={newEvent.status}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, status: e.target.value as "todo" | "inprogress" | "done" })
                    }
                  >
                    <option value="todo">{t('todo')}</option>
                    <option value="inprogress">{t('inprogress')}</option>
                    <option value="done">{t('done')}</option>
                  </select>
                </div>
              </div>

              <label className="block text-lg font-bold text-black">{t('assignee')}</label>
              <select
                className="w-full border p-2 rounded"
                value={newEvent.assignee || ""}
                onChange={(e) => setNewEvent({ ...newEvent, assignee: e.target.value })}
                disabled={!newEvent.project}
              >
                <option value="" disabled hidden>
                  {t('select_assignee')}                
                </option>
                {getAssigneesForSelectedProject().map(({ email, name }) => (
                  <option key={email} value={email}>
                    {name}
                  </option>
                ))}
              </select>

              <label className="block text-lg font-bold text-black">{t('description')}</label>
              <textarea
                className="w-full border p-2 rounded"
                placeholder={t('description')}
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              />

              <label className="block text-lg font-bold text-black">{t('date')}</label>
              <input
                type="date"
                className="w-full border p-2 rounded"
                value={newEvent.dueDate}
                onChange={(e) => setNewEvent({ ...newEvent, dueDate: e.target.value })}
              />

              <button
                type="submit"
                className="button-create"
                disabled={newEvent.project.trim() === "" || newEvent.summary.trim() === ""}
              >
                {isEditing ? t('update') : t('create')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setIsEditing(false);
                }}
                className="button-cancel"
              >
                {t('cancel')}
              </button>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#2c87f2] hover:bg-[#1E60D4] text-white text-3xl rounded-full shadow-lg flex items-center justify-center transition-all duration-300"
        onClick={() => {
          const today = new Date();
          const yyyy = today.getFullYear();
          const mm = String(today.getMonth() + 1).padStart(2, '0');
          const dd = String(today.getDate()).padStart(2, '0');
          const todayStr = `${yyyy}-${mm}-${dd}`;

          setNewEvent({
            project: projects.length > 0 ? projects[0].name : "",
            start: todayStr,
            allDay: true,
            id: new Date().getTime().toString(),
            priority: "Medium",
            status: "todo",
            summary: "",
            description: "",
            dueDate: todayStr,
            assignee: "",
            reporter: currentUser?.email || "",
          });
          setIsEditing(false);
          setShowModal(true);
        }}
      >
        +
      </button>

      {/* Modal แสดง Task */}
      <Dialog open={showViewModal} onClose={() => setShowViewModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded bg-white p-6 space-y-4 shadow-xl relative">
            <button
              type="button"
              onClick={() => setShowViewModal(false)}
              className="absolute top-1 right-3 text-gray-400 hover:text-gray-600 text-2xl font-light"
              aria-label="Close"
            >
              &times;
            </button>

            <div className="flex items-center mb-4">
              <img src="/Task.png" alt="Logo" width={40} height={40} className="mr-2" />
              <Dialog.Title className="text-lg font-semibold text-left">{t('task')}</Dialog.Title>
            </div>

            {selectedEvent && (
              <form className="space-y-4">
                <label className="block text-l font-bold text-black">{t('project')}</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded bg-gray-100"
                  value={selectedEvent.project}
                  disabled
                />

                <label className="block text-l font-bold text-black">{t('summary')}</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded bg-gray-100"
                  value={selectedEvent.summary}
                  disabled
                />

                <div className="flex space-x-4">
                  <div className="w-1/2">
                    <label className="block text-l font-bold text-black">{t('priority')}</label>
                    <input
                      type="text"
                      className="w-full border p-2 rounded bg-gray-100"
                      value={t(`${selectedEvent.priority?.toLowerCase()}`)}
                      disabled
                    />
                  </div>

                  <div className="w-1/2">
                    <label className="block text-l font-bold text-black">{t('status')}</label>
                    <input
                      type="text"
                      className="w-full border p-2 rounded bg-gray-100"
                      value={t(`${selectedEvent.status}`)}
                      disabled
                    />
                  </div>
                </div>

                <label className="block text-l font-bold text-black">{t('assignee')}</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded bg-gray-100"
                  value={
                    users?.find(u => u.email === selectedEvent?.assignee) 
                      ? `${users.find(u => u.email === selectedEvent?.assignee)?.firstName} ${users.find(u => u.email === selectedEvent?.assignee)?.lastName}`
                      : selectedEvent?.assignee || "Unassigned"
                  }
                  disabled
                />

                <label className="block text-l font-bold text-black">{t('description')}</label>
                <textarea
                  className="w-full border p-2 rounded bg-gray-100"
                  value={selectedEvent.description}
                  disabled
                />

                <div className="flex space-x-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="button-delete"
                  >
                    {t('delete')}
                  </button>
                  <button
                    type="button"
                    onClick={handleEditTask}
                    className="button-edit"
                  >
                    {t('edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowViewModal(false)}
                    className="button-cancel"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Dialog ยืนยันการลบ */}
      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm rounded bg-white p-6 space-y-4 shadow-xl relative">
            <Dialog.Title className="text-lg font-semibold">{t('confirm_Delete')}</Dialog.Title>
            <p>{t('confirm_text')}</p>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="font-bold"
              >
                {t('keep_it')}
              </button>
              <button
                type="button"
                onClick={handleDeleteTask}
                className="button-delete"
              >
                {t('delete')}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}