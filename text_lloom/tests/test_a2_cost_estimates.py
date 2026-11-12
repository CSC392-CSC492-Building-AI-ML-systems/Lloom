# A2: the cost estimators return their estimate (not just print it) and don't crash on models with no price.
import math

import pandas as pd
import pytest

import text_lloom.workbench as wb
from text_lloom.llm import Model

PARAMS = {"filter_n_quotes": 2, "summ_n_bullets": 2, "synth_n_concepts": 3}
GEN_STEPS = {"distill_filter", "distill_summarize", "cluster", "synthesize", "review"}


@pytest.fixture
def session(monkeypatch):
    # Default OpenAI models, which all have prices in MODEL_INFO. No call is made.
    monkeypatch.delenv("LLM_BASE_URL", raising=False)
    monkeypatch.setenv("OPENAI_API_KEY", "k")
    df = pd.DataFrame({"id": ["1", "2", "3"], "text": ["The delivery was late.", "Great food.", "Rude staff and cold food."]})
    return wb.lloom(df=df, text_col="text", id_col="id")


def unpriced_model():
    # A plain Model: no `cost` attribute at all, e.g. a custom model
    return Model("custom", setup_fn=lambda api_key: None, fn=None)


def total_of(est):
    return sum(in_cost + out_cost for in_cost, out_cost in est["steps"].values())


# estimate_gen_cost ================================

def test_gen_estimate_returns_every_step_and_total(session):
    est = session.estimate_gen_cost(PARAMS)
    assert set(est["steps"]) == GEN_STEPS
    assert est["total"] > 0
    assert math.isclose(est["total"], total_of(est))
    assert est["available"] is True


def test_gen_estimate_with_no_prices_does_not_crash(session):
    # e.g. Ollama with no LLM_COST set: OpenAIModel keeps cost=None
    for model in (session.distill_model, session.cluster_model, session.synth_model):
        model.cost = None
    est = session.estimate_gen_cost(PARAMS)
    assert est == {"steps": {}, "total": 0, "available": False}


def test_gen_estimate_with_unpriced_distill_still_estimates_the_rest(session):
    # Used to crash: the cluster step read bullets_tokens_per_doc, which only the distill step set
    session.distill_model = unpriced_model()
    est = session.estimate_gen_cost(PARAMS)
    assert set(est["steps"]) == {"cluster", "synthesize", "review"}
    assert math.isclose(est["total"], total_of(est))
    assert est["available"] is False  # partial estimate: not every step has a price


# estimate_score_cost ================================

def test_score_estimate_returns_total(session):
    est = session.estimate_score_cost(n_concepts=2, df_to_score=session.in_df)
    assert set(est["steps"]) == {"score"}
    assert est["total"] > 0
    assert math.isclose(est["total"], total_of(est))
    assert est["available"] is True


def test_score_estimate_without_df_uses_the_session_df(session):
    # Used to crash: len(df_to_score) ran before the `df_to_score is None` check
    assert session.estimate_score_cost(n_concepts=2) == session.estimate_score_cost(n_concepts=2, df_to_score=session.df_to_score)


@pytest.mark.parametrize("make_unpriced", [
    lambda s: setattr(s.score_model, "cost", None),
    lambda s: setattr(s, "score_model", unpriced_model()),
], ids=["cost_none", "no_cost_attr"])
def test_score_estimate_with_no_price_does_not_crash(session, make_unpriced):
    make_unpriced(session)
    est = session.estimate_score_cost(n_concepts=2, df_to_score=session.in_df)
    assert est == {"steps": {}, "total": 0, "available": False}
