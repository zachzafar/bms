import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button"

// Copyable ID Component
export default function CopyableId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncatedId = id.length > 8 ? `${id.slice(0, 8)}...` : id;

  return (
    <div className="flex items-center gap-2 group">
      <span
        className="font-mono text-sm cursor-help"
        title={id}
      >
        {truncatedId}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
        title="Copy full ID"
      >
        {copied ? (
          <Check className="h-3 w-3 text-primary" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}
