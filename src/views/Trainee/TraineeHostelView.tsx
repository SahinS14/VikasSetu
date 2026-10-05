/**
 * src/views/Trainee/TraineeHostelView.tsx
 *
 * Trainee Portal: Hostel Accommodation, Digital Gate Pass & Welfare Desk
 * Features:
 *  1. Active Digital Hostel Pass with QR Code & NFC identity
 *  2. Priority Request Submission for residential training
 *  3. In-residence Room & Bed details with mess schedule
 *  4. Direct Maintenance Ticket / Complaint Lodging
 */

import React, { useState, useEffect } from 'react';
import {
  BedDouble,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Send,
  Phone,
  Utensils,
  HelpCircle,
  Download,
  Info,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { api } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../../components/layout/PageContainer';
import { HostelAllocation, HostelRequest, HostelComplaint } from '../../types';

export const TraineeHostelView: React.FC = () => {
  const { currentUser, programmes } = useApp();

  const [loading, setLoading] = useState(true);
  const [allocation, setAllocation] = useState<HostelAllocation | null>(null);
  const [request, setRequest] = useState<HostelRequest | null>(null);
  const [complaints, setComplaints] = useState<HostelComplaint[]>([]);

  // Application Form State
  const [programmeId, setProgrammeId] = useState(programmes[0]?.id || '');
  const [checkInDate, setCheckInDate] = useState('2026-09-20');
  const [checkOutDate, setCheckOutDate] = useState('2026-09-27');
  const [isOutstation, setIsOutstation] = useState(true);
  const [stateName, setStateName] = useState('Maharashtra');
  const [districtName, setDistrictName] = useState('Nashik');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Complaint Form State
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintCategory, setComplaintCategory] = useState<'Electrical' | 'Water' | 'Cleaning' | 'Food' | 'Room' | 'Internet'>('Electrical');
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

  // Notification Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.hostel.getMyStatus();
      if (res) {
        setAllocation(res.allocation || null);
        setRequest(res.request || null);
        setComplaints(res.complaints || []);
      }
    } catch (err: any) {
      console.warn('Could not fetch trainee hostel status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Submit new accommodation request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const prog = programmes.find(p => p.id === programmeId);
      await api.hostel.submitRequest({
        programmeId,
        programmeName: prog?.title || 'Cooperative Training Programme',
        checkInDate,
        checkOutDate,
        isOutstation,
        state: stateName,
        district: districtName,
        specialRequests
      });
      showToast('Hostel accommodation request submitted! Priority score computed.');
      await fetchStatus();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit complaint
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintTitle.trim() || !complaintDescription.trim()) {
      showToast('Please provide a title and description', 'error');
      return;
    }

    try {
      setIsSubmittingComplaint(true);
      await api.hostel.submitComplaint({
        category: complaintCategory,
        title: complaintTitle,
        description: complaintDescription,
        roomNumber: allocation?.roomNumber || undefined
      });
      showToast('Ticket submitted to Hostel Warden desk.');
      setShowComplaintForm(false);
      setComplaintTitle('');
      setComplaintDescription('');
      await fetchStatus();
    } catch (err: any) {
      showToast(err.message || 'Failed to lodge ticket', 'error');
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4 bg-white rounded-3xl border border-govText-border/60 p-10 shadow-sm text-center">
          <RefreshCw className="w-10 h-10 text-govTeal-600 animate-spin" />
          <div>
            <h3 className="text-base font-bold text-govText-primary">
              Loading your hostel accommodation record...
            </h3>
            <p className="text-xs text-govText-secondary mt-1">
              Synchronizing digital pass & residential records
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="animate-fadeIn pb-16">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border text-sm font-semibold transition-all ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {toast.type === 'error' ? <AlertTriangle className="w-5 h-5 text-rose-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header Banner — Matched with Trainee Dashboard Hero style */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-govTeal-700 via-govTeal-800 to-govTeal-900 text-white p-5 sm:p-7 shadow-md border border-govTeal-600/50">
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 bg-white/15 backdrop-blur-md rounded-md text-[11px] font-bold text-saffron-300">
              Campus Residential Welfare
            </span>
            {allocation?.passNumber && (
              <span className="px-2.5 py-0.5 bg-white/10 rounded-md text-[10px] font-semibold text-emerald-300 font-mono">
                Gate Pass: {allocation.passNumber}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 rounded-md text-[10px] font-bold">
              <ShieldCheck className="w-3 h-3" />
              Verified Resident
            </span>
          </div>

          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              Hostel Accommodation & Digital Pass
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 font-medium max-w-2xl leading-relaxed mt-1">
              Government-provided residential facilities for cooperative trainees and delegates at NCCT Institutes.
            </p>
          </div>
        </div>
      </div>

      {/* VIEW A: IF TRAINEE HAS AN ACTIVE ALLOCATION (DIGITAL PASS ISSUED) */}
      {allocation && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Digital Hostel Pass Card */}
          <div className="lg:col-span-1 bg-white rounded-3xl border-2 border-emerald-600 p-5 sm:p-6 shadow-sm relative overflow-hidden space-y-5">
            <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-emerald-500/10 pointer-events-none" />

            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                  Government of India • NCCT
                </span>
                <h3 className="text-base font-extrabold text-gray-900">Digital Hostel Gate Pass</h3>
              </div>
              <ShieldCheck className="w-6 h-6 text-[#005B46]" />
            </div>

            {/* Trainee Identity & QR */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-700 to-[#073D32] flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                {currentUser.name.charAt(0)}
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-extrabold text-gray-900">{allocation.traineeName}</div>
                <div className="text-xs text-gray-500 font-mono">{allocation.passNumber}</div>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800">
                  {allocation.status === 'checked_in' ? '✓ In Residence' : 'Approved & Allocated'}
                </span>
              </div>
            </div>

            {/* Room & Bed Highlight Box */}
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-800 font-semibold">Assigned Wing:</span>
                <span className="font-extrabold text-gray-900">{allocation.blockName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-800 font-semibold">Room Number:</span>
                <span className="font-extrabold text-gray-900 text-sm">Room {allocation.roomNumber}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-800 font-semibold">Bed Number:</span>
                <span className="font-extrabold text-emerald-900 text-sm">Bed {allocation.bedNumber}</span>
              </div>
            </div>

            {/* Pass Validity Dates */}
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Check-In Authorized:</span>
                <span className="font-bold text-gray-900">{allocation.checkInDate || allocation.allocatedFrom || 'Active Session'}</span>
              </div>
              <div className="flex justify-between">
                <span>Expected Checkout:</span>
                <span className="font-bold text-gray-900">{allocation.checkOutDate || allocation.allocatedTo || 'Term End'}</span>
              </div>
            </div>

            {/* QR Mock identity code */}
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
              <div className="text-[11px] text-gray-500">
                <div className="font-bold text-gray-800">NFC & QR Gate Verification</div>
                <div>Present this pass at Main Gate 1</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-300 flex items-center justify-center text-gray-800">
                <QrCode className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Details & Resident Services */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mess Schedule & Gate Timings */}
            <div className="bg-white rounded-3xl border border-[#E0E6E2] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-amber-600" />
                  <span>Campus Mess & Dining Timings</span>
                </h3>
                <span className="text-xs text-gray-500 font-semibold">Catering Included</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs">
                  <div className="font-extrabold text-amber-900">Breakfast</div>
                  <div className="text-amber-800 font-mono mt-0.5">07:30 - 09:00 IST</div>
                  <div className="text-[10px] text-gray-500 mt-1">Dining Hall Block A</div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 text-xs">
                  <div className="font-extrabold text-emerald-900">Lunch</div>
                  <div className="text-emerald-800 font-mono mt-0.5">12:30 - 14:00 IST</div>
                  <div className="text-[10px] text-gray-500 mt-1">Full Vegetarian Thali</div>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-200/70 text-xs">
                  <div className="font-extrabold text-blue-900">Dinner</div>
                  <div className="text-blue-800 font-mono mt-0.5">20:00 - 21:30 IST</div>
                  <div className="text-[10px] text-gray-500 mt-1">Campus Curfew 22:00 IST</div>
                </div>
              </div>
            </div>

            {/* Room Maintenance & Complaint Lodging */}
            <div className="bg-white rounded-3xl border border-[#E0E6E2] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Room Maintenance & Helpdesk</h3>
                  <p className="text-xs text-gray-500">Report plumbing, electrical, hygiene or furniture repairs</p>
                </div>
                <button
                  onClick={() => setShowComplaintForm(!showComplaintForm)}
                  className="px-3 py-1.5 rounded-xl bg-[#005B46] hover:bg-[#004736] text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  {showComplaintForm ? 'Close Form' : '+ New Ticket'}
                </button>
              </div>

              {showComplaintForm && (
                <form onSubmit={handleSubmitComplaint} className="p-4 rounded-2xl border border-gray-200 bg-gray-50 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Issue Category</label>
                      <select
                        value={complaintCategory}
                        onChange={e => setComplaintCategory(e.target.value as any)}
                        className="w-full h-9 px-3 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none"
                      >
                        <option value="Electrical">Electrical (Lights, Fan, Switch)</option>
                        <option value="Water">Water / Plumbing (Geyser, Tap)</option>
                        <option value="Cleaning">Cleaning / Housekeeping</option>
                        <option value="Room">Room Furniture / Bedding</option>
                        <option value="Food">Food / Mess Quality</option>
                        <option value="Internet">Internet / Wi-Fi</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Short Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Geyser water not heating"
                        value={complaintTitle}
                        onChange={e => setComplaintTitle(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Describe the issue so the maintenance team can attend..."
                      value={complaintDescription}
                      onChange={e => setComplaintDescription(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingComplaint}
                      className="px-4 py-2 rounded-xl bg-[#005B46] hover:bg-[#004736] text-white text-xs font-bold disabled:opacity-50 cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingComplaint ? 'Submitting...' : 'Lodge Ticket to Warden'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Existing Complaints list */}
              <div className="space-y-2">
                {complaints.map(comp => (
                  <div key={comp.id} className="p-3 rounded-2xl border border-gray-200 bg-gray-50/70 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-gray-900 flex items-center gap-2">
                        <span>{comp.title}</span>
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-gray-200 text-gray-700">
                          {comp.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{comp.description}</div>
                      {comp.resolutionNotes && (
                        <div className="text-[11px] text-emerald-800 font-semibold mt-1">
                          ✓ Resolution: {comp.resolutionNotes}
                        </div>
                      )}
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        comp.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {comp.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: IF REQUEST IS PENDING (AWAITING WARDEN ALLOCATION) */}
      {!allocation && request && (
        <div className="bg-white rounded-3xl border border-amber-200 p-6 sm:p-8 shadow-sm space-y-4 max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-2">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Accommodation Request In Review</h2>
          <p className="text-xs text-gray-600">
            Your hostel request has been received by the Chief Warden. The algorithm calculated your priority score based on your outstation residency.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs space-y-2 text-amber-900">
            <div className="flex justify-between font-bold">
              <span>Programme: {request.programmeName}</span>
              <span className="font-extrabold text-amber-950">{request.priorityScore} Priority Points</span>
            </div>
            <div>Stay Duration: {request.checkInDate} to {request.checkOutDate}</div>
            <div>Origin: {request.district ? `${request.district}, ` : ''}{request.state}</div>
            <div className="pt-2 border-t border-amber-200/60 text-[11px]">
              Status: <span className="font-bold uppercase tracking-wider">{request.status}</span> — As soon as the Warden assigns your room, your Digital Pass will appear here.
            </div>
          </div>
        </div>
      )}

      {/* VIEW C: IF NOT ALLOCATED / NOT RESIDENT */}
      {!allocation && !request && (
        <div className="bg-white rounded-3xl border border-[#E0E6E2] p-8 shadow-sm max-w-lg mx-auto text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#005B46] mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Hostel Resident Privilege Only</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Digital gate pass issuance, room & bed records, and welfare desk services are exclusively accessible to registered in-residence trainees who have completed gate check-in.
          </p>
        </div>
      )}
    </PageContainer>
  );
};

export default TraineeHostelView;
