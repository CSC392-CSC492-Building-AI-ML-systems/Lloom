#Document ID Format Mismatches
# Impact: Scores are silently dropped and replaced with 0 when the LLM returns a document ID in an unexpected or alternate format.

import json
from types import SimpleNamespace

import pandas as pd

from text_lloom.concept_induction import get_score_df

CONCEPT = SimpleNamespace(name="c-name", prompt="c-prompt", seed=None)


def test_unresolved_id_prints_warning(capsys):
    df = make_df(["1", "2"], ["first", "second"])
    out = run(make_res(999), df)
    assert len(out) == 0
    assert "999" in capsys.readouterr().out
    
def make_df(ids, texts):
    return pd.DataFrame({"doc_id": ids, "text": texts})

def make_res(example_id):
    return json.dumps({
        "pattern_results": [
            {"example_id": example_id, "answer": "A", "rationale": "because"}
        ]
    })

def run(res, df):
    return get_score_df(res, df, CONCEPT, "cid", "text", "doc_id", False)

def test_numeric_id_is_not_dropped():
    df = pd.DataFrame({"doc_id":["1","2"], "text":["first","second"]})
    result = json.dumps({
        "pattern_results": [
            {"example_id":1, "answer":"A", "rationale": "because"}
        ]
    })
    out = get_score_df(result, df, CONCEPT, "cid", "text", "doc_id", get_highlights=False)

    assert len(out) == 1 ,  "row was dropped (the original bug)"
    assert out.iloc[0]["doc_id"] == "1"
    assert out.iloc[0]["text"] == "first"
    assert out.iloc[0]["score"] == 1.0


def test_string_llm_id_matches_numeric_df_id():
    df = make_df([1, 2], ["first", "second"])
    out = run(make_res("1"), df)
    assert len(out) == 1
    assert out.iloc[0]["doc_id"] == 1
    assert out.iloc[0]["text"] == "first"


def test_mixed_representations_keep_correct_association():
    df = make_df(["1", "2", "3"], ["alpha", "beta", "gamma"])
    res = json.dumps({"pattern_results": [
        {"example_id": 1, "answer": "A", "rationale": "r1"},
        {"example_id": "2", "answer": "C", "rationale": "r2"},
    ]})
    out = run(res, df)
    got = {r["doc_id"]: (r["text"], r["score"], r["rationale"]) for _, r in out.iterrows()}
    assert got == {"1": ("alpha", 1.0, "r1"), "2": ("beta", 0.5, "r2")}

def test_numeric_id_does_not_match_zero_padded_id():
    df = make_df(["01", "2"], ["padded", "second"])
    out = run(make_res(1), df)
    assert len(out) == 0  # must not attach the score to "01"


def test_unknown_id_never_attaches_to_wrong_doc():
    df = make_df(["1", "2"], ["first", "second"])
    res = json.dumps({"pattern_results": [
        {"example_id": 1, "answer": "A"},
        {"example_id": 999, "answer": "A"},
    ]})
    out = run(res, df)
    assert list(out["doc_id"]) == ["1"]


def test_highlight_stays_with_correct_doc():
    df = make_df(["1", "2"], ["first doc", "second doc"])
    res = json.dumps({"pattern_results": [
        {"example_id": 2, "answer": "A", "rationale": "r", "quote": "second"},
        {"example_id": 1, "answer": "B", "rationale": "r", "quote": "first"},
    ]})
    out = get_score_df(res, df, CONCEPT, "cid", "text", "doc_id", get_highlights=True)
    got = {r["doc_id"]: r["highlight"] for _, r in out.iterrows()}
    assert got == {"1": "first", "2": "second"}
