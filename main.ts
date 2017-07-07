import * as launchChrome from "@serverless-chrome/lambda";
import * as CDP from "chrome-remote-interface";

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
