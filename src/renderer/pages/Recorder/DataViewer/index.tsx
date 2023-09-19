import { ArrowBackIcon, ArrowForwardIcon } from '@chakra-ui/icons';
import { Box, Button, Heading } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import { Link } from 'react-router-dom';
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

export function DataViewer() {
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
      const lines = [];
      for (const point of newData.rawData) {
        const lineName = point.split(':')[0].trim();
        const line = new Line(lineName);
        console.log(lineName);
        lines.push(line);
      }
      setState(lines);
      isPlotExist.current = true;
    } else {
      const updateLines = Array.from(state);
      console.log(updateLines.length);
      for (let i = 0; i < state.length; i++) {
        let { lineData, layout, revision } = updateLines[i];
        lineData.x.push(newData.timestamp);
        const pointX =
          newData.rawData[i].match(/[+-]?(?:\d+\.?\d*|\.\d+)/)![0] || '0';
        lineData.y.push(parseFloat(pointX));
        // if (maxNumPoints < lineData.x.length) {
        //   lineData.x.shift();
        //   lineData.y.shift();
        // }
        layout.datarevision += 1;
        revision += 1;

        updateLines[i].update(lineData, layout, revision);
      }
      setState(updateLines);
    }
  }, [newData]);

  const recordStart = async () => {
    const result = await window.api.recordStart();
  };

  const recordStop = async () => {
    const result = await window.api.recordStop();
  };

  return (
    <Box>
      <Link to="/">
        <Button
          leftIcon={<ArrowBackIcon />}
          colorScheme="teal"
          variant="outline"
        >
          back
        </Button>
      </Link>
      <Heading>Data Viewer</Heading>
      <Box id="graph-area">
        {state.map((line) => {
          return (
            <Plot
              data={[line.lineData]}
              layout={line.layout}
              revision={line.revision}
            />
          );
        })}
      </Box>
      <Box>
        {/* <Link to="/record"> */}
        <Button
          rightIcon={<ArrowForwardIcon />}
          colorScheme="teal"
          variant="outline"
          onClick={() => recordStart()}
        >
          Record
        </Button>
        {/* </Link> */}
        <Button
          colorScheme="teal"
          variant="outline"
          onClick={() => recordStop()}
        >
          Stop
        </Button>
      </Box>
    </Box>
  );
}
