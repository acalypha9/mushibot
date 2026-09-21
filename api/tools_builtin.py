import json
import os
import platform
import shutil
import subprocess
import sys
from typing import Optional
from langchain_core.tools import tool

from fixtures import pokemon_cards
from knowledge import vector_search
from security import safe_path_join, safe_filename, is_safe_path

ENABLE_SHELL_TOOL = os.getenv("ENABLE_SHELL_TOOL", "false").lower() in ("true", "1", "yes")

BLOCKED_SHELL_COMMANDS = [
    "rm -rf /", "rm -rf *", "rm -rf .", "mkfs", "dd if=", ":(){ :|:& };:",
    "shutdown", "reboot", "init 0", "format c:", "del /f /s /q c:",
    ":(){", "curl http", "wget http", "> /dev/sd", "nc -e", "nc.traditional -e",
    "/dev/tcp/", "/dev/udp/", "bash -i", "sh -i", "mkfifo"
]


@tool
def knowledge_base(query: str, collection_name: str) -> str:
    """Search for relevant information and FAQs in a specific knowledge collection using semantic search.

    Args:
        query: The search query string describing what information to look for.
        collection_name: The target collection name chosen from available collections described in the prompt.
    """
    if not query or not query.strip():
        return json.dumps([{"error": "query parameter is required"}])
    if not collection_name or not collection_name.strip():
        return json.dumps([{"error": "collection_name parameter is required"}])
    return vector_search(query=query, collection_name=collection_name)


@tool
def check_product(product_id: str) -> str:
    """Look up product or order information by ID.

    Args:
        product_id: The ID of the product or order to look up.
    """
    if not product_id or not product_id.strip():
        return json.dumps({"count": 0, "cards": [], "error": "product_id parameter is required"})
    results = [
        card for card in pokemon_cards
        if card.get("product_id") == product_id
    ]
    return json.dumps({
        "count": len(results),
        "cards": results
    })


