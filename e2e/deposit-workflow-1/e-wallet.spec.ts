/* eslint-disable playwright/expect-expect */
/* eslint-disable playwright/no-skipped-test */
import { test, expect } from '@playwright/test'
import { apiResultLogger } from "@utils/general";
import { E_WALLET_SOLUTIONS } from "@const/solutions";
import { ERROR_KEYWORDS } from "@const/constant-var";
import { CHECKOUT_PAGE_CHECKER, scanPageForErrors } from '@models/result-checker';
import { VENDOR, SHEET_NAME } from '@const/enums';
import { DepositIntentRequest, DepositInterface } from '@models/deposit-intent';
import { runCheckoutUrlChecker, runNoErrorChecker, runStatusCodeChecker, runSuccessFlagChecker } from '@models/api-deposit-checkers';

test.describe('GCASH_S DEPOSIT WORKFLOW', () => {

    let gcash_SSolution: DepositInterface;

    test.beforeAll(async () => {
        gcash_SSolution = await DepositIntentRequest(E_WALLET_SOLUTIONS.Gcash_S)
    });

    test.describe('API AND CHECKOUT PAGE VALIDATION', () => {

        test('should have valid status code', async () =>
            await runStatusCodeChecker(gcash_SSolution, 'Gcash_S', VENDOR.COINSPH, SHEET_NAME.E_WALLET));

        test('should have no error message in response', async () =>
            await runNoErrorChecker(gcash_SSolution, 'Gcash_S', VENDOR.COINSPH, SHEET_NAME.E_WALLET));

        test('should have a success flag true', async () =>
            await runSuccessFlagChecker(gcash_SSolution, 'Gcash_S', VENDOR.COINSPH, SHEET_NAME.E_WALLET));

        test('should have a valid Checkout URL', async () =>
            await runCheckoutUrlChecker(gcash_SSolution, 'Gcash_S', VENDOR.COINSPH, SHEET_NAME.E_WALLET));

        test('should load checkout page without errors', async ({ page }) => {

            test.skip(!gcash_SSolution.checkoutUrl, 'No checkout URL available');

            const startTime = Date.now();

            page.on('pageerror', (err) => {
                if (
                    err.message.includes('Blocked a frame with origin') ||
                    err.message.includes('cross-origin frame')
                ) {
                    console.log('Suppressed cross-origin frame error:', err.message);
                }
            });

            await page.goto(gcash_SSolution.checkoutUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            console.log('Redirected to:', page.url());
            await page.locator('body').waitFor({ state: 'visible', timeout: 10000 });

            const foundErrorsInCheckoutPage = await scanPageForErrors(page, ERROR_KEYWORDS);
            const pageLoadTime = Date.now() - startTime;

            // eslint-disable-next-line playwright/no-conditional-in-test
            if (foundErrorsInCheckoutPage.length > 0) {
                console.log('✒️ Error keywords found:', foundErrorsInCheckoutPage.join(', '));
                await page.screenshot({ path: `Palawan-checkout-error.png`});
            }

            const checkoutPageLoadResult = CHECKOUT_PAGE_CHECKER(foundErrorsInCheckoutPage, pageLoadTime, gcash_SSolution.checkoutUrl, 'Gcash_S', VENDOR.COINSPH, SHEET_NAME.E_WALLET);

            console.log('📤 Logging test result:', JSON.stringify(checkoutPageLoadResult));
            await apiResultLogger(checkoutPageLoadResult);
            expect(checkoutPageLoadResult.status).toBe('PASSED');
        });
    });
});

test.describe('EPO WALLET DEPOSIT WORKFLOW', () => {

    let epoSolution: DepositInterface;

    test.beforeAll(async () => {
        epoSolution = await DepositIntentRequest(E_WALLET_SOLUTIONS.EPO_Wallet)
    });

    test.describe('API AND CHECKOUT PAGE VALIDATION', () => {

        test('should have valid status code', async () =>
            await runStatusCodeChecker(epoSolution, 'EPO Wallet', VENDOR.EPO_WALLET, SHEET_NAME.E_WALLET));

        test('should have no error message in response', async () =>
            await runNoErrorChecker(epoSolution, 'EPO Wallet', VENDOR.EPO_WALLET, SHEET_NAME.E_WALLET));

        test('should have a success flag true', async () =>
            await runSuccessFlagChecker(epoSolution, 'EPO Wallet', VENDOR.EPO_WALLET, SHEET_NAME.E_WALLET));

        test('should have a valid Checkout URL', async () =>
            await runCheckoutUrlChecker(epoSolution, 'EPO Wallet', VENDOR.EPO_WALLET, SHEET_NAME.E_WALLET));

        test('should load checkout page without errors', async ({ page }) => {

            test.skip(!epoSolution.checkoutUrl, 'No checkout URL available');

            const startTime = Date.now();

            page.on('pageerror', (err) => {
                if (
                    err.message.includes('Blocked a frame with origin') ||
                    err.message.includes('cross-origin frame')
                ) {
                    console.log('Suppressed cross-origin frame error:', err.message);
                }
            });

            await page.goto(epoSolution.checkoutUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            console.log('Redirected to:', page.url());
            await page.locator('body').waitFor({ state: 'visible', timeout: 10000 });

            const foundErrorsInCheckoutPage = await scanPageForErrors(page, ERROR_KEYWORDS);
            const pageLoadTime = Date.now() - startTime;

            // eslint-disable-next-line playwright/no-conditional-in-test
            if (foundErrorsInCheckoutPage.length > 0) {
                console.log('✒️ Error keywords found:', foundErrorsInCheckoutPage.join(', '));
                await page.screenshot({ path: `Cebuana-checkout-error.png`});
            }

            const checkoutPageLoadResult = CHECKOUT_PAGE_CHECKER(foundErrorsInCheckoutPage, pageLoadTime, epoSolution.checkoutUrl, 'EPO Wallet', VENDOR.EPO_WALLET, SHEET_NAME.E_WALLET);

            console.log('📤 Logging test result:', JSON.stringify(checkoutPageLoadResult));
            await apiResultLogger(checkoutPageLoadResult);
            expect(checkoutPageLoadResult.status).toBe('PASSED');
        });
    });
});

test.describe('PAYMAYA DEPOSIT WORKFLOW', () => {

    let paymayaSolution: DepositInterface;

    test.beforeAll(async () => {
        paymayaSolution = await DepositIntentRequest(E_WALLET_SOLUTIONS.Paymaya)
    });

    test.describe('API AND CHECKOUT PAGE VALIDATION', () => {

        test('should have valid status code', async () =>
            await runStatusCodeChecker(paymayaSolution, 'Paymaya', VENDOR.PLYNXPAY, SHEET_NAME.E_WALLET));

        test('should have no error message in response', async () =>
            await runNoErrorChecker(paymayaSolution, 'Paymaya', VENDOR.PLYNXPAY, SHEET_NAME.E_WALLET));

        test('should have a success flag true', async () =>
            await runSuccessFlagChecker(paymayaSolution, 'Paymaya', VENDOR.PLYNXPAY, SHEET_NAME.E_WALLET));

        test('should have a valid Checkout URL', async () =>
            await runCheckoutUrlChecker(paymayaSolution, 'Paymaya', VENDOR.PLYNXPAY, SHEET_NAME.E_WALLET));

        test('should load checkout page without errors', async ({ page }) => {

            test.skip(!paymayaSolution.checkoutUrl, 'No checkout URL available');

            const startTime = Date.now();

            page.on('pageerror', (err) => {
                if (
                    err.message.includes('Blocked a frame with origin') ||
                    err.message.includes('cross-origin frame')
                ) {
                    console.log('Suppressed cross-origin frame error:', err.message);
                }
            });

            await page.goto(paymayaSolution.checkoutUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            console.log('Redirected to:', page.url());
            await page.locator('body').waitFor({ state: 'visible', timeout: 10000 });

            const foundErrorsInCheckoutPage = await scanPageForErrors(page, ERROR_KEYWORDS);
            const pageLoadTime = Date.now() - startTime;

            // eslint-disable-next-line playwright/no-conditional-in-test
            if (foundErrorsInCheckoutPage.length > 0) {
                console.log('✒️ Error keywords found:', foundErrorsInCheckoutPage.join(', '));
                await page.screenshot({ path: `Cebuana-checkout-error.png`});
            }

            const checkoutPageLoadResult = CHECKOUT_PAGE_CHECKER(foundErrorsInCheckoutPage, pageLoadTime, paymayaSolution.checkoutUrl, 'Paymaya', VENDOR.PLYNXPAY, SHEET_NAME.E_WALLET);

            console.log('📤 Logging test result:', JSON.stringify(checkoutPageLoadResult));
            await apiResultLogger(checkoutPageLoadResult);
            expect(checkoutPageLoadResult.status).toBe('PASSED');
        });
    });
});

test.describe('GRABPAY DEPOSIT WORKFLOW', () => {

    let grabPaySolution: DepositInterface;

    test.beforeAll(async () => {
        grabPaySolution = await DepositIntentRequest(E_WALLET_SOLUTIONS.GrabPay)
    });

    test.describe('API AND CHECKOUT PAGE VALIDATION', () => {

        test('should have valid status code', async () =>
            await runStatusCodeChecker(grabPaySolution, 'GrabPay', VENDOR.UPAY, SHEET_NAME.E_WALLET));

        test('should have no error message in response', async () =>
            await runNoErrorChecker(grabPaySolution, 'GrabPay', VENDOR.UPAY, SHEET_NAME.E_WALLET));

        test('should have a success flag true', async () =>
            await runSuccessFlagChecker(grabPaySolution, 'GrabPay', VENDOR.UPAY, SHEET_NAME.E_WALLET));

        test('should have a valid Checkout URL', async () =>
            await runCheckoutUrlChecker(grabPaySolution, 'GrabPay', VENDOR.UPAY, SHEET_NAME.E_WALLET));

        test('should load checkout page without errors', async ({ page }) => {

            test.skip(!grabPaySolution.checkoutUrl, 'No checkout URL available');

            const startTime = Date.now();

            page.on('pageerror', (err) => {
                if (
                    err.message.includes('Blocked a frame with origin') ||
                    err.message.includes('cross-origin frame')
                ) {
                    console.log('Suppressed cross-origin frame error:', err.message);
                }
            });

            await page.goto(grabPaySolution.checkoutUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            console.log('Redirected to:', page.url());
            await page.locator('body').waitFor({ state: 'visible', timeout: 10000 });

            const foundErrorsInCheckoutPage = await scanPageForErrors(page, ERROR_KEYWORDS);
            const pageLoadTime = Date.now() - startTime;

            // eslint-disable-next-line playwright/no-conditional-in-test
            if (foundErrorsInCheckoutPage.length > 0) {
                console.log('✒️ Error keywords found:', foundErrorsInCheckoutPage.join(', '));
                await page.screenshot({ path: `Cebuana-checkout-error.png`});
            }

            const checkoutPageLoadResult = CHECKOUT_PAGE_CHECKER(foundErrorsInCheckoutPage, pageLoadTime, grabPaySolution.checkoutUrl, 'GrabPay', VENDOR.UPAY, SHEET_NAME.E_WALLET);

            console.log('📤 Logging test result:', JSON.stringify(checkoutPageLoadResult));
            await apiResultLogger(checkoutPageLoadResult);
            expect(checkoutPageLoadResult.status).toBe('PASSED');
        });
    });
});

test.describe('BKASH DEPOSIT WORKFLOW', () => {

    let bkashSolution: DepositInterface;

    test.beforeAll(async () => {
        bkashSolution = await DepositIntentRequest(E_WALLET_SOLUTIONS.bKash)
    });

    test.describe('API AND CHECKOUT PAGE VALIDATION', () => {

        test('should have valid status code', async () =>
            await runStatusCodeChecker(bkashSolution, 'bKash', VENDOR.QONNECTSMART, SHEET_NAME.E_WALLET));

        test('should have no error message in response', async () =>
            await runNoErrorChecker(bkashSolution, 'bKash', VENDOR.QONNECTSMART, SHEET_NAME.E_WALLET));

        test('should have a success flag true', async () =>
            await runSuccessFlagChecker(bkashSolution, 'bKash', VENDOR.QONNECTSMART, SHEET_NAME.E_WALLET));

        test('should have a valid Checkout URL', async () =>
            await runCheckoutUrlChecker(bkashSolution, 'bKash', VENDOR.QONNECTSMART, SHEET_NAME.E_WALLET));

        test('should load checkout page without errors', async ({ page }) => {

            test.skip(!bkashSolution.checkoutUrl, 'No checkout URL available');

            const startTime = Date.now();

            page.on('pageerror', (err) => {
                if (
                    err.message.includes('Blocked a frame with origin') ||
                    err.message.includes('cross-origin frame')
                ) {
                    console.log('Suppressed cross-origin frame error:', err.message);
                }
            });

            await page.goto(bkashSolution.checkoutUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            console.log('Redirected to:', page.url());
            await page.locator('body').waitFor({ state: 'visible', timeout: 10000 });

            const foundErrorsInCheckoutPage = await scanPageForErrors(page, ERROR_KEYWORDS);
            const pageLoadTime = Date.now() - startTime;

            // eslint-disable-next-line playwright/no-conditional-in-test
            if (foundErrorsInCheckoutPage.length > 0) {
                console.log('✒️ Error keywords found:', foundErrorsInCheckoutPage.join(', '));
                await page.screenshot({ path: `Cebuana-checkout-error.png`});
            }

            const checkoutPageLoadResult = CHECKOUT_PAGE_CHECKER(foundErrorsInCheckoutPage, pageLoadTime, bkashSolution.checkoutUrl, 'bKash', VENDOR.QONNECTSMART, SHEET_NAME.E_WALLET);

            console.log('📤 Logging test result:', JSON.stringify(checkoutPageLoadResult));
            await apiResultLogger(checkoutPageLoadResult);
            expect(checkoutPageLoadResult.status).toBe('PASSED');
        });
    });
});

test.describe('NAGAD DEPOSIT WORKFLOW', () => {

    let nagadSolution: DepositInterface;

    test.beforeAll(async () => {
        nagadSolution = await DepositIntentRequest(E_WALLET_SOLUTIONS.Nagad)
    });

    test.describe('API AND CHECKOUT PAGE VALIDATION', () => {

        test('should have valid status code', async () =>
            await runStatusCodeChecker(nagadSolution, 'Nagad', VENDOR.QONNECTSMART, SHEET_NAME.E_WALLET));

        test('should have no error message in response', async () =>
            await runNoErrorChecker(nagadSolution, 'Nagad', VENDOR.QONNECTSMART, SHEET_NAME.E_WALLET));

        test('should have a success flag true', async () =>
            await runSuccessFlagChecker(nagadSolution, 'Nagad', VENDOR.QONNECTSMART, SHEET_NAME.E_WALLET));

        test('should have a valid Checkout URL', async () =>
            await runCheckoutUrlChecker(nagadSolution, 'Nagad', VENDOR.QONNECTSMART, SHEET_NAME.E_WALLET));

        test('should load checkout page without errors', async ({ page }) => {

            test.skip(!nagadSolution.checkoutUrl, 'No checkout URL available');

            const startTime = Date.now();

            page.on('pageerror', (err) => {
                if (
                    err.message.includes('Blocked a frame with origin') ||
                    err.message.includes('cross-origin frame')
                ) {
                    console.log('Suppressed cross-origin frame error:', err.message);
                }
            });

            await page.goto(nagadSolution.checkoutUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            console.log('Redirected to:', page.url());
            await page.locator('body').waitFor({ state: 'visible', timeout: 10000 });

            const foundErrorsInCheckoutPage = await scanPageForErrors(page, ERROR_KEYWORDS);
            const pageLoadTime = Date.now() - startTime;

            // eslint-disable-next-line playwright/no-conditional-in-test
            if (foundErrorsInCheckoutPage.length > 0) {
                console.log('✒️ Error keywords found:', foundErrorsInCheckoutPage.join(', '));
                await page.screenshot({ path: `Cebuana-checkout-error.png`});
            }

            const checkoutPageLoadResult = CHECKOUT_PAGE_CHECKER(foundErrorsInCheckoutPage, pageLoadTime, nagadSolution.checkoutUrl, 'Nagad', VENDOR.QONNECTSMART, SHEET_NAME.E_WALLET);

            console.log('📤 Logging test result:', JSON.stringify(checkoutPageLoadResult));
            await apiResultLogger(checkoutPageLoadResult);
            expect(checkoutPageLoadResult.status).toBe('PASSED');
        });
    });
});