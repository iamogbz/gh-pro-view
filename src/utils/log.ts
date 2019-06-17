export const log = (...args: any[]) => log.default(...args);
log.default = (...args: any[]) => console.log(...args); // tslint:disable-line: no-console
log.error = (...args: any[]) => console.error(...args); // tslint:disable-line: no-console
log.info = (...args: any[]) => process.env.VERBOSE === "1" && log(...args);
