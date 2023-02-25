namespace Module {
  export class Result {
    constructor(readonly sets: number[][]) {}

    get valid() {
      return this.sets.length >= 2;
    }

    public reverse() {
      return new Result(this.sets.map((s) => [s[1], s[0]]));
    }

    get setsWonLost() {
      const setsWon = this.sets.reduce((sets, s) => {
        if (s[0] > s[1]) sets++;
        return sets;
      }, 0);
      const setsLost = this.sets.reduce((sets, s) => {
        if (s[0] < s[1]) sets++;
        return sets;
      }, 0);
      return [setsWon, setsLost];
    }

    get setpoints() {
      const setpointsWon = this.sets.reduce((sets, s) => {
        sets += s[0];
        return sets;
      }, 0);
      const setpointsLost = this.sets.reduce((sets, s) => {
        sets += s[1];
        return sets;
      }, 0);
      return [setpointsWon, setpointsLost];
    }

    get win() {
      return this.sets.filter((s) => s[0] > s[1]).length == 2;
    }

    asString() {
      return this.sets.map((s) => `${s[0]}:${s[1]}`).join(" ");
    }

    public static fromString(result) {
      const setsAsStrings = result.split(/[ ,]+/);
      const sets = setsAsStrings
        .map((s) => s.split(":"))
        .map((s) => [parseInt(s[0]), parseInt(s[1])]);
      return new Result(sets);
    }
  }
}
