import * as launchChrome from "@serverless-chrome/lambda";
import * as CDP from "chrome-remote-interface";
import * as promisify from "promisify-node";

import * as fs from "fs";
const writeFileAsync = promisify(fs.writeFile);

async function takeScreenshot(page, file) {
  const screenshot = await page.captureScreenshot();
  const buffer = new Buffer(screenshot.data, "base64");
  await writeFileAsync(file, buffer, "base64");
}

async function doIt() {
  const chrome = await launchChrome({
    flags: [
      "--window-size=1280x1696",
      "--hide-scrollbars",
      "--ignore-certificate-errors",
      "--incognito",
      "--headless",
      "--disable-gpu",
    ],
  });
  const client = await CDP();
  try {
    const { DOM, Network, Page } = client;
    await Promise.all[Page.enable(), DOM.enable(), Network.enable()];

    await Page.navigate({ url: "https://duolingo.com" });
    await Page.loadEventFired();
    // await new Promise((resolve) => setTimeout(resolve, 2000)); // wait for 2s for JS to finish
    await takeScreenshot(Page, "test.png");
  } finally {
    if (client) {
      await client.close();
    }
    await chrome.kill();
  }
}

export const hello = (event, context, callback) => {
  // const response = {
  //   statusCode: 200,
  //   body: JSON.stringify({
  //     message: "Go Serverless v1.0! Your function executed successfully!",
  //     input: event,
  //   }),
  // };
  doIt().then(() => {
    callback(null);
  }).catch((err) => {
    callback(err);
  });
};
