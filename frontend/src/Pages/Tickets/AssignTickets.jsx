"use client";

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../axios";
import Toast from "../../Components/Toast";
import {
  ArrowLeft, Trash2, ChevronDown, Flag, User,
  Calendar, Clock, Paperclip, Check, UserPlus, X,
} from "lucide-react";

const AssignTicket = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const ticketData = location.state?.ticket;
  const ticketId = ticketData?._id;

  const [ticket, setTicket] = useState(null);
  const [newResponse, setNewResponse] = useState("");
  const [assignDropdownOpen, setAssignDropdownOpen] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState(null);
  const [technician, setTechnician] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addTechnicianModal, setAddTechnicianModal] = useState(false);
  const [selectedUserToPromote, setSelectedUserToPromote] = useState(null);
  const [promoting, setPromoting] = useState(false);
  
  // Custom Toast State
  const [toast, setToast] = useState(null);

  // Helper to show custom toast
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await api.get(`/tickets/${ticketId}`);
        setTicket(res.data);
        setSelectedAssigneeId(res.data.assignedTo?._id || null);
      } catch (error) {
        showToast(error.response?.data?.message || "Failed to fetch ticket", "error");
      } finally {
        setLoading(false);
      }
    };

    const fetchTechnician = async () => {
      try {
        const res = await api.get("/users/Technician");
        setTechnician(res.data);
      } catch (error) {
        showToast(error.response?.data?.message || "Failed to fetch Technicians", "error");
      }
    };

    const fetchAllUsers = async () => {
      try {
        const res = await api.get("/users");
        // Filter out SuperAdmin users
        const filteredUsers = res.data.filter(user => 
          user.role !== "SuperAdmin" && user.role !== "Technician"
        );
        setAllUsers(filteredUsers);
      } catch (error) {
        showToast(error.response?.data?.message || "Failed to fetch users", "error");
      }
    };

    if (ticketId) {
      fetchTicket();
      fetchTechnician();
      fetchAllUsers();
    }
  }, [ticketId]);

  const assignToUser = async (userId) => {
    try {
      const res = await api.patch(`/tickets/${ticketId}/assign`, { assignedTo: userId });
      setTicket(res.data);
      setSelectedAssigneeId(userId);
      showToast("Ticket assigned successfully");
    } catch (error) {
      showToast("Failed to assign ticket", "error");
    } finally {
      setAssignDropdownOpen(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (newResponse.trim() === "") return;
    try {
      const res = await api.post(`/tickets/${ticketId}/response`, {
        content: newResponse,
        avatar: "👤"
      });
      setTicket(res.data);
      setNewResponse("");
      showToast("Response submitted");
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to submit response", "error");
    }
  };

  const handleDeleteTicket = async () => {
    try {
      await api.delete(`/tickets/${ticketId}`);
      showToast("Ticket deleted");
      setTimeout(() => navigate("/admin/assign-ticket"), 1000);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to delete ticket", "error");
    }
  };

  const handlePromoteToTechnician = async () => {
    if (!selectedUserToPromote) {
      showToast("Please select a user to promote", "error");
      return;
    }

    setPromoting(true);
    try {
      const response = await api.put(`/users/${selectedUserToPromote._id}`, {
        role: "Technician"
      });
      
      // Add to technician list
      setTechnician(prev => [...prev, response.data]);
      
      // Remove from allUsers list
      setAllUsers(prev => prev.filter(user => user._id !== selectedUserToPromote._id));
      
      showToast(`${selectedUserToPromote.name} promoted to Technician successfully`);
      setAddTechnicianModal(false);
      setSelectedUserToPromote(null);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to promote user to Technician", "error");
    } finally {
      setPromoting(false);
    }
  };

  const selectedAssignee = technician.find((u) => u._id === selectedAssigneeId);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent p-2 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
          <p className="mt-3 text-slate-600 text-xs font-medium uppercase tracking-wide">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-transparent p-2 flex items-center justify-center">
        <div className="text-center">
          <p className="mt-3 text-sm font-medium text-slate-500">Ticket not found</p>
          <button
            onClick={() => navigate("/admin/assign-ticket")}
            className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
          >
            Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-2">
      {/* Render Custom Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Add Technician Modal - Updated styling */}
      {addTechnicianModal && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex justify-center items-center p-4 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget && !promoting) {
              setAddTechnicianModal(false);
              setSelectedUserToPromote(null);
            }
          }}
        >
          <div className="w-full max-w-md bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[90vh] animate-fadeIn overflow-hidden">
            {/* Close Button */}
            <button 
              onClick={() => {
                setAddTechnicianModal(false);
                setSelectedUserToPromote(null);
              }}
              className="absolute top-4 right-4 sm:top-5 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light z-10"
              disabled={promoting}
            >
              &times;
            </button>

            {/* Header */}


            <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-slate-50 text-center flex-shrink-0">
              <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-widest uppercase">
                ADD TECHNICIAN
              </h2>
              <p className="text-[9px] text-slate-400 font-black tracking-[0.2em] mt-1 uppercase">Promote User to Technician Role</p>
            </div>

            {/* Form Body */}
            <div className="p-6 sm:p-10 space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar">
              {/* User Selection */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">SELECT USER*</label>
                <div className="relative">
                  <select
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all cursor-pointer appearance-none"
                    value={selectedUserToPromote?._id || ""}
                    onChange={(e) => {
                      const user = allUsers.find(u => u._id === e.target.value);
                      setSelectedUserToPromote(user);
                    }}
                    disabled={promoting}
                  >
                    <option value="">SELECT USER TO PROMOTE</option>
                    {allUsers.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name.toUpperCase()} - {user.role.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* User Details Preview */}
              {selectedUserToPromote && (
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3">
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">NAME</p>
                      <p className="text-sm font-bold text-slate-700 truncate">{selectedUserToPromote.name}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">EMAIL</p>
                      <p className="text-sm font-medium text-slate-600 truncate">{selectedUserToPromote.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CURRENT ROLE</p>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase ${selectedUserToPromote.role === "Admin" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>
                        {selectedUserToPromote.role}
                      </span>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">NEW ROLE</p>
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase bg-green-50 text-green-600">
                        TECHNICIAN
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 flex gap-3 sm:gap-4 bg-white flex-shrink-0">
              <button 
                type="button"
                onClick={() => {
                  setAddTechnicianModal(false);
                  setSelectedUserToPromote(null);
                }}
                disabled={promoting}
                className="flex-1 py-3 sm:py-4 font-black text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors disabled:opacity-50"
              >
                CANCEL
              </button>
              <button 
                type="button"
                onClick={handlePromoteToTechnician}
                disabled={!selectedUserToPromote || promoting}
                className="flex-1 py-3 sm:py-4 bg-[#64748b] text-white rounded-2xl font-black text-[10px] sm:text-[10px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {promoting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    PROMOTING...
                  </span>
                ) : (
                  "PROMOTE TO TECHNICIAN"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-[999]">


      {/* Header Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 mb-4 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate("/admin/assign-ticket")}
              className="p-2 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 transition shadow-sm"
              title="Back to Tickets"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="truncate">
              <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight truncate">
                Ticket #{ticket.ticketID || ticket._id?.slice(0, 6)}: {ticket.subject || ticket.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock size={12} />
                  Created {new Date(ticket.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteTicket}
              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition shadow-sm"
              title="Delete Ticket"
            >
              <Trash2 size={18} />
            </button>

            {/* Add Technician Button */}
            <button
              onClick={() => setAddTechnicianModal(true)}
              className="px-4 py-2 rounded-xl flex items-center gap-2 bg-purple-100 text-purple-800 border border-purple-200 hover:brightness-95 transition-all shadow-sm hover:shadow-md"
              title="Add New Technician"
            >
              <UserPlus size={16} />
              <span className="text-sm font-medium">Add Technician</span>
            </button>

            {/* Assign Dropdown - Increased z-index */}
            <div className="relative z-30">
              <button
                onClick={() => setAssignDropdownOpen(!assignDropdownOpen)}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm ${
                  selectedAssignee 
                    ? "bg-green-100 text-green-800 border border-green-200" 
                    : "bg-blue-100 text-blue-800 border border-blue-200"
                } hover:brightness-95`}
              >
                <User size={16} />
                <span className="text-sm font-medium">
                  {selectedAssignee ? selectedAssignee.name : "Assign Ticket"}
                </span>
                <ChevronDown size={16} />
              </button>

              {assignDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg z-[9999] border border-slate-100 overflow-hidden max-h-60 overflow-y-auto">
                  <div className="py-1">
                    {technician.length > 0 ? (
                      <>
                        <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                          Available Technicians
                        </div>
                        {technician.map((user) => (
                          <button
                            key={user._id}
                            onClick={() => assignToUser(user._id)}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 transition ${
                              selectedAssigneeId === user._id ? "bg-blue-50 text-blue-700" : "text-slate-700"
                            }`}
                          >
                            <User className="w-4 h-4 text-slate-500" />
                            <span className="font-medium">{user.name}</span>
                            {selectedAssigneeId === user._id && (
                              <Check className="w-4 h-4 text-green-500 ml-auto" />
                            )}
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="px-3 py-3 text-center">
                        <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500 font-medium">No technicians available</p>
                        <p className="text-xs text-slate-400 mt-1">Click "Add Technician" to create one</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      </div>


      {/* Main Content - Reduced z-index on containers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative z-0">
        {/* Left Side */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">
              Description
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">{ticket.description}</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Responses</h3>
            <div className="space-y-3">
              {(ticket.responses || []).map((response, i) => (
                <div key={i} className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                      {response.avatar || "👤"}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <h4 className="text-sm font-bold text-slate-800">{response.author}</h4>
                        <span className="text-xs text-slate-500">{new Date(response.time).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-700">{response.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4 relative z-10">
            <textarea
              value={newResponse}
              onChange={(e) => setNewResponse(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 min-h-[120px] text-sm focus:ring-2 focus:ring-blue-300 outline-none"
              placeholder="Type your response here..."
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleSubmitResponse}
                disabled={!newResponse.trim()}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                  newResponse.trim() ? "bg-[#64748b] text-white" : "bg-slate-100 text-slate-400"
                }`}
              >
                Submit Response
              </button>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="space-y-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-800 uppercase mb-3 border-b pb-2">Ticket Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 text-red-800"><Flag size={16} /></div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Priority</p>
                  <p className="text-sm font-bold text-slate-800">{ticket.priority}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-800"><User size={16} /></div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Assignee</p>
                  <p className="text-sm font-bold text-slate-800">{selectedAssignee?.name || "Unassigned"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignTicket;