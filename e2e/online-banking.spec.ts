/* eslint-disable playwright/no-skipped-test */
import { test, expect, request as playwrightRequest } from '@playwright/test'
import { ApiResponseData } from "@models/types";
import { referenceId, calculateSK, apiResultLogger } from "@utils/general";
import { ALL_PAYMENT_METHODS } from "@const/solutions";
import { HEADERS, BODY_CUSTOMER, BODY_DETAILS_PARAMS, ERROR_KEYWORDS } from "@const/constant-var";
import { CHECKOUT_PAGE_CHECKER, CHECKOUT_URL_CHECKER, NO_ERROR_RESPONSE_CHECKER, scanPageForErrors, STATUS_CODE_CHECKER, SUCCESS_FLAG_CHECKER } from '@models/result-checker';
import { VENDOR, SHEET_NAME } from '@const/enums';

const online_Banking_Solution = Object.entries(ALL_PAYMENT_METHODS.ONLINE_BANKING);

for (const [solution_name, solution_config] of online_Banking_Solution) {

    test.describe(`${solution_name} - Workflow`, () => {

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
                        details: BODY_DETAILS_PARAMS({ referenceID: refId, methodSolution: solution_config })
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

        test.describe('API - Deposit Checker', () => {

            test('should have valid status code', async () => {

                const statusCodeResult = STATUS_CODE_CHECKER(apiResponseData, apiResponseTime, refId, solution_name, VENDOR.UPAY, SHEET_NAME.ONLINE_BANKING)

                console.log('📤 Logging test result:', JSON.stringify(statusCodeResult));
                await apiResultLogger(statusCodeResult);
                expect(statusCodeResult.status).toBe('PASSED');
            });

            test('should have no error message in response', async () => {

                const noErrorInResponseResult =  NO_ERROR_RESPONSE_CHECKER(apiResponseData, solution_name, VENDOR.UPAY, SHEET_NAME.ONLINE_BANKING)

                console.log('📤 Logging test result:', JSON.stringify(noErrorInResponseResult));
                await apiResultLogger(noErrorInResponseResult);
                expect(noErrorInResponseResult.status).toBe('PASSED');
            });

            test('should have a success flag true', async () => {

                const successFlagResult = SUCCESS_FLAG_CHECKER(apiResponseData, solution_name, VENDOR.UPAY, SHEET_NAME.ONLINE_BANKING);

                console.log('📤 Logging test result:', JSON.stringify(successFlagResult));
                await apiResultLogger(successFlagResult);
                expect(successFlagResult.status).toBe('PASSED');
            });

            test('should have a valid Checkout URL', async () => {

                const checkoutUrlResult = CHECKOUT_URL_CHECKER(apiResponseData, solution_name, VENDOR.UPAY, SHEET_NAME.ONLINE_BANKING);

                console.log('📤 Logging test result:', JSON.stringify(checkoutUrlResult));
                await apiResultLogger(checkoutUrlResult);
                expect(checkoutUrlResult.status).toBe('PASSED');
            });

            test('should load checkout page without errors', async ({ page }) => {

                test.skip(!checkoutUrl, 'No checkout URL available');

                const startTime = Date.now();

                page.on('pageerror', (err) => {
                    if (
                        err.message.includes('Blocked a frame with origin') ||
                        err.message.includes('cross-origin frame')
                    ) {
                        console.log('Suppressed cross-origin frame error:', err.message);
                    }
                });

                await page.goto(checkoutUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
                console.log('Redirected to:', page.url());
                await page.locator('body').waitFor({ state: 'visible', timeout: 10000 });

                const foundErrorsInCheckoutPage = await scanPageForErrors(page, ERROR_KEYWORDS);
                const pageLoadTime = Date.now() - startTime;

                // eslint-disable-next-line playwright/no-conditional-in-test
                if (foundErrorsInCheckoutPage.length > 0) {
                    console.log('✒️ Error keywords found:', foundErrorsInCheckoutPage.join(', '));
                    await page.screenshot({ path: `${solution_name}-checkout-error.png`});
                }

                const checkoutPageLoadResult = CHECKOUT_PAGE_CHECKER(foundErrorsInCheckoutPage, pageLoadTime, checkoutUrl, solution_name, VENDOR.UPAY, SHEET_NAME.ONLINE_BANKING);

                console.log('📤 Logging test result:', JSON.stringify(checkoutPageLoadResult));
                await apiResultLogger(checkoutPageLoadResult);
                expect(checkoutPageLoadResult.status).toBe('PASSED');
            });
        });
    });
}

