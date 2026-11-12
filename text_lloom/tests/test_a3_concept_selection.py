# A3: select and edit concepts without the Jupyter widget.
import asyncio

import pandas as pd
import pytest

import text_lloom.workbench as wb
from text_lloom.concept import Concept


@pytest.fixture
def sess(monkeypatch):
    monkeypatch.delenv("LLM_BASE_URL", raising=False)
    monkeypatch.setenv("OPENAI_API_KEY", "k")
    df = pd.DataFrame({"id": ["1", "2"], "text": ["Late delivery.", "Great food."]})
    s = wb.lloom(df=df, text_col="text", id_col="id")
    s.df_filtered = df  # normally set by gen(); select() reads it for example texts
    for name in ("a", "b", "c"):
        c = Concept(name, f"Is it {name}?", ["1"], active=True)
        s.concepts[c.id] = c
    return s


def ids(sess):
    return {c.name: c_id for c_id, c in sess.concepts.items()}


def fake_scoring(monkeypatch):
    # Stand-in for score_concepts: records which concepts it was asked to score, no LLM call
    scored = []
    async def score_concepts(concepts, sess, **kwargs):
        scored.extend(concepts)
        for c_id in concepts:
            sess.results[c_id] = pd.DataFrame()
        return pd.DataFrame()
    monkeypatch.setattr(wb, "score_concepts", score_concepts)
    return scored


def test_score_only_scores_the_concepts_set_active(sess, monkeypatch):
    scored = fake_scoring(monkeypatch)
    sess.set_active([ids(sess)["b"]])
    asyncio.run(sess.score(debug=False))
    assert scored == [ids(sess)["b"]]
    assert sess.select_widget is None


def test_set_active_rejects_unknown_ids(sess):
    with pytest.raises(ValueError):
        sess.set_active(["nope"])


def test_score_all_does_not_create_a_widget(sess, monkeypatch):
    fake_scoring(monkeypatch)
    asyncio.run(sess.score(score_all=True, debug=False))
    assert sess.select_widget is None


def test_update_concept_edits_it_and_drops_only_its_scores(sess):
    a, b = ids(sess)["a"], ids(sess)["b"]
    sess.results = {a: "old", b: "keep"}
    sess.update_concept(a, name="new", prompt="New?")
    assert (sess.concepts[a].name, sess.concepts[a].prompt) == ("new", "New?")
    assert sess.results == {b: "keep"}


def test_set_active_updates_an_open_widget(sess, monkeypatch):
    # Notebook path: an open widget's checkboxes override `active`, so set_active must refresh it
    class FakeWidget:
        def __init__(self, data):
            self.data = data
    monkeypatch.setattr(wb, "get_select_widget", FakeWidget)
    sess.select()
    sess.set_active([ids(sess)["a"]])
    assert [c.name for c in sess._lloom__get_active_concepts().values()] == ["a"]
