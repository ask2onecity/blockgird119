import { Settings as SettingsIcon, Moon, Bell, Lock } from 'lucide-react';
import { useState } from 'react';

export function Settings() {
  const [preferences, setPreferences] = useState({
    darkMode: false,
    notifications: true,
    emailUpdates: false,
  });

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-8">
        <SettingsIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>

      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Preferences</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800 transition-colors">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Coming soon</p>
                </div>
              </div>
              <div className="w-11 h-6 bg-gray-300 rounded-full" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800 transition-colors">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Notifications</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Get alerts for activity</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('notifications')}
                className={`w-11 h-6 rounded-full transition-colors ${
                  preferences.notifications ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white dark:bg-gray-900 transition-transform ${
                    preferences.notifications ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Privacy & Security</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800 transition-colors">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Coming soon</p>
                </div>
              </div>
              <div className="w-11 h-6 bg-gray-300 rounded-full" />
            </div>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <p className="text-sm text-amber-800">
            Your wallet is secured by your mnemonic phrase. Never share it with anyone. We never store your mnemonic on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
