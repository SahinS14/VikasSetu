import React, { useState } from 'react';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, Building2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PublicLayout } from '../../components/layout/PublicLayout';

export const ForgotPasswordView: React.FC = () => {
  const { navigate } = useApp();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <PublicLayout>
      <div className="max-w-md mx-auto w-full px-4 py-12">
        <div className="bg-white rounded-3xl border border-govText-border shadow-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1.5 border-b border-gray-100 pb-4">
            <h1 className="text-2xl font-extrabold text-govText-primary">
              Reset Password
            </h1>
            <p className="text-xs text-govText-secondary">
              Enter your registered official or society email address
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-govText-primary uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="candidate@pacs.gov.in"
                    className="w-full h-12 px-3.5 pl-10 rounded-xl border border-govText-border bg-govBg focus:bg-white focus:outline-none focus:ring-2 focus:ring-govTeal-600 text-sm"
                    required
                  />
                  <Mail className="w-4 h-4 text-govText-muted absolute left-3.5 top-4" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold rounded-xl shadow flex items-center justify-center gap-2 text-sm"
              >
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-govText-secondary hover:text-govTeal-800 pt-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Login</span>
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-base text-govText-primary">
                Password Reset Instructions Sent
              </h3>
              <p className="text-xs text-govText-secondary leading-relaxed">
                A secure login reset token has been dispatched to <strong>{email}</strong>.
              </p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full h-11 bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold rounded-xl text-xs shadow"
              >
                Return to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};
