import asyncio
import sys

from chat_models import get_active_chat_llm
from langchain_core.messages import HumanMessage
from sqlalchemy.orm import Session


def _resolve_llm(db: Session):
    chat_mod = sys.modules.get("chat")
    if chat_mod and hasattr(chat_mod, "get_active_chat_llm") and chat_mod.get_active_chat_llm is not get_active_chat_llm:
        return chat_mod.get_active_chat_llm(db)
    return get_active_chat_llm(db)


async def generate_conversation_title(user_prompt: str, db: Session, ai_response: str = "") -> str:
    """
    Generate a short, descriptive 3 to 6 word conversation title
    from the user query.
    """
    try:
        llm = _resolve_llm(db)
        if ai_response:
            prompt_text = (
                "Summarize the main topic of this conversation into a concise 2 to 5 word title.\n"
                "Rules:\n"
                "- Output ONLY the title text, no quotation marks, no period at end, Title Case.\n"
                "- Base the title strictly on the actual conversation content below.\n"
                "- Do NOT hallucinate video game titles, brand names, or external media.\n"
                "- For simple greetings or introductions, use 'General Inquiry' or 'Greeting'.\n\n"
                f"User: {user_prompt[:200]}\n"
                f"Assistant: {ai_response[:200]}"
            )
        else:
            prompt_text = (
                "Summarize the main topic of this user query into a concise 2 to 5 word title.\n"
                "Rules:\n"
                "- Output ONLY the title text, no quotation marks, no period at end, Title Case.\n"
                "- Base the title strictly on the actual user query below.\n"
                "- Do NOT hallucinate video game titles, brand names, or external media.\n"
                "- For simple greetings or introductions, use 'General Inquiry' or 'Greeting'.\n\n"
                f"User query: {user_prompt[:300]}"
            )
        res = await asyncio.to_thread(llm.invoke, [HumanMessage(content=prompt_text)])
        raw_title = str(res.content).strip().strip('"').strip("'").strip(".").strip()
        if raw_title and len(raw_title) >= 3 and not raw_title.startswith("{") and not raw_title.startswith("["):
            title = " ".join(raw_title.split())
            return title[:60]
    except Exception as err:
        err_str = str(err)
        if "503" in err_str or "UNAVAILABLE" in err_str or "high demand" in err_str.lower():
            print("[TITLE GEN WARN] Model high demand (503), using prompt fallback title.", file=sys.stderr, flush=True)
        else:
            print(f"[TITLE GEN WARN] Title generation skipped ({err_str}), using fallback title.", file=sys.stderr, flush=True)

    clean = user_prompt.strip().replace("\n", " ")
    if len(clean) > 35:
        clean = clean[:32] + "..."
    return clean.title() if clean else "New Conversation"
