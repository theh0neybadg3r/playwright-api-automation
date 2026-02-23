export interface TestResult {
    vendor?: string;
    solution?: string;
    testName: string;
    status: 'PASSED' | 'FAILED';
    errorDetails: string;
    remarks?: string;
    sheetName?: string;
    timestamp?: string;
    environment?: string;
    responseTime?: number;
    statusCode?: number;
    rowNumber?: number;
}

export interface ApiResponseData {
    status: number;
    body: {
        success?: boolean;
        error?: string;
        message?: string;
        data?: {
            checkout_url?: string;
        };
    };
} 