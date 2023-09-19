import { ArrowForwardIcon, RepeatIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Center,
  Heading,
  Select,
  Stack,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PortInfo } from 'serialport';
import './index.scss';

export function SelectPort() {
  const buttonGetAvailableSerialPorts = useRef<HTMLButtonElement>(null);
  const selectAvailablePorts = useRef<HTMLSelectElement>(null);
  const [availablePorts, SetAvailablePorts] = useState<Array<PortInfo>>([]);

  const getAvailableSerialPorts = async () => {
    SetAvailablePorts([]);
    const availableSerialPorts = await window.api.getSerialPorts();
    console.log(availablePorts);
    SetAvailablePorts(availableSerialPorts);
  };
  useEffect(() => {
    getAvailableSerialPorts();
  }, []);

  const setSerialPort = async (value: string) => {
    if (value == '') return;
    try {
      await window.api.setSerialPort(value);
    } catch (e) {
      console.warn(e);
      alert(
        'ポートがひらけませんでした。他のアプリケーションでこのポートを使用してる可能性があります。'
      );
      selectAvailablePorts.current.options[0].selected = true;
    }
  };

  return (
    <Box>
      <Heading>Please select serial port</Heading>
      <Text>
        シリアルポートが現れない場合は、接続を再度確認してから、再読み込みボタンを押してください。
      </Text>
      <Stack direction="row" spacing={4}>
        <Select
          size="lg"
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
            size="lz"
            onClick={getAvailableSerialPorts}
            ref={buttonGetAvailableSerialPorts}
          >
            <RepeatIcon w={10} h={8} />
          </Button>
        </Tooltip>
      </Stack>
      <Box>
        <Center>
          <Link to="/DataViewer" state={{ test: 'test' }}>
            <Button
              // isDisabled={true}
              rightIcon={<ArrowForwardIcon />}
              colorScheme="teal"
              variant="outline"
            >
              Connect
            </Button>
          </Link>
        </Center>
      </Box>
    </Box>
  );
}
