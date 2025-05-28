"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useTranslations } from "next-intl";
import Calendar from "@/app/components/DateCalendar";
import { getAuth } from "firebase/auth";
import ProfileImage from "@/app/components/ProfileImage";
import { Tooltip } from "@mui/material";

const formatFullDateTime = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // บวก 1 เพราะ getMonth() เริ่มที่ 0

  return `${day}/${month}/${year}`;
};

export default function Dashboard() {
  const t = useTranslations("dashboard");
  const [dailyTotal, setDailyTotal] = useState(0);          // task ทั้งหมดของวันนั้น
  const [dailyCompleted, setDailyCompleted] = useState(0);  // task ที่เสร็จของวันนั้น
  const [projectTable, setProjectTable] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    notStarted: 0,
    inProgress: 0,
    completed: 0,
    delayed: 0,
  });

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user?.email) return;
    // ดึง user ของ projects
    const projectsQuery = query(
      collection(db, "projects"),
      where("collaborators", "array-contains", user.email)
    );
    // ดึง user ของ tasks
    const tasksQuery = query(
      collection(db, "tasks"),
      where("assignee", "==", user.email)
    );

    // Subscribe projects
    const unsubscribeProjects = onSnapshot(projectsQuery, (projectsSnap) => {
      const totalProjects = projectsSnap.size;
      // เมื่อ projects เปลี่ยน ต้องดึง tasks ใหม่ด้วย
      getDocs(tasksQuery).then((tasksSnap) => {
        let notStarted = 0;
        let inProgress = 0;
        let completed = 0;
        let delayed = 0;
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        tasksSnap.forEach(doc => {
          const task = doc.data();
          const status = task.status || "todo";
          let isDelayed = false;

          if (
            status !== "done" &&
            task.dueDate
          ) {
            const due = new Date(task.dueDate);
            if (due < now) {
              delayed++;
              isDelayed = true;
            }
          }
          if (!isDelayed) {
            if (status === "todo" || !task.status) notStarted++;
            else if (status === "inprogress") inProgress++;
            else if (status === "done") completed++;
          }
        });

        setStats(prev => ({
          ...prev,
          total: totalProjects,
          notStarted,
          inProgress,
          completed,
          delayed,
        }));
      });
    });

    // ถ้าอยากให้ tasks เปลี่ยนแล้วอัปเดตด้วย ให้เพิ่ม listener สำหรับ tasksQuery ด้วย
    const unsubscribeTasks = onSnapshot(tasksQuery, (tasksSnap) => {
      getDocs(projectsQuery).then((projectsSnap) => {
        const totalProjects = projectsSnap.size;
        let notStarted = 0;
        let inProgress = 0;
        let completed = 0;
        let delayed = 0;
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        tasksSnap.forEach(doc => {
          const task = doc.data();
          const status = task.status || "todo";
          let isDelayed = false;
          if (
            status !== "done" &&
            task.dueDate
          ) {
            const due = new Date(task.dueDate);
            if (due < now) {
              delayed++;
              isDelayed = true;
            }
          }
          if (!isDelayed) {
            if (status === "todo" || !task.status) notStarted++;
            else if (status === "inprogress") inProgress++;
            else if (status === "done") completed++;
          }
        });
        setStats(prev => ({
          ...prev,
          total: totalProjects,
          notStarted,
          inProgress,
          completed,
          delayed,
        }));
      });
    });
    // cleanup
    return () => {
      unsubscribeProjects();
      unsubscribeTasks();
    };
  }, [user?.email]);

  // 7 วันย้อนหลัง
  const getLast7Days = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push({
        value: date.toISOString().split("T")[0], // YYYY-MM-DD
        label: formatFullDateTime(date),
      });
    }
    return dates;
  };

  const dateOptions = getLast7Days();
  const todayISO = dateOptions[0].value;
  const [selectedDate, setSelectedDate] = useState(todayISO);

  // ดึงข้อมูล projects ทั้งหมดที่ user เป็นสมาชิก และคำนวณข้อมูลตาราง
  useEffect(() => {
    if (!user?.email) return;
    const projectsQuery = query(
      collection(db, "projects"),
      where("collaborators", "array-contains", user.email)
    );

    const unsubscribe = onSnapshot(projectsQuery, async (projectsSnap) => {
      const projects = projectsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // ดึง tasks ทั้งหมดของแต่ละโปรเจกต์
      const rows = await Promise.all(projects.map(async (proj: any) => {
        const tasksSnap = await getDocs(
          query(
            collection(db, "tasks"),
            where("projectName", "==", proj.name)
          )
        );
        const tasks = tasksSnap.docs.map(d => d.data());
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t: any) => t.status === "done").length;

        // หา dueDate ล่าสุด
        let latestDue = "";
        if (tasks.length > 0) {
          const dueDates = tasks
            .filter((t: any) => !!t.dueDate)
            .map((t: any) => new Date(t.dueDate));
          if (dueDates.length > 0) {
            const latest = new Date(Math.max(...dueDates.map(d => d.getTime())));
            latestDue = formatFullDateTime(latest);
          }
        }
        // Progress %
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // console.log('Project:', proj.name);
        // console.log('  Total Tasks:', totalTasks);
        // console.log('  Completed Tasks:', completedTasks);
        // console.log('  Latest Due:', latestDue);
        // console.log('  Progress:', progress);

        return {
          name: proj.name || "-",
          collaborators: proj.collaborators || [],
          collaboratorProfiles: proj.collaboratorProfiles || {},
          totalTasks,
          due: latestDue || "-",
          progress,
        };
      }));

      setProjectTable(rows);
    });

    return () => unsubscribe();
  }, [user?.email]);

  // ดึง Daily Task Done
  useEffect(() => {
    if (!user?.email || !selectedDate) return;

    // ดึง tasks เฉพาะที่ assignee เป็นเรา และ dueDate ตรงกับวันที่เลือก
    const dailyTasksQuery = query(
      collection(db, "tasks"),
      where("assignee", "==", user.email),
      where("dueDate", "==", selectedDate)
    );
    const unsubscribeDaily = onSnapshot(dailyTasksQuery, (tasksSnap) => {
      let total = 0;
      let done = 0;
      tasksSnap.forEach(doc => {
        total++;
        const task = doc.data();
        if (task.status === "done") done++;
      });
      setDailyTotal(total);
      setDailyCompleted(done);
    });

    return () => unsubscribeDaily();
  }, [user?.email, selectedDate]);

  const progressPercentage = dailyTotal > 0
    ? ((dailyCompleted / dailyTotal) * 100).toFixed(0)
    : "0";

  const displayDate = dateOptions.find((d) => d.value === selectedDate)?.label || "";

  // ค้นหาและ filter
  const filteredProjectTable = projectTable
    .filter(proj => proj.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      // ถ้า a.progress 100 แต่ b ไม่ใช่ ให้ a อยู่หลัง b
      if (a.progress === 100 && b.progress !== 100) return 1;
      // ถ้า b.progress 100 แต่ a ไม่ใช่ ให้ a อยู่หน้า b
      if (a.progress !== 100 && b.progress === 100) return -1;
      // ถ้าเหมือนกัน ให้เรียงตามชื่อ
      return a.name.localeCompare(b.name);
    });

  return (
    <div>
      <main>
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{t("dashboard")}</h2>
        </header>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          {[
            { label: t("total"), value: stats.total, textColor: "text-black", valueColor: "text-black" },
            { label: t("notStarted"), value: stats.notStarted, textColor: "text-dark-700", valueColor: "text-dark-700" },
            { label: t("inprogress"), value: stats.inProgress, textColor: "text-blue", valueColor: "text-blue" },
            { label: t("completed"), value: stats.completed, textColor: "text-green", valueColor: "text-green" },
            { label: t("delayed"), value: stats.delayed, textColor: "text-red", valueColor: "text-red" },
          ].map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex items-center justify-center space-x-2">
                <p className={`${stat.textColor} font-semibold`}>{stat.label}</p>
              </div>
              <span className={`flex flex-col items-center mt-2 text-3xl font-semibold ${stat.valueColor}`}>{stat.value}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Projects Section */}
          <div className="col-span-1 md:col-span-2 bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{t("project")}</h3>
              <label className="input flex items-center space-x-2 border border-gray-300 rounded-md px-2 py-1">
                <svg className="h-5 w-5 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.3-4.3"></path>
                  </g>
                </svg>

                {/* Search */}
                <input
                  type="search"
                  className="grow outline-none"
                  placeholder={t("search")}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </label>
            </div>

            {/* table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-center">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="py-3 px-8 text-gray-600 text-left">{t("Name")}</th>
                    <th className="py-3 px-8 text-gray-600 text-left">{t("Assigned")}</th>
                    <th className="py-3 px-8 text-gray-600 text-left">{t("Task")}</th>
                    <th className="py-3 px-8 text-gray-600 text-left">{t("Due Date")}</th>
                    <th className="py-3 px-8 text-gray-600 text-left">{t("progress")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjectTable.map((proj, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-3 px-4 text-left">{proj.name}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="avatar-group flex flex-wrap md:flex-nowrap -space-x-6">
                          {proj.collaborators.slice(0, 3).map((email: string, idx: number) => {
                            const profile = proj.collaboratorProfiles[email];
                            return (
                              <Tooltip
                                key={idx}
                                title={profile?.displayName || email}
                                placement="top"
                                arrow
                              >
                                <div className="avatar cursor-pointer">
                                  {profile?.profileImage ? (
                                    <img
                                      src={profile.profileImage}
                                      alt={profile.displayName || email}
                                      className="w-8 h-8 rounded-full shadow"
                                    />
                                  ) : (
                                    <ProfileImage email={email} />
                                  )}
                                </div>
                              </Tooltip>
                            );
                          })}
                          {proj.collaborators.length > 3 && (
                            <Tooltip
                              title={
                                <ul className="text-left m-0 p-0">
                                  {proj.collaborators.slice(3).map((email: string, idx: number) => {
                                    const profile = proj.collaboratorProfiles[email];
                                    return (
                                      <li key={idx} className="text-sm">{profile?.displayName || email}</li>
                                    );
                                  })}
                                </ul>
                              }
                              placement="top"
                              arrow
                            >
                              <div className="avatar avatar-placeholder cursor-pointer">
                                <div className="bg-neutral text-neutral-content w-10 flex content-center justify-center font-bold">
                                  <span>+{proj.collaborators.length - 3}</span>
                                </div>
                              </div>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-9 text-left">{proj.totalTasks}</td>
                      <td className="py-3 px-6 text-left">{proj.due}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center w-full">
                          <progress className="progress progress-info w-full" value={proj.progress} max="100"></progress>
                          <span className="ml-2 text-sm text-gray-600">{proj.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProjectTable.length === 0 && (
                    <tr>
                      <td className="py-3 px-4 text-center text-gray-500" colSpan={5}>{t("no_proj")}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Task & Calendar (Right Side) */}
          <div className="flex flex-col gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow w-full">
              <h3 className="text-xl font-semibold mb-4">{t("today")}</h3>

              {/* Dropdown เลือกวันที่ */}
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white mb-2"
              >
                {dateOptions.map((date) => (
                  <option key={date.value} value={date.value}>
                    {date.value === todayISO ? `${t("today")} (${date.label})` : date.label}
                  </option>
                ))}
              </select>

              <div className="flex justify-between items-center mt-2">
                <p className="text-2xl font-bold">{dailyCompleted}/{dailyTotal}</p>
                <span className="text-sm text-gray-500">{progressPercentage}% {t("done")}</span>
              </div>

              {/* Progress Bar */}
              <progress className="progress progress-info w-full" value={progressPercentage} max="100"></progress>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-md w-full">
              <Calendar />
            </div>
          </div>
        </div >
      </main >
    </div >
  );
}