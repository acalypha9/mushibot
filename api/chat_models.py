import re
from typing import Optional

from langchain_openai import ChatOpenAI
from config import resolve_docker_url
from models import ModelProvider
from sqlalchemy.orm import Session


def normalize_model_name(raw_name: Optional[str], db: Session) -> str:
    """
    Normalizes any raw model string
    to the exact matching Configured Model Name/ID from database
    """
    if not raw_name or not str(raw_name).strip():
        raw_name = ""

    raw = str(raw_name).strip()

    # Fetch configured models from active chat providers in DB
    providers = db.query(ModelProvider).filter(
        ModelProvider.category == "chat",
        ModelProvider.is_active == True,
    ).all()

    configured_list = []
    for p in providers:
        config_dict = p.config if isinstance(p.config, dict) else {}
        configured = config_dict.get("configured_models", [])
        if isinstance(configured, list):
            for m in configured:
                if isinstance(m, dict):
                    m_id = str(m.get("id") or "").strip()
                    m_name = str(m.get("name") or "").strip()
                    disp = m_name or m_id
                    if disp:
                        configured_list.append((m_id, m_name, disp))

    # Special rule: gemini-3.6-flash high, medium, low, tiered are all named gemini-3.6-flash-tiered
    raw_lower = raw.lower()
    if "gemini-3.6-flash" in raw_lower or "gemini_3_6_flash" in raw_lower:
        has_ag_prefix = any(disp.lower().startswith("ag/") for _, _, disp in configured_list) or raw_lower.startswith("ag/")
        return "ag/gemini-3.6-flash-tiered" if has_ag_prefix else "gemini-3.6-flash-tiered"

    if not raw or raw.lower() in ["default", "gemini-default"]:
        for _, _, disp in configured_list:
            if disp:
                return disp
        return "gemini-3.5-flash-low"

    # Priority 1: Exact match with disp, m_id, or m_name
    for m_id, m_name, disp in configured_list:
        if raw.lower() in [m_id.lower(), m_name.lower(), disp.lower()]:
            return disp

    # Priority 2: Stripped leading "models/", "openai/", etc.
    cleaned = raw
    if cleaned.startswith("models/"):
        cleaned = cleaned[7:]

    for m_id, m_name, disp in configured_list:
        if cleaned.lower() in [m_id.lower(), m_name.lower(), disp.lower()]:
            return disp

    # Priority 3: Exact suffix match without provider prefix
    raw_suffix = cleaned.split("/")[-1].lower() if "/" in cleaned else cleaned.lower()
    for m_id, m_name, disp in configured_list:
        disp_suffix = disp.split("/")[-1].lower() if "/" in disp else disp.lower()
        if raw_suffix == disp_suffix:
            return disp

    return cleaned


