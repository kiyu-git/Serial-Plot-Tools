import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { Link } from 'react-router-dom';

type LineData = {
  type: string;
  x: string[];
  y: number[];
  mode: string;
  name: string;
};

type Layout = {
  width: number | string;
  height: number | string;
  datarevision: number;
};

type LineState = {
  lines: LineData[];
  layout: Layout;
  revision: number;
};

type data = {
  timestamp: string;
  rawData: string[];
};

export function Record() {
  const maxNumPoints = 15;
  const [newData, setNewData] = useState<data>();
  const [state, setState] = useState<LineState>({
    lines: [
      {
        type: 'scatter',
        x: [],
        y: [],
        mode: 'lines',
        name: 'Red',
      },
    ],
    layout: {
      width: '100%',
      height: 500,
      datarevision: 0,
    },
    revision: 0,
  });

  useEffect(() => {
    window.api.on('newData', (_data: data) => {
      if (_data.rawData[0].includes('*')) {
        console.log(_data.rawData[0]);
        return;
      }
      setNewData(_data);
    });
  }, []);

  useEffect(() => {
    let { lines, layout, revision } = state;
    if (newData !== undefined) {
      lines[0].x.push(newData.timestamp);
      lines[0].y.push(parseFloat(newData.rawData[0]));
      layout.datarevision += 1;
      setState({ lines: lines, layout: layout, revision: revision + 1 });
    }
  }, [newData]);

  //   console.log(state.revision, state.lines[0].x);

  return (
    <div>
      <Link to="/dataviewer">
        <button>back</button>
      </Link>
      <h1>Data Record</h1>
      <Plot
        data={[state.lines[0]]}
        layout={state.layout}
        revision={state.revision}
      />
    </div>
  );
}
