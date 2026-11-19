# A4: gen() and score() report progress through an optional progress(step, done, total) callback.
import asyncio

import pandas as pd
import pytest

import text_lloom.concept_induction as ci
import text_lloom.workbench as wb
from text_lloom.concept import Concept


@pytest.fixture
def sess(monkeypatch):
    monkeypatch.delenv("LLM_BASE_URL", raising=False)
    monkeypatch.setenv("OPENAI_API_KEY", "k")
    df = pd.DataFrame({"id": ["1", "2"], "text": ["Late delivery.", "Great food."]})
    return wb.lloom(df=df, text_col="text", id_col="id")


def fake_pipeline(monkeypatch):
    # Stand-ins for the gen() steps: return tiny tables, no LLM or embedding calls
    concepts = pd.DataFrame({"id": ["1"], "concept_name": ["Delivery"], "concept_prompt": ["Is it late?"]})

    async def passthrough(text_df, **kwargs):
        return text_df

    async def synthesize(**kwargs):
        return concepts.copy(), ""

    async def review(concept_df, **kwargs):
        return None, concept_df, ""

    for name in ("distill_filter", "distill_summarize", "cluster"):
        monkeypatch.setattr(wb, name, passthrough)
    monkeypatch.setattr(wb, "synthesize", synthesize)
    monkeypatch.setattr(wb, "review", review)


def run_gen(sess, **kwargs):
    calls = []
    asyncio.run(sess.gen(debug=False, progress=lambda *a: calls.append(a), **kwargs))
    return calls


def test_gen_reports_each_step_before_it_runs(sess, monkeypatch):
    fake_pipeline(monkeypatch)
    calls = run_gen(sess, params={"filter_n_quotes": 2, "summ_n_bullets": 2, "synth_n_concepts": 3})
    assert calls == [
        ("Distill-filter", 0, 5),
        ("Distill-summarize", 1, 5),
        ("Cluster", 2, 5),
        ("Synthesize", 3, 5),
        ("Review", 4, 5),
    ]


def test_gen_total_counts_only_the_steps_that_run(sess, monkeypatch):
    # filter_n_quotes=1 skips Distill-filter; auto_review=False skips Review; n_synth=2 repeats Cluster + Synthesize
    fake_pipeline(monkeypatch)
    calls = run_gen(sess, params={"filter_n_quotes": 1, "summ_n_bullets": 2, "synth_n_concepts": 3}, n_synth=2, auto_review=False)
    assert calls == [
        ("Distill-summarize", 0, 5),
        ("Cluster", 1, 5),
        ("Synthesize", 2, 5),
        ("Cluster", 3, 5),
        ("Synthesize", 4, 5),
    ]


def test_score_reports_once_per_concept(sess, monkeypatch):
    async def score_helper(concept, batch_i, concept_id, *args, **kwargs):
        return pd.DataFrame({"concept_id": [concept_id]})
    monkeypatch.setattr(ci, "score_helper", score_helper)

    for name in ("a", "b", "c"):
        c = Concept(name, f"Is it {name}?", [], active=True)
        sess.concepts[c.id] = c

    calls = []
    asyncio.run(sess.score(debug=False, progress=lambda *a: calls.append(a)))
    assert calls == [("Score", 0, 3), ("Score", 1, 3), ("Score", 2, 3), ("Score", 3, 3)]
