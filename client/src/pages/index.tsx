
import { ChakraProvider } from '@chakra-ui/react';
import Dashboard from './Dashboard';
import { ethers } from 'ethers';


export default function Wallet() {

  return (
    <ChakraProvider>
      <  Dashboard />
    </ChakraProvider>
  )
}

