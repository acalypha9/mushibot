"""
Shared security primitives and helpers for SSRF protection, path confinement,
filename sanitization, and secret masking.
"""

import ipaddress
import os
import re
import socket
import urllib.parse
from pathlib import Path
from typing import Optional, Sequence, Union

# Known internal/local hostnames and patterns to block by default
_BLOCKED_HOSTNAMES = {
    "localhost",
    "local",
    "broadcasthost",
    "metadata.google.internal",
    "instance-data",
    "host.docker.internal",
}

# Special-purpose networks that should never be reachable via SSRF
_ADDITIONAL_PRIVATE_NETWORKS = [
    ipaddress.ip_network("100.64.0.0/10"),    # Carrier-grade NAT (RFC 6598)
    ipaddress.ip_network("198.18.0.0/15"),   # Benchmarking (RFC 2544)
    ipaddress.ip_network("192.0.2.0/24"),    # Documentation TEST-NET-1
    ipaddress.ip_network("198.51.100.0/24"), # Documentation TEST-NET-2
    ipaddress.ip_network("203.0.113.0/24"),  # Documentation TEST-NET-3
    ipaddress.ip_network("240.0.0.0/4"),     # Reserved (Class E)
    ipaddress.ip_network("255.255.255.255/32"), # Broadcast
    ipaddress.ip_network("0.0.0.0/8"),       # Current network
]

_NAT64_WELL_KNOWN_PREFIX = ipaddress.ip_network("64:ff9b::/96")


def is_private_or_reserved_ip(ip_target: Union[str, ipaddress.IPv4Address, ipaddress.IPv6Address]) -> bool:
    """
    Check if an IP address (IPv4 or IPv6) is private, loopback, link-local (e.g. 169.254.169.254),
    multicast, reserved, unspecified, or carrier-grade NAT.
    """
    try:
        if isinstance(ip_target, (ipaddress.IPv4Address, ipaddress.IPv6Address)):
            ip_obj = ip_target
        else:
            ip_str = str(ip_target).strip()
            # Handle IPv6 zone indices or brackets if present
            if ip_str.startswith("[") and ip_str.endswith("]"):
                ip_str = ip_str[1:-1]
            if "%" in ip_str:
                ip_str = ip_str.split("%")[0]
            ip_obj = ipaddress.ip_address(ip_str)

        # If IPv6, check if it's an IPv4-mapped address (e.g. ::ffff:127.0.0.1)
        if isinstance(ip_obj, ipaddress.IPv6Address) and ip_obj.ipv4_mapped:
            ip_obj = ip_obj.ipv4_mapped

        if isinstance(ip_obj, ipaddress.IPv6Address) and ip_obj in _NAT64_WELL_KNOWN_PREFIX:
            ip_obj = ipaddress.IPv4Address(int(ip_obj) & 0xFFFFFFFF)

        if (
            ip_obj.is_loopback
            or ip_obj.is_private
            or ip_obj.is_link_local
            or ip_obj.is_multicast
            or ip_obj.is_reserved
            or ip_obj.is_unspecified
        ):
            return True

        if isinstance(ip_obj, ipaddress.IPv4Address):
            for net in _ADDITIONAL_PRIVATE_NETWORKS:
                if ip_obj in net:
                    return True

        return False
    except (ValueError, TypeError):
        # If it cannot be parsed as an IP address, treat as unsafe
        return True


def is_safe_url(
    url: str,
    allow_private: bool = False,
    allowed_schemes: Sequence[str] = ("http", "https"),
) -> bool:
    """
    Validate whether a URL is syntactically valid and safe from SSRF attacks.
    If allow_private is False (default), blocks loopback, private, link-local (cloud metadata),
    and reserved IP addresses or domains resolving to them.
    """
    try:
        validate_safe_url(url, allow_private=allow_private, allowed_schemes=allowed_schemes)
        return True
    except (ValueError, TypeError):
        return False


