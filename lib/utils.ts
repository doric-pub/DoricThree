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

export class FakeResource extends Resource {
  constructor(type: string, identifier: string) {
    super(type, identifier);
  }
}
