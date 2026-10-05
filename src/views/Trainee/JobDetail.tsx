import React, { useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Building,
  CheckCircle2,
  Users,
  Clock,
  Sparkles,
  Send,
  ShieldCheck,
  FileText,
  Calendar,
  IndianRupee
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../../components/layout/PageContainer';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';

export const JobDetail: React.FC = () => {
  const {
    jobs,
    jobInterests,
    applyForJob,
    currentUser,
    activeViewParams,
    navigate,
    t
  } = useApp();

  const jobId = activeViewParams?.jobId || jobs[0]?.id;
  const job = jobs.find(j => j.id === jobId) || jobs[0];

  const hasExpressedInterest = jobInterests.some(
    i => i.jobPostingId === job?.id && i.userId === currentUser.id
  );

  const [isJustApplied, setIsJustApplied] = useState(false);

  const handleApply = () => {
    if (!job) return;
    applyForJob(job.id);
    setIsJustApplied(true);
    setTimeout(() => setIsJustApplied(false), 3000);
  };

  if (!job) {
    return (
      <PageContainer>
        <div className="bg-white rounded-2xl p-10 text-center border border-govText-border space-y-4">
          <Briefcase className="w-12 h-12 text-govTeal-400 mx-auto" />
          <h2 className="text-lg font-bold text-govText-primary">Opportunity Not Found</h2>
          <button
            onClick={() => navigate('jobs')}
            className="px-4 py-2 bg-govTeal-600 text-white rounded-xl text-xs font-bold"
          >
            Back to Openings
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* 1. Back Button */}
      <div>
        <button
          onClick={() => navigate('jobs')}
          className="inline-flex items-center gap-2 text-xs font-bold text-govTeal-700 hover:text-govTeal-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.jobDetail?.backToJobs || 'Back to Job Opportunities'}</span>
        </button>
      </div>

      {/* 2. Hero Job Header */}
      <div className="bg-white rounded-3xl border border-govText-border shadow-sm p-4 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-govTeal-50 text-govTeal-800 text-xs font-bold uppercase tracking-wider border border-govTeal-200">
                {job.employerName}
              </span>
              <SimulatedBadge text="Federated Cooperative Employer" />
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold text-govText-primary tracking-tight">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-govText-secondary pt-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-govTeal-600" />
                <span className="font-medium">{job.location}</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-govTeal-800">
                <IndianRupee className="w-4 h-4 text-govTeal-600" />
                <span>{job.salaryRange}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-saffron-600" />
                <span>{job.openingsCount} Vacancies Open</span>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="w-full sm:w-auto flex flex-col items-stretch sm:items-end gap-2">
            {hasExpressedInterest || isJustApplied ? (
              <div className="w-full sm:w-auto px-5 py-3.5 sm:py-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-center gap-2 shadow-xs min-h-[44px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t.jobDetail?.interestRegistered || 'Interest Expressed'}</span>
              </div>
            ) : (
              <button
                onClick={handleApply}
                className="w-full sm:w-auto px-6 py-3.5 sm:py-3 bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold rounded-xl text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
              >
                <Send className="w-4 h-4" />
                <span>{t.jobDetail?.expressInterest || 'Express Interest in Role'}</span>
              </button>
            )}

            <button
              onClick={() => navigate('my_applications')}
              className="text-[11px] font-bold text-govTeal-700 hover:underline text-center sm:text-right py-1"
            >
              View My Registered Applications →
            </button>
          </div>
        </div>
      </div>

      {/* 3. Job Details Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Responsibilities & Requirements (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Job Overview */}
          <div className="bg-white rounded-2xl p-6 border border-govText-border shadow-xs space-y-3">
            <h2 className="text-base font-bold text-govText-primary">
              Position Overview
            </h2>
            <p className="text-xs sm:text-sm text-govText-secondary leading-relaxed">
              {job.description}
            </p>
          </div>

          {/* Required Skills & Trainee Match */}
          <div className="bg-white rounded-2xl p-6 border border-govText-border shadow-xs space-y-4">
            <h2 className="text-base font-bold text-govText-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-saffron-600" />
              <span>{t.jobDetail?.requiredSkills || 'Required Competencies & Skills'}</span>
            </h2>

            <div className="flex flex-wrap gap-2">
              {job.requiredSkills.map((skill, sIdx) => (
                <span
                  key={sIdx}
                  className="px-3 py-1.5 rounded-lg bg-govBg text-govText-primary text-xs font-semibold border border-gray-200 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-govTeal-600" />
                  <span>{skill}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Key Duties */}
          <div className="bg-white rounded-2xl p-6 border border-govText-border shadow-xs space-y-3">
            <h2 className="text-base font-bold text-govText-primary">
              Core Responsibilities
            </h2>
            <ul className="space-y-2 text-xs text-govText-secondary leading-relaxed list-disc list-inside">
              <li>Manage electronic member registers and PACS core banking transaction ledger.</li>
              <li>Coordinate digital credit disbursement (Kisan Credit Card / PM-KISAN) in conformity with NABARD rules.</li>
              <li>Generate periodic audited financial trial balance for federated State Cooperative Apex Bank submission.</li>
              <li>Adhere to statutory NCCT guidelines for cooperative inventory stock and storage audits.</li>
            </ul>
          </div>
        </div>

        {/* Employer & Recruitment Info (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-govText-border shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-govText-primary">
              Recruiter Overview
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Building className="w-4 h-4 text-govTeal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-govText-primary">{job.employerName}</p>
                  <p className="text-govText-muted text-[11px] mt-0.5">
                    Apex Cooperative Federation recognized under the Ministry of Cooperation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-govTeal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-govText-primary">Direct Placement Cell</p>
                  <p className="text-govText-muted text-[11px] mt-0.5">
                    Profiles of certified trainees are shared directly with regional recruitment officers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-govTeal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-govText-primary">Recruitment Process</p>
                  <p className="text-govText-muted text-[11px] mt-0.5">
                    Shortlisted applicants are notified via SMS and email within 7 business days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </PageContainer>
  );
};
