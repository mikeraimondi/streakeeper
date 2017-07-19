import "source-map-support/register";

import launchChrome = require("@serverless-chrome/lambda");
import { Callback, Context } from "aws-lambda";
import CDP = require("chrome-remote-interface");
import fs = require("fs");

const takeScreenshot = async (page: any): Promise<string> => {
  const screenshot = await page.captureScreenshot();
  const buffer = new Buffer(screenshot.data, "base64");
  const fileName = `/tmp/streakeeper.png`;
  fs.writeFileSync(fileName, buffer, { encoding: "base64" });
  return fileName;
};

const center = (quad: any): any => {
  return [
    Math.floor(((quad[2] - quad[0]) / 2) + quad[0]),
    Math.floor(((quad[5] - quad[3]) / 2) + quad[3]),
  ];
};

const clickCenter = async (DOM: any, Input: any, selector: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const { root: { nodeId: docNodeId } } = await DOM.getDocument();
  const { nodeId: selNodeId } = await DOM.querySelector({
    nodeId: docNodeId,
    selector,
  });
  const { model: { content: quad } } = await DOM.getBoxModel({ nodeId: selNodeId });
  const elementCenter = center(quad);
  await Input.dispatchMouseEvent({
    button: "left",
    clickCount: 1,
    type: "mousePressed",
    x: elementCenter[0],
    y: elementCenter[1],
  });
  await Input.dispatchMouseEvent({
    button: "left",
    clickCount: 1,
    type: "mouseReleased",
    x: elementCenter[0],
    y: elementCenter[1],
  });
};

const typeIn = async (input: any, val: string): Promise<void> => {
  for (const letter of val) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    await input.dispatchKeyEvent({
      text: letter,
      type: "keyDown",
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    await input.dispatchKeyEvent({
      type: "keyUp",
    });
  }
};

const run = async () => {
  const debugError = "debugError";
  const chrome = await launchChrome({
    flags: [
      "--window-size=1280x1696",
      "--ignore-certificate-errors",
      "--headless",
      "--disable-gpu",
    ],
  });
  const browser = await CDP({ target: "ws://localhost:9222/devtools/browser" });
  const { Target } = browser;
  const { browserContextId } = await Target.createBrowserContext();
  const { targetId } = await Target.createTarget({
    browserContextId,
    url: "about:blank",
  });
  const client = await CDP({ target: targetId });
  const { DOM, Page, Network, Input } = client;
  await Page.enable();
  await DOM.enable();
  await Network.enable();

  await Page.navigate({ url: "https://duolingo.com" });
  await Page.loadEventFired();
  try {
    await clickCenter(DOM, Input, "#sign-in-btn");
    await typeIn(Input, process.env.login);
    await clickCenter(DOM, Input, "#top_password");
    await typeIn(Input, process.env.password);
    await clickCenter(DOM, Input, "#login-button");
    await Page.loadEventFired(async () => {
      throw new Error(debugError);
    });
  } catch (err) {
    const screenshot = await takeScreenshot(Page);
    console.log("screenshot saved to: " + screenshot);
    if (err.message !== debugError) {
      throw err;
    }
  } finally {
    await Target.closeTarget({ targetId });
    await browser.close();
    await chrome.kill();
  }
};

export const handler = (_event: any, _context: Context, callback: Callback) => {
  run().then(() => {
    callback();
  }).catch((err) => {
    console.error(err);
    callback(err);
  });
};
