import { useState, useEffect } from 'react';
import { ethers } from "ethers";
import { factoryAbi, factoryAddress, shortenAddress, walletAbi } from '@/constants';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';

export type NewParticipant = {
    address: string,
    share: string

}


export function useCurrentPrices() {
    const [currentPrices, setCurrentPrices] = useState<{ ethPrice: number | null; btcPrice: number | null }>({
        ethPrice: null,
        btcPrice: null,
    });

    useEffect(() => {
        const fetchCurrentPrices = async () => {
            try {
                const responseETH = await fetch(
                    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
                );
                const responseBTC = await fetch(
                    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
                );
                const dataETH = await responseETH.json();
                const dataBTC = await responseBTC.json();

                setCurrentPrices({
                    ethPrice: dataETH.ethereum.usd,
                    btcPrice: dataBTC.bitcoin.usd,
                });
            } catch (error) {
                console.error("Error fetching current prices:", error);
            }
        };

        fetchCurrentPrices();
    }, []);

    return currentPrices;
};

export function useSpaceInfo(spaceId: string) {
    const [spaceCreated, setSpaceCreated] = useState(false);
    const [walletCreated, setWalletCreated] = useState<boolean | null>(null);
    const { address } = useAccount();

    useEffect(() => {
        const getSpaceInfo = async () => {
            if (!address) {
                return
            }
            const ethereum = (window as any).ethereum;
            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(factoryAddress, factoryAbi, signer);
                const tx = await contract.spaces(spaceId);
                if (tx) {
                    // console.log(tx)
                    const checkWallet = tx.walletCreated;
                    setWalletCreated(checkWallet);
                }
            }
        };

        const isSpaceCreated = async () => {
            const ethereum = (window as any).ethereum;
            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(factoryAddress, factoryAbi, signer);
                const tx = await contract.isSpaceCreated(spaceId);
                setSpaceCreated(tx);
            }
        };

        if (spaceId && spaceCreated && !walletCreated) {
            getSpaceInfo();
        }

        if (spaceId && !spaceCreated) {
            isSpaceCreated();
        }
    }, [spaceId, address, spaceCreated, walletCreated]);

    return { spaceCreated, walletCreated, setSpaceCreated };
}

export function useWalletInfo(spaceId: string, address: string) {
    const [spaceWallet, setSpaceWallet] = useState<any | null>(null);
    const [walletInfo, setWalletInfo] = useState<any | null>(null);
    const { spaceCreated } = useSpaceInfo(spaceId);
    const { walletCreated } = useSpaceInfo(spaceId)
    const [totalBalance, setTotalBalance] = useState<any | null>(0)
    const [history, setHistory] = useState<any[] | null>(null)
    const router = useRouter()

    //for the demo purposes we want to withdraw the entire balance
    const withdraw = async () => {

        try {
            const ethereum = (window as any).ethereum;
            if (!ethereum) {
                return;
            }
            const provider = new ethers.providers.Web3Provider(ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(spaceWallet, walletAbi, signer);
            const myBalance = await contract.balances(address);

            // Withdraw entire balance
            const tx = await contract.withdraw(myBalance);
            await tx.wait();

            // Update wallet info
            const share = await contract.shares(address);
            const balance = await contract.balances(address);
            setWalletInfo({ share, balance });

            alert("Withdrawal successful");
            router.reload()

        } catch (error) {
            console.error("Error withdrawing:", error);
        }
    };

    useEffect(() => {
        const getSpaceWallet = async () => {
            if (!address) {
                return
            }
            const ethereum = (window as any).ethereum;
            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(factoryAddress, factoryAbi, signer);
                const tx = await contract.wallets(spaceId);
                // Retrieve the balance of the address
                setSpaceWallet(tx);

            }
        };
        if (spaceCreated && !spaceWallet) {
            getSpaceWallet();
        }
    }, [spaceCreated, address,spaceId, spaceWallet]);

    useEffect(() => {
        const getWalletInfo = async () => {
            if (spaceWallet) {
                const ethereum = (window as any).ethereum;
                if (ethereum) {
                    const provider = new ethers.providers.Web3Provider(ethereum);
                    const signer = provider.getSigner();
                    const contract = new ethers.Contract(spaceWallet, walletAbi, signer);
                    const share = await contract.shares(address);
                    const balance = await contract.balances(address);
                    const transactionHistory: any = await contract.getTransactionHistory(address);
                    setWalletInfo({ share, balance });
                    const Tbalance = await provider.getBalance(spaceWallet);
                    // Format the balance in Ether
                    const formattedBalance = ethers.utils.formatEther(Tbalance);
                    setTotalBalance(formattedBalance)
                    const txns: any = [];
                    transactionHistory.forEach((transaction: any) => {
                        const amount = transaction[0].toString();
                        const timestamp = transaction[1];
                        const sender = transaction[3];
                        const receiver = transaction[2];
                        const isDeposit = transaction[4].toString();
                        const timestampNumber = parseInt(timestamp, 16); // Convert the hexadecimal value to a decimal number
                        const timestampDate = new Date(timestampNumber * 1000); // Multiply by 1000 to convert from seconds to milliseconds

                        console.log(isDeposit);
                        const options: any = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
                        const formattedDate = timestampDate.toLocaleString('en-US', options)
                        const extractedTransaction = {
                            amount: ethers.utils.formatEther(amount),
                            method: isDeposit && isDeposit === "true" ? 'Deposit' : isDeposit && isDeposit === "false" ? 'Withdrawal' : '',
                            from: shortenAddress(sender),
                            to: shortenAddress(receiver),
                            date: formattedDate.toString()
                        };
                        txns.push(extractedTransaction);
                    });

                    setHistory(txns)

                }
            }
        };

        if (walletCreated && spaceWallet && !walletInfo) {
            getWalletInfo();
        }
    }, [spaceWallet,address, walletCreated, walletInfo]);

    return { totalBalance, spaceWallet, walletInfo, withdraw, history };
}

