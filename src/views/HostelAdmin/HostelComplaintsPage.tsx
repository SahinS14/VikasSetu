/**
 * src/views/HostelAdmin/HostelComplaintsPage.tsx
 *
 * Complaints & Maintenance Tickets Page (Tab 7)
 * Trainee welfare tickets (electrical, plumbing, hygiene) with resolution workflow.
 */

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useHostel } from './HostelContext';

export const HostelComplaintsPage: React.FC = () => {
  const { complaints, openResolveComplaintModal } = useHostel();

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-[#E0E6E2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Hostel Maintenance & Trainee Welfare Tickets</h2>
          <p className="text-xs text-gray-500">Direct lodging from trainees regarding electrical, water, mess & room issues</p>
        </div>
        <div className="text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
          {complaints.filter(c => c.status === 'open').length} Open Tickets
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {complaints.map(comp => {
          const isOpen = comp.status === 'open';

          return (
            <div key={comp.id} className="bg-white rounded-2xl border border-[#E0E6E2] p-5 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-gray-100 text-gray-700">
                    {comp.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      isOpen ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {comp.status}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-gray-900">{comp.title}</h4>
                <p className="text-xs text-gray-600 line-clamp-3">{comp.description}</p>
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                <div className="flex justify-between text-gray-500 text-[11px]">
                  <span>By: {comp.traineeName}</span>
                  <span>Room {comp.roomNumber || 'Campus'}</span>
                </div>
                {comp.resolutionNotes && (
                  <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    ✓ {comp.resolutionNotes}
                  </div>
                )}
                {isOpen && (
                  <button
                    onClick={() => openResolveComplaintModal(comp)}
                    className="w-full py-2 rounded-xl bg-[#005B46] hover:bg-[#004736] text-white text-xs font-bold cursor-pointer transition-all"
                  >
                    Resolve & Mark Complete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {complaints.length === 0 && (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <div className="text-sm font-bold text-gray-700">Zero open complaints!</div>
          <div className="text-xs text-gray-400 mt-1">Hostel facilities and room maintenance are fully up-to-date</div>
        </div>
      )}
    </div>
  );
};

export default HostelComplaintsPage;
