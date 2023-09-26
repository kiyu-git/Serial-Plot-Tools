import React from 'react';
import Plot from 'react-plotly.js';

interface LineData {
  x: number[];
  y: number[];
  mode: string;
}

interface LineLayout {
  datarevision: number;
  title: string;
}

interface LineState {
  line: LineData;
  layout: LineLayout;
  revision: number;
}

export class LinePlot extends React.Component<{}, LineState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      line: {
        x: [1, 2, 3],
        y: [2, 6, 3],
        mode: 'lines+markers',
      },
      layout: {
        datarevision: 0,
        title: 'A Line Plot',
      },
      revision: 0,
    };
    this.updateGraph = this.updateGraph.bind(this);
  }
  componentDidMount() {}
  updateGraph(val: number) {
    const { line, layout } = this.state;
    line.x.push(line.x[line.x.length - 1] + 1);
    line.y.push(val);
    this.setState({ revision: this.state.revision + 1 });
    layout.datarevision = this.state.revision + 1;
  }
  render() {
    return (
      <Plot
        data={[this.state.line]}
        layout={this.state.layout}
        revision={this.state.revision}
      />
    );
  }
}
