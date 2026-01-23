import React, { useRef, useState, useEffect } from "react";
import { FiMoreVertical, FiTrash2, FiGift } from "react-icons/fi";
import api from "../../axios";
import { toast } from "react-toastify";

const UpcomingBirthdaysCard = ({ onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef();

  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        const response = await api.get('/users/birthdays/upcoming');
        setBirthdays(response.data);
      } catch (error) {
        console.error("Failed to fetch birthdays:", error);
        toast.error("Failed to load birthday data");
      } finally {
        setLoading(false);
      }
    };

    fetchBirthdays();
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

  if (loading) {
    return (
      <div className="relative bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4 w-full">
        <div className="flex items-center gap-2 mb-3">
          <FiGift className="w-4 h-4 text-pink-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Upcoming Birthdays</h3>
        </div>
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-pink-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="relative bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4 w-full">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiGift className="w-4 h-4 text-pink-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Upcoming Birthdays</h3>
          </div>
          <p className="text-[10px] font-medium text-slate-500">Celebrate your team!</p>
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

      {birthdays.length > 0 ? (
        <ul className="space-y-2 text-[10px] max-h-[200px] overflow-y-auto">
          {birthdays.slice(0, 3).map((b, index) => (
            <li
              key={index}
              className="bg-pink-50 rounded-lg p-3 flex items-center gap-2.5"
            >
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                {b.name?.[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 truncate">{b.name || "Unknown"}</div>
                <div className="text-[9px] text-slate-600 truncate">
                  {b.date || "Date unknown"}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-4 text-[10px] text-slate-500">
          No upcoming birthdays
        </div>
      )}
    </div>
  );
};

export default UpcomingBirthdaysCard;

