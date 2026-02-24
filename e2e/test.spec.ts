/* eslint-disable playwright/expect-expect */
/* eslint-disable playwright/no-skipped-test */
import { test, expect } from '@playwright/test'
import { apiResultLogger } from "@utils/general";
import { CASH_PAYMENT_SOLUTIONS } from "@const/solutions";
import { ERROR_KEYWORDS } from "@const/constant-var";
import { CHECKOUT_PAGE_CHECKER, scanPageForErrors } from '@models/result-checker';
import { VENDOR, SHEET_NAME } from '@const/enums';
import { DepositIntentRequest, DepositInterface } from '@models/deposit-intent';
import { runCheckoutUrlChecker, runNoErrorChecker, runStatusCodeChecker, runSuccessFlagChecker } from '@models/api-deposit-checkers';

test.describe('PALAWAN DEPOSIT WORKFLOW', () => {

    let palawanSolution: DepositInterface;

    test.beforeAll(async () => {
        palawanSolution = await DepositIntentRequest(CASH_PAYMENT_SOLUTIONS.Palawan)
    });

    test.describe('API AND CHECKOUT PAGE VALIDATION', () => {

        test('should have valid status code', async () =>
            await runStatusCodeChecker(palawanSolution, 'Palawan', VENDOR.UPAY, SHEET_NAME.CASH_PAYMENT));

        test('should have no error message in response', async () =>
            await runNoErrorChecker(palawanSolution, 'Palawan', VENDOR.UPAY, SHEET_NAME.CASH_PAYMENT));

        test('should have a success flag true', async () =>
            await runSuccessFlagChecker(palawanSolution, 'Palawan', VENDOR.UPAY, SHEET_NAME.CASH_PAYMENT));

        test('should have a valid Checkout URL', async () =>
            await runCheckoutUrlChecker(palawanSolution, 'Palawan', VENDOR.UPAY, SHEET_NAME.CASH_PAYMENT));

        test('should load checkout page without errors', async ({ page }) => {

            test.skip(!palawanSolution.checkoutUrl, 'No checkout URL available');

            const startTime = Date.now();

            page.on('pageerror', (err) => {
                if (
                    err.message.includes('Blocked a frame with origin') ||
                    err.message.includes('cross-origin frame')
                ) {
                    console.log('Suppressed cross-origin frame error:', err.message);
                }
            });

            await page.goto(palawanSolution.checkoutUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            console.log('Redirected to:', page.url());
            await page.locator('body').waitFor({ state: 'visible', timeout: 10000 });

            const foundErrorsInCheckoutPage = await scanPageForErrors(page, ERROR_KEYWORDS);
            const pageLoadTime = Date.now() - startTime;

            // eslint-disable-next-line playwright/no-conditional-in-test
            if (foundErrorsInCheckoutPage.length > 0) {
                console.log('✒️ Error keywords found:', foundErrorsInCheckoutPage.join(', '));
                await page.screenshot({ path: `Palawan-checkout-error.png`});
            }

            const checkoutPageLoadResult = CHECKOUT_PAGE_CHECKER(foundErrorsInCheckoutPage, pageLoadTime, palawanSolution.checkoutUrl, 'Palawan', VENDOR.UPAY, SHEET_NAME.CASH_PAYMENT);

            console.log('📤 Logging test result:', JSON.stringify(checkoutPageLoadResult));
            await apiResultLogger(checkoutPageLoadResult);
            expect(checkoutPageLoadResult.status).toBe('PASSED');
        });
    });
});