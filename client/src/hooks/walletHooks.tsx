import { useState, useEffect } from 'react';

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


