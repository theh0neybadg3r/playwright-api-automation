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

export async function checkoutInteraction(page: Page, errorKeywords: string[]): Promise<{ initialErrors: string[]; postInteractionErrors: string[]; interacted: boolean }> {

    const initialErrors = await scanPageForErrors(page, errorKeywords);

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

    if (!interacted) {
        console.log('❌ No checkbox found on checkout page');
        return { initialErrors, postInteractionErrors: [], interacted: false };
    }

    try {

        await page.waitForLoadState('domcontentloaded', { timeout: 15000});
        console.log('✅ Content loaded after checkbox toggle.')
    } catch {
        console.log('Load state timeout - proceeding anyway');
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

    let buttonClicked = false;
    let redirectedSucceeded = false;

    for(const buttonSelector of buttonSelectors) {

        try {
            await page.waitForSelector(buttonSelector, { state: 'visible', timeout: 15000});

            const button = page.locator(buttonSelector).first();
            const isVisible = await button.isVisible().catch(() => false);

            if (isVisible) {

                const btnText = await button.innerText().catch(() => button.getAttribute('value').catch(() => 'N/A'));
                console.log(`Found button with selector: ${buttonSelector} | Text: "${btnText}`);

                const currentUrl = page.url();

                try {
                    await Promise.all([
                        page.waitForURL(url => url.href !== currentUrl, { waitUntil: 'load', timeout: 15000 }),
                        button.click()
                    ]);

                    console.log('🐭 Button clicked and redirected to:', page.url());
                    redirectedSucceeded = true;
                } catch {
                    console.log('❌ No redirect after button click - navigation may have failed');
                    redirectedSucceeded = false;
                }

                buttonClicked = true;
                break;


            }
        } catch{
            continue;
        }
    }

    if (!buttonClicked) {
        console.log('❌ No proceed/submit button found on checkout page.');
        return { initialErrors, postInteractionErrors: ['Proceed button not found after checkbox toggle'], interacted };
    }

    if (!redirectedSucceeded) {
        console.log('➡️ Button was found but redirect failed');
        return { initialErrors, postInteractionErrors: ['Button clicked but redirect did not occur'], interacted };
    }

    const postInteractionErrors = await scanForRedirectedPages(page, errorKeywords);

    return { initialErrors, postInteractionErrors, interacted };
}

export async function scanForRedirectedPages(page: Page, errorKeywords: string[]): Promise<string[]> {

    try {
        let prevUrl = '';
        let currUrl = page.url();
        let maxRedirects = 10;

        while (prevUrl !== currUrl && maxRedirects > 0) {

            prevUrl = currUrl;

            try {
                await page.waitForURL(url => url.href !== prevUrl, {
                    waitUntil: 'load',
                    timeout: 10000
                });

                currUrl = page.url();
                console.log(`♿ Redirect detected, now at: ${currUrl}`);
                maxRedirects--;
            } catch {
                console.log(`✅ Final page reached: ${currUrl}`);
                break;
            }
        }
        
        await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

        const bodyTextInPage = await page.evaluate(() => { return document.body?.innerText?.toLowerCase() ?? '';});

        if (!bodyTextInPage.trim()) return [];

        const errorsFoundInPage = errorKeywords.filter(keyword => bodyTextInPage.includes(keyword.toLowerCase()));

        if (errorsFoundInPage.length > 0) {
            console.log('🤦‍♀️ Errors found on final page:', errorsFoundInPage.join(', '));
        }

        return errorsFoundInPage;
        
    } catch (error) {
        console.log('scanForRedirectPages failed:', error.message);
        return [];
    }
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


// const button = page.locator(buttonSelector).first();
        // const isVisible = await button.isVisible().catch(() => false);

        // if (isVisible) {
        //     console.log(`Found button with selector: ${buttonSelector}`);

        //     const currentUrl = page.url();

        //     // await button.click();
            
        //     try {
        //         await Promise.race([
        //             page.waitForURL(url => url.href !== currentUrl, { waitUntil: 'load', timeout: 15000 }),
        //             button.click(),
        //             // page.waitForLoadState('domcontentloaded', { timeout: 15000 }),
        //         ]);
        //         console.log('Redirected to:', page.url()); 
        //     } catch {
        //         console.log('🙅‍♂️ No redirect detected after button click, scanning current page...');
        //     }

        //     buttonClicked = true;
        //     break;
        // }

// console.log(`✅ Found button with selector: ${buttonSelector}`);
                // const currentUrl = page.url();

                // await Promise.all([
                //     page.waitForURL(url => url.href !== currentUrl, { waitUntil: 'load', timeout: 15000 }),
                //     button.click()
                // ]);

                // console.log('🐭 Button clicked and redirected to:', page.url());
                // buttonClicked = true;
                // break;

// await page.waitForLoadState('networkidle', { timeout: 15000 });

    // const onlyVisibleErrors = await page.evaluate(() => {
    //     const dialogs = document.querySelectorAll('dialog, [role="dialog"], [role="alertdialog"]');
    //     return Array.from(dialogs)
    //         .filter(elements => {
    //             const style = window.getComputedStyle(elements);
    //             const rect = elements.getBoundingClientRect();
    //             return (
    //                 style.display !== 'none' &&
    //                 style.visibility !== 'hidden' &&
    //                 style.opacity !== '0' &&
    //                 rect.width > 0 &&
    //                 rect.height > 0
    //             );
    //         })
    //         .map(elements => elements.textContent ?? '')
    //         .join('')
    //         .toLowerCase();
    // });

    // if (!onlyVisibleErrors.trim()) return [];
    // return errorKeywords.filter((keyword) => onlyVisibleErrors.includes(keyword))

     // await Promise.race([
        //     page.waitForURL(url => url.href !== page.url(), { waitUntil: 'load', timeout: 15000 }),
        //     page.waitForURL(/.*/, { timeout: 15000 }),
        // ]);
        // console.log('Page navigated after checkbox toggle, new URL:', page.url());
