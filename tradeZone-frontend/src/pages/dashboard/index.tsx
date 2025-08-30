import { memo, useState } from 'react';
import LiveChart from '../../components/LiveChart';
import Header from '../../layouts/Header';
import Chat from './components/Chat';

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

const Dashboard = memo(function Dashboard() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);


  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Top Header with Logout */}
      <Header onlineUsers={onlineUsers} />

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

export default Dashboard;
