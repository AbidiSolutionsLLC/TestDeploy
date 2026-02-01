import React, { useEffect, useState } from 'react';
import api from '../../axios';
import { FaUserTie, FaNetworkWired, FaIdBadge } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const OrgNode = ({ node, onNodeClick }) => {
  return (
    <div className="flex flex-col items-center">
      
      {/* THE CARD */}
      <div className="relative flex flex-col items-center z-10 group w-60">
        
        <div 
          onClick={() => onNodeClick(node)}
          className="relative flex flex-col items-center w-full bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
        >
          {/* Decorative Top Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>

          <div className="p-5 flex flex-col items-center w-full">
            {/* View Profile Badge (Visible on Hover) */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               <FaIdBadge className="text-blue-500" title="View Profile" />
            </div>

            {/* Avatar */}
            <div className="w-16 h-16 mb-3 rounded-full p-1 bg-white border border-gray-100 shadow-sm">
               <img 
                  src={node.avatar || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                  alt={node.name}
                  className="w-full h-full object-cover rounded-full"
                />
            </div>
            
            {/* Text Info */}
            <h3 className="text-sm font-bold text-gray-800 text-center leading-tight mb-1">{node.name}</h3>
            <p className="text-xs text-blue-600 font-semibold text-center mb-2 px-2 truncate w-full">{node.designation || node.role}</p>
            
            {node.department && (
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                {node.department.name}
              </span>
            )}
          </div>
          
          {/* Bottom Action Strip */}
          <div className="w-full bg-blue-50 h-0 group-hover:h-8 transition-all duration-300 flex items-center justify-center overflow-hidden">
             <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">View Profile</span>
          </div>
        </div>

        {/* Vertical Line DOWN from Card (Only if children exist) */}
        {node.children && node.children.length > 0 && (
          <div className="w-px h-6 bg-gray-300"></div>
        )}
      </div>

      {/* CHILDREN CONTAINER */}
      {node.children && node.children.length > 0 && (
        <div className="flex pt-0"> 
          {/* Note: pt-0 because the vertical line above provides the spacing */}
          {node.children.map((child, index) => {
            // Logic to determine connectors
            const isFirst = index === 0;
            const isLast = index === node.children.length - 1;
            const isSole = node.children.length === 1;

            return (
              <div key={child._id} className="flex flex-col items-center relative px-6">
                
                {/* --- CONNECTORS (The "Tree" Lines) --- */}
                {/* 1. Horizontal Bus Line (Top of this slot) */}
                {/* Left Side Line */}
                {!isSole && !isFirst && (
                  <div className="absolute top-0 left-0 w-[calc(50%+1px)] h-px bg-gray-300"></div>
                )}
                
                {/* Right Side Line */}
                {!isSole && !isLast && (
                  <div className="absolute top-0 right-0 w-[calc(50%+1px)] h-px bg-gray-300"></div>
                )}

                {/* 2. Vertical Line UP (From Bus to Card) */}
                <div className="w-px h-6 bg-gray-300"></div>
                
                {/* Recursive Node */}
                <OrgNode node={child} onNodeClick={onNodeClick} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- Main Page ---
const OrgChartPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrgChart = async () => {
      try {
        const response = await api.get('/users/org-chart');
        setData(response.data.data);
      } catch (error) {
        console.error("Failed to fetch chart", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgChart();
  }, []);

  const handleNodeClick = (user) => {
    navigate(`/people/profile/${user._id}`);
  };

  return (
    <div className="p-6 h-[calc(100vh-80px)] overflow-hidden flex flex-col bg-gray-50/50">
      <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaNetworkWired className="text-blue-600" /> Organization Chart
          </h1>
          <p className="text-sm text-gray-500 mt-1">Interactive hierarchy of company leadership and teams</p>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-inner overflow-auto p-10 relative custom-scrollbar">
        
        {/* Grid Background Effect (Optional for attractiveness) */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        <div className="min-w-max flex justify-center pb-20 relative z-10">
          {loading ? (
             <div className="flex flex-col items-center justify-center mt-20 text-gray-400 gap-4">
               <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
               <p>Mapping Hierarchy...</p>
             </div>
          ) : data.length > 0 ? (
            data.map((rootNode, idx) => (
              <div key={rootNode._id} className={idx > 0 ? "ml-16" : ""}>
                {/* Root nodes usually don't need top connectors, so we pass simplified props */}
                <OrgNode 
                  node={rootNode} 
                  onNodeClick={handleNodeClick}
                  isFirst={true} 
                  isLast={true} 
                  isSole={true} // Forces no top horizontal lines for the absolute Root
                />
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center mt-20 text-gray-400">
               <div className="bg-gray-100 p-6 rounded-full mb-4">
                 <FaUserTie className="text-4xl text-gray-300"/>
               </div>
               <p className="font-semibold text-gray-600">No reporting hierarchy found.</p>
               <p className="text-sm mt-1">Ensure users have "Reports To" assigned in their profiles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrgChartPage;