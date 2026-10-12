# Pins the current behavior of the small pure helpers in concept_induction.py.
import pandas as pd

from text_lloom.concept_induction import (
    NAN_SCORE,
    clean_item_id,
    clean_score,
    edit_concept,
    format_bullets,
    format_highlight,
    format_scores,
    get_covered_by_generic,
    get_not_covered,
    json_load,
    parse_bucketed_score,
    parse_tf_answer,
    refine,
    remove_emojis,
)

HIGHLIGHT = "<span style='background-color: rgba(130, 193, 251, 0.5)'>"


# Parsing LLM output ---------------------------------------------------------
def test_json_load():
    assert json_load('Sure! ```{"a": 1}``` Hope that helps') == {"a": 1}
    assert json_load('{"concepts": {"a": 1}}', top_level_key="concepts") == {"a": 1}
    assert json_load({"a": 1}) == {"a": 1}
    assert json_load(None) is None
    assert json_load("no json here") is None


def test_parse_bucketed_score():
    assert parse_bucketed_score("A") == 1.0
    assert parse_bucketed_score("C") == 0.5
    assert parse_bucketed_score("E") == 0.0
    assert parse_bucketed_score("B because it fits") == 0.75  # only first letter is used
    assert parse_bucketed_score("Z") == NAN_SCORE


def test_parse_tf_answer():
    assert parse_tf_answer("True") is True
    assert parse_tf_answer("false") is False
    assert parse_tf_answer("maybe") is False


def test_clean_item_id():
    assert clean_item_id("item_id 12 ") == "12"


# Scoring --------------------------------------------------------------------
def test_clean_score():
    assert clean_score(float("nan"), 1.0) == 0.0
    assert clean_score(True, 1.0) == 1.0
    assert clean_score("False", 1.0) == 0.0
    assert clean_score(0.5, 1.0) == 0.0  # below threshold
    assert clean_score(1.0, 1.0) == 1.0
    assert clean_score(0.5, None) == 0.5  # no threshold: unchanged


def make_score_df(rows):
    return pd.DataFrame(rows, columns=["doc_id", "concept_id", "score"])


def test_get_not_covered():
    df = make_score_df([
        ("d1", "c1", 1.0), ("d1", "c2", 0.0),
        ("d2", "c1", 0.0), ("d2", "c2", 0.0),
    ])
    assert get_not_covered(df, "doc_id") == ["d2"]


def test_get_covered_by_generic():
    # g matches every doc (generic); s only matches d1
    df = make_score_df([
        ("d1", "g", 1.0), ("d1", "s", 1.0),
        ("d2", "g", 1.0), ("d2", "s", 0.0),
        ("d3", "g", 1.0), ("d3", "s", 0.0),
    ])
    assert get_covered_by_generic(df, "doc_id") == ["d2", "d3"]


def test_refine_drops_generic_and_rare_concepts():
    # 20 docs: "generic" matches all, "rare" matches none, "keep" matches 5
    rows = []
    for i in range(20):
        rows += [(f"d{i}", "generic", 1.0), (f"d{i}", "rare", 0.0), (f"d{i}", "keep", 1.0 if i < 5 else 0.0)]
    concepts = {c: {"name": c} for c in ["generic", "rare", "keep"]}
    assert list(refine(make_score_df(rows), concepts, debug=False)) == ["keep"]


# Formatting for the visualization -------------------------------------------
def test_format_bullets():
    assert format_bullets(["a", "b"]) == "<ul><li>a</li><li>b</li></ul>"
    assert format_bullets(["a"], add_quotes=True) == '<ul><li>"a"</li></ul>'
    assert format_bullets([]) == ""


def test_format_scores():
    assert format_scores(1.0) == (
        "<div class='score-col' style='background-color: rgba(130, 193, 251, 0.5)'>1.0</div>"
    )


def test_remove_emojis():
    assert remove_emojis("hi \U0001F600") == "hi "


def test_format_highlight():
    assert format_highlight("I like cats", "cats", 1.0) == f"I like {HIGHLIGHT}cats</span>"
    assert format_highlight("I like cats", None, 1.0) == "I like cats"  # non-string quotes: unchanged


# Concept editing ------------------------------------------------------------
def test_edit_concept_only_changes_given_fields():
    concepts = {"c1": {"name": "old", "prompt": "p", "example_ids": ["1"]}}
    out = edit_concept(concepts, "c1", new_name="new")
    assert out["c1"] == {"name": "new", "prompt": "p", "example_ids": ["1"]}
