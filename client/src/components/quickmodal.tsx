import { useState } from "react";
import { Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Box } from "@chakra-ui/react";
import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";

const QuickModal = ({ tradeIds, trades, isOpen, onClose, onConfirmTrade }: any) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirmTrade = async () => {
        setIsLoading(true);
        // Perform any necessary actions for confirming the trade
        // For example, making an API request or updating the state
        await onConfirmTrade();
        setIsLoading(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Matching Trade</ModalHeader>
                <ModalBody>
                    {trades && trades.length > 0 && trades.map((tradeId: any, index: number) => {

                        const idd = 1;
                        const bal = ethers.utils.formatEther(tradeId.id.toString());
                        return (
                            <Box key={index} fontSize={"xs"} bg="whitesmoke" mb={2} borderBottom={"1 px solid gray"}>
                                <p key={index}>trade id: {idd}</p>
                                <p>balance: {bal}</p>
                                <p key={index}> trader address: {tradeId.initiator}</p>
                            </Box>

                        )
                    })}

                    {!trades && (
                        <p>New Trade</p>
                    )}


                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>
                        Cancel Trade
                    </Button>
                    <Button colorScheme="blue" isLoading={isLoading} onClick={handleConfirmTrade}>
                        Confirm Trade
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default QuickModal;
