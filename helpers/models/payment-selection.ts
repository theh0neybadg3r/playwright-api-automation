import { Locator, Page } from "@playwright/test";
import { scanForRedirectedPages, scanPageForErrors } from "./result-checker";

async function clickAndWaitForRedirect(page: Page, locator: Locator, label: string): Promise<{ interacted: boolean; redirected: boolean }> {

    const currentUrl = page.url();

    try {
        await Promise.all([
            page.waitForURL(url => url.href !== currentUrl, { waitUntil: 'load', timeout: 15000 }),
            locator.click()
        ]);

        console.log(`🐭 Clicked "${label}", redirected to:`, page.url());
        return { interacted: true, redirected: true };

    } catch {
        console.log(`❌ Clicked "${label}" but no redirect detected`);
        return { interacted: true, redirected: false }; // ← was incorrectly returning true
    }
}

export type PaymentMethodInterface = {
    label: string;
    aliases?: string[];
}

export async function paymentSelectionInteraction(
    page: Page,
    errorKeywords: string[],
    targetMethod: PaymentMethodInterface
): Promise<{ initialErrors: string[]; postInteractionErrors: string[]; interacted: boolean }> {

    const initialErrors = await scanPageForErrors(page, errorKeywords);

    console.log(`🔎 Looking for "${targetMethod.label}" payment method option...`);

    const searchTerms = [
        targetMethod.label.toLowerCase(),
        ...(targetMethod.aliases?.map(a => a.toLowerCase()) ?? [])
    ];

    let interacted = false;
    let noRedirectAfterClick = false;

    try {
        await page.waitForLoadState('domcontentloaded', { timeout: 50000 });

        // Strategy 1: Find by visible text content
        if (!interacted) {
            for (const term of searchTerms) {
                const locator = page.locator(`text="${term}`).first();
                const isVisible = await locator.isVisible().catch(() => false);

                if (isVisible) {
                    console.log(`Found "${targetMethod.label}" by text: "${term}"`);
                    const result = await clickAndWaitForRedirect(page, locator, targetMethod.label);
                    interacted = result.interacted;
                    if (!result.redirected) noRedirectAfterClick = true;
                    break;
                }
            }
        }

        // Strategy 2: Find by image alt text
        if (!interacted) {
            for (const term of searchTerms) {
                const imgLocator = page.locator(`img[alt*="${term}" i]`).first();
                const isVisible = await imgLocator.isVisible().catch(() => false);

                if (isVisible) {
                    console.log(`✅ Found "${targetMethod.label}" by image alt`);
                    const result = await clickAndWaitForRedirect(page, imgLocator, targetMethod.label);
                    interacted = result.interacted;
                    if (!result.redirected) noRedirectAfterClick = true;
                    break;
                }
            }
        }

        // Strategy 3: Find by clickable container wrapping the logo/text
        if (!interacted) {
            for (const term of searchTerms) {
                const containerLocator = page
                    .locator(`a, button, [role="button"], [role="radio"], [class*="method"], [class*="option"], [class*="item"], [class*="block"], [class*="card"], li`)
                    .filter({ hasText: new RegExp(term, 'i') })
                    .first();

                const isVisible = await containerLocator.isVisible().catch(() => false);

                if (isVisible) {
                    console.log(`✅ Found "${targetMethod.label}" by container`);
                    const result = await clickAndWaitForRedirect(page, containerLocator, targetMethod.label);
                    interacted = result.interacted;
                    if (!result.redirected) noRedirectAfterClick = true;
                    break;
                }
            }
        }

        // Strategy 4: Find by aria-label
        if (!interacted) {
            for (const term of searchTerms) {
                const ariaLocator = page.locator(`[aria-label*="${term}" i]`).first();
                const isVisible = await ariaLocator.isVisible().catch(() => false);

                if (isVisible) {
                    console.log(`✅ Found "${targetMethod.label}" by aria-label`);
                    const result = await clickAndWaitForRedirect(page, ariaLocator, targetMethod.label);
                    interacted = result.interacted;
                    if (!result.redirected) noRedirectAfterClick = true;
                    break;
                }
            }
        }

        // Strategy 5: Find button containing an image whose src filename matches the target
        if (!interacted) {
            for (const term of searchTerms) {
                const buttonWithImage = page.locator('button, a, [role="button"]').filter({
                    has: page.locator(`img[src*="${term}" i]`)
                }).first();

                const isVisible = await buttonWithImage.isVisible().catch(() => false);

                if (isVisible) {
                    console.log(`✅ Found "${targetMethod.label}" by image src filename`);
                    const result = await clickAndWaitForRedirect(page, buttonWithImage, targetMethod.label);
                    interacted = result.interacted;
                    if (!result.redirected) noRedirectAfterClick = true;
                    break;
                }
            }
        }

    } catch (error) {
        console.log(`paymentSelectionInteraction failed:`, error.message);
    }

    if (!interacted) {
        console.log(`❌ Could not find "${targetMethod.label}" payment method on page`);
        return {
            initialErrors,
            postInteractionErrors: [`"${targetMethod.label}" payment method option not found on checkout page`],
            interacted: false
        };
    }

    
    if (noRedirectAfterClick) {
        console.log('🚫 No redirect after click - scanning current page for inline errors...');

        const inlineErrors = await page.evaluate((keywords) => {
            const textInBody = document.body?.innerText?.toLowerCase() ?? '';
            return keywords.filter(k => textInBody.includes(k.toLowerCase()));
        }, errorKeywords);

        if (inlineErrors.length > 0) {
            console.log('❌ Inline errors found after click:', inlineErrors.join(', '));
            return { initialErrors, postInteractionErrors: inlineErrors, interacted };
        }

        // No keywords matched but also no redirect — treat as a failure
        console.log('❌ No redirect and no specific error keywords matched - flagging as failed');
        return {
            initialErrors,
            postInteractionErrors: [`Clicked "${targetMethod.label}" but no redirect occurred - possible error on page`],
            interacted
        };
    }

    const postInteractionErrors = await scanForRedirectedPages(page, errorKeywords);

    return { initialErrors, postInteractionErrors, interacted };
}


//   // ← Add this temporarily to see what's actually on the page
        // await page.screenshot({ path: `debug-payment-method-page.png` });
        // console.log('📸 Debug screenshot saved');

        // // ← Add this after the screenshot line
        // const allImages = await page.evaluate(() => {
        //     return Array.from(document.querySelectorAll('img')).map(img => ({
        //         src: img.src,
        //         alt: img.alt,
        //         className: img.className,
        //     }));
        // });
        // console.log('🖼️ Images on page:', JSON.stringify(allImages, null, 2));

        // const allLinks = await page.evaluate(() => {
        //     return Array.from(document.querySelectorAll('a, button, [onclick], [class*="method"], [class*="option"], [class*="payment"]')).map(el => ({
        //         tag: el.tagName,
        //         className: el.className,
        //         href: el.getAttribute('href'),
        //         text: el.textContent?.trim().substring(0, 100),
        //     }));
        // });
        // console.log('🔗 Clickable elements:', JSON.stringify(allLinks, null, 2));

        // // ← Add this to see what text is actually visible on the page
        // const pageText = await page.evaluate(() => document.body?.innerText ?? '');
        // console.log('📄 Page text content:', pageText.substring(0, 500));