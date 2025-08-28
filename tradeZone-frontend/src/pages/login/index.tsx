import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { loginUser } from '../../redux/slices/authSlice';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { error } = useAppSelector((state) => state.auth);

  // Load saved credentials on component mount
  // useEffect(() => {
  //   // Optionally load saved credentials here if you implement that utility
  // }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const resultAction = await dispatch(loginUser({ email, password }));
      if (loginUser.fulfilled.match(resultAction)) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Error is already handled by Redux slice, no need to refresh page
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-md w-full space-y-8">
        {/* Header with Theme Toggle */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className={`text-center text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Sign in to your account
            </h2>
            <p className={`mt-2 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Welcome to TradeZone
            </p>
          </div>
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isDarkMode ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              )}
            </svg>
          </button>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg ${isDarkMode ? 'bg-red-900 border-red-700 text-red-200' : ''}`}>
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                  isDarkMode 
                    ? 'border-gray-700 text-white bg-gray-800 placeholder-gray-400' 
                    : 'border-gray-300 text-gray-900 bg-white placeholder-gray-500'
                }`}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                  isDarkMode 
                    ? 'border-gray-700 text-white bg-gray-800 placeholder-gray-400' 
                    : 'border-gray-300 text-gray-900 bg-white placeholder-gray-500'
                }`}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Remember Me and Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              />
              <label htmlFor="remember-me" className={`ml-2 block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className={`font-medium hover:text-blue-500 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                Forgot your password?
              </a>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Don't have an account?{' '}
              <a href="#" className={`font-medium hover:text-blue-500 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                Sign up
              </a>
            </p>
          </div>
        </form>

        {/* Demo Credentials */}
        <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'}`}>
          <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Demo Credentials:
          </h3>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Email: demo@example.com<br />
            Password: password123
          </p>
        </div>
      </div>
    </div>
  );
}
