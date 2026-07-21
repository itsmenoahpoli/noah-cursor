import ora, { type Ora } from "ora";
import chalk from "chalk";

export class ProgressDisplay {
  private spinner: Ora | null = null;

  start(text: string): void {
    this.stop();
    this.spinner = ora({ text, spinner: "dots" }).start();
  }

  succeed(text: string): void {
    if (this.spinner) {
      this.spinner.succeed(text);
      this.spinner = null;
    } else {
      console.log(`${chalk.green("✔")} ${text}`);
    }
  }

  fail(text: string): void {
    if (this.spinner) {
      this.spinner.fail(text);
      this.spinner = null;
    } else {
      console.log(`${chalk.red("✖")} ${text}`);
    }
  }

  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }
}
