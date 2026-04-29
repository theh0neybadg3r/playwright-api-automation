/* eslint-disable playwright/no-conditional-expect */
/* eslint-disable playwright/no-conditional-in-test */
import { test, expect } from '@playwright/test'
import { apiResultLogger } from "@utils/general";
import { CASH_PAYMENT_SOLUTIONS, E_WALLET_SOLUTIONS } from "@const/solutions";
import { ERROR_KEYWORDS } from "@const/constant-var";
import { CHECKOUT_INTERACTION_CHECKER, CHECKOUT_PAGE_CHECKER, checkoutInteraction, scanPageForErrors } from '@models/result-checker';
import { VENDOR, SHEET_NAME } from '@const/enums';
import { DepositIntentRequest, DepositInterface } from '@models/deposit-intent';
import { runCheckoutUrlChecker, runNoErrorChecker, runStatusCodeChecker, runSuccessFlagChecker } from '@models/api-deposit-checkers';

test.describe('CEBUANA DEPOSIT WORKFLOW', () => {

    test.describe.configure({ mode: 'serial' });

    let cebuanaSolution: DepositInterface;

    test.beforeAll(async () => {

        // test.setTimeout(120000);

        cebuanaSolution = await DepositIntentRequest({ 
            solutionConfig: CASH_PAYMENT_SOLUTIONS.Cebuana,
            apiKeys: {
                publicKey: process.env.API_PUB_KEY_DEFAULT!,
                secretKey: process.env.API_SECRET_KEY_DEFAULT!
            }
        });
    });

    test('API AND CHECKOUT PAGE VALIDATION', async ({ browser }) => {

        test.setTimeout(120000);

        await runStatusCodeChecker(cebuanaSolution, 'Cebuana', VENDOR.UPAY, SHEET_NAME.CASH_PAYMENT);
        await runNoErrorChecker(cebuanaSolution, 'Cebuana', VENDOR.UPAY, SHEET_NAME.CASH_PAYMENT);
        await runSuccessFlagChecker(cebuanaSolution, 'Cebuana', VENDOR.UPAY, SHEET_NAME.CASH_PAYMENT);
        await runCheckoutUrlChecker(cebuanaSolution, 'Cebuana', VENDOR.UPAY, SHEET_NAME.CASH_PAYMENT);

        //Checker for checking if the checkout page load without error.
        if (!cebuanaSolution?.checkoutUrl) {
            const failedResult = CHECKOUT_PAGE_CHECKER(
                ['No checkout URL available'], 
                0,
                null,
                'Cebuana',
                VENDOR.UPAY,
                SHEET_NAME.CASH_PAYMENT
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

            await page.goto(cebuanaSolution.checkoutUrl, { waitUntil: 'load', timeout: 80000 });
            console.log('Redirected to:', page.url());
            await page.locator('body').waitFor({ state: 'visible', timeout: 10000 });

            const { initialErrors, postInteractionErrors, interacted } = await checkoutInteraction (page, ERROR_KEYWORDS);


            //const foundErrorsInCheckoutPage = await scanPageForErrors(page, ERROR_KEYWORDS);
            const pageLoadTime = Date.now() - startTime;

            if (initialErrors.length > 0 || postInteractionErrors.length > 0) {
                console.log('Errors found - Initial:', initialErrors, '| Post-interaction:', postInteractionErrors);
                await page.screenshot({ path: `Upay-Palawan-checkout-error.png` });
            }

            if (!interacted) {
                console.log('Checkbox not found - falling back to basic page load check');
            }

            const checkoutResult = CHECKOUT_INTERACTION_CHECKER(
                initialErrors,
                postInteractionErrors, 
                interacted, 
                pageLoadTime,
                cebuanaSolution.checkoutUrl,
                'Cebuana',
                VENDOR.UPAY,
                SHEET_NAME.CASH_PAYMENT
            );

            console.log('📤 Logging test result:', JSON.stringify(checkoutResult));
            await apiResultLogger(checkoutResult);
            expect(checkoutResult.status).toBe('PASSED');

        } finally { await context.close() }
    });
});

// if (foundErrorsInCheckoutPage.length > 0) {
            //     console.log('✒️ Error keywords found:', foundErrorsInCheckoutPage.join(', '));
            //     await page.screenshot({ path: `AllBank-checkout-error.png`});
            // }

            // const checkoutPageLoadResult = CHECKOUT_PAGE_CHECKER(
            //     foundErrorsInCheckoutPage, 
            //     pageLoadTime, 
            //     palawanSolution.checkoutUrl, 
            //     'Palawan', 
            //     VENDOR.UPAY, 
            //     SHEET_NAME.CASH_PAYMENT
            // );

test.describe('ALLBANK DEPOSIT WORKFLOW', () => {

    test.describe.configure({ mode: 'serial' });

    let allBankSolution: DepositInterface;

    test.beforeAll(async () => {

        allBankSolution = await DepositIntentRequest({ 
            solutionConfig: E_WALLET_SOLUTIONS.Gcash_S,
            apiKeys: {
                publicKey: process.env.API_PUB_KEY_1!,
                secretKey: process.env.API_SECRET_KEY_1!
            }
        });
    });

    test('API AND CHECKOUT PAGE VALIDATION', async ( { browser } ) => {

        test.setTimeout(120000);

        await runStatusCodeChecker(allBankSolution, 'Gcash_S', VENDOR.ALLBANK, SHEET_NAME.E_WALLET);
        await runNoErrorChecker(allBankSolution, 'Gcash_S', VENDOR.ALLBANK, SHEET_NAME.E_WALLET);
        await runSuccessFlagChecker(allBankSolution, 'Gcash_S', VENDOR.ALLBANK, SHEET_NAME.E_WALLET);
        await runCheckoutUrlChecker(allBankSolution, 'Gcash_S', VENDOR.ALLBANK, SHEET_NAME.E_WALLET);

        //Checker for checking if the checkout page load without error.
        if (!allBankSolution?.checkoutUrl) {
            const failedResult = CHECKOUT_PAGE_CHECKER(
                ['No checkout URL available'], 
                0,
                null,
                'Gcash_S',
                VENDOR.ALLBANK,
                SHEET_NAME.E_WALLET
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

            await page.goto(allBankSolution.checkoutUrl, { waitUntil: 'load', timeout: 30000 } );
            console.log('Redirected to:', page.url());
            await page.locator('body').waitFor( { state: 'visible', timeout: 10000 } );

            const foundErrorsInCheckoutPage = await scanPageForErrors(page, ERROR_KEYWORDS);
            const pageLoadTime = Date.now() - startTime;

            if (foundErrorsInCheckoutPage.length > 0) {
                console.log('✒️ Error keywords found:', foundErrorsInCheckoutPage.join(', '));
                await page.screenshot({ path: `AllBank-checkout-error.png`});
            }

            const checkoutPageLoadResult = CHECKOUT_PAGE_CHECKER(
                foundErrorsInCheckoutPage, 
                pageLoadTime, 
                allBankSolution.checkoutUrl, 
                'Gcash_S', 
                VENDOR.ALLBANK, 
                SHEET_NAME.E_WALLET
            );

            console.log('📤 Logging test result:', JSON.stringify(checkoutPageLoadResult));
            await apiResultLogger(checkoutPageLoadResult);
            expect(checkoutPageLoadResult.status).toBe('PASSED');

        } finally { await context.close(); } 
    });
});

test.describe('PLYNXPAY_GCASH DEPOSIT WORKFLOW', () => {

    test.describe.configure({ mode: 'serial' });

    let p_gcashSolution: DepositInterface;

    test.beforeAll(async () => {

        p_gcashSolution = await DepositIntentRequest({ 
            solutionConfig: E_WALLET_SOLUTIONS.Gcash,
            apiKeys: {
                publicKey: process.env.API_PUB_KEY_2!,
                secretKey: process.env.API_SECRET_KEY_2!
            }
        });
    });

    test('API AND CHECKOUT PAGE VALIDATION', async ( { browser } ) => {

        test.setTimeout(120000);

        await runStatusCodeChecker(p_gcashSolution, 'Gcash', VENDOR.PLYNXPAY, SHEET_NAME.E_WALLET);
        await runNoErrorChecker(p_gcashSolution, 'Gcash', VENDOR.PLYNXPAY, SHEET_NAME.E_WALLET);
        await runSuccessFlagChecker(p_gcashSolution, 'Gcash', VENDOR.PLYNXPAY, SHEET_NAME.E_WALLET);
        await runCheckoutUrlChecker(p_gcashSolution, 'Gcash', VENDOR.PLYNXPAY, SHEET_NAME.E_WALLET);

        //Checker for checking if the checkout page load without error.
        if (!p_gcashSolution?.checkoutUrl) {
            const failedResult = CHECKOUT_PAGE_CHECKER(
                ['No checkout URL available'], 
                0,
                null,
                'Gcash',
                VENDOR.PLYNXPAY,
                SHEET_NAME.E_WALLET
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

            await page.goto(p_gcashSolution.checkoutUrl, { waitUntil: 'load', timeout: 30000 } );
            console.log('Redirected to:', page.url());
            await page.locator('body').waitFor( { state: 'visible', timeout: 10000 } );

            const foundErrorsInCheckoutPage = await scanPageForErrors(page, ERROR_KEYWORDS);
            const pageLoadTime = Date.now() - startTime;

            if (foundErrorsInCheckoutPage.length > 0) {
                console.log('✒️ Error keywords found:', foundErrorsInCheckoutPage.join(', '));
                await page.screenshot({ path: `AllBank-checkout-error.png`});
            }

            const checkoutPageLoadResult = CHECKOUT_PAGE_CHECKER(
                foundErrorsInCheckoutPage, 
                pageLoadTime, 
                p_gcashSolution.checkoutUrl, 
                'Gcash', 
                VENDOR.PLYNXPAY, 
                SHEET_NAME.E_WALLET
            );

            console.log('📤 Logging test result:', JSON.stringify(checkoutPageLoadResult));
            await apiResultLogger(checkoutPageLoadResult);
            expect(checkoutPageLoadResult.status).toBe('PASSED');

        } finally { await context.close(); } 
    });
});

test.describe('ORIENTAL WALLET DEPOSIT WORKFLOW', () => {

    test.describe.configure({ mode: 'serial' });

    let orientalWalletSolution: DepositInterface;

    test.beforeAll(async () => {

        orientalWalletSolution = await DepositIntentRequest({ 
            solutionConfig: E_WALLET_SOLUTIONS.Oriental_Wallet,
            apiKeys: {
                publicKey: process.env.API_PUB_KEY_1!,
                secretKey: process.env.API_SECRET_KEY_1!
            }
        });
    });

    test('API AND CHECKOUT PAGE VALIDATION', async ( { browser } ) => {

        test.setTimeout(120000);

        await runStatusCodeChecker(orientalWalletSolution, 'Oriental Wallet', VENDOR.ORIENTAL_WALLET, SHEET_NAME.E_WALLET);
        await runNoErrorChecker(orientalWalletSolution, 'Oriental Wallet', VENDOR.ORIENTAL_WALLET, SHEET_NAME.E_WALLET);
        await runSuccessFlagChecker(orientalWalletSolution, 'Oriental Wallet', VENDOR.ORIENTAL_WALLET, SHEET_NAME.E_WALLET);
        await runCheckoutUrlChecker(orientalWalletSolution, 'Oriental Wallet', VENDOR.ORIENTAL_WALLET, SHEET_NAME.E_WALLET);

        //Checker for checking if the checkout page load without error.
        if (!orientalWalletSolution?.checkoutUrl) {
            const failedResult = CHECKOUT_PAGE_CHECKER(
                ['No checkout URL available'], 
                0,
                null,
                'Oriental Wallet',
                VENDOR.ORIENTAL_WALLET,
                SHEET_NAME.E_WALLET
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

            await page.goto(orientalWalletSolution.checkoutUrl, { waitUntil: 'load', timeout: 30000 } );
            console.log('Redirected to:', page.url());
            await page.locator('body').waitFor( { state: 'visible', timeout: 10000 } );

            const foundErrorsInCheckoutPage = await scanPageForErrors(page, ERROR_KEYWORDS);
            const pageLoadTime = Date.now() - startTime;

            if (foundErrorsInCheckoutPage.length > 0) {
                console.log('✒️ Error keywords found:', foundErrorsInCheckoutPage.join(', '));
                await page.screenshot({ path: `AllBank-checkout-error.png`});
            }

            const checkoutPageLoadResult = CHECKOUT_PAGE_CHECKER(
                foundErrorsInCheckoutPage, 
                pageLoadTime, 
                orientalWalletSolution.checkoutUrl, 
                'Oriental Wallet', 
                VENDOR.ORIENTAL_WALLET, 
                SHEET_NAME.E_WALLET
            );

            console.log('📤 Logging test result:', JSON.stringify(checkoutPageLoadResult));
            await apiResultLogger(checkoutPageLoadResult);
            expect(checkoutPageLoadResult.status).toBe('PASSED');

        } finally { await context.close(); } 
    });
});

test.describe('UPAY_GCASH WALLET DEPOSIT WORKFLOW', () => {

    test.describe.configure({ mode: 'serial' });

    let u_gcashSolution: DepositInterface;

    test.beforeAll(async () => {

        u_gcashSolution = await DepositIntentRequest({ 
            solutionConfig: E_WALLET_SOLUTIONS.Gcash,
            apiKeys: {
                publicKey: process.env.API_PUB_KEY_3!,
                secretKey: process.env.API_SECRET_KEY_3!
            }
        });
    });

    test('API AND CHECKOUT PAGE VALIDATION', async ( { browser } ) => {

        test.setTimeout(120000);

        await runStatusCodeChecker(u_gcashSolution, 'Gcash', VENDOR.UPAY, SHEET_NAME.E_WALLET);
        await runNoErrorChecker(u_gcashSolution, 'Gcash', VENDOR.UPAY, SHEET_NAME.E_WALLET);
        await runSuccessFlagChecker(u_gcashSolution, 'Gcash', VENDOR.UPAY, SHEET_NAME.E_WALLET);
        await runCheckoutUrlChecker(u_gcashSolution, 'Gcash', VENDOR.UPAY, SHEET_NAME.E_WALLET);

        //Checker for checking if the checkout page load without error.
        if (!u_gcashSolution?.checkoutUrl) {
            const failedResult = CHECKOUT_PAGE_CHECKER(
                ['No checkout URL available'], 
                0,
                null,
                'Gcash',
                VENDOR.UPAY,
                SHEET_NAME.E_WALLET
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

            await page.goto(u_gcashSolution.checkoutUrl, { waitUntil: 'load', timeout: 30000 } );
            console.log('Redirected to:', page.url());
            await page.locator('body').waitFor( { state: 'visible', timeout: 10000 } );

            const foundErrorsInCheckoutPage = await scanPageForErrors(page, ERROR_KEYWORDS);
            const pageLoadTime = Date.now() - startTime;

            if (foundErrorsInCheckoutPage.length > 0) {
                console.log('✒️ Error keywords found:', foundErrorsInCheckoutPage.join(', '));
                await page.screenshot({ path: `AllBank-checkout-error.png`});
            }

            const checkoutPageLoadResult = CHECKOUT_PAGE_CHECKER(
                foundErrorsInCheckoutPage, 
                pageLoadTime, 
                u_gcashSolution.checkoutUrl, 
                'Gcash', 
                VENDOR.UPAY, 
                SHEET_NAME.E_WALLET
            );

            console.log('📤 Logging test result:', JSON.stringify(checkoutPageLoadResult));
            await apiResultLogger(checkoutPageLoadResult);
            expect(checkoutPageLoadResult.status).toBe('PASSED');

        } finally { await context.close(); } 
    });
});



// test('should validate deposit intent API response', async () => {
    //     await runStatusCodeChecker(palawanSolution, 'Palawan', VENDOR.UPAY, SHEET_NAME.CASH_PAYMENT);
    //     await runNoErrorChecker(palawanSolution, 'Palawan', VENDOR.UPAY, SHEET_NAME.CASH_PAYMENT);
    //     await runSuccessFlagChecker(palawanSolution, 'Palawan', VENDOR.UPAY, SHEET_NAME.CASH_PAYMENT);
    //     await runCheckoutUrlChecker(palawanSolution, 'Palawan', VENDOR.UPAY, SHEET_NAME.CASH_PAYMENT);
    // });

    // test('should load checkout page without errors', async ({ page }) => {

    //     test.skip(!palawanSolution.checkoutUrl, 'No checkout URL available');

    //     const startTime = Date.now();

    //     page.on('pageerror', (err) => {
    //         if (
    //             err.message.includes('Blocked a frame with origin') ||
    //             err.message.includes('cross-origin frame')
    //         ) {
    //             console.log('Suppressed cross-origin frame error:', err.message);
    //         }
    //     });

    //     await page.goto(palawanSolution.checkoutUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    //     console.log('Redirected to:', page.url());
    //     await page.locator('body').waitFor({ state: 'visible', timeout: 10000 });

    //     const foundErrorsInCheckoutPage = await scanPageForErrors(page, ERROR_KEYWORDS);
    //     const pageLoadTime = Date.now() - startTime;

    //     if (foundErrorsInCheckoutPage.length > 0) {
    //         console.log('✒️ Error keywords found:', foundErrorsInCheckoutPage.join(', '));
    //         await page.screenshot({ path: `Palawan-checkout-error.png`});
    //     }

    //     const checkoutPageLoadResult = CHECKOUT_PAGE_CHECKER(foundErrorsInCheckoutPage, pageLoadTime, palawanSolution.checkoutUrl, 'Palawan', VENDOR.UPAY, SHEET_NAME.CASH_PAYMENT);

    //     console.log('📤 Logging test result:', JSON.stringify(checkoutPageLoadResult));
    //     await apiResultLogger(checkoutPageLoadResult);
    //     expect(checkoutPageLoadResult.status).toBe('PASSED');
    // });


// test('should validate deposit intent API response', async () => {
        //     await runStatusCodeChecker(allBankSolution, 'Gcash_S', VENDOR.ALLBANK, SHEET_NAME.E_WALLET);
        //     await runNoErrorChecker(allBankSolution, 'Gcash_S', VENDOR.ALLBANK, SHEET_NAME.E_WALLET);
        //     await runSuccessFlagChecker(allBankSolution, 'Gcash_S', VENDOR.ALLBANK, SHEET_NAME.E_WALLET);
        //     await runCheckoutUrlChecker(allBankSolution, 'Gcash_S', VENDOR.ALLBANK, SHEET_NAME.E_WALLET);
        // });

        // test('should load checkout page without errors', async ({ page }) => {

        //     //test.skip(!allBankSolution.checkoutUrl, 'No checkout URL available');

        //     if (!allBankSolution?.checkoutUrl) {
        //         const failedResult = CHECKOUT_PAGE_CHECKER(
        //             ['No checkout URL available'], 
        //             0,
        //             null,
        //             'Gcash_s',
        //             VENDOR.ALLBANK,
        //             SHEET_NAME.E_WALLET
        //         );

        //         console.log('📤 Logging test result (no checkout URL):', JSON.stringify(failedResult));
        //         await apiResultLogger(failedResult);
        //         expect.soft(false, 'No checkout URL available - skipping page load').toBeTruthy();
        //         return;
        //     }

        //     const startTime = Date.now();

        //     page.on('pageerror', (err) => {
        //         if (
        //             err.message.includes('Blocked a frame with origin') ||
        //             err.message.includes('cross-origin frame')
        //         ) {
        //             console.log('Suppressed cross-origin frame error:', err.message);
        //         }
        //     });

        //     await page.goto(allBankSolution.checkoutUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        //     console.log('Redirected to:', page.url());
        //     await page.locator('body').waitFor({ state: 'visible', timeout: 10000 });

        //     const foundErrorsInCheckoutPage = await scanPageForErrors(page, ERROR_KEYWORDS);
        //     const pageLoadTime = Date.now() - startTime;

        //     if (foundErrorsInCheckoutPage.length > 0) {
        //         console.log('✒️ Error keywords found:', foundErrorsInCheckoutPage.join(', '));
        //         await page.screenshot({ path: `AllBank-checkout-error.png`});
        //     }

        //     const checkoutPageLoadResult = CHECKOUT_PAGE_CHECKER(foundErrorsInCheckoutPage, pageLoadTime, allBankSolution.checkoutUrl, 'Gcash_S', VENDOR.ALLBANK, SHEET_NAME.E_WALLET);

        //     console.log('📤 Logging test result:', JSON.stringify(checkoutPageLoadResult));
        //     await apiResultLogger(checkoutPageLoadResult);
        //     expect(checkoutPageLoadResult.status).toBe('PASSED');
        // });

// test.describe('UNIONBANK ONLINE DEPOSIT WORKFLOW', () => {

//     let unionbankSolution: DepositInterface;

//     test.beforeAll(async () => {
//         unionbankSolution = await DepositIntentRequest(ONLINE_BANKING_SOLUTION.Unionbank)
//     });

//     test.describe('API AND CHECKOUT PAGE VALIDATION', () => {

//         test('should have valid status code', async () =>
//             await runStatusCodeChecker(unionbankSolution, 'Unionbank', VENDOR.UPAY, SHEET_NAME.ONLINE_BANKING));

//         test('should have no error message in response', async () =>
//             await runNoErrorChecker(unionbankSolution, 'Unionbank', VENDOR.UPAY, SHEET_NAME.ONLINE_BANKING));

//         test('should have a success flag true', async () =>
//             await runSuccessFlagChecker(unionbankSolution, 'Unionbank', VENDOR.UPAY, SHEET_NAME.ONLINE_BANKING));

//         test('should have a valid Checkout URL', async () =>
//             await runCheckoutUrlChecker(unionbankSolution, 'Unionbank', VENDOR.UPAY, SHEET_NAME.ONLINE_BANKING));

//         test('should load checkout page without errors', async ({ page }) => {

//             test.skip(!unionbankSolution.checkoutUrl, 'No checkout URL available');

//             const startTime = Date.now();

//             page.on('pageerror', (err) => {
//                 if (
//                     err.message.includes('Blocked a frame with origin') ||
//                     err.message.includes('cross-origin frame')
//                 ) {
//                     console.log('Suppressed cross-origin frame error:', err.message);
//                 }
//             });

//             await page.goto(unionbankSolution.checkoutUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
//             console.log('Redirected to:', page.url());
//             await page.locator('body').waitFor({ state: 'visible', timeout: 10000 });

//             const foundErrorsInCheckoutPage = await scanPageForErrors(page, ERROR_KEYWORDS);
//             const pageLoadTime = Date.now() - startTime;

//             // eslint-disable-next-line playwright/no-conditional-in-test
//             if (foundErrorsInCheckoutPage.length > 0) {
//                 console.log('✒️ Error keywords found:', foundErrorsInCheckoutPage.join(', '));
//                 await page.screenshot({ path: `Palawan-checkout-error.png`});
//             }

//             const checkoutPageLoadResult = CHECKOUT_PAGE_CHECKER(foundErrorsInCheckoutPage, pageLoadTime, unionbankSolution.checkoutUrl, 'Unionbank', VENDOR.UPAY, SHEET_NAME.ONLINE_BANKING);

//             console.log('📤 Logging test result:', JSON.stringify(checkoutPageLoadResult));
//             await apiResultLogger(checkoutPageLoadResult);
//             expect(checkoutPageLoadResult.status).toBe('PASSED');
//         });
//     });
// });