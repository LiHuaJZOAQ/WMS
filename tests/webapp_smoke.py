from playwright.sync_api import sync_playwright


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("http://localhost:5173/login", wait_until="networkidle")
        page.screenshot(path="dogfood-output/genwms-webapp-testing/login.png", full_page=True)

        page.get_by_role("textbox", name="用户名").fill("admin")
        page.get_by_role("textbox", name="密码").fill("admin123")
        page.get_by_role("button", name="登录").click()
        page.wait_for_timeout(1500)
        page.screenshot(path="dogfood-output/genwms-webapp-testing/login-after-click.png", full_page=True)

        browser.close()


if __name__ == "__main__":
    main()

