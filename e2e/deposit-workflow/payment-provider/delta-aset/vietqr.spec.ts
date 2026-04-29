/* eslint-disable playwright/no-networkidle */
/* eslint-disable playwright/no-conditional-in-test */
/* eslint-disable playwright/no-conditional-expect */
import { test, expect } from '@playwright/test'
import { apiResultLogger } from "@utils/general";
import { PAYMENT_PROVIDER_SOLUTIONS } from "@const/solutions";
import { BODY_CUSTOMER_VIETNAM, ERROR_KEYWORDS } from "@const/constant-var";
import { CHECKOUT_INTERACTION_CHECKER, CHECKOUT_PAGE_CHECKER } from '@models/result-checker';
import { checkoutInteraction } from '@models/checkout-page-checker';
import { VENDOR, SHEET_NAME } from '@const/enums';
import { DepositIntentRequest, DepositInterface } from '@models/deposit-intent';
import { runCheckoutUrlChecker, runNoErrorChecker, runStatusCodeChecker, runSuccessFlagChecker } from '@models/api-deposit-checkers';

test.describe('VIETQR DEPOSIT WORKFLOW', () => {

    test.describe.configure({ mode: 'serial' });

    let vietQRSolution: DepositInterface;

    test.beforeAll(async () => {

        // test.setTimeout(120000);

        vietQRSolution = await DepositIntentRequest({ 
            solutionConfig: PAYMENT_PROVIDER_SOLUTIONS.VietQR,
            apiKeys: {
                publicKey: process.env.API_PUB_KEY_DEFAULT!,
                secretKey: process.env.API_SECRET_KEY_DEFAULT!
            },
            bodyCustomer: BODY_CUSTOMER_VIETNAM
        });
    });

    test('API AND CHECKOUT PAGE VALIDATION', async ({ browser }) => {

        test.setTimeout(120000);

        await runStatusCodeChecker(vietQRSolution, 'Viet-QR', VENDOR.DELTA_ASET, SHEET_NAME.PAYMENT_PROVIDER);
        await runNoErrorChecker(vietQRSolution, 'Viet-QR', VENDOR.DELTA_ASET, SHEET_NAME.PAYMENT_PROVIDER);
        await runSuccessFlagChecker(vietQRSolution, 'Viet-QR', VENDOR.DELTA_ASET, SHEET_NAME.PAYMENT_PROVIDER);
        await runCheckoutUrlChecker(vietQRSolution, 'Viet-QR', VENDOR.DELTA_ASET, SHEET_NAME.PAYMENT_PROVIDER);

        //Checker for checking if the checkout page load without error.
        if (!vietQRSolution?.checkoutUrl) {
            const failedResult = CHECKOUT_PAGE_CHECKER(
                ['No checkout URL available'], 
                0,
                null,
                'Viet-QR',
                VENDOR.DELTA_ASET,
                SHEET_NAME.PAYMENT_PROVIDER
            );

            console.log('📤 Logging test result (no checkout URL):', JSON.stringify(failedResult));
            await apiResultLogger(failedResult);
            expect.soft(false, 'No checkout URL available - skipping page load').toBeTruthy();
            return;
        }
        

        const context = await browser.newContext();
        const page = await context.newPage();

        try {

            const startTime = Date.now();

            page.on('pageerror', (err) => {
                if (
                    err.message.includes('Blocked a frame with origin') ||
                    err.message.includes('cross-origin frame')
                ) {
                    console.log('Suppressed cross-origin frame error:', err.message);
                }
            });

            await page.goto(vietQRSolution.checkoutUrl, { waitUntil: 'networkidle', timeout: 80000 });
            console.log('Redirected to:', page.url());
            await page.locator('body').waitFor({ state: 'visible', timeout: 10000 });

            const { initialErrors, postInteractionErrors, interacted } = await checkoutInteraction (page, ERROR_KEYWORDS);


            //const foundErrorsInCheckoutPage = await scanPageForErrors(page, ERROR_KEYWORDS);
            const pageLoadTime = Date.now() - startTime;

            if (initialErrors.length > 0 || postInteractionErrors.length > 0) {
                console.log('Errors found - Initial:', initialErrors, '| Post-interaction:', postInteractionErrors);
                await page.screenshot({ path: `error-logs/payment-provider/coinsph/qrph/qrph-error.png` });
            }

            // if (!interacted) {
            //     console.log('Checkbox not found - falling back to basic page load check');
            // }

            const checkoutResult = CHECKOUT_INTERACTION_CHECKER(
                initialErrors,
                postInteractionErrors, 
                interacted, 
                pageLoadTime,
                vietQRSolution.checkoutUrl,
                'Viet-QR',
                VENDOR.DELTA_ASET,
                SHEET_NAME.PAYMENT_PROVIDER
            );

            console.log('📤 Logging test result:', JSON.stringify(checkoutResult));
            await apiResultLogger(checkoutResult);
            expect(checkoutResult.status).toBe('PASSED');

        } finally { await context.close() }
    });
});