/* eslint-disable playwright/no-force-option */
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
export interface DepositFormConfig {
    accountName: string;
    accountNumber: string;
    bankName: string;
    birthdate?: string;
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

async function handleDepositForm(
    page: Page,
    config: DepositFormConfig,
    errorKeywords: string[]
): Promise<{ filled: boolean; postFormErrors: string[] }> {

    try {

        const fillFormExists = await page.locator('form').first().isVisible({ timeout: 3000 }).catch(() => false);

        if (!fillFormExists) {
            console.log('ℹ️ No deposit form detected on page - skipping form fill.')
            return { filled: false, postFormErrors: [] };
        }

        console.log('📃 Deposit form detected. Filling form fields....');

        // ── Account Number ────────────────────────────────────────────────────

        const accountNumberSelectors = [
            'input[name*="account_number" i]',
            'input[placeholder*="account number" i]',
            'input[id*="account_number" i]',
            'input[id*="accountNumber" i]',
            'input[name*="number" i]'
        ];

        let accountNumberToBeFilled = false;
        for (const selector of accountNumberSelectors) {
            const field = page.locator(selector).first();
            const isVisible = await field.isVisible({ timeout: 2000 }).catch(() => false);
            if (isVisible) {
                await field.fill(config.accountNumber);
                console.log(`✅ Account Number filled via: ${selector}`);
                accountNumberToBeFilled = true;
                break;
            }
        }

        if (!accountNumberToBeFilled) console.log('⚠️ Account Number field not found - proceeding anyway....');

        // ── Account Name ──────────────────────────────────────────────────────

        const accountNameSelectors = [
            'input[name*="account_name" i]',
            'input[placeholder*="account name" i]',
            'input[id*="account_name" i]',
            'input[id*="accountName" i]',
            'input[name*="name" i]'
        ];

        let accountNameToBeFilled = false;
        for (const selector of accountNameSelectors) {
            const field = page.locator(selector).first();
            const isVisible = await field.isVisible({ timeout: 2000 }).catch(() => false);
            if (isVisible) {
                await field.fill(config.accountName);
                console.log(`✅ Account Name filled via: ${selector}`);
                accountNameToBeFilled = true;
                break;
            }
        }

        if (!accountNameToBeFilled) console.log('⚠️ Account Name field not found - proceeding anyway....');

        // ── Bank dropdown ─────────────────────────────────────────────────────
        // Try custom-styled dropdowns FIRST before native <select>.
        // selectOption() only sets the hidden native value — custom components ignore it.

        const customTriggerSelectors = [
            '[class*="dropdown-toggle"]',
            '[class*="select-trigger"]',
            '[class*="select__control"]',       // react-select
            '[class*="multiselect__select"]',   // vue-multiselect
            '[aria-haspopup="listbox"]',
            '[role="combobox"]',
        ];

        let bankIsSelected = false;

        for (const triggerSel of customTriggerSelectors) {
            const trigger = page.locator(triggerSel).first();
            const isVisible = await trigger.isVisible({ timeout: 1500 }).catch(() => false);
            if (!isVisible) continue;

            await trigger.click();
            console.log(`🔽 Custom dropdown opened via: ${triggerSel}`);

            // Wait for the dropdown list to actually appear in the DOM before looking for options
            try {
                await page.waitForFunction(() => {
                    const lists = document.querySelectorAll('[role="listbox"], [role="option"], ul[class*="option"], ul[class*="dropdown"]');
                    return Array.from(lists).some(el => {
                        const rect = el.getBoundingClientRect();
                        return rect.width > 0 && rect.height > 0;
                    });
                }, { timeout: 3000 });
                console.log('✅ Dropdown list is visible in DOM');
            } catch {
                console.log(`⚠️ Dropdown list did not appear after clicking ${triggerSel} — trying next trigger`);
                continue;
            }

            // Try each option selector, check every candidate's text for exact match
            const optionSelectors = [
                `[role="option"]:has-text("${config.bankName}")`,
                `[role="listbox"] li:has-text("${config.bankName}")`,
                `ul[class*="option"] li:has-text("${config.bankName}")`,
                `ul[class*="dropdown"] li:has-text("${config.bankName}")`,
                `[class*="option"]:has-text("${config.bankName}")`,
                `[class*="item"]:has-text("${config.bankName}")`,
            ];

            let optionClicked = false;
            for (const optSel of optionSelectors) {
                try {
                    const options = page.locator(optSel);
                    const count = await options.count();
                    if (count === 0) continue;

                    for (let i = 0; i < count; i++) {
                        const opt = options.nth(i);
                        const isVis = await opt.isVisible({ timeout: 1000 }).catch(() => false);
                        if (!isVis) continue;

                        const text = (await opt.innerText().catch(() => '')).trim();
                        console.log(`👀 Found option candidate: "${text}" via ${optSel}`);

                        if (text === config.bankName || text.includes(config.bankName)) {
                            await opt.scrollIntoViewIfNeeded().catch(() => {});
                            await opt.click({ force: true });
                            console.log(`✅ Bank option clicked: "${text}"`);
                            await page.waitForTimeout(600);
                            optionClicked = true;
                            break;
                        }
                    }

                    if (optionClicked) break;
                } catch {
                    continue;
                }
            }

            if (!optionClicked) {
                console.log(`⚠️ Could not find option "${config.bankName}" in open dropdown — trying next trigger`);
                await page.keyboard.press('Escape');
                await page.waitForTimeout(300);
                continue;
            }

            // Verify selection was committed by checking container textContent
            const containerText = await trigger.evaluate(el => el.textContent ?? '').catch(() => '');
            console.log(`🔍 Dropdown container text after selection: "${containerText.trim()}"`);

            if (containerText.includes(config.bankName)) {
                console.log(`✅ Bank selection confirmed in dropdown: "${config.bankName}"`);
            } else {
                console.log(`⚠️ Dropdown container does not show "${config.bankName}" — checking if placeholder is gone`);
            }

            // Final guard: wait for placeholder to disappear before allowing submit
            try {
                await page.waitForFunction((bankName: string) => {
                    const placeholders = document.querySelectorAll(
                        '[class*="placeholder"], [class*="select-placeholder"]'
                    );
                    const placeholderGone = Array.from(placeholders).every(el =>
                        !(el.textContent ?? '').toLowerCase().includes('select a bank')
                    );
                    const triggers = document.querySelectorAll('[aria-haspopup="listbox"], [role="combobox"]');
                    const bankVisible = Array.from(triggers).some(el =>
                        (el.textContent ?? '').includes(bankName)
                    );
                    return placeholderGone || bankVisible;
                }, config.bankName, { timeout: 3000 });
                console.log('✅ Dropdown state committed — proceeding');
            } catch {
                console.log('⚠️ Could not confirm dropdown state commit — proceeding anyway');
            }

            bankIsSelected = true;
            break;
        }

        // Fallback: native <select>
        if (!bankIsSelected) {
            const nativeDropdownSelectors = [
                'select[name*="bank" i]',
                'select[id*="bank" i]',
                'select[name*="Bank" i]',
                'select',
            ];

            for (const selector of nativeDropdownSelectors) {
                const dropdown = page.locator(selector).first();
                const isVisible = await dropdown.isVisible({ timeout: 2000 }).catch(() => false);
                if (!isVisible) continue;

                try {
                    await dropdown.selectOption({ label: config.bankName });
                    console.log(`✅ Bank selected by label on native dropdown: "${config.bankName}"`);
                    bankIsSelected = true;
                    break;
                } catch {
                    try {
                        await dropdown.selectOption({ value: config.bankName });
                        console.log(`✅ Bank selected by value on native dropdown: "${config.bankName}"`);
                        bankIsSelected = true;
                        break;
                    } catch {
                        console.log(`⚠️ Could not select bank "${config.bankName}" from ${selector}`);
                    }
                }
            }
        }

        if (!bankIsSelected) console.log('⚠️ Bank dropdown not found or bank not selectable - proceeding anyway....');

        // ── Birthdate (optional) ──────────────────────────────────────────────
        // Only attempted if config.birthdate is provided.
        // Accepts YYYY-MM-DD (native date input format) or MM/DD/YYYY.
        // The native date input requires the value in YYYY-MM-DD regardless
        // of how the placeholder displays it (mm/dd/yyyy).

        if (config.birthdate) {

            // Normalise to YYYY-MM-DD if caller passed MM/DD/YYYY
            let normalizedDate = config.birthdate;
            const mdyMatch = config.birthdate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (mdyMatch) {
                normalizedDate = `${mdyMatch[3]}-${mdyMatch[1]}-${mdyMatch[2]}`;
            }

            const birthdateSelectors = [
                'input[type="date"]',
                'input[name*="birth" i]',
                'input[id*="birth" i]',
                'input[placeholder*="birth" i]',
                'input[placeholder*="mm/dd/yyyy" i]',
            ];

            let birthdateFilled = false;
            for (const selector of birthdateSelectors) {
                const field = page.locator(selector).first();
                const isVisible = await field.isVisible({ timeout: 2000 }).catch(() => false);
                if (!isVisible) continue;

                // input[type="date"] requires fill() with YYYY-MM-DD
                await field.fill(normalizedDate);
                // Trigger change event so frameworks (React, Vue) pick up the new value
                await field.dispatchEvent('change');
                await field.dispatchEvent('input');

                const filledValue = await field.inputValue().catch(() => '');
                console.log(`✅ Birthdate filled via: ${selector} | Value set: "${filledValue}"`);
                birthdateFilled = true;
                break;
            }

            if (!birthdateFilled) console.log('⚠️ Birthdate field not found - proceeding anyway....');

        } else {
            console.log('ℹ️ No birthdate provided in config - skipping birthdate field.');
        }

        // ── Submit ────────────────────────────────────────────────────────────

        const submitSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:has-text("Submit")',
            'button:has-text("SUBMIT")',
            'input[value="Submit"]',
            '[class*="submit"]',
        ];

        let submitted = false;
        for (const selector of submitSelectors) {
            const btn = page.locator(selector).first();
            const isVisible = await btn.isVisible({ timeout: 2000 }).catch(() => false);
            if (!isVisible) continue;

            const btnText = await btn.innerText()
                .catch(() => btn.getAttribute('value'))
                .catch(() => 'N/A') as string;

            await btn.click();
            console.log(`✅ Form submitted via: "${btnText}"`);
            submitted = true;
            break;
        }

        if (!submitted) {
            console.log('⚠️ Submit button not found — form may not have been submitted');
            return { filled: true, postFormErrors: ['Submit button not found after form fill'] };
        }

        // ── Scan current page for errors before checking redirects ────────────
        // Errors like "No active payment gateway" appear inline without any
        // navigation, so framenavigated never fires and the redirect scanner
        // misses them. Scan the live page here first.

        await page.waitForTimeout(3000);

        const samePageErrors = await scanBodyPageErrors(page, errorKeywords);
        if (samePageErrors.length > 0) {
            console.log(`❌ Error(s) found on current page after form submit:`, samePageErrors);
            return { filled: true, postFormErrors: samePageErrors };
        }

        // ── Then scan the redirect chain ──────────────────────────────────────

        console.log('⏱️ Scanning redirect chain after form submission....');
        const { promise } = scanForRedirectedPages(page, errorKeywords);
        const redirectResults = await promise;

        const postFormErrors = Array.from(
            new Set(redirectResults.flatMap(result => {
                if (result.errors.length > 0) console.log(`⚠️ Errors sourced from [${result.sourceUrl}]:`, result.errors);
                return result.errors;
            }))
        );

        if (postFormErrors.length === 0) console.log('✅ No errors found after form submission redirect chain.');

        return { filled: true, postFormErrors };

    } catch (error) {
        console.log('⚠️ handleDepositForm failed - proceeding anyway:', error.message);
        return { filled: false, postFormErrors: [] };
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
    acknowledgementConfig?: AcknowledgementConfig,
    depositFormConfig?: DepositFormConfig
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

        if (depositFormConfig) {
            const { postFormErrors } = await handleDepositForm(page, depositFormConfig, errorKeywords);
            if (postFormErrors.length > 0) {
                return { initialErrors, postInteractionErrors: postFormErrors, interacted };
            }
            return { initialErrors, postInteractionErrors: [], interacted };
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

    if (depositFormConfig) {
        const { postFormErrors } = await handleDepositForm(page, depositFormConfig, errorKeywords);
        if (postFormErrors.length > 0) {
            return { initialErrors, postInteractionErrors: postFormErrors, interacted };
        }
        return { initialErrors, postInteractionErrors: [], interacted };
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