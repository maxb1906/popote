import { classifyBrowser } from '../install';

const SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const CHROME_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1';
const INSTAGRAM = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 354.0.0.30.98';
const FACEBOOK = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22B83 [FBAN/FBIOS;FBAV/489.0.0.47.106]';
const WEBVIEW = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
const IPAD_DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15';
const ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';

describe('classifyBrowser', () => {
  it('recognises iPhone Safari', () => expect(classifyBrowser(SAFARI, 5)).toBe('safari'));
  it('recognises an iPad asking for the desktop site', () => expect(classifyBrowser(IPAD_DESKTOP, 5)).toBe('safari'));
  it('treats a Mac as desktop', () => expect(classifyBrowser(IPAD_DESKTOP, 0)).toBe('desktop'));
  it('recognises other iOS browsers', () => expect(classifyBrowser(CHROME_IOS, 5)).toBe('other-browser'));
  it('recognises in-app browsers', () => {
    expect(classifyBrowser(INSTAGRAM, 5)).toBe('in-app');
    expect(classifyBrowser(FACEBOOK, 5)).toBe('in-app');
    expect(classifyBrowser(WEBVIEW, 5)).toBe('in-app');
  });
  it('knows when it is already installed', () => expect(classifyBrowser(SAFARI, 5, true)).toBe('installed'));
  it('recognises Android', () => expect(classifyBrowser(ANDROID, 5)).toBe('android'));
});
