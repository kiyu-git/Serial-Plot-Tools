import { RepeatIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Heading,
  Select,
  Stack,
  Text,
  Tooltip,
  useRadioGroup,
} from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import { RadioCard } from 'renderer/components/RadioCard';
import { PortInfo } from 'serialport';
import styles from './index.module.scss';

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
  xaxis: {
    title: string;
  };
  yaxis: {
    title: string;
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
  shortDisplayNum: number;
  shortX: string[];
  shortY: number[];
  longX: string[];
  longY: number[];

  constructor(name: string) {
    this.name = name;
    this.lineData = {
      type: 'scatter',
      x: [],
      y: [],
      mode: 'lines',
    };

    this.layout = {
      datarevision: 0,
      xaxis: { title: '時刻' },
      yaxis: { title: this.name },
      margin: { t: 0 },
    };

    this.revision = 0;
    this.shortDisplayNum = 16;
    this.longX = [];
    this.shortX = [];
    this.longY = [];
    this.shortY = [];
  }

  appendData(x: string, y: number) {
    this.longX.push(x);
    this.longY.push(y);
    this.shortX.push(x);
    this.shortY.push(y);
    if (this.shortDisplayNum < this.shortX.length) {
      this.shortX.shift();
      this.shortY.shift();
    }

    this.layout.datarevision += 1;
    this.revision += 1;
  }

  getLineData(mode: string) {
    if (mode == 'short') {
      this.lineData.x = this.shortX;
      this.lineData.y = this.shortY;
      return this.lineData;
    } else if (mode == 'long') {
      this.lineData.x = this.longX;
      this.lineData.y = this.longY;
      return this.lineData;
    }
  }
}

const status = {
  idle: 0,
  portSelected: 1,
  recordStarted: 2,
  recordStopped: 3,
};

export function DataLogger() {
  const buttonGetAvailableSerialPorts = useRef<HTMLButtonElement>(null);
  const selectAvailablePorts = useRef<HTMLSelectElement>(null);
  const [availablePorts, SetAvailablePorts] = useState<Array<PortInfo>>([]);
  const isPlotExist = useRef<boolean>(false);
  const [newData, setNewData] = useState<data>();
  const [lines, setLines] = useState<Array<Line>>([]);
  const [displayMode, setDisplayMode] = useState<string>('short');
  const [currentStatus, setCurrentStatus] = useState(status.idle);

  // set serial port
  const getAvailableSerialPorts = async () => {
    SetAvailablePorts([]);
    const availableSerialPorts = await window.api.getSerialPorts();
    console.log(availablePorts);
    SetAvailablePorts(availableSerialPorts);
  };

  const setSerialPort = async (value: string) => {
    if (value == '') return;
    try {
      await window.api.setSerialPort(value);
      setCurrentStatus(status.portSelected);
    } catch (e) {
      console.warn(e);
      alert(
        'ポートがひらけませんでした。他のアプリケーションでこのポートを使用してる可能性があります。'
      );
      selectAvailablePorts.current!.options[0].selected = true;
    }
  };

  // radio button
  const options = ['Short Term', 'Long Term'];
  const option_disabled = [false, currentStatus != status.recordStarted];

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: 'framework',
    defaultValue: 'Short Term',
    onChange: (value) =>
      value == 'Short Term' ? setDisplayMode('short') : setDisplayMode('long'),
  });

  const group = getRootProps();

  // plot functions
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
      setLines(lines);
      isPlotExist.current = true;
    } else {
      const updateLines = Array.from(lines);
      for (let i = 0; i < lines.length; i++) {
        const pointY =
          newData.rawData[i].match(/[+-]?(?:\d+\.?\d*|\.\d+)/)![0] || '0';
        updateLines[i].appendData(newData.timestamp, parseFloat(pointY));
      }
      setLines(updateLines);
    }
  }, [newData]);

  // record functions
  const recordStart = async () => {
    const result = await window.api.recordStart();
    setCurrentStatus(status.recordStarted);
  };

  const recordStop = async () => {
    const result = await window.api.recordStop();
    setCurrentStatus(status.portSelected);
  };

  // 初回のみ実行
  useEffect(() => {
    getAvailableSerialPorts();

    window.api.on('newData', (_data: data) => {
      if (_data.rawData[0].includes('*')) {
        console.log(_data.rawData[0]);
        return;
      }
      console.log(_data);
      setNewData(_data);
    });
  }, []);

  return (
    <Grid
      mx={3}
      templateAreas={`"header header" "nav main"`}
      gridTemplateRows={'auto 1fr'}
      gridTemplateColumns={'20% 1fr'}
      h={'100vh'}
      margin={0}
      padding={2}
    >
      <GridItem area={'header'} margin={'0 0 1em 0'}>
        <Heading>Realtime Data Logger</Heading>
        <Text>リアルタイムの測定値を表示・保存します。</Text>
      </GridItem>
      <GridItem area={'nav'}>
        <Stack direction="column" spacing={5}>
          <Box bgColor={'white'}>
            <Heading fontSize={'xl'} mb={1}>
              Select Serial Port
            </Heading>
            <Stack direction="row" spacing={1}>
              <Select
                size="sm"
                borderWidth="1px"
                borderRadius="md"
                color={'teal.600'}
                borderColor={'teal.600'}
                ref={selectAvailablePorts}
                onChange={(e) => setSerialPort(e.target.value)}
              >
                <option value="">選択してください</option>
                {availablePorts.map((availablePort) => (
                  <option value={availablePort.path} key={availablePort.path}>
                    {availablePort.manufacturer === undefined
                      ? availablePort.path
                      : `${availablePort.path} (${availablePort.manufacturer})`}
                  </option>
                ))}
              </Select>
              <Tooltip hasArrow label="ポートの再検索">
                <Button
                  colorScheme="teal"
                  variant="outline"
                  size="sm"
                  onClick={getAvailableSerialPorts}
                  ref={buttonGetAvailableSerialPorts}
                >
                  <RepeatIcon w={5} h={4} />
                </Button>
              </Tooltip>
            </Stack>
          </Box>
          <Box bgColor={'white'}>
            <Heading fontSize={'xl'} mb={1}>
              Record
            </Heading>
            <Flex justifyContent={'space-between'}>
              <Button
                colorScheme="teal"
                variant="outline"
                size="sm"
                onClick={recordStart}
                isDisabled={currentStatus != status.portSelected}
                ref={buttonGetAvailableSerialPorts}
                w={'48%'}
              >
                Start
              </Button>
              <Button
                colorScheme="teal"
                variant="outline"
                size="sm"
                onClick={recordStop}
                isDisabled={currentStatus != status.recordStarted}
                ref={buttonGetAvailableSerialPorts}
                w={'48%'}
              >
                Stop
              </Button>
            </Flex>
          </Box>
        </Stack>
      </GridItem>
      <GridItem bg="" overflowX={'auto'} overflowY={'scroll'} area={'main'}>
        <Flex {...group} justifyContent={'center'}>
          {options.map((value, idx) => {
            const radio = getRadioProps({ value });
            return (
              <RadioCard
                key={value}
                {...radio}
                isDisabled={option_disabled[idx]}
              >
                {value}
              </RadioCard>
            );
          })}
        </Flex>
        {lines.map((line, idx) => {
          return (
            <Plot
              key={`plot_${idx}`}
              className={styles.plot}
              data={[line.getLineData(displayMode)]}
              layout={line.layout}
              revision={line.revision}
            />
          );
        })}
      </GridItem>
    </Grid>
  );
}
