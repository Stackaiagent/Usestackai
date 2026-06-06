import type { CliConfig } from "./config.js";

export interface VerifyResult {
  valid: boolean;
  user: { username: string; name: string | null; tier: string };
}

export interface UsageResult {
  used: number;
  limit: number | null;
  remaining: number | null;
  tier: string;
}

export class ApiClient {
  constructor(private readonly config: CliConfig) {}

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async verify(): Promise<VerifyResult> {
    const res = await fetch(`${this.config.apiUrl}/api/verify`, {
      method: "POST",
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`Auth failed (${res.status})`);
    return (await res.json()) as VerifyResult;
  }

  async usage(): Promise<UsageResult> {
    const res = await fetch(`${this.config.apiUrl}/api/usage`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`Usage request failed (${res.status})`);
    return (await res.json()) as UsageResult;
  }
}
