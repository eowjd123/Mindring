"use client";

import { WordSearchGame } from "@/components/games/specific/WordSearchGame";
import React from "react";

export default function WordSearchPage() {
  return (
    <main className="px-4 py-8 max-w-5xl mx-auto">
      <WordSearchGame />
    </main>
  );
}
