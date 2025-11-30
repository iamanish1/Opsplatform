'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';

const companyNavItems = [
  { title: 'Dashboard', href: '/company/dashboard', icon: 'LayoutDashboard' },
  { title: 'Talent Feed', href: '/company/talent-feed', icon: 'Users' },
  { title: 'Interviews', href: '/company/interviews', icon: 'MessageSquare' },
];

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="COMPANY">
      <div className="flex h-screen overflow-hidden">
        <Sidebar navItems={companyNavItems} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

