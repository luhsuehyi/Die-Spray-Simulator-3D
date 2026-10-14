# Guided operator preview

Start with an example part on the planning screen. Generate a plan, inspect the reported coverage and sampled clearance, then open the simulation. The operator guide provides English / Traditional Chinese phase explanations, collision details, pause, restart and mold change controls.

Changing molds stops playback and invalidates the previous plan. Generate again to rebuild the envelope and spray path. Custom CAD selection currently reads the filename only: enter known envelope dimensions and mass before selecting the file. It does not parse a real die cavity.

The full animated clock follows close → inject/hold → open → extract → spray/dry → reset. Extraction and spraying do not overlap; both occur with the mold fully open. The transport scrubber uses the full cycle duration. Spray path duration is reported separately.

Results now use calculated coverage and sampled clearance without favorable minimum clamps. A collision result is displayed as a failure. Guided playback is disabled when the current audit detects collisions. Advanced editing remains available to investigate and correct the model.

## Verification

- `npm run lint`
- `npm run build`
- `npm run test:cycle`
- `node --import tsx src/utils/kinematics/kinematics.test.ts`
- `node --import tsx src/utils/kinematics/gp50Cad.test.ts`

## Remaining requirements for the first production goal

This is a training and planning prototype. It does not establish that an untrained person can operate real die casting equipment. Real CAD parsing, calibrated machine / robot / tool geometry, continuous collision and reachability checks, validated extraction trajectories, thermal / fluid process data, PLC interlock verification, mold-specific commissioning, and operator training still need to be completed. Micro / undiluted release-agent application needs measured process data and cannot be validated by these preview calculations alone.

The automatic planner is local preset/rule logic, despite existing AI labels. No external AI connection is needed for this workflow.
