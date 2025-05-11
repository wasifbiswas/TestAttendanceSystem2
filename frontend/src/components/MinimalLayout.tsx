import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface MinimalLayoutProps {
  children: React.ReactNode;
}

const MinimalLayout: React.FC<MinimalLayoutProps> = ({ children }) => {
  const { user } = useAuthStore();

  // Only show layout if user is logged in
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* No sidebar or header */}
      <div className="flex flex-col flex-1 w-full">
        {/* Main content */}
        <main className="h-full overflow-y-auto">
          <div className="container px-3 py-4 mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MinimalLayout;
