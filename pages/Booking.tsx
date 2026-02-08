
import React, { useState, useEffect } from 'react';
import { 
  Plus, LayoutGrid, Trash2, 
  RefreshCcw, Tag, Hash, X, Edit2
} from 'lucide-react';
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const cats = await getBookingCategories();
    setCategories(cats);
    if (cats.length > 0) {
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

  const handleAddCategory = async () => {
    const name = prompt("Yangi toifa nomini kiriting:");
    if (!name?.trim()) return;
    const newCat = await createBookingCategory(name.trim());
    if (newCat) {
      setCategories([...categories, newCat]);
      if (!selectedCategoryId) handleCategoryChange(newCat.id);
    }
  };

  const handleEditCategory = async (e: React.MouseEvent, cat: BookingCategory) => {
    e.stopPropagation();
    const newName = prompt("Toifa nomini o'zgartiring:", cat.name);
    if (!newName?.trim() || newName === cat.name) return;
    
    try {
      await updateBookingCategory(cat.id, newName.trim());
      setCategories(categories.map(c => c.id === cat.id ? { ...c, name: newName.trim() } : c));
    } catch (err) {
      alert("Xatolik yuz berdi");
    }
  };

  const handleDeleteCategory = async (e: React.MouseEvent, catId: string) => {
    e.stopPropagation();
    if (!confirm("Ushbu toifani va unga tegishli barcha stollarni o'chirib tashlamoqchimisiz?")) return;
    await deleteBookingCategory(catId);
    const updatedCats = categories.filter(c => c.id !== catId);
    setCategories(updatedCats);
    if (selectedCategoryId === catId) {
      if (updatedCats.length > 0) handleCategoryChange(updatedCats[0].id);
      else {
        setSelectedCategoryId(null);
        setRooms([]);
      }
    }
  };

  const handleAddRoom = async () => {
    if (!selectedCategoryId) return alert("Avval toifa tanlang yoki yarating!");
    const name = prompt("Stol yoki xona raqami/nomini kiriting:");
    if (!name?.trim()) return;
    const newRoom = await createRoom(selectedCategoryId, name.trim());
    if (newRoom) {
      setRooms([...rooms, newRoom]);
    }
  };

  const toggleRoomStatus = async (room: Room) => {
    const newStatus = room.status === 'free' ? 'busy' : 'free';
    await updateRoomStatus(room.id, newStatus);
    setRooms(rooms.map(r => r.id === room.id ? { ...r, status: newStatus } : r));
  };

  const handleDeleteRoom = async (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    if (!confirm("Ushbu stolni o'chirib tashlamoqchimisiz?")) return;
    await deleteRoom(roomId);
    setRooms(rooms.filter(r => r.id !== roomId));
  };

  if (loading && categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <RefreshCcw className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 font-medium italic">Ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header with Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 shadow-sm">
        {/* Categories on the Left */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar max-w-full">
          <div className="shrink-0 w-10 h-10 bg-slate-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-slate-400">
            <Hash size={18} />
          </div>
          <div className="flex items-center gap-2">
            {categories.map((cat) => (
              <div key={cat.id} className="relative group shrink-0">
                <button
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border whitespace-nowrap ${
                    selectedCategoryId === cat.id 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-lg dark:bg-indigo-600 dark:border-indigo-600' 
                      : 'bg-white dark:bg-zinc-950 text-slate-500 border-slate-200 dark:border-zinc-800 hover:border-indigo-300'
                  }`}
                >
                  {cat.name}
                </button>
                
                {/* Actions Overlay for Desktop Hover */}
                <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                  <button 
                    onClick={(e) => handleEditCategory(e, cat)}
                    className="w-7 h-7 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 text-indigo-600 rounded-full flex items-center justify-center shadow-md hover:scale-110 active:scale-95"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteCategory(e, cat.id)}
                    className="w-7 h-7 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 text-red-500 rounded-full flex items-center justify-center shadow-md hover:scale-110 active:scale-95"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {categories.length === 0 && (
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-2">Toifalar yo'q</p>
          )}
        </div>

        {/* Action Buttons on the Right */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={handleAddCategory}
            className="px-5 py-3 bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-black rounded-2xl hover:bg-slate-100 transition-all flex items-center gap-2 text-[11px] uppercase tracking-widest"
          >
            <Tag size={16} /> Toifa +
          </button>
          <button 
            onClick={handleAddRoom}
            className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center gap-2 text-[11px] uppercase tracking-widest"
          >
            <Plus size={18} /> Xona +
          </button>
        </div>
      </div>

      {/* Grid of Rooms/Tables */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <RefreshCcw className="animate-spin text-indigo-600" size={32} />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Yuklanmoqda...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {rooms.map((room) => (
            <div 
              key={room.id}
              onClick={() => toggleRoomStatus(room)}
              className="group relative bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center justify-between min-h-[220px]"
            >
              {/* Room Name/Number */}
              <div className="absolute top-8 left-0 w-full text-center">
                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{room.name}</span>
              </div>

              {/* Center Icon */}
              <div className="mt-16 w-20 h-20 rounded-3xl bg-slate-50 dark:bg-zinc-950 flex items-center justify-center text-slate-200 group-hover:text-indigo-600 transition-all group-hover:scale-110">
                <LayoutGrid size={40} />
              </div>

              {/* Status Pill */}
              <div className="w-full">
                <div className={`
                  w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-center transition-all
                  ${room.status === 'free' 
                    ? 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-slate-500' 
                    : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}
                `}>
                  {room.status === 'free' ? 'bo\'sh' : 'band'}
                </div>
              </div>

              {/* Delete Action Overlay */}
              <button 
                onClick={(e) => handleDeleteRoom(e, room.id)}
                className="absolute top-4 right-4 p-2 bg-white dark:bg-zinc-800 border border-slate-50 dark:border-zinc-700 text-red-400 hover:text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:scale-110"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {rooms.length === 0 && selectedCategoryId && (
            <div className="col-span-full py-32 text-center bg-white/50 dark:bg-zinc-900/50 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-zinc-800">
              <div className="w-20 h-20 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <LayoutGrid size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter mb-2">Ushbu toifada hali stollar yo'q</h3>
              <p className="text-slate-400 text-sm mb-6">Yangi stol qo'shish uchun yuqoridagi tugmani bosing</p>
              <button onClick={handleAddRoom} className="px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-indigo-100">
                Birinchi stolni qo'shing
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Booking;
