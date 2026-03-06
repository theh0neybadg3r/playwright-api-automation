import { Locator, Page } from "@playwright/test";
import { scanForRedirectedPages, scanPageForErrors } from "./result-checker";

async function clickAndWaitForRedirect(page: Page, locator: Locator, label: string): Promise<boolean> {

    const currentUrl = page.url();

    try {
        await Promise.all([
            page.waitForURL(url => url.href !== currentUrl, { waitUntil: 'load', timeout: 15000 }),
            locator.click()
        ]);

        console.log(`🐭 Clicked "${label}", redirected to:`, page.url());

    } catch {
        console.log(`❌ Clicked "${label}" but no redirect detected`);
    }

    return true;
}

export type PaymentMethodInterface = {
    label: string;
    aliases?: string[];
}

export async function paymentSelectionInteraction (
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

    try {
        await page.waitForLoadState('domcontentloaded', { timeout: 50000 });

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

        if (!interacted) {
            for (const term of searchTerms) {
                const locator = page.locator(`text="${term}`).first();
                const isVisible = await locator.isVisible().catch(() => false);

                if (isVisible) {
                    console.log(`Found "${targetMethod.label}" by text: "${term}"`);
                    interacted = await clickAndWaitForRedirect(page, locator, targetMethod.label);
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
                    interacted = await clickAndWaitForRedirect(page, imgLocator, targetMethod.label);
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
                    interacted = await clickAndWaitForRedirect(page, containerLocator, targetMethod.label);
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
                    interacted = await clickAndWaitForRedirect(page, ariaLocator, targetMethod.label);
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
                    interacted = await clickAndWaitForRedirect(page, buttonWithImage, targetMethod.label);
                    break;
                }
            }
        }
    } catch (error) {
        console.log(`paymentSelectionInteraction failed:`, error.message);
    }

    if (!interacted) {
        console.log(`❌ Could not find "${targetMethod.label}" payment method on page`);
        return { initialErrors, 
                postInteractionErrors: [`"${targetMethod.label}" payment method option not found on checkout page`], 
                interacted: false 
        };
    }

    const postInteractionErrors = await scanForRedirectedPages(page, errorKeywords);

    return { initialErrors, postInteractionErrors, interacted };
}