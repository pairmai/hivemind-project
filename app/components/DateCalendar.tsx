import * as React from "react";
import dayjs, { Dayjs } from "dayjs";
import Badge from "@mui/material/Badge";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { getAuth } from "firebase/auth";
import { useTranslations } from "next-intl";

function EventDay(props: PickersDayProps<Dayjs> & { events?: boolean }) {
  const { day, outsideCurrentMonth, events = false, ...other } = props;
  return (
    <Badge
      key={day.toString()}
      overlap="circular"
      badgeContent={
        events && !outsideCurrentMonth ? (
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "red",
              position: "absolute",
              top: 8,
              left: 8,
            }}
          />
        ) : undefined
      }
    >
      <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
    </Badge>
  );
}

export default function CalendarWithEvents() {
  const t = useTranslations("calendar");
  const initialValue = dayjs();
  const [selectedDate, setSelectedDate] = React.useState<Dayjs>(initialValue);

  // เปลี่ยนเป็น map แบบ project group
  // { "2025-05-28": { "Project A": ["task1", "task2"], "Project B": ["task3"] } }
  const [taskMap, setTaskMap] = React.useState<{
    [date: string]: { [projectName: string]: string[] }
  }>({});

  const auth = getAuth();
  const user = auth.currentUser;

  React.useEffect(() => {
    if (!user?.email) return;

    const q = query(collection(db, "tasks"), where("assignee", "==", user.email));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: { [date: string]: { [projectName: string]: string[] } } = {};

      snapshot.forEach(doc => {
        const task = doc.data();
        if (task.dueDate) {
          const dateStr = dayjs(task.dueDate).format("YYYY-MM-DD");
          const proj = task.projectName || "ไม่มีชื่อโปรเจกต์";
          if (!map[dateStr]) map[dateStr] = {};
          if (!map[dateStr][proj]) map[dateStr][proj] = [];
          map[dateStr][proj].push(task.summary || task.content || "No summary");
        }
      });

      setTaskMap(map);
    });
    return () => unsubscribe();
  }, [user?.email]);

  // คืน true ถ้าวันนี้มี task อย่างน้อย 1 โปรเจกต์
  const hasTaskOnDate = (date: Dayjs) => {
    const dateStr = date.format("YYYY-MM-DD");
    return !!taskMap[dateStr] && Object.values(taskMap[dateStr]).some(arr => arr.length > 0);
  };

  // คืน tasks แบบ group project { [project]: [task, ...] }
  const getTasksForDate = (date: Dayjs) => {
    const dateStr = date.format("YYYY-MM-DD");
    return taskMap[dateStr] || {};
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateCalendar
        value={selectedDate}
        onChange={(newDate) => {
          if (newDate) setSelectedDate(newDate);
        }}
        slots={{
          day: (dayProps) => (
            <EventDay
              {...dayProps}
              events={hasTaskOnDate(dayProps.day)}
            />
          ),
        }}
      />
      <div className="p-4 mt-4">
        <p className="text-lg font-bold mb-3">
          📅 {t("tasksOn")} {selectedDate.format("DD/MM/YYYY")}
        </p>
        <div className="space-y-3">
          {Object.keys(getTasksForDate(selectedDate)).length > 0 ? (
            Object.entries(getTasksForDate(selectedDate)).map(([project, tasks]) => (
              <div key={project}>
                <div className="font-semibold mb-1">{project}</div>
                {tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="flex items-center p-2 border-l-4 border-pink-300 rounded-lg bg-pink-200 bg-opacity-30 mb-2"
                  >
                    <span className="text-xl mr-3">📝</span>
                    <p className="text-base font-medium">{task}</p>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="p-3 text-gray-500 italic">
              {t("noTaskToday")}
            </div>
          )}
        </div>
      </div>
    </LocalizationProvider>
  );
}