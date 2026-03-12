/* eslint-disable playwright/no-networkidle */
/* eslint-disable playwright/no-wait-for-selector */
import { Page } from '@playwright/test';
import { TestResult, ApiResponseData } from './types';
import { SHEET_NAME, VENDOR } from '@const/enums';

export function STATUS_CODE_CHECKER(
    apiResponseData: ApiResponseData,
    apiResponseTime: number,
    refId: string,
    solutionName: string,
    vendor: VENDOR,
    sheetName: SHEET_NAME
): TestResult {

    const isSuccess = apiResponseData.status === 200 || apiResponseData.status === 201;
    return {
        vendor,
        solution: solutionName,
        testName: 'Status code is 200 or 201',
        status: isSuccess ? 'PASSED' : 'FAILED',
        errorDetails: isSuccess ? 'None' : `Expected 200 or 201, got ${apiResponseData.status}`,
        remarks: `Response time: ${apiResponseTime}ms | Ref: ${refId}`,
        sheetName
    };
}

export function NO_ERROR_RESPONSE_CHECKER(
    apiResponseData: ApiResponseData,
    solutionName: string,
    vendor: VENDOR,
    sheetName: SHEET_NAME
): TestResult {

    const containsErrorMessage = !!(
        apiResponseData.body?.error || apiResponseData.body?.success === false
    );
    return {
        vendor,
        solution: solutionName,
        testName: 'No error message in response',
        status: containsErrorMessage ? 'FAILED' : 'PASSED',
        errorDetails: containsErrorMessage
            ? JSON.stringify(apiResponseData.body?.error || apiResponseData.body)
            : 'None',
        remarks: containsErrorMessage ? 'Error in API Response' : 'Clean Response',
        sheetName
    };
}

export function SUCCESS_FLAG_CHECKER(
    apiResponseData: ApiResponseData,
    solutionName: string,
    vendor: VENDOR,
    sheetName: SHEET_NAME
): TestResult {

    const containsSuccessFlag = apiResponseData.body?.success === true;
    return {
        vendor,
        solution: solutionName,
        testName: 'Success flag is true',
        status: containsSuccessFlag ? 'PASSED' : 'FAILED',
        errorDetails: containsSuccessFlag
            ? 'None'
            : `Success flag is ${apiResponseData.body?.success}`,
        remarks: containsSuccessFlag ? 'Success flag is present' : 'Missing or false',
        sheetName
    };
}

export function CHECKOUT_URL_CHECKER(
    apiResponseData: ApiResponseData,
    solutionName: string,
    vendor: VENDOR,
    sheetName: SHEET_NAME
): TestResult {

    const checkoutUrl = apiResponseData.body?.data?.checkout_url;
    const urlPresent = !!checkoutUrl;
    const urlValid = urlPresent && /^https?:\/\/.+/.test(checkoutUrl!);

    return {
        vendor,
        solution: solutionName,
        testName: 'Checkout URL is present and valid',
        status: urlPresent && urlValid ? 'PASSED' : 'FAILED',
        errorDetails: !urlPresent
            ? 'Checkout URL missing from response'
            : !urlValid ? 'Invalid URL format' : 'None',
        remarks: urlPresent
            ? `URL: ${checkoutUrl!.substring(0, 200)}`
            : 'Checkout URL is missing',
        sheetName
    };
}

export function CHECKOUT_PAGE_CHECKER(
    foundErrors: string[],
    pageLoadTime: number,
    checkoutUrl: string,
    solutionName: string,
    vendor: VENDOR,
    sheetName: SHEET_NAME
): TestResult{

    const containsErrors = foundErrors.length > 0;
    return {
        vendor,
        solution: solutionName,
        testName: 'Checkout page load without errors',
        status: containsErrors ? 'FAILED' : 'PASSED',
        errorDetails: containsErrors
            ? `Error keywords found: ${foundErrors.join(', ')}`
            : 'None',
        remarks: `Page load: ${pageLoadTime}ms | URL: ${checkoutUrl ? checkoutUrl.substring(0, 200) : 'N/A'}`,
        sheetName
    };
}

export interface RedirectScanResult {
    errors: string[];
    sourceUrl: string;
}

