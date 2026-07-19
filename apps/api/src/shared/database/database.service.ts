import { Injectable, OnModuleDestroy, ServiceUnavailableException } from "@nestjs/common";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private pool?: Pool;

  private get connection(): Pool {
    if (!this.pool) {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) throw new ServiceUnavailableException("DATABASE_URL is required for the control plane.");
      this.pool = new Pool({ connectionString, max: Number(process.env.DATABASE_POOL_MAX ?? 12) });
    }
    return this.pool;
  }

  async tenantQuery<Row extends QueryResultRow>(tenantId: string, text: string, values: unknown[] = []): Promise<Row[]> {
    return this.withTenant(tenantId, (client) => client.query<Row>(text, values).then((result) => result.rows));
  }

  async withTenant<T>(tenantId: string, operation: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.connection.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      const result = await operation(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }
}
