import React from 'react';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Mail,
  Phone,
  Users,
  Layers,
  FileCheck,
  BedDouble,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  ShieldCheck,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../../components/layout/PageContainer';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';

export const InstituteDetailView: React.FC = () => {
  const { institutes, programmes, nominations, hostelBeds, activeViewParams, navigate } = useApp();

  // Find institute by ID from activeViewParams or fallback to VAMNICOM
  const targetId = activeViewParams?.instituteId || 'inst-vamnicom';
  const institute = institutes.find(i => i.id === targetId) || institutes[0];

  // Filter programmes for this institute (or fallback to seeded programmes for demo realism)
  const instituteProgrammes = programmes.filter(p => p.instituteId === institute.id);
  const displayProgrammes = instituteProgrammes.length > 0 ? instituteProgrammes : programmes.slice(0, 2);

  // Filter nominations for this institute's programmes
  const programmeIds = displayProgrammes.map(p => p.id);
  const instituteNominations = nominations.filter(n => programmeIds.includes(n.programmeId));
  const displayNominations = instituteNominations.length > 0 ? instituteNominations : nominations.slice(0, 5);

  // Calculate compact hostel occupancy
  const occupiedBeds = hostelBeds.filter(b => b.status === 'occupied').length || 5;
  const totalBeds = hostelBeds.length || 8;
  const vacantBeds = totalBeds - occupiedBeds;
  const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);

  return (
    <PageContainer>
      <div className="space-y-6 animate-fadeIn pb-16">
        {/* Breadcrumb & Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/super-admin/institutes')}
            className="inline-flex items-center gap-2 text-xs font-bold text-govTeal-800 hover:text-govTeal-900 bg-white hover:bg-gray-50 px-3.5 py-2 rounded-xl border border-govText-border shadow-2xs transition-colors cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-govTeal-700" />
            Back to 20 NCCT Institutes
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-govText-muted">
              National Autonomous Node ID: <strong className="font-mono text-govText-primary">{institute.id}</strong>
            </span>
            <div className="px-2.5 py-1 bg-purple-50 text-purple-900 border border-purple-200 text-xs font-bold rounded-lg flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              Super Admin Read-Only Oversight
            </div>
          </div>
        </div>

        {/* Prominent Institute Header Banner */}
        <div className="bg-white p-6 rounded-2xl border border-govText-border shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    institute.type === 'VAMNICOM'
                      ? 'bg-purple-100 text-purple-900 border border-purple-300'
                      : institute.type === 'RICM'
                      ? 'bg-blue-100 text-blue-900 border border-blue-300'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}
                >
                  {institute.type}
                </span>
                <SimulatedBadge text="Node Active • Central Cloud Sync" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-govText-primary tracking-tight">
                {institute.name}
              </h1>
              <p className="text-sm text-govText-secondary font-devanagari">
                {institute.nameHi}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-govBg px-4 py-2.5 rounded-xl border border-gray-200 text-right">
                <span className="text-[10px] text-govText-muted block font-semibold uppercase">
                  Current Enrolment
                </span>
                <span className="text-xl font-extrabold text-govTeal-800">
                  {institute.activeCount} <span className="text-xs font-medium text-govText-muted">/ {institute.capacity} Seats</span>
                </span>
              </div>
            </div>
          </div>

          {/* Details Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-100 text-xs">
            <div className="flex items-center gap-2 text-govText-secondary">
              <MapPin className="w-4 h-4 text-govTeal-600 flex-shrink-0" />
              <span>Campus: <strong className="text-govText-primary">{institute.city}, {institute.state}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-govText-secondary">
              <Users className="w-4 h-4 text-govTeal-600 flex-shrink-0" />
              <span>Director: <strong className="text-govText-primary">{institute.director}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-govText-secondary">
              <Mail className="w-4 h-4 text-govTeal-600 flex-shrink-0" />
              <span className="truncate">{institute.contactEmail}</span>
            </div>
            <div className="flex items-center gap-2 text-govText-secondary">
              <Phone className="w-4 h-4 text-govTeal-600 flex-shrink-0" />
              <span>{institute.contactPhone}</span>
            </div>
          </div>
        </div>

        {/* Middle Section: Programmes & Hostel Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Programmes (8 cols on lg) */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border border-govText-border shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-govText-primary flex items-center gap-2">
                  <Layers className="w-5 h-5 text-govTeal-700" />
                  Active & Scheduled Training Programmes
                </h3>
                <p className="text-xs text-govText-secondary mt-0.5">
                  Conducted on campus • Read-only administrative oversight
                </p>
              </div>
              <span className="text-xs font-bold text-govTeal-700 bg-govTeal-50 px-2.5 py-1 rounded-lg">
                {displayProgrammes.length} Active Batches
              </span>
            </div>

            <div className="space-y-3">
              {displayProgrammes.map(prog => (
                <div
                  key={prog.id}
                  className="p-4 rounded-xl border border-gray-200 bg-[#FBFDFB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase">
                        {prog.mode}
                      </span>
                      <span className="text-xs font-semibold text-govText-muted">
                        Batch ID: {prog.id}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-govText-primary">{prog.title}</h4>
                    <p className="text-xs text-govText-secondary">
                      {prog.description || 'Specialized NCCT curriculum for cooperative modernization and governance.'}
                    </p>
                  </div>

                  <div className="flex sm:flex-col sm:items-end justify-between sm:justify-center gap-1 text-xs border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                    <span className="text-govText-muted font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {prog.startDate} – {prog.endDate}
                    </span>
                    <span className="font-bold text-govTeal-800">
                      {prog.enrolledCount || 38} / {prog.capacity || 50} Enrolled
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compact Hostel Occupancy Summary (4 cols on lg) */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-govText-border shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-govText-primary flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-saffron-600" />
                Hostel Accommodation
              </h3>
              <p className="text-xs text-govText-secondary mt-0.5">
                Residential capacity & bed allocation summary
              </p>
            </div>

            <div className="bg-govBg p-4 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-govText-secondary font-medium">Occupancy Rate</span>
                <span className="text-sm font-extrabold text-govTeal-800">{occupancyRate}%</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-govTeal-600 h-full rounded-full"
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 text-xs">
                <div>
                  <span className="text-[10px] text-govText-muted block">Occupied Beds</span>
                  <span className="font-bold text-govText-primary">{occupiedBeds} Beds</span>
                </div>
                <div>
                  <span className="text-[10px] text-govText-muted block">Available Vacancies</span>
                  <span className="font-bold text-emerald-700">{vacantBeds} Beds</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <h4 className="font-bold text-govText-primary text-[11px] uppercase tracking-wider">
                Residential Blocks Status
              </h4>
              <div className="flex justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <span className="font-semibold text-gray-700">Block A (Senior Trainees)</span>
                <span className="font-bold text-emerald-800">85% Occupied</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <span className="font-semibold text-gray-700">Block B (Residential Trainees)</span>
                <span className="font-bold text-amber-800">50% Occupied</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Trainee Nominations Queue (Read-Only) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-govText-border shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-govText-primary flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-govTeal-700" />
                Institutional Nominations Queue (Read-Only)
              </h3>
              <p className="text-xs text-govText-secondary mt-0.5">
                Nominations submitted by primary cooperative societies for this institute. Approval rights reside with Institute Admin.
              </p>
            </div>
            <span className="text-xs font-semibold text-govText-muted">
              {displayNominations.length} Candidates Submitted
            </span>
          </div>

          {/* Desktop Table (>= 768px) */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left text-xs text-govText-primary">
              <thead className="bg-[#F8FAF8] border-b border-gray-200 text-[11px] font-bold text-govText-secondary uppercase">
                <tr>
                  <th className="p-3.5">Candidate Name</th>
                  <th className="p-3.5">Sponsoring Cooperative Society</th>
                  <th className="p-3.5">Nominated Programme</th>
                  <th className="p-3.5">Date Submitted</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayNominations.map(nom => (
                  <tr key={nom.id} className="hover:bg-gray-50/50">
                    <td className="p-3.5">
                      <div className="font-bold text-govText-primary">{nom.traineeName}</div>
                      <div className="text-[11px] text-govText-muted">{nom.traineeEmail}</div>
                    </td>
                    <td className="p-3.5 text-govText-secondary">
                      {nom.cooperativeName}
                    </td>
                    <td className="p-3.5 font-medium text-govTeal-800">
                      PACS Computerization & ERP Operations
                    </td>
                    <td className="p-3.5 text-govText-muted">
                      {nom.nominatedDate}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          nom.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : nom.status === 'rejected'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {nom.status === 'approved' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {nom.status === 'rejected' && <XCircle className="w-3 h-3 text-rose-600" />}
                        {nom.status === 'pending' && <Clock className="w-3 h-3 text-amber-600" />}
                        {nom.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (< 768px) */}
          <div className="block md:hidden divide-y divide-gray-100">
            {displayNominations.map(nom => (
              <div key={nom.id} className="py-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-govText-primary truncate">{nom.traineeName}</div>
                    <div className="text-[11px] text-govText-muted truncate">{nom.traineeEmail}</div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex-shrink-0 ${
                      nom.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : nom.status === 'rejected'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {nom.status === 'approved' && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />}
                    {nom.status === 'rejected' && <XCircle className="w-2.5 h-2.5 text-rose-600" />}
                    {nom.status === 'pending' && <Clock className="w-2.5 h-2.5 text-amber-600" />}
                    {nom.status}
                  </span>
                </div>
                <div className="text-[11px] text-govText-secondary">
                  <span className="text-[10px] text-govText-muted block">Sponsoring Society:</span>
                  <span className="font-medium">{nom.cooperativeName}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-govText-muted pt-1">
                  <span className="text-govTeal-800 font-semibold">PACS Computerization</span>
                  <span>{nom.nominatedDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
