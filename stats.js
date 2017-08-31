"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Stats {
    static showStats() {
        return (req, res) => {
            res.send(Stats.stats());
        };
    }
    static stats() {
        return 'stats!';
    }
}
exports.Stats = Stats;
//# sourceMappingURL=stats.js.map