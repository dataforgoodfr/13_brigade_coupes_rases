from typing import Annotated, Any, Dict, Optional
from typing_extensions import Doc
from fastapi import HTTPException


class AppHTTPException(HTTPException):
    def __init__(
        self,
        status_code: Annotated[
            int,
            Doc(
                """
                HTTP status code to send to the client.
                """
            ),
        ],
        detail: Annotated[
            Any,
            Doc(
                """
                Any data to be sent to the client in the `detail` key of the JSON
                response.
                """
            ),
        ] = None,
        headers: Annotated[
            Optional[Dict[str, str]],
            Doc(
                """
                Any headers to send to the client in the response.
                """
            ),
        ] = None,
        type: str = None,
    ) -> None:
        super().__init__(
            status_code=status_code,
            detail={"content": detail, "type": "UNKNOWN" if type is None else type},
            headers=headers,
        )
