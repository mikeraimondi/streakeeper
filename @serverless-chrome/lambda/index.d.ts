declare module '@serverless-chrome/lambda' {
  export = index
  interface chromeOptions {
    flags?: string[];
  }
  interface Chrome {
    kill(): void;
  }
  function index(a: chromeOptions): Promise<Chrome>;
}
