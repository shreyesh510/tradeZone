import { memo } from 'react';

interface PageHeaderProps {
  title: string;
  isDarkMode: boolean;
  children?: React.ReactNode;
}

const PageHeader = memo<PageHeaderProps>(({ title, isDarkMode, children }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-4xl font-bold bg-gradient-to-r ${
            isDarkMode 
              ? 'from-cyan-400 via-purple-400 to-pink-400' 
              : 'from-blue-600 via-purple-600 to-indigo-600'
          } bg-clip-text text-transparent mb-2`}>
            {title}
          </h1>
          <div className={`h-1 w-32 bg-gradient-to-r ${
            isDarkMode 
              ? 'from-cyan-400 via-purple-400 to-pink-400' 
              : 'from-blue-600 via-purple-600 to-indigo-600'
          } rounded-full`}></div>
        </div>
        
        {children && (
          <div className="flex items-center space-x-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
});

PageHeader.displayName = 'PageHeader';

export default PageHeader;
