import sys
import asyncio
from playwright.async_api import async_playwright

async def run(url):
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        )
        context = await browser.new_context()
        
        # Set the admin cookie for the backend service.
        # Since this runs inside the docker container, it accesses itself via 127.0.0.1
        await context.add_cookies([{
            'name': 'session',
            'value': 'secret_admin_token_1337',
            'domain': '127.0.0.1',
            'path': '/'
        }])
        
        page = await context.new_page()
        try:
            print(f"Visiting {url}")
            await page.goto(url, timeout=5000)
            await page.wait_for_timeout(3000) # Wait 3 seconds for the payload to execute
            print("Done")
        except Exception as e:
            print(f"Error visiting {url}: {e}")
        finally:
            await browser.close()

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 bot.py <url>")
        sys.exit(1)
    
    url = sys.argv[1]
    asyncio.run(run(url))
