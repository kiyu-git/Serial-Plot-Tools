import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Box, Center, HStack, Heading, Text, VStack } from '@chakra-ui/react';
import '../../App.scss';

export function Menu() {
  const openDataViewer = async () => {
    const result = await window.api.openDataViewer();
  };

  const openRealtimeDataLogger = async () => {
    const result = await window.api.openRealtimeDataLogger();
  };

  return (
    <Center h={'100vh'}>
      <VStack spacing={5} align="stretch" w={'70%'}>
        <Heading>Serial Plot Tools</Heading>
        <Box
          borderWidth="1px"
          borderRadius="lg"
          w={'100%'}
          p={3}
          color={'teal.600'}
          borderColor={'teal.600'}
          _hover={{ background: 'teal.50' }}
          onClick={openRealtimeDataLogger}
        >
          <HStack h={'150px'}>
            <Box w={'90%'}>
              <Heading fontSize={'2xl'}>Realtime Data Logger</Heading>
              <Text>
                Arduinoから送られてくるリアルタイムの測定値を表示・保存します。
              </Text>
            </Box>
            <Box>
              <ArrowForwardIcon
                boxSize={8}
                p={1}
                borderWidth="1px"
                rounded="full"
                borderColor={'teal.600'}
              />
            </Box>
          </HStack>
        </Box>
        <Box
          borderWidth="1px"
          borderRadius="lg"
          w={'100%'}
          p={3}
          color={'teal.600'}
          borderColor={'teal.600'}
          _hover={{ background: 'teal.50' }}
          onClick={openDataViewer}
        >
          <HStack h={'150px'}>
            <Box w={'90%'}>
              <Heading fontSize={'2xl'}>Data Viewer</Heading>
              <Text>Realtime Data Loggerで保存したデータを表示します。</Text>
            </Box>
            <Box>
              <ArrowForwardIcon
                boxSize={8}
                p={1}
                borderWidth="1px"
                rounded="full"
                borderColor={'teal.600'}
              />
            </Box>
          </HStack>
        </Box>
      </VStack>
    </Center>
  );
}
