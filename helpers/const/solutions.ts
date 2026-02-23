export const E_WALLET_SOLUTIONS = {
    
    Gcash_S: {
        method: 'e_wallet',
        solution: 'gcash',
        currency: 'PHP',
        amount: 100
    }
} as const;

export const ONLINE_BANKING_SOLUTION = {

    Unionbank: {
        method: 'online_banking',
        solution: 'unionbank',
        currency: 'PHP',
        amount: 100

    }
} as const;

export const CASH_PAYMENT_SOLUTIONS = {

    Palawan: {
        method: 'cash_payment',
        solution: 'palawan_pawnshop',
        currency: 'PHP',
        amount: 100
    },

    Cebuana: {
        method: 'cash_payment',
        solution: 'cebuana',
        currency: 'PHP',
        amount: 100

    }
} as const;

export const PAYMENT_PROVIDER_SOLUTIONS = {

    QRPH: {
        method: 'payment_provider',
        solution: 'qrph',
        currency: 'PHP',
        amount: 100
    }
} as const;

export const ALL_PAYMENT_METHODS = {
    E_WALLET: E_WALLET_SOLUTIONS,
    ONLINE_BANKING: ONLINE_BANKING_SOLUTION,
    CASH_PAYMENT: CASH_PAYMENT_SOLUTIONS,
    PAYMENT_PROVIDER: PAYMENT_PROVIDER_SOLUTIONS,
} as const;

export type PAYMENT_SOLUTIONS = 
    | typeof E_WALLET_SOLUTIONS[keyof typeof E_WALLET_SOLUTIONS]
    | typeof ONLINE_BANKING_SOLUTION[keyof typeof ONLINE_BANKING_SOLUTION]
    | typeof CASH_PAYMENT_SOLUTIONS[keyof typeof CASH_PAYMENT_SOLUTIONS]
    | typeof PAYMENT_PROVIDER_SOLUTIONS[keyof typeof PAYMENT_PROVIDER_SOLUTIONS];