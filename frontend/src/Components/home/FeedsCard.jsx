import React, { useState, useRef, useEffect } from "react";
import { FiActivity } from "react-icons/fi";

const feedsData = [
  { message: "Your request was approved from admin", actionType: "status" },
  { message: "Your log request was approved by project manager" },
  { message: "You have a message", description: "Hi, Paul, our new project would start from.....", actionType: "checkin" },
  { message: "You have not checked in yet." },
];

const FeedsCard = ({ onDelete }) => {
  return (
    <div className="relative bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiActivity className="w-4 h-4 text-green-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Feeds</h3>
          </div>
          <p className="text-[10px] font-medium text-slate-500">4+ unread messages</p>
        </div>

        <button
          onClick={onDelete}
          className="text-[10px] text-slate-500 hover:text-red-500 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition"
        >
          Remove
        </button>
      </div>

      {/* Feed list */}
      <ul className="space-y-2 text-[10px] max-h-[100px] overflow-y-auto">
        {feedsData.map((item, index) => (
          <li
            key={index}
            className="bg-[#E0E5EA]/30 rounded-lg px-3 py-2 flex items-center justify-between gap-2"
          >
            <div className="min-w-0 flex-1">
              <span className="font-medium text-slate-700 truncate block">{item.message}</span>
              {item.description && (
                <div className="text-[9px] text-slate-500 truncate mt-0.5">{item.description}</div>
              )}
            </div>

            {item.actionType && (
              <button
                className={`text-[9px] px-2 py-1 rounded-md font-medium shrink-0 ${item.actionType === "status" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
              >
                {item.actionType === "status" ? "View" : "Check-in"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FeedsCard;