"use client";

import dynamic from "next/dynamic";

// This error occurs because Plotly relies on browser-specific APIs
// that are not available during server-side rendering (SSR).
// By using dynamic import with ssr: false, we ensure that
// Plotly is only loaded on the client side.
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default Plot;
