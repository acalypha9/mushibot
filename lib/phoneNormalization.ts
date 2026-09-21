import { parsePhoneNumberFromString } from "libphonenumber-js";
import { SORTED_BY_CODE_LEN } from "./countryFlags";

export function splitPhoneNumber(raw: string): { countryCode: string; localNumber: string } {
  const val = (raw || "").trim();
  if (!val) return { countryCode: "", localNumber: "" };

  if (val.endsWith("@g.us") || val.startsWith("@") || val.includes("@")) {
    return { countryCode: "", localNumber: val };
  }

  // 1. Starts with '+'
  if (val.startsWith("+")) {
    try {
      const parsed = parsePhoneNumberFromString(val);
      if (parsed?.countryCallingCode) {
        const calling = `+${parsed.countryCallingCode}`;
        const national = parsed.nationalNumber || val.substring(calling.length);
        return {
          countryCode: calling,
          localNumber: national
        };
      }
    } catch {}

    for (const c of SORTED_BY_CODE_LEN) {
      if (val.startsWith(c.code)) {
        return {
          countryCode: c.code,
          localNumber: val.substring(c.code.length).replace(/^[\s\-]+/, "")
        };
      }
    }
    return { countryCode: "", localNumber: val.substring(1) };
  }

  // 2. Starts with '00' (international prefix without '+')
  if (val.startsWith("00")) {
    return splitPhoneNumber("+" + val.substring(2));
  }

  // 3. Starts with 08...
  if (val.startsWith("08") && val.length >= 8) {
    return {
      countryCode: "+62",
      localNumber: val.substring(1)
    };
  }

  // 4. Starts with known country calling digits without '+'
  const cleanDigits = val.replace(/\D/g, "");
  for (const c of SORTED_BY_CODE_LEN) {
    const cd = c.code.replace(/\D/g, "");
    if (cd.length >= 2 && cleanDigits.startsWith(cd) && cleanDigits.length >= cd.length) {
      return {
        countryCode: c.code,
        localNumber: cleanDigits.substring(cd.length)
      };
    }
    if (cd.length === 1 && cleanDigits.startsWith(cd) && cleanDigits.length >= 10) {
      return {
        countryCode: c.code,
        localNumber: cleanDigits.substring(cd.length)
      };
    }
  }

  return { countryCode: "", localNumber: val };
}

export function extractCountryCodeFromInput(
  inputVal: string,
  currentCountryCode: string
): { countryCode: string; localNumber: string; hasChanged: boolean } {
  let val = inputVal.trim();
  if (!val) return { countryCode: currentCountryCode, localNumber: inputVal, hasChanged: false };

  if (val.endsWith("@g.us") || val.startsWith("@") || val.includes("@")) {
    return { countryCode: currentCountryCode, localNumber: inputVal, hasChanged: false };
  }

  if (val.startsWith("00")) {
    val = "+" + val.substring(2);
  }

  // CASE 1: Starts with '+'
  if (val.startsWith("+")) {
    for (const c of SORTED_BY_CODE_LEN) {
      if (val.startsWith(c.code)) {
        const remaining = val.substring(c.code.length).replace(/^[\s\-]+/, "");
        return {
          countryCode: c.code,
          localNumber: remaining,
          hasChanged: true
        };
      }
    }
    return { countryCode: currentCountryCode, localNumber: val, hasChanged: false };
  }

  // CASE 2: Starts with local Indonesian mobile prefix '08...'
  if (val.startsWith("08")) {
    const remaining = val.substring(1);
    return {
      countryCode: "+62",
      localNumber: remaining,
      hasChanged: true
    };
  }

  // CASE 3: Clean digits WITHOUT '+'
  const cleanDigits = val.replace(/[\s\-\(\)]/g, "");
  if (/^\d+$/.test(cleanDigits)) {
    if ((currentCountryCode === "+62" || currentCountryCode === "62") && cleanDigits.startsWith("8")) {
      return { countryCode: "+62", localNumber: val, hasChanged: false };
    }

    for (const c of SORTED_BY_CODE_LEN) {
      const cd = c.code.replace(/\D/g, "");
      if (cd.length >= 2 && cleanDigits.startsWith(cd)) {
        const remaining = cleanDigits.substring(cd.length);
        return {
          countryCode: c.code,
          localNumber: remaining,
          hasChanged: true
        };
      }
      if (cd.length === 1 && cleanDigits.startsWith(cd)) {
        if (cleanDigits === cd || cleanDigits.length >= 4) {
          const remaining = cleanDigits.substring(cd.length);
          return {
            countryCode: c.code,
            localNumber: remaining,
            hasChanged: true
          };
        }
      }
    }
  }

  return { countryCode: currentCountryCode, localNumber: inputVal, hasChanged: false };
}

export function combinePhoneNumber(localNumber: string, countryCode: string = ""): string {
  const val = (localNumber || "").trim();
  if (!val) return "";

  if (val.endsWith("@g.us") || val.startsWith("@") || val.includes("@")) {
    return val;
  }

  const cleanCode = countryCode.trim().startsWith("+")
    ? countryCode.trim()
    : countryCode.trim()
    ? `+${countryCode.trim()}`
    : "";

  if (val.startsWith("+")) {
    try {
      const parsed = parsePhoneNumberFromString(val);
      if (parsed?.isValid()) {
        return parsed.number;
      }
    } catch {}
    return `+${val.replace(/\D/g, "")}`;
  }

  if (cleanCode) {
    let cleanLocal = val.replace(/\D/g, "");
    if (cleanLocal.startsWith("0")) {
      cleanLocal = cleanLocal.substring(1);
    }
    const codeDigits = cleanCode.replace(/\D/g, "");
    if (cleanLocal.startsWith(codeDigits)) {
      return `+${cleanLocal}`;
    }
    return `${cleanCode}${cleanLocal}`;
  }

  const digits = val.replace(/\D/g, "");
  if (val.startsWith("08")) {
    return `+62${digits.substring(1)}`;
  }
  
  for (const c of SORTED_BY_CODE_LEN) {
    const cd = c.code.replace(/\D/g, "");
    if (cd.length >= 2 && digits.startsWith(cd) && digits.length >= cd.length) {
      return `+${digits}`;
    }
    if (cd.length === 1 && digits.startsWith(cd) && digits.length >= 10) {
      return `+${digits}`;
    }
  }

  return val;
}

export const formatPhoneNumberWithCountryCode = combinePhoneNumber;
