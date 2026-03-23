/* eslint-disable playwright/no-wait-for-timeout */
/* eslint-disable playwright/no-networkidle */
/* eslint-disable playwright/no-wait-for-selector */
import { Page } from '@playwright/test';


export interface RedirectScanResult {
    errors: string[];
    sourceUrl: string;
}

export interface BankSelectionConfig {
    loginOptionText: string;
    paymentMethod?: string;
    bankName: string;
}

export interface AcknowledgementConfig {
    selector: string;      // exact locator of the dismiss button
    waitAfterMs?: number;  // optional wait after clicking, default 1000ms
}

// ---------------------------------------------------------------------------
// scanPageForErrors
// Scans VISIBLE dialog/alertdialog elements on the initial checkout page.
// ---------------------------------------------------------------------------

export async function scanPageForErrors(page: Page, errorKeywords: string[]): Promise<string[]> {

    try {

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

    } catch (error) {
        console.warn('scanPageForErrors failed - page may have closed or timed out:', error.message);
        return [];
    }

}

// ---------------------------------------------------------------------------
// scanBodyPageErrors
// Scans the full body text of the current page for error keywords.
// ---------------------------------------------------------------------------

async function scanBodyPageErrors(page: Page, errorKeywords: string[]): Promise<string[]> {

    try {
        const textInBody = await page.evaluate(() => document.body?.innerText?.toLowerCase() ?? '');
        if (!textInBody.trim()) return [];
        return errorKeywords.filter(keyword => textInBody.includes(keyword.toLowerCase()));
    } catch (error) {
        console.log('scanBodyPageErrors failed:', error.message);
        return [];
    }

}

// ---------------------------------------------------------------------------
// handleAcknowledgementModal
// Dismisses a page-load modal using an EXACT locator passed via config.
// Only called when acknowledgementConfig is provided — no broad DOM scanning,
// no false positives, zero cost for solutions without this modal.
// ---------------------------------------------------------------------------

async function handleAcknowledgementModal(page: Page, config: AcknowledgementConfig): Promise<void> {

    try {
        const btn = page.locator(config.selector).first();
        const isVisible = await btn.isVisible({ timeout: 3000 }).catch(() => false);

        if (!isVisible) {
            console.log(`ℹ️ Acknowledgement button not found: "${config.selector}" — proceeding normally.`);
            return;
        }

        await btn.click();
        console.log(`✅ Acknowledgement modal dismissed via: "${config.selector}"`);
        await page.waitForTimeout(config.waitAfterMs ?? 1000);

    } catch {
        console.log(`ℹ️ Acknowledgement modal not detected. Proceeding normally.`);
    }

}

