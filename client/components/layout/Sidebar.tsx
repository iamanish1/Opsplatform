'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  FolderKanban,
  FileText,
  BarChart3,
  Briefcase,
  MessageSquare,
  Users,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const defaultNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Lessons', href: '/dashboard/lessons', icon: BookOpen },
  { name: 'Projects', href: '/dashboard/project', icon: FolderKanban },
  { name: 'Submissions', href: '/dashboard/submission', icon: FileText },
  { name: 'Score', href: '/dashboard/score', icon: BarChart3 },
  { name: 'Portfolio', href: '/dashboard/portfolio', icon: Briefcase },
  { name: 'Interviews', href: '/dashboard/interviews', icon: MessageSquare },
];

interface NavItem {
  title: string;
  href: string;
  icon: string | React.ComponentType<any>;
}

interface SidebarProps {
  navItems?: NavItem[];
}

export function Sidebar({ navItems }: SidebarProps = {}) {
  const navigation = navItems || defaultNavigation;
  
  // Map icon strings to components
  const iconMap: Record<string, React.ComponentType<any>> = {
    LayoutDashboard,
    BookOpen,
    FolderKanban,
    FileText,
    BarChart3,
    Briefcase,
    MessageSquare,
    Users,
  };
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col w-64">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-sidebar-foreground">DevHubs</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              const IconComponent = typeof item.icon === 'string' 
                ? iconMap[item.icon] || LayoutDashboard
                : item.icon;
              const itemTitle = 'name' in item ? item.name : item.title;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                  onClick={() => {
                    // Close sidebar on mobile when navigating
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <IconComponent className="h-5 w-5" />
                  <span>{itemTitle}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}

