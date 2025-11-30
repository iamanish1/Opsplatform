'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Evidence {
  category: string;
  description: string;
  githubLink?: string;
  codeSnippet?: string;
}

interface EvidencePanelProps {
  evidence: Evidence[];
}

export function EvidencePanel({ evidence }: EvidencePanelProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-4">
      {evidence.map((item, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-lg">{item.category}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {item.githubLink && (
              <a
                href={item.githubLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View on GitHub <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {item.codeSnippet && (
              <div className="relative">
                <pre className="bg-secondary p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{item.codeSnippet}</code>
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(item.codeSnippet!, index)}
                >
                  {copiedIndex === index ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

