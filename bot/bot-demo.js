const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    headless: false, // show browser for demo
  });

  const context = await browser.newContext({
    permissions: [], // ❌ deny camera
  });

  const page = await context.newPage();

  console.log("🤖 Bot opening form...");
  await page.goto("http://localhost:5173/form/695a0cc38db574e29b574094");

  // Fill inputs instantly (non-human)
  await page.waitForSelector("input, textarea");

  const inputs = await page.$$("input, textarea");

  for (const input of inputs) {
    await input.fill("BOT_INPUT");
  }

  console.log("🤖 Inputs filled instantly");

  // Click submit immediately (before verification)
  await page.click("text=Submit Form");

  console.log("🤖 Submitted without waiting");

  // Observe rejection popup
  await page.waitForTimeout(5000);

  console.log("❌ Bot failed verification (expected)");

  // Keep browser open for judges
})();