def _find_windows_bash() -> str:
    """Find absolute path to bash.exe on Windows (preferring Git Bash)."""
    candidates = [
        r"C:\Program Files\Git\bin\bash.exe",
        r"C:\Program Files (x86)\Git\bin\bash.exe",
        r"C:\Program Files\Git\usr\bin\bash.exe",
        r"C:\msys64\usr\bin\bash.exe",
        r"C:\cygwin64\bin\bash.exe",
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    system_bash = shutil.which("bash")
    if system_bash and not system_bash.lower().endswith(r"system32\bash.exe"):
        return system_bash
    return candidates[0] if os.path.exists(candidates[0]) else (system_bash or "bash.exe")


_SHELL_DESCRIPTION = (
    "Execute a POSIX Bash shell command on the host system and return stdout/stderr output."
)


@tool(description=_SHELL_DESCRIPTION)
def execute_shell(command: str, working_dir: Optional[str] = None) -> str:
    """Execute a POSIX Bash shell command and return stdout/stderr output.

    Args:
        command: The bash command string to execute.
        working_dir: Optional working directory path where the command should be executed.
    """
    is_enabled = os.getenv("ENABLE_SHELL_TOOL", "false").lower() in ("true", "1", "yes")
    if not is_enabled:
        return json.dumps({
            "status": "error",
            "error": "Shell execution tool is disabled for security reasons. Set ENABLE_SHELL_TOOL=true to enable."
        })

    if not command or not command.strip():
        return json.dumps({"error": "command parameter is required"})

    cmd_str = command.strip()
    cmd_lower = cmd_str.lower()

    for blocked in BLOCKED_SHELL_COMMANDS:
        if blocked in cmd_lower:
            return json.dumps({
                "status": "error",
                "error": f"Command execution blocked for security reasons: dangerous command pattern '{blocked}' detected."
            })

    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        public_files_dir = os.path.join(base_dir, "public", "files")
        os.makedirs(public_files_dir, exist_ok=True)

        if working_dir and working_dir.strip():
            try:
                resolved_cwd = safe_path_join(public_files_dir, working_dir.strip())
                if not resolved_cwd.exists() or not resolved_cwd.is_dir():
                    return json.dumps({
                        "status": "error",
                        "error": f"Working directory '{working_dir}' does not exist inside allowed directory."
                    })
                cwd = str(resolved_cwd)
            except ValueError:
                return json.dumps({
                    "status": "error",
                    "error": "Access denied: working_dir is outside the allowed directory."
                })
        else:
            cwd = public_files_dir

        is_windows = os.name == "nt"

        env = os.environ.copy()
        python_dir = os.path.dirname(sys.executable)
        env["PATH"] = f"{python_dir}{os.pathsep}{env.get('PATH', '')}"

        if is_windows:
            py_exe_posix = f'"{sys.executable.replace(os.sep, "/")}"'
            if cmd_str.startswith("python3 ") or cmd_str == "python3":
                cmd_str = py_exe_posix + " " + cmd_str[8:]
            elif cmd_str.startswith("python ") or cmd_str == "python":
                cmd_str = py_exe_posix + " " + cmd_str[7:]

        if is_windows:
            bash_bin = _find_windows_bash()
            primary_cmd = [bash_bin, "-c", cmd_str]
            secondary_cmd = ["cmd.exe", "/c", cmd_str]
        else:
            primary_cmd = ["/bin/bash" if os.path.exists("/bin/bash") else "/bin/sh", "-c", cmd_str]
            secondary_cmd = None

        process = subprocess.run(
            primary_cmd,
            cwd=cwd,
            env=env,
            stdin=subprocess.DEVNULL,
            capture_output=True,
            text=True,
            timeout=40
        )

        stdout = (process.stdout or "").strip()
        stderr = (process.stderr or "").strip()

        if is_windows and process.returncode != 0 and secondary_cmd:
            fallback_proc = subprocess.run(
                secondary_cmd,
                cwd=cwd,
                env=env,
                stdin=subprocess.DEVNULL,
                capture_output=True,
                text=True,
                timeout=40
            )
            if fallback_proc.returncode == 0 or len((fallback_proc.stdout or "").strip()) > len(stdout):
                process = fallback_proc
                stdout = (process.stdout or "").strip()
                stderr = (process.stderr or "").strip()

        max_len = 4000
        if len(stdout) > max_len:
            stdout = stdout[:max_len] + f"\n... [Output truncated at {max_len} chars]"
        if len(stderr) > max_len:
            stderr = stderr[:max_len] + f"\n... [Stderr truncated at {max_len} chars]"

        return json.dumps({
            "status": "success" if process.returncode == 0 else "error",
            "exit_code": process.returncode,
            "stdout": stdout,
            "stderr": stderr
        }, ensure_ascii=False)

    except subprocess.TimeoutExpired:
        return json.dumps({
            "status": "error",
            "error": "Command execution timed out after 40 seconds."
        })
    except Exception as err:
        return json.dumps({
            "status": "error",
            "error": f"Failed to execute command: {str(err)}"
        })


@tool
def write_file(file_name: str, content: str) -> str:
    """Create or overwrite a file with the given content.

    Args:
        file_name: The file name to create in the public/files directory.
        content: The text content to write into the file.
    """
    if not file_name or not file_name.strip():
        return json.dumps({"status": "error", "error": "file_name parameter is required"})
    if content is None:
        return json.dumps({"status": "error", "error": "content parameter is required"})

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_files_dir = os.path.join(base_dir, "public", "files")
    os.makedirs(public_files_dir, exist_ok=True)

    try:
        file_path_obj = safe_path_join(public_files_dir, file_name.strip())
        file_path = str(file_path_obj)
        safe_name = file_path_obj.name
    except ValueError:
        return json.dumps({
            "status": "error",
            "error": "Access denied: file path is outside the allowed directory."
        })

    try:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        return json.dumps({
            "status": "success",
            "file_name": safe_name,
            "file_path": file_path,
            "size_bytes": os.path.getsize(file_path)
        }, ensure_ascii=False)
    except Exception as err:
        return json.dumps({
            "status": "error",
            "error": f"Failed to write file: {str(err)}"
        })


@tool
def read_files(file_name: str, max_chars: Optional[int] = 8000) -> str:
    """Read the contents of a text file.

    Args:
        file_name: The file name or path to read.
        max_chars: Optional maximum number of characters to read (default 8000).
    """
    if not file_name or not file_name.strip():
        return json.dumps({"status": "error", "error": "file_name parameter is required"})

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_files_dir = os.path.join(base_dir, "public", "files")

    try:
        file_path_obj = safe_path_join(public_files_dir, file_name.strip())
        file_path = str(file_path_obj)
        safe_name = file_path_obj.name
    except ValueError:
        return json.dumps({
            "status": "error",
            "error": "Access denied: file path is outside the allowed directory."
        })

    if not os.path.exists(file_path) or not os.path.isfile(file_path):
        return json.dumps({
            "status": "error",
            "error": f"File '{safe_name}' not found in public/files directory."
        })

    try:
        limit = max_chars if (max_chars and max_chars > 0) else 8000
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read(limit)
        return json.dumps({
            "status": "success",
            "file_name": safe_name,
            "content": content,
            "size_bytes": os.path.getsize(file_path)
        }, ensure_ascii=False)
    except Exception as err:
        return json.dumps({
            "status": "error",
            "error": f"Failed to read file: {str(err)}"
        })
