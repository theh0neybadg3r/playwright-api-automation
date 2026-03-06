import { expect, request as playwrightRequest } from '@playwright/test';
import { ApiResponseData } from './types';
import { referenceId, calculateSK } from '@utils/general';
import { PAYMENT_SOLUTIONS } from '@const/solutions';
import { HEADERS, BODY_CUSTOMER, BODY_DETAILS_PARAMS, ApiOverrides } from '@const/constant-var';

export interface DepositInterface {
    checkoutUrl: string;
    apiResponseData: ApiResponseData;
    apiResponseTime: number;
    refId: string;
    calcSK: string;
}

export interface DepositIntentOptions{
    solutionConfig: PAYMENT_SOLUTIONS;
    apiKeys?: ApiOverrides;
}

const apiURL = process.env.API_URL!;
console.log(apiURL);
// const publicKey = process.env.API_PUB_KEY_DEFAULT!;
// const secretKey = process.env.API_SECRET_KEY_DEFAULT!;

export async function DepositIntentRequest({ solutionConfig, apiKeys }: DepositIntentOptions): Promise<DepositInterface> {

    // Validate environment variables
    expect(apiURL, 'API_URL should be defined').toBeTruthy();
    expect(apiKeys.publicKey, 'pubKey should be defined').toBeTruthy();
    expect(apiKeys.secretKey, 'secretKey should be defined').toBeTruthy();

    console.log(apiKeys.publicKey);
    console.log(apiKeys.secretKey);

    const refId = referenceId();
    const calcSK = calculateSK(apiKeys.publicKey, apiKeys.secretKey, refId);

    console.log('Generated Reference Number:', refId);
    console.log('Calculated Secret Key:', calcSK);

    const apiContext = await playwrightRequest.newContext();

    let checkoutUrl: string;
    let apiResponseData: ApiResponseData;
    let apiResponseTime: number;

    try {
        const startTime = Date.now();

        const response = await apiContext.post(`${apiURL}/deposit/intent`, {
            headers: HEADERS(refId, apiKeys),
            data: {
                customer: BODY_CUSTOMER,
                details: BODY_DETAILS_PARAMS({ referenceID: refId, methodSolution: solutionConfig })
            },
            failOnStatusCode: false
        });

        apiResponseTime = Date.now() - startTime;

        const body = await response.json() as typeof apiResponseData.body;

        console.log('Status:', response.status());
        console.log('Body:', JSON.stringify(body, null, 2));

        apiResponseData = {
            status: response.status(),
            body
        };

        if (body?.data?.checkout_url) {
            checkoutUrl = body.data.checkout_url;
            console.log('Checkout URL saved:', checkoutUrl);
        }

    } finally {
        await apiContext.dispose();
    }

    return { checkoutUrl, apiResponseData, apiResponseTime, refId, calcSK}
}