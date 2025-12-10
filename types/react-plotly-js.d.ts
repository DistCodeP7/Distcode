declare module "react-plotly.js" {
  import type Plotly from "plotly.js-dist-min";
  import type { Component } from "react";

  export interface PlotParams {
    data: Plotly.Data[];
    layout?: Partial<Plotly.Layout>;
    config?: Partial<Plotly.Config>;
    style?: React.CSSProperties;
    className?: string;
    useResizeHandler?: boolean;
    onInitialized?: (figure: Plotly.Figure, graphDiv: HTMLDivElement) => void;
    onUpdate?: (figure: Plotly.Figure, graphDiv: HTMLDivElement) => void;
    onError?: (err: Error) => void;
  }

  export default class Plot extends Component<PlotParams> {}
}
