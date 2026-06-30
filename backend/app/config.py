import os
from functools import lru_cache


@lru_cache
def get_settings() -> "Settings":
    return Settings()


class Settings:
    def __init__(self) -> None:
        self.openai_api_key: str | None = os.getenv("OPENAI_API_KEY")
        self.openai_base_url: str | None = os.getenv("OPENAI_BASE_URL")
        self.openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.gemini_api_key: str | None = os.getenv("GEMINI_API_KEY")
        self.assemblyai_api_key: str | None = os.getenv("ASSEMBLYAI_API_KEY")
        self.gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        self.groq_api_key: str | None = os.getenv("GROQ_API_KEY")
        self.groq_model: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.llm_provider: str = os.getenv("LLM_PROVIDER", "openai").lower()
        # A real provider is configured if we have an API key, or the user
        # explicitly selected Ollama (local). Otherwise default to the mock.
        has_real_provider = (
            bool(self.openai_api_key)
            or bool(self.gemini_api_key)
            or bool(self.groq_api_key)
            or self.llm_provider == "ollama"
        )
        self.llm_mock: bool = os.getenv(
            "LLM_MOCK", "false" if has_real_provider else "true"
        ).lower() == "true"
        self.ollama_host: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        self.ollama_model: str = os.getenv("OLLAMA_MODEL", "llama3.2:latest")
        self.summary_window_tokens: int = int(os.getenv("SUMMARY_WINDOW_TOKENS", "1500"))
        self.database_url: str | None = os.getenv("DATABASE_URL")
        self.knowledge_data_dir: str = os.getenv("KNOWLEDGE_DATA_DIR", "data/knowledge")