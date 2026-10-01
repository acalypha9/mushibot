import os
import sys
from pathlib import Path
from typing import Optional, Union

__all__ = [
    "_is_system_or_root",
    "get_public_files_dir",
    "resolve_public_files_dir",
]

_DEFAULT_MODULE_FILE = __file__


def _is_system_or_root(path: Path) -> bool:
    try:
        resolved = path.resolve()
        if resolved == resolved.parent:
            return True
        norm = resolved.as_posix().rstrip("/")
        system_roots = {
            "", "/", "/root", "/bin", "/sbin", "/etc", "/usr", "/var",
            "/tmp", "/dev", "/proc", "/sys", "/run", "/boot", "/lib",
            "/lib64", "/opt"
        }
        if norm in system_roots or path.parent == path or path.as_posix() in ("/", ""):
            return True
        if os.name == "nt":
            win_dir = os.environ.get("SystemRoot", r"C:\Windows").replace("\\", "/").rstrip("/").lower()
            prog_files = os.environ.get("ProgramFiles", r"C:\Program Files").replace("\\", "/").rstrip("/").lower()
            if norm.lower() in (win_dir, prog_files):
                return True
        return False
    except Exception:
        return True


def resolve_public_files_dir(base_file: Optional[Union[str, Path]] = None) -> Path:
    override = os.getenv("PUBLIC_FILES_DIR")
    if override and override.strip():
        target = Path(override.strip()).resolve()
        if _is_system_or_root(target):
            raise RuntimeError(f"Configured PUBLIC_FILES_DIR '{target}' cannot be a root or system directory.")
        try:
            os.makedirs(target, exist_ok=True)
            if not target.is_dir():
                raise RuntimeError(f"Configured PUBLIC_FILES_DIR '{target}' is not a directory.")
            return target
        except (OSError, PermissionError) as err:
            raise RuntimeError(f"Configured PUBLIC_FILES_DIR '{target}' cannot be used: {err}") from err

    if base_file is not None:
        api_dir = Path(base_file).parent
    elif __file__ != _DEFAULT_MODULE_FILE:
        api_dir = Path(__file__).parent
    else:
        tools_mod = sys.modules.get("tools_builtin") or sys.modules.get("api.tools_builtin")
        tools_file = getattr(tools_mod, "__file__", None) if tools_mod else None
        if tools_file:
            api_dir = Path(tools_file).parent
        else:
            api_dir = Path(__file__).parent

    project_root = api_dir.parent

    if not _is_system_or_root(project_root):
        project_public = project_root / "public"
        if project_public.exists() and project_public.is_dir():
            candidate = project_public / "files"
            try:
                os.makedirs(candidate, exist_ok=True)
                if candidate.is_dir() and os.access(candidate, os.W_OK):
                    return candidate.resolve()
            except (OSError, PermissionError):
                pass

    if _is_system_or_root(api_dir):
        raise RuntimeError(f"API directory '{api_dir}' cannot be a root or system directory.")

    api_uploads = api_dir / "uploads"
    try:
        os.makedirs(api_uploads, exist_ok=True)
        if not api_uploads.is_dir():
            raise RuntimeError(f"API uploads path '{api_uploads}' exists but is not a directory.")
        if not os.access(api_uploads, os.W_OK):
            raise RuntimeError(f"API uploads path '{api_uploads}' is not writable.")
        return api_uploads.resolve()
    except (OSError, PermissionError) as err:
        raise RuntimeError(
            f"No usable sandbox directory could be established. "
            f"Failed to access or create API uploads directory at '{api_uploads}': {err}"
        ) from err


get_public_files_dir = resolve_public_files_dir
