import { RepeatIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Center,
  Flex,
  Grid,
  GridItem,
  Heading,
  Select,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { PortInfo } from '@serialport/bindings-interface';
import { Layout, PlotData } from 'plotly.js';
import { useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import styles from './index.module.scss';

type data = {
  timestamp: string;
  rawData: string[];
};

type info = {
  elapsedTime: string;
  fileSize: string;
};

class Line {
  name: string;
  lineData: PlotData;
  layout: Layout;
  revision: number;
  shortDisplaySeconds: number;
  shortX: Date[];
  shortY: number[];
  longX: Date[];
  longY: number[];

  constructor(name: string) {
    this.name = name;
    this.lineData = {
      type: 'scatter',
      x: [],
      y: [],
      mode: 'lines',
      // marker: { color: 'teal.500' },
    };

    this.layout = {
      datarevision: 0,
      xaxis: { title: '時刻' },
      yaxis: { title: this.name },
      margin: { t: 0 },
    };

    this.revision = 0;
    this.shortDisplaySeconds = 10;
    this.longX = [];
    this.shortX = [];
    this.longY = [];
    this.shortY = [];
  }

  appendData(x: Date, y: number) {
    this.longX.push(x);
    this.longY.push(y);
    this.shortX.push(x);
    this.shortY.push(y);

    const currentTime = new Date();
    const nSecondsAgo = new Date(
      currentTime.getTime() - this.shortDisplaySeconds * 1000
    );

    for (let i = 0; i < this.shortX.length; i++) {
      if (nSecondsAgo < this.shortX[i]) {
        break;
      }
      this.shortX.shift();
      this.shortY.shift();
    }

    this.layout.datarevision += 1;
    this.revision += 1;
  }

  getLineData(mode: Number) {
    if (mode == 0) {
      this.lineData.x = this.shortX;
      this.lineData.y = this.shortY;
      return this.lineData;
    } else if (mode == 1) {
      this.lineData.x = this.longX;
      this.lineData.y = this.longY;
      return this.lineData;
    }
  }

  clearLongLineData() {
    this.longX = [];
    this.longY = [];
  }
}

const status = {
  idle: 0,
  portSelected: 1,
  Streaming: 2,
  recordStarted: 3,
  recordStopped: 4,
};

const displayModes = {
  short: 0,
  long: 1,
};

export function DataLogger() {
  const buttonGetAvailableSerialPorts = useRef<HTMLButtonElement>(null);
  const selectAvailablePorts = useRef<HTMLSelectElement>(null);
  const [availablePorts, SetAvailablePorts] = useState<Array<PortInfo>>([]);
  const [newData, setNewData] = useState<data>();
  const [info, setInfo] = useState<info>();
  const [lines, setLines] = useState<Array<Line>>([]);
  const [displayMode, setDisplayMode] = useState(displayModes.short);
  const [currentStatus, setCurrentStatus] = useState(status.idle);
  const [savePath, SetSavePath] = useState('');

  // set serial port
  const getAvailableSerialPorts = async () => {
    SetAvailablePorts([]);
    const availableSerialPorts = await window.api.getSerialPorts();
    SetAvailablePorts(availableSerialPorts);
  };

  const setSerialPort = async (value: string) => {
    if (value == '') {
      window.api.closeSerialPort();
      setCurrentStatus(status.idle);
      return;
    }
    try {
      await window.api.setSerialPort(value);
      // 読み込み中
      setCurrentStatus(status.portSelected);
    } catch (e) {
      console.warn(e);
      alert(
        'ポートがひらけませんでした。他のアプリケーションでこのポートを使用してる可能性があります。'
      );
      selectAvailablePorts.current!.options[0].selected = true;
    }
  };

  // plot functions
  useEffect(() => {
    if (newData === undefined) return;
    if (
      !(
        currentStatus === status.Streaming ||
        currentStatus === status.recordStarted
      )
    ) {
      const lines = [];
      for (const point of newData.rawData) {
        const lineName = point.split(':')[0].trim();
        const line = new Line(lineName);
        console.log(lineName);
        lines.push(line);
      }
      setLines(lines);
      setCurrentStatus(status.Streaming);
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
    SetSavePath(result);
    setCurrentStatus(status.recordStarted);

    // グラフデータのクリア
    const updateLines = Array.from(lines);
    for (let i = 0; i < lines.length; i++) {
      updateLines[i].clearLongLineData();
    }
    setLines(updateLines);
    setDisplayMode(displayModes.long);
  };

  const recordStop = async () => {
    const result = await window.api.recordStop();
    setCurrentStatus(status.portSelected);
    setDisplayMode(displayModes.short);
  };

  const openSaveFolder = async () => {
    const result = await window.api.openSaveFolder(savePath);
  };

  // 初回のみ実行
  useEffect(() => {
    getAvailableSerialPorts();

    window.api.on('newData', (_data: data) => {
      if (_data.rawData[0].includes('*')) {
        console.log(_data.rawData[0]);
        return;
      }
      setNewData(_data);
    });

    window.api.on('info', (_data: info) => {
      setInfo(_data);
    });

    window.api.on('close', (_data: boolean) => {
      selectAvailablePorts.current!.options[0].selected = true;
      setCurrentStatus(status.idle);
    });
  }, []);

  // plot area function
  const plotArea = () => {
    switch (currentStatus) {
      case status.idle:
        // 何も出さない
        return;
      case status.portSelected:
        // loading
        return (
          <Center h={'100%'}>
            <VStack spacing={'1em'}>
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="teal.500"
                size="xl"
              />
              <Text>データを待っています</Text>
            </VStack>
          </Center>
        );

      default:
        // グラフ描画
        return lines.map((line, idx) => {
          return (
            <Plot
              key={`plot_${idx}`}
              className={styles.plot}
              data={[line.getLineData(displayMode)]}
              layout={line.layout}
              revision={line.revision}
            />
          );
        });
    }
  };

  return (
    <Grid
      templateAreas={`"header header" "nav main"`}
      gridTemplateRows={'auto 1fr'}
      gridTemplateColumns={'20% 1fr'}
      h={'100vh'}
      m={3}
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
                isDisabled={currentStatus != status.Streaming}
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
                w={'48%'}
              >
                Stop
              </Button>
            </Flex>
            <Stack
              direction={'row'}
              m={1}
              color={'teal.600'}
              opacity={status.recordStarted <= currentStatus ? 1 : 0.4}
            >
              <Text>elapsed time: </Text>
              <Text>
                {status.recordStarted <= currentStatus &&
                info?.elapsedTime !== undefined
                  ? `${info?.elapsedTime}`
                  : ''}
              </Text>
            </Stack>
            <Stack
              direction={'row'}
              m={1}
              color={'teal.600'}
              opacity={status.recordStarted <= currentStatus ? 1 : 0.4}
            >
              <Text>file size: </Text>
              <Text>
                {status.recordStarted <= currentStatus &&
                info?.fileSize !== undefined
                  ? `${info?.fileSize}`
                  : ''}
              </Text>
            </Stack>
            <Stack
              direction={'row'}
              m={1}
              color={'teal.600'}
              opacity={status.recordStarted <= currentStatus ? 1 : 0.4}
            >
              <Text>file: </Text>
              <Text as={'u'} cursor={'pointer'} onClick={openSaveFolder}>
                {status.recordStarted <= currentStatus
                  ? `${savePath.split('/').slice(-1)[0]}`
                  : ''}
              </Text>
            </Stack>
          </Box>
        </Stack>
      </GridItem>
      <GridItem bg="" overflowX={'auto'} overflowY={'scroll'} area={'main'}>
        <Tabs
          variant="unstyled"
          align="center"
          h="100%"
          index={displayMode}
          onChange={(idx) => setDisplayMode(idx)}
        >
          <TabList>
            <Tab
              cursor="pointer"
              borderWidth="1px"
              borderRadius="md"
              color={'teal.600'}
              borderColor={'teal.600'}
              _hover={{ background: 'teal.50' }}
              _disabled={{
                opacity: '0.4',
                cursor: 'not-allowed',
              }}
              _selected={{
                bg: 'teal.600',
                color: 'white',
                borderColor: 'teal.600',
              }}
              _focus={{
                boxShadow: 'outline',
              }}
              px={5}
              py={1}
              mx={5}
            >
              Short Term
            </Tab>
            <Tab
              isDisabled={currentStatus < status.recordStarted}
              cursor="pointer"
              borderWidth="1px"
              borderRadius="md"
              color={'teal.600'}
              borderColor={'teal.600'}
              _hover={{ background: 'teal.50' }}
              _disabled={{
                opacity: '0.4',
                cursor: 'not-allowed',
              }}
              _selected={{
                bg: 'teal.600',
                color: 'white',
                borderColor: 'teal.600',
              }}
              _focus={{
                boxShadow: 'outline',
              }}
              px={5}
              py={1}
              mx={5}
            >
              Long Term
            </Tab>
          </TabList>
          <TabPanels h="100%">{plotArea()}</TabPanels>
        </Tabs>
      </GridItem>
    </Grid>
  );
}
