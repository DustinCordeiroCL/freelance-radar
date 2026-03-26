"use client";

import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface InfoPopoverProps {
  children: React.ReactNode;
}

export function InfoPopover({ children }: InfoPopoverProps): React.ReactElement {
  return (
    <Popover>
      <PopoverTrigger
        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
        aria-label="More information"
      >
        <Info className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className="w-72 text-sm text-muted-foreground" side="top" align="start">
        {children}
      </PopoverContent>
    </Popover>
  );
}
