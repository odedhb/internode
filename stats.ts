export class Stats {

    static showStats(): (req: any, res: any) => void {
        return (req: any, res: any) => {
            res.send(Stats.stats());
        }
    }

    static stats(): string {
        return 'stats!';
    }

}