export function useCreateSpace(spaceId: string, newParticipants: NewParticipant[]) {
    const [loadingNewSpace, setLoadingNewSpace] = useState(false);
    const { setSpaceCreated } = useSpaceInfo(spaceId);
    const createSpace = async () => {
        const participantAddresses = newParticipants.map((participant) => participant.address);
        const participantShares = newParticipants.map((participant) => parseInt(participant.share, 10));
        const ethereum = (window as any).ethereum;
        if (!ethereum) {
            return;
        }

        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(factoryAddress, factoryAbi, signer);

        const tx = await contract.createSpace(spaceId, participantAddresses, participantShares);
        setLoadingNewSpace(true);
        await tx.wait();
        console.log("Space successfully created", tx);
        alert("Space successfully created");
        setSpaceCreated(true);
        setLoadingNewSpace(false);
    };
    return { createSpace, loadingNewSpace };
};

export function useSignAgreement(spaceId: string, participantAddresses: string[], address: string) {
    const [isUserSigned, setIsUserSigned] = useState(false);
    const [signatureStatuses, setSignatureStatuses] = useState<any | null>(null);



    useEffect(() => {
        const checkSignatureStatuses = async () => {
            if (!address) {
                return
            }
            const fetchedStatuses: any = {};
            const ethereum = (window as any).ethereum;
            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(factoryAddress, factoryAbi, signer);
                for (const address of participantAddresses) {
                    if (address) {
                        const result = await contract.isParticipantSigned(spaceId, address);
                        fetchedStatuses[address] = result;
                    }
                }
                setSignatureStatuses(fetchedStatuses);
            }
        };

        if (participantAddresses.length > 0 && spaceId && !signatureStatuses) {
            checkSignatureStatuses();
        }
    }, [participantAddresses,address,  spaceId, signatureStatuses]);



    const signAgreement = async () => {
        const ethereum = (window as any).ethereum;
        if (ethereum) {
            const provider = new ethers.providers.Web3Provider(ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(factoryAddress, factoryAbi, signer);
            const tx = await contract.signAgreement(spaceId);
            console.log(`${address} has signed the agreement`, tx);
            setIsUserSigned(true);
        }
    };

    useEffect(() => {
        const isParticipantSigned = async () => {
            if (!address) {
                return
            }
            const ethereum = (window as any).ethereum;
            if (!ethereum) {
                return;
            }
            const provider = new ethers.providers.Web3Provider(ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(factoryAddress, factoryAbi, signer);
            const result = await contract.isParticipantSigned(spaceId, address);
            setIsUserSigned(result);
        };

        isParticipantSigned();
    }, [address, spaceId]);

    return { signatureStatuses, isUserSigned, signAgreement };
};