export async function scanPageForErrors(page: Page, errorKeywords: string[]): Promise<string[]> {

    try {

        // await page.waitForLoadState('load', { timeout: 15000 });

        const onlyVisibleErrors = await page.evaluate(() => {
            const dialogs = document.querySelectorAll('dialog, [role="dialog"], [role="alertdialog"]');
            return Array.from(dialogs)
                .filter(elements => {
                    const style = window.getComputedStyle(elements);
                    const rect = elements.getBoundingClientRect();
                    return (
                        style.display !== 'none' &&
                        style.visibility !== 'hidden' &&
                        style.opacity !== '0' &&
                        rect.width > 0 &&
                        rect.height > 0
                    );
                })
                .map(elements => elements.textContent ?? '')
                .join('')
                .toLowerCase();
        });

        if (!onlyVisibleErrors.trim()) return [];
        return errorKeywords.filter((keyword) => onlyVisibleErrors.includes(keyword));

    } catch (error){
        console.warn('scanPageForErrors failed - page may have closed or timed out:', error.message);
        return [];
    }
    
}

async function scanBodyPageErrors (page: Page, errorKeywords: string[]): Promise<string[]> {

    try {
        const textInBody = await page.evaluate(() => document.body?.innerText?.toLowerCase() ?? '');
        if (!textInBody.trim()) return [];
        return errorKeywords.filter(keyword => textInBody.includes(keyword.toLowerCase()));
    } catch (error) {
        console.log('scanBodyPageErrors failed:', error.message);
        return[];
    }
}

async function handleCountdown(page: Page): Promise<void> {

    const countdownKeywords = ['redirecting', 'redirect', 'seconds', 'one-time password', 'otp'];
    const detectTimeout = 5000;
    const dismissTimeoutMs = 30000; 

    try {

        await page.waitForFunction(
            (keywords: string[]) => {

                const dialogs = document.querySelectorAll('dialog, [role="dialog"], [role="alertdialog"]');

                return Array.from(dialogs).some(el => {

                    const style = window.getComputedStyle(el);
                    const rect = el.getBoundingClientRect();

                    const visible = 
                        style.display !== 'none' &&
                        style.visibility  !== 'hidden' &&
                        style.opacity     !== '0'      &&
                        rect.width  > 0                &&
                        rect.height > 0;
                    
                    if (!visible) return false;

                    const text = (el.textContent ?? '').toLowerCase();

                    return keywords.some(k => text.includes(k));
                });
            },

            countdownKeywords, { timeout: detectTimeout }
        );

        const modalText = await page.evaluate(() => {

            const dialogs = document.querySelectorAll('dialog, [role="dialog"], [role="alertdialog"]');

            return Array.from(dialogs)
                .map(el => (el.textContent ?? '').trim())
                .filter(Boolean)
                .join(' | ');
        });

        console.log(`⏱️ Countdown redirect modal detected: "${modalText}`);
        console.log('⏱️ Waiting for modal to auto-dismiss before scanning redirect chain....');

        await page.waitForFunction(
            (keywords: string[]) => {
                const dialogs = document.querySelectorAll('dialog, [role="dialog"], [role="alertdialog"]');
                const stillVisible = Array.from(dialogs).some(el => {
                    const style = window.getComputedStyle(el);
                    const rect  = el.getBoundingClientRect();
                    const visible =
                        style.display     !== 'none'   &&
                        style.visibility  !== 'hidden' &&
                        style.opacity     !== '0'      &&
                        rect.width  > 0                &&
                        rect.height > 0;
                    if (!visible) return false;
                    const text = (el.textContent ?? '').toLowerCase();
                    return keywords.some(k => text.includes(k));
                });
                return !stillVisible;
            },
            countdownKeywords, { timeout: dismissTimeoutMs }
        );

        console.log('✅ Countdown modal dismissed. Proceeding with redirect chain scan.');

    } catch {

        console.log('🙅‍♂️ No countdown modal detected. Proceeding to normal scan...');
    }
}

async function waitForButtonAndClick(page: Page, buttonSelectors: string[]): Promise<{ clicked: boolean; buttonText: string }> {

    const combinedSelectors = buttonSelectors.join(', ');
    const anyButtonsExists = await page.locator(combinedSelectors).first().isVisible().catch(() => false);

    if(!anyButtonsExists) {
        console.log('ℹ️ No actionable button found on current page - skipping button search ');
        return { clicked: false, buttonText: ''};
    }
    for (const buttonSelector of buttonSelectors) {

        try {
            await page.waitForSelector(buttonSelector, { state: 'visible', timeout: 4500 });

            const button = page.locator(buttonSelector).first();
            const isVisible = await button.isVisible().catch(() => false);

            if (!isVisible) continue;

            const buttonText = await button.innerText()
                .catch(() => button.getAttribute('value'))
                .catch(() => 'N/A') as string;

            console.log(`Found button with selector: ${buttonSelector} | Text: "${buttonText}"`);
            await button.click();
            console.log('🐭 Button clicked');

            return { clicked: true, buttonText };

        } catch {
            continue;
        }
    }

    return { clicked: false, buttonText: '' };
}

