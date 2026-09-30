import { Info, Zap, Globe, Shield } from 'lucide-react';

export function About() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-8">
        <Info className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">About XCITYDAO</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Mission</h2>
          <p className="text-gray-600 dark:text-gray-300 dark:text-gray-600 leading-relaxed">
            XCITYDAO is a decentralized identity grid that empowers creators and communities to establish their presence on the Web3 ecosystem. We believe that digital identity should be owned, not rented.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-emerald-200 dark:border-emerald-800 p-6">
            <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-3" />
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Decentralized</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-600">Owned by the community, not by a central authority.</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-blue-200 dark:border-blue-800 dark:border-blue-900/30 p-6">
            <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-3" />
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Global</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-600">Connect with creators and communities worldwide.</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-purple-200 dark:border-purple-800 dark:border-purple-900/30 p-6">
            <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-3" />
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Secure</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-600">Your identity and assets are fully in your control.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Purchase blocks on the grid</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Each block has a unique position and price</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Create your digital identity</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Add profile information, avatar, and bio</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Connect with the community</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Share your works and social links</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-emerald-200 dark:border-emerald-800 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Grid Specifications</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-300 dark:text-gray-600">Total Blocks</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">1,188</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-300 dark:text-gray-600">Grid Layout</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">12×99</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-300 dark:text-gray-600">Min Price</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">$99</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-300 dark:text-gray-600">Max Price</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">$1,286</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
