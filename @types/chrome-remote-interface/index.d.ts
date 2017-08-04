declare module "chrome-remote-interface" {
  export = index;
  function index(params: { target: string }): Chrome;

  interface Chrome {
    Target: Target,
    DOM: DOM,
    Page: Page,
    Network: Network,
    Runtime: Runtime,
    close(): Promise<void>
  }

  interface Target {
    createBrowserContext(): Promise<{ browserContextId: string }>
    createTarget(params: {
      url: string,
      width?: number,
      height?: number,
      browserContextId?: string
    }): Promise<{ targetId: string }>
    closeTarget(params: { targetId: string }): Promise<{ success: boolean }>
  }

  interface DOM {
    enable(): Promise<void>
    performSearch(params: { query: string, includeUserAgentShadowDOM?: boolean }):
      Promise<{ searchId: string, resultCount: number }>
    getSearchResults(params: { searchId: string, fromIndex: number, toIndex: number }):
      Promise<{ nodeIds: number[] }>
    getAttributes(params: { nodeId: number }): Promise<{ attributes: string[] }>
  }

  interface Page {
    enable(): Promise<void>
    navigate(params: { url: string, referrer?: string, transitionType?: string }): Promise<{ frameId: string }>
    loadEventFired(): Promise<{ timestamp: number }>
  }

  interface Network {
    enable(): Promise<void>
  }

  interface Runtime {
    enable(): Promise<void>
  }
}
