import * as React from "react";
import dayjs, { Dayjs } from "dayjs";
import Badge from "@mui/material/Badge";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";

// ข้อมูล Event
const events: { [key: string]: { [date: string]: string[] } } = {
  "2025-03": {
    "10": ["ประชุมทีม"],
    "19": ["ส่งโปรเจค"],
    "31": ["ทำรายงาน"],
  },
  "2025-04": {
    "5": ["ประชุม"],
    "20": ["สัมมนา"],
  },
};

const initialValue = dayjs(); // วันที่เริ่มต้นเป็นวันนี้

// คอมโพเนนต์ Custom Day ที่มี Badge
function EventDay(props: PickersDayProps<Dayjs> & { events?: string[] }) {
  const { day, outsideCurrentMonth, events = [], ...other } = props;

  return (
    <Badge
      key={day.toString()}
      overlap="circular"
      badgeContent={
        events.length > 0 && !outsideCurrentMonth ? (
          <div
            style={{
              width: "8px",  // ขนาดจุด
              height: "8px", // ขนาดจุด
              borderRadius: "50%", // ทำให้เป็นวงกลม
              backgroundColor: "red", // สีจุด
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
  const [selectedDate, setSelectedDate] = React.useState<Dayjs>(initialValue);
  const [currentMonth, setCurrentMonth] = React.useState<number>(initialValue.month() + 1);
  const [currentYear, setCurrentYear] = React.useState<number>(initialValue.year());

  // ฟังก์ชันหากิจกรรมของวันที่เลือก
  const getEventsForDate = (date: Dayjs) => {
    const monthYear = `${date.year()}-${String(date.month() + 1).padStart(2, "0")}`;
    return events[monthYear]?.[String(date.date())] || [];
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateCalendar
        value={selectedDate}
        onChange={(newDate) => {
          if (newDate) {
            setSelectedDate(newDate);
            setCurrentMonth(newDate.month() + 1);
            setCurrentYear(newDate.year());
          }
        }}
        slots={{
          day: (dayProps) => (
            <EventDay
              {...dayProps}
              events={getEventsForDate(dayProps.day)}
            />
          ),
        }}
      />

      {/* แสดง Event ของวันที่เลือก */}
      <div className="p-4 mt-4">
        <p className="text-lg font-bold mb-3">
          📅 Events on {selectedDate.format("DD/MM/YYYY")}
        </p>
        <div className="space-y-3">
          {getEventsForDate(selectedDate).length > 0 ? (
            getEventsForDate(selectedDate).map((event, index) => (
              <div
                key={index}
                className="flex items-center p-3 border-l-4 border-pink-300 rounded-lg bg-pink-200 bg-opacity-30"
              >
                <span className="text-xl mr-3">📌</span>
                <p className="text-base font-medium">{event}</p>
              </div>
            ))
          ) : (
            <div className="p-3 text-gray-500 italic">
              ไม่มีกิจกรรมในวันนี้
            </div>
          )}
        </div>
      </div>
    </LocalizationProvider>
  );
}

// "use client";

// import * as React from "react";
// import { Calendar } from "@/components/ui/calendar"; // import ShadCN Calendar

// // สมมติข้อมูล event
// const events: { [key: string]: { [date: string]: string[] } } = {
//     "2025-03": {
//         "10": ["ประชุมทีม"],
//         "19": ["ส่งโปรเจค"],
//         "31": ["ทำรายงาน"],
//     },
//     "2025-04": {
//         "5": ["ประชุมคณะกรรมการ"],
//         "20": ["สัมมนา"],
//     },
// };

// export default function CalendarPage() {
//     const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date()); // เริ่มต้นที่วันที่วันนี้
//     const [currentMonth, setCurrentMonth] = React.useState<number>(new Date().getMonth()); // เดือนปัจจุบัน
//     const [currentYear, setCurrentYear] = React.useState<number>(new Date().getFullYear()); // ปีปัจจุบัน

//     // ฟังก์ชันการค้นหากิจกรรมในวันที่เลือก
//     const getEventForDate = (date: Date) => {
//         const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
//         if (events[monthYear] && events[monthYear][String(date.getDate())]) {
//             return events[monthYear][String(date.getDate())];
//         }
//         return [];
//     };

//     return (
//         <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-md w-full">
//             {/* Calendar component */}
//             <Calendar
//                 selected={selectedDate}
//                 onSelect={(date) => {
//                     setSelectedDate(date); // อัปเดตวันที่ที่เลือก
//                     if (date) {
//                         setCurrentMonth(date.getMonth()); // อัปเดตเดือนที่เลือก
//                         setCurrentYear(date.getFullYear()); // อัปเดตปีที่เลือก
//                     }
//                 }}
//                 mode="single"
//                 className="w-full"
//             />

//             {/* แสดงกิจกรรมที่ตรงกับวันที่เลือก */}
//             <div className="p-3 mt-4">
//                 <h4 className="text-lg font-semibold">Events:</h4>
//                 <ul className="list-disc pl-5">
//                     {selectedDate && getEventForDate(selectedDate)?.length === 0 ? (
//                         <li>ไม่มีกิจกรรมในวันนี้</li>
//                     ) : (
//                         selectedDate &&
//                         getEventForDate(selectedDate).map((event, index) => (
//                             <li key={index}>{event}</li>
//                         ))
//                     )}
//                 </ul>
//             </div>
//         </div>
//     );
// }

// import { useState } from "react";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

// // สมมติข้อมูล event
// const events: { [key: string]: { [date: string]: string[] } } = {
//     "2025-03": {
//         "10": ["ประชุมทีม"],
//         "19": ["ส่งโปรเจค"],
//         "31": ["ทำรายงาน"],
//     },
//     "2025-04": {
//         "5": ["ประชุมคณะกรรมการ"],
//         "20": ["สัมมนา"],
//     },
// };

// const Calendar = () => {
//     const [selectedDate, setSelectedDate] = useState<string>(`${new Date().getDate()}`); // เริ่มต้นที่วันที่วันนี้
//     const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth()); // เดือนปัจจุบัน
//     const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear()); // ปีปัจจุบัน

//     // ฟังก์ชันในการสร้างวันที่ในเดือนปัจจุบัน
//     const generateCalendarDays = () => {
//         const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // หาจำนวนวันที่ในเดือนนั้น
//         const daysArray = Array.from({ length: daysInMonth }, (_, index) => index + 1);
//         return daysArray;
//     };

//     // ฟังก์ชันในการแสดงชื่อเดือน
//     const currentMonthName = new Intl.DateTimeFormat("en-EN", { month: "long" }).format(new Date(currentYear, currentMonth));

//     // ฟังก์ชันการเปลี่ยนเดือน
//     const handlePreviousMonth = () => {
//         if (currentMonth === 0) {
//             setCurrentMonth(11); // ถ้าเดือนมกราคม, ให้กลับไปเดือนธันวาคม
//             setCurrentYear(currentYear - 1); // ลดปีลง
//         } else {
//             setCurrentMonth(currentMonth - 1); // ลดเดือนลง
//         }
//     };

//     const handleNextMonth = () => {
//         if (currentMonth === 11) {
//             setCurrentMonth(0); // ถ้าเดือนธันวาคม, ให้ไปเดือนมกราคม
//             setCurrentYear(currentYear + 1); // เพิ่มปีขึ้น
//         } else {
//             setCurrentMonth(currentMonth + 1); // เพิ่มเดือนขึ้น
//         }
//     };

//     // ตัวเลือกวันที่ในเดือน
//     const calendarDays = generateCalendarDays();

//     const getEventForDate = (date: string) => {
//         const monthYear = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
//         if (events[monthYear] && events[monthYear][date]) {
//             return events[monthYear][date];
//         }
//         return [];
//     };

//     return (
//         <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">

//             <div className="flex justify-between items-center mb-4">
//                 <button onClick={handlePreviousMonth} className="p-2">
//                     <FontAwesomeIcon icon={faChevronLeft} />
//                 </button>
//                 <h3 className="text-xl font-semibold text-center">
//                     {`${currentMonthName} ${currentYear}`}
//                 </h3>
//                 <button onClick={handleNextMonth} className="p-2">
//                     <FontAwesomeIcon icon={faChevronRight} />
//                 </button>
//             </div>

//             <div className="grid grid-cols-7 gap-2">
//                 {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
//                     <div key={day} className="text-center font-semibold text-gray-600 dark:text-gray-300">
//                         {day}
//                     </div>
//                 ))}

//                 {calendarDays.map((day) => (
//                     <div
//                         key={day}
//                         className={`text-center py-2 cursor-pointer rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 ${selectedDate === `${day}` && `${day}` !== `${new Date().getDate()}`
//                             ? "bg-gray-300 dark:bg-gray-600"
//                             : ""
//                             } ${new Date().getDate() === day
//                                 ? "bg-blue text-white"
//                                 : ""
//                             }`}
//                         onClick={() => setSelectedDate(`${day}`)}
//                     >
//                         {day}
//                     </div>
//                 ))}
//             </div>

//             {/* แสดง Event ของวันที่เลือก */}
//             <div className="mt-6">
//                 <h4 className="text-lg font-semibold">Events:</h4>
//                 <ul className="list-disc pl-5">
//                     {(getEventForDate(selectedDate)?.length ?? 0) === 0 ? (
//                         <li>ไม่มีกิจกรรมในวันนี้</li>
//                     ) : (
//                         getEventForDate(selectedDate).map((event, index) => (
//                             <li key={index}>{event}</li>
//                         ))
//                     )}
//                 </ul>
//             </div>
//         </div>
//     );
// };

// export default Calendar;