import { memo, useState } from 'react';
import LiveChart from '../../components/LiveChart';
import Header from '../../layouts/Header';
import Chat from '../dashboard/components/Chat';
import Sidebar from '../../components/Sidebar';
import { useSettings } from '../../contexts/SettingsContext';

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

const Zone = memo(function Zone() {
  const { settings } = useSettings();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Use settings for theme
  const isDarkMode = settings.theme === 'dark';

  return (
    <div className={`h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex flex-col`}>
      {/* Top Header with Logout */}
      <Header 
        onlineUsers={onlineUsers} 
        sidebarOpen={sidebarOpen} 
        onSidebarToggle={toggleSidebar} 
      />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main Content - Chart and Chat */}
      <div className="flex-1 flex" style={{height: "100%"}}>
        {/* Chart Section - 70% */}
        <div className="w-[70%]">
          <LiveChart key="live-chart" />
        </div>

        {/* Chat Section - 30% */}
        <Chat onlineUsers={onlineUsers} setOnlineUsers={setOnlineUsers} />
      </div>
    </div>
  );
});

export default Zone;
