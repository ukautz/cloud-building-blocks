#!/bin/bash


PRINT_INSTANCE_TYPES=${PRINT_INSTANCE_TYPES:-aws ec2 describe-instance-types}

read -r -d '' JQ_SCRIPT <<'EOF'
.InstanceTypes |
map(
  select(
    ( .SupportedVirtualizationTypes[] | contains("hvm") )
    and ( .InstanceType | test("^(m7g|m6i|t4g|t3|c7g|c6i|r7g|r6i|g5g?)\\.") )
  )
) | map( {
  "name": .InstanceType,
  "arch": .ProcessorInfo.SupportedArchitectures[0],
  "cpus": .VCpuInfo.DefaultVCpus,
  "memory": ( .MemoryInfo.SizeInMiB / 1024 ),
  "gpus": ( if ( .GpuInfo == null) then 0 else .GpuInfo.Gpus[0].Count end ),
  "prod": ( .InstanceType | test("^t\\d") | not )
} ) | sort_by(.name)
EOF

#JQ_SCRIPT='.InstanceTypes[] | .InstanceType'

# echo "HERE: $JQ_SCRIPT"

eval "$PRINT_INSTANCE_TYPES" | jq -r "$JQ_SCRIPT"