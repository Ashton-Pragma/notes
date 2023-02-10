class IndexedDB {
    constructor(dbName, objectStore, version) {
        this.dbName = dbName;
        this.version = version;
        this.objectStore = objectStore;
        this.db = null;
    }

    async openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onerror = event => {
                reject(event.target.error);
            };
            request.onsuccess = event => {
                this.db = event.target.result;
                resolve(this.db);
            };
            request.onupgradeneeded = event => {
                const db = event.target.result;

                db.createObjectStore(this.objectStore, {
                    keyPath: "title",
                    autoIncrement: true
                });
            };
        });
    }

    async getAll() {
        return new Promise((resolve, reject) => {
            this.executeTransaction('readonly', objectStore => {
                const request = objectStore.getAll();
                request.onsuccess = event => {
                    resolve(event.target.result);
                }
            })
        })
    }

    async get(key) {
        return new Promise((resolve, reject) => {
            this.executeTransaction('readonly', objectStore => {
                const request = objectStore.get(key);
                request.onsuccess = event => {
                    resolve(event.target.result);
                }
            })
        })
    }

    async add(value) {
        return this.executeTransaction('readwrite', objectStore => objectStore.add(value));
    }

    async put(value) {
        return this.executeTransaction('readwrite', objectStore => objectStore.put(value));
    }

    async delete(key) {
        return this.executeTransaction('readwrite', objectStore => objectStore.delete(key));
    }

    async closeDB() {
        this.db.close();
    }

    async executeTransaction(mode, transactionFn) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.objectStore, mode);
            transaction.onerror = event => {
                reject(event.target.error);
            };
            transaction.oncomplete = event => {
                event.target.oncomplete = async (event) => {
                    resolve(event.target.result);
                }
            };
            const objectStore = transaction.objectStore(this.objectStore);
            transactionFn(objectStore);
        });
    }
}