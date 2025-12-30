"use client";

import { ConnectNumbersGame } from "@/components/games/specific/ConnectNumbersGame";
import React from "react";

export default function ConnectNumbersPage() {
  return (
    <main className="px-4 py-8 max-w-5xl mx-auto">
      <ConnectNumbersGame />
    </main>
  );
}
