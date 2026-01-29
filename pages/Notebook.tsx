import React, { useState, useEffect } from 'react';
import { 
  Plus, Save, Trash2, Printer, FileText, Search, Clock, Loader2 
} from 'lucide-react';
import { getNotes, createNote, updateNote, deleteNote } from '../services/supabase.ts';
import { Note } from '../types.ts';

const Notebook: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editor State
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
    } else {
      setEditTitle('');
      setEditContent('');
    }
  }, [selectedNote]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const data = await getNotes();
      setNotes(data || []);
      if (data && data.length > 0 && !selectedNote) {
        setSelectedNote(data[0]);
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    const newNote = await createNote("Yangi Qayd", "");
    if (newNote) {
      const updatedNotes = [newNote, ...notes];
      setNotes(updatedNotes);
      setSelectedNote(newNote);
    }
  };

  const handleSave = async () => {
    if (!selectedNote) return;
    setIsSaving(true);
    try {
      await updateNote(selectedNote.id, editTitle, editContent);
      const updatedNotes = notes.map(n => 
        n.id === selectedNote.id 
          ? { ...n, title: editTitle, content: editContent, updated_at: new Date().toISOString() }
          : n
      );
      // Re-sort by updated
      updatedNotes.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      
      setNotes(updatedNotes);
      // Update selected note local state to reflect save
      setSelectedNote({ ...selectedNote, title: editTitle, content: editContent, updated_at: new Date().toISOString() });
    } catch (err) {
      alert("Saqlashda xatolik yuz berdi");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNote || !confirm("Ushbu qaydni o'chirmoqchimisiz?")) return;
    try {
      await deleteNote(selectedNote.id);
      const remainingNotes = notes.filter(n => n.id !== selectedNote.id);
      setNotes(remainingNotes);
      setSelectedNote(remainingNotes.length > 0 ? remainingNotes[0] : null);
    } catch (err) {
      alert("O'chirishda xatolik");
    }
  };

  const handlePrint = () => {
    if (!selectedNote) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${editTitle}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; text-transform: uppercase; }
            .content { white-space: pre-wrap; font-size: 12pt; }
            .footer { margin-top: 50px; font-size: 10pt; text-align: center; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <h1>${editTitle || 'Nomsiz Qayd'}</h1>
          <div class="content">${editContent}</div>
          <div class="footer">XPRO tizimi orqali chop etildi - ${new Date().toLocaleDateString()}</div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-300">
      {/* Sidebar List */}
      <div className="w-full md:w-80 flex flex-col gap-4">
        <div className="bg-white dark:bg-zinc-900 hacker:bg-black hacker:border hacker:border-[#0f0] p-4 rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-sm">
          <button 
            onClick={handleCreateNote}
            className="w-full py-3 bg-indigo-600 hacker:bg-[#0f0] text-white hacker:text-black font-black rounded-xl flex items-center justify-center gap-2 mb-4 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            <Plus size={20} /> Yangi Qayd
          </button>
          
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-800 hacker:bg-black hacker:border hacker:border-[#0f0] border border-slate-100 dark:border-zinc-700 rounded-xl text-sm font-medium outline-none dark:text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-600" /></div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">Qaydlar yo'q</div>
          ) : (
            filteredNotes.map(note => (
              <div 
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className={`p-4 rounded-2xl cursor-pointer border transition-all ${
                  selectedNote?.id === note.id 
                    ? 'bg-white dark:bg-zinc-800 border-indigo-600 shadow-md hacker:bg-[#002200] hacker:border-[#0f0]' 
                    : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 hover:border-indigo-200 hacker:bg-black hacker:border-[#0f0]/30'
                }`}
              >
                <h4 className={`font-bold text-sm mb-1 truncate ${selectedNote?.id === note.id ? 'text-indigo-600 hacker:text-[#0f0]' : 'text-slate-800 dark:text-white'}`}>
                  {note.title || 'Nomsiz Qayd'}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2 mb-2 dark:text-zinc-400">{note.content || 'Matn yo\'q...'}</p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                  <Clock size={10} /> {new Date(note.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 bg-white dark:bg-zinc-900 hacker:bg-black hacker:border hacker:border-[#0f0] rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 shadow-sm flex flex-col overflow-hidden">
        {selectedNote ? (
          <>
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <input 
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Sarlavha"
                className="text-2xl font-black bg-transparent outline-none w-full text-slate-800 dark:text-white placeholder-slate-300 hacker:text-[#0f0]"
              />
              <div className="flex items-center gap-2 pl-4">
                <button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="p-3 bg-indigo-50 dark:bg-zinc-800 text-indigo-600 hacker:text-[#0f0] hacker:bg-[#002200] rounded-xl hover:bg-indigo-100 transition-all"
                  title="Saqlash"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                </button>
                <button 
                  onClick={handlePrint}
                  className="p-3 bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hacker:text-[#0f0] hacker:bg-[#002200] rounded-xl hover:bg-slate-100 transition-all"
                  title="Chop etish"
                >
                  <Printer size={20} />
                </button>
                <button 
                  onClick={handleDelete}
                  className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 hacker:text-red-500 hacker:bg-[#220000] rounded-xl hover:bg-red-100 transition-all"
                  title="O'chirish"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
            
            <textarea 
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Qaydlaringizni shu yerga yozing..."
              className="flex-1 w-full p-6 resize-none outline-none bg-transparent text-lg leading-relaxed text-slate-700 dark:text-zinc-300 hacker:text-[#0f0] hacker:font-mono"
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <FileText size={64} className="mb-4 opacity-20" />
            <p className="font-medium">Tahrirlash uchun qaydni tanlang yoki yangisini yarating</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notebook;