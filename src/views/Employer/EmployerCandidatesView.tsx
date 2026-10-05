import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Mail,
  ExternalLink,
  Award,
  Building,
  GraduationCap,
  Send,
  CheckCircle2,
  Sparkles,
  MapPin,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SEED_USERS } from '../../data/seedData';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { PageContainer } from '../../components/layout/PageContainer';
import { GlobalModal } from '../../components/common/GlobalModal';
import { User } from '../../types';
import { api } from '../../lib/api';

export const EmployerCandidatesView: React.FC = () => {
  const { currentUser, certificates, institutes, navigate, users } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstitute, setSelectedInstitute] = useState('all');
  const [liveCandidates, setLiveCandidates] = useState<User[]>([]);

  const orgName = currentUser?.cooperativeAffiliation || 'National Cooperative Development Corporation (NCDC)';

  // Contact Modal State
  const [contactModalTrainee, setContactModalTrainee] = useState<User | null>(null);
  const [contactSubject, setContactSubject] = useState(`Interview Opportunity - ${orgName}`);
  const [contactMessage, setContactMessage] = useState(
    `Dear Trainee,\n\nWe reviewed your NCCT verified credentials and would like to invite you for an exploratory interview for open positions at ${orgName}.`
  );
  const [isContactSent, setIsContactSent] = useState(false);

  React.useEffect(() => {
    // Attempt live recruiter candidate fetch
    api.jobs.recruiterCandidates()
      .then((res: any[]) => {
        if (Array.isArray(res) && res.length > 0) {
          const mapped: User[] = res.map((r: any) => ({
            id: r.id || r.userId,
            name: r.traineeName || r.name,
            email: r.traineeEmail || r.email,
            phone: r.phone || '+91 98234 11223',
            role: 'trainee',
            languagePreference: 'en',
            instituteId: r.instituteId || 'inst-vamnicom',
            cooperativeAffiliation: r.cooperativeAffiliation || r.coop || 'Cooperative Society',
            avatarUrl: r.avatarUrl,
            isKycVerified: true,
          }));
          setLiveCandidates(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // All certified trainees (live candidates > users list > SEED_USERS)
  const candidatePool = liveCandidates.length > 0 ? liveCandidates : (users.filter(u => u.role === 'trainee').length > 0 ? users.filter(u => u.role === 'trainee') : SEED_USERS.filter(u => u.role === 'trainee'));

  // Filter candidates strictly without exposing internal Aadhaar/KYC
  const filteredCandidates = candidatePool.filter(trainee => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      trainee.name.toLowerCase().includes(query) ||
      (trainee.cooperativeAffiliation && trainee.cooperativeAffiliation.toLowerCase().includes(query));

    const matchesInst = selectedInstitute === 'all' || trainee.instituteId === selectedInstitute;
    return matchesQuery && matchesInst;
  });

  const handleOpenContact = (trainee: User) => {
    setContactModalTrainee(trainee);
    setIsContactSent(false);
    setContactSubject(`Interview Opportunity for ${trainee.name} - ${orgName}`);
    setContactMessage(
      `Dear ${trainee.name},\n\nWe were impressed by your verified NCCT credentials and your association with ${trainee.cooperativeAffiliation || 'cooperative societies'}. ${orgName} has active opportunities matching your profile.\n\nPlease let us know your availability for an introductory interaction.`
    );
  };

  const handleSendContact = (e: React.FormEvent) => {
    e.preventDefault();
    setIsContactSent(true);
    setTimeout(() => {
      setContactModalTrainee(null);
      setIsContactSent(false);
    }, 1800);
  };

  return (
    <PageContainer>
      <div className="space-y-6 animate-fadeIn pb-16">
        {/* Header Banner */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-govText-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-govTeal-700 uppercase tracking-wider">
                Cooperative Talent Bridge
              </span>
              <SimulatedBadge text="NCCT Verified Registry Access" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-govText-primary mt-1">
              Certified Trainees & Candidate Pool
            </h1>
            <p className="text-xs text-govText-secondary mt-1">
              Browse pre-screened graduates with accredited certifications in PACS ERP, Dairy AMCS, and Micro-Credit.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-govTeal-800 bg-govTeal-50 px-3.5 py-2 rounded-xl border border-govTeal-200 self-start sm:self-auto">
            <Users className="w-4 h-4 text-govTeal-600" />
            <span>{candidatePool.length} Certified Candidates Available</span>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white p-4 rounded-xl border border-govText-border shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidates by name or cooperative society..."
              className="w-full px-3.5 py-2 pl-9 rounded-lg border border-govText-border text-xs focus:outline-none focus:ring-2 focus:ring-govTeal-600 bg-govBg min-h-[42px]"
            />
            <Search className="w-4 h-4 text-govText-muted absolute left-3 top-3" />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-govTeal-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-govText-secondary whitespace-nowrap">
              Issuing Institute:
            </span>
            <select
              value={selectedInstitute}
              onChange={(e) => setSelectedInstitute(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-lg border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600 w-full sm:w-auto min-h-[42px]"
            >
              <option value="all">All 20 NCCT Institutes</option>
              {institutes.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Candidate Cards Grid */}
        {filteredCandidates.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-govText-border space-y-3">
            <Users className="w-10 h-10 text-govText-muted mx-auto" />
            <h3 className="text-sm font-bold text-govText-primary">No matching candidates found</h3>
            <p className="text-xs text-govText-secondary max-w-sm mx-auto">
              Try adjusting your search criteria or select &ldquo;All 20 NCCT Institutes&rdquo; to view the complete certified talent pool.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedInstitute('all');
              }}
              className="px-4 py-2 bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold rounded-lg text-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCandidates.map(candidate => {
              const candidateCerts = certificates.filter(c => c.userId === candidate.id);
              const inst = institutes.find(i => i.id === candidate.instituteId);

              return (
                <div
                  key={candidate.id}
                  className="bg-white rounded-2xl border border-govText-border shadow-xs hover:shadow-md hover:border-govTeal-300 transition-all p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3.5">
                    {/* Candidate Identity */}
                    <div className="flex items-center gap-3">
                      <img
                        src={candidate.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}
                        alt={candidate.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-govTeal-600 flex-shrink-0 shadow-xs"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm text-govText-primary truncate">
                          {candidate.name}
                        </h3>
                        <p className="text-xs text-govTeal-700 font-medium truncate flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 flex-shrink-0 text-govTeal-600" />
                          <span className="truncate">{candidate.cooperativeAffiliation || 'Primary Agricultural Cooperative'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Institute Affiliation (Privacy-safe metadata) */}
                    <div className="bg-govBg p-2.5 rounded-xl border border-gray-200 text-xs flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-govTeal-700 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] uppercase font-bold text-govText-muted block">
                          Trained At
                        </span>
                        <span className="font-semibold text-govText-primary truncate block">
                          {inst?.name || 'VAMNICOM (Vaikunth Mehta National Institute)'}
                        </span>
                      </div>
                    </div>

                    {/* Verified Credentials */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-govText-muted uppercase tracking-wider flex items-center gap-1">
                        <Award className="w-3 h-3 text-emerald-600" />
                        <span>Verified Credential(s):</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {candidateCerts.length > 0 ? (
                          candidateCerts.map(cert => (
                            <span
                              key={cert.id}
                              className="text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xs"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                              <span className="truncate max-w-[210px]">{cert.courseTitle}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-govText-muted italic bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                            Curriculum in-progress
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Strictly Contact & Public Verification */}
                  <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenContact(candidate)}
                      className="flex-1 py-2.5 px-3 bg-govTeal-600 hover:bg-govTeal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 min-h-[38px] cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Contact Trainee</span>
                    </button>

                    {candidateCerts.length > 0 && (
                      <button
                        onClick={() => navigate('verify_public', { certId: candidateCerts[0].id })}
                        className="p-2.5 bg-saffron-50 hover:bg-saffron-100 text-saffron-900 border border-saffron-300 rounded-xl transition-colors cursor-pointer"
                        title="Verify Certificate Authenticity"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Contact Trainee Modal */}
        <GlobalModal
          isOpen={contactModalTrainee !== null}
          onClose={() => setContactModalTrainee(null)}
          maxWidth="max-w-lg"
          ariaLabel="Contact Trainee"
        >
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-govTeal-800 to-govTeal-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-saffron-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Contact Trainee</h3>
                  <p className="text-xs text-govTeal-100">
                    Direct recruitment outreach to {contactModalTrainee?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setContactModalTrainee(null)}
                className="text-govTeal-200 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success State */}
            {isContactSent ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-govText-primary">
                  Outreach Invitation Sent!
                </h4>
                <p className="text-xs text-govText-secondary">
                  Your interview invitation has been dispatched to {contactModalTrainee?.name}&rsquo;s registered portal notifications and cooperative node.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendContact} className="p-5 sm:p-6 space-y-4">
                <div className="bg-govBg p-3 rounded-xl border border-gray-200 flex items-center gap-3 text-xs">
                  <img
                    src={contactModalTrainee?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}
                    alt={contactModalTrainee?.name}
                    className="w-10 h-10 rounded-full object-cover border border-govTeal-600"
                  />
                  <div>
                    <div className="font-bold text-govText-primary">{contactModalTrainee?.name}</div>
                    <div className="text-[11px] text-govTeal-700">{contactModalTrainee?.cooperativeAffiliation}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-govText-secondary mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-govText-secondary mb-1">
                    Message / Invitation Details
                  </label>
                  <textarea
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full p-3 text-xs rounded-lg border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600 leading-relaxed"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setContactModalTrainee(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-govText-primary text-xs font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-govTeal-600 hover:bg-govTeal-700 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Outreach Invitation</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </GlobalModal>
      </div>
    </PageContainer>
  );
};
