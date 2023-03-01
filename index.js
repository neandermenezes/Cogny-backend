const { DATABASE_SCHEMA, DATABASE_URL, SHOW_PG_MONITOR } = require('./config');
const massive = require('massive');
const monitor = require('pg-monitor');
const { getUsaData, calculateUsaPopulation } = require('./api');

// Call start
(async () => {
    console.log('main.js: before start');

    const db = await massive({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    }, {
        // Massive Configuration
        scripts: process.cwd() + '/migration',
        allowedSchemas: [DATABASE_SCHEMA],
        whitelist: [`${DATABASE_SCHEMA}.%`],
        excludeFunctions: true,
    }, {
        // Driver Configuration
        noWarnings: true,
        error: function (err, client) {
            console.log(err);
            //process.emit('uncaughtException', err);
            //throw err;
        }
    });

    if (!monitor.isAttached() && SHOW_PG_MONITOR === 'true') {
        monitor.attach(db.driverConfig);
    }

    const execFileSql = async (schema, type) => {
        return new Promise(async resolve => {
            const objects = db['user'][type];

            if (objects) {
                for (const [key, func] of Object.entries(objects)) {
                    console.log(`executing ${schema} ${type} ${key}...`);
                    await func({
                        schema: DATABASE_SCHEMA,
                    });
                }
            }

            resolve();
        });
    };

    //public
    const migrationUp = async () => {
        return new Promise(async resolve => {
            await execFileSql(DATABASE_SCHEMA, 'schema');

            //cria as estruturas necessarias no db (schema)
            await execFileSql(DATABASE_SCHEMA, 'table');
            await execFileSql(DATABASE_SCHEMA, 'view');

            console.log(`reload schemas ...`)
            await db.reload();

            resolve();
        });
    };

    try {
        await migrationUp();

        const data = await getUsaData()

        const filteredDataInMemory = await calculateUsaPopulation(['2018', '2019', '2020'], data)
        
        await db[DATABASE_SCHEMA].api_data.insert({
            doc_record: { data }
        })

        const filteredDataWithQuery = await db.query(
            `SELECT SUM((data->>'Population')::int)
            FROM (
              SELECT jsonb_array_elements(doc_record->'data') AS data
              FROM ${DATABASE_SCHEMA}.api_data
            ) AS t
            WHERE (data->>'Year')::int BETWEEN 2018 AND 2020;`
        )

        console.log('POPULATION LOG IN MEMORY', filteredDataInMemory)
        console.log('POPULATION LOG WITH SELECT', filteredDataWithQuery[0])


    } catch (e) {
        console.log(e.message)
    } finally {
        console.log('finally');
    }
    console.log('main.js: after start');

    
})();