import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { logoutUser } from '../redux/slices/authSlice';

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

interface HeaderProps {
  onlineUsers: OnlineUser[];
}

const Header = ({ onlineUsers }: HeaderProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = useCallback(() => {
    dispatch(logoutUser());
    navigate('/');
  }, [dispatch, navigate]);

  return (
    <div className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-white">Trading Dashboard</h1>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="text-white text-sm font-medium">
              {user?.name || 'User'}
            </p>
            <p className="text-gray-400 text-xs">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="text-sm text-gray-400">
          {onlineUsers.length} online
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Header;
