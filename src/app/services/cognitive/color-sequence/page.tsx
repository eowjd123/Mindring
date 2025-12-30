"use client";

import ColorSequenceGame from "@/components/games/specific/ColorSequenceGame";
import React from "react";

export default function Page() {
  return (
    <div className="min-h-screen">
      <ColorSequenceGame gameId="color-sequence" />
    </div>
  );
}
