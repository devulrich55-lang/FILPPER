from __future__ import annotations

import asyncio
from typing import Any, Dict, List


async def _scan_async(timeout: float = 8.0) -> List[Dict[str, Any]]:
    try:
        from bleak import BleakScanner
    except ImportError:
        return []

    discovered = await BleakScanner.discover(timeout=timeout)
    results: List[Dict[str, Any]] = []
    for device in discovered:
        name = device.name or "Appareil BLE inconnu"
        results.append(
            {
                "name": name,
                "address": device.address,
                "device_type": "BLE",
                "protocol": "ble",
                "status": "online",
                "rssi": getattr(device, "rssi", None),
            }
        )
    return results


def scan_ble_devices(timeout: float = 8.0) -> List[Dict[str, Any]]:
    """Scan BLE on the machine running the backend (Windows/Linux/macOS)."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures

            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(asyncio.run, _scan_async(timeout))
                return future.result()
        return loop.run_until_complete(_scan_async(timeout))
    except RuntimeError:
        return asyncio.run(_scan_async(timeout))
