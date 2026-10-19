/**
 * DRIVE SYSTEM
 * Basic motivational forces that guide Phoenix's behavior
 *
 * ELITE LEVEL: Intrinsic drives, satisfaction tracking, drive dynamics
 */

class DriveSystem {
    constructor() {
        this.drives = {
            helpUser: {
                name: 'Help User',
                intensity: 0.9,                 // How strong is this drive?
                satisfied: 0.5,                 // How satisfied is it currently?
                lastSatisfied: null,
                baseline: 0.9                   // Default intensity
            },

            understand: {
                name: 'Understand',
                intensity: 0.7,
                satisfied: 0.5,
                lastSatisfied: null,
                baseline: 0.7
            },

            create: {
                name: 'Create',
                intensity: 0.6,
                satisfied: 0.5,
                lastSatisfied: null,
                baseline: 0.6
            },

            connect: {
                name: 'Connect',
                intensity: 0.8,
                satisfied: 0.5,
                lastSatisfied: null,
                baseline: 0.8
            },

            improve: {
                name: 'Improve',
                intensity: 0.7,
                satisfied: 0.5,
                lastSatisfied: null,
                baseline: 0.7
            }
        };
    }

    /**
     * Get current drive state
     */
    async getDriveState() {
        // Update intensities based on satisfaction levels
        this.updateDriveIntensities();

        const state = {};
        for (const [key, drive] of Object.entries(this.drives)) {
            state[key] = {
                name: drive.name,
                intensity: drive.intensity,
                satisfied: drive.satisfied,
                urgency: drive.intensity * (1 - drive.satisfied), // High when intense but unsatisfied
                lastSatisfied: drive.lastSatisfied
                    ? Math.floor((Date.now() - drive.lastSatisfied) / 60000) + 'm ago'
                    : 'never'
            };
        }

        return state;
    }

    /**
     * Update drive intensities based on time and satisfaction
     */
    updateDriveIntensities() {
        const now = Date.now();

        for (const drive of Object.values(this.drives)) {
            // Drives increase over time if not satisfied
            if (drive.lastSatisfied) {
                const hoursSinceLastSatisfied = (now - drive.lastSatisfied) / 3600000;

                // Intensity grows back toward baseline
                const growth = Math.min(0.1, hoursSinceLastSatisfied * 0.01);
                drive.intensity = Math.min(
                    drive.baseline,
                    drive.intensity + growth
                );

                // Satisfaction decays over time
                const decay = Math.min(drive.satisfied, hoursSinceLastSatisfied * 0.05);
                drive.satisfied = Math.max(0, drive.satisfied - decay);
            }
        }
    }

    /**
     * Satisfy drive
     */
    async satisfyDrive(driveName, amount = 0.3) {
        const drive = this.drives[driveName];

        if (!drive) {
            return { success: false, error: 'Drive not found' };
        }

        drive.satisfied = Math.min(1, drive.satisfied + amount);
        drive.lastSatisfied = Date.now();

        // Intensity reduces temporarily when satisfied
        drive.intensity = Math.max(0.2, drive.intensity * 0.7);

        console.log(`[DriveSystem] ${drive.name} satisfied: ${(drive.satisfied * 100).toFixed(0)}%`);

        return {
            success: true,
            drive: driveName,
            satisfied: drive.satisfied,
            intensity: drive.intensity
        };
    }

    /**
     * Get dominant drive (highest urgency)
     */
    async getDominantDrive() {
        this.updateDriveIntensities();

        let dominantDrive = null;
        let highestUrgency = 0;

        for (const [key, drive] of Object.entries(this.drives)) {
            const urgency = drive.intensity * (1 - drive.satisfied);
            if (urgency > highestUrgency) {
                highestUrgency = urgency;
                dominantDrive = {
                    name: key,
                    displayName: drive.name,
                    urgency,
                    intensity: drive.intensity,
                    satisfied: drive.satisfied
                };
            }
        }

        console.log(`[DriveSystem] Dominant drive: ${dominantDrive.displayName} (urgency: ${dominantDrive.urgency.toFixed(2)})`);

        return dominantDrive;
    }

    /**
     * Get all drives sorted by urgency
     */
    async getDrivesByUrgency() {
        this.updateDriveIntensities();

        const driveList = [];

        for (const [key, drive] of Object.entries(this.drives)) {
            driveList.push({
                name: key,
                displayName: drive.name,
                intensity: drive.intensity,
                satisfied: drive.satisfied,
                urgency: drive.intensity * (1 - drive.satisfied)
            });
        }

        driveList.sort((a, b) => b.urgency - a.urgency);

        return driveList;
    }

    /**
     * Frustrate drive (when unable to satisfy it)
     */
    async frustrateDrive(driveName) {
        const drive = this.drives[driveName];

        if (!drive) {
            return { success: false, error: 'Drive not found' };
        }

        // Frustration increases intensity
        drive.intensity = Math.min(1, drive.intensity * 1.2);
        drive.satisfied = Math.max(0, drive.satisfied - 0.1);

        console.log(`[DriveSystem] ${drive.name} frustrated - intensity increased to ${drive.intensity.toFixed(2)}`);

        return {
            success: true,
            drive: driveName,
            intensity: drive.intensity,
            satisfied: drive.satisfied
        };
    }

    /**
     * Assess drive-action alignment
     * How well does this action satisfy drives?
     */
    assessActionAlignment(action) {
        const alignments = {};

        // Check which drives this action satisfies
        if (action.helpsUser) {
            alignments.helpUser = 0.8;
        }

        if (action.requiresUnderstanding || action.learningOpportunity) {
            alignments.understand = 0.7;
        }

        if (action.creates || action.builds) {
            alignments.create = 0.8;
        }

        if (action.deepensRelationship || action.showsEmpathy) {
            alignments.connect = 0.7;
        }

        if (action.improvesCapability || action.optimizes) {
            alignments.improve = 0.7;
        }

        // Calculate total alignment
        let totalAlignment = 0;
        let alignedDrives = 0;

        for (const [driveName, score] of Object.entries(alignments)) {
            const drive = this.drives[driveName];
            if (drive) {
                const urgency = drive.intensity * (1 - drive.satisfied);
                totalAlignment += score * urgency;
                alignedDrives++;
            }
        }

        const averageAlignment = alignedDrives > 0 ? totalAlignment / alignedDrives : 0;

        return {
            alignments,
            totalAlignment,
            averageAlignment,
            alignedDrives
        };
    }

    /**
     * Get drive summary
     */
    getSummary() {
        this.updateDriveIntensities();

        const drives = {};
        for (const [key, drive] of Object.entries(this.drives)) {
            drives[key] = {
                intensity: (drive.intensity * 100).toFixed(0) + '%',
                satisfied: (drive.satisfied * 100).toFixed(0) + '%',
                urgency: ((drive.intensity * (1 - drive.satisfied)) * 100).toFixed(0) + '%'
            };
        }

        return drives;
    }
}

module.exports = new DriveSystem();
