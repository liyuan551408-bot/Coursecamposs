/** @file Reports database role and table privileges without exposing credentials. */
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
    .then(async () => {
        const result = await client.query(`
            SELECT
                current_user,
                session_user,
                has_table_privilege(current_user, 'public."User"', 'SELECT') AS can_read_user,
                has_table_privilege(current_user, 'public."Notification"', 'SELECT') AS can_read_notification,
                has_table_privilege(current_user, 'public."Notification"', 'INSERT') AS can_insert_notification,
                has_table_privilege(current_user, 'public."Notification"', 'UPDATE') AS can_update_notification
        `);
        console.table(result.rows);
    })
    .catch((error) => {
        console.error('Database permission check failed:', error);
        process.exitCode = 1;
    })
    .finally(() => client.end());
