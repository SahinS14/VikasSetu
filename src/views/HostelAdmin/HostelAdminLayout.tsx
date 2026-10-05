/**
 * src/views/HostelAdmin/HostelAdminLayout.tsx
 *
 * Persistent Hostel Admin Layout with:
 * - Campus Infrastructure Header & Live Telemetry Ribbon
 * - Interactive Horizontal Tab Navigation bar with real URL routing (navigate)
 * - Synchronized Active Tab indicator matching the current URL pathname
 * - Integrated Modals (Allocate Bed, Resolve Complaint)
 */

import React from 'react';
import {
  Building2,
  ShieldCheck,
  QrCode,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../../components/layout/PageContainer';
import { useHostel } from './HostelContext';

interface HostelAdminLayoutProps {
  children: React.ReactNode;
}

export const HostelAdminLayout: React.FC<HostelAdminLayoutProps> = ({ children }) => {
  const { navigate } = useApp();
  const {
    metrics,
    hostelInfo,
    refreshing,
    fetchData,
    toastMsg,
    showAllocateModal,
    selectedRequestForAllocation,
    selectedBedToAssign,
    setSelectedBedToAssign,
    allocationRemarks,
    setAllocationRemarks,
    isSubmittingAllocation,
    closeAllocateModal,
    handleConfirmAllocation,
    availableBeds,
    resolvingComplaint,
    resolutionNotes,
    setResolutionNotes,
    closeResolveComplaintModal,
    handleResolveComplaint,
  } = useHostel();

  return (
    <PageContainer className="animate-fadeIn pb-16 select-none">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border text-sm font-semibold transition-all ${
            toastMsg.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {toastMsg.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#073D32] via-[#005B46] to-[#0A4D3C] text-white p-5 sm:p-7 shadow-md border border-emerald-600/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-end pr-8">
          <Building2 className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>NCCT Residential Welfare & Campus Administration</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              {hostelInfo?.name || 'VAMNICOM Executive Training Hostel'}
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl font-light">
              Autonomous hostel management suite for cooperative trainees, residential participants, and outstation delegates. Fully audited live bed allocation, NFC pass check-in desk, and student welfare maintenance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Live Refresh'}</span>
            </button>
            <button
              onClick={() => navigate('/hostel-admin/gate')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs shadow flex items-center gap-2 transition-all cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Gate Check-In Desk</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Ribbon */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-emerald-600/40">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-xs text-emerald-200 font-medium">Total Beds</div>
              <div className="text-xl font-bold text-white mt-0.5">{metrics.totalBeds}</div>
              <div className="text-[10px] text-emerald-300 mt-1 font-mono">{metrics.totalRooms} Rooms</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-xs text-emerald-200 font-medium">Occupied</div>
              <div className="text-xl font-bold text-emerald-300 mt-0.5">{metrics.occupiedBeds}</div>
              <div className="text-[10px] text-emerald-200 mt-1 font-semibold">{metrics.occupancyRate}% Occupancy</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-xs text-emerald-200 font-medium">Available Now</div>
              <div className="text-xl font-bold text-amber-300 mt-0.5">{metrics.availableBeds}</div>
              <div className="text-[10px] text-emerald-200 mt-1">Ready for check-in</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-xs text-emerald-200 font-medium">Pending Requests</div>
              <div className="text-xl font-bold text-rose-300 mt-0.5">{metrics.pendingRequests}</div>
              <div className="text-[10px] text-rose-200 mt-1 font-semibold">Weighted queue</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-xs text-emerald-200 font-medium">Checked In</div>
              <div className="text-xl font-bold text-white mt-0.5">{metrics.checkedInCount ?? metrics.todayCheckIns}</div>
              <div className="text-[10px] text-emerald-200 mt-1">Residents on campus</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-xs text-emerald-200 font-medium">Active Complaints</div>
              <div className="text-xl font-bold text-amber-400 mt-0.5">{metrics.activeComplaints ?? metrics.openComplaints}</div>
              <div className="text-[10px] text-emerald-200 mt-1">Welfare & repair tickets</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Page Content (Route-specific component) */}
      <div className="w-full">
        {children}
      </div>

      {/* MODAL: ALLOCATE BED */}
      {showAllocateModal && selectedRequestForAllocation && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5 animate-scaleUp">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Assign Hostel Bed</h3>
                <p className="text-xs text-gray-500">For {selectedRequestForAllocation.traineeName}</p>
              </div>
              <button
                onClick={closeAllocateModal}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs space-y-1 text-emerald-900">
              <div className="font-bold flex items-center justify-between">
                <span>Programme: {selectedRequestForAllocation.programmeName}</span>
                <span className="font-extrabold">{selectedRequestForAllocation.priorityScore} Pts</span>
              </div>
              <div>Duration: {selectedRequestForAllocation.checkInDate} to {selectedRequestForAllocation.checkOutDate}</div>
              {selectedRequestForAllocation.specialRequests && (
                <div className="italic text-[11px] text-emerald-800">Note: {selectedRequestForAllocation.specialRequests}</div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase">Select Vacant Bed ({availableBeds.length} Available)</label>
              <select
                value={selectedBedToAssign}
                onChange={e => setSelectedBedToAssign(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#005B46]/20 bg-white"
              >
                <option value="">-- Choose Available Bed --</option>
                {availableBeds.map(({ bed, room, block }) => (
                  <option key={bed.id} value={bed.id}>
                    {block?.name} ({block?.code}) • Room {room.roomNumber} - Bed {bed.bedNumber} ({room.roomType})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase">Warden Allocation Remarks</label>
              <input
                type="text"
                value={allocationRemarks}
                onChange={e => setAllocationRemarks(e.target.value)}
                placeholder="e.g. Approved under outstation residential quota"
                className="w-full h-10 px-3 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#005B46]/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeAllocateModal}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAllocation}
                disabled={!selectedBedToAssign || isSubmittingAllocation}
                className="px-5 py-2 rounded-xl bg-[#005B46] hover:bg-[#004736] text-white text-xs font-bold shadow disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingAllocation ? 'Issuing Pass...' : 'Confirm Allocation & Issue Pass'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESOLVE COMPLAINT */}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-scaleUp">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Resolve Maintenance Ticket</h3>
                <p className="text-xs text-gray-500">{resolvingComplaint.title}</p>
              </div>
              <button
                onClick={closeResolveComplaintModal}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase">Resolution / Repair Notes</label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={e => setResolutionNotes(e.target.value)}
                placeholder="e.g. Replaced faulty fixture, tested water flow with campus plumber."
                className="w-full p-3 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#005B46]/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeResolveComplaintModal}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolveComplaint}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow cursor-pointer"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default HostelAdminLayout;
