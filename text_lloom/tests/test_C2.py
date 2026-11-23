import asyncio

import pytest

from text_lloom.llm import Model, multi_query_gpt_wrapper


# A fake model: no OpenAI client, no network. `fn` is what normally calls the LLM.
def fake_model(fn, rate_limit=None, max_attempts=None):
    model = Model("fake", setup_fn=lambda api_key: None, fn=fn, rate_limit=rate_limit)
    if max_attempts is not None:
        model.max_attempts = max_attempts
    return model


def run(model, arg_dicts, prompt_template="Say {x}", batch_num=None):
    return asyncio.run(multi_query_gpt_wrapper(prompt_template, arg_dicts, model, batch_num=batch_num))


# A fake LLM call that always succeeds.
async def ok_fn(model, prompt):
    return "ok", (1, 1)


# Records each asyncio.sleep wait time instead of actually waiting.
@pytest.fixture
def sleeps(monkeypatch):
    waits = []

    async def fake_sleep(delay, *args, **kwargs):
        waits.append(delay)

    monkeypatch.setattr(asyncio, "sleep", fake_sleep)
    return waits


# Looks like a provider HTTP error (openai and anthropic both expose .status_code).
class FakeStatusError(Exception):
    def __init__(self, status_code):
        super().__init__(f"HTTP {status_code}")
        self.status_code = status_code


# Same class name as openai's timeout error, which has no status code.
class APITimeoutError(Exception):
    pass


TEMPORARY_ERRORS = [FakeStatusError(429), FakeStatusError(503), TimeoutError(), ConnectionError(), APITimeoutError()]
PERMANENT_ERRORS = [FakeStatusError(400), FakeStatusError(401), ValueError("boom")]


# Retries ---

@pytest.mark.parametrize("error", TEMPORARY_ERRORS)
def test_temporary_error_is_retried(sleeps, error):
    calls = []

    async def fn(model, prompt):
        calls.append(prompt)
        if len(calls) == 1:
            raise error
        return "ok", (1, 1)

    texts, tokens = run(fake_model(fn), [{"x": "a"}])
    assert len(calls) == 2
    assert texts == ("ok",)
    assert tuple(tokens) == (1, 1)


def test_gives_up_after_max_attempts_and_returns_none(sleeps, capsys):
    calls = []

    async def fn(model, prompt):
        calls.append(prompt)
        raise FakeStatusError(429)

    texts, tokens = run(fake_model(fn, max_attempts=3), [{"x": "a"}])
    assert len(calls) == 3
    assert len(sleeps) == 2 # waits between attempts
    assert sleeps[0] < sleeps[1] # each wait is longer than the last
    assert texts == (None,)
    assert tuple(tokens) == (0, 0)
    assert "Warning" in capsys.readouterr().out


@pytest.mark.parametrize("error", PERMANENT_ERRORS)
def test_permanent_error_is_not_retried(sleeps, error):
    calls = []

    async def fn(model, prompt):
        calls.append(prompt)
        raise error

    texts, tokens = run(fake_model(fn), [{"x": "a"}])
    assert len(calls) == 1
    assert texts == (None,)
    assert sleeps == []


def test_missing_prompt_key_never_calls_the_model(sleeps):
    calls = []

    async def fn(model, prompt):
        calls.append(prompt)
        return "ok", (1, 1)

    texts, tokens = run(fake_model(fn), [{"x": "a"}], prompt_template="Say {missing}")
    assert calls == []
    assert texts == (None,)
    assert sleeps == []


# Spacing requests out ---

def test_spacing_without_batch_num_is_unchanged(sleeps):
    run(fake_model(ok_fn, rate_limit=(2, 10)), [{"x": i} for i in range(6)])
    assert sleeps == [0, 0, 10, 10, 20, 20]


def test_spacing_with_batch_num_staggers_requests(sleeps):
    run(fake_model(ok_fn, rate_limit=(2, 10)), [{"x": i} for i in range(6)], batch_num=1)
    assert sleeps == [30, 30, 40, 40, 50, 50]


def test_concurrent_concepts_never_exceed_rate_limit(sleeps):
    model = fake_model(ok_fn, rate_limit=(2, 10))
    arg_dicts = [{"x": i} for i in range(6)]

    async def score_three_concepts():
        await asyncio.gather(*[multi_query_gpt_wrapper("Say {x}", arg_dicts, model, batch_num=i) for i in range(3)])

    asyncio.run(score_three_concepts())
    assert all(sleeps.count(t) <= 2 for t in sleeps)
