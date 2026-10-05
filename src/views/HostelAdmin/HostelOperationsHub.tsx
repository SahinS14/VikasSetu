/**
 * src/views/HostelAdmin/HostelOperationsHub.tsx
 *
 * Operations Hub (Tab 1)
 * Live campus occupancy telemetry, wing breakdowns, priority queue, and checked-in residents.
 */

import React from 'react';
import {
  Utensils,
  Wrench,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useHostel } from './HostelContext';

export const HostelOperationsHub: React.FC = () => {
  const { navigate } = useApp();
  const {
    metrics,
    blocks,
    rooms,
    requests,
    allocations,
    openAllocateModal
  } = useHostel();

  return (
    <div className="space-y-6">
      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Occupancy Progress */}
        <div className="bg-white rounded-2xl border border-[#E0E6E2] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Live Campus Occupancy</span>
            <span className="text-xs font-extrabold text-[#005B46] px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
              {metrics?.occupancyRate || 0}% Full
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600 font-semibold">
              <span>{metrics?.occupiedBeds || 0} Occupied</span>
              <span>{metrics?.totalBeds || 0} Total Beds</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
              <div
                className="bg-[#005B46] h-full transition-all duration-500"
                style={{ width: `${metrics?.occupancyRate || 0}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-center">
            <div className="p-2 rounded-xl bg-gray-50">
              <div className="text-[10px] text-gray-500">Occupied</div>
              <div className="text-sm font-bold text-gray-800">{metrics?.occupiedBeds || 0}</div>
            </div>
            <div className="p-2 rounded-xl bg-gray-50">
              <div className="text-[10px] text-gray-500">Available</div>
              <div className="text-sm font-bold text-emerald-700">{metrics?.availableBeds || 0}</div>
            </div>
            <div className="p-2 rounded-xl bg-gray-50">
              <div className="text-[10px] text-gray-500">Maintenance</div>
              <div className="text-sm font-bold text-amber-700">{metrics?.maintenanceBeds || 0}</div>
            </div>
          </div>
        </div>

        {/* Priority Admission Queue */}
        <div className="bg-white rounded-2xl border border-[#E0E6E2] p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Pending Trainee Requests</span>
              <button
                onClick={() => navigate('/hostel-admin/requests')}
                className="text-xs font-bold text-[#005B46] hover:underline cursor-pointer"
              >
                Review All &rarr;
              </button>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 font-extrabold text-xl">
                {metrics?.pendingRequests || 0}
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">Awaiting Bed Assignment</div>
                <div className="text-xs text-gray-500">Automated priority scoring evaluates distance, travel mode & nomination.</div>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{metrics?.availableBeds || 0} vacant beds ready for immediate 1-click allocation</span>
          </div>
        </div>

        {/* Mess & Hygiene Status */}
        <div className="bg-white rounded-2xl border border-[#E0E6E2] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Campus Welfare & Mess</span>
            <span className="text-xs font-semibold text-gray-500">Audited Today</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-amber-600" />
                <span>Resident Diners:</span>
              </span>
              <span className="font-bold text-gray-900">{metrics?.checkedInCount || 0} Pax</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-blue-600" />
                <span>Open Repairs:</span>
              </span>
              <span className="font-bold text-amber-600">{metrics?.activeComplaints ?? metrics?.openComplaints ?? 0} Tickets</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Gate Curfew:</span>
              </span>
              <span className="font-bold text-gray-900">22:00 Hrs IST</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Blocks Status Grid */}
      <div className="bg-white rounded-2xl border border-[#E0E6E2] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Hostel Infrastructure & Wing Status</h3>
            <p className="text-xs text-gray-500">Live occupancy breakdown across designated campus wings</p>
          </div>
          <button
            onClick={() => navigate('/hostel-admin/blocks')}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Manage Blocks
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {blocks.map(blk => {
            const blockRooms = rooms.filter(r => r.blockId === blk.id);
            let occupiedInBlock = 0;
            let totalInBlock = 0;
            blockRooms.forEach(r => {
              (r.beds || []).forEach(bd => {
                totalInBlock++;
                if (bd.status === 'occupied') occupiedInBlock++;
              });
            });
            const pct = totalInBlock > 0 ? Math.round((occupiedInBlock / totalInBlock) * 100) : 0;

            return (
              <div key={blk.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-gray-50 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-bold text-gray-900">{blk.name}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {blk.genderPolicy === 'boys' ? 'Boys Wing' : blk.genderPolicy === 'girls' ? 'Girls Wing' : 'Co-ed / Executive'}
                      {' • '}{blk.totalFloors} Floors
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    {blk.code}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-semibold text-gray-700">
                    <span>Occupancy</span>
                    <span>{occupiedInBlock}/{totalInBlock} Beds ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="bg-[#005B46] h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-500">
                  <span>Caretaker: {blk.caretakerName || 'Campus Staff'}</span>
                  {blk.caretakerPhone && (
                    <span className="font-mono text-gray-600">{blk.caretakerPhone}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Urgent Pending Requests and Recent Allocations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Priority Queue */}
        <div className="bg-white rounded-2xl border border-[#E0E6E2] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Top Priority Pending Requests</h3>
              <p className="text-[11px] text-gray-500">Sorted by distance & residency need</p>
            </div>
            <button
              onClick={() => navigate('/hostel-admin/requests')}
              className="text-xs font-semibold text-[#005B46] hover:underline cursor-pointer"
            >
              View All ({requests.filter(r => r.status === 'pending').length})
            </button>
          </div>

          <div className="space-y-2.5">
            {requests.filter(r => r.status === 'pending').slice(0, 4).map(req => (
              <div key={req.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-gray-900 flex items-center gap-2">
                    <span>{req.traineeName}</span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                      {req.priorityScore} Pts
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {req.programmeName} • From {req.district || 'Outstation'}, {req.state || 'India'}
                  </div>
                </div>
                <button
                  onClick={() => openAllocateModal(req)}
                  className="px-3 py-1.5 rounded-lg bg-[#005B46] hover:bg-[#004736] text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  Assign Bed
                </button>
              </div>
            ))}
            {requests.filter(r => r.status === 'pending').length === 0 && (
              <div className="py-8 text-center text-xs text-gray-400">
                No pending accommodation requests. All trainees housed!
              </div>
            )}
          </div>
        </div>

        {/* Today's Active Residents & Checkin Desk */}
        <div className="bg-white rounded-2xl border border-[#E0E6E2] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Recent Checked-In Residents</h3>
              <p className="text-[11px] text-gray-500">Real-time gate pass verifications</p>
            </div>
            <button
              onClick={() => navigate('/hostel-admin/allocations')}
              className="text-xs font-semibold text-[#005B46] hover:underline cursor-pointer"
            >
              View Directory
            </button>
          </div>

          <div className="space-y-2.5">
            {allocations.filter(a => a.status === 'checked_in').slice(0, 4).map(alloc => (
              <div key={alloc.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-gray-900 flex items-center gap-2">
                    <span>{alloc.traineeName}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                      Room {alloc.roomNumber} (Bed {alloc.bedNumber})
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {alloc.programmeName} • Key Issued
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                  In Residence
                </span>
              </div>
            ))}
            {allocations.filter(a => a.status === 'checked_in').length === 0 && (
              <div className="py-8 text-center text-xs text-gray-400">
                No trainees checked-in at this moment.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostelOperationsHub;
