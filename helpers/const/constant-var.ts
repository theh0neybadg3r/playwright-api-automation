import { E_WALLET_SOLUTIONS, ONLINE_BANKING_SOLUTION, CASH_PAYMENT_SOLUTIONS, PAYMENT_PROVIDER_SOLUTIONS } from "./solutions";
import { calculateSK } from "@utils/general";

type PAYMENT_SOLUTIONS = 
    | typeof E_WALLET_SOLUTIONS[keyof typeof E_WALLET_SOLUTIONS]
    | typeof ONLINE_BANKING_SOLUTION[keyof typeof ONLINE_BANKING_SOLUTION]
    | typeof CASH_PAYMENT_SOLUTIONS[keyof typeof CASH_PAYMENT_SOLUTIONS]
    | typeof PAYMENT_PROVIDER_SOLUTIONS[keyof typeof PAYMENT_PROVIDER_SOLUTIONS];


interface DetailsParams {
    referenceID: string;
    methodSolution: PAYMENT_SOLUTIONS;
    redirectURL?: string;
}

export const BODY_DETAILS_PARAMS = ({
    referenceID,
    methodSolution,
    redirectURL = 'http://example.com'
}: DetailsParams) => {

    return {
        reference_no: referenceID,
        ...methodSolution,
        redirect_url: redirectURL
    };
};

export const BODY_CUSTOMER = {
    "address_line_1": "38 Testing Street, Test Address One", 
    "address_line_2": "110 Testing Address",
    "city": "Test City", 
    "country": "PH", 
    "email": "emmanuelrevistatesting@gmail.com", 
    "first_name": "Emman", 
    "last_name": "Testing", 
    "mobile": "+639083549944", 
    "state": "Manila", 
    "zip": "6786"    
};

type SolutionType = typeof E_WALLET_SOLUTIONS [keyof typeof E_WALLET_SOLUTIONS]
export const BODY_DETAILS = (referenceID: string, methodSolution: SolutionType, amount: number) => ({
    "reference_no": referenceID, 
    ...methodSolution,
    "currency": "PHP", 
    "amount": amount,  
    "redirect_url": "http://example.com"
});

export const ERROR_KEYWORDS = [

    'no payment processed',
    'insufficient balance',
    'maximum amount exceeded',
    'temporary unavailable',
    'service unavailable',
    'inactive session',
    'leave payment option',
    'leave page',
    'payment is not yet processed',
    'available balance in your selected unionbank account is not enough',
    'this channel is temporary unavailable',
    'we are unable to process your payment at the moment',
    'an error was encountered during the transaction',
    'palawan pawnshop transaction limit is up to php 20,000.00',
    'otc transaction limit is up to php 50,000.00',
];

export const ERROR_INDICATORS = [
    'error',
    'failed',
    'invalid',
    'something went wrong',
    'unable to process',
    'payment failed',
    'not available'
];

export const HEADERS = (refId: string) => {

    const publicKey = process.env.pubKey;
    const secretKey = process.env.secretKey;

    return {
        'Content-Type': 'application/json',
        'User-Agent': 'PostmanRuntime/7.51.0',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Accept': 'application/json',
        'X-GATEWAY-KEY': publicKey,
        'X-GATEWAY-SECRET': calculateSK(publicKey, secretKey, refId)
    };
}