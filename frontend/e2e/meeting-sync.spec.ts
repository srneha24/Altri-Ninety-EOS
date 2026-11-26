import { expect, test } from "@playwright/test";

test("facilitator advances the agenda and second browser follows", async ({
  browser,
}) => {
  const facilitatorContext = await browser.newContext();
  const attendeeContext = await browser.newContext();

  const facilitatorPage = await facilitatorContext.newPage();
  const attendeePage = await attendeeContext.newPage();

  try {
    // Log in facilitator (avery@acme.test)
    await facilitatorPage.goto("/login");
    await facilitatorPage.getByLabel(/work email/i).fill("avery@acme.test");
    await facilitatorPage
      .getByRole("button", { name: /continue with email/i })
      .click();
    await facilitatorPage.waitForURL((url) => !url.pathname.includes("/login"));

    // Log in second attendee (blake@acme.test)
    await attendeePage.goto("/login");
    await attendeePage.getByLabel(/work email/i).fill("blake@acme.test");
    await attendeePage
      .getByRole("button", { name: /continue with email/i })
      .click();
    await attendeePage.waitForURL((url) => !url.pathname.includes("/login"));

    // Both navigate to the meeting page
    await facilitatorPage.goto("/meeting");
    await attendeePage.goto("/meeting");

    // Start meeting if not already active
    const startButton = facilitatorPage.getByRole("button", {
      name: /start level 10/i,
    });
    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click();
    }
    await expect(
      facilitatorPage.getByText(/meeting in progress/i),
    ).toBeVisible({ timeout: 10_000 });

    // Second attendee joins the active meeting if not already joined
    const joinButton = attendeePage.getByRole("button", {
      name: /join meeting/i,
    });
    if (await joinButton.isVisible().catch(() => false)) {
      await joinButton.click();
    }

    // Facilitator advances the agenda to IDS
    await facilitatorPage
      .getByRole("button", { name: /advance agenda/i })
      .click();

    // Second browser follows to the updated agenda section
    await expect(
      attendeePage.getByRole("heading", { name: /ids|identify, discuss, solve/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  } finally {
    await facilitatorContext.close();
    await attendeeContext.close();
  }
});
