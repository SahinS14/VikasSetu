import React, { useState } from 'react';
import {
  BedDouble,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Building,
  Sparkles,
  MapPin
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { PageContainer } from '../../components/layout/PageContainer';

export const HostelTimetable: React.FC = () => {
  const { hostelBeds, updateHostelBed, timetable, currentUser, navigate } = useApp();
  const [selectedBlock, setSelectedBlock] = useState<string>('all');

  const blocks = ['all', 'Block A (Men)', 'Block B (Women)', 'Executive Guest Block'];

  const filteredBeds = hostelBeds.filter(
    b => selectedBlock === 'all' || b.block === selectedBlock
  );

  const toggleBedStatus = (bedId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'occupied' ? 'vacant' : 'occupied';
    updateHostelBed(bedId, {
      status: nextStatus as any,
      traineeName: nextStatus === 'vacant' ? undefined : 'Allocated Candidate',
    });
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <PageContainer>
      
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-govText-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-govTeal-700 uppercase tracking-wider">
              Residential Logistics ERP
            </span>
            <SimulatedBadge text="Campus Facility Operations" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-govText-primary mt-1 leading-snug">
            Hostel Bed Allocation & Rooms
          </h2>
          <p className="text-xs text-govText-secondary mt-1 leading-relaxed">
            Real-time room occupancy management and candidate room allocation.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-govBg p-1.5 rounded-xl border border-govTeal-100 w-full sm:w-auto">
          <button
            onClick={() => navigate('/institute-admin/hostel')}
            className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 bg-govTeal-600 text-white shadow min-h-[40px] cursor-pointer"
          >
            <BedDouble className="w-4 h-4" />
            <span>Hostel Accommodation</span>
          </button>
          <button
            onClick={() => navigate('/institute-admin/timetable')}
            className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 text-govText-secondary hover:text-govText-primary min-h-[40px] cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Weekly Timetable Grid</span>
          </button>
        </div>
      </div>

      {/* Hostel Room & Bed Allocation */}
      <div className="space-y-5 sm:space-y-6">
        
        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-govText-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-govText-secondary whitespace-nowrap">Filter by Block:</span>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto">
              {blocks.map(b => (
                <button
                  key={b}
                  onClick={() => setSelectedBlock(b)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] cursor-pointer ${
                    selectedBlock === b
                      ? 'bg-govTeal-600 text-white shadow-sm'
                      : 'bg-govBg hover:bg-gray-100 text-govText-secondary'
                  }`}
                >
                  {b === 'all' ? 'All Blocks' : b}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-semibold pt-1 sm:pt-0 self-end sm:self-auto">
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              {hostelBeds.filter(b => b.status === 'occupied').length} Occupied
            </span>
            <span className="text-govText-muted bg-gray-100 px-2.5 py-1 rounded">
              {hostelBeds.filter(b => b.status === 'vacant').length} Vacant
            </span>
          </div>
        </div>

        {/* Beds Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredBeds.map(bed => {
            const isOccupied = bed.status === 'occupied';

            return (
              <div
                key={bed.id}
                className={`bg-white rounded-2xl border-2 p-4 sm:p-5 space-y-3 transition-all shadow-sm hover:shadow-md ${
                  isOccupied ? 'border-govTeal-300' : 'border-gray-200 opacity-90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold font-mono text-govTeal-800 bg-govTeal-50 px-2 py-0.5 rounded border border-govTeal-200">
                    Room {bed.roomNumber} • {bed.bedNumber}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    isOccupied ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {bed.status}
                  </span>
                </div>

                <p className="text-xs font-semibold text-govText-secondary truncate">
                  {bed.block}
                </p>

                <div className="bg-govBg p-3 rounded-xl border border-gray-100 min-h-[48px] flex items-center gap-2">
                  <User className="w-4 h-4 text-govTeal-600 flex-shrink-0" />
                  <span className="text-xs font-bold text-govText-primary truncate">
                    {bed.traineeName || 'Vacant Bed'}
                  </span>
                </div>

                <button
                  onClick={() => toggleBedStatus(bed.id, bed.status)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors min-h-[44px] cursor-pointer flex items-center justify-center ${
                    isOccupied
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-govTeal-600 hover:bg-govTeal-700 text-white shadow'
                  }`}
                >
                  {isOccupied ? 'Vacate Bed' : 'Assign Candidate'}
                </button>
              </div>
            );
          })}
        </div>

      </div>

    </PageContainer>
  );
};
