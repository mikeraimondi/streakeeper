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

const clickCenter = async (client: any, selector: string): Promise<void> => {
  const { DOM, Input } = client;
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

const typeIn = async (client: any, val: string): Promise<void> => {
  const { Input } = client;
  for (const letter of val) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    await Input.dispatchKeyEvent({
      text: letter,
      type: "keyDown",
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    await Input.dispatchKeyEvent({
      type: "keyUp",
    });
  }
};

async function nodeAppears(client: any, selector: string) {
  // browser code to register and parse mutations
  const browserCode = (sel: any) => {
    return new Promise((fulfill, _reject) => {
      new MutationObserver((mutations, observer) => {
        const nodes: any[] = [];
        mutations.forEach((mutation) => {
          nodes.push(...mutation.addedNodes);
        });
        // fulfills if at least one node matches the selector
        if (nodes.find((node) => node.matches(sel))) {
          observer.disconnect();
          fulfill();
        }
      }).observe(document.body, {
        childList: true,
      });
    });
  };
  const { Runtime } = client;
  const observe = Runtime.evaluate({
    awaitPromise: true,
    expression: `(${browserCode})(${JSON.stringify(selector)})`,
  });
  const timeout = new Promise((_resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(`timed out waiting for "${selector}"`);
    }, 5000);
  });
  const { exceptionDetails } = await Promise.race([
    observe,
    timeout,
  ]);
  if (exceptionDetails) {
    throw new Error(JSON.stringify(exceptionDetails.exception));
  }
  return;
}

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
  const { DOM, Page, Network, Runtime } = client;
  await Page.enable();
  await DOM.enable();
  await Network.enable();
  await Runtime.enable();

  await Page.navigate({ url: "https://duolingo.com" });
  await Page.loadEventFired();
  try {
    await clickCenter(client, "#sign-in-btn");
    await typeIn(client, process.env.login);
    await clickCenter(client, "#top_password");
    await typeIn(client, process.env.password);
    await clickCenter(client, "#login-button");
    await Page.loadEventFired();
    await nodeAppears(client, 'div[title="Lingots"]');
    throw new Error(debugError);
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
