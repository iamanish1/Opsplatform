'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function StyleGuidePage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Style Guide</h1>
        <p className="text-muted-foreground">Design system and component showcase</p>
      </div>

      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Colors</CardTitle>
          <CardDescription>Primary brand color palette</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="h-24 w-full bg-[#2563EB] rounded-lg mb-2"></div>
              <div className="text-sm font-semibold">Primary Blue</div>
              <div className="text-xs text-muted-foreground">#2563EB</div>
            </div>
            <div>
              <div className="h-24 w-full bg-[#0F172A] rounded-lg mb-2"></div>
              <div className="text-sm font-semibold">Dark</div>
              <div className="text-xs text-muted-foreground">#0F172A</div>
            </div>
            <div>
              <div className="h-24 w-full bg-[#22C55E] rounded-lg mb-2"></div>
              <div className="text-sm font-semibold">Accent Green</div>
              <div className="text-xs text-muted-foreground">#22C55E</div>
            </div>
            <div>
              <div className="h-24 w-full bg-[#FACC15] rounded-lg mb-2"></div>
              <div className="text-sm font-semibold">Accent Yellow</div>
              <div className="text-xs text-muted-foreground">#FACC15</div>
            </div>
            <div>
              <div className="h-24 w-full bg-[#EF4444] rounded-lg mb-2"></div>
              <div className="text-sm font-semibold">Accent Red</div>
              <div className="text-xs text-muted-foreground">#EF4444</div>
            </div>
            <div>
              <div className="h-24 w-full bg-[#F8FAFC] rounded-lg mb-2 border"></div>
              <div className="text-sm font-semibold">Background</div>
              <div className="text-xs text-muted-foreground">#F8FAFC</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>Font families and text styles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-4xl font-bold mb-2">Heading 1</div>
            <div className="text-sm text-muted-foreground">Inter, 4xl, bold</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">Heading 2</div>
            <div className="text-sm text-muted-foreground">Inter, 3xl, bold</div>
          </div>
          <div>
            <div className="text-2xl font-semibold mb-2">Heading 3</div>
            <div className="text-sm text-muted-foreground">Inter, 2xl, semibold</div>
          </div>
          <div>
            <div className="text-base mb-2">Body text</div>
            <div className="text-sm text-muted-foreground">Inter, base, regular</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-2">Muted text</div>
            <div className="text-sm text-muted-foreground">Inter, sm, muted color</div>
          </div>
        </CardContent>
      </Card>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>Button variants and sizes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>Status indicators</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge className="bg-green-500">Green</Badge>
            <Badge className="bg-yellow-500">Yellow</Badge>
            <Badge className="bg-red-500">Red</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Forms */}
      <Card>
        <CardHeader>
          <CardTitle>Form Elements</CardTitle>
          <CardDescription>Input fields and labels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="example-input">Label</Label>
            <Input id="example-input" placeholder="Placeholder text" />
          </div>
          <div>
            <Label htmlFor="example-input-disabled">Disabled Input</Label>
            <Input id="example-input-disabled" placeholder="Disabled" disabled />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

