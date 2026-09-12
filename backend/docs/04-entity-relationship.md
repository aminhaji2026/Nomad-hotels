# 4. Entity-relationship overview

## Core hierarchy

```
Platform
  └── HotelGroup (chain)
        └── Property
              ├── Building / Wing
              │     └── Floor
              │           └── PhysicalRoom ──► RoomType
              ├── RoomType
              │     ├── BedConfiguration
              │     ├── RatePlan ──► DailyRate / Restrictions
              │     └── Inventory (per date)
              ├── Policy / Amenity / Media / Translation
              └── StaffMembership ──► Role ──► Permission
```

## Identity & security

`User` 1—1 `CustomerProfile`  
`User` 1—N `StaffMembership` (group/property scoped)  
`User` 1—N `RefreshSession` / `LoginAttempt` / `OtpChallenge`  
`Role` N—N `Permission`  
`AuditLog` references actor + resource

## Onboarding

`PropertyApplication` 1—N `ApplicationDocument`  
`PropertyApplication` 1—N `ApplicationStatusHistory`  
On approval → creates/activates `HotelGroup` + `Property` + owner membership

## Commercial (schema ready; Phase 2+)

`RatePlan`, `DailyRate`, `RateRestriction`, `InventoryDay`, `InventoryHold`  
`Reservation` → `ReservationRoom` → `ReservationGuest` → `NightlyPrice`  
`Payment`, `Refund`, `CommissionRecord`, `Payout`, `Statement`

## Soft rules

- UUID PKs, `createdAt`/`updatedAt` UTC, `deletedAt` soft delete where needed  
- Unique: email, phone, confirmationNumber, (propertyId, roomNumber)  
- Indexes: property+date inventory, geo search, reservation stay dates, audit actor/time

Detailed columns live in `prisma/schema.prisma`.