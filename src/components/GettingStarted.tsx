import { BookOpen, Grid3x3, Wallet, Users, Zap } from 'lucide-react';

export function GettingStarted() {
  const steps = [
    {
      title: 'Understand the Grid',
      description: 'XCITYDAO is a 12x99 pixel grid. Each block has a unique price based on its position.',
      icon: Grid3x3,
    },
    {
      title: 'Create Your Wallet',
      description: 'Purchase your first block to create a decentralized wallet with a 12-word mnemonic.',
      icon: Wallet,
    },
    {
      title: 'Build Your Identity',
      description: 'Add your profile picture, bio, and social links to establish your digital presence.',
      icon: Users,
    },
    {
      title: 'Connect & Share',
      description: 'Customize your blocks with images and connect with the Web3 community.',
      icon: Zap,
    },
  ];

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Getting Started with XCITYDAO</h1>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 mb-8">
        <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
          XCITYDAO is a decentralized identity grid where you can own digital space, build your presence, and connect with the Web3 ecosystem. Follow these steps to get started.
        </p>
      </div>

      <div className="grid gap-6">
        {steps.map((step, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <step.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Step {i + 1}: {step.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 dark:text-gray-600">{step.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-gray-800 dark:to-gray-700 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-2">Pricing Model</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-600 mb-4">
          Block prices increase from bottom-right to top-left. The most expensive blocks are in the top-left corner, while the cheapest are in the bottom-right.
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-emerald-700 dark:text-emerald-400">Bottom-right Block</p>
            <p className="text-emerald-600 dark:text-emerald-400 font-bold">$99</p>
          </div>
          <div>
            <p className="font-medium text-emerald-700 dark:text-emerald-400">Top-left Block</p>
            <p className="text-emerald-600 dark:text-emerald-400 font-bold">$1,286</p>
          </div>
        </div>
      </div>
    </div>
  );
}
