import { E_WALLET_SOLUTIONS, ONLINE_BANKING_SOLUTION, CASH_PAYMENT_SOLUTIONS, PAYMENT_PROVIDER_SOLUTIONS, LOCAL_BANK_TRANSFER_SOLUTIONS } from "./solutions";
import { calculateSK } from "@utils/general";

type PAYMENT_SOLUTIONS = 
    | typeof E_WALLET_SOLUTIONS[keyof typeof E_WALLET_SOLUTIONS]
    | typeof ONLINE_BANKING_SOLUTION[keyof typeof ONLINE_BANKING_SOLUTION]
    | typeof CASH_PAYMENT_SOLUTIONS[keyof typeof CASH_PAYMENT_SOLUTIONS]
    | typeof PAYMENT_PROVIDER_SOLUTIONS[keyof typeof PAYMENT_PROVIDER_SOLUTIONS]
    | typeof LOCAL_BANK_TRANSFER_SOLUTIONS[keyof typeof LOCAL_BANK_TRANSFER_SOLUTIONS];


interface DetailsParams {
    referenceID: string;
    methodSolution: PAYMENT_SOLUTIONS;
    redirectURL?: string;
}

export const BODY_CUSTOMER_DEFAULT = {
    "address_line_1": "123 Testing Street, Test Address One", 
    "address_line_2": "456 Testing Address Two",
    "city": "Manila", 
    "country": "PH", 
    "email": "emmantesting@yopmail.com", 
    "first_name": "Emman", 
    "last_name": "Testing", 
    "mobile": "+639192244668", 
    "state": "Manila", 
    "zip": "6788"    
};

export const BODY_CUSTOMER_INDONESIA = {
    ...BODY_CUSTOMER_DEFAULT,
    country: "ID", 
    mobile: "+62819555831",
    state: "Jakarta", 
    city: "Jakarta"
}

export const BODY_CUSTOMER_VIETNAM = {
    ...BODY_CUSTOMER_DEFAULT,
    country: "VN",
    mobile: "+84912345678",
    state: "Ho Chi Minh",
    city: "Ho Chi Minh"
};

export const BODY_CUSTOMER_BANGLADESH = {
    ...BODY_CUSTOMER_DEFAULT,
    country: "BD",
    mobile: "+8801712345678",
    state: "Dhaka",
    city: "Dhaka"
};

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
    'Undefined array key "paymentUrl"',
    'processing error',
    'No active payment gateway'
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

export interface ApiOverrides {
    publicKey?: string;
    secretKey?: string;
}

export const HEADERS = (refId: string, apiKeys?: ApiOverrides) => {

    return {
        'Content-Type': 'application/json',
        'User-Agent': 'PostmanRuntime/7.51.0',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Accept': 'application/json',
        'X-GATEWAY-KEY': apiKeys.publicKey,
        'X-GATEWAY-SECRET': calculateSK(apiKeys.publicKey, apiKeys.secretKey, refId)
    };
}