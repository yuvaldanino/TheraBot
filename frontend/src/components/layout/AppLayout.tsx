import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { auth } from '../../lib/api';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Sessions', href: '/sessions' },
  { name: 'Profile', href: '/profile' },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">TheraBot</h1>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="py-6">
        {children}
      </main>
    </div>
  );
};

export default AppLayout; 