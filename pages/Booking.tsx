
import React, { useState, useEffect } from 'react';
import { 
  Plus, LayoutGrid, Trash2, 
  RefreshCcw, Tag, Hash, X, Edit2
} from 'lucide-react';
import UIModal from '../components/UIModal.tsx';
import { 
  getBookingCategories, createBookingCategory, updateBookingCategory, deleteBookingCategory,
  getRooms, createRoom, updateRoomStatus, deleteRoom 
} from '../services/supabase.ts';
import { BookingCategory, Room } from '../types.ts';

const Booking: React.FC = () => {
  const [categories, setCategories] = useState<BookingCategory[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'input' | 'confirm' | 'password';
    title: string;
    description?: string;
    initialValue?: string;
    placeholder?: string;
    onConfirm: (val?: string) => void;
    isDanger?: boolean;
  }>({
    isOpen: false,
    type: 'input',
    title: '',
    onConfirm: () => {},
  });

  const openModal = (config: Omit<typeof modal, 'isOpen'>) => {
    setModal({ ...config, isOpen: true });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const cats = await getBookingCategories();
    setCategories(cats);
    if (cats && cats.length > 0) {
      const firstCatId = cats[0].id;
      setSelectedCategoryId(firstCatId);
      const initialRooms = await getRooms(firstCatId);
      setRooms(initialRooms);
    }
    setLoading(false);
  };

  const handleCategoryChange = async (catId: string) => {
    setSelectedCategoryId(catId);
    setLoading(true);
    const catRooms = await getRooms(catId);
    setRooms(catRooms);
    setLoading(false);
  };

  const handleAddCategory = () => {
    openModal({
      title: "Yangi toifa",
      description: "Yangi toifa nomini kiriting (masalan: Zal, Kabina).",
      type: 'input',
      placeholder: "Toifa nomi",
      onConfirm: async (name) => {
        if (!name?.trim()) return;
        const newCat = await createBookingCategory(name.trim());
        if (newCat) {
          setCategories([...categories, newCat]);
          if (!selectedCategoryId) handleCategoryChange(newCat.id);
        }
      }
    });
  };

  const handleEditCategory = (e: React.MouseEvent, cat: BookingCategory) => {
    e.stopPropagation();
    openModal({
      title: "Toifani tahrirlash",
      type: 'input',
      initialValue: cat.name,
      onConfirm: async (newName) => {
        if (!newName?.trim() || newName === cat.name) return;
        await updateBookingCategory(cat.id, newName.trim());
        setCategories(categories.map(c => c.id === cat.id ? { ...c, name: newName.trim() } : c));
      }
    });
  };

  const handleDeleteCategory = (e: React.MouseEvent, catId: string) => {
    e.stopPropagation();
    openModal({
      title: "Toifani o'chirish",
      description: "Ushbu toifani va unga tegishli barcha stollarni o'chirishga aminmisiz?",
      type: 'confirm',
      isDanger: true,
      onConfirm: async () => {
        await deleteBookingCategory(catId);
        const updatedCats = categories.filter(c => c.id !== catId);
        setCategories(updatedCats);
        if (selectedCategoryId === catId) {
          if (updatedCats.length > 0) handleCategoryChange(updatedCats[0].id);
          else { setSelectedCategoryId(null); setRooms([]); }
        }
      }
    });
  };

  const handleAddRoom = () => {
    if (!selectedCategoryId) return;
    openModal({
      title: "Stol yoki Xona qo'shish",
      description: "Raqam yoki nomini kiriting.",
      type: 'input',
      placeholder: "Masalan: 5 yoki Stol 1",
      onConfirm: async (name) => {
        if (!name?.trim()) return;
        const newRoom = await createRoom(selectedCategoryId, name.trim());
        if (newRoom) {
          setRooms(prev => [...prev, newRoom]);
        }
      }
    });
  };

  const toggleRoomStatus = async (room: Room) => {
    const newStatus = room.status === 'free' ? 'busy' : 'free';
    await updateRoomStatus(room.id, newStatus);
    setRooms(rooms.map(r => r.id === room.id ? { ...r, status: newStatus } : r));
  };

  const handleDeleteRoom = (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    openModal({
      title: "Stolni o'chirish",
      description: "Ushbu stolni o'chirmoqchimisiz?",
      type: 'confirm',
      isDanger: true,
      onConfirm: async () => {
        await deleteRoom(roomId);
        setRooms(rooms.filter(r => r.id !== roomId));
      }
    });
  };

  if (loading && categories.length === 0) return <div className="flex flex-col items-center justify-center h-96"><RefreshCcw className="animate-spin text-slate-900 dark:text-white mb-4" size={40} /><p className="text-slate-500 font-medium italic">Yuklanmoqda...</p></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <UIModal {...modal} onClose={() => setModal({ ...modal, isOpen: false })} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {categories.map((cat) => (
            <div key={cat.id} className="relative group shrink-0">
              <button onClick={() => handleCategoryChange(cat.id)} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all ${selectedCategoryId === cat.id ? 'bg-slate-900 text-white dark:bg-white dark:text-black border-slate-900 dark:border-white' : 'bg-white dark:bg-zinc-950 text-slate-500 border-slate-100 dark:border-zinc-800'}`}>{cat.name}</button>
              <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10"><button onClick={(e) => handleEditCategory(e, cat)} className="w-7 h-7 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-full flex items-center justify-center text-slate-900 dark:text-white shadow-md"><Edit2 size={12} /></button><button onClick={(e) => handleDeleteCategory(e, cat.id)} className="w-7 h-7 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-full flex items-center justify-center text-red-500 shadow-md"><X size={12} /></button></div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 shrink-0"><button onClick={handleAddCategory} className="px-5 py-3 bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-black rounded-2xl text-[11px] uppercase tracking-widest border border-transparent hover:border-slate-200">Toifa +</button><button onClick={handleAddRoom} className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-black font-black rounded-2xl text-[11px] uppercase tracking-widest hover:bg-black dark:hover:bg-slate-100 transition-all shadow-lg shadow-slate-200 dark:shadow-none">Xona +</button></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {rooms.map((room) => (
          <div key={room.id} onClick={() => toggleRoomStatus(room)} className="group relative bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center justify-between min-h-[220px]">
            <div className="absolute top-8 left-0 w-full text-center font-black text-4xl text-slate-900 dark:text-white tracking-tighter">{room.name}</div>
            <div className="mt-16 w-20 h-20 rounded-3xl bg-slate-50 dark:bg-zinc-950 flex items-center justify-center text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-all"><LayoutGrid size={40} /></div>
            <div className="w-full"><div className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-center ${room.status === 'free' ? 'bg-slate-100 text-slate-500 dark:bg-zinc-800' : 'bg-red-50 text-red-600 dark:bg-red-900/30'}`}>{room.status === 'free' ? 'bo\'sh' : 'band'}</div></div>
            <button onClick={(e) => handleDeleteRoom(e, room.id)} className="absolute top-4 right-4 p-2 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 text-red-400 opacity-0 group-hover:opacity-100 rounded-full transition-all hover:text-red-600"><Trash2 size={14} /></button>
          </div>
        ))}
        {rooms.length === 0 && selectedCategoryId && <div className="col-span-full py-32 text-center bg-white/50 dark:bg-zinc-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-zinc-800"><h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter mb-2">Ushbu toifada hali stollar yo'q</h3><button onClick={handleAddRoom} className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-black font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg">Birinchi stolni qo'shing</button></div>}
      </div>
    </div>
  );
};

export default Booking;
