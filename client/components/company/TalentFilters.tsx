'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TalentFilters as TalentFiltersType } from '@/services/talent.service';

interface TalentFiltersProps {
  filters: TalentFiltersType;
  onFiltersChange: (filters: TalentFiltersType) => void;
}

export function TalentFilters({ filters, onFiltersChange }: TalentFiltersProps) {
  const updateFilter = (key: keyof TalentFiltersType, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
        <CardDescription>Refine your talent search</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="badge">Badge</Label>
          <Select
            value={filters.badge || ''}
            onValueChange={(value) => updateFilter('badge', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All badges" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All badges</SelectItem>
              <SelectItem value="GREEN">Green</SelectItem>
              <SelectItem value="YELLOW">Yellow</SelectItem>
              <SelectItem value="RED">Red</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="minScore">Min Score</Label>
          <Input
            id="minScore"
            type="number"
            min="0"
            max="100"
            value={filters.minScore || ''}
            onChange={(e) => updateFilter('minScore', e.target.value ? parseInt(e.target.value) : undefined)}
          />
        </div>

        <div>
          <Label htmlFor="maxScore">Max Score</Label>
          <Input
            id="maxScore"
            type="number"
            min="0"
            max="100"
            value={filters.maxScore || ''}
            onChange={(e) => updateFilter('maxScore', e.target.value ? parseInt(e.target.value) : undefined)}
          />
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => onFiltersChange({ page: 1, limit: 20, skills: [] })}
        >
          Clear Filters
        </Button>
      </CardContent>
    </Card>
  );
}

