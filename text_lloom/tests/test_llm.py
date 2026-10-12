import asyncio

from text_lloom.llm import Model, multi_query_gpt_wrapper


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
