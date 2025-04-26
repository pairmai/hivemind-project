"use client";

import { useState } from "react";
import Calendar from "@/app/components/DateCalendar";
import { useTranslations } from "next-intl";

export default function Dashboard({ darkMode, setDarkMode }: { darkMode: boolean; setDarkMode: (value: boolean) => void }) {
  const t = useTranslations("dashboard");
  // const [darkMode, setDarkMode] = useState(false);
  const totalTasks = 23;
  const completedTasks = 17;
  const progressPercentage = ((completedTasks / totalTasks) * 100).toFixed(0); // คิดเป็น %

  const getLast7Days = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push({
        value: date.toISOString().split("T")[0], // รูปแบบ YYYY-MM-DD
        label: date.toLocaleDateString("en-EN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      });
    }
    return dates;
  };

  const dateOptions = getLast7Days();
  const todayISO = dateOptions[0].value; // ค่าวันนี้เป็นค่าเริ่มต้น

  const [selectedDate, setSelectedDate] = useState(todayISO);

  // แปลงวันที่ที่เลือกให้อยู่ในรูปแบบที่แสดง
  const displayDate = dateOptions.find((d) => d.value === selectedDate)?.label || "";

  return (
    <div className={`${darkMode ? "bg-gray-900 border-gray-700" : ""}`}>
      <main>
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{t("dashboard")}</h2>
        </header>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          {[
            { label: t("total"), value: 30, textColor: "text-black", valueColor: "text-black" },
            { label: t("notStarted"), value: 7, textColor: "text-dark-700", valueColor: "text-dark-700" },
            { label: t("inprogress"), value: 11, textColor: "text-blue", valueColor: "text-blue" },
            { label: t("completed"), value: 9, textColor: "text-green", valueColor: "text-green" },
            { label: t("delayed"), value: 3, textColor: "text-red", valueColor: "text-red" },
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
              <h3 className="text-lg font-semibold">Projects</h3>
              <label className="input flex items-center space-x-2 border border-gray-300 rounded-md px-2 py-1">
                <svg className="h-5 w-5 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.3-4.3"></path>
                  </g>
                </svg>
                <input type="search" className="grow outline-none" placeholder="Search Projects" />
              </label>
            </div>

            {/* ตาราง */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-center">
                <thead>
                  <tr className="border-b border-gray-300">
                    {[t("Name"), t("Assigned"), t("Task"), t("Due Date"), t("progress")].map((header) => (
                      <th key={header} className="py-3 px-8 text-gray-600 text-left">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "ABCD Project", tasks: 100, due: "Jan 22, 2025", progress: 85 },
                    { name: "EFGH Project", tasks: 144, due: "Feb 3, 2025", progress: 50 },
                  ].map((proj, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-3 px-4 text-left">{proj.name}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="avatar-group flex flex-wrap md:flex-nowrap -space-x-4">
                          <div className="avatar">
                            <div className="w-8">
                              <img src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
                            </div>
                          </div>
                          <div className="avatar">
                            <div className="w-8">
                              <img src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
                            </div>
                          </div>
                          <div className="avatar">
                            <div className="w-8">
                              <img src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
                            </div>
                          </div>
                          <div className="avatar avatar-placeholder">
                            <div className="bg-neutral text-neutral-content w-8">
                              <span>+9</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-9 text-left">{proj.tasks}</td>
                      <td className="py-3 px-6 text-left">{proj.due}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center w-full">
                          <progress className="progress progress-info w-full" value={proj.progress} max="100"></progress>
                          <span className="ml-2 text-sm text-gray-600">{proj.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Daily Task & Calendar (Right Side) */}
          <div className="flex flex-col gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow w-full">
              <h3 className="text-xl font-semibold mb-4">Daily Task Done</h3>

              {/* Dropdown เลือกวันที่ */}
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white mb-2"
              >
                {dateOptions.map((date) => (
                  <option key={date.value} value={date.value}>
                    {date.value === todayISO ? `Today (${date.label})` : date.label}
                  </option>
                ))}
              </select>

              <div className="flex justify-between items-center mt-2">
                <p className="text-2xl font-bold">{completedTasks}/{totalTasks}</p>
                <span className="text-sm text-gray-500">{progressPercentage}% Done</span>
              </div>

              {/* Progress Bar */}
              <progress className="progress progress-info w-full" value={progressPercentage} max="100"></progress>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-md w-full">
              <Calendar />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 