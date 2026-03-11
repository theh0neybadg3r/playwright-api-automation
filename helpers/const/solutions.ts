export const E_WALLET_SOLUTIONS = {
    
    Gcash_S: {
        method: 'e_wallet',
        solution: 'gcash',
        currency: 'PHP',
        amount: 200
    }, 

    Gcash: {
        method: 'e_wallet',
        solution: 'gcash',
        currency: 'PHP',
        amount: 200
    },

    EPO_Wallet: {
        method: 'e_wallet',
        solution: 'epo_wallet',
        currency: 'PHP',
        amount: 100
    }, 

    Oriental_Wallet: {
        method: 'e_wallet',
        solution: 'oriental_wallet',
        currency: 'PHP',
        amount: 100
    },

    Paymaya: {
        method: 'e_wallet',
        solution: 'paymaya',
        currency: 'PHP',
        amount: 200
    },

    GrabPay: {
        method: 'e_wallet',
        solution: 'grabpay',
        currency: 'PHP',
        amount: 110
    },

    bKash: {
        method: 'e_wallet',
        solution: 'bkash',
        currency: 'BDT',
        amount: 10000
    },

    Nagad: {
        method: 'e_wallet',
        solution: 'nagad',
        currency: 'BDT',
        amount: 10000
    },

    Dana: {
        method: 'e_wallet',
        currency: 'IDR',
        amount: 20000
    },
    LinkAja: {
        method: 'e_wallet',
        currency: 'IDR',
        amount: 20000
    },
    OVO: {
        method: 'e_wallet',
        currency: 'IDR',
        amount: 20000
    },
    ShopeePay: {
        method: 'e_wallet',
        currency: 'IDR',
        amount: 20000
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