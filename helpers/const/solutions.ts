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

    Rocket: {
        method: 'e_wallet',
        solution: 'rocket',
        currency: 'BDT',
        amount: 10000
    },

    Upay: {
        method: 'e_wallet',
        solution: 'upay',
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
    },

    CL_Dana: {
        method: 'e_wallet',
        solution:'dana',
        currency: 'IDR',
        amount: 20000
    },

    Momo: {
        method: 'e_wallet',
        solution: 'momo',
        currency: 'VND',
        amount: '2000000'
    },

    ViettelPay: {
        method: 'e_wallet',
        solution: 'viettelpay',
        currency: 'VND',
        amount: '2000000'
    },

    Zalo: {
        method: 'e_wallet',
        solution: 'zalo',
        currency: 'VND',
        amount: '2000000'
    },

    AMB_Pay_Dana: {
        method: 'e_wallet',
        solution: 'dana',
        currency: 'IDR',
        amount: '20000'
    },

    AMB_Pay_Linkaja: {
        method: 'e_wallet',
        solution: 'link_aja',
        currency: 'IDR',
        amount: '20000'
    },

    AMB_Pay_OVO: {
        method: 'e_wallet',
        solution: 'ovo',
        currency: 'IDR',
        amount: '20000'
    },

    AMB_Pay_Shopeepay_IDR: {
        method: 'e_wallet',
        solution: 'shopee_pay',
        currency: 'IDR',
        amount: '20000'
    },

    AMB_Pay_Boost: {
        method: 'e_wallet',
        solution: 'boost',
        currency: 'MYR',
        amount: '40'
    },

    AMB_Pay_GrabPay: {
        method: 'e_wallet',
        solution: 'grabpay',
        currency: 'MYR',
        amount: '40'
    },

    AMB_Pay_Shopeepay_MYR: {
        method: 'e_wallet',
        solution: 'shopee_pay',
        currency: 'MYR',
        amount: '40'
    }, 

    AMB_Pay_Touch_N_Go: {
        method: 'e_wallet',
        solution: 'touch_n_go',
        currency: 'MYR',
        amount: '40'
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
        amount: 200
    }, 
    GoTyme: {
        method: "payment_provider", 
        solution:"gotyme",
        currency: "PHP", 
        amount: 100
    }, 
    Instapay: {
        method: "payment_provider", 
        solution: "instapay",
        currency: "PHP", 
        amount: 110
    },
    Paygate: {
        method: "payment_provider", 
        solution: "paygate",
        currency: "PHP", 
        amount: 110
    },
    QRIS: {
        method: 'payment_provider',
        currency: 'IDR',
        amount: 20000
    },
    QRPay: {
        method: 'payment_provider',
        currency: 'IDR',
        amount: 20000
    },
    CL_QRIS: {
        method: 'payment_provider',
        currency: 'IDR',
        amount: 20000
    },

    AMB_PAY_DUITNOW_QR: {
        method: 'payment_provider',
        currency: 'MYR',
        amount: 1200
    },
} as const;

export const LOCAL_BANK_TRANSFER_SOLUTIONS = {

    Local_Bank_Australia: {
        method: 'local_bank_transfer',
        currency: 'AUD',
        amount: 100
    },

    CL_Local_Bank_Indonesia: {
        method: 'local_bank_transfer',
        currency: 'IDR',
        amount: 20000
    },

    Local_Bank_Korea: {
        method: 'local_bank_transfer',
        currency: 'KRW',
        amount: 10000
    },

    JPAY_Local_Bank_Japan: {
        method: 'local_bank_transfer',
        currency: 'JPY',
        receiving_currency: 'JPY',
        amount: 10000
    },

    TP_Local_Bank_Indonesia: {
        method: 'local_bank_transfer',
        currency: 'IDR',
        amount: 15000
    },

    TP_Local_Bank_Thailand: {
        method: 'local_bank_transfer',
        currency: 'THB',
        amount: 10000
    },

    AP_Local_Bank_Malaysia: {
        method: 'local_bank_transfer',
        currency: 'MYR',
        amount: 10000
    },

    TR_Local_Bank_Thailand: {
        method: 'local_bank_transfer',
        currency: 'THB',
        amount: 10000
    },

    TR_Local_Bank_India: {
        method: 'local_bank_transfer',
        currency: 'INR',
        amount: 10000
    },

    TR_Local_Bank_Korea: {
        method: 'local_bank_transfer',
        currency: 'KRW',
        amount: 10000
    },

    TR_Local_Bank_Malaysia: {
        method: 'local_bank_transfer',
        currency: 'MYR',
        amount: 10000
    },

    TR_Local_Bank_Vietnam: {
        method: 'local_bank_transfer',
        currency: 'THB',
        amount: 10000
    }
} as const;

export const ALL_PAYMENT_METHODS = {
    E_WALLET: E_WALLET_SOLUTIONS,
    ONLINE_BANKING: ONLINE_BANKING_SOLUTION,
    CASH_PAYMENT: CASH_PAYMENT_SOLUTIONS,
    PAYMENT_PROVIDER: PAYMENT_PROVIDER_SOLUTIONS,
    LOCAL_BANK_TRANSFER: LOCAL_BANK_TRANSFER_SOLUTIONS
} as const;

export type PAYMENT_SOLUTIONS = 
    | typeof E_WALLET_SOLUTIONS[keyof typeof E_WALLET_SOLUTIONS]
    | typeof ONLINE_BANKING_SOLUTION[keyof typeof ONLINE_BANKING_SOLUTION]
    | typeof CASH_PAYMENT_SOLUTIONS[keyof typeof CASH_PAYMENT_SOLUTIONS]
    | typeof PAYMENT_PROVIDER_SOLUTIONS[keyof typeof PAYMENT_PROVIDER_SOLUTIONS]
    | typeof LOCAL_BANK_TRANSFER_SOLUTIONS[keyof typeof LOCAL_BANK_TRANSFER_SOLUTIONS];