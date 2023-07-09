
import { useState, useEffect, useContext } from "react";
import { Box, Text, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader, DrawerOverlay, IconButton, Divider, VStack, HStack, Button, Flex, Center } from "@chakra-ui/react";
import { FiAlertCircle, FiBell, FiThumbsUp } from "react-icons/fi";
import { tradeABI } from "@/constants";
import { GlobalContext } from "@/contexts/global";
import { ethers } from "ethers";
import { useAccount } from "wagmi";

const NotificationDrawer = () => {
    const { tradeAddress }: any = useContext(GlobalContext);
    const { address } = useAccount();
    const [isOpen, setIsOpen] = useState(false);
    const [pending, setPending] = useState<any | null>(null);


    const handleToggleDrawer = () => {
        setIsOpen(!isOpen);
    };

    useEffect(() => {

        if (!address) {
            return;
        }
        const ethereum = (window as any).ethereum;
        if (!ethereum) {
            console.log("Ethereum provider not available");
            return;
        }
        // Initialize ethers provider and contract instances
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contractAddress = tradeAddress; // Replace with the actual trade contract address
        const contractAbi = tradeABI; // Replace with the actual trade contract ABI
        const contract = new ethers.Contract(contractAddress, contractAbi, signer);

        // Fetch pending swaps when component mounts
        async function fetchSwaps() {
            const pendingSwaps = [];
            const result = await contract.getPendingSwaps(address);

            if (result && result.length > 0) {
                for (let i = 0; i < result.length; i++) {
                    const swap = result[i];
                    const pendingSwap = {
                        id: swap.id.toString(),
                        initiatorAmount: swap.initiatorAmount.toString(),
                        counterPartyAmount: swap.counterPartyAmount.toString(),
                        counterParty: swap.counterParty,
                        initiator: swap.initiator,
                        initiatorToken: swap.initiatorToken,
                        counterPartyToken: swap.counterPartyToken,
                        completed: swap.completed,
                    };
                    pendingSwaps.push(pendingSwap);
                    console.log(pendingSwap);
                    setPending(pendingSwaps);
                }
            }

        }
        if (address && tradeAddress && !pending) {
            fetchSwaps();
        }

    },);


    return (
        <Box>
            <IconButton
                bg="blue"
                color={"white"}
                icon={<FiBell />}
                size="lg"
                _hover={{
                    background: "#1c212e"
                }}
                onClick={handleToggleDrawer} aria-label={""} />
            <Drawer
                isOpen={isOpen}
                placement="right"
                onClose={handleToggleDrawer}
                size="sm"

            >
                <DrawerOverlay>
                    <DrawerContent bg="#1a2748"
                        color="white"

                    >
                        <DrawerCloseButton />
                        <DrawerHeader>Trade Notifications</DrawerHeader>
                        <DrawerBody>
                            <Divider opacity={0.2} />

                            <VStack py={3} w="100%">

                                {pending && (
                                    pending.map((item: any, i: any) => (
                                        <Box
                                            key={i}
                                            bg="#1e2d52"
                                            fontSize={"sm"} px={3} w="100%" borderRight="2px solid #233560" borderRightRadius={"1px"} py={4}>
                                            <HStack alignItems={"flex-start"} justifyContent={"space-between"} >
                                                <Box>
                                                    <Flex color="yellow" alignItems={"center"} >
                                                        <FiAlertCircle
                                                        />  <Text ml={2}>Pending Action</Text>
                                                    </Flex>
                                                    <Text color="whiteAlpha.700" fontSize={"9px"}>Swap ID: {item.id}</Text>
                                                </Box>

                                                <Box>
                                                    <Flex alignItems={"center"} fontSize="lg" fontWeight={"bold"}>
                                                        <FiThumbsUp />
                                                        <Text ml={2}>    Match Found</Text>
                                                    </Flex>
                                                </Box>
                                            </HStack>

                                            <Text py={2} fontSize={"xs"}>Please approve to fulfill requested swap
                                            </Text>


                                            <HStack fontSize={"xs"} pt={0}>
                                                <Text fontSize="xs" color={"whiteAlpha.700"}>Send: <span style={{
                                                    color: "white"
                                                }}>
                                                    {ethers.utils.formatUnits(item.counterPartyAmount, 18)}
                                                </span></Text>
                                                <Text fontSize="xs" color={"whiteAlpha.700"}>Recieve: <span style={{
                                                    color: "white"
                                                }}>
                                                    {ethers.utils.formatUnits(item.initiatorAmount, 18)}
                                                </span></Text>
                                            </HStack>
                                            <HStack mt={2} spacing={2}>

                                                <Button
                                                    cursor={"pointer"}
                                                    fontSize={"sm"} h="30px"
                                                    bg="#4F81FF"
                                                    _hover={{
                                                        background: "#4F81FF",
                                                        color: "white"
                                                    }}
                                                >Approve</Button>
                                                {/* <Button
                                            fontSize={"sm"} h="30px"
                                            colorScheme="gray"
                                        >Reject</Button> */}
                                            </HStack>
                                        </Box>
                                    ))

                                )}

                            </VStack>

                        </DrawerBody>
                    </DrawerContent>
                </DrawerOverlay>
            </Drawer>
        </Box>
    );
};

export default NotificationDrawer;
