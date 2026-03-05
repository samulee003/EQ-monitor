import { describe, it, expect } from 'vitest';
import { emotions, psychologicalNeeds, Quadrant } from './emotionData';

describe('EmotionData', () => {
    describe('emotions', () => {
        it('應該包含 100 種以上的情緒', () => {
            expect(emotions.length).toBeGreaterThanOrEqual(100);
        });

        it('每種情緒都應該有必需的屬性', () => {
            emotions.forEach(emotion => {
                expect(emotion.id).toBeDefined();
                expect(emotion.name).toBeDefined();
                expect(emotion.quadrant).toBeDefined();
                expect(emotion.energy).toBeGreaterThanOrEqual(1);
                expect(emotion.energy).toBeLessThanOrEqual(5);
                expect(emotion.pleasantness).toBeGreaterThanOrEqual(1);
                expect(emotion.pleasantness).toBeLessThanOrEqual(5);
            });
        });

        it('應該包含四個象限的情緒', () => {
            const quadrants = new Set(emotions.map(e => e.quadrant));
            expect(quadrants.has('red')).toBe(true);
            expect(quadrants.has('yellow')).toBe(true);
            expect(quadrants.has('blue')).toBe(true);
            expect(quadrants.has('green')).toBe(true);
        });

        it('每個象限應該有均勻分佈的情緒', () => {
            const redCount = emotions.filter(e => e.quadrant === 'red').length;
            const yellowCount = emotions.filter(e => e.quadrant === 'yellow').length;
            const blueCount = emotions.filter(e => e.quadrant === 'blue').length;
            const greenCount = emotions.filter(e => e.quadrant === 'green').length;

            // 每個象限應該有至少 20 種情緒
            expect(redCount).toBeGreaterThanOrEqual(20);
            expect(yellowCount).toBeGreaterThanOrEqual(20);
            expect(blueCount).toBeGreaterThanOrEqual(20);
            expect(greenCount).toBeGreaterThanOrEqual(20);
        });

        it('ID 應該是唯一的', () => {
            const ids = emotions.map(e => e.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
        });
    });

    describe('psychologicalNeeds', () => {
        it('應該包含 8 種心理需求', () => {
            expect(psychologicalNeeds.length).toBe(8);
        });

        it('每種需求都應該有必需的屬性', () => {
            psychologicalNeeds.forEach(need => {
                expect(need.id).toBeDefined();
                expect(need.label).toBeDefined();
                expect(need.icon).toBeDefined();
                expect(need.desc).toBeDefined();
            });
        });

        it('ID 應該是唯一的', () => {
            const ids = psychologicalNeeds.map(n => n.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
        });
    });
});
