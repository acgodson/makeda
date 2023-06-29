import { Table, Tbody, Tr, Td, Center, Icon, useColorModeValue, Th, Thead, Box } from "@chakra-ui/react";
import { FiRepeat } from "react-icons/fi";

const TradeHistoryTable = () => {
    const tradeData = [
        {
            id: 1,
            trade: {
                from: "ETH",
                to: "BTC"
            },
            amountReceived: 0.123456,
            balanceLeft: 0.54321,
            status: "Finished"
        },
        {
            id: 2,
            trade: {
                from: "BTC",
                to: "ETH"
            },
            amountReceived: 0.987654,
            balanceLeft: 0.12345,
            status: "Partial"
        },
        {
            id: 3,
            trade: {
                from: "LTC",
                to: "XRP"
            },
            amountReceived: 10.0,
            balanceLeft: 0.0,
            status: "Pending"
        }
    ];
    const textColor = useColorModeValue("whiteAlpha.600", "gray.800");
    const lineColor = useColorModeValue("blue", "blue");

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
                        <Td>{trade.id}</Td>
                        <Td
                            color={"white"}
                        >
                            {trade.trade.from} <Icon as={FiRepeat} /> {trade.trade.to}
                        </Td>
                        <Td>{trade.amountReceived} {trade.trade.to} </Td>
                        <Td>{trade.balanceLeft}  {trade.trade.from}</Td>
                        <Td>
                            <Box as="span" style={{
                                cursor: "pointer",
                                textDecoration: "underline",
                                color: trade.status === "Finished" ? "gray.300" : trade.status === "Partial" ? "#727a00" : "#006d7c"
                            }}>
                                {trade.status}
                            </Box>

                        </Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    );
};

export default TradeHistoryTable;
