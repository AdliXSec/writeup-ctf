import sys
import asyncio
from playwright.async_api import async_playwright

async def run(url):
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                # Treat http://127.0.0.1:8000 as secure origin so SameSite=None cookies work over HTTP
                '--unsafely-treat-insecure-origin-as-secure=http://127.0.0.1:8000',
                # Disable SameSite enforcement as fallback
                '--disable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure',
            ]
        )
        context = await browser.new_context()
        page = await context.new_page()

        try:
            # Step 1: Visit the internal login endpoint to receive the admin cookie
            #         via Set-Cookie header (SameSite=None)
            print("Logging in as admin...")
            await page.goto('http://127.0.0.1:8000/internal/bot-login', timeout=5000)
            
            # Verify cookie was set
            cookies = await context.cookies()
            print(f"Cookies after login: {[c['name'] + '=' + c['value'] for c in cookies]}")
            
            # Step 2: Visit the attacker-supplied URL
            print(f"Visiting attacker URL: {url}")
            await page.goto(url, timeout=10000)
            await page.wait_for_timeout(5000)  # Wait 5 seconds for exploit JS to run
            print("Done")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 bot.py <url>")
        sys.exit(1)
    
    url = sys.argv[1]
    asyncio.run(run(url))
