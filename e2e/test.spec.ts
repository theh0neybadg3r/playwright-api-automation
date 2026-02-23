import { test, expect, request as playwrightRequest } from '@playwright/test'
import { ApiResponseData } from "@models/types";
import { referenceId, calculateSK, apiResultLogger } from "@utils/general";
import { ALL_PAYMENT_METHODS } from "@const/solutions";
import { HEADERS, BODY_CUSTOMER, BODY_DETAILS_PARAMS, ERROR_KEYWORDS } from "@const/constant-var";
import { CHECKOUT_PAGE_CHECKER, CHECKOUT_URL_CHECKER, NO_ERROR_RESPONSE_CHECKER, scanPageForErrors, STATUS_CODE_CHECKER, SUCCESS_FLAG_CHECKER } from '@models/result-checker';
import { VENDOR, SHEET_NAME } from '@const/enums';

const cash_Payment_Solutions = Object.entries(ALL_PAYMENT_METHODS.CASH_PAYMENT);

const [solutionName, solutionConfig] = cash_Payment_Solutions

const apiURL = process.env.API_URL!;
        console.log(apiURL);
        const publicKey = process.env.pubKey!;
        const secretKey = process.env.secretKey!;

        let checkoutUrl: string;
        let apiResponseData: ApiResponseData;
        let apiResponseTime: number;
        let calcSK: string;
        let refId: string;

        test.beforeAll(async () => {

            // Validate environment variables
            expect(apiURL, 'API_URL should be defined').toBeTruthy();
            expect(publicKey, 'pubKey should be defined').toBeTruthy();
            expect(secretKey, 'secretKey should be defined').toBeTruthy();

            refId = referenceId();
            calcSK = calculateSK(publicKey, secretKey, refId);

            console.log('Generated Reference Number:', refId);
            console.log('Calculated Secret Key:', calcSK);

            const apiContext = await playwrightRequest.newContext();

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
        });