/**
 * src/views/HostelAdmin/HostelAllocationsPage.tsx
 *
 * Active Allocations Page (Tab 5)
 * Live directory of resident trainees, digital passes, and gate clearances.
 */

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useHostel } from './HostelContext';

export const HostelAllocationsPage: React.FC = () => {
  const { allocations, handleCheckIn, handleCheckOut } = useHostel();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAllocations = allocations.filter(alloc => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (alloc.traineeName || '').toLowerCase().includes(q) ||
      (alloc.passNumber || alloc.id || '').toLowerCase().includes(q) ||
      (alloc.roomNumber || '').toLowerCase().includes(q) ||
      (alloc.programmeName || alloc.programmeTitle || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-[#E0E6E2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Hostel Resident Directory & Passes</h2>
          <p className="text-xs text-gray-500">Active allocations, issued digital passes, and gate clearances</p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search Resident or Pass..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-9 pl-9 pr-3 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#005B46]/20"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E0E6E2] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F7F9F8] border-b border-[#E0E6E2] text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Resident Trainee</th>
                <th className="py-3.5 px-4">Assigned Bed</th>
                <th className="py-3.5 px-4">Pass Number</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Residency Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAllocations.map(alloc => {
                const isCheckedIn = alloc.status === 'checked_in';
                const isAllocated = alloc.status === 'allocated';
                const isCheckedOut = alloc.status === 'checked_out';

                return (
                  <tr key={alloc.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{alloc.traineeName}</div>
                      <div className="text-[11px] text-gray-500">{alloc.programmeName || alloc.programmeTitle || 'NCCT Residential Programme'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-800">Room {alloc.roomNumber}</div>
                      <div className="text-[11px] text-emerald-700 font-semibold">Bed {alloc.bedNumber} ({alloc.blockName})</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-700">
                      {alloc.passNumber || `HST-${(alloc.id || 'PASS').slice(0, 8).toUpperCase()}`}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-gray-600">
                      {alloc.checkInDate} to {alloc.checkOutDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                          isCheckedIn
                            ? 'bg-emerald-100 text-emerald-800'
                            : isAllocated
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {alloc.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {isAllocated && (
                        <button
                          onClick={() => handleCheckIn(alloc.id, alloc.traineeName)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                        >
                          Gate Check-In
                        </button>
                      )}
                      {isCheckedIn && (
                        <button
                          onClick={() => handleCheckOut(alloc.id, alloc.traineeName, alloc.bedNumber)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] cursor-pointer"
                        >
                          Check-Out & Free Bed
                        </button>
                      )}
                      {isCheckedOut && (
                        <span className="text-[11px] text-gray-400 italic">Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredAllocations.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-xs">
            No active allocations found.
          </div>
        )}
      </div>
    </div>
  );
};

export default HostelAllocationsPage;
