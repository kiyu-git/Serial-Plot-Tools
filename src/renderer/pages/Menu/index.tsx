import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Box, Button, Center, Heading, Stack, Text } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import '../../App.scss';

export function Menu() {
  return (
    <Box>
      <Heading>Menu</Heading>
      <Text></Text>
      <Box>
        <Center>
          <Stack>
            <Link to="/viewer">
              <Button
                rightIcon={<ArrowForwardIcon />}
                colorScheme="teal"
                variant="outline"
              >
                Data Viewer
              </Button>
            </Link>
            <Link to="/recorder">
              <Button
                rightIcon={<ArrowForwardIcon />}
                colorScheme="teal"
                variant="outline"
              >
                Measure & Record
              </Button>
            </Link>
          </Stack>
        </Center>
      </Box>
    </Box>
  );
}
