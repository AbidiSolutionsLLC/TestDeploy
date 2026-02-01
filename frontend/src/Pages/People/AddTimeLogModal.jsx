import React, { useState, useRef } from "react";
import timeLogApi from "../../api/timeLogApi";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AddTimeLogModal = ({ isOpen, onClose, onTimeLogAdded }) => {
  const [jobTitle, setJobTitle] = useState("");
  const [date, setDate] = useState(null); // Changed to null for Date object
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const modalRef = useRef(null);

  // Validation
  const isJobTitleValid = jobTitle.trim().length >= 3;
  const isDateValid = Boolean(date);
  const isHoursValid = Number(hours) > 0;
  const isDescriptionValid = description.trim().length >= 5;
  const isCurrentInputValid = isJobTitleValid && isDateValid && isHoursValid && isDescriptionValid;

  if (!isOpen) return null;

  // Helper: Format Date to YYYY-MM-DD for API
  const formatDateForApi = (d) => {
    if (!d) return "";
    // Adjust for timezone to ensure the selected day is sent correctly
    const offset = d.getTimezoneOffset();
    const adjustedDate = new Date(d.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const handleAddAnother = () => {
    if (isCurrentInputValid) {
      const newLog = {
        jobTitle: jobTitle.trim(),
        date: formatDateForApi(date),
        hours: parseFloat(hours),
        description: description.trim(),
        attachmentName: attachment ? attachment.name : null,
        attachmentFile: attachment,
      };
      setLogs([...logs, newLog]);
      // Reset form fields
      setJobTitle("");
      setDate(null);
      setHours("");
      setDescription("");
      setAttachment(null);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Use current input if logs array is empty, otherwise use logs array
      const logsToSubmit = logs.length > 0 ? logs : [{
        jobTitle: jobTitle.trim(),
        date: formatDateForApi(date),
        hours: parseFloat(hours),
        description: description.trim(),
        attachmentFile: attachment
      }];

      for (const log of logsToSubmit) {
        const formData = new FormData();
        formData.append("job", log.jobTitle);
        formData.append("date", log.date);
        formData.append("hours", log.hours);
        formData.append("description", log.description);
        if (log.attachmentFile) {
          formData.append("attachments", log.attachmentFile);
        }
        await timeLogApi.createTimeLog(formData);
      }

      setLogs([]);
      toast.success("TIME LOG(S) SAVED");
      onTimeLogAdded();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "FAILED TO SAVE");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4 sm:p-6"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-lg bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[90vh] animate-fadeIn overflow-hidden"
      >
        {/* CLOSE CROSS */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 sm:top-5 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light z-10"
        >
          &times;
        </button>

        {/* HEADER */}
        <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-slate-50 text-center flex-shrink-0">
          <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-widest uppercase">
            ADD TIME LOG
          </h2>
        </div>

        {/* FORM BODY */}
        <div className="p-6 sm:p-10 space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* JOB TITLE INPUT */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">JOB TITLE*</label>
            <input
              type="text"
              placeholder="e.g. Frontend Development"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* DATE (MODERN CALENDAR) */}
            <div className="relative">
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">DATE*</label>
              <DatePicker
                selected={date}
                onChange={(d) => setDate(d)}
                maxDate={new Date()}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select Date"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
                popperProps={{ strategy: "fixed" }} // Prevents clipping in modal
              />
            </div>
            
            {/* HOURS */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">HOURS*</label>
              <input
                type="number"
                step="0.5"
                placeholder="0.0"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">DESCRIPTION*</label>
            <textarea
              placeholder="describe your work..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300 resize-none"
              rows={3}
            />
          </div>

          {/* ATTACHMENT */}
          <div className="flex flex-col gap-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">ATTACHMENT</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                    {attachment ? attachment.name : "click to upload file"}
                  </p>
                </div>
                <input type="file" className="hidden" onChange={(e) => setAttachment(e.target.files[0])} />
              </label>
            </div>
          </div>

          {/* PREVIEW OF QUEUED LOGS */}
          {logs.length > 0 && (
            <div className="space-y-3">
               <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest">QUEUED LOGS ({logs.length})</label>
               <div className="space-y-2">
                 {logs.map((log, idx) => (
                   <div key={idx} className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-[11px] font-medium text-blue-700 flex justify-between items-center">
                     <span>{log.jobTitle} • {log.hours}h</span>
                     <span className="text-blue-300 uppercase">{log.date}</span>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 flex flex-col sm:flex-row gap-3 bg-white flex-shrink-0">
          <button 
            type="button"
            onClick={handleAddAnother}
            disabled={!isCurrentInputValid}
            className="flex-1 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Add Another
          </button>
          
          <div className="flex gap-3 flex-[2]">
            <button 
              onClick={onClose} 
              className="flex-1 py-3 font-black text-[10px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              CANCEL
            </button>
            <button 
              onClick={handleSave}
              disabled={(!isCurrentInputValid && logs.length === 0) || isLoading}
              className="flex-[2] py-3 bg-[#64748b] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              {isLoading ? "SAVING..." : logs.length > 0 ? `SAVE ALL (${logs.length + (isCurrentInputValid ? 1 : 0)})` : "SAVE LOG"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTimeLogModal;