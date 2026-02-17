export interface LevelNode {
    id: string;
    depth: number;
    side: 'left' | 'right';
    seed: number;
}

export const getLevelId = (depth: number, side: 'left' | 'right'): string => {
    return `depth_${depth}_${side}`;
};

export const parseLevelId = (id: string): { depth: number, side: 'left' | 'right' } | null => {
    const parts = id.split('_');
    if (parts.length !== 3) return null;
    const depth = parseInt(parts[1], 10);
    const side = parts[2] as 'left' | 'right';
    if (isNaN(depth) || (side !== 'left' && side !== 'right')) return null;
    return { depth, side };
};

export const getSeed = (depth: number, side: 'left' | 'right'): number => {
    // Deterministic seed generation based on depth and side
    // Using a prime multiplier to spread seeds out
    const base = depth * 1000;
    return base + (side === 'left' ? 1 : 2);
};

export const getMaxCompletedDepth = (completedLevels: string[]): number => {
    let maxDepth = -1;
    for (const id of completedLevels) {
        const parsed = parseLevelId(id);
        if (parsed && parsed.depth > maxDepth) {
            maxDepth = parsed.depth;
        }
    }
    return maxDepth;
};
