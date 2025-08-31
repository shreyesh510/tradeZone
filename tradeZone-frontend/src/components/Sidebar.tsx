import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar = memo(function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<'settings' | null>(null);

  // Use settings for theme
  const isDarkMode = settings.theme === 'dark';

  const handleTabClick = (tab: 'settings') => {
    if (activeTab === tab) {
      setActiveTab(null);
    } else {
      setActiveTab(tab);
    }
  };

  const goToZone = () => {
    navigate('/zone');
    onToggle(); // Close sidebar after navigation
  };

  const goToSettings = () => {
    navigate('/settings');
    onToggle(); // Close sidebar after navigation
  };

  return (
    <>
      {/* Backdrop Overlay */}
      {isOpen && (
        <div 
          className={`fixed inset-0 z-40 transition-opacity duration-300 ${
            isDarkMode ? 'bg-black bg-opacity-50' : 'bg-gray-900 bg-opacity-30'
          }`}
          onClick={onToggle}
        />
      )}

      {/* Drawer Sidebar */}
      <div className={`fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 transition-transform duration-300 ease-in-out shadow-xl w-64 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } ${
        isDarkMode 
          ? 'bg-gray-800 border-r border-gray-700' 
          : 'bg-white border-r border-gray-200'
      }`}>
        
        {/* Drawer Header */}
        <div className={`p-4 border-b ${
          isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Menu</h2>
            <button
              onClick={onToggle}
              className={`p-1 rounded transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Drawer Navigation */}
        <div className={`flex flex-col overflow-y-auto ${
          isDarkMode ? '' : 'bg-white'
        }`}>
          {/* Zone Option */}
          <button
            onClick={goToZone}
            className={`flex items-center justify-between px-4 py-4 text-left transition-all duration-200 w-full ${
              isDarkMode 
                ? 'bg-transparent hover:bg-gray-700' 
                : 'bg-transparent hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Zone</span>
            </div>
            <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Settings Option */}
          <button
            onClick={goToSettings}
            className={`flex items-center justify-between px-4 py-4 text-left transition-all duration-200 w-full ${
              isDarkMode 
                ? 'bg-transparent hover:bg-gray-700' 
                : 'bg-transparent hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Settings</span>
            </div>
            <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>


    </>
  );
});

export default Sidebar;
