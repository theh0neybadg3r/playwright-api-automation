/* eslint-disable playwright/expect-expect */
/* eslint-disable playwright/no-skipped-test */
import { test, expect } from '@playwright/test'
import { apiResultLogger } from "@utils/general";
import { ONLINE_BANKING_SOLUTION } from "@const/solutions";
import { ERROR_KEYWORDS } from "@const/constant-var";
import { CHECKOUT_PAGE_CHECKER, scanPageForErrors } from '@models/result-checker';
import { VENDOR, SHEET_NAME } from '@const/enums';
import { DepositIntentRequest, DepositInterface } from '@models/deposit-intent';
import { runCheckoutUrlChecker, runNoErrorChecker, runStatusCodeChecker, runSuccessFlagChecker } from '@models/api-deposit-checkers';

test.describe('UNIONBANK ONLINE DEPOSIT WORKFLOW', () => {

    let unionbankSolution: DepositInterface;

    test.beforeAll(async () => {
        unionbankSolution = await DepositIntentRequest(ONLINE_BANKING_SOLUTION.Unionbank)
    });

    test.describe('API AND CHECKOUT PAGE VALIDATION', () => {

        test('should have valid status code', async () =>
            await runStatusCodeChecker(unionbankSolution, 'Unionbank', VENDOR.UPAY, SHEET_NAME.ONLINE_BANKING));

        test('should have no error message in response', async () =>
            await runNoErrorChecker(unionbankSolution, 'Unionbank', VENDOR.UPAY, SHEET_NAME.ONLINE_BANKING));

        test('should have a success flag true', async () =>
            await runSuccessFlagChecker(unionbankSolution, 'Unionbank', VENDOR.UPAY, SHEET_NAME.ONLINE_BANKING));

        test('should have a valid Checkout URL', async () =>
            await runCheckoutUrlChecker(unionbankSolution, 'Unionbank', VENDOR.UPAY, SHEET_NAME.ONLINE_BANKING));

        test('should load checkout page without errors', async ({ page }) => {

            test.skip(!unionbankSolution.checkoutUrl, 'No checkout URL available');

            const startTime = Date.now();

            page.on('pageerror', (err) => {
                if (
                    err.message.includes('Blocked a frame with origin') ||
                    err.message.includes('cross-origin frame')
                ) {
                    console.log('Suppressed cross-origin frame error:', err.message);
                }
            });

            await page.goto(unionbankSolution.checkoutUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            console.log('Redirected to:', page.url());
            await page.locator('body').waitFor({ state: 'visible', timeout: 10000 });

            const foundErrorsInCheckoutPage = await scanPageForErrors(page, ERROR_KEYWORDS);
            const pageLoadTime = Date.now() - startTime;

            // eslint-disable-next-line playwright/no-conditional-in-test
            if (foundErrorsInCheckoutPage.length > 0) {
                console.log('✒️ Error keywords found:', foundErrorsInCheckoutPage.join(', '));
                await page.screenshot({ path: `Palawan-checkout-error.png`});
            }

            const checkoutPageLoadResult = CHECKOUT_PAGE_CHECKER(foundErrorsInCheckoutPage, pageLoadTime, unionbankSolution.checkoutUrl, 'Unionbank', VENDOR.UPAY, SHEET_NAME.ONLINE_BANKING);

            console.log('📤 Logging test result:', JSON.stringify(checkoutPageLoadResult));
            await apiResultLogger(checkoutPageLoadResult);
            expect(checkoutPageLoadResult.status).toBe('PASSED');
        });
    });
});