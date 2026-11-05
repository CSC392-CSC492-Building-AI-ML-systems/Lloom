# C6: a bad concept-review reply must skip that step, not crash the run or corrupt the concepts.
import asyncio
import json

import pandas as pd
import pytest
from test_workbench import make_lloom

import text_lloom.workbench as wb
from text_lloom.concept import Concept
from text_lloom.concept_induction import review, review_merge, review_remove, review_select
from text_lloom.llm import Model

GOOD_MERGE = {"original_themes": ["A", "B"], "merged_theme_name": "N", "merged_theme_prompt": "P"}
GOOD_MERGE_REPLY = json.dumps({"merge": [GOOD_MERGE]})

# {key} is filled with the key each review step expects. None makes the LLM call itself fail.
BAD_REPLIES = {
    "call_failed": None,
    "not_json": "not json",
    "missing_key": '{{"foo": 1}}',
    "null_value": '{{"{key}": null}}',
    "string_not_list": '{{"{key}": "A"}}',
}
BAD_MERGE_ENTRIES = {
    "string_entry": "A",
    "missing_fields": {"original_themes": ["A", "B"]},
    "three_themes": {**GOOD_MERGE, "original_themes": ["A", "B", "C"]},
    "themes_is_string": {**GOOD_MERGE, "original_themes": "AB"},
}


def bad_reply(name, key):
    template = BAD_REPLIES[name]
    return None if template is None else template.format(key=key)


# A fake model: no OpenAI client, no network. reply_for(prompt) returns the LLM text, or None to fail the call.
def fake_model(reply_for):
    async def fn(model, prompt):
        reply = reply_for(prompt)
        if reply is None:
            raise ValueError("boom")
        return reply, (1, 1)

    return Model("fake", setup_fn=lambda api_key: None, fn=fn)


def replying(reply):
    return fake_model(lambda prompt: reply)


def make_concepts():
    return {
        "a": Concept(name="A", prompt="pa", example_ids=["1"], active=False),
        "b": Concept(name="B", prompt="pb", example_ids=["2"], active=False),
    }


def make_df():
    return pd.DataFrame({"concept": ["A: pa", "B: pb"], "concept_name": ["A", "B"], "concept_prompt": ["pa", "pb"]})


def names(concepts):
    return [c.name for c in concepts.values()]


def run_remove(reply):
    return asyncio.run(review_remove(make_concepts(), make_df(), "concept", replying(reply), None, None))


def run_merge(reply):
    return asyncio.run(review_merge(make_concepts(), make_df(), "concept", replying(reply), None))


def run_select(reply, max_concepts=1):
    return asyncio.run(review_select(make_concepts(), max_concepts, replying(reply), None))


def assert_unchanged(concepts, df, returned):
    assert names(concepts) == ["A", "B"]
    pd.testing.assert_frame_equal(df, make_df())
    assert returned == []


# Bad replies ----------------------------------------------------------------
@pytest.mark.parametrize("name", BAD_REPLIES)
def test_remove_skips_on_bad_reply(name, capsys):
    assert_unchanged(*run_remove(bad_reply(name, "remove")))
    assert "WARNING" in capsys.readouterr().out


@pytest.mark.parametrize("name", BAD_REPLIES)
def test_merge_skips_on_bad_reply(name, capsys):
    assert_unchanged(*run_merge(bad_reply(name, "merge")))
    assert "WARNING" in capsys.readouterr().out


@pytest.mark.parametrize("name", BAD_REPLIES)
def test_select_returns_nothing_on_bad_reply(name, capsys):
    assert run_select(bad_reply(name, "selected")) == []
    assert "WARNING" in capsys.readouterr().out


# Partly bad replies ---------------------------------------------------------
@pytest.mark.parametrize("name", BAD_MERGE_ENTRIES)
def test_merge_ignores_malformed_entry(name, capsys):
    assert_unchanged(*run_merge(json.dumps({"merge": [BAD_MERGE_ENTRIES[name]]})))
    assert "WARNING" in capsys.readouterr().out


def test_merge_applies_the_good_entry_next_to_a_bad_one():
    concepts, _, merged = run_merge(json.dumps({"merge": [BAD_MERGE_ENTRIES["missing_fields"], GOOD_MERGE]}))
    assert names(concepts) == ["N"]
    assert merged == [GOOD_MERGE]


