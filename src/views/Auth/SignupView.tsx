import React, { useState } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Fingerprint,
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { api } from '../../lib/api';
import { Language } from '../../types';

export type RegistrationRole = 'TRAINEE' | 'FACULTY' | 'INSTITUTE_ADMIN' | 'EMPLOYER';

export const SignupView: React.FC = () => {
  const { navigate, setLanguage } = useApp();
  const [currentStep, setCurrentStep] = useState(1);

  // ─── Step 1: Account State ──────────────────────────────────────────────────
  const [selectedRole, setSelectedRole] = useState<RegistrationRole>('TRAINEE');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ─── Step 2: Role-Specific Profile State ─────────────────────────────────────
  // Common
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Pune');

  // Trainee Specific
  const [cooperativeAffiliation, setCooperativeAffiliation] = useState('Shri Datta PACS, Niphad');
  const [qualification, setQualification] = useState('Graduate (B.Com / B.Sc)');
  const [preferredLanguage, setPreferredLanguage] = useState<Language>('en');
  const [trainingInterests, setTrainingInterests] = useState('PACS Digitalization & ERP, Cooperative Accounting');

  // Faculty Specific
  const [instituteAffiliation, setInstituteAffiliation] = useState('VAMNICOM (Apex National Institute), Pune');
  const [facultyEmployeeId, setFacultyEmployeeId] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [facultySpecialization, setFacultySpecialization] = useState('Cooperative Law & Accounting');
  const [experience, setExperience] = useState('5+ Years');

  // Institute Admin Specific
  const [instituteType, setInstituteType] = useState('ICM (State Institute of Cooperative Management)');
  const [address, setAddress] = useState('');
  const [authorizedPerson, setAuthorizedPerson] = useState('');

  // Employer Specific
  const [organizationType, setOrganizationType] = useState('National Cooperative Federation');

  // ─── Step 3: e-KYC State ─────────────────────────────────────────────────────
  const [mockAadhaar, setMockAadhaar] = useState('548921894589');
  const [isVerifyingKyc, setIsVerifyingKyc] = useState(false);
  const [eKycStatus, setEKycStatus] = useState<'VERIFIED' | 'NOT_VERIFIED'>('NOT_VERIFIED');

  // ─── Submission State ────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  const [assignedRegId, setAssignedRegId] = useState('');

  // Dynamic Headings based on role
  const getRoleHeading = () => {
    switch (selectedRole) {
      case 'TRAINEE':
        return 'Create Learner Account';
      case 'FACULTY':
        return 'Create Faculty Account';
      case 'INSTITUTE_ADMIN':
        return 'Create Institute Account';
      case 'EMPLOYER':
        return 'Create Partner Account';
      default:
        return 'Create Candidate Account';
    }
  };

  const getRoleLabel = (role: RegistrationRole) => {
    switch (role) {
      case 'TRAINEE':
        return 'Learner / Participant';
      case 'FACULTY':
        return 'Faculty / Trainer';
      case 'INSTITUTE_ADMIN':
        return 'Institute / Training Centre';
      case 'EMPLOYER':
        return 'Partner / Employer';
    }
  };

  const getNameLabel = () => {
    switch (selectedRole) {
      case 'INSTITUTE_ADMIN':
        return 'Institute / Centre Name';
      case 'EMPLOYER':
        return 'Organization / Enterprise Name';
      default:
        return 'Full Candidate Name';
    }
  };

  const getNamePlaceholder = () => {
    switch (selectedRole) {
      case 'INSTITUTE_ADMIN':
        return 'e.g. Institute of Cooperative Management, Lucknow';
      case 'EMPLOYER':
        return 'e.g. AMUL / GCMMF Federation';
      case 'FACULTY':
        return 'e.g. Dr. Meenakshi Sundaram';
      default:
        return 'e.g. Rameshwar Patil';
    }
  };

  // Step 1 Validation
  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name or organization name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    setCurrentStep(2);
  };

  // Step 2 Validation
  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setCurrentStep(3);
  };

  // Step 3: Register in PostgreSQL
  const performRegistration = async (kycVerified: boolean) => {
    setIsSubmitting(true);
    setErrorMessage('');
    const finalKycStatus = kycVerified ? 'VERIFIED' : 'NOT_VERIFIED';

    try {
      const profileDetails: Record<string, any> = {
        phone,
        state,
        district,
      };

      if (selectedRole === 'TRAINEE') {
        profileDetails.cooperativeAffiliation = cooperativeAffiliation;
        profileDetails.qualification = qualification;
        profileDetails.preferredLanguage = preferredLanguage;
        profileDetails.trainingInterests = trainingInterests;
      } else if (selectedRole === 'FACULTY') {
        profileDetails.instituteName = instituteAffiliation;
        profileDetails.employeeId = facultyEmployeeId;
        profileDetails.designation = designation;
        profileDetails.specialization = facultySpecialization;
        profileDetails.experience = experience;
      } else if (selectedRole === 'INSTITUTE_ADMIN') {
        profileDetails.instituteName = fullName;
        profileDetails.instituteType = instituteType;
        profileDetails.address = address;
        profileDetails.authorizedPerson = authorizedPerson;
        profileDetails.designation = designation;
      } else if (selectedRole === 'EMPLOYER') {
        profileDetails.organizationName = fullName;
        profileDetails.organizationType = organizationType;
        profileDetails.address = address;
        profileDetails.authorizedPerson = authorizedPerson;
        profileDetails.designation = designation;
      }

      const response = await api.auth.register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: selectedRole,
        phone: phone.trim(),
        profileDetails,
        eKycStatus: finalKycStatus,
      });

      setRegisteredUser(response.user);
      setAssignedRegId(response.registrationId);
      setEKycStatus(finalKycStatus);
      if (selectedRole === 'TRAINEE' && preferredLanguage) {
        setLanguage(preferredLanguage);
      }
      setCurrentStep(4);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsVerifyingKyc(false);
    }
  };

  // e-KYC Verification Action
  const handleVerifyKycAndRegister = () => {
    setIsVerifyingKyc(true);
    setErrorMessage('');
    setTimeout(() => {
      performRegistration(true);
    }, 1000);
  };

  // Skip e-KYC Action
  const handleSkipKycAndRegister = () => {
    performRegistration(false);
  };

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-14">
        <div className="bg-white rounded-[24px] border border-[#E0E6E2] shadow-[0_16px_40px_rgba(7,61,50,0.06)] p-6 sm:p-10 space-y-7">

          {/* Top Title & Step Indicator */}
          <div className="space-y-3.5 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E6F4EA] border border-[#C2E7CD] text-[#005B46] text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-[#005B46]" />
              <span>VikasSetu ACCOUNT REGISTRATION</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#073D32] tracking-tight leading-tight">
              {getRoleHeading()}
            </h1>

            {/* Stepper Wizard Indicator */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-1 flex-wrap">
              {[
                { num: 1, label: 'Account' },
                { num: 2, label: 'Profile' },
                { num: 3, label: 'Verification (Optional)' },
                { num: 4, label: 'Ready' },
              ].map(s => (
                <div key={s.num} className="flex items-center gap-1.5 sm:gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep === s.num
                        ? 'bg-[#005B46] text-white shadow-sm ring-4 ring-[#005B46]/15'
                        : currentStep > s.num
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                  >
                    {currentStep > s.num ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span className={`text-[11px] sm:text-xs font-semibold ${currentStep === s.num ? 'text-[#073D32] font-bold' : 'text-[#536A65]'
                    }`}>
                    {s.label}
                  </span>
                  {s.num < 4 && <div className="w-4 sm:w-7 h-[2px] bg-gray-200" />}
                </div>
              ))}
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-fadeIn">
              {errorMessage}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              STEP 1: ACCOUNT & ROLE SELECTION
             ════════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Next} className="space-y-4">
              {/* Account Type / Role Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                  Account Type / Role <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as RegistrationRole)}
                    className="w-full h-12 px-3.5 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523] focus:outline-none focus:ring-2 focus:ring-[#005B46]/20 focus:border-[#005B46] transition-all cursor-pointer"
                  >
                    <option value="TRAINEE">Learner / Participant (PACS Staff, Trainee, Youth)</option>
                    <option value="FACULTY">Faculty / Trainer (NCCT Institute Instructor)</option>
                    <option value="INSTITUTE_ADMIN">Institute / Training Centre (NCCT / RICM / ICM Admin)</option>
                    <option value="EMPLOYER">Partner / Employer (Cooperative Federation / Bank)</option>
                  </select>
                </div>
              </div>

              {/* Name field */}
              <div>
                <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                  {getNameLabel()} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={getNamePlaceholder()}
                    className="w-full h-12 px-3.5 pl-10 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#005B46]/20 focus:border-[#005B46] transition-all"
                    required
                  />
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-4" />
                </div>
              </div>

              {/* Email field */}
              <div>
                <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="w-full h-12 px-3.5 pl-10 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#005B46]/20 focus:border-[#005B46] transition-all"
                    required
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-4" />
                </div>
              </div>

              {/* Password fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                    Set Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      className="w-full h-12 px-3.5 pl-10 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#005B46]/20 focus:border-[#005B46] transition-all"
                      required
                      minLength={6}
                    />
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-4" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      className="w-full h-12 px-3.5 pl-10 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#005B46]/20 focus:border-[#005B46] transition-all"
                      required
                    />
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-4" />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-xs font-semibold text-[#536A65] hover:text-[#005B46] cursor-pointer"
                >
                  Already registered? Sign in
                </button>
                <button
                  type="submit"
                  className="px-6 h-12 bg-[#087A5B] hover:bg-[#00664F] text-white font-bold rounded-xl shadow-sm hover:shadow flex items-center gap-2 text-xs sm:text-sm transition-all cursor-pointer"
                >
                  <span>Continue to Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ════════════════════════════════════════════════════════════════
              STEP 2: ROLE-SPECIFIC PROFILE DETAILS
             ════════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Next} className="space-y-4">

              {/* TRAINEE PROFILE */}
              {selectedRole === 'TRAINEE' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98234 11223"
                        className="w-full h-12 px-3.5 pl-10 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523] focus:outline-none focus:ring-2 focus:ring-[#005B46]/20 focus:border-[#005B46] transition-all"
                      />
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-4" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                        State
                      </label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Maharashtra"
                        className="w-full h-12 px-3.5 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523] focus:outline-none focus:ring-2 focus:ring-[#005B46]/20 focus:border-[#005B46]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                        District
                      </label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="Nashik"
                        className="w-full h-12 px-3.5 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523] focus:outline-none focus:ring-2 focus:ring-[#005B46]/20 focus:border-[#005B46]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                      Cooperative / PACS Affiliation
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cooperativeAffiliation}
                        onChange={(e) => setCooperativeAffiliation(e.target.value)}
                        placeholder="e.g. Shri Datta PACS, Niphad"
                        className="w-full h-12 px-3.5 pl-10 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523] focus:outline-none focus:ring-2 focus:ring-[#005B46]/20 focus:border-[#005B46]"
                      />
                      <Building2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-4" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                        Education / Qualification
                      </label>
                      <select
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        className="w-full h-12 px-3 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs font-semibold text-[#1E2523] focus:outline-none focus:ring-2 focus:ring-[#005B46]/20 focus:border-[#005B46]"
                      >
                        <option value="Higher Secondary (12th)">Higher Secondary (12th)</option>
                        <option value="Graduate (B.Com / B.Sc / B.A)">Graduate (B.Com / B.Sc / B.A)</option>
                        <option value="Post-Graduate / Masters">Post-Graduate / Masters</option>
                        <option value="Diploma in Cooperative Management">Diploma in Cooperative Management</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                        Preferred LMS Language
                      </label>
                      <select
                        value={preferredLanguage}
                        onChange={(e) => setPreferredLanguage(e.target.value as Language)}
                        className="w-full h-12 px-3 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs font-semibold text-[#1E2523] focus:outline-none focus:ring-2 focus:ring-[#005B46]/20 focus:border-[#005B46]"
                      >
                        <option value="en">English</option>
                        <option value="hi">हिन्दी (Hindi)</option>
                        <option value="mr">मराठी (Marathi)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                      Interested Training Areas
                    </label>
                    <input
                      type="text"
                      value={trainingInterests}
                      onChange={(e) => setTrainingInterests(e.target.value)}
                      placeholder="e.g. PACS Digitalization, Dairy Operations, Cooperative Law"
                      className="w-full h-12 px-3.5 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523] focus:outline-none focus:ring-2 focus:ring-[#005B46]/20 focus:border-[#005B46]"
                    />
                  </div>
                </>
              )}

              {/* FACULTY PROFILE */}
              {selectedRole === 'FACULTY' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 20 2553 7980"
                        className="w-full h-12 px-3.5 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                        Employee ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={facultyEmployeeId}
                        onChange={(e) => setFacultyEmployeeId(e.target.value)}
                        placeholder="e.g. NCCT-FAC-2026-MH-101"
                        className="w-full h-12 px-3.5 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                      NCCT Institute Affiliation
                    </label>
                    <select
                      value={instituteAffiliation}
                      onChange={(e) => setInstituteAffiliation(e.target.value)}
                      className="w-full h-12 px-3 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523]"
                    >
                      <option value="inst-vamnicom">VAMNICOM (Apex National Institute), Pune</option>
                      <option value="inst-ricm-chd">RICM Chandigarh (Punjab/Haryana)</option>
                      <option value="inst-ricm-blr">RICM Bengaluru (Karnataka)</option>
                      <option value="inst-ricm-gdn">RICM Gandhinagar (Gujarat)</option>
                      <option value="inst-icm-lko">ICM Lucknow (Uttar Pradesh)</option>
                      <option value="inst-icm-bhopal">ICM Bhopal (Madhya Pradesh)</option>
                      <option value="inst-icm-pune">ICM Pune (Maharashtra)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                        Designation
                      </label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="Associate Professor"
                        className="w-full h-12 px-3.5 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                        Teaching Experience
                      </label>
                      <select
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full h-12 px-3 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs font-semibold text-[#1E2523]"
                      >
                        <option value="1-3 Years">1-3 Years</option>
                        <option value="3-5 Years">3-5 Years</option>
                        <option value="5+ Years">5+ Years</option>
                        <option value="10+ Years">10+ Years</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                      Core Specialization
                    </label>
                    <input
                      type="text"
                      value={facultySpecialization}
                      onChange={(e) => setFacultySpecialization(e.target.value)}
                      placeholder="Cooperative Law, Agribusiness Finance, Core Banking"
                      className="w-full h-12 px-3.5 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523]"
                    />
                  </div>
                </>
              )}

              {/* INSTITUTE ADMIN PROFILE */}
              {selectedRole === 'INSTITUTE_ADMIN' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                        Official Mobile / Phone
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 20 2553 7970"
                        className="w-full h-12 px-3.5 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                        Institute Type
                      </label>
                      <select
                        value={instituteType}
                        onChange={(e) => setInstituteType(e.target.value)}
                        className="w-full h-12 px-3 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs font-semibold text-[#1E2523]"
                      >
                        <option value="VAMNICOM">VAMNICOM (Apex National Institute)</option>
                        <option value="RICM">RICM (Regional Institute)</option>
                        <option value="ICM">ICM (State Institute)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                        State
                      </label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Maharashtra"
                        className="w-full h-12 px-3.5 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                        District
                      </label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="Pune"
                        className="w-full h-12 px-3.5 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                      Campus / Postal Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="University Road, Pune, Maharashtra 411007"
                      className="w-full h-12 px-3.5 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                        Authorized Person Name
                      </label>
                      <input
                        type="text"
                        value={authorizedPerson}
                        onChange={(e) => setAuthorizedPerson(e.target.value)}
                        placeholder="Dr. Rajesh Deshmukh"
                        className="w-full h-12 px-3.5 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                        Designation
                      </label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="Director / Principal"
                        className="w-full h-12 px-3.5 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523]"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* EMPLOYER PROFILE */}
              {selectedRole === 'EMPLOYER' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                        Official Mobile / Phone
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 80 4567 8901"
                        className="w-full h-12 px-3.5 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                        Organization Type
                      </label>
                      <select
                        value={organizationType}
                        onChange={(e) => setOrganizationType(e.target.value)}
                        className="w-full h-12 px-3 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs font-semibold text-[#1E2523]"
                      >
                        <option value="National Cooperative Federation">National Cooperative Federation</option>
                        <option value="State Cooperative Apex Bank">State Cooperative Apex Bank</option>
                        <option value="Dairy Cooperative Union">Dairy Cooperative Union</option>
                        <option value="Agribusiness / Cooperative Partner">Agribusiness / Cooperative Partner</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                        State
                      </label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Gujarat"
                        className="w-full h-12 px-3.5 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                        District
                      </label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="Anand"
                        className="w-full h-12 px-3.5 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                      Office / Headquarters Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Amul Dairy Road, Anand, Gujarat"
                      className="w-full h-12 px-3.5 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                        Authorized HR / Recruitment Contact
                      </label>
                      <input
                        type="text"
                        value={authorizedPerson}
                        onChange={(e) => setAuthorizedPerson(e.target.value)}
                        placeholder="Shri Vikram Nair"
                        className="w-full h-12 px-3.5 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                        Designation
                      </label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="HR Director / Talent Acquisition Lead"
                        className="w-full h-12 px-3.5 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs sm:text-sm font-semibold text-[#1E2523]"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-3 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 h-12 rounded-xl border border-gray-200 text-xs font-semibold text-[#536A65] flex items-center gap-1.5 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  className="px-6 h-12 bg-[#087A5B] hover:bg-[#00664F] text-white font-bold rounded-xl shadow-sm hover:shadow flex items-center gap-2 text-xs sm:text-sm transition-all cursor-pointer"
                >
                  <span>Proceed to Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ════════════════════════════════════════════════════════════════
              STEP 3: IDENTITY VERIFICATION (OPTIONAL)
             ════════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold tracking-wide uppercase">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>OPTIONAL STEP</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#073D32]">
                  Identity Verification (Optional)
                </h3>
                <p className="text-xs text-[#536A65] max-w-md mx-auto leading-relaxed">
                  Verify your identity to unlock verified profile badges, DigiLocker certificates, and trusted employer applications.
                </p>
              </div>

              <div className="bg-[#FBFCFA] p-5 sm:p-6 rounded-2xl border border-[#DCE4DE] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E6F4EA] flex items-center justify-center text-[#005B46] flex-shrink-0">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#073D32]">
                      Aadhaar / e-KYC Verification
                    </h4>
                    <p className="text-[11px] text-[#536A65]">
                      Verify your identity securely. You can complete this now or anytime later from your profile.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#073D32] uppercase tracking-wider mb-1.5">
                    12-Digit Aadhaar / Virtual ID (VID)
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={mockAadhaar}
                    onChange={(e) => setMockAadhaar(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="5489 2189 4589"
                    className="w-full h-12 text-center text-base sm:text-lg font-mono tracking-widest rounded-xl border border-[#DCE4DE] bg-white font-bold text-[#073D32] focus:outline-none focus:ring-2 focus:ring-[#005B46]/20 focus:border-[#005B46]"
                  />
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 leading-snug">
                  🛡️ <strong>Encrypted & Privacy-Preserved:</strong> Aadhaar numbers are never stored in plain text. Only a verifiable credential token is maintained.
                </div>
              </div>

              {/* Action Buttons: Verify Now vs. Skip for Now */}
              <div className="space-y-2.5 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={isSubmitting || isVerifyingKyc}
                    onClick={handleVerifyKycAndRegister}
                    className="w-full h-12 rounded-xl bg-[#087A5B] hover:bg-[#00664F] text-white font-bold flex items-center justify-center gap-2 text-xs sm:text-sm transition-all shadow-xs cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isVerifyingKyc ? 'Verifying Identity...' : 'Verify Now'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting || isVerifyingKyc}
                    onClick={handleSkipKycAndRegister}
                    className="w-full h-12 rounded-xl border border-[#DCE4DE] bg-white hover:bg-gray-50 text-[#1E2523] font-bold flex items-center justify-center gap-1.5 text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <span>{isSubmitting ? 'Registering Account...' : 'Skip for Now'}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    disabled={isSubmitting}
                    className="text-xs font-semibold text-[#536A65] hover:text-[#005B46] flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Profile</span>
                  </button>
                  <span className="text-[11px] text-gray-400">
                    Registration will proceed in PostgreSQL
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              STEP 4: READY / COMPLETE
             ════════════════════════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <div className="text-center space-y-6 py-2">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs animate-bounceOnce">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl font-extrabold text-[#073D32]">
                  Account Created Successfully
                </h3>
                <p className="text-xs sm:text-sm text-[#536A65]">
                  Welcome, <strong className="text-[#073D32]">{fullName}</strong>
                </p>
              </div>

              {/* Registration Details Card */}
              <div className="bg-[#FBFCFA] p-5 rounded-2xl border border-[#DCE4DE] text-xs text-left space-y-2.5 max-w-md mx-auto shadow-2xs">
                <div className="flex justify-between items-center border-b border-[#E9EEEB] pb-2">
                  <span className="text-gray-500 uppercase tracking-wider font-semibold text-[10.5px]">Registration ID</span>
                  <span className="font-mono font-bold text-[#005B46] text-sm bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {assignedRegId || registeredUser?.employeeId || 'NCCT-REG-2026'}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-[#E9EEEB] pb-2">
                  <span className="text-gray-500 uppercase tracking-wider font-semibold text-[10.5px]">Account Role</span>
                  <span className="font-bold text-[#1E2523]">
                    {getRoleLabel(selectedRole)}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-[#E9EEEB] pb-2">
                  <span className="text-gray-500 uppercase tracking-wider font-semibold text-[10.5px]">Email Address</span>
                  <span className="font-medium text-[#1E2523] truncate max-w-[220px]">
                    {email}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-gray-500 uppercase tracking-wider font-semibold text-[10.5px]">e-KYC Status</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${eKycStatus === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                    }`}>
                    {eKycStatus === 'VERIFIED' ? 'Verified' : 'Not Verified (Pending)'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-500 max-w-md mx-auto">
                You can now log in to VikasSetu using your <strong>Email</strong> or <strong>Registration ID</strong> and password.
              </p>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full max-w-md h-12 bg-[#087A5B] hover:bg-[#00664F] text-white font-bold rounded-xl shadow transition-all mx-auto flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <span>Continue to Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </PublicLayout>
  );
};

export default SignupView;
