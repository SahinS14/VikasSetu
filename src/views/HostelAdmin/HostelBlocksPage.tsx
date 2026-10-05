/**
 * src/views/HostelAdmin/HostelBlocksPage.tsx
 *
 * Blocks & Floors Page (Tab 2)
 * Physical hostel infrastructure, wing allocations, floors, capacities, and wardens.
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { useHostel } from './HostelContext';

export const HostelBlocksPage: React.FC = () => {
  const { navigate } = useApp();
  const { blocks, rooms } = useHostel();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E0E6E2] shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Hostel Blocks & Buildings</h2>
          <p className="text-xs text-gray-500">Physical infrastructure, floor layout and resident warden details</p>
        </div>
        <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          {blocks.length} Active Residential Blocks
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {blocks.map(blk => {
          const blockRooms = rooms.filter(r => r.blockId === blk.id);
          let occupied = 0;
          let total = 0;
          blockRooms.forEach(r => {
            (r.beds || []).forEach(bd => {
              total++;
              if (bd.status === 'occupied') occupied++;
            });
          });
          const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;

          return (
            <div key={blk.id} className="bg-white rounded-2xl border border-[#E0E6E2] p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {blk.code}
                    </span>
                    <h3 className="text-base font-extrabold text-gray-900 mt-1">{blk.name}</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold capitalize bg-gray-100 text-gray-700">
                    {blk.genderPolicy}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-gray-100">
                  <div>
                    <div className="text-gray-400 text-[10px]">Total Floors</div>
                    <div className="font-bold text-gray-800">{blk.totalFloors} Floors (G+{blk.totalFloors - 1})</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-[10px]">Configured Rooms</div>
                    <div className="font-bold text-gray-800">{blockRooms.length} Rooms</div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>Total Capacity</span>
                    <span>{occupied}/{total} Beds ({pct}%)</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="bg-[#005B46] h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="text-xs text-gray-600 flex items-center justify-between">
                  <span className="font-medium">Warden In-Charge:</span>
                  <span className="font-bold text-gray-900">{blk.caretakerName || 'Chief Warden'}</span>
                </div>
                {blk.caretakerPhone && (
                  <div className="text-xs text-gray-500 flex items-center justify-between font-mono">
                    <span>Helpline:</span>
                    <span>{blk.caretakerPhone}</span>
                  </div>
                )}
                <button
                  onClick={() => navigate('/hostel-admin/rooms')}
                  className="w-full mt-2 py-2 rounded-xl border border-[#005B46] text-[#005B46] hover:bg-emerald-50 text-xs font-bold transition-all cursor-pointer"
                >
                  View Bed Matrix for {blk.code}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HostelBlocksPage;
