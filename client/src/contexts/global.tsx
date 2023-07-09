
import { useRouter } from 'next/router.js';
import { createContext, useEffect, useState } from 'react';
import crypto from "crypto"

export interface AuthContext {
    values: {};
}

export const GlobalContext = createContext<AuthContext['values'] | null>(null);



const GlobalProvider = ({ children }: any) => {
    const [tradeAddress, setTradeAddress] = useState<string | null>("")


    useEffect(() => {
        const trade = localStorage.getItem("tradeAddress");
        if (trade) {
            setTradeAddress(trade)
        }
    }, [])



    return (
        <GlobalContext.Provider
            value={{
                tradeAddress,
                setTradeAddress
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
};

export default GlobalProvider;
