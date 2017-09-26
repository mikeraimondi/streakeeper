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
    await page.type(process.env.USERNAME);
    await page.focus("#top_password");
    await page.type(process.env.PASSWORD);
    await page.click("#login-button");
    const waitOptions = { waitUntil: "networkidle", networkIdleTimeout: 5000 };
    await page.waitForNavigation(waitOptions);

    // check for unsupported language
    const unsupportedMsg = await page.$(".unsupported-message");
    if (unsupportedMsg) {
      console.log("current language is not supported on web. proceeding by choosing alternative language");
      await page.click(".choose-language");
      await page.waitForNavigation(waitOptions);
    }

    // visit store
    console.log("visiting store");
    await page.goto("https://www.duolingo.com/show_store", waitOptions);

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
      await page.waitForNavigation(waitOptions);
      console.log("Freeze purchased");
    } else {
      console.log("Freeze not available for purchase");
      return;
    }
  } catch (e) {
    console.error(e);
    if (process.env.DEBUG) {
      const content = await page.content();
      const compressed = await new Promise((resolve, reject) => {
        const zlib = require("zlib");
        zlib.gzip(content, (err, result) => {
          if (err) {
            reject(err);
          }
          resolve(result);
        });
      });
      console.log("compressed HTML: " + compressed.toString("base64"));
      if (process.env.DEBUG === "*" || process.env.DEBUG === "img") {
        const AWS = require("aws-sdk");
        const s3 = new AWS.S3();
        const key = `screenshot-${(new Date()).getTime()}.png`;
        const screenshot = await page.screenshot();
        const params = {
          Bucket: "streakeeper-debug",
          Key: key,
          Body: screenshot
        };
        await s3.upload(params).promise();
        console.log(`uploaded screenshot: ${key}`);
      }
    }
    throw e;
  } finally {
    browser.close();
  }
};

app.get("/setup", (req, res) => {
  (async () => {
    await streakeep();
    // TODO twice daily
    const cron = encodeURIComponent("0 5 * * ?");
    const callback = encodeURIComponent(`http://${req.get("host")}/streakeep`);
    const url = `${process.env.TEMPORIZE_URL}/v1/events/${cron}/${callback}`;
    await request.post(url);
  })().then(() => {
    res.send(template("Streakeeper is now set up. You may close this browser window."));
  }).catch((err) => {
    console.error(err);
    res.send(template("Sorry, there was an error. Please double check your login credentials."));
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
