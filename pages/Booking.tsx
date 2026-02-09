
import React, { useState, useEffect } from 'react';
import { 
  Plus, LayoutGrid, Trash2, 
  RefreshCcw, Edit2, X, Calendar, Clock,
  User, Phone, FileText, Check, AlertCircle, ChevronDown
} from 'lucide-react';
import UIModal from '../components/UIModal.tsx';
import { 
  getBookingCategories, createBookingCategory, updateBookingCategory, deleteBookingCategory,
  getRooms, createRoom, updateRoomStatus, deleteRoom,
  getBookingsForDate, createBooking, deleteBooking
} from '../services/supabase.ts';
import { BookingCategory, Room, Booking as BookingType } from '../types.ts';

// Helper for 24h format display
const formatDateTime24h = (isoString: string) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

// Custom 24h Picker Component
const DateTimePicker24h = ({ value, onChange, className }: { value: string, onChange: (val: string) => void, className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleDateChange = (dateVal: string) => {
    const timePart = value.split('T')[1] || '00:00';
    onChange(`${dateVal}T${timePart}`);
  };

  const handleTimeChange = (type: 'hour' | 'minute', val: string) => {
    const [datePart, timePart] = value.split('T');
    const [h, m] = (timePart || '00:00').split(':');
    const newTime = type === 'hour' ? `${val}:${m}` : `${h}:${val}`;
    onChange(`${datePart}T${newTime}`);
  };

  const [datePart, timePart] = value.split('T');
  const [currentHour, currentMinute] = (timePart || '00:00').split(':');

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <div className={`relative ${className}`}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 pl-4 pr-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl text-xs font-bold uppercase tracking-wide hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all dark:text-white"
      >
        <span>{formatDateTime24h(value)}</span>
        <Calendar size={16} className="text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 mt-2 p-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-xl z-20 flex flex-col gap-4 min-w-[280px]">
            
            {/* Date Selection */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sana</label>
              <input 
                type="date" 
                value={datePart}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm font-bold dark:text-white outline-none"
              />
            </div>

            {/* Time Selection */}
            <div>
               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vaqt (24 soat)</label>
               <div className="flex gap-2 h-32">
                 <div className="flex-1 flex flex-col">
                    <span className="text-[9px] text-center text-slate-400 font-bold mb-1">SOAT</span>
                    <select 
                        value={currentHour}
                        onChange={(e) => handleTimeChange('hour', e.target.value)}
                        className="flex-1 p-1 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 text-lg font-black text-center dark:text-white outline-none"
                        size={4}
                    >
                        {hours.map(h => <option key={h} value={h} className="py-1">{h}</option>)}
                    </select>
                 </div>
                 <span className="py-8 font-black text-slate-300">:</span>
                 <div className="flex-1 flex flex-col">
                    <span className="text-[9px] text-center text-slate-400 font-bold mb-1">DAQIQA</span>
                    <select 
                        value={currentMinute}
                        onChange={(e) => handleTimeChange('minute', e.target.value)}
                        className="flex-1 p-1 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 text-lg font-black text-center dark:text-white outline-none"
                        size={4}
                    >
                        {minutes.map(m => <option key={m} value={m} className="py-1">{m}</option>)}
                    </select>
                 </div>
               </div>
            </div>
            
            <div className="text-center pt-2 border-t border-slate-100 dark:border-zinc-800">
               <button type="button" onClick={() => setIsOpen(false)} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">Yopish</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Booking: React.FC = () => {
  const [categories, setCategories] = useState<BookingCategory[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking State
  const [selectedDateTime, setSelectedDateTime] = useState<string>(() => {
    // Current time in local timezone for datetime-local input
    const now = new Date();
    // Adjust for timezone offset to get local ISO string-like format
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
    return localISOTime;
  });
  const [bookings, setBookings] = useState<BookingType[]>([]);
  
  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bookingForm, setBookingForm] = useState({
    customerName: '',
    phoneNumber: '',
    description: '',
    bookingTime: '',
  });

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'input' | 'confirm' | 'password';
    title: string;
    description?: string;
    initialValue?: string;
    placeholder?: string;
    onConfirm: (val?: string) => void;
    isDanger?: boolean;
    enableNumberFormatting?: boolean;
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

  useEffect(() => {
    fetchBookings();
  }, [selectedDateTime]);

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
    await fetchBookings();
    setLoading(false);
  };

  const fetchBookings = async () => {
    const date = new Date(selectedDateTime);
    const data = await getBookingsForDate(date);
    setBookings(data || []);
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

  // --- BOOKING LOGIC ---

  const getRoomBookingForSelectedTime = (roomId: string) => {
    const selectedTime = new Date(selectedDateTime).getTime();
    
    // Within 1 hour window check
    return bookings.find(b => {
      const bTime = new Date(b.booking_time).getTime();
      return b.room_id === roomId && Math.abs(bTime - selectedTime) < 60 * 60 * 1000; 
    });
  };

  const handleRoomClick = (room: Room) => {
    const booking = getRoomBookingForSelectedTime(room.id);
    
    setSelectedRoom(room);
    if (booking) {
      // Room is busy, show details (fill form with existing data)
      const bDate = new Date(booking.booking_time);
      const offset = bDate.getTimezoneOffset() * 60000;
      const localBookingTime = (new Date(bDate.getTime() - offset)).toISOString().slice(0, 16);

      setBookingForm({
        customerName: booking.customer_name,
        phoneNumber: booking.phone_number,
        description: booking.description,
        bookingTime: localBookingTime
      });
    } else {
      // Room is free, setup for new booking
      setBookingForm({
        customerName: '',
        phoneNumber: '',
        description: '',
        bookingTime: selectedDateTime // Default to currently picked time
      });
    }
    setIsBookingModalOpen(true);
  };

  const handleSaveBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    const existingBooking = getRoomBookingForSelectedTime(selectedRoom.id);
    
    if (existingBooking) {
      setIsBookingModalOpen(false);
      return;
    }

    const newBooking = await createBooking({
      room_id: selectedRoom.id,
      customer_name: bookingForm.customerName,
      phone_number: bookingForm.phoneNumber,
      description: bookingForm.description,
      booking_time: new Date(bookingForm.bookingTime).toISOString(),
    });

    if (newBooking) {
      setBookings([...bookings, newBooking]);
      setIsBookingModalOpen(false);
    } else {
      alert("Bron qilishda xatolik");
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedRoom) return;
    const existingBooking = getRoomBookingForSelectedTime(selectedRoom.id);
    if (existingBooking && confirm("Bronni bekor qilmoqchimisiz?")) {
      await deleteBooking(existingBooking.id);
      setBookings(bookings.filter(b => b.id !== existingBooking.id));
      setIsBookingModalOpen(false);
    }
  };


  if (loading && categories.length === 0) return <div className="flex flex-col items-center justify-center h-96"><RefreshCcw className="animate-spin text-slate-900 dark:text-white mb-4" size={40} /><p className="text-slate-500 font-medium italic">Yuklanmoqda...</p></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <UIModal {...modal} onClose={() => setModal({ ...modal, isOpen: false })} />
      
      {/* Booking Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                   {getRoomBookingForSelectedTime(selectedRoom?.id || '') ? 'Bron Tafsilotlari' : 'Yangi Bron'}
                 </h3>
                 <button onClick={() => setIsBookingModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={20} /></button>
               </div>
               
               <form onSubmit={handleSaveBooking} className="space-y-4">
                 <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center shadow-sm">
                      <LayoutGrid size={24} className="text-slate-900 dark:text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tanlangan Xona</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">{selectedRoom?.name}</p>
                    </div>
                 </div>

                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Vaqt (24 soat)</label>
                   {/* Custom 24h Picker for Modal */}
                   <DateTimePicker24h 
                     value={bookingForm.bookingTime}
                     onChange={(val) => setBookingForm({...bookingForm, bookingTime: val})}
                     className="w-full"
                   />
                 </div>

                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Mijoz Ismi</label>
                   <div className="relative">
                     <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                     <input 
                       type="text"
                       required
                       placeholder="Ism"
                       value={bookingForm.customerName}
                       onChange={(e) => setBookingForm({...bookingForm, customerName: e.target.value})}
                       readOnly={!!getRoomBookingForSelectedTime(selectedRoom?.id || '')}
                       className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl outline-none font-medium dark:text-white read-only:opacity-60"
                     />
                   </div>
                 </div>

                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Telefon Raqam</label>
                   <div className="relative">
                     <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                     <input 
                       type="text"
                       placeholder="+998"
                       value={bookingForm.phoneNumber}
                       onChange={(e) => setBookingForm({...bookingForm, phoneNumber: e.target.value})}
                       readOnly={!!getRoomBookingForSelectedTime(selectedRoom?.id || '')}
                       className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl outline-none font-medium dark:text-white read-only:opacity-60"
                     />
                   </div>
                 </div>

                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Tavsif (Ixtiyoriy)</label>
                   <div className="relative">
                     <FileText className="absolute left-4 top-3 text-slate-400" size={18} />
                     <textarea 
                       placeholder="Qo'shimcha ma'lumot..."
                       value={bookingForm.description}
                       onChange={(e) => setBookingForm({...bookingForm, description: e.target.value})}
                       readOnly={!!getRoomBookingForSelectedTime(selectedRoom?.id || '')}
                       className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl outline-none font-medium dark:text-white read-only:opacity-60 min-h-[100px] resize-none"
                     />
                   </div>
                 </div>

                 <div className="flex gap-3 pt-2">
                   {getRoomBookingForSelectedTime(selectedRoom?.id || '') ? (
                     <button 
                       type="button"
                       onClick={handleCancelBooking}
                       className="flex-1 py-4 bg-red-50 text-red-600 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-red-100 transition-all"
                     >
                       Bronni Bekor Qilish
                     </button>
                   ) : (
                     <button 
                       type="submit"
                       className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-lg"
                     >
                       Bron Qilish
                     </button>
                   )}
                 </div>
               </form>
            </div>
          </div>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 shadow-sm">
        
        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 max-w-full md:max-w-xl">
          {categories.map((cat) => (
            <div key={cat.id} className="relative group shrink-0">
              <button onClick={() => handleCategoryChange(cat.id)} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all ${selectedCategoryId === cat.id ? 'bg-slate-900 text-white dark:bg-white dark:text-black border-slate-900 dark:border-white' : 'bg-white dark:bg-zinc-950 text-slate-500 border-slate-100 dark:border-zinc-800'}`}>{cat.name}</button>
              <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10"><button onClick={(e) => handleEditCategory(e, cat)} className="w-7 h-7 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-full flex items-center justify-center text-slate-900 dark:text-white shadow-md"><Edit2 size={12} /></button><button onClick={(e) => handleDeleteCategory(e, cat.id)} className="w-7 h-7 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-full flex items-center justify-center text-red-500 shadow-md"><X size={12} /></button></div>
            </div>
          ))}
        </div>

        {/* Date Picker & Actions */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
           {/* Custom Header 24h Picker */}
           <DateTimePicker24h 
              value={selectedDateTime} 
              onChange={setSelectedDateTime} 
              className="w-56"
           />
           
           <div className="h-8 w-px bg-slate-200 dark:bg-zinc-700 mx-2 hidden md:block"></div>

           <button onClick={handleAddCategory} className="px-5 py-3 bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-black rounded-2xl text-[11px] uppercase tracking-widest border border-transparent hover:border-slate-200">Toifa +</button>
           <button onClick={handleAddRoom} className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-black font-black rounded-2xl text-[11px] uppercase tracking-widest hover:bg-black dark:hover:bg-slate-100 transition-all shadow-lg shadow-slate-200 dark:shadow-none">Xona +</button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {rooms.map((room) => {
          const booking = getRoomBookingForSelectedTime(room.id);
          const isBusy = !!booking;
          
          return (
            <div 
              key={room.id} 
              onClick={() => handleRoomClick(room)} 
              className={`group relative border rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center justify-between min-h-[220px] ${
                isBusy 
                  ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' 
                  : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800'
              }`}
            >
              <div className="absolute top-6 left-0 w-full text-center px-4">
                 <div className={`font-black text-3xl tracking-tighter truncate ${isBusy ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>{room.name}</div>
              </div>
              
              <div className={`mt-12 w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${
                 isBusy ? 'bg-red-200 text-red-600 dark:bg-red-900/40 dark:text-red-400' : 'bg-slate-50 dark:bg-zinc-950 text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'
              }`}>
                 <LayoutGrid size={32} />
              </div>
              
              <div className="w-full mt-4">
                <div className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-center truncate px-2 ${
                   isBusy 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-none' 
                    : 'bg-slate-100 text-slate-500 dark:bg-zinc-800'
                }`}>
                  {isBusy ? booking?.customer_name || 'Band' : 'Bo\'sh'}
                </div>
              </div>
              
              {!isBusy && (
                <button onClick={(e) => handleDeleteRoom(e, room.id)} className="absolute top-4 right-4 p-2 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 text-red-400 opacity-0 group-hover:opacity-100 rounded-full transition-all hover:text-red-600"><Trash2 size={14} /></button>
              )}
            </div>
          );
        })}
        {rooms.length === 0 && selectedCategoryId && <div className="col-span-full py-32 text-center bg-white/50 dark:bg-zinc-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-zinc-800"><h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter mb-2">Ushbu toifada hali stollar yo'q</h3><button onClick={handleAddRoom} className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-black font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg">Birinchi stolni qo'shing</button></div>}
      </div>
    </div>
  );
};

export default Booking;
