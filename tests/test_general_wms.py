from playwright.sync_api import sync_playwright
import time
import os

FRONTEND_URL = os.getenv("WMS_FRONTEND_URL", "http://localhost:5173")

def safe_screenshot(page, path, full_page=False):
    try:
        page.screenshot(path=path, full_page=full_page, timeout=5000)
    except Exception as e:
        print(f"Screenshot failed: {e}")

def click_menu_item(page, submenu_text, item_text):
    submenu_title = page.locator(".el-sub-menu__title", has_text=submenu_text).first
    submenu_title.click(no_wait_after=True)
    item = page.locator(".el-menu-item", has_text=item_text).first
    try:
        item.wait_for(state="visible", timeout=3000)
    except Exception:
        submenu_title.click(no_wait_after=True)
        item.wait_for(state="visible", timeout=5000)
    item.click(no_wait_after=True)

def goto_and_wait(page, submenu_text, item_text, url_glob, ready_text, screenshot_path):
    print(f"Navigating: {submenu_text} -> {item_text}")
    click_menu_item(page, submenu_text, item_text)
    page.wait_for_url(url_glob, timeout=15000, wait_until="commit")
    print(f"Current URL: {page.url}")
    page.wait_for_timeout(300)
    page.locator(f'text="{ready_text}"').first.wait_for(state="visible", timeout=15000)
    safe_screenshot(page, screenshot_path)

def run_test():
    print("Starting General WMS Playwright Test...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        page.set_default_timeout(15000)

        # Catch console logs for debugging
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"Browser PageError: {exc}"))
        
        try:
            # 1. Go to the login page
            login_url = f"{FRONTEND_URL}/login"
            print(f"Navigating to {login_url} ...")
            page.goto(login_url, wait_until='domcontentloaded')
            safe_screenshot(page, '/tmp/login_page.png')
            print("Login page loaded. Screenshot saved to /tmp/login_page.png")
            
            # 2. Perform Login
            print("Filling in login credentials...")
            # We assume the standard element-plus input fields
            page.fill('input[type="text"]', 'admin')
            page.fill('input[type="password"]', 'admin123')
            
            print("Clicking login button...")
            page.click('button:has-text("登录")')
            
            # 3. Wait for navigation to dashboard
            print("Waiting for dashboard to load...")
            page.wait_for_url('**/home/**', timeout=15000, wait_until="commit")
            page.wait_for_load_state('domcontentloaded')
            
            # 4. Take screenshot of the dashboard
            safe_screenshot(page, '/tmp/dashboard.png', full_page=True)
            print("Dashboard loaded successfully! Screenshot saved to /tmp/dashboard.png")
            
            # 5. Check if dashboard APIs actually loaded data
            print("Checking dashboard elements...")
            cards = page.locator('.card').count()
            print(f"Found {cards} cards on the dashboard.")
            
            # 6. Try navigating to another generic page (e.g. Item Manage)
            print("Navigating to Item Management...")
            click_menu_item(page, "基础数据", "商品档案 (SKU)")
            page.wait_for_url('**/basicData/finishedProduct', timeout=15000, wait_until="commit")
            print(f"Current URL after menu click: {page.url}")
            page.wait_for_selector('text="新增商品"', timeout=15000)
            safe_screenshot(page, '/tmp/item_manage.png')
            print("Item Management page loaded. Screenshot saved to /tmp/item_manage.png")

            goto_and_wait(
                page,
                submenu_text="入库管理",
                item_text="入库单管理",
                url_glob="**/inStorage/rawMaterial",
                ready_text="入库单号",
                screenshot_path="/tmp/inbound_orders.png",
            )

            goto_and_wait(
                page,
                submenu_text="出库管理",
                item_text="出库单管理",
                url_glob="**/outStorage/rawMaterial",
                ready_text="出库单号",
                screenshot_path="/tmp/outbound_orders.png",
            )

            goto_and_wait(
                page,
                submenu_text="库存管理",
                item_text="全局库存查询",
                url_glob="**/inventory/rawMaterial",
                ready_text="当前库存",
                screenshot_path="/tmp/inventory.png",
            )

            goto_and_wait(
                page,
                submenu_text="仓位管理",
                item_text="仓库库位",
                url_glob="**/location/rawMaterial",
                ready_text="库位编号",
                screenshot_path="/tmp/locations.png",
            )

            goto_and_wait(
                page,
                submenu_text="盘点管理",
                item_text="库存盘点作业",
                url_glob="**/checkStorage/rawMaterial",
                ready_text="盘点单号",
                screenshot_path="/tmp/stocktaking.png",
            )

            goto_and_wait(
                page,
                submenu_text="出库管理",
                item_text="智能波次拣货 (推荐)",
                url_glob="**/outStorage/wavePicking",
                ready_text="波次编号",
                screenshot_path="/tmp/wave_picking.png",
            )
            
            print("Test completed successfully!")
            
        except Exception as e:
            print(f"Test failed with error: {e}")
            safe_screenshot(page, '/tmp/error_state.png', full_page=True)
            print("Saved error state screenshot to /tmp/error_state.png")
            
        finally:
            browser.close()

if __name__ == "__main__":
    run_test()
