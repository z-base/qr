import { expect, test } from '@playwright/test'

test.describe('qr e2e harness', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/e2e/index.html')
    await expect(
      page.getByRole('heading', { name: 'QR E2E Harness' })
    ).toBeVisible()
    await page.waitForFunction(() => typeof globalThis.qr === 'function')
  })

  test('exports the qr API in browser context', async ({ page }) => {
    const apiShape = await page.evaluate(() => {
      return {
        display: typeof globalThis.qr?.display,
        print: typeof globalThis.qr?.print,
        scan: typeof globalThis.qr?.scan,
      }
    })

    expect(apiShape).toEqual({
      display: 'function',
      print: 'function',
      scan: 'function',
    })
  })

  test('display renders a dialog and closes on pointer interaction', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Display' }).click()
    const qrImage = page.locator('dialog img[alt="QR code"]')
    await expect(qrImage).toBeVisible()

    await page.waitForTimeout(650)
    await page.mouse.click(20, 20)
    await expect(page.locator('dialog')).toHaveCount(0)
  })

  test('print builds printable content and requests object URL', async ({
    page,
  }) => {
    await page.evaluate(() => {
      const calls = []
      const original = URL.createObjectURL.bind(URL)
      globalThis.__printCalls = calls
      URL.createObjectURL = (blob) => {
        calls.push(blob)
        return original(blob)
      }
    })

    await page.getByRole('button', { name: 'Print' }).click()

    const stats = await page.evaluate(async () => {
      const blob = globalThis.__printCalls[0]
      const html = blob ? await blob.text() : ''
      return {
        count: globalThis.__printCalls.length,
        hasGrid: html.includes('class="grid"'),
        hasCard: html.includes('class="card"'),
      }
    })

    expect(stats.count).toBeGreaterThan(0)
    expect(stats.hasGrid).toBe(true)
    expect(stats.hasCard).toBe(true)
  })

  test('scan harness supports deterministic mocked result in every project', async ({
    page,
  }) => {
    await page.evaluate(() => {
      globalThis.qr.scan = async () => 'mocked-scan-result'
    })

    await page.getByRole('button', { name: 'Scan' }).click()
    await expect(page.locator('#qr-scan-output')).toHaveText(
      'mocked-scan-result'
    )
  })
})
