import { describe, expect, it } from 'vitest';
import { assemble, link } from '../src/index';
describe('smoke tests', () => {
    it('assemble accepts input', () => {
        const result = assemble('');
        expect(result).toBeDefined();
        expect(result.ok).toBeDefined();
    });
    it('link accepts input', () => {
        const result = link([]);
        expect(result).toBeDefined();
        expect(result.ok).toBeDefined();
    });
});
//# sourceMappingURL=placeholders.test.js.map