"use client";

import dynamic from "next/dynamic";
import type { PlotParams } from "react-plotly.js";

// Tell TS that this dynamic component accepts PlotParams
const Plot = dynamic<PlotParams>(() => import("react-plotly.js"), {
  ssr: false,
});

export default Plot;
