# Shared test data. pytest makes every fixture in this file available to all test files.
from types import SimpleNamespace

import pandas as pd
import pytest

import text_lloom.workbench as wb
from text_lloom.concept import Concept
from text_lloom.concept_induction import SCORE_DF_OUT_COLS


@pytest.fixture
def vis_inputs():
    # A tiny scored dataset: 3 documents and 2 concepts.
    # Doc 1 matches "Dogs", doc 2 matches "Cats", doc 3 matches neither (the matrix calls that an "Outlier").
    in_df = pd.DataFrame({
        "doc_id": ["1", "2", "3"],
        "text": ["we love dogs", "cats are fine", "nothing here"],
    })
    dogs = Concept("Dogs", "Is it about dogs?", ["1"], True)
    cats = Concept("Cats", "Is it about cats?", ["2"], True)

    def scores(concept, values):
        rows = [[doc_id, text, concept.id, concept.name, concept.prompt, score, "because", text, None]
                for doc_id, text, score in zip(in_df["doc_id"], in_df["text"], values)]
        return pd.DataFrame(rows, columns=SCORE_DF_OUT_COLS)

    return SimpleNamespace(
        in_df=in_df,
        concepts={dogs.id: dogs, cats.id: cats},
        score_df=pd.concat([scores(dogs, [1.0, 0.0, 0.0]), scores(cats, [0.0, 1.0, 0.0])], ignore_index=True),
        df_filtered=in_df[["doc_id", "text"]].copy(),
        df_bullets=in_df[["doc_id", "text"]].copy(),
    )


@pytest.fixture
def scored_lloom(vis_inputs):
    # A lloom session that already has concepts and scores, built without running any LLM
    mine = object()  # lloom only stores the models, and these tests never call them
    session = wb.lloom(
        df=vis_inputs.in_df, text_col="text", id_col="doc_id",
        distill_model=mine, cluster_model=mine, synth_model=mine, score_model=mine,
    )
    session.concepts = vis_inputs.concepts
    session.df_filtered = vis_inputs.df_filtered
    session.df_bullets = vis_inputs.df_bullets
    session.results = {
        c_id: vis_inputs.score_df[vis_inputs.score_df["concept_id"] == c_id] for c_id in vis_inputs.concepts
    }
    return session
