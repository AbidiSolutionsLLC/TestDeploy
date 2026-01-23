import React, { useEffect, useState, useMemo } from "react";
import {
    UserCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    UserIcon,
    UsersIcon
} from "@heroicons/react/24/solid";
import { useDispatch, useSelector } from "react-redux";
import { checkInNow, checkOutNow, fetchCurrentStatus } from "../slices/attendanceTimer";
import { toast } from "react-toastify";
import { refreshUserData } from "../slices/userSlice";

const RightSidebar = ({ isOpen, toggleSidebar }) => {
    const dispatch = useDispatch();
    const [elapsedTime, setElapsedTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const [timerInterval, setTimerInterval] = useState(null);

    // Redux state
    const { checkInn, loading } = useSelector((state) => state.attendanceTimer);

    const {user} = useSelector((state) => state.auth);

    const {userInfo} = useSelector((state) => state.user);

    useEffect(() => {
        if(user?.user?._id){
            dispatch(refreshUserData(user?.user?._id));
        }
    }, []);

    const currentUser = userInfo;
    const profileImage = currentUser?.avatar || "";
    const firstName = currentUser?.name || "User";

    const manager = currentUser?.reportsTo || null;
    const teamMembers = useMemo(() => {
        if (!currentUser?.department?.members) return [];

        return currentUser.department.members
            .filter(member => member._id !== currentUser._id)
            .slice(0, 5);
    }, [currentUser]);

    useEffect(() => {
        dispatch(fetchCurrentStatus());
    }, [dispatch]);
    
    // Avatar component
    const Avatar = ({ url, name, size = "sm" }) => {
        const sizeClasses =
            size === "lg" ? "w-14 h-14" :
            size === "md" ? "w-10 h-10" :
            "w-8 h-8";

        if (url) {
            return (
                <img
                    src={url}
                    alt={name}
                    className={`${sizeClasses} rounded-full object-cover border-2 border-white shadow-sm`}
                />
            );
        }

        return (
            <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-white shadow-sm flex items-center justify-center`}>
                <span className={`${size === 'lg' ? 'text-lg' : 'text-xs'} font-bold text-indigo-600`}>
                    {name?.charAt(0).toUpperCase() || "U"}
                </span>
            </div>
        );
    };

    const formatTimeFromSeconds = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return { hours, minutes, seconds };
    };

    useEffect(() => {
        if (checkInn?.log?.checkInTime && !checkInn?.log?.checkOutTime) {
            const startTime = new Date(checkInn.log.checkInTime).getTime();

            const updateElapsed = () => {
                const now = Date.now();
                const elapsedSeconds = Math.floor((now - startTime) / 1000);
                setElapsedTime(formatTimeFromSeconds(elapsedSeconds));
            };

            updateElapsed();
            const interval = setInterval(updateElapsed, 1000);
            setTimerInterval(interval);

            return () => clearInterval(interval);
        } else {
            if (timerInterval) clearInterval(timerInterval);
            setElapsedTime({ hours: 0, minutes: 0, seconds: 0 });
        }
    }, [checkInn]);

    const handleCheckIn = () => {
        dispatch(checkInNow()).unwrap().catch(err =>
            toast.error(err?.message || "Failed to check in")
        );
    };

    const handleCheckOut = () => {
        dispatch(checkOutNow())
            .unwrap()
            .then(() => toast.success("Checked out successfully!"))
            .catch(err => toast.error(err?.message || "Failed to check out"));
    };

    const getButtonState = () => {
        if (!checkInn?.log) {
            return { text: "Check In", onClick: handleCheckIn, bgColor: "bg-emerald-500 hover:bg-emerald-600", disabled: false };
        }
        if (checkInn?.log?.checkInTime && !checkInn?.log?.checkOutTime) {
            return { text: "Check Out", onClick: handleCheckOut, bgColor: "bg-red-500 hover:bg-red-600", disabled: false };
        }
        return { text: "Already Checked Out", bgColor: "bg-slate-400", disabled: true };
    };

    const buttonState = getButtonState();

    return (
        <aside className={`sticky mt-2 z-50 h-[calc(100vh-2rem)] transition-all duration-500 ease-in-out flex-shrink-0 flex items-center  pr-3 overflow-auto ${isOpen ? "w-52" : "w-8"
            }`}>

            {/* Toggle Button */}
            <button
                onClick={toggleSidebar}
                className="absolute -left-0 top-12 z-[70] p-1.5 bg-white border border-slate-200 shadow-md rounded-full text-slate-600 hover:text-slate-900 hover:shadow-lg transition-all active:scale-90"
            >
                {isOpen ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
            </button>

            {/* Sidebar Content */}
            <div className={`h-full w-full bg-[#ECF0F3] backdrop-blur-sm rounded-[2rem] shadow-lg border border-white/50 flex flex-col items-center py-5 px-4 overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                }`}>

                {/* Profile Section */}
                <div className="flex flex-col items-center w-full">
                    <div className="w-20 h-20 rounded-full border-2 border-white shadow-md overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 mb-2">
                        {profileImage ? (
                            <img src={profileImage} alt={firstName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="h-full w-full rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-slate-700 flex items-center justify-center text-2xl font-bold">
                                {firstName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <div className="text-center bg-white rounded-xl px-4 py-2 w-full mb-2 shadow-sm border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800">
                            {currentUser?.name || "- Name -"}
                        </h3>
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                            {currentUser?.designation || "- Designation -"}
                        </p>
                    </div>

                    {/* Check In/Out Button */}
                    <button
                        onClick={buttonState.onClick}
                        disabled={buttonState.disabled || loading}
                        className={`${buttonState.bgColor} text-white text-xs font-bold py-2 px-8 rounded-full shadow-md transition-all active:scale-95 mb-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {loading ? "Processing..." : buttonState.text}
                    </button>

                    {/* Timer Display - Only show when checked in */}
                    {(checkInn?.log?.checkInTime && !checkInn?.log?.checkOutTime) && (
                        <div className="flex flex-col items-center mb-5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                                Current Session
                            </span>
                            <div className="flex items-center justify-center gap-1.5">
                                <div className="bg-slate-100 text-slate-800 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-inner">
                                    {elapsedTime.hours.toString().padStart(2, '0')}
                                </div>
                                <span className="text-slate-800 font-bold text-sm">:</span>
                                <div className="bg-slate-100 text-slate-800 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-inner">
                                    {elapsedTime.minutes.toString().padStart(2, '0')}
                                </div>
                                <span className="text-slate-800 font-bold text-sm">:</span>
                                <div className="bg-slate-100 text-slate-800 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-inner">
                                    {elapsedTime.seconds.toString().padStart(2, '0')}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Reporting Manager */}
                <div className="w-full bg-white rounded-xl p-3 mb-3 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Reporting Manager</p>
                        <UserIcon className="w-4 h-4 text-slate-400" />
                    </div>

                    {manager ? (
                        <div className="flex items-center gap-2.5">
                            <Avatar url={manager.avatar} name={manager.name} size="md" />
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold text-slate-800 truncate">{manager.name}</p>
                                <p className="text-[9px] text-slate-600 truncate">
                                    {manager.designation || "Manager"}
                                </p>
                                <p className="text-[8px] text-primary mt-0.5 truncate">
                                    {manager.email}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                <UserCircleIcon className="w-6 h-6 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 italic">
                                    No manager assigned
                                </p>
                                <p className="text-[9px] text-slate-400">(You're the top level)</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Team Overview */}
                <div className="w-full bg-white rounded-xl p-3 flex-1 shadow-sm border border-slate-100 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Team Overview</p>
                        <div className="flex items-center gap-1">
                            <UsersIcon className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-600">
                                {teamMembers.length}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col overflow-y-auto no-scrollbar flex-1">
                        {teamMembers.length > 0 ? (
                            teamMembers.map((member) => (
                                <div
                                    key={member._id}
                                    className="flex items-center gap-1 hover:bg-slate-50 p-2 rounded-lg transition-colors cursor-pointer"
                                >
                                    <Avatar url={member.avatar} name={member.name} />
                                    <div className="overflow-hidden flex-1">
                                        <p className="text-[10px] font-bold text-slate-700 truncate">
                                            {member.name}
                                        </p>
                                        <p className="text-[9px] text-slate-500 truncate">
                                            {member.designation || "Team Member"}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-4 text-center">
                                <UsersIcon className="w-8 h-8 text-slate-300 mb-2" />
                                <p className="text-xs font-medium text-slate-400">
                                    No team members found
                                </p>
                                <p className="text-[10px] text-slate-300 mt-1">
                                    You'll see team members here
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default RightSidebar;