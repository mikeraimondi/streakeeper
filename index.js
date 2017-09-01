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

    // check for unsupported language
    const unsupportedMsg = await page.$(".unsupported-message")
    if (unsupportedMsg) {
      console.log("current language is not supported on web. proceeding by choosing alternative language")
      await page.click(".choose-language")
      await page.waitForNavigation();
    }

    // visit store
    console.log("visiting store");
    await page.goto("https://www.duolingo.com/show_store", { waitUntil: "networkidle" });

    // find Freeze button
    console.log("finding Freeze button");
    const button = await page.$("ul li button");
    if (button) {
      const buttonText = await button.evaluate((e) => { return e.parentElement.querySelector("h4").textContent; });
      if (buttonText !== "Streak Freeze") {
        throw new Error("Error: Freeze button not found");
      }
    } else {
      throw new Error("page format not recognized")
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
    throw err;
  } finally {
    browser.close();
  }
})().then(() => { process.exit(); })
  .catch((e) => {
    console.error(e);
  });
