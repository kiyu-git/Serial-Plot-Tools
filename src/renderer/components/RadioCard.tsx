import { Box, useRadio } from '@chakra-ui/react';
import PropTypes from 'prop-types';
import React from 'react';

interface RadioCardProps {
  children: React.ReactNode;
  // Add other props that useRadio expects if needed
}

export default function RadioCard(props: RadioCardProps) {
  const { children } = props; // Destructure children
  const { getInputProps, getRadioProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getRadioProps();

  return (
    <Box as="label">
      <input
        type="radio"
        name={input.name}
        value={input.value}
        checked={input.checked}
        onChange={input.onChange}
      />
      <Box
        // {...checkbox} // Removed prop spreading
        // Explicitly pass props from checkbox
        id={checkbox.id}
        role={checkbox.role}
        aria-checked={checkbox['aria-checked']}
        tabIndex={checkbox.tabIndex}
        onKeyPress={checkbox.onKeyPress}
        onMouseDown={checkbox.onMouseDown}
        onFocus={checkbox.onFocus}
        onBlur={checkbox.onBlur}
        cursor="pointer"
        borderWidth="1px"
        borderRadius="md"
        color="teal.600"
        borderColor="teal.600"
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
        {children}
      </Box>
    </Box>
  );
}

RadioCard.propTypes = {
  children: PropTypes.node.isRequired,
  // Add other propTypes for props that useRadio expects if needed
};
