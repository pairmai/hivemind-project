"use client";
import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Dialog } from "@headlessui/react";
import { EventSourceInput } from "@fullcalendar/core";

interface Event {
  project: string;
  start: string | Date;
  allDay: boolean;
  id: number;
  priority?: "High" | "Medium" | "Low";
  status?: "To Do" | "In Progress" | "Done";
  summary: string;
  description?: string;
  dueDate?: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newEvent, setNewEvent] = useState<Event>({
    project: "",
    start: "",
    allDay: true,
    id: 0,
    priority: "Medium",
    status: "To Do",
    summary: "",
    description: "",
    dueDate: "",
  });

  const handleDateClick = (arg: { date: Date; dateStr: string; allDay: boolean }) => {
    setIsEditing(false);
    setNewEvent({
      project: "",
      start: arg.dateStr,
      allDay: arg.allDay,
      id: new Date().getTime(),
      priority: "Medium",
      status: "To Do",
      summary: "",
      description: "",
      dueDate: arg.dateStr,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newEvent.project.trim() === "" || newEvent.summary.trim() === "") {
      alert("Project และ Summary เป็นฟิลด์ที่จำเป็นต้องกรอก");
      return;
    }
    const updatedEvent: Event = {
      ...newEvent,
      start: newEvent.dueDate || newEvent.start, 
    };

    if (isEditing) {
      setEvents((prev) =>
        prev.map((ev) => (ev.id === updatedEvent.id ? updatedEvent : ev))
      );
      setIsEditing(false);
    } else {
      setEvents([...events, updatedEvent]);
    }

    setNewEvent({
      project: "",
      start: "",
      allDay: true,
      id: 0,
      priority: "Medium",
      status: "To Do",
      summary: "",
      description: "",
      dueDate: "",
    });
    setShowModal(false);
  };

  const handleEventClick = ({ event }: any) => {
    const found = events.find((e) => e.id === Number(event.id));
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

  const handleDeleteTask = () => {
    if (selectedEvent) {
      setEvents(events.filter((e) => e.id !== selectedEvent.id));
      setSelectedEvent(null);
      setShowDeleteConfirm(false);
      setShowViewModal(false);
    }
  };

  const getPriorityColor = (priority?: "High" | "Medium" | "Low") => {
    if (!priority) return "bg-gray-200"; // กำหนดสีเริ่มต้นกรณีไม่มีสถานะ
    switch (priority) {
      case "High":
        return "todo-event";
      case "Medium":
        return "doing-event"; 
      case "Low":
        return "done-event"; 
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
      event.id === Number(info.event.id)
        ? {
            ...event,
            start: newStart, // ยังเก็บ start เผื่อ FullCalendar ต้องใช้ลาก
            dueDate: localDateOnly, // upcoming ใช้อันนี้แทน
          }
        : event
    );
    setEvents(updatedEvents);
  };
  
  const handleUpcomingCardClick = (event: Event) => {
    setSelectedEvent(event);  // เลือก event ที่คลิก
    setShowViewModal(true);   // เปิด modal แสดง task
  };  

  return (
    <div className="grid grid-cols-12 gap-4 h-screen">
      <main className="col-span-12 md:col-span-9 p-6 overflow-auto mt-0 ml-[-20px]">
        <h1 className="my-calendar-title">My Calendar</h1>
        <div className="h-full">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            editable={true} //drag and drop now on
            eventDrop={handleEventDrop}
            events={events.map((e) => ({
              id: e.id.toString(),
              title: e.project,
              start: e.start,
              allDay: e.allDay,
              className: getPriorityColor(e.priority),
            })) as EventSourceInput}
            headerToolbar={{
              right: "prev,next today",
              center: "title",
              left: "dayGridMonth,dayGridWeek,dayGridDay",
            }}
            height="800px"
            dayMaxEventRows={4}
            dayMaxEvents={true}
          />
        </div>
      </main>

      <aside className="upcoming-board col-span-12 md:col-span-3">
  <h2 className="text-xl font-semibold mb-4">Upcoming</h2>
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
              onClick={() => handleUpcomingCardClick(event)}  // เพิ่ม event handler
            >
              <p className="font-bold text-base">{event.project}</p>
              <p className="text-sm text-gray-700">{event.summary}</p>
              <p className="text-xs text-gray-500">
                {event.dueDate
                  ? new Date(event.dueDate).toLocaleDateString()
                  : new Date(event.start).toLocaleDateString()}
              </p>
              <p className="text-xs italic">
                {event.status === "To Do"}
                {event.status === "In Progress"}
                {event.status === "Done"}
              </p>
            </li>
          );
        })
    ) : (
      <p className="text-gray-400 italic">No tasks yet</p>
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
                {isEditing ? "Edit Task" : "Create Task"}
              </Dialog.Title>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border-t border-gray-300 my-4" />

              <label className="block text-lg font-bold text-black">
                Project<span className="text-[#ff0000]">*</span>
              </label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="Project"
                value={newEvent.project}
                onChange={(e) => setNewEvent({ ...newEvent, project: e.target.value })}
              />

              <label className="block text-lg font-bold text-black">
                Summary<span className="text-[#ff0000]">*</span>
              </label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="Summary"
                value={newEvent.summary}
                onChange={(e) => setNewEvent({ ...newEvent, summary: e.target.value })}
              />

              <div className="flex space-x-4">
                <div className="w-1/2">
                  <label className="block text-l font-bold text-black">Priority</label>
                  <select
                    className="w-full border p-2 rounded"
                    value={newEvent.priority}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, priority: e.target.value as "High" | "Medium" | "Low" })
                    }
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
                    value={newEvent.status}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, status: e.target.value as "To Do" | "In Progress" | "Done" })
                    }
                  >
                    <option value="To Do">TO DO</option>
                    <option value="In Progress">DOING</option>
                    <option value="Done">DONE</option>
                  </select>
                </div>
              </div>

              <label className="block text-lg font-bold text-black">Description</label>
              <textarea
                className="w-full border p-2 rounded"
                placeholder="Description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              />

              <label className="block text-lg font-bold text-black">Date</label>
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
                {isEditing ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setIsEditing(false);
                }}
                className="button-cancel"
              >
                Cancel
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
              project: "",
              start: todayStr, //defaut today
              allDay: true,
              id: new Date().getTime(),
              priority: "Medium",
              status: "To Do",
              summary: "",
              description: "",
              dueDate: todayStr,
            });
            setIsEditing(false);
            setShowModal(true);
          }
          }
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
              <Dialog.Title className="text-lg font-semibold text-left">Task</Dialog.Title>
            </div>

            {selectedEvent && (
              <form className="space-y-4">
                <label className="block text-l font-bold text-black">Project</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded bg-gray-100"
                  value={selectedEvent.project}
                  disabled
                />

                <label className="block text-l font-bold text-black">Summary</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded bg-gray-100"
                  value={selectedEvent.summary}
                  disabled
                />

                <div className="flex space-x-4">
                  <div className="w-1/2">
                    <label className="block text-l font-bold text-black">Priority</label>
                    <input
                      type="text"
                      className="w-full border p-2 rounded bg-gray-100"
                      value={selectedEvent.priority}
                      disabled
                    />
                  </div>

                  <div className="w-1/2">
                    <label className="block text-l font-bold text-black">Status</label>
                    <input
                      type="text"
                      className="w-full border p-2 rounded bg-gray-100"
                      value={selectedEvent.status}
                      disabled
                    />
                  </div>
                </div>

                <label className="block text-l font-bold text-black">Description</label>
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
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={handleEditTask}
                    className="button-edit"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowViewModal(false)}
                    className="button-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          {/* Dialog ยืนยันการลบ */}
      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm rounded bg-white p-6 space-y-4 shadow-xl relative">
            <Dialog.Title className="text-lg font-semibold">Confirm Delete</Dialog.Title>
            <p>Are you sure you want to delete this task?</p>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="font-bold"
              >
                Keep it!
              </button>
              <button
                type="button"
                onClick={handleDeleteTask}
                className="button-delete"
              >
                Delete
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
