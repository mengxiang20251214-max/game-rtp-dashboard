import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, isLocale, type Locale } from "./config";

// 前台默认印尼语（新用户首次进入即印尼语），但尊重用户手动选择：
//   若 NEXT_LOCALE cookie 是受支持语言则优先用它（刷新后保持）。
// 后台默认中文，同样 cookie 优先。
// 通过 middleware 写入的 x-pathname 区分前后台。
const PUBLIC_DEFAULT_LOCALE: Locale = "id";
const ADMIN_DEFAULT_LOCALE: Locale = "zh";

export default getRequestConfig(async () => {
  const pathname = headers().get("x-pathname") || "";
  const isAdmin = pathname.startsWith("/admin");

  // cookie 优先（用户手动选择过则尊重）；否则前台默认印尼语、后台默认中文
  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value;
  const fallback = isAdmin ? ADMIN_DEFAULT_LOCALE : PUBLIC_DEFAULT_LOCALE;
  const locale: Locale = isLocale(cookieLocale) ? cookieLocale : fallback;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
