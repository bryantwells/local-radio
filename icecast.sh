#!/bin/bash

env

set -x

set_val() {
    if [ -n "$2" ]; then
        echo "set '$2' to '$1'"
        cp /etc/icecast2/icecast.xml /etc/icecast2/icecast.xml.orig
        sed -i "s/<$2>[^<]*<\/$2>/<$2>$1<\/$2>/g" /etc/icecast2/icecast.xml.orig
        cp /etc/icecast2/icecast.xml.orig /etc/icecast2/icecast.xml
    else
        echo "Setting for '$1' is missing, skipping." >&2
    fi
}

set_val $ICECAST_SOURCE_PASSWORD source-password
set_val $ICECAST_RELAY_PASSWORD  relay-password
set_val $ICECAST_ADMIN_PASSWORD  admin-password
set_val $ICECAST_PASSWORD        password
set_val $ICECAST_HOSTNAME        hostname

set -e

/etc/init.d/icecast2 start && tail -F /var/log/icecast2/error.log