def validate_safe_url(
    url: str,
    allow_private: bool = False,
    allowed_schemes: Sequence[str] = ("http", "https"),
) -> str:
    """
    Validate a URL against SSRF vulnerabilities and return the cleaned URL.
    Raises ValueError if the URL is invalid or targets a forbidden network/host.
    """
    if not url or not isinstance(url, str) or not url.strip():
        raise ValueError("URL cannot be empty")

    clean_url = url.strip()
    parsed = urllib.parse.urlparse(clean_url)

    scheme = (parsed.scheme or "").lower()
    allowed_schemes_lower = tuple(s.lower() for s in allowed_schemes)
    if scheme not in allowed_schemes_lower:
        raise ValueError(
            f"Invalid URL scheme '{scheme}'. Allowed schemes: {list(allowed_schemes_lower)}"
        )

    hostname = parsed.hostname
    if not hostname:
        raise ValueError("URL must include a valid hostname")

    hostname_clean = hostname.strip().lower()

    # Validate port if specified
    if parsed.port is not None:
        if not (1 <= parsed.port <= 65535):
            raise ValueError(f"Invalid port number: {parsed.port}")

    if allow_private:
        return clean_url

    # Check known local/internal hostnames
    if (
        hostname_clean in _BLOCKED_HOSTNAMES
        or hostname_clean.endswith(".localhost")
        or hostname_clean.endswith(".local")
        or hostname_clean.endswith(".internal")
    ):
        raise ValueError(f"Access to private or local hostname '{hostname}' is blocked")

    # Check if hostname is an IP literal
    try:
        # Check if direct IP address
        if is_private_or_reserved_ip(hostname_clean):
            raise ValueError(f"Access to private, loopback, or link-local IP '{hostname}' is blocked")
        # Direct public IP
        return clean_url
    except (ValueError, TypeError):
        # Hostname is a domain name, proceed to DNS resolution
        pass

    # Resolve domain name to IP addresses to prevent DNS rebinding / private mapping
    try:
        addr_info = socket.getaddrinfo(hostname_clean, None)
    except socket.gaierror as e:
        raise ValueError(f"Failed to resolve hostname '{hostname}': {e}") from e

    if not addr_info:
        raise ValueError(f"Failed to resolve any IP addresses for hostname '{hostname}'")

    for _, _, _, _, sockaddr in addr_info:
        ip_str = sockaddr[0]
        if is_private_or_reserved_ip(ip_str):
            raise ValueError(
                f"Hostname '{hostname}' resolves to private/reserved IP '{ip_str}', which is blocked"
            )

    return clean_url


def safe_path_join(base_dir: Union[str, Path], *paths: Union[str, Path]) -> Path:
    """
    Safely join subpaths to base_dir, strictly guaranteeing that the resulting
    resolved path does not escape base_dir (directory traversal prevention).
    Raises ValueError if path traversal is detected.
    """
    base = Path(base_dir).resolve()

    # Clean each subpath: strip leading separators and drive letters
    cleaned_parts = []
    for p in paths:
        p_str = str(p).replace("\\", "/")
        # Remove any leading slashes/backslashes so Path doesn't reset to root
        p_str = p_str.lstrip("/")
        # Remove drive letter if on Windows (e.g. C:)
        if re.match(r"^[a-zA-Z]:", p_str):
            p_str = p_str[2:].lstrip("/")
        if p_str:
            cleaned_parts.append(p_str)

    target = base
    for part in cleaned_parts:
        target = target / part

    target_resolved = target.resolve()

    # Verify that target_resolved is relative to base
    try:
        target_resolved.relative_to(base)
    except ValueError:
        raise ValueError(
            f"Path traversal detected: '{'/'.join(str(p) for p in paths)}' escapes base directory '{base}'"
        )

    return target_resolved


def is_safe_path(base_dir: Union[str, Path], target_path: Union[str, Path]) -> bool:
    """
    Check if target_path resolves safely within base_dir without escaping.
    """
    try:
        base = Path(base_dir).resolve()
        target = Path(target_path).resolve()
        target.relative_to(base)
        return True
    except (ValueError, TypeError):
        return False


def safe_filename(filename: str, fallback: Optional[str] = None) -> str:
    """
    Sanitize an untrusted filename to prevent path traversal and filesystem injection:
    - Strips directory components (e.g. ../ or /etc/)
    - Strips null bytes and control characters
    - Strips leading dots and path separators
    """
    if not filename or not isinstance(filename, str):
        if fallback is not None:
            return fallback
        raise ValueError("Filename cannot be empty")

    # Remove null bytes
    cleaned = filename.replace("\x00", "").strip()

    # Extract basename only
    cleaned = os.path.basename(cleaned.replace("\\", "/"))

    # Remove unsafe characters for filenames across Linux/Windows
    cleaned = re.sub(r'[/\\?%*:|"<>]', "_", cleaned)

    # Strip leading dots or whitespace to avoid hidden files or traversal artifacts
    cleaned = cleaned.lstrip(". ").rstrip(". ")

    if not cleaned:
        if fallback is not None:
            return fallback
        raise ValueError(f"Invalid filename '{filename}'")

    return cleaned


def mask_secret(
    secret: Optional[str],
    show_prefix: int = 4,
    show_suffix: int = 4,
) -> Optional[str]:
    """
    Mask a sensitive secret or API key.
    Examples:
        sk-1234567890abcdef -> sk-1***cdef
        short              -> ***
        None               -> None
    """
    if not secret:
        return None

    s = str(secret).strip()
    if not s:
        return None

    if len(s) <= (show_prefix + show_suffix):
        return "***"

    return f"{s[:show_prefix]}***{s[-show_suffix:]}"
