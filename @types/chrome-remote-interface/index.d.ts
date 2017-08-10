declare namespace ChromeRemoteInterface {

  export interface Chrome {
    Target: Target,
    DOM: DOM,
    Page: Page,
    Network: Network,
    Runtime: Runtime,
    Input: Input,
    close(): Promise<void>
  }

  export interface Target {
    createBrowserContext(): Promise<{ browserContextId: string }>
    createTarget(params: {
      url: string,
      width?: number,
      height?: number,
      browserContextId?: string
    }): Promise<{ targetId: string }>
    closeTarget(params: { targetId: string }): Promise<{ success: boolean }>
  }

  export interface DOM {
    enable(): Promise<void>
    performSearch(params: { query: string, includeUserAgentShadowDOM?: boolean }):
      Promise<{ searchId: string, resultCount: number }>
    getSearchResults(params: { searchId: string, fromIndex: number, toIndex: number }):
      Promise<{ nodeIds: number[] }>
    getAttributes(params: { nodeId: number }): Promise<{ attributes: string[] }>
    getDocument(params?: { depth?: number, pierce?: boolean }): Promise<{ root: Node }>
    querySelector(params: { nodeId: number, selector: string }): Promise<{ nodeId: number }>
    getBoxModel(params?: { nodeId?: number, backendNodeId?: number, objectId?: string }): Promise<{ model: BoxModel }>
  }

  export interface Node {
    nodeId: number,
    parentId?: number,
    backendNodeId: number,
    nodeType: number,
    nodeName: string,
    localName: string,
    nodeValue: string,
    childNodeCount?: number,
    children?: Node[],
    attributes?: string[],
    documentURL?: string,
    baseURL?: string,
    publicId?: string,
    systemId?: string,
    internalSubset?: string,
    xmlVersion?: string,
    name?: string,
    value?: string,
    pseudoType?: string,
    shadowRootType?: string,
    frameId?: string,
    contentDocument?: Node,
    shadowRoots?: Node[],
    templateContent?: Node,
    pseudoElements?: Node[],
    importedDocument?: Node,
    distributedNodes?: { nodeType: number, nodeName: string, backendNodeId: number }[]
    isSVG?: boolean
  }

  export interface BoxModel {
    content: number[],
    padding: number[],
    border: number[],
    margin: number[],
    width: number,
    height: number,
    shapeOutside: { bounds: number[], shape: any[], marginShape: any[] }
  }

  export interface Page {
    enable(): Promise<void>
    navigate(params: { url: string, referrer?: string, transitionType?: string }): Promise<{ frameId: string }>
    loadEventFired(): Promise<{ timestamp: number }>
    captureScreenshot(params?: { format?: string, quality?: number, clip?: { x: number, y: number, width: number, height: number, scale: number }, fromSurface?: boolean }): Promise<{ data: string }>
  }

  export interface Network {
    enable(): Promise<void>
  }

  export interface Runtime {
    enable(): Promise<void>
  }

  export interface Input {
    dispatchMouseEvent(params: { type: string, x: number, y: number, modifiers?: number, timestamp?: number, button?: string, clickCount?: number }):
      Promise<void>
    dispatchKeyEvent(params:
      {
        type: string,
        modifiers?: number,
        timestamp?: number,
        text?: string,
        unmodifiedText?: string,
        keyIdentifier?: string,
        code?: string,
        key?: string,
        windowsVirtualKeyCode?: number,
        nativeVirtualKeyCode?: number,
        autoRepeat?: boolean,
        isKeypad?: boolean,
        isSystemKey?: boolean
      }):
      Promise<void>
  }
}
declare module "chrome-remote-interface" {
  import Chrome = ChromeRemoteInterface.Chrome
  export = index;
  function index(params?: {
    host?: string,
    port?: number,
    secure?: boolean,
    target?: string,
    protocol?: any,
    remote?: boolean
  }): Chrome;

}
