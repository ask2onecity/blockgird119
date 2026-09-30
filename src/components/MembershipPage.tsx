import { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { useMembership } from '../lib/membership-context';
import { Crown, Check, Gift, Blocks, Image, Link, Briefcase, Headphones } from 'lucide-react';

export function MembershipPage() {
  const { user, profile } = useAuth();
  const { loading } = useMembership();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading membership...</span>
        </div>
      </div>
    );
  }

  const features = [
    { icon: Blocks, text: 'Up to 999 blocks', included: true },
    { icon: Image, text: 'Up to 50 images per block', included: true },
    { icon: Image, text: 'Custom block images', included: true },
    { icon: Link, text: 'Social links on profile', included: true },
    { icon: Briefcase, text: 'Works showcase', included: true },
    { icon: Headphones, text: 'Priority support', included: true },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-200/50">
          <Crown className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Membership</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-8 ml-[52px]">
        XCITYDAO membership is completely free for everyone
      </p>

      {/* Free Membership Card */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 shadow-lg overflow-hidden">
        {/* Top gradient bar */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 to-green-600" />

        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
              <Gift className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Free Member</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">All features, no cost</p>
            </div>
          </div>

          {/* Price */}
          <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold text-emerald-700 dark:text-emerald-400">$0</span>
              <span className="text-lg text-emerald-600 dark:text-emerald-400 font-medium">/forever</span>
            </div>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">
              No credit card required. No hidden fees. No trial period.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-8">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Everything included</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((feat, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <feat.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{feat.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          {user && profile ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-emerald-800">You are a member</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Signed in as {profile.email}
                  {profile.isAdmin && ' | Admin'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Sign in or create an account to become a member and access all features.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h3>
        <FAQItem question="Is membership really free?" answer="Yes! XCITYDAO membership is completely free. There are no paid tiers, no hidden costs, and no credit card required." />
        <FAQItem question="What's included in membership?" answer="All features: up to 999 blocks, 50 images per block, custom images, social links, works showcase, and priority support." />
        <FAQItem question="Do I need to connect a wallet?" answer="No, you can sign up with just an email and password. Wallet connection is optional for blockchain features." />
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{question}</span>
        <span className={`text-gray-400 dark:text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-600">{answer}</p>
        </div>
      )}
    </div>
  );
}
