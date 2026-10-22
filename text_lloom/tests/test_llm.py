import asyncio

import pytest

from text_lloom.llm import Model, OpenAIEmbedModel, OpenAIModel, build_models, multi_query_gpt_wrapper, parse_pair


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


# parse_pair turns "a,b" settings (ex: from environment variables) into a pair of numbers
@pytest.mark.parametrize("text, kind, expected", [
    ("0,0.5", float, (0.0, 0.5)),
    (" 1000 , 0 ", int, (1000, 0)),  # spaces around values are fine
])
def test_parse_pair_reads_two_numbers(text, kind, expected):
    assert parse_pair(text, "LLM_X", kind) == expected


@pytest.mark.parametrize("text", ["1", "1,2,3"])
def test_parse_pair_rejects_the_wrong_number_of_values(text):
    with pytest.raises(ValueError, match="LLM_X must be two comma-separated values"):
        parse_pair(text, "LLM_X")


def test_parse_pair_rejects_a_decimal_when_whole_numbers_are_needed():
    with pytest.raises(ValueError, match="LLM_X must be two numbers of type int"):
        parse_pair("10.5,0", "LLM_X", int)


@pytest.mark.parametrize("text", ["inf,0", "-5,0"])
def test_parse_pair_rejects_numbers_that_are_not_finite_or_are_negative(text):
    with pytest.raises(ValueError, match="LLM_X must be finite and not negative"):
        parse_pair(text, "LLM_X")


# build_models creates the models LLooM uses from a settings dict
# (the cost values differ on purpose, so a mix-up between chat and embedding cost is visible)
SETTINGS = {
    "base_url": CUSTOM_URL, "api_key": "k",
    "model": "llama3.1:8b", "embed_model": "nomic-embed-text",
    "context_window": 8192, "cost": (0.5, 1.5), "rate_limit": (1000, 0), "embed_cost": (0.25, 0),
}


@pytest.mark.parametrize("role", ["distill_model", "synth_model", "score_model"])
def test_build_models_gives_each_chat_model_the_settings(role):
    model = build_models(SETTINGS)[role]
    assert model.name == "llama3.1:8b"
    assert str(model.client.base_url) == CUSTOM_URL
    assert (model.context_window, model.cost, model.rate_limit) == (8192, (0.5, 1.5), (1000, 0))


def test_build_models_gives_the_embedding_model_the_settings():
    model = build_models(SETTINGS)["cluster_model"]
    assert model.name == "nomic-embed-text"
    assert str(model.client.base_url) == CUSTOM_URL
    assert model.cost == (0.25, 0)


def test_build_models_lists_all_missing_required_settings():
    with pytest.raises(ValueError, match="Missing model settings: api_key, model, embed_model"):
        build_models({"base_url": CUSTOM_URL})


def test_build_models_needs_no_extra_settings_for_models_in_our_defaults():
    settings = {
        "base_url": CUSTOM_URL, "api_key": "k",
        "model": "gpt-4o-mini", "embed_model": "text-embedding-3-small",
    }
    models = build_models(settings)
    assert models["score_model"].context_window == 128000
    assert models["cluster_model"].cost == (0.02 / 1_000_000, 0)


# rate_limit stands for the chat settings (they share one code path), embed_cost is built separately
@pytest.mark.parametrize("omitted", ["rate_limit", "embed_cost"])
def test_build_models_never_guesses_a_missing_setting_for_an_unknown_model(omitted):
    settings = {key: value for key, value in SETTINGS.items() if key != omitted}
    with pytest.raises(Exception, match="not in our defaults"):
        build_models(settings)
