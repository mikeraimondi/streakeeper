declare module "@serverless-chrome/lambda" {
  export = index;
  interface ChromeOptions {
    flags?: string[];
  }
  interface Chrome {
    port: number,
    kill(): void;
  }
  function index(a: ChromeOptions): Promise<Chrome>;
}
