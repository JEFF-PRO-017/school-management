'use client';

/**
 * Navbar - Mobile First avec Bottom Navigation
 * Optimisé pour Android avec icônes et navigation tactile
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  GraduationCap, 
  Users, 
  DollarSign, 
  Clock,
  Menu,
  X
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Montage côté client
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Navigation principale avec icônes
  const navigation = [
    { 
      name: 'Accueil', 
      href: '/', 
      icon: Home,
      mobileOnly: false
    },
    { 
      name: 'Élèves', 
      href: '/eleves', 
      icon: GraduationCap,
      mobileOnly: false
    },
    { 
      name: 'Familles', 
      href: '/familles', 
      icon: Users,
      mobileOnly: false
    },
    { 
      name: 'Paiements', 
      href: '/paiements', 
      icon: DollarSign,
      mobileOnly: true // Seulement dans le menu
    },
    { 
      name: 'Moratoires', 
      href: '/moratoires', 
      icon: Clock,
      mobileOnly: false 
    },
  ];
  
  // Navigation principale (4 premiers pour la bottom nav)
  const mainNavigation = navigation.filter(item => !item.mobileOnly);
  
  // Vérifier si un lien est actif
  const isActive = (href) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };
  
  // Attendre le montage
  if (!mounted) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-16"></div>
      </nav>
    );
  }
  
  return (
    <>
      {/* Top Navbar - Desktop et logo mobile */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-xl shadow-md">
                <GraduationCap className="text-white" size={24} />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Gestion Scolaire
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700'
                    }`}
                  >
                    <Icon size={18} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 active:scale-95 transition-all"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white animate-fade-in">
            <div className="px-3 py-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all active:scale-95 ${
                      active
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700'
                    }`}
                  >
                    <Icon size={20} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
      
      {/* Bottom Navigation - Mobile uniquement */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        <div className="grid grid-cols-4 h-16">
          {mainNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                  active
                    ? 'text-primary-600'
                    : 'text-gray-500'
                }`}
              >
                <div className={`relative ${active ? 'scale-110' : ''} transition-transform`}>
                  <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                  {active && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full"></div>
                  )}
                </div>
                <span className={`text-xs font-medium ${active ? 'font-semibold' : ''}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* Spacer pour bottom navigation mobile */}
      <div className="md:hidden h-16"></div>
      
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}