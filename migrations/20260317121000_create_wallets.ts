import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("wallets", (table) => {
        table.string("id", 36).primary();
        table.string("user_id", 36).notNullable().references("id").inTable("users").onDelete("CASCADE");
        table.string("account_number", 20).notNullable().unique();
        table.decimal("balance", 15, 2).notNullable().defaultTo(0.00);
        table.boolean("is_active").notNullable().defaultTo(true);
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("wallets");
}