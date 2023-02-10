// worker.js
importScripts('./index-db.js');

self.addEventListener('message', async event => {
    const { method, params } = event.data;

    const dbName = params[0];
    const objectStoreName = params[1];
    const version = params[2];
    const value = params[3];

    const indexedDB = new IndexedDB(dbName, objectStoreName, version);

    await indexedDB.openDB();
    let result;
    switch (method) {
        case 'getAll':
            result = await indexedDB.getAll();
            break;
        case 'get':
            result = await indexedDB.get(value);
            break;
        case 'add':
            result = await indexedDB.add(value);
            break;
        case 'put':
            result = await indexedDB.put(value);
            break;
        case 'delete':
            result = await indexedDB.delete(value);
            break;
        default:
            throw new Error(`Unsupported method: ${method}`);
    }
    self.postMessage({method, result });
    await indexedDB.closeDB();
});
