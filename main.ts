import launchChrome = require("@serverless-chrome/lambda");
import { Callback, Context } from "aws-lambda";
import CDP = require("chrome-remote-interface");
import fs = require("fs");

async function takeScreenshot(page: any): Promise<string> {
  const screenshot = await page.captureScreenshot();
  const buffer = new Buffer(screenshot.data, "base64");
  const fileName = `/tmp/streakeeper.png`;
  fs.writeFileSync(fileName, buffer, { encoding: "base64" });
  return fileName;
}

const run = async () => {
  const chrome = await launchChrome({
    flags: [
      "--window-size=1280x1696",
      "--ignore-certificate-errors",
      "--incognito",
      "--headless",
      "--disable-gpu",
    ],
  });
  const client = await CDP();
  const { DOM, Page, Network, Input } = client;
  await Page.enable();
  await DOM.enable();
  await Network.enable();

  await Page.navigate({ url: "https://duolingo.com" });
  Page.loadEventFired(async () => {
    try {
      const { root: { nodeId: documentNodeId } } = await DOM.getDocument();
      const { nodeId: loginNode } = await DOM.querySelector({
        nodeId: documentNodeId,
        selector: "#sign-in-btn",
      });
      const { model: { content: btnQuad } } = await DOM.getBoxModel({ nodeId: loginNode });
      const xloc = Math.floor(((btnQuad[2] - btnQuad[0]) / 2) + btnQuad[0]);
      const yloc = Math.floor(((btnQuad[5] - btnQuad[3]) / 2) + btnQuad[3]);
      await Input.dispatchMouseEvent({
        button: "left",
        clickCount: 1,
        type: "mousePressed",
        x: xloc,
        y: yloc,
      });
      await Input.dispatchMouseEvent({
        button: "left",
        clickCount: 1,
        type: "mouseReleased",
        x: xloc,
        y: yloc,
      });
      throw new Error("debugError");
    } catch (e) {
      const screenshot = await takeScreenshot(Page);
      console.error(e);
      console.log("screenshot saved to: " + screenshot);
    } finally {
      await client.close();
      await chrome.kill();
    }
  });
};

export const handler = (_event: any, _context: Context, callback: Callback) => {
  run().then(() => {
    callback();
  }).catch((err) => {
    callback(err);
  });
};
