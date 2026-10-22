import asyncio

import pytest

from text_lloom.llm import Model, OpenAIEmbedModel, OpenAIModel, multi_query_gpt_wrapper


# A fake model: no OpenAI client, no network. `fn` is what normally calls the LLM.
def fake_model(fn):
    return Model("fake", setup_fn=lambda api_key: None, fn=fn)


def run(model, arg_dicts):
    return asyncio.run(multi_query_gpt_wrapper("Say {x}", arg_dicts, model))


def test_results_keep_order_and_tokens_are_summed():
    async def fn(model, prompt):
        return f"echo: {prompt}", (3, 2)

    texts, tokens = run(fake_model(fn), [{"x": "a"}, {"x": "b"}])
    assert texts == ("echo: Say a", "echo: Say b")
    assert tuple(tokens) == (6, 4)


def test_failed_call_returns_none_instead_of_raising():
    async def fn(model, prompt):
        if "bad" in prompt:
            raise ValueError("boom")
        return "ok", (1, 1)

    texts, tokens = run(fake_model(fn), [{"x": "good"}, {"x": "bad"}])
    assert texts == ("ok", None)
    assert tuple(tokens) == (1, 1)


# base_url is passed from the model classes down to the client setup (no network calls are made)
CUSTOM_URL = "http://localhost:9999/v1/"
# Known model names are used on purpose: unknown names are not supported yet
MODEL_CLASSES = [
    (OpenAIModel, "gpt-4o-mini"),
    (OpenAIEmbedModel, "text-embedding-3-small"),
]


@pytest.mark.parametrize("model_cls, name", MODEL_CLASSES)
def test_model_client_uses_the_given_base_url(model_cls, name):
    model = model_cls(name, api_key="k", base_url=CUSTOM_URL)
    assert str(model.client.base_url) == CUSTOM_URL


@pytest.mark.parametrize("model_cls, name", MODEL_CLASSES)
def test_base_url_is_not_swallowed_into_args(model_cls, name):
    model = model_cls(name, api_key="k", base_url=CUSTOM_URL)
    assert "base_url" not in model.args


@pytest.mark.parametrize("model_cls, name", MODEL_CLASSES)
def test_model_client_defaults_to_openai(model_cls, name, monkeypatch):
    # The openai library also reads OPENAI_BASE_URL, so clear it for a predictable default
    monkeypatch.delenv("OPENAI_BASE_URL", raising=False)
    model = model_cls(name, api_key="k")
    assert "api.openai.com" in str(model.client.base_url)


@pytest.mark.parametrize("model_cls, name", MODEL_CLASSES)
def test_custom_setup_fn_only_receives_base_url_when_given(model_cls, name):
    calls = []

    def recording_setup_fn(*args, **kwargs):
        calls.append((args, kwargs))

    model_cls(name, api_key="k", setup_fn=recording_setup_fn)
    model_cls(name, api_key="k", setup_fn=recording_setup_fn, base_url=CUSTOM_URL)
    assert calls == [
        (("k",), {}),  # old behavior: only the key
        (("k",), {"base_url": CUSTOM_URL}),
    ]


# Models not in our defaults (ex: local ones) need their values given explicitly: nothing is guessed
def test_custom_model_builds_with_explicit_values():
    model = OpenAIModel(
        "llama3.1:8b", api_key="k", base_url=CUSTOM_URL,
        context_window=8192, cost=(0, 0), rate_limit=(1000, 0),
    )
    assert model.context_window == 8192
    assert model.cost == (0, 0)
    assert model.rate_limit == (1000, 0)


@pytest.mark.parametrize("base_url", [None, CUSTOM_URL])
@pytest.mark.parametrize("missing", ["context_window", "cost", "rate_limit"])
def test_unknown_model_missing_a_value_raises_even_with_a_base_url(missing, base_url):
    values = {"context_window": 8192, "cost": (0, 0), "rate_limit": (1000, 0)}
    del values[missing]
    with pytest.raises(Exception, match=f"`{missing}`"):
        OpenAIModel("llama3.1:8b", api_key="k", base_url=base_url, **values)
