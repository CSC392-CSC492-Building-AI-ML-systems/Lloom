# Tests for the client setup helpers in llm_openai.py (no network calls are made).
import pytest

from text_lloom.llm_openai import setup_embed_fn, setup_llm_fn

CUSTOM_URL = "http://localhost:9999/v1/"


@pytest.mark.parametrize("setup_fn", [setup_llm_fn, setup_embed_fn])
def test_setup_fn_uses_the_given_base_url(setup_fn):
    client = setup_fn("k", base_url=CUSTOM_URL)
    assert str(client.base_url) == CUSTOM_URL


@pytest.mark.parametrize("setup_fn", [setup_llm_fn, setup_embed_fn])
def test_setup_fn_defaults_to_openai(setup_fn, monkeypatch):
    # The openai library also reads OPENAI_BASE_URL, so clear it for a predictable default
    monkeypatch.delenv("OPENAI_BASE_URL", raising=False)
    client = setup_fn("k")
    assert "api.openai.com" in str(client.base_url)
