import {
    PublicKey,
    LAMPORTS_PER_SOL,
    Connection,
    TransactionSignature,
} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";

import { Buffer } from "buffer";

export const shortenAddress = (address: string) => {
    try {
        return address.slice(0, 4) + "..." + address.slice(-4);
    } catch (error) {
        console.error("shortenAddress => ", error);
        return "---";
    }
};

export const validateAddress = (address: string) => {
    window.Buffer = Buffer;
    try {
        let pubkey = new PublicKey(address);
        let isSolana = PublicKey.isOnCurve(pubkey.toBytes());
        return isSolana;
    } catch (error) {
        console.error("validateAddress => ", error);
        return false;
    }
};

const sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

export async function isBlockhashExpired(
    connection: Connection,
    initialBlockHeight: number
) {
    let currentBlockHeight = await connection.getBlockHeight();

    return currentBlockHeight > initialBlockHeight;
}

export const checkTransactionConfirmation = async (
    connection: Connection,
    signature: TransactionSignature
) => {
    const statusCheckInterval = 300;
    const timeout = 90000;
    let isBlockhashValid = true;

    const initialBlock = (await connection.getSignatureStatus(signature))
        .context.slot;

    let done = false;

    setTimeout(() => {
        if (done) {
            return;
        }
        done = true;
        console.log("Timed out for signature ", signature);
        console.log(
            `${
                isBlockhashValid
                    ? "Blockhash not yet expired."
                    : "Blockhash has expired."
            }`
        );
    }, timeout);

    while (!done && isBlockhashValid) {
        const confirmation = await connection.getSignatureStatus(signature);

        if (
            confirmation.value &&
            (confirmation.value.confirmationStatus === "confirmed" ||
                confirmation.value.confirmationStatus === "finalized")
        ) {
            console.log(
                `Confirmation Status: ${confirmation.value.confirmationStatus} `,
                signature
            );
            done = true;
        } else {
            console.log(
                `Confirmation Status: ${
                    confirmation.value?.confirmationStatus || "not yet found."
                }`
            );
        }
        isBlockhashValid = !(await isBlockhashExpired(
            connection,
            initialBlock
        ));
        await sleep(statusCheckInterval);
    }

    return done;
};

export const constants = {
    usdc: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    chancesCoin: "AHC8Qmn4bgdYDMAJ4JCYUKhq5vxYkKh8Bh2z4daumZVS",
    tokenRecipient: "2sMVFJBi8qEMPshKsqeoNtmYDhvhcN9c3K6FYtgz4NvX",
};
