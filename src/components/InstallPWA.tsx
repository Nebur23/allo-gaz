/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPWA() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  if (!prompt) return null;

  const installApp = async () => {
    prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === "accepted") {
      setPrompt(null);
    }
  };

  return (
    <div className='fixed bottom-4 right-4 z-50'>
      <Button
        variant='default'
        className='animate-bounce-slow'
        onClick={installApp}
      >
        Install AlloGaz
      </Button>
    </div>
  );
}
