import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  X,
  UserCheck,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../../components/layout/PageContainer';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { UserRole, User } from '../../types';
import { api } from '../../lib/api';

export const UserManagementView: React.FC = () => {
  const { users, addUser, toggleUserStatus, institutes } = useApp();

  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State for Add User
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+91 98220 54321');
  const [newRole, setNewRole] = useState<UserRole>('institute_admin');
  const [newInstituteId, setNewInstituteId] = useState<string>(institutes[0]?.id || 'inst-vamnicom');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.users.getAll();
      setDbUsers(res);
    } catch (err) {
      console.warn('Fallback to local users list:', err);
      setDbUsers(users);
    } finally {
      setLoading(false);
    }
  }, [users]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const displayedUsers = dbUsers.length > 0 ? dbUsers : users;

  const filteredUsers = displayedUsers.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.cooperativeAffiliation && user.cooperativeAffiliation.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    try {
      const created = await api.users.create({
        name: newName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim(),
        role: newRole,
        instituteId: (newRole === 'institute_admin' || newRole === 'faculty') ? newInstituteId : undefined,
        cooperativeAffiliation: newRole === 'trainee' ? 'Shri Datta PACS, Nashik' : undefined,
      });

      setDbUsers(prev => [created, ...prev]);
      addUser(created);
      setSuccessMessage(`Successfully provisioned ${created.name} as ${created.role.replace('_', ' ').toUpperCase()} in PostgreSQL!`);
      setIsAddModalOpen(false);
      setNewName('');
      setNewEmail('');

      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err: any) {
      alert(err?.message || 'Failed to provision user in database');
    }
  };

  const handleToggleUser = async (userId: string, currentStatus: string) => {
    const newStatus: 'active' | 'deactivated' = currentStatus === 'active' ? 'deactivated' : 'active';
    try {
      await api.users.updateStatus(userId, newStatus === 'deactivated' ? 'suspended' : 'active');
      setDbUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err) {
      console.error('API toggle failed:', err);
    }
    toggleUserStatus(userId);
  };

  const getInstituteName = (instId?: string) => {
    if (!instId) return null;
    const inst = institutes.find(i => i.id === instId);
    return inst ? `${inst.name} (${inst.city})` : instId;
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'institute_admin':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'faculty':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'employer':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'trainee':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6 animate-fadeIn pb-16">
        {/* Header Banner */}
        <div className="bg-white p-6 rounded-2xl border border-govText-border shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-govTeal-700 uppercase tracking-wider">
                Platform Governance
              </span>
              <SimulatedBadge text="Ministry Role Provisioning" />
            </div>
            <h1 className="text-2xl font-extrabold text-govText-primary mt-1">
              User & Role Management
            </h1>
            <p className="text-xs text-govText-secondary mt-1 max-w-2xl leading-relaxed">
              Super Admin central registry for provisioning Institute Admins for new institutes and managing platform role credentials across all 20 NCCT nodes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0B6E4F] hover:bg-[#085A40] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer active:scale-95 min-h-[44px]"
          >
            <UserPlus className="w-4 h-4" />
            Provision / Add User
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-semibold text-emerald-800 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-govText-border shadow-sm flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user name, email, or affiliated organisation..."
              className="w-full px-3.5 py-2 pl-9 rounded-xl border border-govText-border text-xs focus:outline-none focus:ring-2 focus:ring-govTeal-600 bg-govBg"
            />
            <Search className="w-4 h-4 text-govText-muted absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-4 h-4 text-govTeal-600 hidden sm:block" />
            {[
              { id: 'all', label: 'All Roles' },
              { id: 'institute_admin', label: 'Institute Admins' },
              { id: 'faculty', label: 'Faculty' },
              { id: 'employer', label: 'Employers' },
              { id: 'trainee', label: 'Trainees' },
              { id: 'super_admin', label: 'Super Admins' },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setRoleFilter(r.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === r.id
                    ? 'bg-govTeal-600 text-white shadow-xs'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* User Table (Desktop >= 768px) */}
        <div className="bg-white rounded-2xl border border-govText-border shadow-sm overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs text-govText-primary">
              <thead className="bg-[#F8FAF8] border-b border-gray-200 text-[11px] font-bold text-govText-secondary uppercase">
                <tr>
                  <th className="p-3.5">User Details</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Assigned Node / Cooperative</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map(user => {
                  const isActive = (user.status || 'active') === 'active';
                  const instName = getInstituteName(user.instituteId);

                  return (
                    <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                            alt={user.name}
                            className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-2xs flex-shrink-0"
                          />
                          <div>
                            <div className="font-bold text-govText-primary">{user.name}</div>
                            <div className="text-[11px] text-govText-muted">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${getRoleBadgeStyle(user.role)}`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-govText-secondary">
                        {instName || user.cooperativeAffiliation || 'Ministry Central Registry'}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isActive ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                          {isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {user.role !== 'super_admin' && (
                          <button
                            type="button"
                            onClick={() => handleToggleUser(user.id, user.status || 'active')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-gray-100 hover:bg-rose-50 text-gray-700 hover:text-rose-700 border border-gray-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {isActive ? 'Deactivate' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (< 768px) */}
          <div className="block md:hidden divide-y divide-gray-100">
            {filteredUsers.map(user => {
              const isActive = (user.status || 'active') === 'active';
              const instName = getInstituteName(user.instituteId);

              return (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-govText-primary">{user.name}</h4>
                        <p className="text-xs text-govText-secondary">{user.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getRoleBadgeStyle(user.role)}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-govText-secondary bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <span className="text-[10px] text-govText-muted block">Affiliated Node:</span>
                    {instName || user.cooperativeAffiliation || 'Ministry Central Registry'}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {isActive ? 'Active' : 'Deactivated'}
                    </span>

                    {user.role !== 'super_admin' && (
                      <button
                        type="button"
                        onClick={() => handleToggleUser(user.id, user.status || 'active')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-gray-100 text-gray-700 hover:text-rose-700'
                            : 'bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        {isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add User Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-xl border border-gray-200 space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-base text-govText-primary flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-govTeal-700" />
                    Provision New Platform User
                  </h3>
                  <p className="text-xs text-govText-secondary mt-0.5">
                    Assign role credentials and administrative node authority
                  </p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-govText-primary mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Dr. Sudhir Mahajan"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] bg-[#FBFDFB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-govText-primary mb-1">
                    Official Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="e.g. admin.bhopal@ncct.gov.in"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] bg-[#FBFDFB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-govText-primary mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] bg-[#FBFDFB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-govText-primary mb-1">
                    Platform Role *
                  </label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] bg-white font-medium"
                  >
                    <option value="institute_admin">Institute Admin (Autonomous Node Officer)</option>
                    <option value="faculty">Faculty Instructor</option>
                    <option value="employer">Cooperative Recruiter / Employer</option>
                    <option value="trainee">Cooperative Trainee</option>
                  </select>
                </div>

                {/* Institute Assignment dropdown: only for institute_admin and faculty */}
                {(newRole === 'institute_admin' || newRole === 'faculty') && (
                  <div>
                    <label className="block text-xs font-semibold text-govText-primary mb-1">
                      Assigned NCCT Institute Node *
                    </label>
                    <select
                      value={newInstituteId}
                      onChange={e => setNewInstituteId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] bg-white font-medium"
                    >
                      {institutes.map(inst => (
                        <option key={inst.id} value={inst.id}>
                          {inst.name} ({inst.city}, {inst.type})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-govTeal-800 font-medium mt-1">
                      This grants administrative access over admissions, sessions, and hostel blocks for the selected institute node.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#0B6E4F] hover:bg-[#085A40] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer active:scale-95 min-h-[44px]"
                  >
                    Provision User
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
