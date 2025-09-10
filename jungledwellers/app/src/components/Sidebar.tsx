'use client';

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  MapPin, 
  Calendar, 
  FileText, 
  Users, 
  UserCheck,
  File, 
  TrendingUp 
} from "lucide-react";

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Safaris', href: '/safaris', icon: MapPin },
  { name: 'Bookings', href: '/bookings', icon: Calendar },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Staff', href: '/users', icon: UserCheck },
  { name: 'Templates', href: '/templates', icon: File },
  { name: 'Reports', href: '/reports', icon: TrendingUp },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Image
          src="/JD - Logo 1.png"
          alt="Jungle Dwellers Logo"
          width={140}
          height={50}
          className="h-12 w-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        <div className="px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const IconComponent = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-green-100 text-green-800 border-r-2 border-green-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <IconComponent className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">JD</span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">Jungle Dwellers</p>
            <p className="text-xs text-gray-500">Admin User</p>
          </div>
        </div>
      </div>
    </div>
  );
}
