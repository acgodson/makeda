import React, { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useAccount, useChainId } from "wagmi";
import { Box, HStack, Text, Icon, Divider, VStack, Select, Heading, Button, Table, Tbody, Td, Th, Thead, Tr, Stack, Center, FormControl, FormLabel, Input, IconButton, Tab, TabList, TabPanel, TabPanels, Tabs, useToast } from '@chakra-ui/react';
import { FaCheckCircle, FaClock, FaExchangeAlt } from 'react-icons/fa';
import { IconContext } from 'react-icons';
import TradingChart from "@/components/TradingChart";
import TradeHistoryTable from '@/components/TradeHistory';
import { useCurrentPrices } from '@/hooks/walletHooks';
import NotificationDrawer from '@/components/Notification';
import NavBar from '@/components/NavBar';
import { BTCAddress, ETHAddress, erc20ABI, tradeABI } from '@/constants';
import JsonParser from '@/components/DeployForm';
import { GlobalContext } from '@/contexts/global';
import QuickModal from '@/components/quickmodal';
import BigNumber from 'bignumber.js';


export type Address = string | null;

const tokenOptions = [
    { label: "m_USDC", value: "0x6DA84c226162aBf933c18b5Ca6bC3577584bee86" },
    { label: "m_ETH", value: "0xcC8A7e1C88596Cf4e7073343100a4A1fD0eaC8C4" },
    // { label: "m_USDC", value: "0xabc123" },
];

const Dashboard = () => {
    const { tradeAddress }: any = useContext(GlobalContext);
    const { address } = useAccount();
    const [traderToken, setTraderToken] = useState<string>("");
    const [traderAmount, setTraderAmount] = useState<number>(0.00);
    const [counterpartyToken, setCounterpartyToken] = useState<string>("");
    const [myTrades, setTrades] = useState<any[] | null>(null);
    const currentPrices = useCurrentPrices()
    const [pageIndex, setPageIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [tradeIds, setTradeIds] = useState<any[] | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [matchingTrades, setmatchingTrades] = useState<any[] | null>(null);
    const handleOpenModal = () => {
        setIsOpen(true);
    };

    const handleCloseModal = () => {
        setIsOpen(false);
    };

    const submitTrade = async () => {
        // Check if all required inputs are provided
        if (!traderToken || !traderAmount || !counterpartyToken) {
            console.log("Please fill in all the fields");
            return;
        }

        if (!tradeAddress) {
            toast({
                title: "please deploy a trade contract",
                status: "error"
            })
            return;
        }

        setSubmitting(true)
        setIsOpen(true)

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

        const tx = await contract.getMatches(traderToken, traderAmount, counterpartyToken, {
            gasLimit: 5000000,
        });

        console.log("Matching Trade", tx);

        if (tx.length > 0) {

            const rr = tx.map((x: any) => {
                const obj = {
                    balance: x[0],
                    id: x[2],
                    initiator: x[3]
                }
                return obj
            })

            console.log(rr)
            const bb = rr.map((x: any) => new BigNumber(x.balance.toString()).toNumber()
            )
            console.log("trade IDs", bb)
            setmatchingTrades(bb)
            setTradeIds(rr);
        } else {
            setTradeIds([])
            setmatchingTrades([])
        }
    };




    const toast = useToast();
    async function handleConfirmTrade() {

        // Convert traderAmount to the appropriate unit (e.g., from mBTC to BTC)
        const convertedAmount = ethers.utils.parseEther(traderAmount.toString());

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

            const allowance = await TradertokenContract.allowance(address, contract.address);

            if (allowance.lt(convertedAmount)) {
                // Request approval from the user
                const preTx = await TradertokenContract.approve(contract.address, ethers.utils.parseUnits(String(traderAmount + 3), 18));
                preTx.wait();
            }
            const transactionObject = {
                gasLimit: 5000000,
                // title: 'Submit Trade Order'
            };

            const tx = await contract.submitTradeOrder(
                matchingTrades,
                convertedAmount,
                traderToken,
                ethers.utils.getAddress(counterpartyToken),
                transactionObject
            );

            tx.wait()
            console.log("Trade order submitted:", tx.hash);
            setTraderAmount(0)
            setTraderToken("")
            setCounterpartyToken("")
            setSubmitting(false)
        } catch (e) {
            console.log(e)
        }

    }

    useEffect(() => {
        const fetchTrades = async () => {
            if (!address || !tradeAddress) {
                return;
            }
            try {
                const ethereum = (window as any).ethereum;
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const tradeContract = new ethers.Contract(tradeAddress, tradeABI, signer);
                const tradeCounter = await tradeContract.tradeCounter();
                const tradesData = [];


                for (let i = 1; i <= tradeCounter; i++) {
                    const {
                        0: id,
                        1: initiator,
                        2: initiatorAmount,
                        3: initiatorToken,
                        4: counterPartyToken,
                        5: counterPartyAmount,
                        6: balance, 7:
                        state } = await tradeContract.trades(i);
                    // Check if the trade's state is not finished and the initiator is the user's address
                    if (state !== 2 && initiator === ethers.utils.getAddress(address)) {
                        const _trade = { id: id, initiator, initiatorToken, initiatorAmount: ethers.utils.formatUnits(initiatorAmount, 18), counterPartyToken, balance: ethers.utils.formatUnits(balance, 18), state };
                        tradesData.push(_trade);
                    }
                }
                setTrades(tradesData);
            } catch (error) {
                console.error('Error fetching trades:', error);
            }
        };

        if (address && !myTrades) {
            console.log(tradeAddress)
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
                {pageIndex === 0 && (
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

                        <Box w="100%" display={"flex"} justifyContent={"center"} pb={3} pr={2}>
                            <Button
                                onClick={() => setPageIndex(1)}
                            >Deploy Swap Contract</Button>
                            <Box position={"absolute"}
                                pr={5}
                                mb={5}
                                right={0}>
                                <NotificationDrawer />
                            </Box>
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

                )}

                {pageIndex === 1 && (
                    <Box width="70%"
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
                        }}>

                        <Box w="100%" display={"flex"} justifyContent={"center"} pb={3} pr={2}>
                            <Button
                                onClick={() => setPageIndex(0)}
                            >Home</Button>
                        </Box>

                        <JsonParser />
                    </Box>

                )}


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
                                            value={traderToken.toString()}
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

            <QuickModal
                tradeIds={matchingTrades}
                trades={tradeIds}
                isOpen={isOpen}
                onClose={handleCloseModal}
                onConfirmTrade={handleConfirmTrade}
            />

        </>

    );
};

export default Dashboard;


