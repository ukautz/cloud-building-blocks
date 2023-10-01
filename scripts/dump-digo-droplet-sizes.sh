#!/bin/bash

set -x

PRINT_INSTANCE_TYPES=${PRINT_INSTANCE_TYPES:-curl -X GET \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer \$DIGITALOCEAN_TOKEN" \
  "https://api.digitalocean.com/v2/sizes?per_page=200"}

read -r -d '' JQ_SCRIPT <<'EOF'
.sizes |
map(
  select(
    .description == "Premium Intel"
  )
) | .[] | .slug + ": "+ (.memory | tostring) + " ("+ .description+ " @ "+ (.price_monthly | tostring) + "/mo)"
EOF

eval "$PRINT_INSTANCE_TYPES" | jq -r "$JQ_SCRIPT"


# |
# map( {
#   "name": .slug,
#   "cpus": .vcpus,
#   "memory": .memory,
#   "gpus": 0,
#   "prod": true
# } )