// ---------------------------------------------------------------------------
// handleCountdown
// Detects and waits for a countdown redirect modal to auto-dismiss.
// ---------------------------------------------------------------------------

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
                        style.visibility !== 'hidden' &&
                        style.opacity !== '0' &&
                        rect.width > 0 &&
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

        console.log(`⏱️ Countdown redirect modal detected: "${modalText}"`);
        console.log('⏱️ Waiting for modal to auto-dismiss before scanning redirect chain....');

        await page.waitForFunction(
            (keywords: string[]) => {
                const dialogs = document.querySelectorAll('dialog, [role="dialog"], [role="alertdialog"]');
                const stillVisible = Array.from(dialogs).some(el => {
                    const style = window.getComputedStyle(el);
                    const rect = el.getBoundingClientRect();
                    const visible =
                        style.display !== 'none' &&
                        style.visibility !== 'hidden' &&
                        style.opacity !== '0' &&
                        rect.width > 0 &&
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

// ---------------------------------------------------------------------------
// handleConfirmationModal
// Detects and clicks CONFIRM on a confirmation modal after button click.
// ---------------------------------------------------------------------------

async function handleConfirmationModal(page: Page): Promise<void> {

    const confirmationKeywords = ['confirm payment', 'confirm', 'are you sure', 'proceed with'];
    const detectTimeout = 5000;

    try {

        await page.waitForFunction(
            (keywords: string[]) => {
                const dialogs = document.querySelectorAll('dialog, [role="dialog"], [role="alertdialog"]');
                return Array.from(dialogs).some(el => {
                    const style = window.getComputedStyle(el);
                    const rect = el.getBoundingClientRect();
                    const visible =
                        style.display !== 'none' &&
                        style.visibility !== 'hidden' &&
                        style.opacity !== '0' &&
                        rect.width > 0 &&
                        rect.height > 0;
                    if (!visible) return false;
                    const text = (el.textContent ?? '').toLowerCase();
                    return keywords.some(k => text.includes(k));
                });
            },
            confirmationKeywords,
            { timeout: detectTimeout }
        );

        const modalText = await page.evaluate(() => {
            const dialogs = document.querySelectorAll('dialog, [role="dialog"], [role="alertdialog"]');
            return Array.from(dialogs)
                .filter(el => {
                    const style = window.getComputedStyle(el);
                    const rect = el.getBoundingClientRect();
                    return (
                        style.display !== 'none' &&
                        style.visibility !== 'hidden' &&
                        style.opacity !== '0' &&
                        rect.width > 0 &&
                        rect.height > 0
                    );
                })
                .map(el => (el.textContent ?? '').trim())
                .filter(Boolean)
                .join(' | ');
        });

        console.log(`🛎️ Confirmation modal detected: "${modalText}"`);
        console.log('🖱️ Clicking CONFIRM to proceed...');

        const confirmButton = page.locator(
            '[id*="ConfirmPayment"] input[type="submit"][value="CONFIRM"], ' +
            '[id*="ConfirmPayment"] input[type="submit"][class*="background-primary"]'
        ).first();

        const isConfirmButtonVisible = await confirmButton.isVisible().catch(() => false);

        if (isConfirmButtonVisible) {
            await confirmButton.click();
            console.log('✅ Confirmation modal confirmed.');
        } else {
            const fallBackConfirm = page.locator('input[type="submit"][value="CONFIRM"]').first();
            const isFallBackButtonVisible = await fallBackConfirm.isVisible().catch(() => false);
            if (isFallBackButtonVisible) {
                await fallBackConfirm.click();
                console.log('✅ Confirmation modal confirmed via fallback.');
            } else {
                console.log('⚠️ Confirmation modal detected but no confirm button found - proceeding anyway....');
            }
        }

    } catch {
        console.log('🙅‍♂️ No confirmation modal detected. Proceeding to redirect scan...');
    }

}

// ---------------------------------------------------------------------------
// handleBankSelection
// Handles bank selection page — clicks login option, selects bank from
// dropdown, clicks continue. Supports both href-based and text-based matching.
// ---------------------------------------------------------------------------

async function handleBankSelection(page: Page, config: BankSelectionConfig): Promise<void> {

    const { loginOptionText, paymentMethod, bankName } = config;

    try {

        try {
            await page.waitForFunction(() => {
                const container = document.querySelector('#payment-selection-home');
                return container && container.children.length > 0;
            }, { timeout: 15000 });
        } catch {
            console.log('⚠️ Payment selection container did not render — trying anyway');
        }

        console.log(`👀 Looking for login option: "${loginOptionText}"...`);
        let loginOptionClicked = false;

        // Strategy A — href-based match for image-only payment option cards
        if (paymentMethod) {
            try {
                const hrefSelector = `a[href="javascript:choosePayment('${paymentMethod}')"]`;
                await page.waitForSelector(hrefSelector, { state: 'visible', timeout: 5000 });
                const option = page.locator(hrefSelector).first();
                const isVisible = await option.isVisible().catch(() => false);
                if (isVisible) {
                    await option.click();
                    console.log(`✅ Login option clicked via paymentMethod: "${paymentMethod}"`);
                    loginOptionClicked = true;
                }
            } catch {
                console.log(`⚠️ paymentMethod selector not found — falling back to text match`);
            }
        }

        // Strategy B — text-based match
        if (!loginOptionClicked) {
            const loginOptionSelectors = [
                `text=${loginOptionText}`,
                `a:has-text("${loginOptionText}")`,
                `[class*="option"]:has-text("${loginOptionText}")`,
                `label:has-text("${loginOptionText}")`,
                `div:has-text("${loginOptionText}")`,
                `li:has-text("${loginOptionText}")`,
            ];

            for (const selector of loginOptionSelectors) {
                try {
                    await page.waitForSelector(selector, { state: 'visible', timeout: 3000 });
                    const option = page.locator(selector).first();
                    const isVisible = await option.isVisible().catch(() => false);
                    if (!isVisible) continue;
                    await option.click();
                    console.log(`✅ Login option selected via text: "${loginOptionText}"`);
                    loginOptionClicked = true;
                    break;
                } catch {
                    continue;
                }
            }
        }

        if (!loginOptionClicked) {
            console.log(`⚠️ Login option "${loginOptionText}" not found — skipping bank selection`);
            return;
        }

        console.log(`🏦 Looking for bank dropdown to select: "${bankName}"...`);

        try {
            await page.waitForLoadState('networkidle', { timeout: 10000 });
        } catch {
            console.log('⚠️ networkidle timeout after login option click — proceeding anyway');
        }

        let bankSelected = false;

        const dropdownSelectors = [
            'select',
            '[role="listbox"]',
            '[role="combobox"]',
            '[class*="dropdown"]',
            '[class*="select"]',
        ];

        for (const selector of dropdownSelectors) {
            try {
                await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
                const dropdown = page.locator(selector).first();
                const isVisible = await dropdown.isVisible().catch(() => false);
                if (!isVisible) continue;

                const tagName = await dropdown.evaluate(el => el.tagName.toLowerCase());

                if (tagName === 'select') {
                    await dropdown.selectOption({ label: bankName });
                    console.log(`✅ Bank selected from native dropdown: "${bankName}"`);
                    bankSelected = true;
                    break;
                } else {
                    await dropdown.click();
                    console.log(`🔽 Custom dropdown opened, looking for "${bankName}"...`);
                    const bankOption = page.locator(
                        `[role="option"]:has-text("${bankName}"), ` +
                        `li:has-text("${bankName}"), ` +
                        `div[class*="option"]:has-text("${bankName}")`
                    ).first();
                    await bankOption.waitFor({ state: 'visible', timeout: 5000 });
                    await bankOption.click();
                    console.log(`✅ Bank selected from custom dropdown: "${bankName}"`);
                    bankSelected = true;
                    break;
                }
            } catch {
                continue;
            }
        }

        if (!bankSelected) {
            console.log(`⚠️ Could not select bank "${bankName}" — skipping`);
            return;
        }

        try {
            await page.waitForLoadState('networkidle', { timeout: 10000 });
        } catch {
            console.log('⚠️ networkidle timeout after bank selection — proceeding anyway');
        }

        const continueSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            '[class*="continue"]',
            '[class*="proceed"]',
            '[class*="submit"]',
            'button:has-text("Continue")',
            'button:has-text("CONTINUE")',
            'input[value="Continue"]',
            'input[value="CONTINUE"]',
        ];

        let continueClicked = false;

        for (const selector of continueSelectors) {
            try {
                await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
                const btn = page.locator(selector).first();
                const isVisible = await btn.isVisible().catch(() => false);
                if (!isVisible) continue;
                const btnText = await btn.innerText()
                    .catch(() => btn.getAttribute('value'))
                    .catch(() => 'N/A') as string;
                await btn.click();
                console.log(`✅ Continue button clicked: "${btnText}"`);
                continueClicked = true;
                break;
            } catch {
                continue;
            }
        }

        if (!continueClicked) {
            console.log('⚠️ Continue button not found after bank selection — proceeding anyway');
        }

    } catch (err) {
        console.log('⚠️ handleBankSelection failed — proceeding anyway:', err.message);
    }

}

// ---------------------------------------------------------------------------
// waitForButtonAndClick
// Finds and clicks ONE button on the CURRENT page only.
// Uses a fast combined-selector pre-check to avoid iterating all selectors
// on pages that have no buttons at all (e.g. QR terminal pages).
// ---------------------------------------------------------------------------

async function waitForButtonAndClick(page: Page, buttonSelectors: string[]): Promise<{ clicked: boolean; buttonText: string }> {

    const combinedSelectors = buttonSelectors.join(', ');
    const anyButtonExists = await page.locator(combinedSelectors).first().isVisible().catch(() => false);

    if (!anyButtonExists) {
        console.log('ℹ️ No actionable button found on current page - skipping button search');
        return { clicked: false, buttonText: '' };
    }

    for (const buttonSelector of buttonSelectors) {

        try {
            await page.waitForSelector(buttonSelector, { state: 'visible', timeout: 3000 });

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

// ---------------------------------------------------------------------------
// scanForRedirectedPages
// Scans every page the browser lands on during the redirect chain in real-time.
// Returns { promise, cancel } — ALWAYS call cancel() if you don't await the
// promise, otherwise the framenavigated listener and idle timer will keep
// running and block the test for hopTimeoutMs × N navigations.
// ---------------------------------------------------------------------------

export function scanForRedirectedPages(
    page: Page,
    errorKeywords: string[],
    options: { maxHops?: number; hopTimeoutMs?: number; settleTimeoutMs?: number } = {}
): { promise: Promise<RedirectScanResult[]>; cancel: () => void } {

    const {
        maxHops = 10,
        hopTimeoutMs = 10000,
        settleTimeoutMs = 10000,
    } = options;

    const results: RedirectScanResult[] = [];
    let hopCount = 0;
    let done = false;
    let idleTimer: ReturnType<typeof setTimeout>;
    let resolvePromise!: (value: RedirectScanResult[]) => void;

    const promise = new Promise<RedirectScanResult[]>((resolve) => {
        resolvePromise = resolve;
    });

    const cleanup = () => {
        if (done) return;
        done = true;
        clearTimeout(idleTimer);
        page.off('framenavigated', wrappedNavigation);
    };

    const finalize = () => {
        cleanup();
        resolvePromise(results);
    };

    // cancel() immediately stops the scanner and resolves the promise with
    // whatever results were collected so far (usually [] on terminal pages).
    const cancel = () => {
        console.log('🛑 Redirect scan cancelled.');
        cleanup();
        resolvePromise([]);
    };

    const resetIdleTimer = () => {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            console.log('✅ No further redirects detected. Redirect chain complete.');
            finalize();
        }, hopTimeoutMs);
    };

    const onNavigation = async (frame: { url: () => string; parentFrame: () => unknown }) => {
        if (frame.parentFrame() !== null) return;
        if (done) return;

        const landedUrl = frame.url();
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

    const wrappedNavigation = (frame: { url: () => string; parentFrame: () => unknown }) => {
        resetIdleTimer();
        void onNavigation(frame);
    };

    page.on('framenavigated', wrappedNavigation);
    resetIdleTimer();

    return { promise, cancel };

}

// ---------------------------------------------------------------------------
// checkoutInteraction
// Main exported function. Covers all checkout flow variants:
//   1. Checkbox + button + optional modals + redirect chain
//   2. No checkbox + button + optional modals + redirect chain
//   3. No checkbox + no button = terminal page (QR etc.) — scan current page only
//
// scanForRedirectedPages is NEVER created at the top of this function.
// It is only started after all page interactions are complete, and only
// when a button was actually clicked. Terminal pages never start it at all.
// This prevents the framenavigated listener from running indefinitely on
// JS-heavy pages (e.g. ViettelPay countdown timer, GCash QR polling).
// ---------------------------------------------------------------------------

export async function checkoutInteraction(
    page: Page,
    errorKeywords: string[],
    bankSelectionConfig?: BankSelectionConfig,
    acknowledgementConfig?: AcknowledgementConfig
): Promise<{ initialErrors: string[]; postInteractionErrors: string[]; interacted: boolean }> {

    const initialErrors = await scanPageForErrors(page, errorKeywords);

    // ---- Checkbox detection ----

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

    // ---- No checkbox path ----

    if (!interacted) {
        console.log('❌ No checkbox found on checkout page - scanning current page and checking for direct proceed button...');

        // Scan immediately while page is live — before any button search
        const mainPageCheck = await scanBodyPageErrors(page, errorKeywords);

        // Dismiss acknowledgement modal if config provided (e.g. DANA "Penting" modal)
        if (acknowledgementConfig) {
            await handleAcknowledgementModal(page, acknowledgementConfig);
        }

        const { clicked: buttonClicked } = await waitForButtonAndClick(page, buttonSelectors);

        if (!buttonClicked) {
            // Terminal checkout page — QR code, payment instructions, etc.
            // No scanner needed — just return the scan result from above.
            console.log('ℹ️ No proceed/submit button found - terminal checkout page.');
            if (mainPageCheck.length > 0) {
                console.log('❌ Errors found on main checkout page:', mainPageCheck);
            } else {
                console.log('✅ No errors found on main checkout page.');
            }
            return { initialErrors, postInteractionErrors: mainPageCheck, interacted };
        }

        await handleCountdown(page);
        await handleConfirmationModal(page);

        if (bankSelectionConfig) {
            try {
                await page.waitForLoadState('networkidle', { timeout: 20000 });
                console.log(`🏦 Navigated to: ${page.url()}`);
            } catch {
                console.log('⚠️ networkidle timeout waiting for bank selection page — proceeding anyway');
            }
            await handleBankSelection(page, bankSelectionConfig);
        }

        // Start scanner ONLY NOW — after all interactions done
        console.log('⏳ Scanning redirect chain for errors...');
        const { promise } = scanForRedirectedPages(page, errorKeywords);
        const redirectResults = await promise;
        // cancel; // already resolved, no-op

        const postInteractionErrors = Array.from(
            new Set(redirectResults.flatMap(result => {
                if (result.errors.length > 0) console.log(`⚠️ Errors sourced from [${result.sourceUrl}]:`, result.errors);
                return result.errors;
            }))
        );

        if (postInteractionErrors.length === 0) console.log('✅ No errors found across entire redirect chain.');
        return { initialErrors, postInteractionErrors, interacted };
    }

    // ---- Checkbox path ----

    // networkidle after checkbox — ensures network requests triggered by the toggle
    // (e.g. enabling/loading the submit button) are fully settled first.
    try {
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        console.log('✅ Network idle after checkbox toggle. Button should be ready.');
    } catch {
        console.log('🚫 networkidle timeout after checkbox - proceeding anyway');
    }

    // Dismiss acknowledgement modal if config provided
    if (acknowledgementConfig) {
        await handleAcknowledgementModal(page, acknowledgementConfig);
    }

    const { clicked: buttonClicked } = await waitForButtonAndClick(page, buttonSelectors);

    if (!buttonClicked) {
        console.log('ℹ️ No proceed/submit button found - Scanning for errors....');
        const pageErrors = await scanBodyPageErrors(page, errorKeywords);
        if (pageErrors.length > 0) {
            console.log('❌ Errors found on checkout page:', pageErrors);
        } else {
            console.log('✅ No errors found on checkout page.');
        }
        return { initialErrors, postInteractionErrors: pageErrors, interacted };
    }

    await handleCountdown(page);
    await handleConfirmationModal(page);

    if (bankSelectionConfig) {
        try {
            await page.waitForLoadState('networkidle', { timeout: 20000 });
            console.log(`🏦 Navigated to: ${page.url()}`);
        } catch {
            console.log('⚠️ networkidle timeout waiting for bank selection page — proceeding anyway');
        }
        await handleBankSelection(page, bankSelectionConfig);
    }

    // Start scanner ONLY NOW — after all interactions done
    console.log('⏳ Scanning redirect chain for errors...');
    const { promise } = scanForRedirectedPages(page, errorKeywords);
    const redirectResults = await promise;
    // cancel; // already resolved, no-op

    const postInteractionErrors = Array.from(
        new Set(redirectResults.flatMap(result => {
            if (result.errors.length > 0) console.log(`⚠️ Errors sourced from [${result.sourceUrl}]:`, result.errors);
            return result.errors;
        }))
    );

    if (postInteractionErrors.length === 0) console.log('✅ No errors found across entire redirect chain.');
    return { initialErrors, postInteractionErrors, interacted };

}