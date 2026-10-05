/**
 * src/views/InstituteAdmin/AttendanceKiosk.tsx (Classroom Attendance Devices & RFID Management)
 *
 * Institute Admin view for:
 *  1. Monitoring Physical Classroom Attendance Devices (Raspberry Pi / ESP32-CAM Kiosks)
 *  2. Real-time Heartbeat & Online/Offline Status from PostgreSQL
 *  3. Registering new classroom devices
 *  4. Assigning Contactless RFID / NFC smart cards to registered trainees
 */

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Radio,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  CreditCard,
  UserCheck,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  X,
  Search,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { PageContainer } from '../../components/layout/PageContainer';

export const AttendanceKiosk: React.FC = () => {
  const { currentUser } = useApp();

  const [devices, setDevices] = useState<any[]>([]);
  const [trainees, setTrainees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // New device modal state
  const [isNewDeviceModalOpen, setIsNewDeviceModalOpen] = useState<boolean>(false);
  const [newDeviceCode, setNewDeviceCode] = useState<string>('');
  const [newDeviceRoom, setNewDeviceRoom] = useState<string>('');
  const [newDeviceName, setNewDeviceName] = useState<string>('');
  const [isRegisteringDevice, setIsRegisteringDevice] = useState<boolean>(false);

  // RFID Assignment state
  const [selectedTraineeId, setSelectedTraineeId] = useState<string>('');
  const [rfidInput, setRfidInput] = useState<string>('');
  const [isAssigningRfid, setIsAssigningRfid] = useState<boolean>(false);
  const [traineeSearchQuery, setTraineeSearchQuery] = useState<string>('');

  const loadAll = async () => {
    setIsRefreshing(true);
    setErrorNotice(null);
    try {
      const [devicesData, traineesRes] = await Promise.all([
        api.attendance.getDevices().catch(() => []),
        api.institute.getTrainees({ limit: 100 }).catch(() => ({ data: [] })),
      ]);

      const traineesList = traineesRes?.data || [];
      setDevices(devicesData || []);
      setTrainees(traineesList);

      if (traineesList && traineesList.length > 0 && !selectedTraineeId) {
        setSelectedTraineeId(traineesList[0].id);
      }
    } catch (err: any) {
      console.error('[AttendanceDevices] Load error:', err);
      setErrorNotice(err.message || 'Failed to load devices and trainees.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAll();
    // Auto-refresh heartbeat every 15 seconds
    const interval = setInterval(loadAll, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceCode.trim() || !newDeviceRoom.trim() || !newDeviceName.trim()) return;

    setIsRegisteringDevice(true);
    setErrorNotice(null);
    try {
      await api.attendance.registerDevice({
        deviceCode: newDeviceCode.trim().toUpperCase(),
        classroomId: newDeviceRoom.trim(),
        name: newDeviceName.trim(),
      });
      setSuccessNotice(`Device "${newDeviceCode}" successfully registered to Classroom ${newDeviceRoom}!`);
      setIsNewDeviceModalOpen(false);
      setNewDeviceCode('');
      setNewDeviceRoom('');
      setNewDeviceName('');
      loadAll();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to register device.');
    } finally {
      setIsRegisteringDevice(false);
    }
  };

  const handleAssignRfid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTraineeId || !rfidInput.trim()) return;

    setIsAssigningRfid(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    try {
      const res = await api.attendance.assignRfid(selectedTraineeId, rfidInput.trim());
      setSuccessNotice(`RFID UID "${rfidInput.trim()}" assigned to ${res.trainee.name} successfully!`);
      setRfidInput('');
      loadAll();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to assign RFID card.');
    } finally {
      setIsAssigningRfid(false);
    }
  };

  const filteredTrainees = trainees.filter(t =>
    t.name?.toLowerCase().includes(traineeSearchQuery.toLowerCase()) ||
    t.email?.toLowerCase().includes(traineeSearchQuery.toLowerCase()) ||
    t.rfidUid?.toLowerCase().includes(traineeSearchQuery.toLowerCase())
  );

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Cpu className="w-6 h-6 text-indigo-700" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Classroom Attendance Devices & RFID
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage physical edge attendance devices, live heartbeats, and trainee RFID card mapping
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsNewDeviceModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-govTeal-600 hover:bg-govTeal-700 text-white shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Register Device
            </button>
            <button
              onClick={loadAll}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
              title="Refresh Devices"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-govTeal-600' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Notices */}
        {errorNotice && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button onClick={() => setErrorNotice(null)} className="text-xs font-semibold text-rose-600 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {successNotice && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button onClick={() => setSuccessNotice(null)} className="text-xs font-semibold text-emerald-600 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Devices Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Registered Kiosks
            </div>
            <div className="mt-2 text-3xl font-extrabold text-gray-900">
              {devices.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Classroom attendance nodes</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Online Devices
            </div>
            <div className="mt-2 text-3xl font-extrabold text-emerald-700">
              {devices.filter(d => d.status === 'ONLINE').length}
            </div>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Heartbeat active (&lt;90s)
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
              RFID Cards Assigned
            </div>
            <div className="mt-2 text-3xl font-extrabold text-indigo-700">
              {trainees.filter(t => t.rfidUid).length} / {trainees.length}
            </div>
            <p className="text-xs text-indigo-600 mt-1 font-medium">
              Trainees equipped with smart card
            </p>
          </div>
        </div>

        {/* Section 1: Registered Classroom Devices Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-gray-900 text-base">Classroom Edge Devices</h2>
            </div>
            <span className="text-xs text-gray-400">Auto-refresh every 15s</span>
          </div>

          {devices.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Cpu className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-medium text-gray-600">No attendance devices registered yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Click "Register Device" above to register classroom Raspberry Pi / PC kiosks.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5">Device Code</th>
                    <th className="px-6 py-3.5">Device Name</th>
                    <th className="px-6 py-3.5">Classroom</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Last Seen / Heartbeat</th>
                    <th className="px-6 py-3.5">Institute</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {devices.map(dev => (
                    <tr key={dev.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-gray-900">
                        {dev.deviceCode}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {dev.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 font-semibold text-xs border border-teal-100">
                          {dev.classroomId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {dev.status === 'ONLINE' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                            ONLINE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                            OFFLINE
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-500">
                        {new Date(dev.lastSeenAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true,
                        })}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {dev.instituteId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 2: RFID Card Assignment Station */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-5 h-5 text-govTeal-600" />
              <div>
                <h2 className="font-bold text-gray-900 text-base">
                  RFID / NFC Smart Card Assignment Station
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Link a physical contactless RFID smart card to an enrolled trainee
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAssignRfid} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Select Trainee
              </label>
              <select
                value={selectedTraineeId}
                onChange={e => setSelectedTraineeId(e.target.value)}
                className="w-full text-sm rounded-xl border border-gray-200 p-2.5 bg-gray-50 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-govTeal-500"
              >
                {trainees.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.email}) {t.rfidUid ? `— [Assigned: ${t.rfidUid}]` : '— [No Card]'}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-5">
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Tap or Enter RFID UID
              </label>
              <input
                type="text"
                value={rfidInput}
                onChange={e => setRfidInput(e.target.value)}
                placeholder="e.g. RFID-RAMESHWAR-01 or 04:A7:2B:9F"
                className="w-full text-sm font-mono rounded-xl border border-gray-200 p-2.5 bg-gray-50 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-govTeal-500"
              />
            </div>

            <div className="md:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={isAssigningRfid || !selectedTraineeId || !rfidInput.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold text-sm shadow-sm transition-all disabled:opacity-50"
              >
                {isAssigningRfid ? 'Assigning...' : 'Assign Card'}
              </button>
            </div>
          </form>

          {/* Searchable Trainee Roster Table */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-sm">Trainee RFID Registry</h3>
              <div className="relative w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={traineeSearchQuery}
                  onChange={e => setTraineeSearchQuery(e.target.value)}
                  placeholder="Search trainees..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-govTeal-500"
                />
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 font-semibold text-gray-500 uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5">Email</th>
                    <th className="px-4 py-2.5">RFID UID</th>
                    <th className="px-4 py-2.5">Face Biometric</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTrainees.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{t.name}</td>
                      <td className="px-4 py-2.5 text-gray-500">{t.email}</td>
                      <td className="px-4 py-2.5 font-mono">
                        {t.rfidUid ? (
                          <span className="text-emerald-700 font-bold">{t.rfidUid}</span>
                        ) : (
                          <span className="text-gray-400 italic">Not assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {t.faceEnrolled ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                          </span>
                        ) : (
                          <span className="text-gray-400">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ─── Modal: Register New Classroom Device ─────────────────────────── */}
        {isNewDeviceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-govTeal-600" />
                  <h3 className="font-bold text-gray-900 text-lg">Register Classroom Device</h3>
                </div>
                <button
                  onClick={() => setIsNewDeviceModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRegisterDevice} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    Device Code (Hardware ID)
                  </label>
                  <input
                    type="text"
                    required
                    value={newDeviceCode}
                    onChange={e => setNewDeviceCode(e.target.value)}
                    placeholder="e.g. CLASS-A101-01"
                    className="w-full text-sm font-mono rounded-xl border border-gray-200 p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-govTeal-500 font-medium uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    Classroom / Room Identifier
                  </label>
                  <input
                    type="text"
                    required
                    value={newDeviceRoom}
                    onChange={e => setNewDeviceRoom(e.target.value)}
                    placeholder="e.g. A101 or Computer Lab 1"
                    className="w-full text-sm rounded-xl border border-gray-200 p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-govTeal-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    Device Name / Label
                  </label>
                  <input
                    type="text"
                    required
                    value={newDeviceName}
                    onChange={e => setNewDeviceName(e.target.value)}
                    placeholder="e.g. Classroom A101 Attendance Kiosk"
                    className="w-full text-sm rounded-xl border border-gray-200 p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-govTeal-500 font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsNewDeviceModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRegisteringDevice}
                    className="px-5 py-2 text-sm font-semibold rounded-xl bg-govTeal-600 hover:bg-govTeal-700 text-white shadow-sm disabled:opacity-50"
                  >
                    {isRegisteringDevice ? 'Registering...' : 'Save & Register'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};
