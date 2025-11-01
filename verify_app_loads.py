import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            # Navigate to the local development server.
            await page.goto("http://localhost:3000")

            # The React app is mounted on the element with id 'root'.
            # We will wait for this element to have at least one child to confirm React has rendered.
            root_container = page.locator('#root')
            await expect(root_container).to_have_count(1) # Ensure the root element itself exists
            await expect(root_container.locator('> *')).to_have_count(1, timeout=10000) # Wait for a child to render

            # Capture the screenshot for visual verification.
            await page.screenshot(path="/app/verification.png")

            print("Screenshot captured successfully.")

        except Exception as e:
            print(f"An error occurred: {e}")

        finally:
            await browser.close()

asyncio.run(main())
