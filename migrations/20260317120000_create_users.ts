import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("users", (table) => {
        table.string("id", 36).primary();
        table.string("first_name", 100).notNullable();
        table.string("last_name", 100).notNullable();
        table.string("email", 255).notNullable().unique();
        table.string("phone", 20).notNullable().unique();
        table.string("bvn", 20).nullable();
        table.boolean("is_blacklisted").notNullable().defaultTo(false);
        table.string("blacklist_reason", 255).nullable();

        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("users");
}