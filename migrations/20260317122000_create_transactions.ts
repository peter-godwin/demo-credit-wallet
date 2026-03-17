import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("transactions", (table) => {
        table.string("id", 36).primary();
        table.string("wallet_id", 36).notNullable().references("id").inTable("wallets").onDelete("CASCADE");
        table.string("reference", 100).notNullable().unique();
        table.enum("type", ["credit", "debit"]).notNullable();
        table.enum("category", ["fund", "transfer_in", "transfer_out", "withdrawal"]).notNullable();
        table.decimal("amount", 15, 2).notNullable();
        table.decimal("balance_before", 15, 2).notNullable();
        table.decimal("balance_after", 15, 2).notNullable();
        table.string("description", 255).nullable();
        table.string("counterpart_wallet_id", 36).nullable();
        table.enum("status", ["pending", "success", "failed"]).notNullable().defaultTo("success");
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("transactions");
}