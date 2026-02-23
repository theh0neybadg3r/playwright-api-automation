export const ROW_MAPPING: Record<string, Record<string, Record<string, number>>> = {
    "E-Wallet": {
        "CoinsPH|Gcash_S": {
            "Status code is 200 or 201": 4,
            "No error message in response": 5,
            "Success flag is true": 6,
            "Checkout URL is present and valid": 7,
            "Checkout page load without errors": 8
        }
    },
    "Online Banking": {
        "Upay|Unionbank": {
            "Status code is 200 or 201": 4,
            "No error message in response": 5,
            "Success flag is true": 6,
            "Checkout URL is present and valid": 7,
            "Checkout page load without errors": 8
        }
    },
    "Cash Payment": {
        "Upay|Palawan": {
            "Status code is 200 or 201": 4,
            "No error message in response": 5,
            "Success flag is true": 6,
            "Checkout URL is present and valid": 7,
            "Checkout page load without errors": 8
        },
        "Upay|Cebuana": {
            "Status code is 200 or 201": 9,
            "No error message in response": 10,
            "Success flag is true": 11,
            "Checkout URL is present and valid": 12,
            "Checkout page load without errors": 13
        }
    }
}

export function getRowNumberMapping (
    sheetName: string,
    vendor: string,
    solution: string,
    testName: string
): number | undefined {
    const key = `${vendor}|${solution}`;
    return ROW_MAPPING[sheetName]?.[key]?.[testName]
}