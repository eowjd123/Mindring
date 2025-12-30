"use client";

import { MemoryMatchGame } from "@/components/games/specific";
import React from "react";

export default function MemoryMatchPage() {
  return (
    <main className="px-4 py-8 max-w-5xl mx-auto">
      <MemoryMatchGame gameId="memory-match" />
    </main>
  );
}
