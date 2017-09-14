const express = require("express");
const app = express();
const puppeteer = require("puppeteer");
const request = require("request");

const template = (msg) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Streakeeper</title>
  </head>
  <body>
    ${msg}
  </body>
</html>`;
};

const streakeep = async () => {
  console.log("launching Chrome");
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 721 });

  try {
    // login
    console.log("logging in");
    await page.goto("https://www.duolingo.com");
    await page.click("#sign-in-btn");
    await page.type(process.env.DL_LOGIN);
    await page.focus("#top_password");
    await page.type(process.env.DL_PW);
    await page.click("#login-button");
    await page.waitForNavigation({ timeout: 10000 });

    // check for unsupported language
    const unsupportedMsg = await page.$(".unsupported-message");
    if (unsupportedMsg) {
      console.log("current language is not supported on web. proceeding by choosing alternative language");
      await page.click(".choose-language");
      await page.waitForNavigation({ timeout: 10000 });
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
      throw new Error("page format not recognized");
    }

    // check if Freeze is available
    console.log("checking Freeze availability");
    const disabled = await button.evaluate((e) => { return e.disabled; });
    if (!disabled) {
      await button.click();
      await page.waitForNavigation({ waitUntil: "networkidle" });
      console.log("Freeze purchased");
    } else {
      console.log("Freeze not available for purchase");
      return;
    }
  } catch (e) {
    console.error(e);
    const html = await page.content();
    console.log("raw HTML:\n" + html);
    throw e;
  } finally {
    browser.close();
  }
};

app.get("/setup", (req, res) => {
  (async () => {
    const cron = encodeURIComponent("0 5 * * ?");
    const callback = encodeURIComponent(`http://${req.get("host")}/streakeep`);
    // TODO twice daily
    const url = `${process.env.TEMPORIZE_URL}/v1/events/${cron}/${callback}`;
    await request.post(url);
  })().then(() => {
    streakeep().then(() => {
      res.send(template("All systems go!"));
    }).catch((err) => {
      console.error(err);
      res.send(template("Sorry, there was an error. Please double check your login credentials."));
    });
  }).catch((err) => {
    console.error(err);
    res.send(template("Sorry, there was an error with the scheduler service. Setup aborted."));
  });
});

app.post("/streakeep", (req, res) => {
  streakeep().then(() => {
    res.status(200).end();
  }).catch((err) => {
    console.error(err);
    res.status(503).end();
  });
});

app.listen(process.env.PORT, function () {
  console.log(`Listening on port ${process.env.PORT}`);
});
