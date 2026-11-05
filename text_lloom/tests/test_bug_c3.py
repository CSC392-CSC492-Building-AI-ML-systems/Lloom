# Regression tests for bug C3: parse_bucketed_score used to keep only the first
# character of the answer, so "Strongly agree" was treated as unparseable and "Agree"
# was read as letter A (1.0 instead of 0.75).
import math

import pandas as pd

from text_lloom.concept import Concept
from text_lloom.concept_induction import get_score_df, parse_bucketed_score



def test_letter_with_formatting():
    # A valid letter is still found despite case, whitespace, punctuation, or a prefix
    assert parse_bucketed_score("b") == 0.75
    assert parse_bucketed_score(" C") == 0.5
    assert parse_bucketed_score("C\n") == 0.5
    assert parse_bucketed_score("(B)") == 0.75
    assert parse_bucketed_score("A.") == 1.0
    assert parse_bucketed_score("[D]") == 0.25
    assert parse_bucketed_score("**B**") == 0.75
    assert parse_bucketed_score("Answer: B") == 0.75
    assert parse_bucketed_score("A: Strongly agree") == 1.0


def test_label_text():
    # label text maps to its score
    assert parse_bucketed_score("Strongly agree") == 1.0
    assert parse_bucketed_score("Agree") == 0.75
    assert parse_bucketed_score("Neither agree nor disagree") == 0.5
    assert parse_bucketed_score("Disagree") == 0.25
    assert parse_bucketed_score("Strongly disagree") == 0.0
    assert parse_bucketed_score("STRONGLY DISAGREE") == 0.0


def test_word_starting_with_a_letter_is_not_that_letter():
    # Words like "Agree" aren't read as the letter they start with (the original C3 bug)
    assert parse_bucketed_score("Agree") == 0.75  # the original C3 symptom
    assert parse_bucketed_score("Answer: Agree") == 0.75
    assert math.isnan(parse_bucketed_score("Excellent"))


def test_letter_wins_over_conflicting_label():
    # If letter and label are different, then letter takes priority
    assert parse_bucketed_score("B: Strongly agree") == 0.75


def test_unparseable_answer():
    # garbage answers return FAILED_SCORE (NaN)
    assert math.isnan(parse_bucketed_score(""))
    assert math.isnan(parse_bucketed_score("   "))
    assert math.isnan(parse_bucketed_score("Yes"))
    assert math.isnan(parse_bucketed_score("N/A"))
    assert math.isnan(parse_bucketed_score(None))
    assert math.isnan(parse_bucketed_score(3))


def test_get_score_df_uses_parsed_scores():
    # Function path test verification
    in_df = pd.DataFrame({"doc_id": ["1", "2", "3"], "text": ["t1", "t2", "t3"]})
    concept = Concept("Name", "Does it match?", [], True)
    res = {"pattern_results": [
        {"example_id": "1", "rationale": "r", "answer": "Strongly agree"},
        {"example_id": "2", "rationale": "r", "answer": "Agree"},
        {"example_id": "3", "rationale": "r", "answer": "(D)"},
    ]}
    out = get_score_df(res, in_df, concept, concept.id, "text", "doc_id", get_highlights=False)
    assert out["score"].tolist() == [1.0, 0.75, 0.25]
