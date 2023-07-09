import { useContext, useState } from "react";
import { Box, Text, Button, Textarea, HStack } from "@chakra-ui/react";
import { ethers } from "ethers";
import { factoryABI, factoryAddress } from "@/constants";
import { useAccount } from "wagmi";
import { GlobalContext } from "@/contexts/global";

const JsonParser = () => {
    const { address } = useAccount();
    const [jsonInput, setJsonInput] = useState(`[
        {
           "address":"0x6DA84c226162aBf933c18b5Ca6bC3577584bee86",
           "price":1
        },
        {
           "address":"0xcC8A7e1C88596Cf4e7073343100a4A1fD0eaC8C4",
           "price":1860.9
        }
     ]`);
    const [tokens, setTokens] = useState([]);
    const [prices, setPrices] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const { tradeAddress, setTradeAddress }: any = useContext(GlobalContext);

    const handleSubmit = () => {
        try {
            const parsedJson = JSON.parse(jsonInput);
            if (!Array.isArray(parsedJson)) {
                setErrorMessage("Invalid JSON: Expecting an array.");
                return;
            }

            const parsedTokens: any = [];
            const parsedPrices: any = [];

            parsedJson.forEach((item) => {
                if (!item.hasOwnProperty("address") || !item.hasOwnProperty("price")) {
                    throw new Error("Invalid JSON: Each item should have 'address' and 'price' properties.");
                }
                parsedTokens.push(item.address);
                parsedPrices.push(item.price);
            });

            setTokens(parsedTokens);
            setPrices(parsedPrices);
            setErrorMessage("");
        } catch (error: any) {
            setErrorMessage("Invalid JSON: " + error.message);
        }
    };

    const deploy = async () => {
        // Initialize ethers and contract instance
        const ethereum = (window as any).ethereum;
        if (!ethereum) {
            console.log("Ethereum provider not available");
            return;
        }
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contractAddress = "0xF5176d249a8Ca89Ac9E08A285942507edA07AD6f"; // factory address
        const contractAbi = factoryABI; // Replace with the actual trade contract ABI
        const contract = new ethers.Contract(contractAddress, contractAbi, signer);

        // Convert prices to integers
        const parsedPrices = prices.map((price) => parseInt(price));

        const create = await contract.createSpace(tokens, parsedPrices, {
            gasLimit: 5000000,
        });

        await create.wait();
        const spaces = await contract.getSpaces(address);
        // alert(spaces)
        const escrowAddress = spaces[0][1];
        console.log("Escrow contract deployed at: ", escrowAddress);
        setTradeAddress(escrowAddress);
        localStorage.setItem("tradeAddress", escrowAddress)
        localStorage.setItem("tokens", JSON.stringify(tokens));
    };

    

    return (
        <Box color="white">
            <Textarea
                placeholder="Paste JSON here"
                value={jsonInput}
                height="10rem" // 
                color="white"
                onChange={(e) => setJsonInput(e.target.value)}
            />
            {errorMessage && <Text color="red">{errorMessage}</Text>}
            <HStack alignItems={"center"}>
                <Button colorScheme="teal" mt={4} onClick={handleSubmit}>
                    Submit
                </Button>

                {tokens.length > 1 && prices.length > 1 && (
                    <Button bg="#4269cc" mt={4} onClick={deploy}>
                        Deploy Contract
                    </Button>
                )}
            </HStack>
            {tokens.length > 0 && (
                <Box mt={4}>
                    <Text>Tokens:</Text>
                    <ul>
                        {tokens.map((token, index) => (
                            <li key={index}>{token}</li>
                        ))}
                    </ul>
                </Box>
            )}
            {prices.length > 0 && (
                <Box mt={4}>
                    <Text> Prices:</Text>
                    <ul>
                        {prices.map((price, index) => (
                            <li key={index}>{price}</li>
                        ))}
                    </ul>
                </Box>
            )}

            {tradeAddress && tradeAddress.length > 3 && (
                <Box mt={4}>
                    <Text> Previously Deployed Escrow:</Text>
                    <ul>
                        <li>  {tradeAddress}  </li>
                    </ul>
                </Box>
            )}
        </Box>
    );
};

export default JsonParser;

