import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { applyForLeave, refreshUserData } from "../slices/userSlice";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ApplyLeaveModal = ({ isOpen, setIsOpen, onLeaveAdded }) => {
  const dispatch = useDispatch();
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [reason, setReason] = useState("");
  const [quotaError, setQuotaError] = useState("");
  const [daysRequested, setDaysRequested] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalRef = useRef(null);

  // SAFE SELECTOR ACCESS
  const { user: authUser } = useSelector((state) => state.auth || {});
  const { userInfo } = useSelector((state) => state.user || {});
  
  // Safe Fallback for User Data
  const userData = userInfo || authUser?.user || authUser || {};
  const userLeaves = userData.leaves || {};

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const getLeaveBalanceKey = (leaveType) => {
    const mapping = { "PTO": "pto", "Sick": "sick" };
    return mapping[leaveType] || leaveType.toLowerCase();
  };

  const handleBackdropClick = (e) => {
    if (!isSubmitting && modalRef.current && !modalRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setLeaveType("");
      setStartDate(null);
      setEndDate(null);
      setReason("");
      setQuotaError("");
      setDaysRequested(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (leaveType && startDate && endDate) {
      const days = calculateDays(startDate, endDate);
      setDaysRequested(days);
      const balanceKey = getLeaveBalanceKey(leaveType);
      const availableBalance = userLeaves[balanceKey] || 0;

      if (days > availableBalance) {
        setQuotaError(`INSUFFICIENT BALANCE. AVAILABLE: ${availableBalance} DAYS`);
      } else {
        setQuotaError("");
      }
    } else {
      setDaysRequested(0);
      setQuotaError("");
    }
  }, [leaveType, startDate, endDate, userLeaves]);

  const formatDateForApi = (date) => {
    if (!date) return "";
    const offset = date.getTimezoneOffset();
    const adjusted = new Date(date.getTime() - (offset * 60 * 1000));
    return adjusted.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!leaveType || !startDate || !endDate) {
      toast.error("PLEASE FILL ALL REQUIRED FIELDS.");
      return;
    }
    
    if (quotaError) {
      toast.error("INSUFFICIENT LEAVE BALANCE");
      return;
    }

    setIsSubmitting(true);

    try {
      const leaveData = {
        leaveType,
        startDate: formatDateForApi(startDate),
        endDate: formatDateForApi(endDate),
        reason,
        userId: userData?._id || userData?.id,
        days: daysRequested
      };

      await dispatch(applyForLeave(leaveData)).unwrap();
      toast.success("LEAVE REQUEST SUBMITTED");
      
      if (userData?._id) {
        dispatch(refreshUserData(userData._id));
      }
      
      setIsOpen(false);
      if (onLeaveAdded) onLeaveAdded();
      
    } catch (error) {
      toast.error(error || "FAILED TO SUBMIT");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const balanceKey = getLeaveBalanceKey(leaveType);
  const availableBalance = leaveType ? (userLeaves[balanceKey] || 0) : null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4 sm:p-6"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-md bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[90vh] animate-fadeIn overflow-hidden"
      >
        <button 
          onClick={() => !isSubmitting && setIsOpen(false)} 
          disabled={isSubmitting}
          className="absolute top-4 right-4 sm:top-5 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light z-10 disabled:opacity-50"
        >
          &times;
        </button>

        <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-slate-50 text-center flex-shrink-0">
          <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-widest uppercase">
            APPLY FOR LEAVE
          </h2>
        </div>

        <form 
          id="leaveForm"
          className="p-6 sm:p-10 space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              LEAVE TYPE*
            </label>
            <div className="relative">
              <select
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                required
                disabled={isSubmitting}
              >
                <option value="">SELECT TYPE</option>
                <option value="PTO">PTO (PAID TIME OFF)</option>
                <option value="Sick">SICK LEAVE</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {availableBalance !== null && (
              <p className="mt-2 text-[10px] font-bold text-emerald-500 uppercase tracking-tight">
                AVAILABLE BALANCE: {availableBalance} DAYS
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                START DATE*
              </label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50 cursor-pointer"
                placeholderText="Select Date"
                dateFormat="yyyy-MM-dd"
                required
                disabled={isSubmitting}
                popperProps={{ strategy: "fixed" }}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                END DATE*
              </label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50 cursor-pointer"
                placeholderText="Select Date"
                dateFormat="yyyy-MM-dd"
                minDate={startDate} 
                required
                disabled={isSubmitting}
                popperProps={{ strategy: "fixed" }}
              />
            </div>
          </div>

          {daysRequested > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TOTAL DAYS</span>
              <span className="text-sm font-bold text-slate-700">{daysRequested} DAYS</span>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              REASON FOR LEAVE
            </label>
            <textarea
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300 resize-none disabled:opacity-50"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. family vacation"
              disabled={isSubmitting}
            ></textarea>
          </div>

          {quotaError && (
            <div className="bg-red-50 p-3 rounded-xl border border-red-100">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-tight text-center">
                {quotaError}
              </p>
            </div>
          )}

          {/* Validation to ensure buttons don't float if content is short */}
          <div className="h-4"></div>
        </form>

        <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 flex gap-3 sm:gap-4 bg-white flex-shrink-0">
          <button 
            type="button" 
            onClick={() => !isSubmitting && setIsOpen(false)} 
            disabled={isSubmitting}
            className="flex-1 py-3 sm:py-4 font-black text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            CANCEL
          </button>
          <button 
            type="submit" 
            form="leaveForm"
            disabled={quotaError !== "" || !leaveType || !startDate || !endDate || isSubmitting}
            className={`flex-1 py-3 sm:py-4 text-white rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-lg transition-all ${
              quotaError !== "" || !leaveType || !startDate || !endDate || isSubmitting
                ? "bg-slate-300 shadow-none cursor-not-allowed"
                : "bg-[#64748b] shadow-slate-100 hover:brightness-110 active:scale-95"
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>SUBMITTING...</span>
              </div>
            ) : (
              "SUBMIT REQUEST"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplyLeaveModal;