export class VMCounter {
  private counters: Record<string, { count: number; timestamps: string[] }> = {};
  private startTime: Date;

  constructor() {
    this.startTime = new Date();
  }

  increment(action: string): void {
    const timestamp = new Date().toISOString();
    
    if (!this.counters[action]) {
      this.counters[action] = {
        count: 0,
        timestamps: []
      };
    }
    
    this.counters[action].count += 1;
    this.counters[action].timestamps.push(timestamp);
  }

  getTotalSteps(): number {
    return Object.values(this.counters).reduce((sum, action) => sum + action.count, 0);
  }

  getElapsedTime(): string {
    const elapsed = Date.now() - this.startTime.getTime();
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  getSummary() {
    return {
      total_steps: this.getTotalSteps(),
      elapsed_time: this.getElapsedTime(),
      actions: this.counters
    };
  }
}