export async function checkoutInteraction(page: Page, errorKeywords: string[]): Promise<{ initialErrors: string[]; postInteractionErrors: string[]; interacted: boolean }> {

    const redirectScanPromise = scanForRedirectedPages(page, errorKeywords);

    // STEP 2 — Scan the initial checkout page for visible dialog errors
    const initialErrors = await scanPageForErrors(page, errorKeywords);

    // STEP 3 — Checkbox interaction

    const checkboxSelectors = [
        'input[type="checkbox"]',
        '[role="checkbox"]',
        '.checkout-checkbox',
        '[data-testid*="checkbox"]',
        '[class*="checkbox"]',
        '[class*="agree"]',
        '[class*="terms"]',
        '[class*="confirm"]'
    ];

    let interacted = false;

    for (const selectorforCheckbox of checkboxSelectors) {
        const checkbox = page.locator(selectorforCheckbox).first();
        const isVisible = await checkbox.isVisible().catch(() => false);

        if (isVisible) {
            console.log(`Found checkbox with selector: ${selectorforCheckbox}`);
            await checkbox.click();
            console.log('✅ Checkbox toggled');
            interacted = true;
            break;
        }
    }

    const buttonSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        '[class*="submit"]',
        '[class*="summary"]',
        '[class*="proceed"]',
        '[class*="pay"]',
        '[class*="confirm"]',
        '[class*="continue"]',
        '[class*="next"]',
        '[data-testid*="submit"]',
        '[data-testid*="proceed"]',
    ];

    if (!interacted) {
        console.log('❌ No checkbox found on checkout page - scanning current page and checking for direct proceed button...');

        const mainPageCheck = await scanBodyPageErrors(page, errorKeywords);

        const { clicked: buttonClicked } = await waitForButtonAndClick(page, buttonSelectors);

        if (!buttonClicked) {
            console.log('ℹ️ No proceed/submit button found - Scanning for errors....');

            void redirectScanPromise;

            // const mainPageCheck = await scanBodyPageErrors(page, errorKeywords);

            if (mainPageCheck.length > 0) {
                console.log('❌ Errors found on main checkout page:', mainPageCheck);
            }else {
                console.log('✅ No errors found on main checkout page.');
            }

            return { initialErrors, postInteractionErrors: mainPageCheck, interacted };
        }

        await handleCountdown(page);

        console.log('⏳ Scanning redirect chain for errors...');
        const redirectResults = await redirectScanPromise;

        const postInteractionErrors = Array.from(
            new Set(
                redirectResults.flatMap(result => {
                    if (result.errors.length > 0) {
                        console.log(`⚠️ Errors sourced from [${result.sourceUrl}]:`, result.errors);
                    }
                    return result.errors;
                })
            )
        );

        if (postInteractionErrors.length === 0) {
            console.log('✅ No errors found across entire redirect chain.');
        }

        return { initialErrors, postInteractionErrors, interacted };
        // Drain the redirect scan promise so it doesn't leak
        // void redirectScanPromise;
        // return { initialErrors, postInteractionErrors: [], interacted: false };
    }

    // if (interacted) {
    //     try {
    //         await page.waitForLoadState('networkidle', { timeout: 15000 });
    //         console.log('✅ Network idle after checkbox toggle. Button should be ready.');
    //     } catch {
    //         console.log('🚫 networkidle timeout after checkbox - proceeding anyway');
    //     }

    // }

    try {
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        console.log('✅ Network idle after checkbox toggle. Button should be ready.');
    } catch {
        console.log('🚫 networkidle timeout after checkbox - proceeding anyway');
    }

    // STEP 4 — Find and click the submit/proceed button ONCE on the current page only.
    // waitForButtonAndClick does NOT loop across redirects — it only acts on
    // the initial checkout page where the button should be present after checkbox toggle.

    
    const { clicked: buttonClicked } = await waitForButtonAndClick(page, buttonSelectors);

    if (!buttonClicked) {
        console.log('ℹ️ No proceed/submit button found - Scanning for errors....');

        void redirectScanPromise;

        return { initialErrors, postInteractionErrors:  ['Proceed button not found after checkbox toggle'], interacted };
    }

    await handleCountdown(page);

    // STEP 5 — Wait for the redirect chain scanner to complete.
    // It will scan every page the browser lands on after the button click,
    // including intermediate error pages, and return errors per page.
    console.log('⏳ Scanning redirect chain for errors...');
    const redirectResults = await redirectScanPromise;

    const postInteractionErrors = Array.from(
        new Set(
            redirectResults.flatMap(result => {
                if (result.errors.length > 0) {
                    console.log(`⚠️ Errors sourced from [${result.sourceUrl}]:`, result.errors);
                }
                return result.errors;
            })
        )
    );

    if (postInteractionErrors.length === 0) {
        console.log('✅ No errors found across entire redirect chain.');
    }

    return { initialErrors, postInteractionErrors, interacted };

}

