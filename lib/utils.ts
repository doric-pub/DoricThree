import { log, loge, logw, Resource } from "doric";

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
