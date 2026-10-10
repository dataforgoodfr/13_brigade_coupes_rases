import logging

import pytest

from pipeline.scripts import run_pipeline


def test_main_logs_success_message(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    monkeypatch.setattr(run_pipeline, "run_pipeline", lambda: None)

    with caplog.at_level(logging.INFO):
        run_pipeline.main()

    assert caplog.messages[-1] == run_pipeline.SUCCESS_MESSAGE


def test_main_failure_does_not_log_success_message(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    def fail() -> None:
        raise RuntimeError("panne")

    monkeypatch.setattr(run_pipeline, "run_pipeline", fail)

    with caplog.at_level(logging.INFO), pytest.raises(RuntimeError):
        run_pipeline.main()

    assert run_pipeline.SUCCESS_MESSAGE not in caplog.messages
