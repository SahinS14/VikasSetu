import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Users,
  ShieldCheck,
  Sparkles,
  Building2,
  GraduationCap,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useApp } from '../../context/AppContext';

export const TraineeTimetable: React.FC = () => {
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
      const data = await api.programmes.getMyTimetable();
      setTimetableData(data);

      // Set today's day of week if sessions exist
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      if (days.includes(today) && data?.scheduleByDay?.[today]?.length > 0) {
        setSelectedDay(today);
      }
    } catch (err: any) {
      console.error('Failed to load trainee timetable:', err);
      setError(err.message || 'Could not load timetable schedule.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE':
        return {
          label: 'LIVE NOW',
          className: 'bg-emerald-500 text-white animate-pulse',
        };
      case 'UPCOMING':
        return {
          label: 'UPCOMING',
          className: 'bg-blue-100 text-blue-800 border border-blue-200',
        };
      case 'COMPLETED':
        return {
          label: 'COMPLETED',
          className: 'bg-slate-100 text-slate-700',
        };
      default:
        return {
          label: status,
          className: 'bg-slate-100 text-slate-700',
        };
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-24">
      {/* ─── Header Banner ────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#003B2B] to-[#005B46] text-white p-8 shadow-xl border border-emerald-700/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider text-emerald-200">
            <CalendarDays className="w-3.5 h-3.5 text-amber-300" /> Batch-Driven Timetable Engine
          </div>
          <h1 className="text-3xl font-black tracking-tight">Academic Timetable</h1>
          <p className="text-emerald-100 text-xs md:text-sm leading-relaxed">
            Your daily classroom, lab, and interactive lecture schedule is automatically derived from your enrolled programme batches. Physical attendance is verified via Kiosk Biometric Face & RFID.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => navigate('/trainee/attendance')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black shadow transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" /> Attendance Scanner
          </button>
        </div>
      </div>

      {/* ─── Scope Notice Ribbon ──────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold">Physical & Blended Programme Schedule</div>
          <p className="text-blue-800 leading-relaxed">
            Timetable sessions are generated exclusively for Physical On-Site, Blended, and Contact Classes. Trainees enrolled in self-paced asynchronous online courses access materials through the Learning Portal.
          </p>
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

      {/* ─── Scheduled Sessions for Selected Day ─────────────────────────────── */}
      {loading ? (
        <div className="p-16 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Retrieving Scheduled Batch Sessions...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
          <div className="font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Failed to load timetable
          </div>
          <p>{error}</p>
        </div>
      ) : !timetableData?.scheduleByDay?.[selectedDay] || timetableData.scheduleByDay[selectedDay].length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-50 border border-dashed border-slate-300 space-y-3">
          <CalendarDays className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No scheduled sessions for {selectedDay}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You do not have any physical lecture or laboratory sessions rostered on this day.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {timetableData.scheduleByDay[selectedDay].map((s: any) => {
            const statusBadge = getStatusBadge(s.status);
            const isAttended = s.isAttended;

            return (
              <div
                key={s.id}
                className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${statusBadge.className}`}>
                      {statusBadge.label}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
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

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {s.timeSlot}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {s.room} ({s.classroomId})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> {s.instructor}
                    </span>
                  </div>
                </div>

                {/* Right: Attendance Verification & Check-in Badge */}
                <div className="flex flex-col items-start md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {isAttended ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Attendance Recorded (Present)
                    </div>
                  ) : s.status === 'LIVE' ? (
                    <div className="space-y-2 text-right">
                      <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Biometric Kiosk Ready
                      </div>
                      <button
                        onClick={() => navigate('/trainee/attendance')}
                        className="px-4 py-2 rounded-xl bg-[#005B46] hover:bg-[#004736] text-white text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" /> Check-in Now
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 font-medium">
                      Attendance opens at session commencement
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TraineeTimetable;
