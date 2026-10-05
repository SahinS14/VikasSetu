/**
 * src/views/HostelAdmin/HostelMessPage.tsx
 *
 * Mess & Analytics Page (Tab 8)
 * Daily meal headcount forecasts based on live verified campus residents and CSV audit export.
 */

import React from 'react';
import { Download, Utensils, Users, Clock } from 'lucide-react';
import { useHostel } from './HostelContext';

export const HostelMessPage: React.FC = () => {
  const { metrics, allocations } = useHostel();

  const handleExportCsv = () => {
    const csvHeader = 'Trainee Name,Pass Number,Block,Room,Bed,Status,CheckInDate,CheckOutDate\n';
    const csvRows = allocations.map(a =>
      `"${a.traineeName}","${a.passNumber || a.id || ''}","${a.blockName || ''}","${a.roomNumber || ''}","${a.bedNumber || ''}","${a.status}","${a.checkInDate || ''}","${a.checkOutDate || ''}"`
    ).join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Hostel_Occupancy_Audit_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const dinersCount = metrics?.checkedInCount ?? metrics?.todayCheckIns ?? 0;

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-[#E0E6E2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Mess Dining Audit & Occupancy Reporting</h2>
          <p className="text-xs text-gray-500">Daily meal headcount forecasts based on active verified campus residents</p>
        </div>
        <button
          onClick={handleExportCsv}
          className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center gap-2 cursor-pointer shadow-xs transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV Audit</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-[#E0E6E2] p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Breakfast Headcount</span>
            <span className="text-[10px] font-mono text-gray-400">07:30 - 09:00</span>
          </div>
          <div className="text-2xl font-extrabold text-[#005B46]">{dinersCount} Meals</div>
          <div className="text-[11px] text-gray-500">Based on checked-in resident trainees</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E0E6E2] p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Lunch Headcount</span>
            <span className="text-[10px] font-mono text-gray-400">12:30 - 14:00</span>
          </div>
          <div className="text-2xl font-extrabold text-[#005B46]">{dinersCount} Meals</div>
          <div className="text-[11px] text-gray-500">Vegetarian thali catering prepared</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E0E6E2] p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Dinner Headcount</span>
            <span className="text-[10px] font-mono text-gray-400">20:00 - 21:30</span>
          </div>
          <div className="text-2xl font-extrabold text-[#005B46]">{dinersCount} Meals</div>
          <div className="text-[11px] text-gray-500">Curfew strictly observed at 22:00 IST</div>
        </div>
      </div>

      {/* Mess Operations & Hygiene Telemetry */}
      <div className="bg-white rounded-2xl border border-[#E0E6E2] p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-gray-900">Residential Welfare & Dining Standards</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
            <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-amber-600" />
              <span>Mess Vendor</span>
            </div>
            <div className="text-sm font-bold text-gray-800">NCCT Campus Central Catering</div>
            <div className="text-[11px] text-gray-500">FSSAI Certified Unit</div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
            <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#005B46]" />
              <span>Total Accommodated</span>
            </div>
            <div className="text-sm font-bold text-gray-800">{metrics?.occupiedBeds || 0} Residents</div>
            <div className="text-[11px] text-gray-500">{metrics?.occupancyRate || 0}% Hostel Occupancy</div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
            <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Hostel Curfew</span>
            </div>
            <div className="text-sm font-bold text-gray-800">22:00 Hrs IST</div>
            <div className="text-[11px] text-gray-500">Gate electronic entry closure</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostelMessPage;
