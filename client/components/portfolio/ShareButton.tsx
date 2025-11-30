'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Check, Linkedin } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  portfolioUrl: string;
  portfolioTitle?: string;
  portfolioDescription?: string;
}

export function ShareButton({ portfolioUrl, portfolioTitle, portfolioDescription }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(portfolioUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnLinkedIn = () => {
    const text = portfolioTitle || 'Check out my DevOps portfolio';
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(portfolioUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={copyLink}>
        {copied ? <Check className="h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
        Copy Link
      </Button>
      <Button variant="outline" size="sm" onClick={shareOnLinkedIn}>
        <Linkedin className="h-4 w-4 mr-2" />
        Share on LinkedIn
      </Button>
    </div>
  );
}

