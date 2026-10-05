import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Users,
  Search,
  Filter,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { PageContainer } from '../../components/layout/PageContainer';
import { api } from '../../lib/api';
import { Institute } from '../../types';

export const InstitutesDirectory: React.FC = () => {
  const { institutes, navigate } = useApp();
  const [dbInstitutes, setDbInstitutes] = useState<Institute[]>([]);
  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem('ss_inst_search') || '');
  const [selectedType, setSelectedType] = useState<string>(() => sessionStorage.getItem('ss_inst_type') || 'all');

  useEffect(() => {
    api.institute.getInstitutes()
      .then(res => {
        if (Array.isArray(res) && res.length > 0) {
          setDbInstitutes(res);
        } else {
          setDbInstitutes(institutes);
        }
      })
      .catch(() => setDbInstitutes(institutes));
  }, [institutes]);

  const displayedInstitutes = dbInstitutes.length > 0 ? dbInstitutes : institutes;

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    sessionStorage.setItem('ss_inst_search', val);
  };

  const handleTypeChange = (val: string) => {
    setSelectedType(val);
    sessionStorage.setItem('ss_inst_type', val);
  };

  const filteredInstitutes = displayedInstitutes.filter(inst => {
    const matchesSearch =
      inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.director.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || inst.type === selectedType;

    return matchesSearch && matchesType;
  });

  return (
    <PageContainer>
      <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-govText-border shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-govTeal-700 uppercase tracking-wider">
              National NCCT Network
            </span>
            <SimulatedBadge text="20 Federated Autonomous Institutes" />
          </div>
          <h2 className="text-2xl font-extrabold text-govText-primary">
            NCCT Institutes Directory (VAMNICOM + 5 RICMs + 14 ICMs)
          </h2>
          <p className="text-xs text-govText-secondary mt-1">
            Complete registry of training establishments under Ministry of Cooperation, Government of India.
          </p>
        </div>

        <div className="bg-govTeal-50 border border-govTeal-200 px-4 py-2 rounded-xl text-xs text-govTeal-900 font-bold">
          {displayedInstitutes.length} Institutes Connected to Cloud Hub
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-govText-border shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search institute name, city, state, or director..."
            className="w-full px-3.5 py-2 pl-9 rounded-lg border border-govText-border text-xs focus:outline-none focus:ring-2 focus:ring-govTeal-600 bg-govBg"
          />
          <Search className="w-4 h-4 text-govText-muted absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-govText-secondary">
            <Filter className="w-4 h-4 text-govTeal-600" />
            <span>Type:</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['all', 'VAMNICOM', 'RICM', 'ICM'].map(t => (
              <button
                key={t}
                onClick={() => handleTypeChange(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedType === t
                    ? 'bg-govTeal-600 text-white shadow-sm'
                    : 'bg-govBg hover:bg-gray-100 text-govText-secondary'
                }`}
              >
                {t === 'all' ? 'All (20)' : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Institutes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInstitutes.map(inst => (
          <div
            key={inst.id}
            onClick={() => navigate(`/super-admin/institutes/${inst.id}`)}
            className="bg-white rounded-2xl border border-govText-border shadow-sm hover:shadow-md hover:border-govTeal-500 transition-all p-6 flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                  inst.type === 'VAMNICOM'
                    ? 'bg-purple-100 text-purple-900 border border-purple-300'
                    : inst.type === 'RICM'
                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}>
                  {inst.type}
                </span>

                <span className="text-xs font-semibold text-govTeal-700 bg-govTeal-50 px-2 py-0.5 rounded">
                  {inst.activeCount} Trainees Active
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-govText-primary leading-snug">
                  {inst.name}
                </h3>
                <p className="text-xs text-govText-secondary font-devanagari mt-0.5">
                  {inst.nameHi}
                </p>
              </div>

              <div className="bg-govBg p-3.5 rounded-xl border border-gray-100 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-govText-secondary">
                  <MapPin className="w-4 h-4 text-govTeal-600 flex-shrink-0" />
                  <span>{inst.city}, {inst.state}</span>
                </div>
                <div className="flex items-center gap-2 text-govText-secondary">
                  <Users className="w-4 h-4 text-govTeal-600 flex-shrink-0" />
                  <span>Director: <strong className="text-govText-primary">{inst.director}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-govText-secondary">
                  <Mail className="w-4 h-4 text-govTeal-600 flex-shrink-0" />
                  <span className="truncate">{inst.contactEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-govText-secondary">
                  <Phone className="w-4 h-4 text-govTeal-600 flex-shrink-0" />
                  <span>{inst.contactPhone}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-govText-muted">
              <span>Sanctioned Capacity: <strong className="text-govText-primary">{inst.capacity}</strong></span>
              <span className="text-govTeal-700 font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                View Institute <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </div>

          </div>
        ))}
      </div>

      </div>
    </PageContainer>
  );
};
