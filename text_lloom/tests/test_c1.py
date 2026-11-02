# Bug C1: failed or unparseable LLM responses must not look like real results.
# A failed score should be NaN (not 0, which means a real "no match"),
# and distill/synthesize should warn when they drop failed responses.
import asyncio
import math

import pandas as pd

from text_lloom.concept import Concept
from text_lloom.concept_induction import (
    distill_filter,
    distill_summarize,
    get_score_df,
    parse_bucketed_score,
    score_helper,
    synthesize,
)
from text_lloom.llm import Model


# A fake model: no OpenAI client, no network. Replies "garbage" to any prompt containing BAD.
def fake_model(good_reply):
    async def fn(model, prompt):
        return ("garbage" if "BAD" in prompt else good_reply), (1, 1)
    return Model("fake", setup_fn=lambda api_key: None, fn=fn)


def docs(*texts):
    return pd.DataFrame({"id": [str(i + 1) for i in range(len(texts))], "text": list(texts)})


CONCEPT = Concept("c", "Does it match?", [], True)


def score(res, df=None):
    df = docs("hello") if df is None else df
    return get_score_df(res, df, CONCEPT, "c1", "text", "id", get_highlights=False)


# Scoring --------------------------------------------------------------------
def test_unparseable_reply_scores_nan():
    out = score("garbage")
    assert out["score"].isna().all()
    assert (out["rationale"] != "").all()  # says why it failed


def test_failed_call_scores_nan():
    # multi_query_gpt_wrapper returns None for a call that raised
    assert score(None)["score"].isna().all()


def test_missing_answer_scores_nan():
    out = score('{"pattern_results": [{"example_id": "1"}]}')
    assert out["score"].isna().all()


def test_unknown_letter_scores_nan():
    assert math.isnan(parse_bucketed_score("Z"))


def test_real_no_match_still_zero():
    out = score('{"pattern_results": [{"example_id": "1", "answer": "E", "rationale": "no"}]}')
    assert out["score"].tolist() == [0.0]


def test_score_helper_missing_docs_nan():
    # LLM only answers for doc 1; doc 2 must be NaN, not 0
    reply = '{"pattern_results": [{"example_id": "1", "answer": "A", "rationale": "yes"}]}'
    df = docs("hello", "world")
    out = asyncio.run(score_helper(
        CONCEPT, 0, "c1", df, "text", "id", fake_model(reply),
        batch_size=2, get_highlights=False, sess=None, threshold=1.0,
    ))
    scores = dict(zip(out["doc_id"], out["score"]))
    assert scores["1"] == 1.0
    assert math.isnan(scores["2"])


# Distill / synthesize: dropped responses must be reported ----------------------
def test_distill_filter_warns_on_failures(capsys):
    out = asyncio.run(distill_filter(
        docs("good text", "BAD text"), "text", "id", fake_model('{"relevant_quotes": ["q"]}'),
    ))
    assert out["id"].tolist() == ["1"]  # good doc kept
    assert "1/2" in capsys.readouterr().out


def test_distill_summarize_warns_on_failures(capsys):
    out = asyncio.run(distill_summarize(
        docs("good text", "BAD text"), "text", "id", fake_model('{"bullets": ["b"]}'),
    ))
    assert out["id"].tolist() == ["1"]
    assert "1/2" in capsys.readouterr().out


def test_synthesize_warns_on_failures(capsys):
    cluster_df = pd.DataFrame({
        "id": ["1", "2"],
        "text": ["good text", "BAD text"],
        "cluster_id": [0, 1],
    })
    reply = '{"patterns": [{"name": "n", "prompt": "p", "example_ids": ["1"]}]}'
    out = asyncio.run(synthesize(cluster_df, "text", "id", fake_model(reply), dedupe=False))
    assert len(out) == 1  # good cluster kept
    assert "1/2" in capsys.readouterr().out
