
import React, { useState, useEffect } from 'react';
import { 
  Plus, Users, LayoutGrid, CheckCircle2, 
  Clock, Trash2, RefreshCcw, Tag, Hash, X
} from 'lucide-react';
import { 
  getBookingCategories, createBookingCategory, deleteBookingCategory,
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
    const name = prompt("Yangi toifa nomini kiriting (masalan: Ichkari xona, Hovli):");
    if (!name?.trim()) return;
    const newCat = await createBookingCategory(name.trim());
    if (newCat) {
      setCategories([...categories, newCat]);
      if (!selectedCategoryId) handleCategoryChange(newCat.id);
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

  const handleDeleteCategory = async (e: React.MouseEvent, catId: string) => {
    e.stopPropagation();
    if (!confirm("Toifani o'chirish barcha unga tegishli stollarni ham o'chirishi mumkin. Davom etasizmi?")) return;
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

  if (loading && categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <RefreshCcw className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 font-medium">Bronlar tizimi yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header with Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Categories on the Left */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-zinc-800 rounded-xl text-slate-400">
            <Hash size={16} />
          </div>
          {categories.map((cat) => (
            <div key={cat.id} className="relative group">
              <button
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-tight transition-all border whitespace-nowrap ${
                  selectedCategoryId === cat.id 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg dark:bg-indigo-600 dark:border-indigo-600' 
                    : 'bg-white dark:bg-zinc-900 text-slate-500 border-slate-100 dark:border-zinc-800 hover:border-indigo-200'
                }`}
              >
                {cat.name}
              </button>
              <button 
                onClick={(e) => handleDeleteCategory(e, cat.id)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                {/* Fixed: Added X to lucide-react imports */}
                <X size={10} />
              </button>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-slate-400 text-sm font-medium italic">Toifalar mavjud emas</p>
          )}
        </div>

        {/* Action Buttons on the Right */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleAddCategory}
            className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 font-bold rounded-xl shadow-sm hover:border-indigo-200 transition-all flex items-center gap-2 text-xs"
          >
            <Tag size={14} /> Toifa +
          </button>
          <button 
            onClick={handleAddRoom}
            className="px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center gap-2 text-xs"
          >
            <Plus size={16} /> Xona +
          </button>
        </div>
      </div>

      {/* Grid of Rooms/Tables */}
      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCcw className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {rooms.map((room) => (
            <div 
              key={room.id}
              onClick={() => toggleRoomStatus(room)}
              className="group relative bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col items-center justify-between min-h-[180px]"
            >
              {/* Room Name/Number */}
              <div className="absolute top-6 left-6">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{room.name}</span>
              </div>

              {/* Center Plus Button (Visual only as per request) */}
              <div className="mt-12 w-16 h-16 rounded-full bg-slate-50 dark:bg-zinc-800 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 transition-colors">
                <Plus size={32} />
              </div>

              {/* Status Pill */}
              <div className="mt-6 w-full">
                <div className={`
                  w-full py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-center transition-colors
                  ${room.status === 'free' 
                    ? 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-500' 
                    : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}
                `}>
                  {room.status === 'free' ? 'bo\'sh' : 'band'}
                </div>
              </div>

              {/* Hover Delete Action */}
              <button 
                onClick={(e) => handleDeleteRoom(e, room.id)}
                className="absolute -top-2 -right-2 p-2 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 shadow-md"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {rooms.length === 0 && selectedCategoryId && (
            <div className="col-span-full py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <LayoutGrid size={32} />
              </div>
              <p className="text-slate-400 font-medium">Ushbu toifada hali stollar yo'q</p>
              <button onClick={handleAddRoom} className="text-indigo-600 font-bold text-sm mt-2 hover:underline">Birinchi stolni qo'shing</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Booking;
