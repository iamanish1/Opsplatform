'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// Mock data - in real app, this would come from an API
export function UserTable() {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        User management table would be displayed here.
        This would show a list of all users with options to edit, delete, or change roles.
      </div>
      <div className="border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-left">Badge</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-4">-</td>
              <td className="p-4">-</td>
              <td className="p-4">-</td>
              <td className="p-4">-</td>
              <td className="p-4">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

