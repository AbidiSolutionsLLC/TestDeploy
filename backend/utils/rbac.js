const User = require("../models/userSchema");

/**
 * Returns a MongoDB query filter based on the user's Role & Feature.
 * @param {Object} currentUser - The user object from req.user
 * @param {String} type - 'attendance' | 'ticket' | 'leave' | 'usermanagement'
 * @returns {Object} MongoDB Query Object
 */
exports.getSearchScope = async (currentUser, type) => {
  // Safety Check
  if (!currentUser) return { _id: null }; 

  const { role, isTechnician, _id } = currentUser;
  
  // Normalize Role: "Super Admin" -> "superadmin"
  const roleKey = role ? role.replace(/\s+/g, '').toLowerCase() : "employee";

  // --- 1. SUPER ADMIN: God Mode ---
  if (roleKey === 'superadmin') {
    return {}; // God Mode: See everything across all modules
  }

  // --- 2. HR & ADMIN: Expanded Visibility ---
  if (roleKey === 'hr' || roleKey === 'admin') {
    // REQUIREMENT: Admin and HR must see ALL attendance, users, and leaves
    if (type === 'attendance' || type === 'usermanagement' || type === 'leave') {
      return {}; 
    }
    
    // REQUIREMENT: HR has NO access to Ticketing
    if (roleKey === 'hr' && type === 'ticket') {
      return { _id: null }; 
    }

    // Admins see their team's tickets
    if (roleKey === 'admin' && type === 'ticket') {
       const directReports = await User.find({ reportsTo: _id }).distinct('_id');
       const indirectReports = await User.find({ reportsTo: { $in: directReports } }).distinct('_id');
       const fullTeam = [...directReports, ...indirectReports, _id];
       return { closedBy: { $in: fullTeam } };
    }
    
    return {}; // Default to all for safety
  }

  // --- 3. MANAGER: Team View ---
  if (roleKey === 'manager') { 
    const directReports = await User.find({ reportsTo: _id }).distinct('_id');
    const indirectReports = await User.find({ reportsTo: { $in: directReports } }).distinct('_id');
    const fullTeam = [...directReports, ...indirectReports, _id];

    if (type === 'usermanagement' && isTechnician) {
      return {
        $or: [
          { role: { $ne: 'Super Admin' } }, 
          { _id: { $in: fullTeam } }        
        ]
      };
    }

    if (type === 'ticket') {
      if (!isTechnician) return { closedBy: _id };
      return { closedBy: { $in: fullTeam } };
    }
    if (type === 'leave') return { employee: { $in: fullTeam } };
    if (type === 'attendance') return { user: { $in: fullTeam } };
    return { _id: null }; // No User Management for Managers
  }

  // --- 4. EMPLOYEE & TECHNICIAN: Self View Only ---
  if (type === 'ticket' && (roleKey === 'technician' || isTechnician)) {
    return { 
      $or: [
        { assignedTo: _id },
        { closedBy: _id }, 
        { user: _id }      
      ] 
    };
  }

  if (type === 'ticket') return { closedBy: _id };
  if (type === 'leave') return { employee: _id };
  
  // Default Self Lock
  return { user: _id };
};