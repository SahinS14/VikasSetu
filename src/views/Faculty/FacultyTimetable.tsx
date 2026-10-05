import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  QrCode,
  ArrowRight,
  Info,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useApp } from '../../context/AppContext';

export const FacultyTimetable: React.FC = () => {
  const { navigate } = useApp();
  const [timetableData, setTimetableData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    loadTimetable();
  }, []);

  const loadTimetable = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.facultyTimetable.getSchedule();
      setTimetableData(data);

      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      if (days.includes(today) && data?.scheduleByDay?.[today]?.length > 0) {
        setSelectedDay(today);
      }
    } catch (err: any) {
      console.error('Failed to load faculty timetable:', err);
      setError(err.message || 'Could not load timetable schedule.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-24">
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#003B2B] to-[#005B46] text-white p-8 shadow-xl border border-emerald-700/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider text-emerald-200">
            <CalendarDays className="w-3.5 h-3.5 text-amber-300" /> Faculty Schedule & Hall Roster
          </div>
          <h1 className="text-3xl font-black tracking-tight">Academic Timetable</h1>
          <p className="text-emerald-100 text-xs md:text-sm leading-relaxed">
            Your assigned physical lectures, laboratories, and interactive case clinics scheduled across NCCT batches. All assigned sessions are pre-validated by the Automated Conflict Detection Engine.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/faculty/attendance')}
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black shadow transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" /> Classroom Attendance
          </button>
        </div>
      </div>

      {/* ─── Day Switcher Tabs ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200/80">
        {days.map((day) => {
          const count = timetableData?.scheduleByDay?.[day]?.length || 0;
          const isSelected = selectedDay === day;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{day}</span>
              {count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isSelected ? 'bg-emerald-400 text-slate-950' : 'bg-slate-100 text-slate-700'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Sessions List ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="p-16 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading Faculty Timetable...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
          <div className="font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Error loading faculty timetable
          </div>
          <p>{error}</p>
        </div>
      ) : !timetableData?.scheduleByDay?.[selectedDay] || timetableData.scheduleByDay[selectedDay].length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-50 border border-dashed border-slate-300 space-y-3">
          <CalendarDays className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No teaching sessions on {selectedDay}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You do not have any teaching lectures or lab assessments rostered on this day.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {timetableData.scheduleByDay[selectedDay].map((s: any) => (
            <div
              key={s.id}
              className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    s.status === 'LIVE' ? 'bg-emerald-500 text-white animate-pulse' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {s.status}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    {s.sessionType}
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {s.batchName}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 leading-snug">
                    {s.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    {s.programmeTitle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {s.timeSlot}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {s.room} ({s.classroomId})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" /> Attended: {s.presentCount} / {s.capacity}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => navigate('/faculty/attendance')}
                  className="px-4 py-2 rounded-xl bg-[#005B46] hover:bg-[#004736] text-white text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" /> Launch Attendance
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacultyTimetable;
