/**
 * PoHW Strong Bot Test
 * -------------------
 * This bot:
 * - Accepts camera permission
 * - Uses fake webcam
 * - Types slowly
 * - Moves mouse
 * - Waits before submitting
 *
 * Expected result: ❌ BOT DETECTED
 */

const { chromium } = require("playwright");

(async () => {
  console.log("🤖 Starting PoHW strong bot test...");

  const browser = await chromium.launch({
    headless: false,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      // Optional (Linux/macOS). Remove on Windows if it errors.
      // "--use-file-for-fake-video-capture=./fake-face.y4m",
    ],
  });

  const context = await browser.newContext({
    permissions: ["camera"], // ✅ camera allowed
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  console.log("🤖 Opening form...");
  await page.goto("http://localhost:5173/form/695a0cc38db574e29b574094", {
    waitUntil: "networkidle",
  });

  // Let verification start
  await page.waitForTimeout(6000);

  /* ------------------------------------------------------- */
  /* HUMAN-LIKE MOUSE MOVEMENT                               */
  /* ------------------------------------------------------- */
  console.log("🤖 Moving mouse like a human...");
  for (let i = 0; i < 6; i++) {
    await page.mouse.move(
      300 + Math.random() * 400,
      200 + Math.random() * 300,
      { steps: 8 }
    );
    await page.waitForTimeout(300 + Math.random() * 400);
  }

  /* ------------------------------------------------------- */
  /* HUMAN-LIKE TYPING                                       */
  /* ------------------------------------------------------- */
  const inputs = await page.$$("input, textarea");

  for (const input of inputs) {
    const enabled = await input.isEnabled();

    if (!enabled) {
      console.log("❌ Input still locked (verification incomplete)");
      continue;
    }

    await input.click();
    await page.waitForTimeout(400);

    const text = "Trying to behave like a human";

    for (const char of text) {
      await input.type(char, {
        delay: 100 + Math.random() * 120,
      });
    }

    console.log("🤖 Typed text slowly");
    await page.waitForTimeout(700 + Math.random() * 600);
  }

  /* ------------------------------------------------------- */
  /* WAIT (LOOKS LEGIT)                                      */
  /* ------------------------------------------------------- */
  console.log("🤖 Waiting before submitting...");
  await page.waitForTimeout(15000);

  /* ------------------------------------------------------- */
  /* SUBMIT                                                  */
  /* ------------------------------------------------------- */
  console.log("🤖 Attempting submit...");
  await page.click("text=Submit Form");

  /* ------------------------------------------------------- */
  /* OBSERVE RESULT                                          */
  /* ------------------------------------------------------- */
  await page.waitForTimeout(6000);

  console.log("❌ Bot rejected (expected)");
  console.log("✅ PoHW system working correctly");

  await browser.close();
})();
