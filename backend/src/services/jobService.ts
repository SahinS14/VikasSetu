import { jobRepository } from '../repositories/jobRepository';
import { userRepository } from '../repositories/userRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { createError } from '../middleware/errorHandler';
import {
  getStudentProfileData,
  calculateJobMatch,
  JobRequirementData,
} from './matchingEngine';

export const jobService = {
  /**
   * Get all active jobs. If userId is provided, dynamically calculates personalized
   * match percentage, eligibility, matched/missing skills, and application status.
   */
  getAllJobs: async (userId?: string) => {
    const rawJobs = await jobRepository.findAll();

    if (!userId) {
      return rawJobs.map(job => ({
        ...job,
        requiredSkills: Array.isArray(job.requiredSkills) ? job.requiredSkills : [],
        preferredSkills: Array.isArray(job.preferredSkills) ? job.preferredSkills : [],
        requiredCertificates: Array.isArray(job.requiredCertificates) ? job.requiredCertificates : [],
        matchScore: null,
        matchLabel: null,
        eligibilityStatus: null,
        hasApplied: false,
      }));
    }

    try {
      const studentProfile = await getStudentProfileData(userId);
      const userInterests = await jobRepository.findInterestsByUser(userId);
      const appliedJobMap = new Map(userInterests.map(i => [i.jobPostingId, i]));

      return rawJobs.map(job => {
        const jobReq: JobRequirementData = {
          id: job.id,
          title: job.title,
          employerName: job.employerName,
          requiredSkills: Array.isArray(job.requiredSkills) ? (job.requiredSkills as string[]) : [],
          preferredSkills: Array.isArray(job.preferredSkills) ? (job.preferredSkills as string[]) : [],
          requiredQualification: job.requiredQualification || 'Graduation / Diploma',
          minimumExperience: job.minimumExperience ?? 0,
          requiredCertificates: Array.isArray(job.requiredCertificates) ? (job.requiredCertificates as string[]) : [],
          location: job.location,
          type: job.type,
        };

        const matchResult = calculateJobMatch(studentProfile, jobReq);
        const existingInterest = appliedJobMap.get(job.id);

        return {
          ...job,
          requiredSkills: jobReq.requiredSkills,
          preferredSkills: jobReq.preferredSkills,
          requiredCertificates: jobReq.requiredCertificates,
          matchScore: matchResult.matchScore,
          matchLabel: matchResult.matchLabel,
          eligibilityStatus: matchResult.eligibilityStatus,
          ineligibilityReasons: matchResult.ineligibilityReasons,
          matchedSkills: matchResult.matchedSkills,
          missingSkills: matchResult.missingSkills,
          hasRequiredCertificate: matchResult.hasRequiredCertificate,
          hasApplied: Boolean(existingInterest),
          applicationStatus: existingInterest?.status || null,
          applicationId: existingInterest?.id || null,
        };
      });
    } catch {
      // Fallback if student profile not yet created
      return rawJobs.map(job => ({
        ...job,
        requiredSkills: Array.isArray(job.requiredSkills) ? job.requiredSkills : [],
        preferredSkills: Array.isArray(job.preferredSkills) ? job.preferredSkills : [],
        requiredCertificates: Array.isArray(job.requiredCertificates) ? job.requiredCertificates : [],
        matchScore: null,
        matchLabel: null,
        eligibilityStatus: null,
        hasApplied: false,
      }));
    }
  },

  getJobById: async (id: string, userId?: string) => {
    const job = await jobRepository.findById(id);
    if (!job) throw createError(404, 'Job posting not found');

    if (userId) {
      try {
        const studentProfile = await getStudentProfileData(userId);
        const existingInterest = await jobRepository.findInterestByUserAndJob(userId, id);
        const jobReq: JobRequirementData = {
          id: job.id,
          title: job.title,
          employerName: job.employerName,
          requiredSkills: Array.isArray(job.requiredSkills) ? (job.requiredSkills as string[]) : [],
          preferredSkills: Array.isArray(job.preferredSkills) ? (job.preferredSkills as string[]) : [],
          requiredQualification: job.requiredQualification || 'Graduation / Diploma',
          minimumExperience: job.minimumExperience ?? 0,
          requiredCertificates: Array.isArray(job.requiredCertificates) ? (job.requiredCertificates as string[]) : [],
          location: job.location,
          type: job.type,
        };
        const match = calculateJobMatch(studentProfile, jobReq);
        return {
          ...job,
          requiredSkills: jobReq.requiredSkills,
          preferredSkills: jobReq.preferredSkills,
          requiredCertificates: jobReq.requiredCertificates,
          match,
          hasApplied: Boolean(existingInterest),
          applicationStatus: existingInterest?.status || null,
        };
      } catch {
        // Return without match
      }
    }

    return {
      ...job,
      requiredSkills: Array.isArray(job.requiredSkills) ? job.requiredSkills : [],
      preferredSkills: Array.isArray(job.preferredSkills) ? job.preferredSkills : [],
      requiredCertificates: Array.isArray(job.requiredCertificates) ? job.requiredCertificates : [],
    };
  },

  /**
   * Detailed skill-to-employment match breakdown for "Express Interest" modal
   */
  getJobMatchDetails: async (userId: string, jobPostingId: string) => {
    const job = await jobRepository.findById(jobPostingId);
    if (!job) throw createError(404, 'Job posting not found');

    const studentProfile = await getStudentProfileData(userId);
    const existingInterest = await jobRepository.findInterestByUserAndJob(userId, jobPostingId);

    const jobReq: JobRequirementData = {
      id: job.id,
      title: job.title,
      employerName: job.employerName,
      requiredSkills: Array.isArray(job.requiredSkills) ? (job.requiredSkills as string[]) : [],
      preferredSkills: Array.isArray(job.preferredSkills) ? (job.preferredSkills as string[]) : [],
      requiredQualification: job.requiredQualification || 'Graduation / Diploma',
      minimumExperience: job.minimumExperience ?? 0,
      requiredCertificates: Array.isArray(job.requiredCertificates) ? (job.requiredCertificates as string[]) : [],
      location: job.location,
      type: job.type,
    };

    const match = calculateJobMatch(studentProfile, jobReq);

    return {
      job: {
        ...job,
        requiredSkills: jobReq.requiredSkills,
        preferredSkills: jobReq.preferredSkills,
        requiredCertificates: jobReq.requiredCertificates,
      },
      studentProfile: {
        name: studentProfile.name,
        qualification: studentProfile.qualification,
        education: studentProfile.education,
        location: studentProfile.location,
        experienceYears: studentProfile.experienceYears,
        skillsCount: studentProfile.skills.length,
        certificatesCount: studentProfile.certificates.length,
        certificates: studentProfile.certificates,
      },
      match,
      hasApplied: Boolean(existingInterest),
      existingInterest: existingInterest || null,
    };
  },

  /**
   * Apply for Job (Authoritative server-side evaluation)
   * Prevents duplicate applications and records real match score
   */
  applyForJob: async (userId: string, jobPostingId: string) => {
    const job = await jobRepository.findById(jobPostingId);
    if (!job) throw createError(404, 'Job posting not found');

    // Idempotent duplicate check
    const existing = await jobRepository.findInterestByUserAndJob(userId, jobPostingId);
    if (existing) {
      return {
        alreadyApplied: true,
        message: 'You have already applied for this opening.',
        interest: existing,
      };
    }

    const user = await userRepository.findById(userId);
    if (!user) throw createError(404, 'User not found');

    const studentProfile = await getStudentProfileData(userId);

    const jobReq: JobRequirementData = {
      id: job.id,
      title: job.title,
      employerName: job.employerName,
      requiredSkills: Array.isArray(job.requiredSkills) ? (job.requiredSkills as string[]) : [],
      preferredSkills: Array.isArray(job.preferredSkills) ? (job.preferredSkills as string[]) : [],
      requiredQualification: job.requiredQualification || 'Graduation / Diploma',
      minimumExperience: job.minimumExperience ?? 0,
      requiredCertificates: Array.isArray(job.requiredCertificates) ? (job.requiredCertificates as string[]) : [],
      location: job.location,
      type: job.type,
    };

    // Server-side deterministic score calculation
    const match = calculateJobMatch(studentProfile, jobReq);

    const interest = await jobRepository.createInterest({
      id: `ji-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      jobPostingId,
      userId,
      traineeName: user.name,
      traineeEmail: user.email,
      traineeSkills: studentProfile.skills,
      matchedSkills: match.matchedSkills,
      missingSkills: match.missingSkills,
      matchScore: match.matchScore,
      eligibilityStatus: match.eligibilityStatus,
      ineligibilityReasons: match.ineligibilityReasons,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      appliedAt: new Date(),
      status: 'APPLIED',
    });

    // In-app notification with match score
    await notificationRepository.create({
      id: `notif-job-${interest.id}`,
      userId,
      title: 'Application Submitted 📋',
      message: `Your application for "${job.title}" at ${job.employerName} has been recorded with a ${match.matchScore}% Match (${match.matchLabel}).`,
      timestamp: new Date().toISOString(),
      type: 'job',
      linkView: 'my_applications',
    });

    return {
      alreadyApplied: false,
      message: 'Application submitted successfully!',
      interest,
      match,
    };
  },

  /**
   * Trainee's submitted applications with live match data and missing skills
   */
  getMyApplications: async (userId: string) => {
    const interests = await jobRepository.findInterestsByUser(userId);
    return interests.map(i => ({
      ...i,
      traineeSkills: Array.isArray(i.traineeSkills) ? i.traineeSkills : [],
      matchedSkills: Array.isArray(i.matchedSkills) ? i.matchedSkills : [],
      missingSkills: Array.isArray(i.missingSkills) ? i.missingSkills : [],
      ineligibilityReasons: Array.isArray(i.ineligibilityReasons) ? i.ineligibilityReasons : [],
    }));
  },

  /**
   * Recruiter candidate pipeline — sorted by ELIGIBLE first, matchScore descending
   */
  getRecruiterCandidates: async (employerId?: string) => {
    return jobRepository.findInterestsByEmployer(employerId);
  },

  /**
   * Recruiter updates review status
   */
  updateApplicationStatus: async (interestId: string, status: string) => {
    const validStatuses = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'];
    const normStatus = status.toUpperCase();
    if (!validStatuses.includes(normStatus)) {
      throw createError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updated = await jobRepository.updateInterestStatus(interestId, normStatus);

    // Notify trainee of status change
    await notificationRepository.create({
      id: `notif-status-${Date.now()}`,
      userId: updated.userId,
      title: 'Application Update 🔔',
      message: `Your application status for "${updated.job.title}" has been updated to: ${normStatus.replace('_', ' ')}.`,
      timestamp: new Date().toISOString(),
      type: 'job',
      linkView: 'my_applications',
    });

    return updated;
  },
};
