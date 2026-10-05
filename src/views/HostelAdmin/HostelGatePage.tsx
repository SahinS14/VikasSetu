/**
 * src/views/HostelAdmin/HostelGatePage.tsx
 *
 * Gate Check-In & Out Desk (Tab 6)
 * Real-time gate verification console with NFC, Aadhaar, and Physical ID verification.
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  LogIn,
  CheckCircle2
} from 'lucide-react';
import { useHostel } from './HostelContext';

export const HostelGatePage: React.FC = () => {
  const { allocations, handleCheckIn, handleCheckOut } = useHostel();

  const [checkinSearchQuery, setCheckinSearchQuery] = useState('');
  const [checkinMethod, setCheckinMethod] = useState<'NFC' | 'Aadhaar' | 'PhysicalID'>('NFC');
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  const onConfirmEntry = async (allocId: string, traineeName: string) => {
    try {
      await handleCheckIn(allocId, traineeName, checkinMethod);
      setVerificationFeedback(
        `✓ ${traineeName} is successfully verified via ${checkinMethod} & checked in at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      );
    } catch {
      // toast shown by context
    }
  };

  const filteredGateAllocations = allocations.filter(a => {
    if (!checkinSearchQuery) return true;
    const q = checkinSearchQuery.toLowerCase();
    return (
      (a.traineeName || '').toLowerCase().includes(q) ||
      (a.passNumber || a.id || '').toLowerCase().includes(q) ||
      (a.roomNumber || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gate Verification Console */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-[#E0E6E2] p-6 shadow-sm space-y-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Main Gate 1 Warden Console</span>
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Hostel Pass Check-In</h3>
            <p className="text-xs text-gray-500">Verify trainee entry and issue physical room key card.</p>
          </div>

          {/* Verification Method Switch */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-700 uppercase">Verification Mode</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['NFC', 'Aadhaar', 'PhysicalID'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCheckinMethod(m)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    checkinMethod === m
                      ? 'bg-[#005B46] text-white border-[#005B46]'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Search */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-700 uppercase">Pass Number or Trainee Name</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="HST-PASS-2026 or Trainee Name..."
                value={checkinSearchQuery}
                onChange={e => setCheckinSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#005B46]/20"
              />
            </div>
          </div>

          {verificationFeedback && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-fadeIn">
              {verificationFeedback}
            </div>
          )}

          <div className="text-[11px] text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-200/80 space-y-1">
            <div className="font-bold text-gray-800">Gate Operations Guideline:</div>
            <div>1. Inspect trainee identity or scan QR from digital hostel pass.</div>
            <div>2. Verify residential programme eligibility.</div>
            <div>3. Tap Check-In to record warden verification timestamp.</div>
          </div>
        </div>

        {/* Eligible Check-in & Checked-in Queue */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E0E6E2] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-gray-900">Eligible Allocations at Campus Gate</h3>
            <span className="text-xs font-semibold text-gray-500">
              {filteredGateAllocations.length} Trainees on Roster
            </span>
          </div>

          <div className="space-y-3">
            {filteredGateAllocations.map(alloc => (
              <div
                key={alloc.id}
                className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-gray-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm">{alloc.traineeName}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {alloc.passNumber || `HST-${(alloc.id || 'PASS').slice(0, 8).toUpperCase()}`}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {alloc.programmeName || alloc.programmeTitle || 'NCCT Residential Programme'}
                  </div>
                  <div className="text-xs font-semibold text-emerald-800">
                    Assigned: {alloc.blockName} • Room {alloc.roomNumber} (Bed {alloc.bedNumber})
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {alloc.status === 'allocated' && (
                    <button
                      onClick={() => onConfirmEntry(alloc.id, alloc.traineeName)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Confirm Entry</span>
                    </button>
                  )}
                  {alloc.status === 'checked_in' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
                      </span>
                      <button
                        onClick={() => handleCheckOut(alloc.id, alloc.traineeName, alloc.bedNumber)}
                        className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                      >
                        Gate Exit
                      </button>
                    </div>
                  )}
                  {alloc.status === 'checked_out' && (
                    <span className="text-xs text-gray-400 italic">Checked Out</span>
                  )}
                </div>
              </div>
            ))}

            {filteredGateAllocations.length === 0 && (
              <div className="py-12 text-center text-gray-400 text-xs">
                No matching allocations found for gate entry.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostelGatePage;
