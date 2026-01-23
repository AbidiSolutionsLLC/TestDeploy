import React, { useState, useRef, useEffect } from "react";
import { FiMoreVertical, FiTrash2, FiClock } from "react-icons/fi";

const upcomingDeadlines = [
  {
    task: "Submit weekly report",
    dueDate: "Due: May 24",
  },
  {
    task: "Team check-in meeting",
    dueDate: "Due: May 25",
  },
  {
    task: "Complete security training",
    dueDate: "Due: May 28",
  },
];

const UpcomingDeadlinesCard = ({ onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiClock className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Upcoming Deadlines</h3>
          </div>
          <p className="text-[10px] font-medium text-slate-500">
            Tasks due this week
          </p>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <FiMoreVertical className="h-4 w-4 text-slate-600" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-32 bg-white shadow-lg border border-slate-200 rounded-xl z-50">
              <button
                onClick={() => {
                  onDelete();
                  setMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 text-[10px] text-red-500 hover:bg-red-50 font-medium"
              >
                <FiTrash2 className="w-3 h-3 mr-2" />
                Delete Card
              </button>
            </div>
          )}
        </div>
      </div>

      <ul className="space-y-2 text-[10px] max-h-[200px] overflow-y-auto">
        {upcomingDeadlines.map((item, index) => (
          <li
            key={index}
            className="bg-[#E0E5EA]/30 rounded-lg px-3 py-2 flex items-center justify-between gap-2"
          >
            <div className="min-w-0 flex-1">
              <span className="font-medium text-slate-700 truncate block">{item.task}</span>
              <div className="text-[9px] text-slate-500">{item.dueDate}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UpcomingDeadlinesCard;

