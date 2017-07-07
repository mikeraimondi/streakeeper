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

const run = async () => {
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
  const { DOM, Page, Network } = client;
  await Page.enable();
  await DOM.enable();
  await Network.enable();

  await Page.navigate({ url: "https://duolingo.com" });
  Page.loadEventFired(async () => {
    try {
      const { root: { nodeId: documentNodeId } } = await DOM.getDocument();
      const html = await DOM.getOuterHTML({ nodeId: documentNodeId });
      console.log(html);
    } finally {
      await client.close();
      await chrome.kill();
    }
  });
};

export const handler = (event, context, callback) => {
  run().then(() => {
    callback(null);
  }).catch((err) => {
    callback(err);
  });
};
