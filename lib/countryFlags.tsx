// allow: SIZE_OK - static SVG flag icons and ISO country data dictionary
import React, { useState } from "react";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";

export interface CountryItem {
  code: string;
  country: string;
  name: string;
  flag: string;
}

export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "🌐";
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return "🌐";
  }
}

const SVG_FLAGS: Record<string, React.ReactNode> = {
  id: (
    <svg viewBox="0 0 640 480" width="100%" height="100%">
      <path fill="#e70011" d="M0 0h640v240H0z" />
      <path fill="#ffffff" d="M0 240h640v240H0z" />
    </svg>
  ),
  us: (
    <svg viewBox="0 0 640 480" width="100%" height="100%">
      <path fill="#bd3d44" d="M0 0h640v480H0z" />
      <path stroke="#fff" strokeWidth="37" d="M0 55.4h640M0 129.2h640M0 203.1h640M0 277h640M0 350.8h640M0 424.6h640" />
      <path fill="#192f5d" d="M0 0h256v258.5H0z" />
      <circle fill="#fff" cx="128" cy="129" r="60" opacity="0.9" />
    </svg>
  ),
  my: (
    <svg viewBox="0 0 640 480" width="100%" height="100%">
      <path fill="#cc0001" d="M0 0h640v480H0z" />
      <path stroke="#fff" strokeWidth="34" d="M0 51.4h640M0 120h640M0 188.6h640M0 257.1h640M0 325.7h640M0 394.3h640M0 462.9h640" />
      <path fill="#000066" d="M0 0h320v240H0z" />
      <circle fill="#ffcc00" cx="160" cy="120" r="45" />
    </svg>
  ),
  sg: (
    <svg viewBox="0 0 640 480" width="100%" height="100%">
      <path fill="#ed2939" d="M0 0h640v240H0z" />
      <path fill="#ffffff" d="M0 240h640v240H0z" />
      <circle fill="#fff" cx="120" cy="120" r="50" />
      <circle fill="#ed2939" cx="138" cy="120" r="45" />
    </svg>
  ),
  gb: (
    <svg viewBox="0 0 640 480" width="100%" height="100%">
      <path fill="#012169" d="M0 0h640v480H0z" />
      <path stroke="#fff" strokeWidth="80" d="M0 0l640 480M640 0L0 480" />
      <path stroke="#c8102e" strokeWidth="48" d="M0 0l640 480M640 0L0 480" />
      <path stroke="#fff" strokeWidth="120" d="M320 0v480M0 240h640" />
      <path stroke="#c8102e" strokeWidth="72" d="M320 0v480M0 240h640" />
    </svg>
  ),
  jp: (
    <svg viewBox="0 0 640 480" width="100%" height="100%">
      <path fill="#ffffff" d="M0 0h640v480H0z" />
      <circle fill="#bc002d" cx="320" cy="240" r="144" />
    </svg>
  ),
  sa: (
    <svg viewBox="0 0 640 480" width="100%" height="100%">
      <path fill="#0a6836" d="M0 0h640v480H0z" />
      <path fill="#ffffff" d="M120 240h400v20H120z" opacity="0.8" />
    </svg>
  ),
  ae: (
    <svg viewBox="0 0 640 480" width="100%" height="100%">
      <path fill="#00732f" d="M0 0h640v160H0z" />
      <path fill="#ffffff" d="M0 160h640v160H0z" />
      <path fill="#000000" d="M0 320h640v160H0z" />
      <path fill="#ff0000" d="M0 0h160v480H0z" />
    </svg>
  ),
  in: (
    <svg viewBox="0 0 640 480" width="100%" height="100%">
      <path fill="#ff9933" d="M0 0h640v160H0z" />
      <path fill="#ffffff" d="M0 160h640v160H0z" />
      <path fill="#128807" d="M0 320h640v160H0z" />
      <circle fill="#000080" cx="320" cy="240" r="45" opacity="0.85" />
    </svg>
  ),
  au: (
    <svg viewBox="0 0 640 480" width="100%" height="100%">
      <path fill="#00008b" d="M0 0h640v480H0z" />
      <circle fill="#fff" cx="160" cy="120" r="30" />
      <circle fill="#fff" cx="480" cy="240" r="20" />
      <circle fill="#fff" cx="400" cy="140" r="16" />
      <circle fill="#fff" cx="440" cy="360" r="18" />
    </svg>
  ),
  de: (
    <svg viewBox="0 0 640 480" width="100%" height="100%">
      <path fill="#000000" d="M0 0h640v160H0z" />
      <path fill="#dd0000" d="M0 160h640v160H0z" />
      <path fill="#ffce00" d="M0 320h640v160H0z" />
    </svg>
  ),
  fr: (
    <svg viewBox="0 0 640 480" width="100%" height="100%">
      <path fill="#002395" d="M0 0h213.3v480H0z" />
      <path fill="#ffffff" d="M213.3 0h213.4v480H213.3z" />
      <path fill="#ed2939" d="M426.7 0H640v480H426.7z" />
    </svg>
  )
};

export function FlagIcon({ country, size = 14 }: { country: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const iso = (country || "").toLowerCase().trim();
  const width = Math.round(size * 1.33);
  const height = size;

  if (SVG_FLAGS[iso]) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: "2px",
          overflow: "hidden",
          boxShadow: "0 0 1px rgba(0,0,0,0.35)",
          flexShrink: 0,
          verticalAlign: "middle"
        }}
      >
        {SVG_FLAGS[iso]}
      </span>
    );
  }

  if (!iso || iso.length !== 2 || imgError) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "9.5px",
          fontWeight: "700",
          background: "rgba(0,0,0,0.06)",
          color: "inherit",
          borderRadius: "2px",
          padding: "1px 3px",
          lineHeight: "1.1",
          minWidth: `${width}px`,
          height: `${height}px`,
          boxSizing: "border-box"
        }}
      >
        {country ? country.toUpperCase() : "🌐"}
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      srcSet={`https://flagcdn.com/w80/${iso}.png 2x`}
      width={width}
      height={height}
      alt={country}
      onError={() => setImgError(true)}
      style={{
        display: "inline-block",
        objectFit: "cover",
        borderRadius: "2px",
        boxShadow: "0 0 1px rgba(0,0,0,0.3)",
        verticalAlign: "middle",
        flexShrink: 0
      }}
      loading="eager"
    />
  );
}

const displayNames =
  typeof Intl !== "undefined" && Intl.DisplayNames
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

export const COUNTRY_CODES: CountryItem[] = (() => {
  try {
    const countries = getCountries();
    const list: CountryItem[] = countries
      .map((iso) => {
        let callingCode = "";
        try {
          callingCode = `+${getCountryCallingCode(iso)}`;
        } catch {
          callingCode = "";
        }
        let countryName: string = String(iso);
        try {
          countryName = displayNames ? (displayNames.of(iso) || String(iso)) : String(iso);
        } catch {
          countryName = String(iso);
        }
        return {
          code: callingCode,
          country: String(iso),
          name: countryName,
          flag: getCountryFlag(iso)
        };
      })
      .filter((c) => Boolean(c.code));

    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  } catch (err) {
    console.error("Failed to load countries from libphonenumber-js:", err);
    return [{ code: "+62", country: "ID", name: "Indonesia", flag: "🇮🇩" }];
  }
})();

export const SORTED_BY_CODE_LEN: readonly CountryItem[] = [...COUNTRY_CODES].sort(
  (a, b) => b.code.length - a.code.length
);
