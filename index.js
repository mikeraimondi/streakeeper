const express = require("express");
const app = express();
const puppeteer = require("puppeteer");
const request = require("request");

const screenshot = async (page) => {
  const key = `screenshot-${(new Date()).getTime()}.png`;
  const screenshot = await page.screenshot();
  if (process.env.NODE_ENV == "development") {
    const fs = require("fs");
    fs.writeFileSync(key, screenshot);
  } else {
    const AWS = require("aws-sdk");
    const s3 = new AWS.S3();
    const params = {
      Bucket: "streakeeper-debug",
      Key: key,
      Body: screenshot
    };
    await s3.upload(params).promise();
  }
  console.log(`saved screenshot: ${key}`);
};

const streakeep = async (host, options = {}) => {
  console.log("launching Chrome");
  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 721 });

  try {
    // login
    console.log("logging in");
    await page.goto("https://www.duolingo.com");
    await page.click("#sign-in-btn");
    await page.type("#top_login", process.env.USERNAME);
    await page.type("#top_password", process.env.PASSWORD);
    await page.click("#login-button");
    const waitOptions = { waitUntil: "networkidle2" };
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
    const buttonHandle = await page.$("ul li button");
    if (buttonHandle) {
      const buttonText = await page.evaluate((e) => { return e.parentElement.querySelector("h4").textContent; }, buttonHandle);
      if (buttonText !== "Streak Freeze") {
        throw new Error("Error: Freeze button not found");
      }
    } else {
      throw new Error("page format not recognized");
    }

    // check if we should buy a Freeze
    const goalMetIndex = await page.evaluate(() => { return document.documentElement.innerHTML.indexOf("xp goal met"); });
    if (goalMetIndex < 0) {
      // check if Freeze is available
      if (process.env.DEBUG === "*" || process.env.DEBUG === "img:*") {
        await screenshot(page);
      }
      console.log("checking Freeze availability");
      const disabled = await page.evaluate((e) => { return e.disabled; }, buttonHandle);
      if (!disabled) {
        if (options.dryRun) {
          console.log("dry run: Freeze not purchased");
        } else {
          await buttonHandle.click();
          await page.waitForNavigation(waitOptions);
          console.log("Freeze purchased");
        }
      } else {
        console.log("Freeze not available for purchase");
      }
      if (process.env.DEBUG === "*" || process.env.DEBUG === "img:*") {
        await screenshot(page);
      }
    } else {
      console.log("Goal met. Freeze not required.");
    }
  } catch (e) {
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
      if (process.env.DEBUG === "*" || process.env.DEBUG === "img:*") {
        await screenshot(page);
      }
    }
    throw e;
  } finally {
    console.log("scheduling next run");
    let nextRunTime = new Date();
    nextRunTime.setDate(nextRunTime.getDate() + 1);
    nextRunTime.setHours(23, 45);
    const runAt = nextRunTime.toISOString().replace(/-|:/g, "").split(".")[0] + "Z";
    const callback = encodeURIComponent(`http://${host}/streakeep`);
    const url = `${process.env.TEMPORIZE_URL}/v1/events/${runAt}/${callback}`;
    await request.post(url);
    await browser.close();
  }
};

app.get("/setup", (req, res) => {
  (async () => {
    await streakeep(req.get("host"), { dryRun: true });
  })().then(() => {
    res.redirect(`${process.env.DOCS_URL}/success`);
  }).catch((err) => {
    console.error(err);
    res.redirect(`${process.env.DOCS_URL}/error`);
  });
});

app.post("/streakeep", (req, res) => {
  streakeep(req.get("host")).then(() => {
    res.status(200).end();
  }).catch((err) => {
    console.error(err);
    res.status(503).end();
  });
});

app.listen(process.env.PORT, function () {
  console.log(`Listening on port ${process.env.PORT}`);
});
