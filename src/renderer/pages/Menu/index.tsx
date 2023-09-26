import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Box, Center, HStack, Heading, Text, VStack } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import '../../App.scss';

export function Menu() {
  return (
    <Center h={'100vh'}>
      <VStack spacing={5} align="stretch" w={'70%'}>
        <Heading>Serial Plot Tools</Heading>
        <Link to="/DataLogger">
          <Box
            borderWidth="1px"
            borderRadius="lg"
            w={'100%'}
            p={3}
            color={'teal.600'}
            borderColor={'teal.600'}
            _hover={{ background: 'teal.50' }}
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
        </Link>

        <Link to="/DataViewer">
          <Box
            borderWidth="1px"
            borderRadius="lg"
            w={'100%'}
            p={3}
            color={'teal.600'}
            borderColor={'teal.600'}
            _hover={{ background: 'teal.50' }}
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
        </Link>
      </VStack>
    </Center>
    // <Box>
    //   <Heading>Serial Plot Tools</Heading>
    //   <Text></Text>
    //   <Box>
    //     <Center>
    //       <Stack>
    //         <Link to="/DataViewer">
    //           <Button
    //             rightIcon={<ArrowForwardIcon />}
    //             colorScheme="teal"
    //             variant="outline"
    //           >
    //             Data Viewer
    //           </Button>
    //         </Link>
    //         <Link to="/DataLogger">
    //           <Button
    //             rightIcon={<ArrowForwardIcon />}
    //             colorScheme="teal"
    //             variant="outline"
    //           >
    //             Realtime Data Logger
    //           </Button>
    //         </Link>
    //       </Stack>
    //     </Center>
    //   </Box>
    // </Box>
  );
}
