# pytest makes every fixture in this file available to all test files.
import pandas as pd
import pytest

import text_lloom.concept_induction as ci
import text_lloom.workbench as wb
from text_lloom.concept import Concept
from text_lloom.concept_induction import FAILED_RATIONALE, FAILED_SCORE, SCORE_DF_OUT_COLS
from text_lloom.llm import OpenAIEmbedModel, OpenAIModel


@pytest.fixture
def fake_models():
    # Use as create_app(get_models=fake_models).
    # New ones on every call: an AsyncOpenAI client shouldn't be reused across asyncio.run calls.
    def get_models():
        return {
            "distill_model": OpenAIModel("gpt-4o-mini", api_key="test-key"),
            "cluster_model": OpenAIEmbedModel("text-embedding-3-large", api_key="test-key"),
            "synth_model": OpenAIModel("gpt-4o", api_key="test-key"),
            "score_model": OpenAIModel("gpt-4o-mini", api_key="test-key"),
        }
    return get_models


 # Standins for LLM steps, gen() and score() make no LLM calls.
@pytest.fixture
def fake_run(monkeypatch):
    # They patch module attributes, so they also apply in the JobManager's worker thread.

    # Stands in for distill and cluster.
    async def passthrough(text_df, **kwargs):
        return text_df

    # Stands in for concept generation. makes fixed concepts (Delivery, Food), adds them to the session.
    async def synthesize(cluster_df, doc_id_col, sess, **kwargs):
        # adds the concepts to sess.concepts and returns their table
        ids = [str(x) for x in cluster_df[doc_id_col]]
        concepts = [
            Concept("Delivery", "Is it about delivery?", ids[:1], active=False),
            Concept("Food", "Is it about the food?", ids[1:2], active=False),
        ]
        for c in concepts:
            sess.concepts[c.id] = c
        table = pd.DataFrame({
            doc_id_col: [(c.example_ids or [""])[0] for c in concepts],
            "concept_name": [c.name for c in concepts],
            "concept_prompt": [c.prompt for c in concepts],
        })
        return table, ""

    async def review(concept_df, **kwargs):
        return None, concept_df, ""

    # Stands in for scoring one concept.
    async def score_helper(concept, batch_i, concept_id, df, text_col, doc_id_col, model, batch_size, get_highlights, sess, threshold):
        # 1.0 for the concept's examples, 0.0 for the rest. The first concept's first doc fails.
        rows = []
        for i, (doc_id, text) in enumerate(zip(df[doc_id_col], df[text_col])):
            failed = batch_i == 0 and i == 0
            score = FAILED_SCORE if failed else float(doc_id in concept.example_ids)
            rationale = FAILED_RATIONALE if failed else "because"
            rows.append([doc_id, text, concept_id, concept.name, concept.prompt, score, rationale, "", concept.seed])
        sess.results[concept_id] = pd.DataFrame(rows, columns=SCORE_DF_OUT_COLS)
        return sess.results[concept_id]


    for name in ("distill_filter", "distill_summarize", "cluster"):
        monkeypatch.setattr(wb, name, passthrough)
    monkeypatch.setattr(wb, "synthesize", synthesize)
    monkeypatch.setattr(wb, "review", review)
    monkeypatch.setattr(ci, "score_helper", score_helper)


# A session that already has concepts and scores.
@pytest.fixture
def scored_session(fake_models):
    in_df = pd.DataFrame({
        "doc_id": ["1", "2", "3", "4", "5"],
        "text": ["The delivery was late.", "Great food.", "Delivery took an hour.", "Rude staff.", "Nice place."],
        "rating": [1, 5, 2, 2, 4],
        "source": ["app", "web", "app", "web", "app"],
    })
    # Delivery matches docs 1 and 3. Food matches nothing (doc 2 failed to score), so its summary is empty.
    delivery = Concept("Delivery", "Is it about delivery?", ["1", "3"], True, summary="Deliveries are often late.")
    food = Concept("Food", "Is it about the food?", ["2"], True, summary="")

    # Build one concept's score table
    def scores(concept, values, highlights):
        rows = [[doc_id, text, concept.id, concept.name, concept.prompt, score,
                 FAILED_RATIONALE if pd.isna(score) else "because", highlight, None]
                for doc_id, text, score, highlight in zip(in_df["doc_id"], in_df["text"], values, highlights)]
        return pd.DataFrame(rows, columns=SCORE_DF_OUT_COLS)

    session = wb.lloom(df=in_df, text_col="text", id_col="doc_id", **fake_models())
    session.concepts = {delivery.id: delivery, food.id: food}
    session.df_filtered = in_df[["doc_id", "text"]].copy()
    session.df_bullets = in_df[["doc_id", "text"]].copy()
    session.results = {
        delivery.id: scores(delivery, [1.0, 0.0, 1.0, 0.0, 0.0], ["delivery was late", "", "took an hour", "", ""]),
        # Doc 2 failed to score
        food.id: scores(food, [0.0, FAILED_SCORE, 0.0, 0.0, 0.0], [""] * 5),
    }
    return session
