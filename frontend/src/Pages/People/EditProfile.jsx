import { useEffect, useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { FiCamera } from "react-icons/fi";
import api from "../../axios";
import { toast } from "react-toastify";
import { Spin } from "antd";
import { format } from "date-fns";

export default function EditProfile() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    designation: "",
    branch: "",
    empType: "Permanent",
    about: "",
    address: "",
    DOB: "",
    maritalStatus: "",
    emergencyContact: [],
    education: [],
    experience: []
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me", {
          withCredentials: true,
        });

        const user = res.data.user;
        setUser(user);
        setUserId(user._id);
        
        // Set form data with proper formatting
        setFormData({
          name: user.name || "",
          email: user.email || "",
          phoneNumber: user.phoneNumber || "",
          designation: user.designation || "",
          branch: user.branch || "",
          empType: user.empType || "Permanent",
          about: user.about || "",
          address: user.address || "",
          DOB: user.DOB ? format(new Date(user.DOB), "yyyy-MM-dd") : "",
          maritalStatus: user.maritalStatus || "",
          emergencyContact: user.emergencyContact || [],
          education: user.education || [],
          experience: user.experience || []
        });
      } catch (error) {
        console.error("Failed to load user profile", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Client-side validation
  const validateForm = () => {
    const errors = [];

    // Required fields
    if (!formData.name.trim()) errors.push("Name is required");
    if (!formData.email.trim()) errors.push("Email is required");
    if (!formData.designation.trim()) errors.push("Designation is required");
    if (!formData.branch.trim()) errors.push("Branch is required");
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push("Invalid email format");
    }
    
    // Phone validation (if provided)
    if (formData.phoneNumber && !/^\d+$/.test(formData.phoneNumber.toString())) {
      errors.push("Phone number must contain only digits");
    }

    // Date validation
    if (formData.DOB) {
      const dobDate = new Date(formData.DOB);
      if (isNaN(dobDate.getTime())) {
        errors.push("Invalid date of birth");
      }
    }

    // Education validation
    formData.education.forEach((edu, index) => {
      if (edu.institution && !edu.degree) {
        errors.push(`Education #${index + 1}: Degree is required if institution is provided`);
      }
      if (edu.startYear && edu.endYear && parseInt(edu.startYear) > parseInt(edu.endYear)) {
        errors.push(`Education #${index + 1}: Start year cannot be after end year`);
      }
    });

    // Experience validation
    formData.experience.forEach((exp, index) => {
      if (exp.startDate && exp.endDate) {
        const start = new Date(exp.startDate);
        const end = new Date(exp.endDate);
        if (start > end) {
          errors.push(`Experience #${index + 1}: Start date cannot be after end date`);
        }
      }
    });

    // Emergency contact validation
    formData.emergencyContact.forEach((contact, index) => {
      if (contact.name && !contact.phone) {
        errors.push(`Emergency contact #${index + 1}: Phone number is required if name is provided`);
      }
    });

    return errors;
  };

  const handleSave = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }

    try {
      setSaving(true);
      
      // Prepare payload with proper data types
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber ? parseInt(formData.phoneNumber) : undefined,
        designation: formData.designation.trim(),
        branch: formData.branch.trim(),
        empType: formData.empType,
        about: formData.about.trim(),
        address: formData.address.trim(),
        DOB: formData.DOB || null,
        maritalStatus: formData.maritalStatus.trim(),
        emergencyContact: formData.emergencyContact
          .filter(contact => contact.name && contact.phone)
          .map(contact => ({
            name: contact.name.trim(),
            relation: contact.relation?.trim() || "",
            phone: parseInt(contact.phone)
          })),
        education: formData.education
          .filter(edu => edu.institution && edu.degree)
          .map(edu => ({
            institution: edu.institution.trim(),
            degree: edu.degree.trim(),
            startYear: parseInt(edu.startYear) || undefined,
            endYear: parseInt(edu.endYear) || undefined
          })),
        experience: formData.experience
          .filter(exp => exp.company)
          .map(exp => ({
            company: exp.company.trim(),
            jobType: exp.jobType?.trim() || "Full-time",
            description: exp.description?.trim() || "",
            startDate: exp.startDate ? new Date(exp.startDate) : undefined,
            endDate: exp.endDate ? new Date(exp.endDate) : undefined
          }))
      };

      // Remove undefined values
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === null) {
          delete payload[key];
        }
      });

      await api.put(`/users/${userId}`, payload, {
        withCredentials: true,
      });
      toast.success("Profile updated successfully!");
      navigate("/people/profile");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
      console.error("Error updating profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("Image size should be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setLoading(true);
      const response = await api.post(`/users/${userId}/upload-avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUser(prev => ({ ...prev, avatar: response.data.avatarUrl }));
      toast.success("Profile picture updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile picture");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { institution: "", degree: "", startYear: "", endYear: "" }]
    }));
  };

  const updateEducation = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (index) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { 
        company: "", 
        jobType: "Full-time", 
        description: "", 
        startDate: "", 
        endDate: "" 
      }]
    }));
  };

  const updateExperience = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (index) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const addEmergencyContact = () => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: [...prev.emergencyContact, { name: "", relation: "", phone: "" }]
    }));
  };

  const updateEmergencyContact = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: prev.emergencyContact.map((contact, i) => 
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const removeEmergencyContact = (index) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: prev.emergencyContact.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
                <p className="mt-3 text-slate-600 text-xs font-medium uppercase tracking-wide">Loading profile...</p>
              </div>
    );
  }

  return (
    <div className="relative flex flex-col bg-transparent text-text p-6 rounded-[1.2rem] min-h-[700px]">
      {/* Back Button */}
      <button
        onClick={() => navigate("/people/profile")}
        className="absolute top-10 right-10 bg-white/30 backdrop-blur-lg text-slate-800 font-medium px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 hover:scale-105 text-sm ring-1 ring-white/20 z-50 flex items-center gap-2"
      >
        <IoArrowBack className="text-base" />
        Back
      </button>

      {/* Banner & Profile Pic */}
      <div className="relative h-28 rounded-lg overflow-hidden shadow-md">
        <img
          src={`https://picsum.photos/1200/200?random=${user._id}`}
          alt="Banner"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="relative -mt-14 pl-6 z-10 mb-8">
        <div className="relative group">
          <img
            src={user.avatar || `https://randomuser.me/api/portraits/lego/${user?._id ? user._id.length % 10 : 1}.jpg`}
            alt={user?.name || "User"}
            className="w-28 h-28 rounded-full object-cover shadow-lg border-2 border-white"
          />
          <label
            htmlFor="avatar-upload-edit"
            className="w-28 h-28 absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <FiCamera className="text-white text-xl" />
          </label>
          <input
            id="avatar-upload-edit"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
            disabled={loading}
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>
      </div>

      <h2 className="text-lg font-bold text-slate-800 mb-6 uppercase tracking-tight">Edit Your Profile</h2>

      {/* Basic Information */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] p-4 mb-6 shadow-md border border-white/50">
        <h3 className="font-semibold mb-4 text-sm text-slate-800 uppercase tracking-wide">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-white/80 backdrop-blur-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <input
              type="email"
              className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-white/80 backdrop-blur-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
            <input
              type="tel"
              className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-white/80 backdrop-blur-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="Digits only"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
            <input
              type="date"
              className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-white/80 backdrop-blur-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
              value={formData.DOB}
              onChange={(e) => handleInputChange('DOB', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Designation *</label>
            <input
              type="text"
              className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-white/80 backdrop-blur-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
              value={formData.designation}
              onChange={(e) => handleInputChange('designation', e.target.value)}
              required
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Branch *</label>
            <input
              type="text"
              className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-white/80 backdrop-blur-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
              value={formData.branch}
              onChange={(e) => handleInputChange('branch', e.target.value)}
              required
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Employment Type</label>
            <select
              className="w-full p-3 bg-white/80 backdrop-blur-sm text-slate-700 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={formData.empType}
              onChange={(e) => handleInputChange('empType', e.target.value)}
              disabled
            >
              <option value="Permanent">Permanent</option>
              <option value="Contractor">Contractor</option>
              <option value="Intern">Intern</option>
              <option value="Part Time">Part Time</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Marital Status</label>
            <input
              type="text"
              className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-white/80 backdrop-blur-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
              value={formData.maritalStatus}
              onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <textarea
              className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-white/80 backdrop-blur-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
              rows={3}
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] p-4 mb-6 shadow-md border border-white/50">
        <h3 className="font-semibold mb-3 text-sm text-slate-800 uppercase tracking-wide">About</h3>
        <textarea
          className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-white/80 backdrop-blur-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
          rows={5}
          value={formData.about}
          onChange={(e) => handleInputChange('about', e.target.value)}
        />
      </div>

      {/* Emergency Contacts */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] p-4 mb-6 shadow-md border border-white/50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-sm text-slate-800 uppercase tracking-wide">Emergency Contacts</h3>
          <button
            onClick={addEmergencyContact}
            className="p-2 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 transition shadow-sm"
            title="Add Contact"
          >
            <FiPlus className="text-lg" />
          </button>
        </div>
        {formData.emergencyContact.map((contact, idx) => (
          <div key={idx} className="relative bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-4 border border-slate-100">
            {idx > 0 && (
              <button
                onClick={() => removeEmergencyContact(idx)}
                className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors p-1"
                title="Remove"
              >
                <FiX className="text-lg" />
              </button>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="Contact Name"
                  className="w-full p-2 border border-slate-200 rounded text-sm bg-white/90 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
                  value={contact.name}
                  onChange={(e) => updateEmergencyContact(idx, 'name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Relation</label>
                <input
                  type="text"
                  placeholder="Relationship"
                  className="w-full p-2 border border-slate-200 rounded text-sm bg-white/90 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
                  value={contact.relation}
                  onChange={(e) => updateEmergencyContact(idx, 'relation', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Phone *</label>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full p-2 border border-slate-200 rounded text-sm bg-white/90 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
                  value={contact.phone}
                  onChange={(e) => updateEmergencyContact(idx, 'phone', e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Education & Experience */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Education */}
        <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] p-4 shadow-md border border-white/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm text-slate-800 uppercase tracking-wide">Education</h3>
            <button
              onClick={addEducation}
              className="p-2 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 transition shadow-sm"
              title="Add Education"
            >
              <FiPlus className="text-lg" />
            </button>
          </div>
          {formData.education.map((edu, idx) => (
            <div
              key={idx}
              className="relative bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-4 border border-slate-100"
            >
              {idx > 0 && (
                <button
                  onClick={() => removeEducation(idx)}
                  className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors p-1"
                  title="Remove"
                >
                  <FiX className="text-lg" />
                </button>
              )}
              <input
                type="text"
                placeholder="Institution *"
                className="w-full mb-3 p-3 border border-slate-200 rounded-lg text-sm bg-white/90 backdrop-blur-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                value={edu.institution}
                onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
              />
              <input
                type="text"
                placeholder="Degree / Program *"
                className="w-full mb-3 p-3 border border-slate-200 rounded-lg text-sm bg-white/90 backdrop-blur-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                value={edu.degree}
                onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Start Year"
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-white/90 backdrop-blur-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                  value={edu.startYear}
                  onChange={(e) => updateEducation(idx, 'startYear', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="End Year"
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-white/90 backdrop-blur-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                  value={edu.endYear}
                  onChange={(e) => updateEducation(idx, 'endYear', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Experience */}
        <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] p-4 shadow-md border border-white/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm text-slate-800 uppercase tracking-wide">Work Experience</h3>
            <button
              onClick={addExperience}
              className="p-2 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 transition shadow-sm"
              title="Add Experience"
            >
              <FiPlus className="text-lg" />
            </button>
          </div>
          {formData.experience.map((exp, idx) => (
            <div
              key={idx}
              className="relative bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-4 border border-slate-100"
            >
              {idx > 0 && (
                <button
                  onClick={() => removeExperience(idx)}
                  className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors p-1"
                  title="Remove"
                >
                  <FiX className="text-lg" />
                </button>
              )}
              <input
                type="text"
                placeholder="Company Name *"
                className="w-full mb-3 p-3 border border-slate-200 rounded-lg text-sm bg-white/90 backdrop-blur-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                value={exp.company}
                onChange={(e) => updateExperience(idx, 'company', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3 mb-3">
                <select
                  className="w-full p-3 bg-white/90 backdrop-blur-sm text-slate-700 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={exp.jobType}
                  onChange={(e) => updateExperience(idx, 'jobType', e.target.value)}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="date"
                  placeholder="Start Date"
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-white/90 backdrop-blur-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                  value={exp.startDate ? format(new Date(exp.startDate), "yyyy-MM-dd") : ""}
                  onChange={(e) => updateExperience(idx, 'startDate', e.target.value)}
                />
                <input
                  type="date"
                  placeholder="End Date"
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-white/90 backdrop-blur-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                  value={exp.endDate ? format(new Date(exp.endDate), "yyyy-MM-dd") : ""}
                  onChange={(e) => updateExperience(idx, 'endDate', e.target.value)}
                />
              </div>
              <textarea
                placeholder="Job Description"
                className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-white/90 backdrop-blur-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                rows={3}
                value={exp.description}
                onChange={(e) => updateExperience(idx, 'description', e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-6 pt-6 border-t border-slate-200">
        <button
          className={`bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2.5 rounded-lg transition-all text-sm font-medium shadow-sm hover:shadow-md ${saving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </span>
          ) : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}