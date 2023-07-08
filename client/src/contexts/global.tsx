
import { useRouter } from 'next/router.js';
import { createContext, useEffect, useState } from 'react';
import crypto from "crypto"

export interface AuthContext {
    values: {};
}

export const GlobalContext = createContext<AuthContext['values'] | null>(null);



const GlobalProvider = ({ children }: any) => {
    const [tradeAddress, setTradeAddress] = useState<string | null>("0x70F415ae4E110517568b7eA6B4A771059cFD2A2A")


    // useEffect(() => {
    // const trade = localStorage.getItem("tradeAddress");
    // if (trade) {
    //     setTradeAddress(trade)
    // }
    // }, [])



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