def test_remove_ignores_non_string_entries():
    concepts, df, removed = run_remove('{"remove": [{"x": 1}, "A"]}')
    assert names(concepts) == ["B"]
    assert list(df["concept_name"]) == ["B"]
    assert removed == ["A"]


def test_select_ignores_non_string_entries():
    assert run_select('{"selected": [{"x": 1}, "A"]}') == ["a"]


# The whole review step ------------------------------------------------------
def test_review_still_merges_when_remove_reply_is_bad():
    model = fake_model(lambda prompt: "not json" if "REMOVED" in prompt else GOOD_MERGE_REPLY)
    concepts, _, logs = asyncio.run(review(make_concepts(), make_df(), "concept", model, return_logs=True))
    assert names(concepts) == ["N"]
    assert "Removed (0)" in logs and "--> N: P" in logs


def test_review_keeps_concepts_when_every_reply_is_bad():
    model = replying("not json")
    concepts, df, logs = asyncio.run(review(make_concepts(), make_df(), "concept", model, return_logs=True))
    assert_unchanged(concepts, df, [])
    assert "Removed (0)" in logs and "Merged (0)" in logs


# select_auto falls back to a random pick when selection fails ---------------
@pytest.mark.parametrize("max_concepts, n_active", [(5, 2), (1, 1)])
def test_select_auto_fallback_with_bad_reply(monkeypatch, max_concepts, n_active):
    session = make_lloom(monkeypatch, {"OPENAI_API_KEY": "k"})
    session.concepts = make_concepts()
    session.synth_model = replying("not json")
    asyncio.run(session.select_auto(max_concepts=max_concepts))
    assert sum(c.active for c in session.concepts.values()) == n_active


# The whole pipeline: gen() must finish when review gets bad replies ----------
def test_gen_finishes_when_review_replies_are_bad(monkeypatch, capsys):
    session = make_lloom(monkeypatch, {"OPENAI_API_KEY": "k"})
    session.in_df = pd.DataFrame({session.doc_id_col: ["1", "2"], session.doc_col: ["The delivery was late.", "Prices were great."]})
    session.df_to_score = session.in_df

    prompts_seen = []

    def synth_reply(prompt):
        prompts_seen.append(prompt)
        if "REMOVED" in prompt or "MERGED" in prompt:
            return "not json"
        return json.dumps({"patterns": [
            {"name": "A", "prompt": "pa", "example_ids": ["1"]},
            {"name": "B", "prompt": "pb", "example_ids": ["2"]},
        ]})

    session.distill_model = replying('{"relevant_quotes": ["late delivery"], "bullets": ["late delivery"]}')
    session.synth_model = fake_model(synth_reply)

    # Skip the prompt and the embeddings + UMAP/HDBSCAN: everything lands in one cluster
    async def fake_cluster(text_df, **kwargs):
        return text_df.assign(cluster_id=0)

    monkeypatch.setattr(wb, "cluster", fake_cluster)
    monkeypatch.setattr("builtins.input", lambda _: "y")
    session.estimate_gen_cost = lambda params: None  # crashes on models with no cost info (bug S5)

    # Explicit params: the auto-suggested ones need NLTK data that has nothing to do with review
    params = {"filter_n_quotes": 2, "summ_n_bullets": 1, "synth_n_concepts": 2}
    asyncio.run(session.gen(params=params, debug=True))

    assert any("REMOVED" in p for p in prompts_seen) and any("MERGED" in p for p in prompts_seen)  # review really ran
    assert sorted(names(session.concepts)) == ["A", "B"]
    out = capsys.readouterr().out
    assert "WARNING Review-remove" in out and "WARNING Review-merge" in out
    assert "Done with concept generation" in out


# Valid replies keep working -------------------------------------------------
def test_valid_remove():
    concepts, df, removed = run_remove('{"remove": ["A"]}')
    assert names(concepts) == ["B"]
    assert list(df["concept_name"]) == ["B"]
    assert removed == ["A"]


def test_valid_empty_remove_prints_no_warning(capsys):
    assert_unchanged(*run_remove('{"remove": []}'))
    assert "WARNING" not in capsys.readouterr().out


def test_valid_merge():
    concepts, df, merged = run_merge(GOOD_MERGE_REPLY)
    assert names(concepts) == ["N"]
    assert next(iter(concepts.values())).example_ids == ["1", "2"]
    assert list(df["concept_name"]) == ["N", "N"]
    assert merged == [GOOD_MERGE]


def test_valid_select():
    assert run_select('{"selected": ["A"]}') == ["a"]
