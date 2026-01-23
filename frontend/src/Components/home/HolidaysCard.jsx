import React, { useState, useEffect, useRef } from "react";
import { FiCalendar, FiTrash2 } from "react-icons/fi";
import { LuMoonStar } from "react-icons/lu";
import { BsStars } from "react-icons/bs";
import { FaTree } from "react-icons/fa";
import holidayApi from '../../api/holidayApi';

const HolidaysCard = ({ onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef();

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const data = await holidayApi.getAllHolidays();
        setHolidays(data);
      } catch (error) {
        console.error("Error fetching holidays:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHolidays();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const today = new Date();
  const upcomingHolidays = holidays
    .filter(h => new Date(h.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const getHolidayIcon = (holidayType) => {
    switch (holidayType.toLowerCase()) {
      case 'religious':
        return <LuMoonStar />;
      case 'national':
        return <BsStars />;
      case 'observance':
        return <FaTree />;
      default:
        return <FiCalendar />;
    }
  };

  const getHolidayColor = (holidayType) => {
    switch (holidayType.toLowerCase()) {
      case 'religious':
        return "bg-orange-100 text-orange-700";
      case 'national':
        return "bg-lime-100 text-lime-700";
      case 'observance':
        return "bg-indigo-100 text-indigo-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="relative bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <FiCalendar className="w-4 h-4 text-orange-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Holidays</h3>
        </div>
        <div className="text-center py-4 text-xs">Loading holidays...</div>
      </div>
    );
  }

  return (
    <div className="relative bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiCalendar className="w-4 h-4 text-orange-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Holidays</h3>
          </div>
          <p className="text-[10px] font-medium text-slate-500">Upcoming</p>
        </div>

        <button
          onClick={onDelete}
          className="text-[10px] text-slate-500 hover:text-red-500 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition"
        >
          Remove
        </button>
      </div>

      {/* Holiday list */}
      <ul className="space-y-2 text-[10px] max-h-[200px] overflow-y-auto">
        {holidays.slice(0, 3).map((holiday, index) => (
          <li
            key={index}
            className="flex items-center bg-[#E0E5EA]/30 rounded-lg p-2 gap-2.5"
          >
            <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${getHolidayColor(holiday.holidayType)}`}>
              {getHolidayIcon(holiday.holidayType)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-700 truncate text-[10px]">{holiday.holidayName}</div>
              <div className="text-[9px] text-slate-500 truncate">
                {new Date(holiday.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HolidaysCard;