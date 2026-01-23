import React, { useState, useRef, useEffect } from "react";
import {
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiMoreVertical,
  FiEdit,
  FiPlus,
} from "react-icons/fi";

const NotesCard = ({ onDelete }) => {
  const [notes, setNotes] = useState([
    { id: 1, text: "Buy milk and snacks." },
    { id: 2, text: "Schedule 1:1 with manager." },
  ]);
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addNote = () => {
    if (newNote.trim()) {
      setNotes([...notes, { id: Date.now(), text: newNote.trim() }]);
      setNewNote("");
    }
  };

  const startEditing = (note) => {
    setEditingId(note.id);
    setEditingText(note.text);
  };

  const saveEdit = (id) => {
    setNotes(notes.map((n) => (n.id === id ? { ...n, text: editingText } : n)));
    setEditingId(null);
    setEditingText("");
  };

  const removeNote = (id) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  return (
    <div className="relative bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4 w-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiEdit className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Notes</h3>
          </div>
          <p className="text-[10px] font-medium text-slate-500">
            Write and edit personal notes
          </p>
        </div>

        {/* 3-dot Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <FiMoreVertical className="h-4 w-4 text-slate-600" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-32 bg-white shadow-lg border border-slate-200 rounded-xl z-50">
              <button
                onClick={() => {
                  onDelete();
                  setMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 text-[10px] text-red-500 hover:bg-red-50 font-medium"
              >
                <FiTrash2 className="w-3 h-3 mr-2" />
                Delete Card
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Note Input */}
      <div className="flex flex-col mb-3 gap-2">
        <input
          type="text"
          className="flex-1 border border-slate-300 px-3 py-2 rounded-lg text-xs bg-white"
          placeholder="Write a note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addNote()}
        />
        <button
          onClick={addNote}
          className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-200 transition flex items-center justify-center gap-1.5"
        >
          <FiPlus className="w-3 h-3" />
          Add
        </button>
      </div>

      {/* Notes List */}
      <ul className="space-y-2 text-[10px] max-h-[100px] overflow-y-auto">
        {notes.map((note) => (
          <li
            key={note.id}
            className="bg-[#E0E5EA]/30 p-3 rounded-lg flex justify-between items-start gap-2"
          >
            <div className="flex-1">
              {editingId === note.id ? (
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs bg-white"
                  value={editingText}
                  autoFocus
                  onChange={(e) => setEditingText(e.target.value)}
                  onBlur={() => saveEdit(note.id)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit(note.id)}
                />
              ) : (
                <p
                  className="text-slate-700 cursor-pointer"
                  onClick={() => startEditing(note)}
                >
                  {note.text}
                </p>
              )}
            </div>

            <div className="flex gap-1.5 items-end">
              {editingId !== note.id ? (
                <button
                  onClick={() => startEditing(note)}
                  className="bg-green-100 text-green-700 p-1.5 rounded-md hover:bg-green-200"
                  title="Edit"
                >
                  <FiEdit2 className="h-3 w-3" />
                </button>
              ) : (
                <button
                  onClick={() => saveEdit(note.id)}
                  className="text-blue-600 hover:text-blue-800 p-1.5"
                  title="Save"
                >
                  <FiCheck className="h-3 w-3" />
                </button>
              )}
              <button
                onClick={() => removeNote(note.id)}
                className="bg-red-100 text-red-600 p-1.5 rounded-md hover:bg-red-200"
                title="Delete"
              >
                <FiTrash2 className="h-3 w-3" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotesCard;