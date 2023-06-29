import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { publicProvider } from "wagmi/providers/public";
import { ChakraProvider } from '@chakra-ui/react';
import "@rainbow-me/rainbowkit/styles.css";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { filecoinHyperspace, goerli, polygonMumbai } from "wagmi/chains";
import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";


const horizen = {
  id: 1663,
  name: "Horizen",
  network: "horizen",
  nativeCurrency: {
    decimals: 18,
    name: "testnet horizen",
    symbol: "tZEN",
  },
  rpcUrls: {
    default: { http: ["https://gobi-testnet.horizenlabs.io/ethv1"] },
    public: { http: ["https://gobi-testnet.horizenlabs.io/ethv1"] },
  },
  blockExplorers: {
    default: { name: "Gobi", url: "https://gobi-explorer.horizen.io" },
    gobi: { name: "Gobi", url: "https://gobi-explorer.horizen.io" },
  },
}

const { chains, publicClient } = configureChains(
  [horizen, goerli],
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
    <>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider modalSize="compact" chains={chains}>
          <Component {...pageProps} />
        </RainbowKitProvider>
      </WagmiConfig >

    </>

  );
}
