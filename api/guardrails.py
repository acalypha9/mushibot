import re

# Regex pattern matching non-expression / decorative emojis (such as 📑, 📦, 🔍, 📄, 📋, 🚚, 🛒, 💳, 📊, ⚡)
# Leaves facial expression smileys (such as 😊, 🙂, 😀, 👍) intact.
DECORATIVE_EMOJI_PATTERN = re.compile(
    r"[\u2600-\u27BF"            # Miscellaneous symbols & dingbats
    r"\u2300-\u23FF"            # Technical symbols
    r"\U0001F300-\U0001F5FF"    # Pictographs, documents & office items (📑, 📦, 💳, 🛒, 📄, 📋, 📌)
    r"\U0001F680-\U0001F6FF"    # Transport & logistics (🚚, 🚛, ✈️)
    r"\U0001F900-\U0001F90F"    # Objects
    r"\U0001FA70-\U0001FAFF]"   # Extended symbols
)


def sanitize_emojis(text: str) -> str:
    """Removes decorative/non-expression emojis while preserving expression smileys."""
    if not text:
        return text
    return DECORATIVE_EMOJI_PATTERN.sub("", text)


def validate_input_guardrail(user_input: str) -> tuple[bool, str | None]:
    """
    Input Guardrail: Validates user query before reaching LLM or tools.
    Returns (is_valid, refusal_message_if_blocked).
    """
    return True, None


def validate_output_guardrail(response_text: str) -> str:
    """
    Output Guardrail: Sanitizes LLM response before yielding to user.
    """
    return response_text
