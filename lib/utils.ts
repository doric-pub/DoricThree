import { log, loge, logw, Resource, uniqueId } from "doric";

export const console = {
  error: (...args: any) => {
    loge(args);
  },
  warn: (...args: any) => {
    logw(args);
  },
  log: (...args: any) => {
    log(args);
  },
};

export class UnifiedResource extends Resource {
  constructor(type: string, identifier: string) {
    if (identifier.startsWith("./")) {
      identifier = identifier.replace("./", "");
    } else if (identifier.startsWith("data:")) {
      type = "base64";
    }
    super(type, identifier);
  }
}
export class ArrayBufferResource extends Resource {
  data: ArrayBuffer;

  constructor(data: ArrayBuffer) {
    super("arrayBuffer", uniqueId("buffer"));
    this.data = data;
  }

  toModel() {
    const ret = super.toModel();
    (ret as any).data = this.data;
    return ret;
  }
}
