import { expect, test, type Page, type APIRequestContext } from "@playwright/test"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

async function login(page: Page, email: string) {
  await page.goto("/login")
  await page.getByLabel(/work email/i).fill(email)
  await page.getByRole("button", { name: /continue with email/i }).click()
  await page.waitForURL((url) => !url.pathname.includes("/login"))
}

test("members can create Issues from eligible Rocks and To-Dos", async ({
  page,
  request,
}) => {
  const createdIssueIds: string[] = []
  page.on("response", async (response) => {
    if (
      response.request().method() !== "POST" ||
      !response.url().includes("/traction/teams/team_lead/issues")
    ) {
      return
    }
    try {
      const body = (await response.json()) as { data?: { id?: string } }
      if (body.data?.id) createdIssueIds.push(body.data.id)
    } catch {
      // A failed request has no Issue ID to clean up.
    }
  })

  try {
    await login(page, "blake@acme.test")
    await page.goto("/")
    const initialToken = await page.evaluate(() =>
      window.sessionStorage.getItem("altri.auth.access")
    )
    if (initialToken) {
      await resolveExistingSourceIssues(request, initialToken)
      await page.reload()
    }

    const overdueTodo = page.locator("article").filter({
      hasText: "Publish hiring ad",
    })
    await expect(overdueTodo.getByRole("button", { name: "Make it an Issue" })).toBeVisible()
    await overdueTodo.getByRole("button", { name: "Make it an Issue" }).click()
    await expect(overdueTodo.getByText("Open Issue: Publish hiring ad")).toBeVisible()

    const offTrackRock = page.locator("details").filter({
      hasText: "Hire VP of Sales",
    })
    await offTrackRock.locator("summary").click()
    await offTrackRock.getByRole("button", { name: "Make it an Issue" }).click()
    await expect(offTrackRock.getByText("Open Issue: Hire VP of Sales")).toBeVisible()

    await page.reload()
    await expect(
      page.locator("article").filter({ hasText: "Publish hiring ad" }).getByText("Open Issue: Publish hiring ad")
    ).toBeVisible()
    const refreshedRockWithIssue = page.locator("details").filter({
      hasText: "Hire VP of Sales",
    })
    await refreshedRockWithIssue.locator("summary").click()
    await expect(
      refreshedRockWithIssue.getByText("Open Issue: Hire VP of Sales")
    ).toBeVisible()

    const token = await page.evaluate(() =>
      window.sessionStorage.getItem("altri.auth.access")
    )
    if (token) {
      await resolveCreatedIssues(request, token, createdIssueIds)
      createdIssueIds.length = 0
    }

    await page.reload()
    await page.route(`${API_URL}/traction/teams/team_lead/issues`, (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Source is no longer eligible." }),
      })
    )
    const refreshedRock = page.locator("details").filter({
      hasText: "Hire VP of Sales",
    })
    await refreshedRock.locator("summary").click()
    await refreshedRock.getByRole("button", { name: "Make it an Issue" }).click()
    await expect(
      refreshedRock.getByText("Request failed with status 400.")
    ).toBeVisible()
  } finally {
    const token = await page.evaluate(() =>
      window.sessionStorage.getItem("altri.auth.access")
    )
    if (token) {
      await resolveCreatedIssues(request, token, createdIssueIds)
    }
  }
})

async function resolveCreatedIssues(
  request: APIRequestContext,
  token: string,
  issueIds: string[]
) {
  await Promise.all(
    issueIds.map((issueId) =>
      request.patch(
        `${API_URL}/traction/teams/team_lead/issues/${encodeURIComponent(issueId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { resolution_note: "E2E cleanup" },
        }
      )
    )
  )
}

async function resolveExistingSourceIssues(
  request: APIRequestContext,
  token: string
) {
  const response = await request.get(
    `${API_URL}/traction/teams/team_lead/issues?status=all&order_by=-priority`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  expect(response.ok()).toBeTruthy()
  const body = (await response.json()) as {
    data: Array<{
      id: string
      solved_at: string | null
      source: { rock_id?: string; todo_id?: string } | null
    }>
  }
  const existingSourceIssueIds = body.data
    .filter(
      (issue) =>
        !issue.solved_at &&
        (issue.source?.rock_id === "r2" || issue.source?.todo_id === "t12")
    )
    .map((issue) => issue.id)
  await resolveCreatedIssues(request, token, existingSourceIssueIds)
}
