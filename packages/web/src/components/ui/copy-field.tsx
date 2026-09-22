import * as React from 'react';
import { Copy, TickCircle } from 'iconsax-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

export interface CopyFieldProps {
  value: string;
  className?: string;
}

export function CopyField({ value, className }: CopyFieldProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast({ title: 'Copied to clipboard' });
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`relative ${className ?? ''}`}>
      <Input readOnly value={value} className="pr-10 font-mono text-xs" onFocus={(e) => e.target.select()} />
      <button
        type="button"
        className="absolute right-0 top-0 flex h-full items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
        onClick={handleCopy}
        aria-label="Copy to clipboard"
      >
        {copied ? (
          <TickCircle size={16} variant="Bold" color="currentColor" className="text-green-500" />
        ) : (
          <Copy size={16} variant="Linear" color="currentColor" />
        )}
      </button>
    </div>
  );
}
