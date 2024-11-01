import { loadStripe } from "@stripe/stripe-js";

let stripePromise: any;
const getStripe = () => {
    if (!stripePromise) {
        stripePromise = loadStripe(
            "pk_test_51Q12tl2NZS9ze6spvWkrxgWEnkcraDk2H19jWc0nH1nibYgaRZdX1ryW3EGe2JejSdI3s27mhzBQAKTuErVxeW0E00fyur5bDe"
        );
    }
    return stripePromise;
};

export default getStripe;
