# ADR 0001: Begin with a modular monolith and scalable workers

Status: accepted

The platform begins with a NestJS modular monolith for policy consistency, transactional integrity, and manageable self-hosted operations. Collection, processing, export, and AI execute as queue-driven worker boundaries and can be extracted into services when measured scale, isolation, or ownership demands it.

This avoids distributed transactions and a large certificate/observability burden during early domain discovery. Boundaries remain explicit through domain/application/infrastructure layers, repository ports, versioned API contracts, and tenant-enveloped events. Direct cross-module database access is prohibited. Extraction decisions require load evidence and an operational owner.

