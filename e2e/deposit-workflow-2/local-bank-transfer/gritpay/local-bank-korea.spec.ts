/* eslint-disable playwright/no-conditional-expect */
/* eslint-disable playwright/no-conditional-in-test */
import { test, expect } from '@playwright/test'
import { apiResultLogger } from "@utils/general";
import { LOCAL_BANK_TRANSFER_SOLUTIONS } from "@const/solutions";
import { BODY_CUSTOMER_KOREA, ERROR_KEYWORDS } from "@const/constant-var";
import { CHECKOUT_INTERACTION_CHECKER, CHECKOUT_PAGE_CHECKER } from '@models/result-checker';
import { checkoutInteraction } from '@models/checkout-page-checker';
import { VENDOR, SHEET_NAME } from '@const/enums';
import { DepositIntentRequest, DepositInterface } from '@models/deposit-intent';
import { runCheckoutUrlChecker, runNoErrorChecker, runStatusCodeChecker, runSuccessFlagChecker } from '@models/api-deposit-checkers';

test.describe('GRITPAY_LOCAL_BANK_KOREA DEPOSIT WORKFLOW', () => {

    test.describe.configure({ mode: 'serial' });

    let gritpay_lbtKoreaSolution: DepositInterface;

    test.beforeAll(async () => {

        // test.setTimeout(120000);

        gritpay_lbtKoreaSolution = await DepositIntentRequest({ 
            solutionConfig: LOCAL_BANK_TRANSFER_SOLUTIONS.Local_Bank_Korea,
            apiKeys: {
                publicKey: process.env.API_PUB_KEY_2!,
                secretKey: process.env.API_SECRET_KEY_2!
            },
            bodyCustomer: BODY_CUSTOMER_KOREA
        });
    });

    test('API AND CHECKOUT PAGE VALIDATION', async ({ browser }) => {

        test.setTimeout(120000);

        await runStatusCodeChecker(gritpay_lbtKoreaSolution, 'Local Bank Korea', VENDOR.GRITPAY, SHEET_NAME.LOCAL_BANK_TRANSFER);
        await runNoErrorChecker(gritpay_lbtKoreaSolution, 'Local Bank Korea', VENDOR.GRITPAY, SHEET_NAME.LOCAL_BANK_TRANSFER);
        await runSuccessFlagChecker(gritpay_lbtKoreaSolution, 'Local Bank Korea', VENDOR.GRITPAY, SHEET_NAME.LOCAL_BANK_TRANSFER);
        await runCheckoutUrlChecker(gritpay_lbtKoreaSolution, 'Local Bank Korea', VENDOR.GRITPAY, SHEET_NAME.LOCAL_BANK_TRANSFER);

        //Checker for checking if the checkout page load without error.
        if (!gritpay_lbtKoreaSolution?.checkoutUrl) {
            const failedResult = CHECKOUT_PAGE_CHECKER(
                ['No checkout URL available'], 
                0,
                null,
                'Local Bank Korea',
                VENDOR.GRITPAY,
                SHEET_NAME.LOCAL_BANK_TRANSFER
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

            await page.goto(gritpay_lbtKoreaSolution.checkoutUrl, { waitUntil: 'load', timeout: 80000 });
            console.log('Redirected to:', page.url());
            await page.locator('body').waitFor({ state: 'visible', timeout: 10000 });

            const { initialErrors, postInteractionErrors, interacted } = await checkoutInteraction(page, 
                ERROR_KEYWORDS,
                undefined, 
                undefined,
                {
                    accountName: 'Test Account',
                    accountNumber: '010224466881',
                    bankName: 'Industrial Bank of Korea',
                    birthdate: '12/12/2000'
                }
            );


            //const foundErrorsInCheckoutPage = await scanPageForErrors(page, ERROR_KEYWORDS);
            const pageLoadTime = Date.now() - startTime;

            if (initialErrors.length > 0 || postInteractionErrors.length > 0) {
                console.log('Errors found - Initial:', initialErrors, '| Post-interaction:', postInteractionErrors);
                await page.screenshot({ path: `error-logs/e-wallet/toppay/dana/dana-error.png` });
            }

            if (!interacted) {
                console.log('Checkbox not found - falling back to basic page load check');
            }

            const checkoutResult = CHECKOUT_INTERACTION_CHECKER(
                initialErrors,
                postInteractionErrors, 
                interacted, 
                pageLoadTime,
                gritpay_lbtKoreaSolution.checkoutUrl,
                'Local Bank Korea',
                VENDOR.GRITPAY,
                SHEET_NAME.LOCAL_BANK_TRANSFER
            );

            console.log('📤 Logging test result:', JSON.stringify(checkoutResult));
            await apiResultLogger(checkoutResult);
            expect(checkoutResult.status).toBe('PASSED');

        } finally { await context.close() }
    });
});