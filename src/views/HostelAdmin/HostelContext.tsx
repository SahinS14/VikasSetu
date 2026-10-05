/**
 * src/views/HostelAdmin/HostelContext.tsx
 *
 * Central state and API provider for Hostel Management suite.
 * Provides real-time telemetry, live database entities, and transactional actions.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import {
  Hostel,
  HostelBlock,
  HostelRoom,
  HostelBedRecord,
  HostelRequest,
  HostelAllocation,
  HostelComplaint,
  HostelOccupancyMetrics
} from '../../types';

interface AvailableBedOption {
  bed: HostelBedRecord;
  room: HostelRoom;
  block?: HostelBlock;
}

interface HostelContextType {
  loading: boolean;
  refreshing: boolean;
  metrics: HostelOccupancyMetrics | null;
  hostelInfo: Hostel | null;
  blocks: HostelBlock[];
  rooms: HostelRoom[];
  requests: HostelRequest[];
  allocations: HostelAllocation[];
  complaints: HostelComplaint[];
  toastMsg: { type: 'success' | 'error'; text: string } | null;
  availableBeds: AvailableBedOption[];

  // Modals & Active Selections
  showAllocateModal: boolean;
  selectedRequestForAllocation: HostelRequest | null;
  selectedBedToAssign: string;
  allocationRemarks: string;
  isSubmittingAllocation: boolean;
  resolvingComplaint: HostelComplaint | null;
  resolutionNotes: string;

  // Setters
  setSelectedBedToAssign: (id: string) => void;
  setAllocationRemarks: (remarks: string) => void;
  setResolutionNotes: (notes: string) => void;

  // Operations
  fetchData: () => Promise<void>;
  showToast: (text: string, type?: 'success' | 'error') => void;
  openAllocateModal: (request: HostelRequest) => void;
  closeAllocateModal: () => void;
  openResolveComplaintModal: (complaint: HostelComplaint) => void;
  closeResolveComplaintModal: () => void;
  handleConfirmAllocation: () => Promise<void>;
  handleCheckIn: (allocationId: string, traineeName: string, method?: 'NFC' | 'Aadhaar' | 'PhysicalID') => Promise<void>;
  handleCheckOut: (allocationId: string, traineeName: string, bedNumber: string) => Promise<void>;
  handleResolveComplaint: () => Promise<void>;
  handleToggleBedStatus: (bedId: string, currentStatus: string) => Promise<void>;
}

const HostelContext = createContext<HostelContextType | undefined>(undefined);

export const HostelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useApp();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<HostelOccupancyMetrics | null>(null);
  const [hostelInfo, setHostelInfo] = useState<Hostel | null>(null);
  const [blocks, setBlocks] = useState<HostelBlock[]>([]);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [requests, setRequests] = useState<HostelRequest[]>([]);
  const [allocations, setAllocations] = useState<HostelAllocation[]>([]);
  const [complaints, setComplaints] = useState<HostelComplaint[]>([]);

  // Dialog / Modal States
  const [showAllocateModal, setShowAllocateModal] = useState<boolean>(false);
  const [selectedRequestForAllocation, setSelectedRequestForAllocation] = useState<HostelRequest | null>(null);
  const [selectedBedToAssign, setSelectedBedToAssign] = useState<string>('');
  const [allocationRemarks, setAllocationRemarks] = useState<string>('');
  const [isSubmittingAllocation, setIsSubmittingAllocation] = useState(false);

  // Complaint Resolution Modal
  const [resolvingComplaint, setResolvingComplaint] = useState<HostelComplaint | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Toast message
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [dashRes, blocksRes, roomsRes, reqsRes, allocsRes, compRes] = await Promise.all([
        api.hostel.getDashboard(),
        api.hostel.getBlocks(),
        api.hostel.getRooms(),
        api.hostel.getRequests(),
        api.hostel.getAllocations(),
        api.hostel.getComplaints(),
      ]);

      if (dashRes) {
        setMetrics(dashRes.metrics || dashRes);
        setHostelInfo(dashRes.hostel || {
          id: 'hostel-vamnicom-main',
          institutionId: 'inst-vamnicom',
          name: 'VAMNICOM Executive Training Hostel',
          address: 'University Road, Pune, Maharashtra 411007',
          status: 'active',
          totalCapacity: (dashRes.totalBeds || dashRes.metrics?.totalBeds || 9),
          contactPerson: 'Shri Rajesh Kulkarni',
          contactPhone: '+91 20 2570 1000'
        } as any);
      }
      if (Array.isArray(blocksRes)) setBlocks(blocksRes);
      if (Array.isArray(roomsRes)) setRooms(roomsRes);
      if (Array.isArray(reqsRes)) setRequests(reqsRes);
      if (Array.isArray(allocsRes)) setAllocations(allocsRes);
      if (Array.isArray(compRes)) setComplaints(compRes);
    } catch (err: any) {
      console.error('Error fetching hostel operations data:', err);
      showToast('Could not sync with hostel service: ' + (err.message || 'Check backend connection'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute available beds for allocation modal
  const availableBeds: AvailableBedOption[] = [];
  rooms.forEach(r => {
    const b = blocks.find(blk => blk.id === r.blockId);
    (r.beds || []).forEach(bd => {
      if (bd.status === 'available') {
        availableBeds.push({ bed: bd, room: r, block: b });
      }
    });
  });

  const openAllocateModal = (req: HostelRequest) => {
    setSelectedRequestForAllocation(req);
    setSelectedBedToAssign('');
    setAllocationRemarks('');
    setShowAllocateModal(true);
  };

  const closeAllocateModal = () => {
    setShowAllocateModal(false);
    setSelectedRequestForAllocation(null);
    setSelectedBedToAssign('');
    setAllocationRemarks('');
  };

  const openResolveComplaintModal = (comp: HostelComplaint) => {
    setResolvingComplaint(comp);
    setResolutionNotes('');
  };

  const closeResolveComplaintModal = () => {
    setResolvingComplaint(null);
    setResolutionNotes('');
  };

  // Handle Bed Allocation
  const handleConfirmAllocation = async () => {
    if (!selectedRequestForAllocation || !selectedBedToAssign) {
      showToast('Please select an available bed', 'error');
      return;
    }

    try {
      setIsSubmittingAllocation(true);
      await api.hostel.allocateBed({
        requestId: selectedRequestForAllocation.id,
        bedId: selectedBedToAssign,
        remarks: allocationRemarks || 'Bed assigned by Chief Warden'
      });
      showToast(`Bed successfully allocated to ${selectedRequestForAllocation.traineeName}! Digital pass issued.`);
      closeAllocateModal();
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to allocate bed', 'error');
    } finally {
      setIsSubmittingAllocation(false);
    }
  };

  // Handle Check-in
  const handleCheckIn = async (allocationId: string, traineeName: string, method: 'NFC' | 'Aadhaar' | 'PhysicalID' = 'NFC') => {
    try {
      await api.hostel.checkIn(allocationId, {
        verificationMethod: method,
        remarks: `Verified via ${method} by Warden ${currentUser?.name || 'Admin'}`
      });
      showToast(`Check-In confirmed for ${traineeName}. Keys issued.`);
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Check-in failed', 'error');
      throw err;
    }
  };

  // Handle Check-out
  const handleCheckOut = async (allocationId: string, traineeName: string, bedNumber: string) => {
    if (!window.confirm(`Confirm check-out for ${traineeName}? Bed ${bedNumber} will be released back to Available status.`)) {
      return;
    }

    try {
      await api.hostel.checkOut(allocationId, {
        remarks: `Room inspected and key returned. Cleared by Warden ${currentUser?.name || 'Admin'}`
      });
      showToast(`Check-Out completed for ${traineeName}. Bed is now available.`);
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Check-out failed', 'error');
    }
  };

  // Handle Complaint Resolution
  const handleResolveComplaint = async () => {
    if (!resolvingComplaint) return;
    try {
      await api.hostel.updateComplaint(resolvingComplaint.id, {
        status: 'resolved',
        resolutionNotes: resolutionNotes || 'Repaired and verified by Hostel Maintenance Staff'
      });
      showToast('Complaint resolved and marked closed.');
      closeResolveComplaintModal();
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to resolve complaint', 'error');
    }
  };

  // Quick Bed Status Toggle (e.g. from Available to Maintenance)
  const handleToggleBedStatus = async (bedId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'available' ? 'maintenance' : currentStatus === 'maintenance' ? 'available' : null;
    if (!nextStatus) {
      showToast('Occupied beds must be cleared via Checkout workflow', 'error');
      return;
    }

    try {
      await api.hostel.updateBedStatus(bedId, {
        status: nextStatus,
        remarks: `Manually set to ${nextStatus} by Warden`
      });
      showToast(`Bed status updated to ${nextStatus.toUpperCase()}`);
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update bed status', 'error');
    }
  };

  return (
    <HostelContext.Provider
      value={{
        loading,
        refreshing,
        metrics,
        hostelInfo,
        blocks,
        rooms,
        requests,
        allocations,
        complaints,
        toastMsg,
        availableBeds,
        showAllocateModal,
        selectedRequestForAllocation,
        selectedBedToAssign,
        allocationRemarks,
        isSubmittingAllocation,
        resolvingComplaint,
        resolutionNotes,
        setSelectedBedToAssign,
        setAllocationRemarks,
        setResolutionNotes,
        fetchData,
        showToast,
        openAllocateModal,
        closeAllocateModal,
        openResolveComplaintModal,
        closeResolveComplaintModal,
        handleConfirmAllocation,
        handleCheckIn,
        handleCheckOut,
        handleResolveComplaint,
        handleToggleBedStatus,
      }}
    >
      {children}
    </HostelContext.Provider>
  );
};

export const useHostel = () => {
  const context = useContext(HostelContext);
  if (!context) {
    throw new Error('useHostel must be used within a HostelProvider');
  }
  return context;
};
