import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("users", (table) => {
        table.string("password_hash", 255).nullable();
        table.boolean("is_email_verified").notNullable().defaultTo(false);
        table.string("transaction_pin_hash", 255).nullable();
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable("users", (table) => {
        table.dropColumn("password_hash");
        table.dropColumn("is_email_verified");
        table.dropColumn("transaction_pin_hash");
    });
}
