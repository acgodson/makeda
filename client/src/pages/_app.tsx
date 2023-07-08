import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { publicProvider } from "wagmi/providers/public";
import { ChakraProvider } from '@chakra-ui/react';
import "@rainbow-me/rainbowkit/styles.css";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { goerli, polygonMumbai } from "wagmi/chains";
import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { fantom, fantommainnet, horizen } from '@/constants';
import GlobalProvider from '@/contexts/global';


const { chains, publicClient } = configureChains(
  [horizen, fantom, goerli, polygonMumbai, fantommainnet],
  [publicProvider()]

);

const { connectors } = getDefaultWallets({
  appName: "orionwallet",
  projectId: "3fd26a982a80d14bad19cc2b594652ac",
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export default function App({ Component, pageProps }: AppProps) {

  return (
    <GlobalProvider>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider modalSize="compact" chains={chains}>
          <Component {...pageProps} />
        </RainbowKitProvider>
      </WagmiConfig >

    </GlobalProvider>

  );
}
