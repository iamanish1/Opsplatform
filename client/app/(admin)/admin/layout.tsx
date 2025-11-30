'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';

const adminNavItems = [
  { title: 'Dashboard', href: '/admin/dashboard', icon: 'LayoutDashboard' },
  { title: 'Users', href: '/admin/users', icon: 'Users' },
  { title: 'Projects', href: '/admin/projects', icon: 'FolderKanban' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="ADMIN">
      <div className="flex h-screen overflow-hidden">
        <Sidebar navItems={adminNavItems} />
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

