# Cloud Building Blocks (PoC)

This repository contains an experimental implementation of a higher-level IaC abstraction of cloud resources. These "cloud building blocks" (CBB) are primitive resources (like virtual machines, network, external IPs) with a common interface, that does not leak implementation details of specific vendors.

The goal of this project is to see whether / to what extend it is possible to architect and reason about cloud infrastructure independent of vendors. The rational, aside from circumventing lock-in, is to decouple implementation and design (details of vendor decisions all too often leak and detract).

## Design & Development

This is very, very early stage. At this point most mentions here are aspirational and incomplete:

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

## Todo

- Finish up PoC for Digital Ocean manager implementation
- Provide example implementation of higher level (L3 equivalent) constructs that build upon this
- Consider integration into in-house landscape (hooks etc)
