const puppeteer = require("puppeteer");

(async () => {
  console.log("launching Chrome");
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();

  try {
    // login
    console.log("logging in");
    await page.goto("https://www.duolingo.com");
    await page.click("#sign-in-btn");
    await page.type(process.env.DL_LOGIN);
    await page.focus("#top_password");
    await page.type(process.env.DL_PW);
    await page.click("#login-button");
    await page.waitForNavigation();

    // visit store
    // TODO handle "$LANGUAGE is not yet supported on the web" page
    console.log("visiting store");
    await page.goto("https://www.duolingo.com/show_store", { waitUntil: "networkidle" });

    // find Freeze button
    console.log("finding Freeze button");
    const button = await page.$("ul button");
    if (!button) {
      throw new Error("Error: Freeze button not found");
    }

    // check if Freeze is available
    console.log("checking Freeze availability");
    const disabled = await button.evaluate((e) => { return e.disabled; });
    if (!disabled) {
      await button.click();
      console.log("Freeze purchased");
    } else {
      console.log("Freeze not available for purchase. exiting");
      return;
    }
  } catch (err) {
    const text = await page.plainText();
    console.log(text);
  } finally {
    browser.close();
  }
})().then(() => { process.exit(); })
  .catch((e) => {
    console.error(e);
  });
