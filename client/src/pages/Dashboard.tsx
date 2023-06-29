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

export type Address = string | null;

const tokenOptions = [
    { label: "m_APE", value: "0x123abc" },
    { label: "m_BIT", value: "0x456def" },
    { label: "m_DAI", value: "0x789ghi" },
    { label: "m_USDC", value: "0xabc123" },
    { label: "m_ETH", value: "0xdef456" },
];

const Dashboard = () => {

    const { address } = useAccount();
    const [traderToken, setTraderToken] = useState("");
    const [traderAmount, setTraderAmount] = useState(0.00);
    const [counterpartyToken, setCounterpartyToken] = useState("");
    const currentPrices = useCurrentPrices()

    const handleSubmit = () => {
        // Perform trade order submission logic here
        console.log("Submitted trade order");
    };


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
                    <TradeHistoryTable />
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
                                            {tokenOptions.map((option) => (
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
                                            {tokenOptions.map((option) => (
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
                            colorScheme="blue" mb={4} width="100%" onClick={handleSubmit}>
                            Submit Swap Order
                        </Button>



                    </Box>
                </VStack>


            </Stack>
        </>

    );
};

export default Dashboard;


