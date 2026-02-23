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
            ? `URL: ${checkoutUrl!.substring(0, 50)}...`
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
        remarks: `Page load: ${pageLoadTime}ms | URL: ${checkoutUrl.substring(0, 200)}...`,
        sheetName
    };
}

export async function scanPageForErrors(page: Page, errorKeywords: string[]): Promise<string[]> {
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
    return errorKeywords.filter((keyword) => onlyVisibleErrors.includes(keyword))
}

