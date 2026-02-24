import { expect } from '@playwright/test';
import { DepositInterface } from './deposit-intent';
import { apiResultLogger } from '@utils/general';
import { STATUS_CODE_CHECKER, NO_ERROR_RESPONSE_CHECKER, SUCCESS_FLAG_CHECKER, CHECKOUT_URL_CHECKER } from '@models/result-checker';
import { VENDOR, SHEET_NAME } from '@const/enums';

export async function runStatusCodeChecker(state: DepositInterface, solutionName: string, vendor: VENDOR, sheetName: SHEET_NAME) {
    const result = STATUS_CODE_CHECKER(state.apiResponseData, state.apiResponseTime, state.refId, solutionName, vendor, sheetName);
    console.log('📤 Logging test result:', JSON.stringify(result));
    await apiResultLogger(result);
    expect(result.status).toBe('PASSED');
}

export async function runNoErrorChecker(state: DepositInterface, solutionName: string, vendor: VENDOR, sheetName: SHEET_NAME) {
    const result = NO_ERROR_RESPONSE_CHECKER(state.apiResponseData, solutionName, vendor, sheetName);
    console.log('📤 Logging test result:', JSON.stringify(result));
    await apiResultLogger(result);
    expect(result.status).toBe('PASSED');
}

export async function runSuccessFlagChecker(state: DepositInterface, solutionName: string, vendor: VENDOR, sheetName: SHEET_NAME) {
    const result = SUCCESS_FLAG_CHECKER(state.apiResponseData, solutionName, vendor, sheetName);
    console.log('📤 Logging test result:', JSON.stringify(result));
    await apiResultLogger(result);
    expect(result.status).toBe('PASSED');
}

export async function runCheckoutUrlChecker(state: DepositInterface, solutionName: string, vendor: VENDOR, sheetName: SHEET_NAME) {
    const result = CHECKOUT_URL_CHECKER(state.apiResponseData, solutionName, vendor, sheetName);
    console.log('📤 Logging test result:', JSON.stringify(result));
    await apiResultLogger(result);
    expect(result.status).toBe('PASSED');
}