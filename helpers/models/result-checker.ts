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

    const isNon2xx = apiResponseData.status < 200 || apiResponseData.status > 299;
    const hasErrorField = !!(apiResponseData.body?.error);
    const hasFailedSuccess = apiResponseData.body?.success === false;
    const hasMessageOnError = isNon2xx && !!(apiResponseData.body?.message);

    const containsErrorMessage = hasErrorField || hasFailedSuccess || hasMessageOnError;

    const errorDetail = hasErrorField
        ? JSON.stringify(apiResponseData.body?.error)
        : hasMessageOnError
            ? JSON.stringify(apiResponseData.body?.message)
            : JSON.stringify(apiResponseData.body);
    return {
        vendor,
        solution: solutionName,
        testName: 'No error message in response',
        status: containsErrorMessage ? 'FAILED' : 'PASSED',
        errorDetails: containsErrorMessage ? errorDetail: 'None',
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
