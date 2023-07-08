import { BTCAddress, ETHAddress } from "@/constants";
import { Table, Tbody, Tr, Td, Center, Icon, useColorModeValue, Th, Thead, Box } from "@chakra-ui/react";
import { FiRepeat } from "react-icons/fi";
import { ethers } from "ethers";

const TradeHistoryTable = (prop: { tradeData: any[] | null }) => {

    const tradeData = prop.tradeData;
    const textColor = useColorModeValue("whiteAlpha.600", "gray.800");
    const lineColor = useColorModeValue("blue", "blue");


    if (!tradeData) {
        return;
    }


    const tokenOptions = [
        { label: "m_BTC", value: BTCAddress },
        { label: "m_ETH", value: ETHAddress },
        // { label: "m_USDC", value: "0xabc123" },
    ];

    return (
        <Table variant="unstyled" color={textColor}

            fontSize={"sm"}
            borderColor={lineColor} >

            <Thead color={"#334c8b"}>
                <Tr>
                    <Th>ID</Th>
                    <Th>Trade</Th>
                    <Th>Total In</Th>
                    <Th>Total Out</Th>
                    <Th>Status</Th>
                </Tr>
            </Thead>
            <Tbody>
                {tradeData.map((trade) => (
                    <Tr key={trade.id}>
                        <Td>      {(parseInt(trade.id))}
                        </Td>
                        <Td
                            color={"white"}
                        >
                            {tokenOptions.map((token) => token.value === trade.initiatorToken && token.label)}
                            <Icon as={FiRepeat}
                                mx={1}
                                color={"#334c8b"}
                            />    {tokenOptions.map((token) => token.value === trade.counterPartyToken && token.label)}
                        </Td>
                        <Td color="white">
                            0
                            {/* {trade.amountReceived}  */} {" "}
                            {tokenOptions.map((token) => token.value === trade.counterPartyToken && token.label)}
                        </Td>
                        <Td color="white">{trade.balance} {" "}
                            {tokenOptions.map((token) => token.value === trade.initiatorToken && token.label)}</Td>
                        <Td color="white">
                            <Box as="span" style={{
                                cursor: "pointer",
                                textDecoration: "underline",
                                color: trade.state === 2 ? "gray.300" : trade.state === 1 ? "#727a00" : "#006d7c"
                            }}>
                                {trade.state === 2 ? "Finished" : trade.state === 1 ? "Partial" : "Begun"
                                }
                            </Box>

                        </Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    );
};

export default TradeHistoryTable;
