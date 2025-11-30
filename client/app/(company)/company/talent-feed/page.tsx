'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { talentService } from '@/services/talent.service';
import { TalentCard } from '@/components/company/TalentCard';
import { TalentFilters } from '@/components/company/TalentFilters';
import { InterviewRequestModal } from '@/components/company/InterviewRequestModal';

export default function TalentFeedPage() {
  const [filters, setFilters] = useState({
    badge: undefined as 'RED' | 'YELLOW' | 'GREEN' | undefined,
    minScore: undefined as number | undefined,
    maxScore: undefined as number | undefined,
    skills: [] as string[],
    page: 1,
    limit: 20,
  });
  const [selectedTalent, setSelectedTalent] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['talent-feed', filters],
    queryFn: () => talentService.getTalentFeed(filters),
  });

  const talents = data?.data?.talents || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Talent Feed</h1>
        <p className="text-muted-foreground">
          Discover and connect with talented developers
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <TalentFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : talents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No talent found matching your filters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {talents.map((talent) => (
                <TalentCard
                  key={talent.id}
                  talent={talent}
                  onRequestInterview={() => setSelectedTalent(talent.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedTalent && (
        <InterviewRequestModal
          userId={selectedTalent}
          onClose={() => setSelectedTalent(null)}
        />
      )}
    </div>
  );
}

