import React, { useState, useEffect } from "react";
import CreateUserModal from "../../Components/CreateUserModal";
import UserManagementTable from "../../Components/UserManagementTable";
import { FaPlus, FaSearch, FaSortDown, FaSortUp } from "react-icons/fa";
import UserDetailModal from "../../Components/UserDetailModal";
import api from "../../axios";
import { toast } from "react-toastify";


const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, deptsRes] = await Promise.all([
        api.get('/users'),
        api.get('/departments')
      ]);
      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
      setFilteredUsers(usersRes.data);
      console.log("success")
      toast.success('Data loaded successfully');
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    console.log("calling the fetch")
  }, []);

  useEffect(() => {
    let result = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.empID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'department') {
          aValue = a.department?.name || '';
          bValue = b.department?.name || '';
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredUsers(result);
  }, [searchTerm, users, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setIsUserDetailOpen(true);
  };

  const handleUserCreated = () => {
    fetchData();
    toast.success('User created successfully');
  };

  const handleUserUpdated = (type = 'update') => {
    fetchData();
    if (type === 'delete') {
      toast.success('User deleted successfully');
    } else {
      toast.success('User updated successfully');
    }
  };

  const handleUserDeleted = () => {
    fetchData();
    toast.success('User deleted successfully');
  };


  const activeUsers = users.filter(u => u.empStatus === "Active").length;
  const inactiveUsers = users.filter(u => u.empStatus === "Inactive").length;

  return (
    <div className="w-full bg-transparent min-h-screen p-4">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 mb-4 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="truncate">
              <h2 className="text-base font-bold text-slate-800 truncate uppercase tracking-tight">
                User Management
              </h2>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">
                Manage users, roles, and permissions
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-[#64748b] text-white rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <FaPlus className="text-xs" /> Add User
          </button>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4 w-full mb-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Search by name, email, ID, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-2">
            {['name', 'department', 'role', 'empStatus'].map((key) => (
              <button
                key={key}
                onClick={() => handleSort(key)}
                className={`px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${sortConfig.key === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
              >
                {key === 'empStatus' ? 'Status' : key}
                {sortConfig.key === key && (
                  <FaSortDown className={`inline ml-1 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4 w-full">
        <div className="overflow-x-auto rounded-xl border border-slate-200/60 shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
              <p className="mt-4 text-slate-600 text-sm font-medium">Loading users...</p>
            </div>
          ) : (
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  {["ID", "Name", "Email", "Department", "Role", "Status"].map((header) => (
                    <th
                      key={header}
                      className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort(header.toLowerCase())}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr
                      key={user._id}
                      onClick={() => handleUserClick(user)}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors duration-200 group cursor-pointer"
                    >
                      <td className="p-4 text-sm font-medium text-slate-500">
                        #{user.empID}
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                          {user.name}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-500">
                        {user.email}
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          {user.department?.name || "-"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${user.role === "Admin"
                              ? "bg-purple-50 text-purple-600 border-purple-100"
                              : "bg-blue-50 text-blue-600 border-blue-100"
                            }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${user.empStatus === "Active"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : "bg-rose-50 text-rose-600 border-rose-100"
                            }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${user.empStatus === "Active"
                                ? "bg-emerald-500"
                                : "bg-rose-500"
                              }`}
                          ></span>
                          {user.empStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Active: <span className="text-slate-800">{activeUsers}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Inactive: <span className="text-slate-800">{inactiveUsers}</span>
              </span>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            Total Users: <span className="text-slate-800">{users.length}</span>
          </div>
        </div>
      </div>

      <CreateUserModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        onUserCreated={handleUserCreated}
        allDepartments={departments}
        allManagers={users}
      />

      <UserDetailModal
        user={selectedUser}
        isOpen={isUserDetailOpen}
        onClose={() => {
          setIsUserDetailOpen(false);
          setSelectedUser(null);
        }}
        onUserUpdated={handleUserUpdated}
        allManagers={users}
        allDepartments={departments}
      />
    </div>
  );
};

export default UserManagement;