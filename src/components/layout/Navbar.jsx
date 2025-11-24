'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, GraduationCap } from 'lucide-react';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navigation = [
    { name: 'Tableau de bord', href: '/' },
    { name: 'Élèves', href: '/eleves' },
    { name: 'Familles', href: '/familles' },
    { name: 'Paiements', href: '/paiements' },
    { name: 'Moratoires', href: '/moratoires' },
  ];
  
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-primary-600 p-2 rounded-lg">
              <GraduationCap className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">
              Gestion Scolaire
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
