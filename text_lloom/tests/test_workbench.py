# Tests for how lloom picks its models (no network calls are made).
import pandas as pd

import text_lloom.workbench as wb

URL = "http://localhost:11434/v1/"
CUSTOM_ENV = {
    "LLM_BASE_URL": URL, "LLM_API_KEY": "k", "LLM_MODEL": "llama3.1:8b", "LLM_EMBED_MODEL": "nomic-embed-text",
    "LLM_CONTEXT_WINDOW": "8192", "LLM_COST": "0,0", "LLM_EMBED_COST": "0,0", "LLM_RATE_LIMIT": "1000,0",
}
ENV_VARS = [*CUSTOM_ENV, "OPENAI_API_KEY"]


def make_lloom(monkeypatch, env, **models):
    # Start from a clean environment, so the machine's own settings cannot change the result
    for var in ENV_VARS:
        monkeypatch.delenv(var, raising=False)
    for var, value in env.items():
        monkeypatch.setenv(var, value)
    df = pd.DataFrame({"id": ["1"], "text": ["a b c."]})
    return wb.lloom(df=df, text_col="text", id_col="id", **models)


def model_names(lloom):
    models = (lloom.distill_model, lloom.cluster_model, lloom.synth_model, lloom.score_model)
    return [model.name for model in models]


def test_lloom_uses_the_openai_models_when_no_base_url_is_set(monkeypatch):
    lloom = make_lloom(monkeypatch, {"OPENAI_API_KEY": "k"})
    assert model_names(lloom) == ["gpt-4o-mini", "text-embedding-3-large", "gpt-4o", "gpt-4o-mini"]
    assert "api.openai.com" in str(lloom.score_model.client.base_url)


def test_lloom_builds_its_models_from_the_env_settings(monkeypatch):
    lloom = make_lloom(monkeypatch, CUSTOM_ENV)
    assert model_names(lloom) == ["llama3.1:8b", "nomic-embed-text", "llama3.1:8b", "llama3.1:8b"]
    assert str(lloom.cluster_model.client.base_url) == URL


def test_lloom_keeps_a_model_you_pass_and_builds_the_rest_from_the_env(monkeypatch):
    mine = object()
    lloom = make_lloom(monkeypatch, CUSTOM_ENV, distill_model=mine)
    assert lloom.distill_model is mine
    assert lloom.score_model.name == "llama3.1:8b"


def test_lloom_does_not_read_the_env_settings_when_all_models_are_passed(monkeypatch):
    mine = object()
    # The settings are incomplete, so reading them would raise an error
    lloom = make_lloom(
        monkeypatch, {"LLM_BASE_URL": URL},
        distill_model=mine, cluster_model=mine, synth_model=mine, score_model=mine,
    )
    assert lloom.score_model is mine
