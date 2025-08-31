import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../redux/hooks';
import { logoutUser } from '../../redux/slices/authSlice';
import { 
  useSettings, 
  cryptoOptions, 
  timeframeOptions, 
  chartStyleOptions 
} from '../../contexts/SettingsContext';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { settings, updateSettings, resetSettings, saveSettings } = useSettings();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const handleSave = () => {
    saveSettings();
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  };

  const handleReset = () => {
    resetSettings();
    setShowResetConfirm(false);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  };

  const goBack = () => {
    navigate('/zone');
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/');
  };

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Header */}
      <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={goBack}
              className={`p-2 rounded-lg transition-colors ${
                settings.theme === 'dark' 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className={`text-2xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Settings
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Header Save Button */}
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Save</span>
            </button>
          
            {/* Save Success Notification */}
            {showSaveSuccess && (
              <div className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Settings saved!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Appearance Settings */}
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6`}>
            <h2 className={`text-xl font-semibold mb-6 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Appearance
            </h2>
            
            {/* Theme Selection */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-3 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Theme
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateSettings({ theme: 'dark' })}
                  className={`p-4 rounded-lg border transition-all ${
                    settings.theme === 'dark'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : settings.theme === 'dark' 
                        ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' 
                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-800 rounded border border-gray-600"></div>
                    <span className={settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}>Dark</span>
                  </div>
                </button>
                
                <button
                  onClick={() => updateSettings({ theme: 'light' })}
                  className={`p-4 rounded-lg border transition-all ${
                    settings.theme === 'light'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : settings.theme === 'dark' 
                        ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' 
                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white rounded border border-gray-300"></div>
                    <span className={settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}>Light</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Chart Settings */}
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6`}>
            <h2 className={`text-xl font-semibold mb-6 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Chart Settings
            </h2>
            
            {/* Default Cryptocurrency */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-3 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Default Cryptocurrency
              </label>
              <select
                value={settings.defaultCrypto}
                onChange={(e) => updateSettings({ defaultCrypto: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  settings.theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {cryptoOptions.map(crypto => (
                  <option key={crypto.value} value={crypto.value}>
                    {crypto.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Default Timeframe */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-3 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Default Timeframe
              </label>
              <select
                value={settings.defaultTimeframe}
                onChange={(e) => updateSettings({ defaultTimeframe: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  settings.theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {timeframeOptions.map(timeframe => (
                  <option key={timeframe.value} value={timeframe.value}>
                    {timeframe.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Chart Style */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-3 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Chart Style
              </label>
              <select
                value={settings.chartStyle}
                onChange={(e) => updateSettings({ chartStyle: e.target.value as any })}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  settings.theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {chartStyleOptions.map(style => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preferences */}
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6`}>
            <h2 className={`text-xl font-semibold mb-6 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Preferences
            </h2>
            
            {/* Notifications Toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className={`text-sm font-medium ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Enable Notifications
                  </label>
                  <p className={`text-xs ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Receive chat and trading alerts
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ notifications: !settings.notifications })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    settings.notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Auto Save Toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className={`text-sm font-medium ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Auto Save Settings
                  </label>
                  <p className={`text-xs ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Automatically save changes
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ autoSave: !settings.autoSave })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    settings.autoSave ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.autoSave ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6`}>
            <h2 className={`text-xl font-semibold mb-6 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Actions
            </h2>
            
            <div className="space-y-4">
              {/* Reset Button */}
              <button
                onClick={() => setShowResetConfirm(true)}
                className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  settings.theme === 'dark'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Reset to Defaults</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  settings.theme === 'dark'
                    ? 'bg-gray-700 text-red-400 hover:bg-gray-600 border border-red-400'
                    : 'bg-gray-100 text-red-600 hover:bg-gray-200 border border-red-300'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-md mx-4`}>
            <h3 className={`text-lg font-semibold mb-4 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Reset Settings
            </h3>
            <p className={`mb-6 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Are you sure you want to reset all settings to their default values? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowResetConfirm(false)}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  settings.theme === 'dark'
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
