import React, { useState, useEffect, useRef } from "react";
import { GoGraph } from "react-icons/go";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import api from "../../axios";
import { toast } from "react-toastify";

const AttendanceCard = ({ onDelete }) => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const maxBarHeight = 70;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  const getWeekStartDate = () => {
    const today = new Date();
    const start = new Date(today);
    const dayOfWeek = start.getDay();
    const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const fetchWeeklyData = async () => {
    try {
      setLoading(true);
      const weekStart = getWeekStartDate();
      const month = weekStart.getMonth() + 1;
      const year = weekStart.getFullYear();
      
      const response = await api.get(`/timetrackers/attendance/${month}/${year}`);
      console.log("Weekly Attendance Data:", response.data);
      processWeeklyData(response.data, weekStart);
    } catch (error) {
      toast.error("Failed to load attendance data");
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const processWeeklyData = (attendanceData, weekStart) => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(weekStart);
      currentDay.setDate(weekStart.getDate() + i);
      currentDay.setHours(0, 0, 0, 0);

      const dayData = attendanceData.find(d => {
        const recordDate = new Date(d.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === currentDay.getTime();
      });

      let hours = 0;
      let status = currentDay > today ? 'Upcoming' : 'Absent';
      
      if (dayData) {
        status = dayData.status || status;
        
        if (dayData.totalHours) {
          hours = dayData.totalHours;
        } else if (dayData.checkInTime && dayData.checkOutTime) {
          const checkIn = new Date(dayData.checkInTime);
          const checkOut = new Date(dayData.checkOutTime);
          const diffMs = checkOut - checkIn;
          hours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
        } else if (dayData.status === 'Present') {
          hours = 8;
        } else if (dayData.status === 'Half Day') {
          hours = 4;
        }
      }

      days.push({
        day: currentDay.toLocaleDateString("en-US", { weekday: "short" }),
        hours: hours,
        date: currentDay.getDate(),
        status: status
      });
    }

    console.log("Processed Weekly Data:", days);
    setWeeklyData(days);
  };

  useEffect(() => {
    fetchWeeklyData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalHours = weeklyData.reduce((sum, val) => sum + val.hours, 0);

  return (
    <div className="relative bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GoGraph className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Weekly Attendance</h3>
          </div>
          <p className="text-[10px] font-medium text-slate-500">{totalHours} total hours</p>
        </div>

        <button
          onClick={onDelete}
          className="text-[10px] text-slate-500 hover:text-red-500 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition"
        >
          Remove
        </button>
      </div>

      {/* Bar Chart */}
      <div className="bg-[#E0E5EA]/30 rounded-xl p-3 overflow-auto">
        <div className="flex items-end justify-between h-20 gap-1.5">
          {weeklyData.map(({ day, hours, status }, i) => {
            let color = "bg-slate-300";
            if (status === 'Absent') color = "bg-red-500";
            else if (status === 'Present' && hours >= 7) color = "bg-green-500";
            else if (status === 'Half Day') color = "bg-yellow-500";
            else if (status === 'Present') color = "bg-blue-400";
            else if (status === 'Upcoming') color = "bg-slate-300";

            const barHeight = Math.min((hours / 10) * maxBarHeight, maxBarHeight);

            return (
              <div key={i} className="flex flex-col items-center justify-end flex-1">
                <div
                  className={`w-2 ${color} rounded transition-all duration-300`}
                  style={{ height: `${barHeight}px` }}
                ></div>
                <div className="mt-1 text-center leading-tight">
                  <span className="block text-[9px] font-semibold text-slate-700">
                    {day}
                  </span>
                  <span className="block text-[8px] text-slate-600">
                    {status === 'Upcoming' ? '-' : `${hours}h`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AttendanceCard;