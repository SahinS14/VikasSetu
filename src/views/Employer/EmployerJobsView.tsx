import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  Plus,
  Edit,
  CheckCircle2,
  Clock,
  MapPin,
  Building,
  Mail,
  Filter,
  Eye,
  AlertCircle,
  X,
  Send,
  Trash2,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SEED_USERS } from '../../data/seedData';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { PageContainer } from '../../components/layout/PageContainer';
import { GlobalModal } from '../../components/common/GlobalModal';
import { JobPosting, JobInterest, User } from '../../types';
import api from '../../lib/api';

interface EmployerJobsViewProps {
  initialOpenNewModal?: boolean;
}

export const EmployerJobsView: React.FC<EmployerJobsViewProps> = ({ initialOpenNewModal = false }) => {
  const { currentUser, jobs, jobInterests, createJobPosting, updateJobPosting, deleteJobPosting, updateJobInterestStatus } = useApp();

  // Mode: Postings vs Candidate Interests
  const [viewMode, setViewMode] = useState<'postings' | 'interests'>('postings');
  const [filterJobId, setFilterJobId] = useState<string>('all');

  // Modals state
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState<boolean>(initialOpenNewModal);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [closedJobIds, setClosedJobIds] = useState<Set<string>>(new Set());

  // Contact Trainee Modal state
  const [contactTrainee, setContactTrainee] = useState<{ name: string; email: string; coop: string; jobTitle: string } | null>(null);
  const [contactSent, setContactSent] = useState(false);

  // New Job Form State
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobLocation, setJobLocation] = useState('Anand / Ahmedabad, Gujarat');
  const [jobSalary, setJobSalary] = useState('₹3.5 - ₹4.8 Lakh / annum');
  const [jobSkills, setJobSkills] = useState('PACS ERP, Dairy Cold Chain, AMCS Calibration');
  const [jobType, setJobType] = useState<'Full-time' | 'Apprenticeship' | 'Contract'>('Full-time');
  const [jobOpenings, setJobOpenings] = useState<number>(10);

  const [liveCandidates, setLiveCandidates] = useState<any[]>([]);

  useEffect(() => {
    if (initialOpenNewModal) {
      setIsNewJobModalOpen(true);
    }

    api.jobs
      .recruiterCandidates()
      .then(candidates => {
        if (Array.isArray(candidates) && candidates.length > 0) {
          setLiveCandidates(candidates);
        }
      })
      .catch(console.warn);
  }, [initialOpenNewModal]);

  // Employer's postings (matched by employerId or GCMMF/Amul association)
  const employerJobs = jobs.filter(
    j => j.employerId === currentUser.id || j.employerId === 'usr-employer-amul' || j.employerName.includes('AMUL') || j.employerName.includes('GCMMF')
  );

  const employerJobIds = new Set(employerJobs.map(j => j.id));

  // Candidate interests scoped strictly to this employer's postings
  const employerInterests = jobInterests.filter(ji => employerJobIds.has(ji.jobPostingId));

  // Merge live server candidates with employerInterests
  const allCandidatesMap = new Map<string, any>();
  liveCandidates.forEach(c => allCandidatesMap.set(c.id, c));
  employerInterests.forEach(ei => {
    if (!allCandidatesMap.has(ei.id)) {
      allCandidatesMap.set(ei.id, {
        ...ei,
        matchScore: ei.matchScore ?? 80,
        eligibilityStatus: ei.eligibilityStatus ?? 'ELIGIBLE',
      });
    }
  });

  // Sort candidates: ELIGIBLE first, then matchScore descending
  const sortedCandidates = Array.from(allCandidatesMap.values()).sort((a: any, b: any) => {
    if (a.eligibilityStatus === 'ELIGIBLE' && b.eligibilityStatus !== 'ELIGIBLE') return -1;
    if (a.eligibilityStatus !== 'ELIGIBLE' && b.eligibilityStatus === 'ELIGIBLE') return 1;
    return (b.matchScore || 0) - (a.matchScore || 0);
  });

  // Filtered candidate interests if filter is applied
  const filteredInterests = filterJobId === 'all'
    ? sortedCandidates
    : sortedCandidates.filter(ji => ji.jobPostingId === filterJobId);

  const handleStatusChange = async (interestId: string, newStatus: string) => {
    updateJobInterestStatus(interestId, newStatus as any);
    setLiveCandidates(prev =>
      prev.map(c => (c.id === interestId ? { ...c, status: newStatus } : c))
    );
    try {
      await api.jobs.updateStatus(interestId, newStatus);
    } catch (e) {
      console.warn('Backend status update failed:', e);
    }
  };

  // Handle Create Job Submit
  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    createJobPosting({
      employerId: currentUser.id || 'usr-employer-amul',
      employerName: 'Gujarat Cooperative Milk Marketing Federation (GCMMF / AMUL)',
      employerLogo: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=80&auto=format&fit=crop&q=80',
      title: jobTitle.trim(),
      description: jobDescription.trim(),
      location: jobLocation.trim(),
      salaryRange: jobSalary.trim(),
      type: jobType,
      openingsCount: Number(jobOpenings),
      requiredSkills: jobSkills.split(',').map(s => s.trim()).filter(Boolean),
    });

    // Reset and close
    setJobTitle('');
    setJobDescription('');
    setIsNewJobModalOpen(false);
    setViewMode('postings');
  };

  // Handle Edit Job Submit
  const handleUpdateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    updateJobPosting(editingJob.id, {
      title: editingJob.title,
      description: editingJob.description,
      location: editingJob.location,
      salaryRange: editingJob.salaryRange,
      type: editingJob.type,
      openingsCount: Number(editingJob.openingsCount),
      requiredSkills: typeof editingJob.requiredSkills === 'string'
        ? (editingJob.requiredSkills as string).split(',').map(s => s.trim()).filter(Boolean)
        : editingJob.requiredSkills,
    });

    setEditingJob(null);
  };

  const toggleJobStatus = (jobId: string) => {
    setClosedJobIds(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  const handleOpenContact = (interest: JobInterest) => {
    const job = jobs.find(j => j.id === interest.jobPostingId);
    const traineeUser = SEED_USERS.find(u => u.id === interest.userId);
    setContactTrainee({
      name: interest.traineeName,
      email: interest.traineeEmail || 'trainee@ncct.coop.in',
      coop: traineeUser?.cooperativeAffiliation || 'Cooperative Society Trainee',
      jobTitle: job?.title || 'Open Opening',
    });
    setContactSent(false);
  };

  return (
    <PageContainer>
      <div className="space-y-6 animate-fadeIn pb-16">
        {/* Header Banner */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-govText-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-govTeal-700 uppercase tracking-wider">
                Recruitment Operations
              </span>
              <SimulatedBadge text="GCMMF / AMUL Job Manager" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-govText-primary mt-1">
              Job Postings & Candidate Pipeline
            </h1>
            <p className="text-xs text-govText-secondary mt-1">
              Publish vacancies, manage active postings, and review candidate expressions of interest.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewJobModalOpen(true)}
              className="px-4 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Opening</span>
            </button>
          </div>
        </div>

        {/* Section View Switcher (Postings vs Candidate Interests) */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-xs max-w-md">
            <button
              onClick={() => setViewMode('postings')}
              className={`py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'postings'
                  ? 'bg-govTeal-600 text-white shadow-xs'
                  : 'text-govText-secondary hover:text-govText-primary'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>My Job Openings ({employerJobs.length})</span>
            </button>

            <button
              onClick={() => setViewMode('interests')}
              className={`py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'interests'
                  ? 'bg-govTeal-600 text-white shadow-xs'
                  : 'text-govText-secondary hover:text-govText-primary'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Candidate Interests ({employerInterests.length})</span>
            </button>
          </div>

          {viewMode === 'interests' && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-govTeal-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-govText-secondary whitespace-nowrap">
                Filter by Opening:
              </span>
              <select
                value={filterJobId}
                onChange={(e) => setFilterJobId(e.target.value)}
                className="text-xs font-semibold px-3 py-2 rounded-lg border border-govText-border bg-white focus:outline-none focus:ring-2 focus:ring-govTeal-600"
              >
                <option value="all">All GCMMF Openings ({employerInterests.length})</option>
                {employerJobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* VIEW MODE 1: Job Postings List */}
        {viewMode === 'postings' && (
          <div className="space-y-4">
            {employerJobs.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-govText-border space-y-3">
                <Briefcase className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="text-sm font-bold text-govText-primary">No active job openings posted yet</h3>
                <p className="text-xs text-govText-secondary max-w-sm mx-auto">
                  Post openings for AMCS officers, PACS digital business associates, and cooperative accountants.
                </p>
                <button
                  onClick={() => setIsNewJobModalOpen(true)}
                  className="px-4 py-2 bg-saffron-500 hover:bg-saffron-600 text-white font-bold rounded-lg text-xs"
                >
                  Post First Opening
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employerJobs.map(job => {
                  const isClosed = closedJobIds.has(job.id);
                  const applicantsCount = jobInterests.filter(ji => ji.jobPostingId === job.id).length;

                  return (
                    <div
                      key={job.id}
                      className={`bg-white rounded-2xl border ${
                        isClosed ? 'border-gray-200 opacity-75 bg-gray-50/50' : 'border-govText-border hover:border-govTeal-300'
                      } shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4`}
                    >
                      <div className="space-y-3">
                        {/* Header & Badges */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-bold text-saffron-700 bg-saffron-50 border border-saffron-200 px-2 py-0.5 rounded inline-block">
                                {job.type} &bull; {job.openingsCount} Openings
                              </span>
                              {isClosed && (
                                <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded uppercase">
                                  Closed
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-base text-govText-primary leading-snug">
                              {job.title}
                            </h3>
                            <p className="text-xs font-semibold text-govTeal-700 flex items-center gap-1">
                              <Building className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{job.employerName}</span>
                            </p>
                          </div>

                          {job.employerLogo && (
                            <img
                              src={job.employerLogo}
                              alt={job.employerName}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                            />
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-govText-secondary line-clamp-3 leading-relaxed">
                          {job.description}
                        </p>

                        {/* Skills tags */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {job.requiredSkills.map((sk, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-[10px] font-medium bg-govBg text-govText-secondary px-2 py-0.5 rounded-md border border-gray-200"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>

                        {/* Location & Salary */}
                        <div className="pt-2 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-govText-secondary">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-govTeal-600 flex-shrink-0" />
                            <span className="truncate">{job.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-semibold text-govText-primary">
                            <span className="text-govTeal-700 font-bold">{job.salaryRange}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Controls: Candidate Interest Count & Edit/Close Actions */}
                      <div className="pt-3 border-t border-gray-100 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <button
                            onClick={() => {
                              setFilterJobId(job.id);
                              setViewMode('interests');
                            }}
                            className="text-xs font-bold text-govTeal-800 bg-govTeal-50 hover:bg-govTeal-100 border border-govTeal-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5 text-govTeal-600" />
                            <span>{applicantsCount} Candidate {applicantsCount === 1 ? 'Interest' : 'Interests'}</span>
                          </button>

                          <span className="text-[11px] text-govText-muted">
                            Posted: {job.postedDate}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingJob(job)}
                            className="flex-1 py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-govText-primary text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => toggleJobStatus(job.id)}
                            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                              isClosed
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{isClosed ? 'Reopen' : 'Close'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW MODE 2: Candidate Interests Received */}
        {viewMode === 'interests' && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-govText-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-base text-govText-primary">
                  Trainee Expressions of Interest
                </h2>
                <p className="text-xs text-govText-secondary mt-0.5">
                  Trainees who reviewed your postings and submitted direct applications from their portal.
                </p>
              </div>

              <div className="text-xs font-bold text-govTeal-800 bg-govTeal-50 px-3 py-1.5 rounded-lg border border-govTeal-200">
                {filteredInterests.length} Applications
              </div>
            </div>

            {filteredInterests.length === 0 ? (
              <div className="py-12 text-center text-xs text-govText-muted space-y-2">
                <Users className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="font-bold text-sm text-govText-primary">No candidate interests for this filter</p>
                <p className="text-xs max-w-sm mx-auto">
                  When trainees express interest from the Job Opportunities portal, their applications will populate here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-govBg text-govText-secondary uppercase font-semibold border-b border-gray-200">
                      <th className="p-3.5">Candidate Name</th>
                      <th className="p-3.5">Applied Opening</th>
                      <th className="p-3.5">Match Score</th>
                      <th className="p-3.5">Eligibility</th>
                      <th className="p-3.5">Cooperative Affiliation</th>
                      <th className="p-3.5">Review Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredInterests.map(interest => {
                      const job = interest.job || jobs.find(j => j.id === interest.jobPostingId);
                      const traineeUser = interest.user || SEED_USERS.find(u => u.id === interest.userId);
                      const matchScore = interest.matchScore ?? 80;
                      const isEligible = (interest.eligibilityStatus || 'ELIGIBLE') === 'ELIGIBLE';

                      return (
                        <tr key={interest.id} className="hover:bg-govBg/50 transition-colors">
                          {/* Candidate Name & Avatar */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={traineeUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                                alt={interest.traineeName}
                                className="w-8 h-8 rounded-full object-cover border border-govTeal-600 flex-shrink-0"
                              />
                              <div>
                                <span className="font-bold text-govText-primary block">
                                  {interest.traineeName}
                                </span>
                                <span className="text-[11px] text-govText-muted">
                                  {interest.traineeEmail}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Applied Job */}
                          <td className="p-3.5">
                            <span className="font-bold text-govText-primary block">
                              {job?.title || interest.jobPostingId}
                            </span>
                            <span className="text-[10px] text-govText-muted">
                              {job?.location || 'Gujarat'}
                            </span>
                          </td>

                          {/* Match Score */}
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-lg border text-xs font-extrabold inline-flex items-center gap-1 ${
                                matchScore >= 80
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : matchScore >= 70
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              <span>{matchScore}%</span>
                            </span>
                          </td>

                          {/* Eligibility */}
                          <td className="p-3.5">
                            {isEligible ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px] inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Eligible</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-bold text-[11px] inline-flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                <span>Not Eligible</span>
                              </span>
                            )}
                          </td>

                          {/* Cooperative Affiliation */}
                          <td className="p-3.5">
                            <span className="text-xs font-semibold text-govTeal-800">
                              {traineeUser?.cooperativeAffiliation || 'Primary Agricultural Cooperative Society'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="p-3.5">
                            <select
                              value={(interest.status || 'APPLIED').toUpperCase()}
                              onChange={(e) => handleStatusChange(interest.id, e.target.value)}
                              className="text-xs font-bold uppercase rounded-lg border border-gray-200 px-2 py-1 bg-white focus:ring-1 focus:ring-govTeal-600 cursor-pointer"
                            >
                              <option value="APPLIED">Applied</option>
                              <option value="UNDER_REVIEW">Under Review</option>
                              <option value="SHORTLISTED">Shortlisted</option>
                              <option value="INTERVIEW">Interview</option>
                              <option value="SELECTED">Selected</option>
                              <option value="REJECTED">Rejected</option>
                            </select>
                          </td>

                          {/* Action Button */}
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => handleOpenContact(interest)}
                              className="px-3 py-1.5 bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Mail className="w-3 h-3" />
                              <span>Contact</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal 1: Post New Opening */}
        <GlobalModal
          isOpen={isNewJobModalOpen}
          onClose={() => setIsNewJobModalOpen(false)}
          maxWidth="max-w-xl"
          ariaLabel="Post New Opening"
        >
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-govTeal-800 to-govTeal-700 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Post Cooperative Job / Apprenticeship</h3>
                <p className="text-xs text-govTeal-100">
                  Publish opening to certified trainees across all 20 NCCT institutions
                </p>
              </div>
              <button
                onClick={() => setIsNewJobModalOpen(false)}
                className="text-govTeal-200 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-govText-secondary mb-1">
                  Job / Opening Title *
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. PACS Digital Business Associate or AMCS Officer"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-govText-secondary mb-1">
                    Job Type *
                  </label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Apprenticeship">Apprenticeship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-govText-secondary mb-1">
                    Number of Openings *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={jobOpenings}
                    onChange={(e) => setJobOpenings(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-govText-secondary mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                    placeholder="e.g. Anand / Surat, Gujarat"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-govText-secondary mb-1">
                    Salary / Stipend Range *
                  </label>
                  <input
                    type="text"
                    value={jobSalary}
                    onChange={(e) => setJobSalary(e.target.value)}
                    placeholder="e.g. ₹3.5 - ₹4.5 Lakh / annum"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-govText-secondary mb-1">
                  Required Skill Tags (Comma-separated) *
                </label>
                <input
                  type="text"
                  value={jobSkills}
                  onChange={(e) => setJobSkills(e.target.value)}
                  placeholder="e.g. PACS Digitalization, AMCS Operations, Dairy ERP"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-govText-secondary mb-1">
                  Role Description & Scope *
                </label>
                <textarea
                  rows={3}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Describe day-to-day responsibilities, cooperative background requirements, and eligibility..."
                  className="w-full p-3 text-xs rounded-lg border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600 leading-relaxed"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsNewJobModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-govText-primary text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish Opening</span>
                </button>
              </div>
            </form>
          </div>
        </GlobalModal>

        {/* Modal 2: Edit Job Opening */}
        <GlobalModal
          isOpen={editingJob !== null}
          onClose={() => setEditingJob(null)}
          maxWidth="max-w-xl"
          ariaLabel="Edit Opening"
        >
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-govTeal-800 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Edit Job Opening</h3>
                <p className="text-xs text-govTeal-100">Update vacancy requirements and compensation</p>
              </div>
              <button
                onClick={() => setEditingJob(null)}
                className="text-govTeal-200 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editingJob && (
              <form onSubmit={handleUpdateJob} className="p-5 sm:p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-govText-secondary mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={editingJob.title}
                    onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-govText-secondary mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={editingJob.location}
                      onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-govText-secondary mb-1">
                      Salary Range
                    </label>
                    <input
                      type="text"
                      value={editingJob.salaryRange}
                      onChange={(e) => setEditingJob({ ...editingJob, salaryRange: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-govText-secondary mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={editingJob.description}
                    onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                    className="w-full p-3 text-xs rounded-lg border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setEditingJob(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-govText-primary text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-govTeal-600 hover:bg-govTeal-700 text-white text-xs font-bold rounded-xl shadow"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </GlobalModal>

        {/* Modal 3: Contact Trainee Modal */}
        <GlobalModal
          isOpen={contactTrainee !== null}
          onClose={() => setContactTrainee(null)}
          maxWidth="max-w-md"
          ariaLabel="Contact Trainee"
        >
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-govText-primary">
                Direct Candidate Outreach
              </h3>
              <button
                onClick={() => setContactTrainee(null)}
                className="text-xs text-govText-muted hover:text-govText-primary"
              >
                Close
              </button>
            </div>

            {contactSent ? (
              <div className="text-center py-6 space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-govText-primary">Outreach Dispatched</p>
                <p className="text-[11px] text-govText-secondary">Interview request sent to candidate.</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-govText-secondary">
                  Reach out to applicant <span className="font-bold text-govText-primary">{contactTrainee?.name}</span> regarding opening <span className="font-bold text-govTeal-700">{contactTrainee?.jobTitle}</span>.
                </p>

                <div className="bg-govBg p-3 rounded-lg border border-gray-200 space-y-1">
                  <div><span className="font-semibold">Candidate:</span> {contactTrainee?.name}</div>
                  <div><span className="font-semibold">Cooperative:</span> {contactTrainee?.coop}</div>
                  <div><span className="font-semibold">Email:</span> {contactTrainee?.email}</div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setContactTrainee(null)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-govText-primary font-bold rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setContactSent(true);
                      setTimeout(() => setContactTrainee(null), 1500);
                    }}
                    className="px-4 py-2 bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Interview Call</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </GlobalModal>
      </div>
    </PageContainer>
  );
};
