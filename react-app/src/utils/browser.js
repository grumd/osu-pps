import UAParser from 'ua-parser-js';
export const uaparser = new UAParser();
export const isMobile = uaparser.getDevice().type === 'mobile';
