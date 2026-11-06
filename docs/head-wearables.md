# Head wearables — mining equipment

The existing WearablePhysics attachment is retained: five surface bindings define a moving head frame, with a short ballistic offset on ordinary jumps. Going to bed returns the worn item to its table; portal travel preserves it.

The table is now at x=-.29, z=.16. Its five collision boxes remain one slab and four legs. Materials are steel, dark timber and copper. Slots hold czako, helmet and welding shield, with scales .016, .017 and .016. All visual assets are authored in `src/worlds/main/mining/accessories.ts`; table placement and lifecycle remain in the existing wearable graphics/facility modules.

`selectEquipment()` supports the explicit equipment panel while keeping the same roots, head placement and return-to-table logic. Selection is rejected during a grab. The helmet light is disabled on the table and when the lamp switch is off. Feather bundles use bounded secondary motion and do not apply forces to the soft body.

The shadow envelope covers the relocated table and the full plume, including a small floor tolerance. Detailed workshop and reference decisions are in [Mining workshop](mining-workshop.md).
