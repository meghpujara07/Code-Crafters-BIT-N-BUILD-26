try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ImportError:
    from pydantic import BaseModel, ConfigDict
    class BaseSettings(BaseModel):
        model_config = ConfigDict(extra='ignore')
    def SettingsConfigDict(**kwargs): return ConfigDict(extra='ignore')

class Settings(BaseSettings):
    env: str = 'dev'
    database_url: str = 'postgresql+asyncpg://cloudops:change_me@db:5432/cloudops'
    jwt_secret: str = 'change_me'
    encryption_key: str = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
    cors_origins: str = 'http://localhost:5173'
    seed_on_start: bool = True
    provider_mode: str = 'mock'
    ingestion_interval_seconds: int = 60
    enable_demo_controls: bool = True
    llm_provider: str = 'anthropic'
    llm_api_key: str = ''
    llm_model: str = ''
    internal_api_base: str = 'http://127.0.0.1:8000/api/v1'
    smtp_host: str = ''
    smtp_port: int = 587
    smtp_user: str = ''
    smtp_password: str = ''
    smtp_from: str = ''
    whatsapp_token: str = ''
    whatsapp_phone_number_id: str = ''
    app_version: str = '2.0.0'
    access_token_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 7

    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

    @property
    def cors_origin_list(self) -> list[str]:
        return [x.strip() for x in self.cors_origins.split(',') if x.strip()]

    @property
    def normalized_database_url(self) -> str:
        url = self.database_url
        if url.startswith('postgres://'):
            return 'postgresql+asyncpg://' + url[len('postgres://'):]
        if url.startswith('postgresql://'):
            return 'postgresql+asyncpg://' + url[len('postgresql://'):]
        return url

settings = Settings()
