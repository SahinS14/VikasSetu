/**
 * src/views/HostelAdmin/HostelRequestsPage.tsx
 *
 * Trainee Requests Page (Tab 4)
 * Real-time trainee accommodation requests queue with priority algorithm scoring.
 */

import React, { useState } from 'react';
import { Sparkles, Search } from 'lucide-react';
import { useHostel } from './HostelContext';

export const HostelRequestsPage: React.FC = () => {
  const { requests, openAllocateModal } = useHostel();

  const [requestFilterStatus, setRequestFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredRequests = requests.filter(rq => {
    if (requestFilterStatus !== 'all' && rq.status !== requestFilterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        rq.traineeName.toLowerCase().includes(q) ||
        rq.programmeName.toLowerCase().includes(q) ||
        rq.district?.toLowerCase().includes(q) ||
        rq.state?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-[#E0E6E2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Accommodation Requests & Priority Algorithm</h2>
          <p className="text-xs text-gray-500">
            Government standard weighting: Outstation (+40 pts), Residential Course (+25 pts), Nominated Officer (+15 pts)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search Trainee or District..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-3 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#005B46]/20"
            />
          </div>

          <select
            value={requestFilterStatus}
            onChange={e => setRequestFilterStatus(e.target.value)}
            className="h-9 px-3 rounded-xl border border-gray-300 text-xs font-semibold bg-white focus:outline-none"
          >
            <option value="all">All Request Statuses ({requests.length})</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved (Awaiting Bed)</option>
            <option value="allocated">Allocated</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E0E6E2] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F7F9F8] border-b border-[#E0E6E2] text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Trainee & Origin</th>
                <th className="py-3.5 px-4">Programme</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Priority Score</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRequests.map(req => {
                const isPending = req.status === 'pending';
                const isApproved = req.status === 'approved';
                const isAllocated = req.status === 'allocated';

                return (
                  <tr key={req.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 text-xs">{req.traineeName}</div>
                      <div className="text-[11px] text-gray-500">
                        {req.district ? `${req.district}, ` : ''}{req.state || 'India'}
                        {req.isOutstation && <span className="ml-1 text-emerald-700 font-semibold">• Outstation</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-800">
                      {req.programmeName}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 font-mono text-[11px]">
                      {req.checkInDate} to {req.checkOutDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#005B46] font-extrabold text-[11px]">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>{req.priorityScore} Pts</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                          isAllocated
                            ? 'bg-emerald-100 text-emerald-800'
                            : isApproved
                            ? 'bg-blue-100 text-blue-800'
                            : isPending
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {(isPending || isApproved) && (
                        <button
                          onClick={() => openAllocateModal(req)}
                          className="px-3 py-1.5 rounded-lg bg-[#005B46] hover:bg-[#004736] text-white font-bold text-xs shadow-xs cursor-pointer transition-all"
                        >
                          Allocate Bed
                        </button>
                      )}
                      {isAllocated && (
                        <span className="text-[11px] text-gray-400 italic">Bed Assigned</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRequests.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-xs">
            No accommodation requests match this filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default HostelRequestsPage;
