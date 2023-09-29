# Cloud Building Blocks (CDKTF)

This repository contains an experimental implementation of a higher-level IaC abstraction of cloud resources called "cloud building blocks" (CBB).

The goal of this project is to make it possible to architect and reason about infrastructure independent of vendors.

## Design

Developer resources

### Tiers

The same way that Cloud Development Kit (CDK) resources have levels (L1, L2 and L3) so have cloud building blocks tiers:

#### Tier 1: Primitive Building Blocks

Tier 1 are lower level (CDK: L1 and L2) cloud resources like virtual machines, entire networks, load balancers etc. These resources are used provider-independent. A `VirtualMachine` building block has a different implementation using the AWS provider (EC2 instance) than using a Digital Ocean Provider (Droplet)

#### Tier 2: Complex Buildiung Blocks

Based on the

### Library Architecture

CBB builds on the Terraform CDK (CDKTF).

- **BuildingBlockContainer** - A CDKTF `Construct` that contains all CBB resources. It provides access to the provider and a `BuildingBlockManager`.
- **BuildingBlockManager** - Implemented for each provider (currently: AWS and DigitalOcean)
- **BuildingBlock** - Base class for all CBB resources
