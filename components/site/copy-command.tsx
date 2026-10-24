"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"

export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = React.useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 py-1 pr-1 pl-3 font-mono text-xs">
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap">{command}</code>
      <Button variant="ghost" size="icon-sm" onClick={copy} aria-label="Copy the install command">
        {copied ? <Check /> : <Copy />}
      </Button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </div>
  )
}
