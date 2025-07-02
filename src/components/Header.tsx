import React from 'react';
import { Package, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const location = useLocation();
  const isAdmin = location.pathname.includes('/admin');

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
            <span className="text-xl sm:text-2xl font-bold text-gray-900">Trackfy</span>
          </Link>
          
          <nav className="flex items-center space-x-2 sm:space-x-4">
            <Link
              to="/"
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                !isAdmin
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Rastreamento
            </Link>
            <Link
              to="/admin"
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1 ${
                isAdmin
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Admin</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;