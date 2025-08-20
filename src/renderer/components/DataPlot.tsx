import { useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import './index.scss';

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
  yaxis: {
    title: {
      text: string;
    };
  };
};

type data = {
  timestamp: string;
  rawData: string[];
};

class Line {
  name: string;

  lineData: LineData;

  layout: Layout;

  revision: number;

  constructor(name: string) {
    this.name = name;
    this.lineData = {
      type: 'scatter',
      x: [],
      y: [],
      mode: 'lines',
      name: 'Red',
    };

    this.layout = {
      width: '100%',
      height: 400,
      datarevision: 0,
      yaxis: {
        title: {
          text: this.name,
        },
      },
    };

    this.revision = 0;
  }

  update(lineData: LineData, layout: Layout, revision: number) {
    this.lineData = lineData;
    this.layout = layout;
    this.revision = revision;
  }
}

export default function DataViewer() {
  const maxNumPoints = 15;
  const isPlotExist = useRef<boolean>(false);
  const [newData, setNewData] = useState<data>();
  const [state, setState] = useState<Array<Line>>([]);

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
    if (newData === undefined) return;
    if (!isPlotExist.current) {
      const lines: Line[] = [];
      newData.rawData.forEach((point) => {
        // Changed to forEach
        const lineName = point.split(':')[0].trim();
        const line = new Line(lineName);
        console.log(lineName);
        lines.push(line);
      });
      setState(lines);
      isPlotExist.current = true;
    } else {
      const updateLines = Array.from(state);
      console.log(updateLines.length);
      for (let i = 0; i < state.length; i++) {
        const { lineData, layout, revision } = updateLines[i]; // Changed to const
        lineData.x.push(newData.timestamp);
        const pointX =
          newData.rawData[i].match(/[+-]?(?:\d+\.?\d*|\.\d+)/)[0] || '0';
        lineData.y.push(parseFloat(pointX));
        if (maxNumPoints < lineData.x.length) {
          lineData.x.shift();
          lineData.y.shift();
        }
        layout.datarevision += 1;
        // revision += 1; // Removed as it's not used after this line

        updateLines[i].update(lineData, layout, revision);
      }
      setState(updateLines);
    }
  }, [newData, state]); // Added state to dependency array

  return (
    <>
      {state.map((line) => {
        return (
          <Plot
            data={[line.lineData]}
            layout={line.layout}
            revision={line.revision}
          />
        );
      })}
    </>
  );
}
