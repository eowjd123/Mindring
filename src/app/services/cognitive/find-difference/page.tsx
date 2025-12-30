"use client";

import { FindDifferenceGame } from "@/components/games/specific";
import React from "react";

export default function FindDifferencePage() {
  return (
    <main className="px-4 py-8 max-w-5xl mx-auto">
      <FindDifferenceGame gameId="find-difference" />
    </main>
  );
}
