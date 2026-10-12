from pathlib import Path

from pipeline.scripts.utils import log_execution


def test_a_step_runs_again_when_its_output_already_exists(tmp_path: Path) -> None:
    output = tmp_path / "sortie.fgb"
    runs: list[int] = []

    @log_execution
    def step() -> int:
        runs.append(1)
        output.write_text("résultat")
        return len(runs)

    assert step() == 1
    assert output.exists()
    assert step() == 2
