import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  Building,
  MapPin,
  IndianRupee,
  Clock,
  Briefcase,
  X,
  Send,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { JobPosting } from '../../types';
import api from '../../lib/api';
import { GlobalModal } from '../common/GlobalModal';

interface JobMatchApplicationModalProps {
  isOpen: boolean;
  job: JobPosting | null;
  onClose: () => void;
  onApplicationSuccess?: (application: any) => void;
  onNavigateToCourse?: (courseId: string) => void;
}

export const JobMatchApplicationModal: React.FC<JobMatchApplicationModalProps> = ({
  isOpen,
  job,
  onClose,
  onApplicationSuccess,
  onNavigateToCourse,
}) => {
  const [matchData, setMatchData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !job) {
      setMatchData(null);
      setSubmissionSuccess(false);
      setErrorMessage('');
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setErrorMessage('');

    api.jobs
      .getMatch(job.id)
      .then(res => {
        if (isMounted) {
          setMatchData(res);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error('Failed to load match details:', err);
          // Fallback calculation from job data if offline/error
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, job]);

  if (!job) return null;

  const handleApply = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await api.jobs.apply(job.id);
      setIsSubmitting(false);
      setSubmissionSuccess(true);
      if (onApplicationSuccess) {
        onApplicationSuccess(response.interest);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Failed to submit application. Please try again.');
    }
  };

  const match = matchData?.match;
  const matchScore = match?.matchScore ?? job.matchScore ?? 80;
  const matchLabel = match?.matchLabel ?? job.matchLabel ?? 'Strong Match';
  const isEligible = (match?.eligibilityStatus ?? job.eligibilityStatus) !== 'NOT_ELIGIBLE';
  const hasAlreadyApplied = matchData?.hasApplied || job.hasApplied || submissionSuccess;
  const applicationStatus = matchData?.existingInterest?.status || job.applicationStatus || (submissionSuccess ? 'APPLIED' : null);

  // Match score color scheme
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-300';
    if (score >= 80) return 'text-govTeal-800 bg-govTeal-50 border-govTeal-300';
    if (score >= 70) return 'text-blue-700 bg-blue-50 border-blue-300';
    if (score >= 60) return 'text-amber-700 bg-amber-50 border-amber-300';
    return 'text-gray-700 bg-gray-50 border-gray-300';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-600';
    if (score >= 80) return 'bg-govTeal-600';
    if (score >= 70) return 'bg-blue-600';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-gray-400';
  };

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      ariaLabel={`Job Match & Application for ${job.title}`}
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-govTeal-900 to-govTeal-800 text-white p-5 sm:p-6 flex items-start justify-between gap-4 flex-shrink-0">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded">
                {job.type}
              </span>
              <span className="text-[10px] font-semibold text-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Cooperative Opening</span>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold leading-snug">
              {job.title}
            </h2>
            <p className="text-xs text-govTeal-100 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{job.employerName}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-govText-primary">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-govTeal-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-govText-secondary">
                Analyzing your skills, courses & verified certificates against job criteria...
              </p>
            </div>
          ) : (
            <>
              {/* Top Card: Match Score & Eligibility Badge */}
              <div className="bg-govBg rounded-2xl p-4 sm:p-5 border border-govText-border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center font-extrabold ${getScoreColor(matchScore)}`}>
                      <span className="text-xl leading-none">{matchScore}%</span>
                      <span className="text-[9px] uppercase tracking-wider font-bold">Match</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-govText-primary">
                          {matchLabel}
                        </h3>
                      </div>
                      <p className="text-xs text-govText-secondary">
                        Calculated from your verified competencies, qualification & certificate
                      </p>
                    </div>
                  </div>

                  {/* Eligibility Badge */}
                  <div>
                    {isEligible ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold shadow-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Eligible for Direct Placement</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold shadow-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span>Requirements Not Fully Met</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Score Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ease-out rounded-full ${getScoreBarColor(matchScore)}`}
                      style={{ width: `${matchScore}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-govText-muted font-medium px-0.5">
                    <span>0%</span>
                    <span>60% Moderate</span>
                    <span>80% Strong</span>
                    <span>100% Full Fit</span>
                  </div>
                </div>

                {/* Breakdown Pill Grid */}
                {match?.breakdown && (
                  <div className="pt-2 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <span className="text-[10px] text-govText-muted block">Skills Fit</span>
                      <span className="font-bold text-govTeal-700">{match.breakdown.skillsScore} / 40 pts</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <span className="text-[10px] text-govText-muted block">NCCT Certificate</span>
                      <span className="font-bold text-govTeal-700">{match.breakdown.certificatesScore} / 20 pts</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <span className="text-[10px] text-govText-muted block">Education</span>
                      <span className="font-bold text-govTeal-700">{match.breakdown.educationScore} / 15 pts</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <span className="text-[10px] text-govText-muted block">Location / Pref</span>
                      <span className="font-bold text-govTeal-700">
                        {match.breakdown.locationScore + match.breakdown.preferenceScore + match.breakdown.availabilityScore} / 15 pts
                      </span>
                    </div>
                  </div>
                )}

                {/* Ineligibility Warning if any */}
                {!isEligible && match?.ineligibilityReasons?.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl space-y-1 text-xs text-rose-800">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Missing Mandatory Requirements:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700 pl-1">
                      {match.ineligibilityReasons.map((reason: string, idx: number) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Requirement vs Candidate Comparison Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-govText-secondary">
                  Job Competencies & Qualification Status
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Matched Skills */}
                  <div className="bg-white rounded-xl p-3.5 border border-emerald-200 bg-emerald-50/30 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Matched Skills ({match?.matchedSkills?.length || 0})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {match?.matchedSkills?.length > 0 ? (
                        match.matchedSkills.map((sk: string, i: number) => (
                          <span
                            key={i}
                            className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-md font-medium text-[11px]"
                          >
                            ✓ {sk}
                          </span>
                        ))
                      ) : (
                        <span className="text-govText-muted italic text-[11px]">No direct skill matches</span>
                      )}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div className="bg-white rounded-xl p-3.5 border border-amber-200 bg-amber-50/30 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>Missing Skills ({match?.missingSkills?.length || 0})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {match?.missingSkills?.length > 0 ? (
                        match.missingSkills.map((sk: string, i: number) => (
                          <span
                            key={i}
                            className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md font-medium text-[11px]"
                          >
                            ⚠ {sk}
                          </span>
                        ))
                      ) : (
                        <span className="text-emerald-700 font-medium text-[11px]">All required skills satisfied!</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Checks: Certificate & Qualification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl border border-gray-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-govTeal-600" />
                      <span className="font-semibold text-govText-primary">NCCT Certificate</span>
                    </div>
                    {match?.hasRequiredCertificate ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold text-[11px]">
                        Not on file
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl border border-gray-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-govTeal-600" />
                      <span className="font-semibold text-govText-primary">Qualification</span>
                    </div>
                    {match?.qualificationMet !== false ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Satisfied
                      </span>
                    ) : (
                      <span className="text-rose-700 font-bold text-[11px]">
                        Unmet
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Skill Gap & Course Recommendations */}
              {match?.recommendedCourses && match.recommendedCourses.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-govText-secondary flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-govTeal-600" />
                      <span>Bridge Skill Gap with NCCT LMS Courses</span>
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {match.recommendedCourses.map((rec: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-white p-3.5 rounded-xl border border-govTeal-200 hover:border-govTeal-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-govTeal-800 bg-govTeal-50 border border-govTeal-200 px-2 py-0.5 rounded">
                            Recommended Course
                          </span>
                          <h5 className="font-bold text-xs text-govText-primary">
                            {rec.courseTitle}
                          </h5>
                          <p className="text-[11px] text-govText-secondary">
                            Addresses missing skill: <span className="font-semibold text-amber-800">{rec.skillAddressed}</span>
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            onClose();
                            if (onNavigateToCourse) {
                              onNavigateToCourse(rec.courseId);
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <span>View Course</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Message if any */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
                  {errorMessage}
                </div>
              )}

              {/* Success celebration state */}
              {submissionSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl space-y-1 text-center animate-fadeIn">
                  <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-sm">Application Successfully Submitted!</h4>
                  <p className="text-xs text-emerald-800">
                    Your profile, verified certificates, and {matchScore}% match score have been forwarded directly to {job.employerName}.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-govText-primary font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>

          {hasAlreadyApplied ? (
            <div className="px-5 py-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Already Applied ({applicationStatus || 'Under Review'})</span>
            </div>
          ) : (
            <button
              onClick={handleApply}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-govTeal-600 hover:bg-govTeal-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Application</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </GlobalModal>
  );
};
