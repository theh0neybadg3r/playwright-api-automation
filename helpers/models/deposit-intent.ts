import { expect, request as playwrightRequest } from '@playwright/test';
import { ApiResponseData } from './types';
import { referenceId, calculateSK } from '@utils/general';
import { PAYMENT_SOLUTIONS } from '@const/solutions';
import { HEADERS, BODY_CUSTOMER, BODY_DETAILS_PARAMS } from '@const/constant-var';

export interface DepositInterface {
    checkoutUrl: string;
    apiResponseData: ApiResponseData;
    apiResponseTime: number;
    refId: string;
    calcSK: string;
}

const apiURL = process.env.API_URL!;
console.log(apiURL);
const publicKey = process.env.pubKey!;
const secretKey = process.env.secretKey!;

export async function DepositIntentRequest(solutionConfig: PAYMENT_SOLUTIONS): Promise<DepositInterface> {

    // Validate environment variables
    expect(apiURL, 'API_URL should be defined').toBeTruthy();
    expect(publicKey, 'pubKey should be defined').toBeTruthy();
    expect(secretKey, 'secretKey should be defined').toBeTruthy();

    const refId = referenceId();
    const calcSK = calculateSK(publicKey, secretKey, refId);

    console.log('Generated Reference Number:', refId);
    console.log('Calculated Secret Key:', calcSK);

    const apiContext = await playwrightRequest.newContext();

    let checkoutUrl: string;
    let apiResponseData: ApiResponseData;
    let apiResponseTime: number;

    try {
        const startTime = Date.now();

        const response = await apiContext.post(`${apiURL}/deposit/intent`, {
            headers: HEADERS(refId),
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