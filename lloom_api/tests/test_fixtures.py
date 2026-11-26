# the shared fixtures in conftest.py work with no LLM calls and no API key
import asyncio
import pickle

import pandas as pd

import text_lloom.workbench as wb

MODEL_NAMES = {"distill_model", "cluster_model", "synth_model", "score_model"}
PARAMS = {"filter_n_quotes": 2, "summ_n_bullets": 2, "synth_n_concepts": 2}


# How many scores failed (NaN), across every concept
def n_failed(session):
    return sum(int(score_df["score"].isna().sum()) for score_df in session.results.values())


def test_fake_models_are_priced_and_fresh(fake_models):
    first, second = fake_models(), fake_models()
    assert set(first) == MODEL_NAMES
    assert all(model.cost is not None for model in first.values())
    assert all(first[name] is not second[name] for name in MODEL_NAMES)


def test_fake_run_gens_and_scores_without_an_llm(fake_models, fake_run):
    df = pd.DataFrame({"id": ["1", "2", "3"], "text": ["Late delivery.", "Great food.", "Cold soup."]})
    session = wb.lloom(df=df, text_col="text", id_col="id", **fake_models())
    steps = []
    progress = lambda step, done, total: steps.append(step)

    asyncio.run(session.gen(params=PARAMS, n_synth=2, debug=False, progress=progress))
    asyncio.run(session.score(score_all=True, debug=False, progress=progress))

    assert len(session.concepts) == 2
    assert set(session.results) == set(session.concepts)
    assert n_failed(session) == 1
    assert set(steps) == {"Distill-filter", "Distill-summarize", "Cluster", "Synthesize", "Review", "Score"}


def test_scored_session_survives_pickle(scored_session):
    assert n_failed(scored_session) == 1
    assert pd.api.types.is_numeric_dtype(scored_session.in_df["rating"])
    assert scored_session.in_df["source"].nunique() <= 3

    loaded = pickle.loads(scored_session.get_pkl_str())
    assert set(loaded.concepts) == set(scored_session.concepts)
    assert set(loaded.results) == set(scored_session.concepts)
    assert n_failed(loaded) == 1
