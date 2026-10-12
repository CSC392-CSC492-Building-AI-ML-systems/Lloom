from text_lloom.concept import Concept


def test_each_concept_gets_a_unique_id():
    a = Concept("A", "prompt", ["1"], True)
    b = Concept("A", "prompt", ["1"], True)
    assert a.id != b.id


def test_to_dict():
    c = Concept("Name", "Does it match?", ["1", "2"], True, summary="s", seed="seed")
    d = c.to_dict()
    assert d == {
        "id": c.id,
        "name": "Name",
        "prompt": "Does it match?",
        "example_ids": ["1", "2"],
        "active": True,
        "summary": "s",
        "seed": "seed",
    }
