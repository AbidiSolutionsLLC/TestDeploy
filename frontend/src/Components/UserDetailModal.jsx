import React, { useState, useRef, useEffect } from "react";
import api from "../axios";
import { FaEdit, FaPlus, FaTrash, FaEnvelope, FaCheck } from "react-icons/fa"; // Added FaCheck
import { toast } from "react-toastify";
import CreateDepartmentModal from "./CreateDepartmentModal";
import ModernSelect from "./ui/ModernSelect";
import ModernDatePicker from "./ui/ModernDatePicker";

const UserDetailModal = ({ user, isOpen, onClose, onUserUpdated, allManagers, allDepartments }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        designation: user.designation || "",
        department: user.department?._id || "",
        reportsTo: user.reportsTo?._id || "",
        role: user.role || "Employee",
        empType: user.empType || "Permanent",
        joiningDate: user.joiningDate?.split('T')[0] || "",
        phoneNumber: user.phoneNumber || "",
        branch: user.branch || "Karachi",
        timeZone: user.timeZone || "Asia/Karachi",
        empStatus: user.empStatus || "Pending",
        isTechnician: user.isTechnician || false // Added this
      });
      setErrors({});
    }
  }, [user]);

  // ... (validateField logic remains the same) ...
  const validateField = (name, value) => {
    switch (name) {
      case "name": return value.trim() ? "" : "Name is required";
      case "email": return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Valid email is required";
      case "phoneNumber": return value.trim() ? "" : "Phone number is required";
      case "designation": return value.trim() ? "" : "Designation is required";
      case "department": return value ? "" : "Department is required";
      case "joiningDate": return value ? "" : "Joining date is required";
      case "branch": return value.trim() ? "" : "Branch is required";
      default: return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ["name", "email", "phoneNumber", "designation", "department", "joiningDate", "branch"];
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix all validation errors");
      return;
    }
    setIsLoading(true);
    try {
      const changedFields = {};
      Object.keys(formData).forEach(key => {
        let originalValue = user[key];
        let newValue = formData[key];
        
        // --- FIX: Normalize Super Admin Role for Enum ---
        if (key === 'role' && newValue === "Super Admin") {
           newValue = "Super Admin";
        }
        // ------------------------------------------------

        if (key === 'department') originalValue = user.department?._id || "";
        if (key === 'reportsTo') originalValue = user.reportsTo?._id || "";
        if (key === 'joiningDate') originalValue = user.joiningDate?.split('T')[0] || "";
        if (originalValue === null || originalValue === undefined) originalValue = "";
        if (newValue === null || newValue === undefined) newValue = "";
        
        // Handle Boolean specifically for isTechnician
        if (key === 'isTechnician') {
           if (newValue !== originalValue) changedFields[key] = newValue;
        } else {
           if (String(newValue) !== String(originalValue)) changedFields[key] = newValue;
        }
      });

      if (Object.keys(changedFields).length === 0) {
        toast.info("No changes to save");
        setIsLoading(false);
        setIsEditing(false);
        return;
      }

      await api.put(`/users/${user._id}`, changedFields);
      onUserUpdated();
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error(error.response?.data?.message || "Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await api.delete(`/users/${user._id}`);
      toast.success("User deleted successfully");
      onUserUpdated("delete");
      onClose();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResendInvite = async () => {
    setIsResending(true);
    try {
      await api.post(`/users/${user._id}/resend-invite`);
      toast.success(`Invitation resent to ${user.email}`);
    } catch (error) {
      console.error("Resend failed:", error);
      toast.error(error.response?.data?.message || "Failed to resend invitation");
    } finally {
      setIsResending(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
      setIsEditing(false);
    }
  };

  const renderField = (label, name, value, type = "text", options = [], isRequired = true) => {
    const error = errors[name];
    const formattedOptions = options.map(opt => ({
      value: opt.value || opt._id,
      label: opt.label || opt.name?.toUpperCase()
    }));

    if (isEditing) {
      if (type === "select") {
        if (name === "department") {
          return (
            <div className="flex gap-2 items-end">
              <ModernSelect label={label} name={name} value={value} onChange={handleChange} required={isRequired} options={formattedOptions} placeholder={`SELECT ${label.toUpperCase()}`} className="flex-1" />
              <button type="button" onClick={() => setIsDeptModalOpen(true)} className="px-4 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors mb-[1px] shadow-sm h-[46px] flex items-center justify-center"><FaPlus className="text-xs" /></button>
            </div>
          );
        }
        return <ModernSelect label={label} name={name} value={value} onChange={handleChange} required={isRequired} options={formattedOptions} placeholder={`SELECT ${label.toUpperCase()}`} />;
      }
      if (type === "date") {
        return <ModernDatePicker label={label} name={name} value={value} onChange={handleChange} required={isRequired} placeholder="Select Date" />;
      }
      return (
        <div>
          <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">{label} {isRequired && <span className="text-red-500">*</span>}</label>
          <input type={type} name={name} value={value} onChange={handleChange} className={`w-full bg-white border ${error ? "border-red-300" : "border-slate-200"} rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300`} required={isRequired} />
          {error && <p className="text-red-500 text-xs font-medium mt-1">{error}</p>}
        </div>
      );
    }

    return (
      <div>
        <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">{label}</label>
        <div className="bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium">
          {type === "status" ? (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${value === "Active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : value === "Pending" ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${value === "Active" ? "bg-emerald-500" : value === "Pending" ? "bg-amber-500" : "bg-rose-500"}`}></span> {value}
            </span>
          ) : type === "role" ? (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${value === "Admin" ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-blue-50 text-blue-600 border-blue-100"}`}>{value}</span>
          ) : name === "department" ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">{allDepartments.find(d => d._id === value)?.name || "-"}</span>
          ) : name === "reportsTo" ? (
            <span className="text-sm font-medium">{allManagers.find(m => m._id === value)?.name || "-"}</span>
          ) : name === "joiningDate" ? (
            <span className="text-sm font-medium">{value ? new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "-"}</span>
          ) : (
            <span className="text-sm font-medium">{value || "-"}</span>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen || !user) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex justify-center items-center p-4" onClick={handleBackdropClick}>
        <div ref={modalRef} className="w-full max-w-4xl bg-white rounded-[1.5rem] shadow-2xl relative flex flex-col max-h-[90vh] animate-fadeIn overflow-hidden">
          {/* Header */}
          <div className="bg-white/90 backdrop-blur-sm rounded-t-[1.2rem] border-b border-white/50 p-4 sm:p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-md" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-[#E0E5EA] text-slate-700 flex items-center justify-center text-lg font-bold border-2 border-white shadow-md">{user.name?.charAt(0).toUpperCase()}</div>
                )}
                <div>
                  <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">{user.name}</h2>
                  <div className="flex items-center gap-2">
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{user.designation} • {user.empID}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.empStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' : user.empStatus === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{user.empStatus}</span>
                    {/* Show Tech Badge in View Mode */}
                    {user.isTechnician && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700">Technician</span>}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {!isEditing && (user.empStatus === 'Pending' || user.empStatus === 'Inactive') && (
                  <button onClick={handleResendInvite} disabled={isResending} className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors text-xs font-bold uppercase disabled:opacity-50">
                    <FaEnvelope size={14} /> {isResending ? "Sending..." : "Resend Invite"}
                  </button>
                )}
                {!isEditing && (
                  <button onClick={handleDeleteUser} disabled={isDeleting} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-xs font-bold uppercase disabled:opacity-50">
                    <FaTrash size={14} /> {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                )}
                <button onClick={() => setIsEditing(!isEditing)} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors text-xs font-bold uppercase">
                  <FaEdit size={14} /> {isEditing ? "Cancel" : "Edit"}
                </button>
                <button onClick={() => { onClose(); setIsEditing(false); }} className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light">&times;</button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
            <div className="space-y-6">
              {/* Personal Info */}
              <div className="bg-slate-50/50 rounded-xl p-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {renderField("Full Name", "name", formData.name)}
                  {renderField("Email", "email", formData.email, "email")}
                  {renderField("Phone Number", "phoneNumber", formData.phoneNumber, "tel")}
                </div>
              </div>

              {/* Employment Details */}
              <div className="bg-slate-50/50 rounded-xl p-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Employment Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {renderField("Status", "empStatus", formData.empStatus, "select", [{ value: "Active", label: "ACTIVE" }, { value: "Inactive", label: "INACTIVE" }, { value: "Pending", label: "PENDING" }])}
                  {renderField("Role", "role", formData.role, "select", [{ value: "Employee", label: "EMPLOYEE" }, { value: "Manager", label: "MANAGER" }, { value: "HR", label: "HR" }, { value: "Admin", label: "ADMIN" }, { value: "Super Admin", label: "SUPER ADMIN" }])}
                  {renderField("Designation", "designation", formData.designation)}
                  
                  {/* isTechnician Toggle - Only show in Edit Mode */}
                  {isEditing && (
                    <div>
                      <label className="block text-[10px] font-black text-transparent mb-2 uppercase tracking-widest">Spacer</label>
                      <div 
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all w-full select-none h-[46px]
                        ${formData.isTechnician ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                        onClick={() => setFormData(prev => ({ ...prev, isTechnician: !prev.isTechnician }))}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${formData.isTechnician ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}>
                          {formData.isTechnician && <FaCheck className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-sm font-medium ${formData.isTechnician ? 'text-blue-700' : 'text-slate-500'}`}>
                          Technician Access
                        </span>
                      </div>
                    </div>
                  )}

                  {renderField("Type", "empType", formData.empType, "select", [{ value: "Permanent", label: "PERMANENT" }, { value: "Contractor", label: "CONTRACTOR" }, { value: "Intern", label: "INTERN" }, { value: "Part Time", label: "PART TIME" }])}
                  {renderField("Department", "department", formData.department, "select", allDepartments)}
                  {renderField("Reports To", "reportsTo", formData.reportsTo, "select", [{ value: "", label: "NO MANAGER" }, ...allManagers.map(mgr => ({ value: mgr._id, label: mgr.name.toUpperCase() }))], false)}
                </div>
              </div>

              {/* Company Info */}
              <div className="bg-slate-50/50 rounded-xl p-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Company Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {renderField("Joining Date", "joiningDate", formData.joiningDate, "date")}
                  {renderField("Branch", "branch", formData.branch)}
                  {renderField("Timezone", "timeZone", formData.timeZone, "select", [{ value: "Asia/Karachi", label: "ASIA/KARACHI" }, { value: "America/New_York", label: "AMERICA/NEW_YORK" }, { value: "Europe/London", label: "EUROPE/LONDON" }, { value: "Asia/Dubai", label: "ASIA/DUBAI" }])}
                </div>
              </div>
            </div>
          </form>

          {isEditing && (
            <div className="bg-white/90 backdrop-blur-sm border-t border-white/50 p-4">
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditing(false)} disabled={isLoading} className="px-6 py-3 font-black text-[11px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} onClick={handleSubmit} className="px-6 py-3 bg-[#64748b] text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50">
                  {isLoading ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Saving...</span> : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <CreateDepartmentModal isOpen={isDeptModalOpen} onClose={() => setIsDeptModalOpen(false)} onDepartmentCreated={() => { onUserUpdated(); }} potentialManagers={allManagers} />
    </>
  );
};

export default UserDetailModal;