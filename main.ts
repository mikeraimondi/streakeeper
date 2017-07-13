import launchChrome = require("@serverless-chrome/lambda");
import { Callback, Context } from "aws-lambda";
import CDP = require("chrome-remote-interface");

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

export const handler = (event: any, context: Context, callback: Callback) => {
  run().then(() => {
    callback();
  }).catch((err) => {
    callback(err);
  });
};