export async function scanForRedirectedPages(page: Page, 
    errorKeywords: string[], 
    options: { maxHops?: number; hopTimeoutMs?: number; settleTimeoutMs?: number } = {} 
): Promise<RedirectScanResult[]> {

    const {
        maxHops = 10,
        hopTimeoutMs = 10000,
        settleTimeoutMs = 10000,
    } = options;

    const results: RedirectScanResult[] = [];
    let hopCount = 0;
    let done = false;
    let idleTimer: ReturnType<typeof setTimeout>;

    return new Promise((resolve) => {

        const cleanup = () => {
            if (done) return;
            done = true;
            clearTimeout(idleTimer);
            page.off('framenavigated', wrappedNavigation);
        };

        const finalize = () => {
            cleanup();
            resolve(results);
        };

        const resetIdleTimer = () => {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                console.log('✅ No further redirects detected. Redirect chain complete.');
                finalize();
            }, hopTimeoutMs);
        };

        const onNavigation = async (frame: { url: () => string; parentFrame: () => unknown }) => {

            // Only track the main frame, not iframes
            if (frame.parentFrame() !== null) return;
            if (done) return;

            const landedUrl = frame.url();

            // Skip browser internals
            if (!landedUrl || landedUrl === 'about:blank') return;

            hopCount++;
            console.log(`🔀 Redirect hop ${hopCount}: ${landedUrl}`);

            try {
                await page.waitForLoadState('domcontentloaded', { timeout: settleTimeoutMs });

                const matched = await scanBodyPageErrors(page, errorKeywords);

                if (matched.length > 0) {
                    console.log(`❌ Error keyword(s) found on [${landedUrl}]:`, matched);
                    results.push({ errors: matched, sourceUrl: landedUrl });
                } else {
                    console.log(`✅ No errors detected on [${landedUrl}]`);
                }

            } catch (err) {
                console.warn(`⚠️ Could not scan page [${landedUrl}]:`, err.message);
            }

            if (hopCount >= maxHops) {
                console.log(`🛑 Max redirect hops (${maxHops}) reached. Stopping scan.`);
                finalize();
                return;
            }

            resetIdleTimer();
        };

        // wrappedNavigation resets the idle timer synchronously on each hop
        // so the timer never fires mid-scan while onNavigation is still awaiting
        const wrappedNavigation = (frame: { url: () => string; parentFrame: () => unknown }) => {
            resetIdleTimer();
            void onNavigation(frame);
        };

        page.on('framenavigated', wrappedNavigation);

        // Initial idle timer — resolves if button click triggers no navigation at all
        resetIdleTimer();
    });

}

export function CHECKOUT_INTERACTION_CHECKER(
    initialErrors: string[],
    postInteractionErrors: string[],
    interacted: boolean,
    pageLoadTime: number,
    checkoutUrl: string | null,
    solutionName: string,
    vendor: VENDOR,
    sheetName: SHEET_NAME
): TestResult {

    const allErrors = Array.from(new Set([...initialErrors, ...postInteractionErrors]));
    const hasErrors = allErrors.length > 0;

    let remarks: string;
    if (!interacted) {
        remarks = `Page load: ${pageLoadTime}ms | No checkbox found | URL: ${checkoutUrl?.substring(0, 200) ?? 'N/A'}`;
    } else {
        remarks = `Page load: ${pageLoadTime}ms | Checkbox toggled | URL: ${checkoutUrl?.substring(0, 200) ?? 'N/A'}`;
    }

    return {
        vendor,
        solution: solutionName,
        testName: 'Checkout page load without errors',
        status: hasErrors ? 'FAILED' : 'PASSED',
        errorDetails: hasErrors
            ? `Initial errors: [${initialErrors.join(', ')}] | Post-interaction errors: [${postInteractionErrors.join(', ')}]`
            : 'None',
        remarks,
        sheetName
    };
}

