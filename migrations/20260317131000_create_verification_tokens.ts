import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("verification_tokens", (table) => {
        table.string("id", 36).primary();
        table.string("user_id", 36).notNullable().references("id").inTable("users").onDelete("CASCADE");
        table.string("code", 10).notNullable();
        table.string("type", 50).notNullable().defaultTo("email_verification");
        table.dateTime("expires_at").notNullable();
        table.dateTime("used_at").nullable();
        table.timestamp("created_at").defaultTo(knex.fn.now());
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("verification_tokens");
}
