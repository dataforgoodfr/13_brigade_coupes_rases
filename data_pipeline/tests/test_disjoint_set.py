from pipeline.scripts.utils import DisjointSet


def test_elements_start_in_their_own_subset() -> None:
    disjoint_set = DisjointSet([1, 2, 3])

    assert disjoint_set.n_subsets == 3
    assert not disjoint_set.connected(1, 2)
    assert disjoint_set.subsets() == [{1}, {2}, {3}]


def test_merge_is_transitive() -> None:
    disjoint_set = DisjointSet(["a", "b", "c", "d"])

    assert disjoint_set.merge("a", "b")
    assert disjoint_set.merge("b", "d")
    assert not disjoint_set.merge("a", "d")  # already connected

    assert disjoint_set.connected("a", "d")
    assert not disjoint_set.connected("a", "c")
    assert disjoint_set.subset("d") == {"a", "b", "d"}
    assert disjoint_set.subset_size("c") == 1
    assert disjoint_set.n_subsets == 2


def test_add_is_idempotent() -> None:
    disjoint_set = DisjointSet()
    disjoint_set.add(1)
    disjoint_set.add(1)

    assert disjoint_set.n_subsets == 1
    assert 1 in disjoint_set
    assert 2 not in disjoint_set
