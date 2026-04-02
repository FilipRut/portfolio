import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    console.log('Navigating to http://localhost:4321 ...');
    await page.goto('http://localhost:4321', { waitUntil: 'networkidle' });
    
    // Wait for animations to finish
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'prompter-state.png' });
    console.log('Screenshot saved to prompter-state.png');

    await browser.close();
})();
