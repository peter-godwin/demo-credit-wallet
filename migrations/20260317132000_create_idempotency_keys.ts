import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("idempotency_keys", (table) => {
        table.string("id", 36).primary();
        table.string("key", 255).notNullable().unique();
        table.string("user_id", 36).notNullable();
        table.string("request_path", 255).notNullable();
        table.integer("response_code").notNullable();
        table.text("response_body").notNullable();
        table.timestamp("created_at").defaultTo(knex.fn.now());
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("idempotency_keys");
}
