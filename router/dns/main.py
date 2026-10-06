import os
import socket
import sys
import time

from cloudflare import Cloudflare
from cloudflare.types.dns.record_list_params import Name

client = Cloudflare(api_token=os.environ["CLOUDFLARE_API_TOKEN"])
account_id = os.environ["CLOUDFLARE_ACCOUNT_ID"]

RADIO_FRONTEND_HOST = os.environ["RADIO_FRONTEND_HOST"]
RADIO_MIDDLEWARE_HOST = os.environ["RADIO_MIDDLEWARE_HOST"]
RADIO_SERVER_HOST = os.environ["RADIO_SERVER_HOST"]
UPDATE_INTERVAL_SECONDS = int(os.environ.get("DNS_UPDATE_INTERVAL", "300"))


def get_ip_address() -> str:
    if configured_ip := os.environ.get("IP_ADDRESS"):
        return configured_ip
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as connection:
        connection.connect(("1.1.1.1", 80))
        return connection.getsockname()[0]


def find_zone_id(zone_name: str) -> str:
    zones = client.zones.list(account={"id": account_id}, name=zone_name)
    zone = next(iter(zones), None)
    if zone is None:
        raise RuntimeError(f"Could not find a Cloudflare zone for {zone_name}")
    return zone.id


def upsert_a_record(zone_id: str, host: str, ip_address: str) -> None:
    records = client.dns.records.list(zone_id=zone_id, type="A", name=Name(exact=host))
    record = next(iter(records), None)

    if record is None:
        print(f"Creating A record for {host} -> {ip_address}")
        client.dns.records.create(
            zone_id=zone_id,
            type="A",
            name=host,
            content=ip_address,
            ttl=1,
            proxied=False,
        )
    elif record.content != ip_address:
        print(f"Updating A record for {host}: {record.content} -> {ip_address}")
        client.dns.records.update(
            dns_record_id=record.id,
            zone_id=zone_id,
            type="A",
            name=host,
            content=ip_address,
            ttl=record.ttl,
            proxied=record.proxied if record.proxied is not None else False,
        )
    else:
        print(f"A record for {host} is already up to date ({ip_address})")


def update_all_records() -> None:
    ip_address = get_ip_address()
    zone_id = find_zone_id(RADIO_FRONTEND_HOST)
    for host in (RADIO_FRONTEND_HOST, RADIO_MIDDLEWARE_HOST, RADIO_SERVER_HOST):
        upsert_a_record(zone_id, host, ip_address)


def main() -> None:
    print("Starting DNS updater", flush=True)
    while True:
        try:
            update_all_records()
        except Exception as error:
            print(f"Failed to update DNS records: {error}", file=sys.stderr)
        time.sleep(UPDATE_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
