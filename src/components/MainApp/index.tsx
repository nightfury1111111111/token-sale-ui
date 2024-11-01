import { useEffect, useState } from "react";
import {
    Transaction,
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    createTransferCheckedInstruction,
} from "@solana/spl-token";
import axios from "axios";
import getStripe from "../../utils/getStripe";
import { loadStripe } from "@stripe/stripe-js";

import { Program, AnchorProvider } from "@project-serum/anchor";
import { Idl } from "@project-serum/anchor/dist/cjs/idl";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { successToast, errorToast, loadingToast } from "../Notification";
import { SolanaNetworkType } from "../../App";
import * as anchor from "@project-serum/anchor";
import { checkTransactionConfirmation, constants } from "../../utils/general";
import idl from "../../utils/idl.json";
import { token } from "@project-serum/anchor/dist/cjs/utils";

interface MainProps {
    solanaNetwork: SolanaNetworkType;
}

const programID = new PublicKey(idl.metadata.address);
const usdc = new PublicKey(constants.usdc);
const chancesCoin = new PublicKey(constants.chancesCoin);
const tokenRecipient = new PublicKey(constants.tokenRecipient);

export default function MainApp({ solanaNetwork }: MainProps) {
    const { connection } = useConnection();
    const { publicKey, wallet, signTransaction, signAllTransactions } =
        useWallet();

    const [buyAmount, setBuyAmount] = useState(0);
    const [remainingAmount, setRemainingAmount] = useState(0);

    const [isBusy, setIsBusy] = useState(false);
    const [currentUSDCTokenAmount, setCurrentUSDCTokenAmount] = useState(0);

    const [refreshCount, setRefreshCount] = useState<number>(0);

    async function handleCheckout() {
        const stripe = await loadStripe(
            "pk_live_51Q8m5jDt9bTick7QcGscxY7OAYb1aXK8i6BExhG3dwtScTRItTFaq2JAqy3zdPbIgxbI5LHFKcS3QrjLBAIGkym400OEUkUbMA"
        );
        if (!stripe) return;
        const { error } = await stripe.redirectToCheckout({
            lineItems: [
                {
                    price: "price_1QGMeCDt9bTick7QDoRAmU9X",
                    quantity: 100,
                },
            ],
            mode: "payment",
            successUrl: `https://chancescoin.com`,
            cancelUrl: `https://chancescoin.com`,
            // customerEmail: "dragondev93@gmail.com",
            clientReferenceId: "5aDNJ9HFm87rJ9y9dn8pYX2EG1nYgRZATbo94mq3k5yR",
        });
        console.warn(error.message);
    }

    const getProvider = () => {
        if (!wallet || !publicKey || !signTransaction || !signAllTransactions) {
            return;
        }
        const signerWallet = {
            publicKey: publicKey,
            signTransaction: signTransaction,
            signAllTransactions: signAllTransactions,
        };

        const provider = new AnchorProvider(connection, signerWallet, {
            preflightCommitment: "recent",
        });

        return provider;
    };

    const fetchStakeData = async () => {
        const provider = getProvider();
        if (!provider) return;
        // const vault = PublicKey.findProgramAddressSync(
        //     [Buffer.from("vault"), chancesCoin.toBuffer()],
        //     programID
        // )[0];
        const vault = new PublicKey(
            "6PWsDNSsvfdSny82UD8MyaFdEGzu8e4udM6b8vMPqXSx"
        );

        try {
            const vaultAmount =
                await provider.connection.getTokenAccountBalance(vault);

            setRemainingAmount(vaultAmount.value.uiAmount || 0);
        } catch (err) {
            console.log(err);
        }
    };

    const fetchUserData = async () => {
        const provider = getProvider();
        if (!publicKey || !provider) return;
        const usdcTokenAccount = await getAssociatedTokenAddress(
            usdc,
            publicKey,
            true,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        try {
            const tokenInfo = await provider.connection.getTokenAccountBalance(
                usdcTokenAccount
            );

            setCurrentUSDCTokenAmount(tokenInfo.value.uiAmount || 0);
        } catch (err) {
            console.log("err occurred", err);
        }
    };

    useEffect(() => {
        fetchStakeData();
        fetchUserData();
    }, [publicKey]);

    const handleRefresh = () => {
        setBuyAmount(0);
        setRefreshCount((prevState) => prevState + 1);
    };

    // function to handle button click
    const buyTokenHandler = async () => {
        try {
            if (!publicKey) {
                errorToast("No wallet connected!");
                return;
            }

            if (!buyAmount) {
                errorToast("No amount entered!");
                return;
            }

            if (Number(buyAmount) <= 0) {
                errorToast("Invalid amount! Should be greater than 0");
                return;
            }
            setIsBusy(true);
            const provider = getProvider(); //checks & verify the dapp it can able to connect solana network
            if (!provider || !publicKey || !signTransaction) return;
            // const program = new Program(idl as Idl, programID, provider);

            // const adminKey = PublicKey.findProgramAddressSync(
            //     [Buffer.from("state"), Buffer.from("admin")],
            //     program.programId
            // )[0];
            // const vault = PublicKey.findProgramAddressSync(
            //     [Buffer.from("vault"), chancesCoin.toBuffer()],
            //     program.programId
            // )[0];

            // const userTargetTokenAccount = getAssociatedTokenAddressSync(
            //     chancesCoin,
            //     provider.publicKey,
            //     false,
            //     TOKEN_PROGRAM_ID
            // );

            const userPaymentTokenAccount = getAssociatedTokenAddressSync(
                usdc,
                provider.publicKey,
                false,
                TOKEN_PROGRAM_ID
            );

            const tokenRecipientPaymentTokenAccount =
                getAssociatedTokenAddressSync(
                    usdc,
                    tokenRecipient,
                    false,
                    TOKEN_PROGRAM_ID
                );

            let transaction = new Transaction();

            // try {
            //     await provider.connection.getTokenAccountBalance(
            //         userTargetTokenAccount
            //     );
            // } catch (err) {
            //     console.log("here");
            //     const createChancesCoinAccountIx =
            //         createAssociatedTokenAccountInstruction(
            //             provider.publicKey,
            //             userTargetTokenAccount,
            //             provider.publicKey,
            //             chancesCoin,
            //             TOKEN_PROGRAM_ID
            //         );
            //     transaction.add(createChancesCoinAccountIx);
            // }

            try {
                await provider.connection.getTokenAccountBalance(
                    tokenRecipientPaymentTokenAccount
                );
            } catch (err) {
                console.log("here");
                const createPaymentTokenAccountForTokenRecipientIx =
                    createAssociatedTokenAccountInstruction(
                        provider.publicKey,
                        tokenRecipientPaymentTokenAccount,
                        tokenRecipient,
                        usdc,
                        TOKEN_PROGRAM_ID
                    );
                transaction.add(createPaymentTokenAccountForTokenRecipientIx);
            }

            loadingToast(`Buying ${buyAmount} Token`);

            // const tx = program.transaction.purchaseByUser(
            //     new anchor.BN((buyAmount / 100) * 1e6), // 100 token = 1 USD
            //     {
            //         accounts: {
            //             user: publicKey,
            //             adminState: adminKey,
            //             targetToken: chancesCoin,
            //             userTargetTokenAccount: userTargetTokenAccount,
            //             paymentToken: usdc,
            //             userPaymentTokenAccount,
            //             tokenRecipientPaymentTokenAccount,
            //             vault: vault,
            //             tokenProgram: TOKEN_PROGRAM_ID,
            //         },
            //     }
            // );
            const tx = createTransferCheckedInstruction(
                userPaymentTokenAccount,
                usdc,
                tokenRecipientPaymentTokenAccount,
                publicKey,
                new anchor.BN((buyAmount / 1) * 1e6), // 1 token = 1 USD
                6
            );

            transaction.add(tx);
            transaction.feePayer = provider.wallet.publicKey;
            transaction.recentBlockhash = (
                await connection.getLatestBlockhash("confirmed")
            ).blockhash;
            const signedTx = await provider.wallet.signTransaction(transaction);
            const txId = await connection.sendRawTransaction(
                signedTx.serialize()
            );
            // const isConfirmed = await checkTransactionConfirmation(
            //     connection,
            //     txId
            // );
            const isConfirmed = true;

            if (isConfirmed) {
                try {
                    axios.post("https://api.chancescoin.com/token/send", {
                        signature: txId,
                    });
                } catch (err) {
                    console.log("backend communication error", err);
                }
                successToast(
                    `Wait for a few minutes. You will get ${buyAmount} tokens.`
                );
            } else {
                errorToast(
                    `Couldn't confirm transaction! Please check on Solana Explorer`
                );
            }

            console.log(txId);
            fetchUserData();
            fetchStakeData();
            setIsBusy(false);
            handleRefresh();
        } catch (error) {
            setIsBusy(false);
            handleRefresh();
            errorToast("Something went wrong while sending Tokens!");
            console.error("solSendHandler => ", error);
        }
    };

    return (
        <main className="main flex justify-center">
            <div className="w-[80vw]">
                <h1 className="heading-1 my-4 sm:px-4 text-4xl">
                    Welcome to ChancesCoin
                </h1>
                <button onClick={handleCheckout} className="text-white">
                    Checkout
                </button>
                <div className="w-[420px] p-4 rounded-3xl border-[1px] border-[#ffffff] text-white">
                    <div className="flex justify-between">
                        <span>Remaining Amount</span>
                        <span>{remainingAmount}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Price</span>
                        <span>1 USD</span>
                    </div>
                </div>

                {publicKey ? (
                    <div className="mt-4 w-[420px] rounded-3xl border-[1px] border-[#ffffff] p-4">
                        <div className="text-white">
                            Buy ChancesCoin using solUSDC
                        </div>
                        <div className="mt-4 flex items-center">
                            <input
                                className="w-[100px] h-10 px-4 rounded-md"
                                type="number"
                                placeholder="Enter amount"
                                value={Number(buyAmount)}
                                onChange={(event) => {
                                    setBuyAmount(Number(event.target.value));
                                }}
                                min={0}
                            />
                            <button
                                type="button"
                                className="button ml-4 w-40 bg-gradient-to-r from-[#1ddaff] to-[#ea1af7] rounded-md text-lg px-4 py-2"
                                onClick={buyTokenHandler}
                                disabled={isBusy}
                            >
                                Buy token
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-secondary text-xl text-center mt-20">
                        Please connect wallet to use the app.
                    </p>
                )}
            </div>
        </main>
    );
}
