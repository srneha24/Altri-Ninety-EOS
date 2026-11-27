import { expect, test } from "@playwright/test";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function ensureNoActiveMeeting(request: import("@playwright/test").APIRequestContext) {
  const login = await request.post(`${API_URL}/auth/login`, {
    data: { email: "avery@acme.test" },
  });
  if (!login.ok()) return;
  const { token } = (await login.json()) as { token: { access_token: string } };
  const headers = { Authorization: `Bearer ${token.access_token}` };
  const active = await request.get(`${API_URL}/traction/teams/team_lead/meetings/active`, {
    headers,
  });
  if (active.ok()) {
    const body = (await active.json()) as { data: { id: string } };
    await request.post(`${API_URL}/traction/teams/team_lead/meetings/state`, {
      headers,
      data: { state: "end", meeting_id: body.data.id },
    });
  }
}

test("facilitator advances the agenda and second browser follows", async ({
  browser,
  request,
}) => {
  await ensureNoActiveMeeting(request);

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

    // Start a fresh meeting
    await facilitatorPage.getByRole("button", { name: /start level 10/i }).click();
    await expect(
      facilitatorPage.getByText(/meeting in progress/i),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      attendeePage.getByText(/meeting in progress/i),
    ).toBeVisible({ timeout: 10_000 });

    // Second attendee joins and appears on both attendee lists
    await attendeePage.getByRole("button", { name: /join meeting/i }).click();
    await expect(
      facilitatorPage.getByText(/blake brooks/i),
    ).toBeVisible({ timeout: 10_000 });

    // Facilitator advances the agenda to IDS
    await facilitatorPage
      .getByRole("button", { name: /advance agenda/i })
      .click();

    // Second browser follows to IDS
    await expect(
      attendeePage.getByRole("heading", { name: /ids|identify, discuss, solve/i }).first(),
    ).toBeVisible({ timeout: 10_000 });

    // Facilitator advances to Conclude, attendee submits rating, facilitator ends meeting
    await facilitatorPage
      .getByRole("button", { name: /advance agenda/i })
      .click();
    await expect(
      attendeePage.getByRole("heading", { name: /^conclude$/i }),
    ).toBeVisible({ timeout: 10_000 });

    await attendeePage.getByRole("button", { name: /submit rating/i }).click();
    await facilitatorPage.getByRole("button", { name: /end meeting/i }).click();

    await expect(
      facilitatorPage.getByText(/ended meeting/i),
    ).toBeVisible({ timeout: 10_000 });
  } finally {
    await facilitatorContext.close();
    await attendeeContext.close();
  }
});
