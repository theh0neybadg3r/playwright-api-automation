import crypto from "crypto"
import { TestResult } from "@models/types";
import { getRowNumberMapping } from "@const/row-mappings";
import { Page, request } from '@playwright/test'

export const generateRandomReference = (length: number): string => {

    const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomRef = '';

    for (let i = 0; i < length; i++) {
        randomRef += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }

    return randomRef;
};

export const referenceId = (): string => {
    const prefix = "TestRef_";
    return prefix + generateRandomReference(8);
};

export const calculateSK = (publicKey: string, secretKey: string, referenceNum: string): string => {

    const publicRef = `${publicKey}${referenceNum}`;
    const calculatedSK = crypto.createHmac('sha256', secretKey).update(publicRef).digest("hex");

    return calculatedSK;
};

export const apiResultLogger = async (result: TestResult, _page?: Page): Promise<void> => {

    const GSheetURL = process.env.GSHEET_WEBHOOK_URL;

    if (!GSheetURL) {
        console.log('❌ Google Sheets Webhook URL not configured yet...');
        return;
    }

    const mappingResult = {...result};

    if (!mappingResult.rowNumber && mappingResult.sheetName && mappingResult.vendor && mappingResult.solution && mappingResult.testName) {

        const mappedRow = getRowNumberMapping(
            mappingResult.sheetName,
            mappingResult.vendor,
            mappingResult.solution,
            mappingResult.testName
        );

        if (mappedRow) {
            mappingResult.rowNumber = mappedRow;
            console.log(`Using row mapping: Row ${mappedRow}`);
        } else {
            console.log(`No row mapping found, will search for: ${mappingResult.vendor} | ${mappingResult.solution} | ${mappingResult.testName}`);
        }
    }

    console.log('Sending to Google Sheets:', JSON.stringify({
        vendor: mappingResult.vendor,
        solution: mappingResult.solution,
        testName: mappingResult.testName,
        status: mappingResult.status,
        sheet: mappingResult.sheetName,
        row: mappingResult.rowNumber || 'searching...'
    }));

    const apiContext = await request.newContext();

    try {
        const response = await apiContext.post(GSheetURL, {
            data: mappingResult,
            failOnStatusCode: false,
            timeout: 10000
        });

        const status = response.status();
        console.log('Response Status:', status);

        let body: Record<string, unknown> = {};
        try {
            body = await response.json() as Record<string, unknown>;
        } catch {
            const text = await response.text();
            console.log('Response body (non-JSON):', text);
            return;
        }

        if (status === 200 || status === 201 || status === 302) {
            if (body?.['result'] === 'success') {
                console.log(`✅ Successfully logged to Google Sheets - Row: ${body['row']}, Sheet: ${body['sheet']}`);
            } else if (body?.['result'] === 'error') {
                console.log('❌ Google Sheets error:', body['message']);

                if (body['searchedFor']) {
                    console.log('🔍 Searched for:', JSON.stringify(body['searchedFor'], null, 2));
                }

                if (body['availableRows']) {
                    console.log('📋 Available rows in sheet:', JSON.stringify(body['availableRows'], null, 2));
                }

                if (body['availableSheets']) {
                    const sheets = body['availableSheets'];
                    if (Array.isArray(sheets)) {
                        console.log('📁 Available sheets:', sheets.join(', '));
                    }
                }

                if (body['suggestion']) {
                    console.log('💡 Suggestion:', body['suggestion']);
                }
            }
        } else {
            console.log('❌ Failed to log. Status:', status);
            console.log('Response body:', JSON.stringify(body));
        }

    } finally {
        await apiContext.dispose();
    }

}