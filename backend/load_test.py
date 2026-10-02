"""Load test: simulated volunteers load the map and open a report sheet.

Each virtual user logs in, then, every PERIOD seconds, loads the map over
metropolitan France and opens one of the reports it returned (report + latest
form), as the application does. At the end, the script prints the response
times per request and fails if an error occurred or if the median map time
exceeds the threshold.

    poetry run python load_test.py --url https://api.example.org \\
        --email benevole@example.org --password '...' --users 20 --duration 600
"""

import argparse
import asyncio
import random
import statistics
import sys
import time
from collections import defaultdict
from collections.abc import Mapping
from dataclasses import dataclass, field

import httpx

FRANCE = {"swLat": 41.3, "swLng": -5.2, "neLat": 51.1, "neLng": 9.6}


@dataclass
class Results:
    durations: dict[str, list[float]] = field(default_factory=lambda: defaultdict(list))
    errors: list[str] = field(default_factory=list)

    def record(self, name: str, started: float, response: httpx.Response) -> None:
        self.durations[name].append(time.perf_counter() - started)
        # a redirect means a wrong path: the request measured nothing useful
        if response.status_code >= 300:
            self.errors.append(f"{name}: HTTP {response.status_code}")


async def timed_get(
    client: httpx.AsyncClient,
    results: Results,
    name: str,
    url: str,
    params: Mapping[str, float] | None = None,
) -> httpx.Response | None:
    started = time.perf_counter()
    try:
        response = await client.get(url, params=params)
    except httpx.HTTPError as error:
        results.errors.append(f"{name}: {type(error).__name__}")
        return None
    results.record(name, started, response)
    return response


async def virtual_user(
    args: argparse.Namespace, results: Results, deadline: float
) -> None:
    async with httpx.AsyncClient(base_url=args.url, timeout=args.timeout) as client:
        if args.email:
            login = await client.post(
                "/api/v1/token/",
                data={"username": args.email, "password": args.password},
            )
            login.raise_for_status()
            token = login.json()["accessToken"]
            client.headers["Authorization"] = f"Bearer {token}"

        # Spread the users over the first period instead of a single burst
        await asyncio.sleep(random.uniform(0, args.period))
        while time.perf_counter() < deadline:
            started = time.perf_counter()
            response = await timed_get(
                client, results, "carte", "/api/v1/clear-cuts-map/", FRANCE
            )
            previews = response.json().get("previews", []) if response else []
            if previews:
                report_id = random.choice(previews)["id"]
                await timed_get(
                    client,
                    results,
                    "fiche",
                    f"/api/v1/clear-cuts-reports/{report_id}",
                )
                await timed_get(
                    client,
                    results,
                    "formulaire",
                    f"/api/v1/clear-cuts-reports/{report_id}/forms",
                    {"page": 0, "size": 1},
                )
            elapsed = time.perf_counter() - started
            await asyncio.sleep(max(0.0, args.period - elapsed))


def report(results: Results, max_median_map: float) -> bool:
    print(f"{'requête':<12}{'nombre':>8}{'médiane':>10}{'p95':>10}{'max':>10}")
    for name, durations in results.durations.items():
        ordered = sorted(durations)
        p95 = ordered[int(0.95 * (len(ordered) - 1))]
        print(
            f"{name:<12}{len(ordered):>8}{statistics.median(ordered):>9.2f}s"
            f"{p95:>9.2f}s{ordered[-1]:>9.2f}s"
        )
    print(f"erreurs : {len(results.errors)}")
    for error, count in sorted(
        {e: results.errors.count(e) for e in results.errors}.items()
    ):
        print(f"  {error} × {count}")

    map_durations = results.durations.get("carte", [])
    ok = bool(map_durations) and not results.errors
    if map_durations and statistics.median(map_durations) > max_median_map:
        print(f"ÉCHEC : médiane de la carte au-dessus de {max_median_map} s")
        ok = False
    return ok


async def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--url", required=True, help="URL de l'API, sans /api/v1")
    parser.add_argument("--email", help="compte utilisé par tous les utilisateurs")
    parser.add_argument("--password", default="")
    parser.add_argument("--users", type=int, default=20)
    parser.add_argument("--duration", type=float, default=600, help="en secondes")
    parser.add_argument("--period", type=float, default=5, help="entre deux cycles")
    parser.add_argument("--timeout", type=float, default=30)
    parser.add_argument("--max-median-map", type=float, default=2.0)
    args = parser.parse_args()

    results = Results()
    deadline = time.perf_counter() + args.duration
    print(f"{args.users} utilisateurs, {args.duration:.0f} s, cycle de {args.period} s")
    await asyncio.gather(
        *(virtual_user(args, results, deadline) for _ in range(args.users))
    )
    return 0 if report(results, args.max_median_map) else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
