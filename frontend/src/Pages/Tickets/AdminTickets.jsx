import React, { useState, useEffect } from "react";
import { Search, Clock, Filter, SortDesc, Plus } from "lucide-react";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../../axios";
import AdminRaiseTicketModal from "../../Pages/Tickets/RaiseTicketModal";
import { Spin } from "antd";

const AdminTickets = () => {
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const res = await api.get("/tickets/all");
        setTickets(res.data || []);
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const handleNewTicketSubmit = (newTicket) => {
    setTickets((prev) => [...prev, newTicket]);
    setShowModal(false);
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const res = await api.patch(`/tickets/${ticketId}/status`, { status: newStatus });
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket._id === ticketId ? { ...ticket, status: res.data.status } : ticket
        )
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const filteredTickets = tickets.filter((ticket) =>
    ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePriorityChange = async (ticketId, newPriority) => {
    try {
      await api.patch(`/tickets/${ticketId}/priority`, { priority: newPriority });
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket._id === ticketId ? { ...ticket, priority: newPriority } : ticket
        )
      );
    } catch (err) {
      console.error("Failed to update priority:", err);
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-2">
      {/* Header Controls Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 mb-4 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Entries and Search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-700 uppercase tracking-wide">Show</label>
              <select
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                className="text-sm px-3 py-1.5 text-slate-700 bg-white/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {[10, 25, 50].map((val) => (
                  <option key={val} value={val} className="text-slate-700">
                    {val}
                  </option>
                ))}
              </select>
              <span className="text-xs font-medium text-slate-700 uppercase tracking-wide">entries</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                className="pl-10 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white/80 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {/* Filter dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setFilterOpen(!filterOpen);
                  setSortOpen(false);
                }}
                className="p-2 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 transition shadow-sm"
                title="Filter"
              >
                <Filter className="h-4 w-4" />
              </button>
              {filterOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white/95 backdrop-blur-sm border border-white/50 rounded-xl shadow-lg z-20">
                  <button className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50/80 transition">
                    High Priority
                  </button>
                  <button className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50/80 transition">
                    Low Priority
                  </button>
                </div>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setSortOpen(!sortOpen);
                  setFilterOpen(false);
                }}
                className="p-2 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 transition shadow-sm"
                title="Sort"
              >
                <SortDesc className="h-4 w-4" />
              </button>
              {sortOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white/95 backdrop-blur-sm border border-white/50 rounded-xl shadow-lg z-20">
                  <button className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50/80 transition">
                    Newest First
                  </button>
                  <button className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50/80 transition">
                    Oldest First
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-[#64748b] text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:brightness-110 transition-all shadow-sm hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              Create Ticket
            </button>
          </div>
        </div>
      </div>

      {/* Tickets Table Card */}
      {loading ? (
        <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
          <p className="mt-3 text-slate-600 text-xs font-medium uppercase tracking-wide">Loading tickets...</p>
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">Tickets Management</h2>
            <p className="text-[10px] font-medium text-slate-500 mt-1">Manage and assign support tickets</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-100/80 backdrop-blur-sm text-slate-800">
                  <th className="p-3 font-semibold text-xs uppercase tracking-wide border-b border-slate-200 text-left w-2/5">
                    Ticket Details
                  </th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wide border-b border-slate-200 text-center w-1/5">
                    Assignee
                  </th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wide border-b border-slate-200 text-right w-2/5">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length > 0 ? (
                  filteredTickets.slice(0, entriesPerPage).map((ticket, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                      {/* Ticket Info */}
                      <td className="p-3 align-top">
                        <div className="font-medium text-slate-800 text-sm">{ticket.subject}</div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-xs text-slate-500 font-mono">
                            #{ticket.ticketID || ticket._id?.slice(0, 6)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wide 
                              ${ticket.status === "opened"
                              ? "bg-green-100 text-green-800"
                              : ticket.status === "in progress"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                            {ticket.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wide 
                              ${ticket.priority === "High Priority"
                              ? "bg-red-100 text-red-800"
                              : ticket.priority === "Medium Priority"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }`}>
                            {ticket.priority}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      {/* Assignee */}
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          {ticket.assignedTo ? (
                            <>
                              <FaUserCircle className="text-slate-600 w-6 h-6" />
                              <span className="text-xs text-slate-700 font-medium">
                                {ticket.assignedTo?.name || "Not assigned"}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Unassigned</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {/* Status Dropdown */}
                          <select
                            className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 bg-white/80 focus:outline-none focus:ring-1 focus:ring-blue-300"
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                          >
                            <option value="opened">Opened</option>
                            <option value="in progress">In Progress</option>
                            <option value="closed">Closed</option>
                          </select>

                          {/* Priority Dropdown */}
                          <select
                            className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 bg-white/80 focus:outline-none focus:ring-1 focus:ring-blue-300"
                            value={ticket.priority || "Medium Priority"}
                            onChange={(e) => handlePriorityChange(ticket._id, e.target.value)}
                          >
                            <option value="High Priority">High</option>
                            <option value="Medium Priority">Medium</option>
                            <option value="Low Priority">Low</option>
                          </select>

                          {/* Assign Button */}
                          <button
                            onClick={() => navigate(`/admin/assign-ticket/${ticket._id}`, { state: { ticket } })}
                            className="border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50/80 transition shadow-sm hover:shadow-md"
                          >
                            Assign
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500 text-sm">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                        </svg>
                        <p className="text-sm font-medium text-slate-500">No tickets found</p>
                        <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showModal && (
        <AdminRaiseTicketModal
          onClose={() => setShowModal(false)}
          onSubmit={handleNewTicketSubmit}
        />
      )}
    </div>
  );
};

export default AdminTickets;