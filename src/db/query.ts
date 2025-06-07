// eslint-disable-next-line import/no-unresolved
import { Database } from 'bun:sqlite';
import { Kysely, MysqlDialect, SqliteDialect } from 'kysely';
import type { Dialect, LogEvent } from 'kysely';
import { createPool } from 'mysql2';

import { DB } from '#/db/types.js';
import Environment from '#/util/Environment.js';

let dialect: Dialect;
let sqliteDb: Database | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSqliteDatabase(): any {
    if (!sqliteDb) {
        sqliteDb = new Database('db.sqlite');
    }
    
    const originalPrepare = sqliteDb.prepare.bind(sqliteDb);
    
    return {
        ...sqliteDb,
        prepare(sql: string) {
            const stmt = originalPrepare(sql);
            const isReader = sql.trim().toLowerCase().startsWith('select') || 
                           sql.trim().toLowerCase().startsWith('with') ||
                           sql.trim().toLowerCase().startsWith('pragma');
            
            Object.defineProperty(stmt, 'reader', {
                value: isReader,
                writable: false,
                enumerable: true,
                configurable: false
            });
            
            return stmt;
        }
    };
}

if (Environment.DB_BACKEND === 'sqlite') {
    dialect = new SqliteDialect({
        database: async () => getSqliteDatabase()
    });
} else {
    dialect = new MysqlDialect({
        pool: async () =>
            createPool({
                database: Environment.DB_NAME,
                host: Environment.DB_HOST,
                port: Environment.DB_PORT,
                user: Environment.DB_USER,
                password: Environment.DB_PASS,
                timezone: 'Z'
            })
    });
}

function logVerbose(event: LogEvent) {
    if (event.level === 'query') {
        console.log(event.query.sql);
        console.log(event.query.parameters);
    }
}

export const db = new Kysely<DB>({
    dialect,
    log: Environment.KYSELY_VERBOSE ? logVerbose : []
});

export const loggerDb = new Kysely<DB>({
    dialect:
        Environment.DB_BACKEND === 'sqlite'
            ? new SqliteDialect({
                database: async () => getSqliteDatabase()
            })
            : new MysqlDialect({
                pool: async () =>
                    createPool({
                        database: Environment.DB_LOGGER_NAME || Environment.DB_NAME,
                        host: Environment.DB_LOGGER_HOST || Environment.DB_HOST,
                        port: Environment.DB_LOGGER_PORT || Environment.DB_PORT,
                        user: Environment.DB_LOGGER_USER || Environment.DB_USER,
                        password: Environment.DB_LOGGER_PASS || Environment.DB_PASS,
                        timezone: 'Z'
                    })
            })
});

export function toDbDate(date: Date | string | number) {
    if (typeof date === 'string' || typeof date === 'number') {
        date = new Date(date);
    }

    return date.toISOString().slice(0, 19).replace('T', ' ');
}
