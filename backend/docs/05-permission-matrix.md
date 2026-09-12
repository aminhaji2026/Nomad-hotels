# 5. Permission matrix

Permissions use `resource:action` codes. Roles are seeded; custom overrides allowed per membership.

## Hotel / group roles

| Permission | Owner | Group Admin | GM | Res Mgr | Front Desk | Rev Mgr | Accountant | HK Mgr | HK Staff | Maint | Content | Analyst |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| property:read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| property:write | ✓ | ✓ | ✓ | | | | | | | | ✓ | |
| staff:manage | ✓ | ✓ | ✓ | | | | | | | | | |
| room:manage | ✓ | ✓ | ✓ | ✓ | | | | | | | | |
| rate:manage | ✓ | ✓ | ✓ | | | ✓ | | | | | | |
| inventory:manage | ✓ | ✓ | ✓ | ✓ | | ✓ | | | | | | |
| reservation:read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | | | | ✓ |
| reservation:write | ✓ | ✓ | ✓ | ✓ | ✓ | | | | | | | |
| frontdesk:operate | ✓ | ✓ | ✓ | | ✓ | | | | | | | |
| housekeeping:operate | ✓ | ✓ | ✓ | | | | | ✓ | ✓ | | | |
| maintenance:operate | ✓ | ✓ | ✓ | | | | | | | ✓ | | |
| finance:read | ✓ | ✓ | ✓ | | | | ✓ | | | | | ✓ |
| finance:write | ✓ | ✓ | | | | | ✓ | | | | | |
| content:manage | ✓ | ✓ | ✓ | | | | | | | | ✓ | |
| analytics:read | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ | | | | | ✓ |
| onboarding:write | ✓ | ✓ | | | | | | | | | | |

Group Admin may act across all properties in the group. Other roles are property-scoped unless granted at group level.

## Platform roles

| Permission | Super | Ops | Finance | Support | Onboarding | Content Mod | Marketing | Data Analyst | Auditor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| platform:settings | ✓ | | | | | | | | |
| hotel:approve | ✓ | ✓ | | | ✓ | | | | |
| hotel:suspend | ✓ | ✓ | | | | | | | |
| user:impersonate | ✓ | | | ✓* | | | | | |
| booking:override | ✓ | ✓ | | ✓ | | | | | |
| finance:platform | ✓ | | ✓ | | | | | | |
| content:moderate | ✓ | | | | | ✓ | | | |
| promo:manage | ✓ | | | | | | ✓ | | |
| support:manage | ✓ | ✓ | | ✓ | | | | | |
| audit:read | ✓ | ✓ | ✓ | ✓ | | | | ✓ | ✓ |
| analytics:platform | ✓ | ✓ | ✓ | | | | ✓ | ✓ | ✓ |

\*Impersonation always requires a reason and writes an audit row; Support may be limited by policy flag.

Enforcement: `PermissionsGuard` checks JWT memberships + platform role grants. Cross-property access without group/platform grant → `403`.