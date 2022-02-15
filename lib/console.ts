import { log, loge, logw } from "doric";

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
