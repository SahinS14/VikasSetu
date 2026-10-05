import React, { useState } from 'react';
import { ShieldCheck, CheckCircle, Fingerprint, Lock, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SimulatedBadge } from './SimulatedBadge';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const EkycModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { currentUser, verifyEkyc, t } = useApp();
  const [aadhaarInput, setAadhaarInput] = useState(currentUser.aadhaarMock?.replace(/[^0-9]/g, '') || '548921894589');
  const [step, setStep] = useState<'aadhaar' | 'otp' | 'success'>('aadhaar');
  const [otp, setOtp] = useState('123456');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (aadhaarInput.length < 12) {
      alert('Please enter a 12-digit mock Aadhaar number');
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setStep('otp');
    }, 600);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      verifyEkyc(aadhaarInput);
      setStep('success');
      setTimeout(() => {
        onClose();
        setStep('aadhaar');
      }, 1400);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-govTeal-200 w-full max-w-md overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-govTeal-700 to-govTeal-800 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Fingerprint className="w-6 h-6 text-saffron-400" />
            <h3 className="font-bold text-lg">{t.auth.ekycTitle}</h3>
          </div>
          <p className="text-xs text-govTeal-100">{t.auth.ekycDesc}</p>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <SimulatedBadge className="w-full justify-center" />
          </div>

          {step === 'aadhaar' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-govText-secondary mb-1.5 uppercase tracking-wider">
                  {t.auth.aadhaarNumber}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={12}
                    value={aadhaarInput}
                    onChange={(e) => setAadhaarInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="5489 2189 4589"
                    className="w-full px-3.5 py-2.5 text-base font-mono tracking-widest rounded-lg border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600"
                    required
                  />
                  <Lock className="w-4 h-4 text-govText-muted absolute right-3 top-3.5" />
                </div>
                <p className="text-[11px] text-govText-muted mt-1.5">
                  Demo simulation: Any 12 digits succeed. Data is not transmitted externally.
                </p>
              </div>

              <div className="bg-govTeal-50 p-3.5 rounded-lg border border-govTeal-200 text-xs text-govTeal-900">
                <p className="font-medium">Selected Trainee Profile:</p>
                <p className="font-bold text-sm text-govTeal-800">{currentUser.name}</p>
                <p className="text-[11px] text-govTeal-700">{currentUser.cooperativeAffiliation}</p>
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-2.5 bg-govTeal-600 hover:bg-govTeal-700 text-white font-semibold rounded-lg shadow transition-all flex items-center justify-center gap-2"
              >
                {isVerifying ? 'Generating Mock OTP...' : 'Get Demo OTP'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-900">
                <span className="font-semibold">Simulated OTP Sent:</span> A 6-digit mock OTP is auto-filled for instant verification.
              </div>

              <div>
                <label className="block text-xs font-semibold text-govText-secondary mb-1.5 uppercase tracking-wider">
                  Enter 6-Digit OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full text-center tracking-[0.5em] text-xl font-mono py-2.5 rounded-lg border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600 font-bold"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white font-semibold rounded-lg shadow transition-all flex items-center justify-center gap-2"
              >
                {isVerifying ? 'Verifying with Mock UIDAI...' : t.auth.verifyOtp}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-govText-primary">e-KYC Verified Successfully!</h4>
              <p className="text-xs text-govText-secondary">
                Mock Aadhaar token linked to cooperative trainee ID <span className="font-mono font-semibold">{currentUser.id}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
