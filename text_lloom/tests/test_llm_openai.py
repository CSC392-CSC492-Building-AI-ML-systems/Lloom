# Tests for the helpers in llm_openai.py (no network calls are made).
from types import SimpleNamespace

import pytest

from text_lloom.llm_openai import (
    count_tokens_fn,
    setup_embed_fn,
    setup_llm_fn,
    truncate_tokens_fn,
)

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


# The token helpers only read `name` and `context_window`, so a full Model is not needed
def make_model(name, context_window=100):
    return SimpleNamespace(name=name, context_window=context_window)


# gpt-4o and the fallback encoding give different counts for this text (9 vs 16)
JAPANESE_TEXT = "こんにちは世界、今日はいい天気ですね。"


def test_count_tokens_works_for_model_names_tiktoken_does_not_know():
    assert count_tokens_fn(make_model("llama3.1:8b"), "hello world") > 0


def test_count_tokens_keeps_the_models_own_encoding_when_known():
    assert count_tokens_fn(make_model("gpt-4o"), JAPANESE_TEXT) == 9


def test_truncate_tokens_respects_the_limit_for_unknown_model_names():
    model = make_model("llama3.1:8b", context_window=60)
    truncated = truncate_tokens_fn(model, "word " * 500, out_token_alloc=10)
    assert 0 < count_tokens_fn(model, truncated) <= 50  # 60 window - 10 reserved for output
