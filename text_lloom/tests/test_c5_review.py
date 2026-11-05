import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import pandas as pd
from text_lloom.workbench import lloom


@pytest.mark.asyncio
async def test_c5_review_runs_when_debug_false():
    """C5: concept review must run even when debug=False."""

    df = pd.DataFrame({
        "id": [1, 2],
        "text": ["example one", "example two"]
    })

    # Fake models so no API key is needed
    fake_model = MagicMock()
    fake_model.name = "fake"
    fake_embed = MagicMock()
    fake_embed.name = "fake-embed"

    l = lloom(
        df=df,
        text_col="text",
        id_col="id",
        distill_model=fake_model,
        cluster_model=fake_embed,
        synth_model=fake_model,
        score_model=fake_model,
        debug=False,
    )

    review_calls = {"count": 0}


    synth_df = pd.DataFrame({
        "id": [1, 2],
        "text": ["example one", "example two"],
        "concept_name": ["Concept A", "Concept B"],
        "concept_prompt": ["Prompt A", "Prompt B"],
    })

    async def fake_review(*args, **kwargs):
        review_calls["count"] += 1
        # Return a DataFrame that has the columns the rest of gen() needs
        return {}, synth_df.copy(), "fake review logs"

    with patch("text_lloom.workbench.distill_filter", new_callable=AsyncMock) as mock_filter, \
         patch("text_lloom.workbench.distill_summarize", new_callable=AsyncMock) as mock_summ, \
         patch("text_lloom.workbench.cluster", new_callable=AsyncMock) as mock_cluster, \
         patch("text_lloom.workbench.synthesize", new_callable=AsyncMock) as mock_synth, \
         patch("text_lloom.workbench.review", side_effect=fake_review):

        mock_filter.return_value = df
        mock_summ.return_value = df
        mock_cluster.return_value = df

        synth_df = pd.DataFrame({
        "id": [1, 2],
        "text": ["example one", "example two"],
        "concept_name": ["Concept A", "Concept B"],
        "concept_prompt": ["Prompt A", "Prompt B"],
        })
        mock_synth.return_value = (synth_df, "fake synth logs")

        # Case 1: auto_review=True, debug=False → review MUST be called
        review_calls["count"] = 0
        await l.gen(
            auto_review=True,
            debug=False,
            params={"filter_n_quotes": 1, "summ_n_bullets": 1, "synth_n_concepts": 2},
        )
        assert review_calls["count"] == 1, "C5 failed: review() was not called when debug=False"

        # Case 2: auto_review=False → review must NOT be called
        review_calls["count"] = 0
        await l.gen(
            auto_review=False,
            debug=False,
            params={"filter_n_quotes": 1, "summ_n_bullets": 1, "synth_n_concepts": 2},
        )
        assert review_calls["count"] == 0, "review() was called even though auto_review=False"