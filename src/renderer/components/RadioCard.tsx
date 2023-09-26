import { Box, useRadio } from '@chakra-ui/react';

export function RadioCard(props) {
  console.log(props);
  const { getInputProps, getRadioProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getRadioProps();

  return (
    <Box as="label">
      <input {...input} />
      <Box
        {...checkbox}
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
        _checked={{
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
        {props.children}
      </Box>
    </Box>
  );
}
