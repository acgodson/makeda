import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useAccount } from "wagmi";
import { Box, HStack, Text, Icon, Divider, VStack, Select, Heading, Button, Table, Tbody, Td, Th, Thead, Tr, Stack, Center, FormControl, FormLabel, Input, IconButton, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { FaCheckCircle, FaClock, FaExchangeAlt } from 'react-icons/fa';
import { IconContext } from 'react-icons';
import TradingChart from "@/components/TradingChart";
import TradeHistoryTable from '@/components/TradeHistory';
import { useCurrentPrices } from '@/hooks/walletHooks';
import NotificationDrawer from '@/components/Notification';
import NavBar from '@/components/NavBar';
import { BTCAddress, ETHAddress, erc20ABI, tradeABI, tradeAddress } from '@/constants';

export type Address = string | null;

const tokenOptions = [
    { label: "m_BTC", value: BTCAddress },
    { label: "m_ETH", value: ETHAddress },
    // { label: "m_USDC", value: "0xabc123" },
];

const Dashboard = () => {

    const { address } = useAccount();
    const [traderToken, setTraderToken] = useState<string>("");
    const [traderAmount, setTraderAmount] = useState<number>(0.00);
    const [counterpartyToken, setCounterpartyToken] = useState<string>("");
    const [myTrades, setTrades] = useState<any[] | null>(null);
    const currentPrices = useCurrentPrices()


    async function submitTrade() {
        // Check if all required inputs are provided
        if (!traderToken || !traderAmount || !counterpartyToken) {
            console.log("Please fill in all the fields");
            return;
        }

        // Convert traderAmount to the appropriate unit (e.g., from mBTC to BTC)
        const convertedAmount = ethers.utils.parseEther("10");

        // Initialize ethers and contract instance
        const ethereum = (window as any).ethereum;
        if (!ethereum) {
            console.log("Ethereum provider not available");
            return;
        }
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contractAddress = tradeAddress; // Replace with the actual trade contract address
        const contractAbi = tradeABI; // Replace with the actual trade contract ABI
        const contract = new ethers.Contract(contractAddress, contractAbi, signer);

        //get allowance first
        const TradertokenContract = new ethers.Contract(traderToken, erc20ABI, signer);
        try {
            const preTx = await TradertokenContract.approve(contract.address, ethers.utils.parseUnits(String(traderAmount + 3), 18));
            preTx.wait();
            const tx = await contract.submitTradeOrder(
                0,
                ethers.utils.getAddress(traderToken),
                convertedAmount,
                ethers.utils.getAddress(counterpartyToken),
                { gasLimit: 500000 }
            )
            tx.wait()
            console.log("Trade order submitted:", tx.hash);
            setTraderAmount(0)
            setTraderToken("")
            setCounterpartyToken("")
        } catch (e) {
            console.log(e)
        }

    }



    // Function to fetch token prices from Coingecko
    async function fetchTokenPrices() {
        const response = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd"
        );
        const data = await response.json();
        const bitcoinPrice = data.bitcoin.usd;
        const ethereumPrice = data.ethereum.usd;
        console.log({ bitcoinPrice, ethereumPrice })
        return { bitcoinPrice, ethereumPrice };
    }
    // Function to update the exchange rate in the smart contract
    async function updateExchangeRate(contract: any, tokenA: string, tokenB: string, rate: any) {
        // Initialize ethers and contract instance
        const ethereum = (window as any).ethereum;
        if (!ethereum) {
            return;
        }
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        const options = {
            gasLimit: 200000, // Set your desired gas limit here
        };
        // Update the exchange rate
        const contractWithSigner = contract.connect(signer);
        await contractWithSigner.updateExchangeRate(tokenA, tokenB, rate);
        console.log("Exchange rate updated successfully!");
    }
    // useEffect(() => {
    //     // Initialize ethers and contract instance
    //     const ethereum = (window as any).ethereum;
    //     if (!ethereum) {
    //         return;
    //     }
    //     const provider = new ethers.providers.Web3Provider(ethereum);
    //     const contractAddress = tradeAddress;
    //     const contractAbi = tradeABI;
    //     const contract = new ethers.Contract(contractAddress, contractAbi, provider);

    //     // Fetch token prices and update exchange rate
    //     fetchTokenPrices()
    //         .then(({ bitcoinPrice, ethereumPrice }) => {
    //             const tokenA = BTCAddress; // Address of Mock Bitcoin
    //             const tokenB = ETHAddress; // Address of Mock Ethereu
    //             const rate = ethers.utils.parseUnits(String(30516 / 1852.4), 18);
    //             updateExchangeRate(contract, tokenA, tokenB, rate);
    //         })
    //         .catch((error) => {
    //             console.log("Error fetching token prices:", error);
    //         });
    // }, []);

    // Function to get and print the exchange rates

    async function getExchangeRates() {
        try {
            // Get the token addresses for which you want to retrieve the exchange rates
            const tokenA = BTCAddress;
            const tokenB = ETHAddress;
            const ethereum = (window as any).ethereum;
            if (!ethereum) {
                return;
            }
            const provider = new ethers.providers.Web3Provider(ethereum);

            const contract = new ethers.Contract(tradeAddress, tradeABI, provider);

            // Call the contract function to retrieve the exchange rate
            const exchangeRate = await contract.getExchangeRate(tokenA, tokenB);

            console.log(`Exchange rate between ${tokenA} and ${tokenB}: ${ethers.utils.formatUnits(exchangeRate.toString(), 18)}`);
        } catch (error) {
            console.error('Error:', error);
        }
    }
    // useEffect(() => {
    //     getExchangeRates()
    // }, [])

    useEffect(() => {
        const fetchTrades = async () => {
            if (!address) {
                return;
            }
            try {
                const ethereum = (window as any).ethereum;
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const tradeContract = new ethers.Contract(tradeAddress, tradeABI, signer);
                const tradeCounter = await tradeContract.tradeCounter();
                const tradesData = [];

                for (let i = 0; i <= tradeCounter; i++) {
                    const { 0: id, 1: initiator, 2: initiatorToken, 3: initiatorAmount, 4: counterPartyToken, 5: counterPartyAmount, 6: balance, 7: state } = await tradeContract.trades(i);
                    // Check if the trade's state is not finished and the initiator is the user's address
                    if (state !== 2 && initiator === ethers.utils.getAddress(address)) {
                        const _trade = { id: ethers.utils.formatUnits(id, 18), initiator, initiatorToken, initiatorAmount: ethers.utils.formatUnits(initiatorAmount, 18), counterPartyToken, balance: ethers.utils.formatUnits(balance, 18), state };
                        tradesData.push(_trade);
                    }
                }
                setTrades(tradesData);
            } catch (error) {
                console.error('Error fetching trades:', error);
            }
        };

        if (address && !myTrades) {
            console.log(address)
            fetchTrades();
        }
    }, [address]);


    // useEffect(() => {
    //     if (myTrades) {
    //         console.log(myTrades)
    //     }
    // }, [myTrades])

    return (
        <>
            <NavBar />
            <Stack
                minH="100vh"
                direction={["column-reverse", "row", "row"]}
                w="100%"
                bg="#f9faff"
                h="100vh"
                justifyContent="center"
            >
                <Box
                    width="70%"
                    left={0}
                    h="100vh"
                    px={6}
                    pt={24}
                    position={"absolute"}
                    bg="#151515"
                    overflowY="auto"
                    css={{
                        "&::-webkit-scrollbar": {
                            width: "5px",
                        },
                        "&::-webkit-scrollbar-thumb": {
                            background: "#4F81FF",
                            borderRadius: "5px",
                        },
                        "&::-webkit-scrollbar-thumb:hover": {
                            background: "#4F81FF",
                        },
                    }}
                >

                    <Box w="100%" display={"flex"} justifyContent={"flex-end"} pb={3} pr={2}>
                        <NotificationDrawer />
                    </Box>

                    <VStack
                        borderTopRadius={"18px"}
                        pt={8}
                        pb={12}
                        px={6}
                        w="100%"
                        alignItems="flex-start"
                        justifyItems="flex-start"
                        justifyContent="flex-start"
                        bg="rgba(42, 53, 80, 0.2)"
                        backdropFilter="blur(10px)"
                    >

                        <VStack w="100%" alignItems={"flex-start"}>
                            <Text
                                cursor={"pointer"}
                                border={"0.5px solid gray"}
                                borderRadius={"12px"}
                                p={3}
                                fontSize={"lg"}
                                fontWeight={"semibold"}
                                color={"white"}
                            >Ethereum</Text>

                            <Divider
                                pt={1}
                                opacity="0.1"

                            />
                            <Heading
                                color="white"
                            >${currentPrices.ethPrice}</Heading>
                        </VStack>


                        <Box w="100%"  >
                            <TradingChart />
                        </Box>
                    </VStack>
                    <br />
                    {myTrades && <TradeHistoryTable
                        tradeData={myTrades}
                    />}
                </Box>

                <VStack
                    bg="linear-gradient(209.6deg, #4F81FF 1%, #4F81FF 4%, #151515 34.36%)"
                    h="100%"
                    borderLeft="2px solid #3b3b3b"
                    minH="50vh"
                    py={24}
                    px={3}
                    w="30%"
                    right={0}
                    position="fixed"
                >
                    <Box
                        borderRadius="18px"
                        bg="rgba(79, 129, 255, 0.2)"
                        backdropFilter="blur(10px)"
                        w="100%"
                        h="100%"
                        p={8}
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Text fontSize="2xl" fontWeight="bold" mb={4} color="white">
                            P2P SWAP
                        </Text>

                        <Tabs w="100%" m={0} p={0} variant='soft-rounded' colorScheme='green'>
                            <TabList display={"flex"} justifyContent={"center"}>
                                <Tab>TOKENS</Tab>
                                <Tab color="whatsapp.500">NFT</Tab>
                            </TabList>
                            <TabPanels p={0}>
                                <TabPanel h="375px" display={"flex"} flexDir={"column"} alignItems={"center"}>
                                    <FormControl mb={4}>
                                        <FormLabel color="whiteAlpha.600">Send</FormLabel>
                                        <Select
                                            style={{
                                                color: "white"
                                            }}
                                            h="50px"
                                            placeholder="My token"
                                            value={traderToken}
                                            onChange={(e) => setTraderToken(e.target.value)}
                                        // styles={selectStyles}
                                        >
                                            {tokenOptions
                                                .filter((option) => option.value !== counterpartyToken) // Exclude the selected traderToken
                                                .map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                        </Select>
                                    </FormControl>


                                    <FormControl mb={4}>
                                        <FormLabel color="whiteAlpha.600">Swap Amount</FormLabel>
                                        <Input
                                            h="50px"
                                            style={{
                                                color: "white"
                                            }}
                                            placeholder="Enter trader amount"
                                            type="number"
                                            value={traderAmount}
                                            inputMode="decimal"
                                            pattern="\d+(\.\d{0,2})?"
                                            onChange={(e) => setTraderAmount(parseInt(e.target.value))}
                                        />
                                    </FormControl>

                                    <IconContext.Provider
                                        value={{
                                            color: 'white',
                                            size: '1.2em',
                                            style: { transform: 'rotate(90deg)' },
                                        }}
                                    >
                                        <FaExchangeAlt />
                                    </IconContext.Provider>
                                    <br />

                                    <FormControl mb={4}>
                                        <FormLabel color="whiteAlpha.600">Receive</FormLabel>
                                        <Select
                                            h="50px"
                                            style={{
                                                color: "white"
                                            }}
                                            placeholder="Counterparty Token"
                                            value={counterpartyToken}
                                            onChange={(e) => setCounterpartyToken(e.target.value)}

                                        >
                                            {tokenOptions
                                                .filter((option) => option.value !== traderToken)
                                                .map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}


                                        </Select>
                                    </FormControl>
                                </TabPanel>
                                <TabPanel h="375px">
                                    {/* //NFT Swap */}
                                </TabPanel>
                            </TabPanels>
                        </Tabs>


                        <Button
                            h="50px"
                            colorScheme="blue" mb={4} width="100%"
                            onClick={submitTrade}
                        >
                            Submit Swap Order
                        </Button>



                    </Box>
                </VStack>


            </Stack>
        </>

    );
};

export default Dashboard;


