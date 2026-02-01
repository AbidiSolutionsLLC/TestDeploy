import React, { useState, useEffect } from "react";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import { IoCalendarNumberOutline } from "react-icons/io5";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUmbrellaBeach,
  FaRegClock,
  FaBusinessTime,
  FaInfoCircle,
  FaRegCalendarAlt
} from "react-icons/fa";
import api from "../../axios";
import { toast } from "react-toastify";

const StatusBadge = ({ status }) => {
  const statusConfig = {
    Present: { icon: <FaCheckCircle className="mr-1" />, color: "bg-green-100 text-green-800" },
    Absent: { icon: <FaTimesCircle className="mr-1" />, color: "bg-red-100 text-red-800" },
    "Half Day": { icon: <FaClock className="mr-1" />, color: "bg-yellow-100 text-yellow-800" },
    Leave: { icon: <FaUmbrellaBeach className="mr-1" />, color: "bg-blue-100 text-blue-800" },
    Holiday: { icon: <FaBusinessTime className="mr-1" />, color: "bg-purple-100 text-purple-800" }
  };

  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wide ${statusConfig[status]?.color || "bg-slate-100 text-slate-800"}`}>
      {statusConfig[status]?.icon || <FaRegClock className="mr-1" />}
      {status}
    </span>
  );
};

const formatTime = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const Attendance = () => {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(() => {
    const start = new Date(today);
    const dayOfWeek = start.getDay();
    const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    start.setDate(diff);
    return start;
  });

  const [selectedDate, setSelectedDate] = useState(today);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [expandedView, setExpandedView] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAttendanceData = async (startDate) => {
    try {
      setLoading(true);
      const month = startDate.getMonth() + 1;
      const year = startDate.getFullYear();

      const response = await api.get(`/timetrackers/attendance/${month}/${year}`);
      setAttendanceData(response.data);
    } catch (error) {
      toast.error("Failed to load attendance data");
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData(weekStart);
  }, [weekStart]);

  const generateWeeklyData = (startOfWeek) => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      day.setHours(0, 0, 0, 0);

      const dayData = attendanceData.find(d => {
        const recordDate = new Date(d.date);

        return (
          recordDate.getUTCFullYear() === day.getFullYear() &&
          recordDate.getUTCMonth() === day.getMonth() &&
          recordDate.getUTCDate() === day.getDate()
        );
      });

      if (dayData) {
        days.push({
          date: day.getDate(),
          dayName: day.toLocaleDateString("en-US", { weekday: "short" }),
          fullDate: day.toDateString(),
          status: dayData.status,
          checkIn: formatTime(dayData.checkInTime),
          checkOut: formatTime(dayData.checkOutTime),
          totalHours: dayData.totalHours || 0,
          notes: dayData.notes,
        });
      } else if (day > today) {
        days.push({
          date: day.getDate(),
          dayName: day.toLocaleDateString("en-US", { weekday: "short" }),
          fullDate: day.toDateString(),
          status: "Upcoming",
          checkIn: null,
          checkOut: null,
          totalHours: 0,
          notes: null,
        });
      } else {
        days.push({
          date: day.getDate(),
          dayName: day.toLocaleDateString("en-US", { weekday: "short" }),
          fullDate: day.toDateString(),
          status: "Absent",
          checkIn: null,
          checkOut: null,
          totalHours: 0,
          notes: "No attendance record",
        });
      }
    }
    return days;
  };

  const weeklyData = generateWeeklyData(weekStart);

  const formatWeekRange = () => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

  const navigateToPreviousPeriod = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() - 7);
    setWeekStart(newStart);
    setSelectedDay(null);
  };

  const navigateToNextPeriod = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + 7);
    setWeekStart(newStart);
    setSelectedDay(null);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const newStart = new Date(date);
    newStart.setDate(diff);
    setWeekStart(newStart);
  };

  const toggleDayDetails = (index) => {
    setSelectedDay(selectedDay === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-transparent p-2">
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 mb-4 p-4 relative z-50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">Attendance</h2>
            <button
              onClick={() => setExpandedView(!expandedView)}
              className="text-xs text-slate-600 flex items-center gap-1 hover:text-slate-800 transition-colors font-medium"
            >
              <FaInfoCircle size={14} />
              {expandedView ? "Compact view" : "Detailed view"}
            </button>
          </div>

          <div className="flex flex-row items-center gap-3">
            <button
              onClick={navigateToPreviousPeriod}
              className="p-2.5 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 transition shadow-sm"
            >
              <FaAngleLeft size={18} />
            </button>

            <div className="relative">
              <button
                className="px-3 py-2 text-blue-800 bg-blue-100 rounded-lg flex items-center gap-2 hover:bg-blue-200 transition shadow-sm text-sm font-medium"
                onClick={() => setShowCalendar(!showCalendar)}
              >
                <IoCalendarNumberOutline size={18} />
                <span className="text-sm font-medium">{formatWeekRange()}</span>
                <FaRegCalendarAlt size={14} />
              </button>

              {showCalendar && (
                <div className="absolute z-[100] mt-2 right-0 sm:left-0 bg-white shadow-2xl rounded-xl border border-slate-200 p-2">
                  <DatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    open={showCalendar}
                    onClickOutside={() => setShowCalendar(false)}
                  />
                </div>
              )}
            </div>

            <button
              onClick={navigateToNextPeriod}
              className="p-2.5 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 transition shadow-sm"
            >
              <FaAngleRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* FIX: Added 'relative z-0' to keep it below the header dropdowns 
      */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-2 w-full overflow-x-auto relative z-0">
        {loading ? (
          <div className="text-center p-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
            <p className="mt-3 text-slate-600 text-xs font-medium uppercase tracking-wide">Loading attendance data...</p>
          </div>
        ) : (
          <div className="relative">
            {/* ... rest of the timeline code remains exactly the same ... */}
            <div className="absolute left-20 top-0 h-full w-0.5 bg-slate-200 transform translate-x-1/2"></div>
            <div className="space-y-4">
              {weeklyData.map((day, index) => (
                <div
                  key={index}
                  className="relative flex items-start group transition-all duration-150"
                >
                  <div className={`absolute left-[66px] top-6 h-4 w-4 rounded-full transform translate-x-1/2 z-10 border-2 border-white ${day.status === "Present" ? "bg-green-500" :
                      day.status === "Absent" ? "bg-red-500" :
                        day.status === "Half Day" ? "bg-yellow-500" :
                          day.status === "Leave" ? "bg-blue-500" : "bg-purple-500"
                    } ${new Date(day.fullDate).toDateString() === today.toDateString() ? "animate-pulse shadow-lg" : ""}`}></div>

                  <div className="flex-shrink-0 w-20 text-center pt-1">
                    <div className={`text-xs text-slate-600 font-medium uppercase tracking-wide ${day.dayName === 'Sat' || day.dayName === 'Sun' ? 'text-blue-600' : ''
                      }`}>
                      {day.dayName}
                    </div>
                    <div className={`text-xl font-bold mt-1 ${day.dayName === 'Sat' || day.dayName === 'Sun' ? 'text-blue-800' : 'text-slate-800'
                      } ${new Date(day.fullDate).toDateString() === today.toDateString() ?
                        "text-blue-600" : ""
                      }`}>
                      {day.date}
                    </div>
                  </div>

                  <div
                    className={`flex-grow ml-8 p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${selectedDay === index ?
                        "border-blue-300 shadow-md bg-blue-50/80" :
                        "border-slate-100 hover:border-slate-200"
                      } border`}
                    onClick={() => toggleDayDetails(index)}
                  >
                    <div className="flex justify-between items-start">
                      <StatusBadge status={day.status} />

                      {day.totalHours > 0 && (
                        <div className="text-base font-bold text-slate-800 flex items-center">
                          <span className="text-xs font-normal text-slate-600 mr-1">Total:</span>
                          {day.totalHours} <span className="text-xs font-normal text-slate-600 ml-1">hrs</span>
                        </div>
                      )}
                    </div>

                    {(day.checkIn || day.checkOut) && (
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-700">
                        {day.checkIn && (
                          <div className="flex items-center">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                            <span className="font-medium">In:</span> <span className="font-mono ml-1">{day.checkIn}</span>
                          </div>
                        )}
                        {day.checkOut && (
                          <div className="flex items-center">
                            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                            <span className="font-medium">Out:</span> <span className="font-mono ml-1">{day.checkOut}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {expandedView && (
                      <div className="mt-3 text-sm text-slate-600">
                        {day.notes && (
                          <div className="flex items-start">
                            <span className="text-slate-400 mr-2">•</span>
                            <span>{day.notes}</span>
                          </div>
                        )}
                        {day.status === "Present" && (
                          <div className="flex items-start mt-1">
                            <span className="text-slate-400 mr-2">•</span>
                            <span>Regular working day</span>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedDay === index && !expandedView && day.notes && (
                      <div className="mt-3 p-3 bg-slate-50/80 rounded text-sm text-slate-700 border-t border-slate-200">
                        {day.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary Card */}
      <div className="mt-6 bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
        {/* ... summary content remains same ... */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-xs font-medium text-slate-800 uppercase tracking-wide">
              Present: <span className="font-bold text-slate-800">{weeklyData.filter(d => d.status === "Present").length} days</span>
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <span className="text-xs font-medium text-slate-800 uppercase tracking-wide">
              Half Day: <span className="font-bold text-slate-800">{weeklyData.filter(d => d.status === "Half Day").length} days</span>
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-xs font-medium text-slate-800 uppercase tracking-wide">
              Leave: <span className="font-bold text-slate-800">{weeklyData.filter(d => d.status === "Leave").length} days</span>
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-xs font-medium text-slate-800 uppercase tracking-wide">
              Absent: <span className="font-bold text-slate-800">{weeklyData.filter(d => d.status === "Absent").length} days</span>
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
            <span className="text-xs font-medium text-slate-800 uppercase tracking-wide">
              Holiday: <span className="font-bold text-slate-800">{weeklyData.filter(d => d.status === "Holiday").length} days</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;