def get_active_chat_llm(
    db: Session,
    requested_model: Optional[str] = None,
    override_timeout: Optional[float] = None,
) -> ChatOpenAI:
    """
    Fetch the active Chat Model Provider from database and initialize ChatOpenAI.
    Raises ValueError if no active provider or valid API Key is configured.
    """
    provider = None
    target_model_name = None

    active_providers = db.query(ModelProvider).filter(
        ModelProvider.category == "chat",
        ModelProvider.is_active == True,
    ).all()

    if requested_model and requested_model.strip():
        req = requested_model.strip()

        # Priority 1: Match req directly with an ID/name in any provider's configured_models
        for p in active_providers:
            config_dict = p.config if isinstance(p.config, dict) else {}
            configured = config_dict.get("configured_models", [])
            if isinstance(configured, list):
                for m in configured:
                    if isinstance(m, dict):
                        m_id = str(m.get("id") or "").strip()
                        m_name = str(m.get("name") or "").strip()
                        if req.lower() in [m_id.lower(), m_name.lower()]:
                            provider = p
                            target_model_name = m_name or m_id or req
                            break
            if provider:
                break

        # Priority 2: Match by provider prefix 
        if not provider and "/" in req:
            parts = req.split("/", 1)
            p_prefix, m_suffix = parts[0].strip(), parts[1].strip()

            for p in active_providers:
                if p.name.lower() == p_prefix.lower() or (p.provider_type and p.provider_type.lower() == p_prefix.lower()):
                    provider = p
                    break

            if provider:
                config_dict = provider.config if isinstance(provider.config, dict) else {}
                configured = config_dict.get("configured_models", [])
                if isinstance(configured, list):
                    for m in configured:
                        if isinstance(m, dict):
                            m_id = str(m.get("id") or "").strip()
                            m_name = str(m.get("name") or "").strip()
                            if m_suffix.lower() in [m_id.lower(), m_name.lower()]:
                                target_model_name = m_name or m_id
                                break
                            elif req.lower() in [m_id.lower(), m_name.lower()]:
                                target_model_name = m_name or m_id
                                break
                if not target_model_name:
                    target_model_name = m_suffix

        # Priority 3: Match provider by name or provider_type with full req
        if not provider:
            for p in active_providers:
                if p.name.lower() == req.lower() or (p.provider_type and p.provider_type.lower() == req.lower()):
                    provider = p
                    target_model_name = p.model_name
                    break

    # Priority 4: Fallback to default provider or first active provider
    if not provider:
        provider = next((p for p in active_providers if p.is_default), None)
    if not provider and active_providers:
        provider = active_providers[0]

    if not provider:
        raise ValueError("Model provider is not configured. Please set up a model provider in Dashboard > Providers.")

    if not provider.api_key or not provider.api_key.strip():
        raise ValueError("Model provider is missing an API key. Please enter an API key in Dashboard > Providers.")

    config_dict = provider.config if isinstance(provider.config, dict) else {}
    configured = config_dict.get("configured_models", [])
    active_m = next((m for m in configured if isinstance(m, dict) and m.get("is_active") != False), None)

    if not target_model_name or target_model_name.lower() == "deepseek-v4-pro":
        if active_m and (active_m.get("name") or active_m.get("id")):
            target_model_name = str(active_m.get("name") or active_m.get("id")).strip()
        elif provider.model_name and provider.model_name.lower() != "deepseek-v4-pro":
            target_model_name = provider.model_name
        else:
            target_model_name = provider.model_name or ""

    base_url = (provider.base_url or "").rstrip("/")
    if not base_url:
        p_type = (provider.provider_type or "").lower()
        if p_type in ["openai", "openai_compatible", "deepseek", "openrouter"]:
            base_url = "https://api.openai.com/v1"
        elif p_type == "ollama":
            base_url = "http://localhost:11434/v1"
        elif p_type == "gemini":
            base_url = "https://generativelanguage.googleapis.com/v1beta"
        else:
            base_url = "https://api.openai.com/v1"

    base_url = resolve_docker_url(base_url) or base_url

    config_dict = provider.config if isinstance(provider.config, dict) else {}
    configured = config_dict.get("configured_models", [])

    # Check if target model has specific temperature or reasoning_effort setting in configured_models
    model_temp = None
    model_reasoning_effort = None
    target_clean = (target_model_name or "").strip().lower()
    req_clean = (requested_model or "").strip().lower()

    if isinstance(configured, list):
        for m in configured:
            if isinstance(m, dict):
                m_id = str(m.get("id") or "").strip().lower()
                m_name = str(m.get("name") or "").strip().lower()
                if (req_clean and (req_clean == m_id or req_clean == m_name or req_clean.endswith("/" + m_name) or req_clean.endswith("/" + m_id))) or \
                   (target_clean and (target_clean == m_id or target_clean == m_name or target_clean.endswith("/" + m_name) or target_clean.endswith("/" + m_id))):
                    raw_temp = m.get("temperature")
                    if raw_temp is not None:
                        try:
                            model_temp = float(raw_temp)
                        except (ValueError, TypeError):
                            model_temp = None
                    if m.get("reasoning_effort"):
                        r_eff = str(m.get("reasoning_effort")).strip().lower()
                        if r_eff and r_eff != "default":
                            model_reasoning_effort = r_eff
                    break

    # Default temperature fallback logic (Kimi/Reasoning models require temperature=1.0)
    default_temp = 0.3
    if any(k in target_clean for k in ["kimi", "k2.6", "o1", "o3", "deepseek-r1"]) or any(k in req_clean for k in ["kimi", "k2.6", "o1", "o3", "deepseek-r1"]):
        default_temp = 1.0

    temp = default_temp
    if model_temp is not None:
        temp = model_temp
    elif config_dict.get("temperature") is not None:
        try:
            temp = float(config_dict.get("temperature"))
        except (ValueError, TypeError):
            temp = default_temp

    timeout_sec = 120.0
    if override_timeout is not None and float(override_timeout) > 0:
        timeout_sec = float(override_timeout)
    elif config_dict.get("timeout") is not None:
        try:
            timeout_sec = float(config_dict.get("timeout"))
        except (ValueError, TypeError):
            timeout_sec = 120.0

    proxy_url = resolve_docker_url(config_dict.get("proxy")) if config_dict.get("proxy") else None

    llm_kwargs = {
        "model": target_model_name,
        "openai_api_key": provider.api_key,
        "openai_api_base": base_url,
        "temperature": temp,
        "streaming": False,
        "request_timeout": timeout_sec,
    }
    if proxy_url:
        llm_kwargs["openai_proxy"] = proxy_url
    if model_reasoning_effort:
        llm_kwargs["reasoning_effort"] = model_reasoning_effort

    return ChatOpenAI(**llm_kwargs)


def extract_provider_message(err_msg: str) -> str:
    """Extract actionable detail message from raw exception string."""
    if not err_msg or not isinstance(err_msg, str):
        return ""
    try:
        match = re.search(r"['\"]message['\"]\s*:\s*['\"]([^'\"]+)['\"]", err_msg)
        if match:
            msg = match.group(1).replace("\\n", " ").strip()
            if len(msg) > 5:
                return msg
    except re.error:
        return ""
    return ""
